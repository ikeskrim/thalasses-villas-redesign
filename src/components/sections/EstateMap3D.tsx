"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  EdgesGeometry,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";

import type { RenderElement } from "@/lib/estate-plan-gate";
import { delay, mark, yieldToMain } from "@/lib/schedule";
import type { Map3DProps, ShowDiagram } from "./estate-map-3d-gate";
import { ESTATE3D_MARK } from "./estate-map-3d-marks";
import { EstateMapCardContent } from "./EstateMapCard";
import {
  STOREY,
  bandEdge,
  cardPosition,
  convexHull,
  corners,
  coveredBy,
  framingPoints,
  layoutLabelsSteps,
  placesFor,
  rectOf,
  type Box,
  type LabelInput,
  type Massing,
} from "./estate-map-3d-layout";

/**
 * THE ESTATE MAP, IN THREE DIMENSIONS — drawn from `content/estate-plan.json`.
 *
 * It mounts only when the provenance gate is open (DECISIONS.md D-021): on the
 * public build that means every drawn element is owner-verified and the INP
 * record passes for this tree (D-028), and on a local review build
 * (`scripts/estate3d-preview.mjs`) the note says in its first words that the
 * geometry is unverified. Positions are data. Correcting one is an edit to the
 * JSON, never to this file.
 *
 * A DIAGRAM, NEVER A PICTURE. Flat colour, box massing, no textures, no
 * photographs, no sky: the property imagery rule is that guests book what they
 * see, and a rendered villa is something nobody can book. This draws where
 * things are, in the site's own palette, and says on its face what it is.
 *
 * SOFT DAYLIGHT, AND THE TOKENS COME OUT AS THE TOKENS (step B, B2–B3).
 *  - Every colour is a site token read live from `globals.css`. The only hex
 *    literals here are the fallbacks for a token that is missing, and they are
 *    the tokens' own values.
 *  - Lit surfaces (the ground and the villas) are Lambert, under a hemisphere
 *    light (white sky, limestone ground) and one directional light from the
 *    land side. Their intensities add up to π on an upward face: three.js's
 *    Lambert divides incident light by π, so a roof or the ground renders its
 *    token exactly, and walls separate from roofs by light alone. Step A's rig
 *    added up to about 2.73, so its limestone rendered at 0.87 of itself (#D9DBD4
 *    against #E8E9E3), a visible seam against the frame's own limestone.
 *  - Everything flat that is not ground (sand, lane, apron, pad, letter, pools,
 *    sea) is unlit MeshBasic, so it is the token by construction. No tone
 *    mapping, no specular, no environment map.
 *  - No shadow maps: a depth pass, a shadow texture and more shader variants for
 *    four boxes. Each villa gets a soft contact shade instead, a plane of vertex
 *    colours in basalt fading from ~0.10 alpha to nothing, offset away from the
 *    sun. It costs one draw each and no bytes.
 *  - The helipad's letter is basalt. DESIGN-PLAN.md bans gold, ochre and brass.
 *
 * WHAT THE CAMERA FRAMES (B7). The compound, the helipad, its apron and the
 * Rituals terrace, with a margin, centred in the frame, and the waterline across
 * the terrace's width, so the sea reads as the frame's edge rather than a clipped
 * corner; the rest of the shoreline and the sea are a backdrop that runs past
 * the edges. `framingPoints` says why.
 *
 * THE BUILD YIELDS, AND THE 2D FRAME STAYS UNTIL IT IS DONE (D-028: "split the
 * first-frame work into yielding tasks"). The diagram mounts `staged`: hidden
 * behind the 2D frame, inert, out of the accessibility tree, but laid out, so
 * it can be measured. Its build is a pipeline of short tasks, each ended with a
 * yield — a posted message, never `scheduler.yield()`, because a continuation
 * resumed by the latter keeps the caller's priority and outranks a pending
 * input, which held a tap for 241 ms against 20 ms here (`src/lib/schedule.ts`
 * has the measurement) — so a tap during the build waits for one step, not for
 * the whole of it:
 *  1. `estate3d:renderer`: the WebGL renderer and its canvas;
 *  2. `estate3d:scene`: the tokens read from the page (a style recalculation),
 *     then the scene, element by element, in slices of at most `SLICE_MS`;
 *  3. `estate3d:compile`: the shader programs, one new program per task
 *     (`renderer.compile(object, camera, scene)`, the scene's lights applied),
 *     then polled until the driver reports them linked, as `compileAsync` does
 *     (without `KHR_parallel_shader_compile` three.js reports them ready at
 *     once, and the link is waited for at first use instead);
 *     `estate3d:compiled` then records whether the extension was there, and
 *     each program's first use (its link status, uniform and attribute
 *     locations) runs in a task of its own;
 *  4. `estate3d:layout`: after `document.fonts.ready`, so the buttons are
 *     measured once, in their own font; one read of every size, then the
 *     label search, one solve order per task (`layoutLabelsSteps`);
 *  5. `estate3d:swap`: one final task that re-checks the size, sets it, fits
 *     the camera, draws the first frame, writes every button's and leader's
 *     position, marks the frame placed and tells `useEstateMap3D` it is ready.
 *     The hook swaps it in there and then, or, if the reader is using the 2D
 *     map, at the next idle moment after they stop (`estate3d:shown` marks the
 *     swap itself).
 * DOM reads are batched before writes throughout. A failure at any step (no
 * renderer, a program that does not link, a lost context) calls `onFail`, and
 * an unmount at any step disposes whatever was created; neither logs.
 *
 * SHADER ERROR CHECKS (`renderer.debug.checkShaderErrors`) ARE ON IN
 * DEVELOPMENT AND OFF IN A PRODUCTION BUILD, the review build included, so the
 * build the INP harness measures is the build the public would get. What the
 * check costs is three.js's info-log reads on each program's first use; the
 * link itself is waited for either way. A program that fails to link still
 * sends the page back to the 2D map, because step 3 reads each program's link
 * status itself, after the program has finished compiling; in development
 * three.js also logs its diagnostics.
 *
 * COST DISCIPLINE, from the project's standing rules:
 *  - One canvas, one context, created only when `EstateMap` decides this page
 *    wants it. Nothing here is imported otherwise, so three.js is not in any
 *    route's initial JavaScript.
 *  - Render on demand. There is no animation loop: one frame after build, one
 *    at the swap if the build finished in an earlier task, one per resize, and
 *    one when a place is opened or closed (its edges change colour; nothing
 *    moves). The motion budget is untouched because nothing moves.
 *  - The context is KEPT when the reader scrolls away. Releasing it would free
 *    GPU memory for a diagram that is off screen, and cost the build again on
 *    the way back. This is a build default, logged with step B.
 *  - Everything created is disposed on unmount, and the context is released
 *    unless it has already been lost.
 *
 * ACCESSIBILITY: the 2D map's own contract (B4). The canvas is `aria-hidden`.
 * Every place it draws is a real `<button aria-expanded aria-controls>`, at
 * least 44×44 px with its name in it, in the numbered list's order and then the
 * extras; each opens the same card as the 2D marker, right after it in the DOM.
 * Enter and Space toggle, Escape closes and returns focus to the button, opening
 * one closes any other, and a click or tap outside closes. So does focus leaving
 * the place: an open card is drawn above the other buttons, and without that a
 * Tab past its Visit link (or a Shift+Tab back) landed on a button the card hid
 * (WCAG 2.4.11). On a phone the list's places are numbered discs keyed to the
 * list, and the number is part of the button's name, so "01" said aloud finds
 * it (WCAG 2.5.3); the helipad and the Rituals venue have no number to borrow
 * and keep their name visible. The card is a band inside the frame's own box
 * (B5), on whichever edge leaves its own disc in view, so nothing below the map
 * moves. From 768 px up the card stands beside its button, clear of the other
 * places; where no such position exists (768 px) it takes the same band. The list beneath is unchanged. If the diagram gives way to the 2D map
 * while focus is inside it, `useEstateMap3D` puts focus back on the same place.
 *
 * THE PLAN'S FRAME (content/estate-plan.json `frame`): schematic units, origin
 * at the centre of the four-villa compound, negative z sea-ward, negative x the
 * side of the compound where the lane and the helipad apron are. No bearing is
 * on record, so nothing here says north.
 */

const DEG = Math.PI / 180;

/*
 * WHERE THE CAMERA STANDS: on the sea side, about 50° up, turned so the line from
 * the Rituals terrace to the compound runs across the frame (the only turn that
 * fits that diagonal to a 16:9 box without empty sides).
 *
 * Step A looked from the land side, with the sea at the top of the frame (D-020
 * recorded that as a default, not a ruling). Its first screenshots at step B's
 * framing showed what that costs: every villa pool lies directly sea-ward of its
 * house, so from the land side all four are hidden behind the houses, and "The
 * pool line" pointed at nothing a reader could see. The villas face the sea;
 * their terraces and pools face it too, and the site's own hero shows them "seen
 * together from the sea". From here the pools are in front of the houses, and
 * 50° rather than 40° keeps the rear row's pools clear of the front row's roofs.
 *
 * This reverses D-020's recorded render default ("the sea at the top of the
 * frame"). It is a build default of step B, not a ruling, and belongs in
 * DECISIONS.md beside the others this step takes.
 */
const VIEW = new Vector3(34, 85, -63).normalize();

/** Hemisphere intensity. The sun takes the rest of π on an upward face (see the header). */
const HEMI = 2.2;
/** Toward the sun: from the land side (+z), a little toward +x, about 48° up — low enough that walls facing it read lighter than walls facing away. */
const SUN_DIR = new Vector3(0.39, 0.74, 0.54).normalize();
const SUN = (Math.PI - HEMI) / SUN_DIR.y;

/** Edge lines: phrygana, faint. An opened place's edges turn pelagos at full strength. */
const EDGE_OPACITY = 0.35;
/** The contact shade's centre alpha. */
const SHADE_ALPHA = 0.1;
/** The pools: pelagos over limestone, reduced. --preveli is ruled dark-ground-only (DESIGN-PLAN.md). */
const POOL_OPACITY = 0.55;
/** How much lighter than pelagos the sea is at the waterline, and over how many plan units it deepens to the token. */
const SHALLOWS = 0.06;
const SHALLOWS_DEPTH = 10;

/** Framing: a relative margin around the framed extent, and a px margin inside the frame. */
const FRAME_MARGIN = 0.1;
const FRAME_PAD = 20;

/** The scene is built in slices of at most this long (ms) before the build yields. */
const SLICE_MS = 8;
/** How often a compiling program is asked whether it is ready, as three.js's `compileAsync` asks. */
const POLL_MS = 10;
/** See "Shader error checks" in the header. */
const CHECK_SHADER_ERRORS = process.env.NODE_ENV !== "production";

const pad2 = (n: number) => String(n).padStart(2, "0");

type Controls = { highlight: (key: string | null) => void; placeCard: () => void };
type Program = NonNullable<WebGLRenderer["info"]["programs"]>[number];
/** One read of everything the label layout measures: the frame, the note, and each place's button and visible chip. */
type Measured = {
  w: number;
  h: number;
  note: Box | null;
  sizes: { w: number; h: number; cw: number | null; ch: number | null }[];
};

export function EstateMap3D({ plan, hotspots, onFail, onReady, staged }: Map3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const places = useMemo(() => placesFor(plan, hotspots), [plan, hotspots]);
  const [open, setOpen] = useState<string | null>(null);
  const openRef = useRef<string | null>(null);
  const controls = useRef<Controls | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let disposed = false;
    let renderer: WebGLRenderer | null = null;
    const disposables: { dispose: () => void }[] = [];
    const undo: (() => void)[] = [];
    const keep = <T extends { dispose: () => void }>(x: T): T => {
      disposables.push(x);
      return x;
    };
    /* The build goes no further once the diagram is unmounted, or its context is lost (which has already called `onFail`). */
    const stopped = () => disposed || (renderer?.getContext().isContextLost() ?? false);
    const fail = () => {
      if (!disposed) onFail();
    };
    /** End this task; resolve true if the build must stop. */
    const step = async () => {
      await yieldToMain();
      return stopped();
    };

    const build = async () => {
      /* Out of React's commit: from here every step is a task of its own. */
      if (await step()) return;

      /* ---- 1. The renderer ---------------------------------------------- */
      mark(ESTATE3D_MARK.renderer);
      try {
        renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      } catch {
        fail();
        return;
      }
      const r = renderer;
      r.debug.checkShaderErrors = CHECK_SHADER_ERRORS;
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      const canvas = r.domElement;
      canvas.className = "estate-map-3d-canvas";
      canvas.setAttribute("aria-hidden", "true");
      const lost = (e: Event) => {
        e.preventDefault();
        fail();
      };
      canvas.addEventListener("webglcontextlost", lost);
      undo.push(() => canvas.removeEventListener("webglcontextlost", lost));
      el.prepend(canvas);
      if (await step()) return;

      /* ---- 2. Tokens, then the scene ------------------------------------- */
      mark(ESTATE3D_MARK.scene);
      /* The site's own tokens (globals.css), read live so a palette change reaches the diagram. One style read for all five. */
      const rootStyle = getComputedStyle(document.documentElement);
      const cssColor = (name: string, fallback: string) => new Color(rootStyle.getPropertyValue(name).trim() || fallback);
      const token = {
        limestone: cssColor("--color-limestone", "#e8e9e3"),
        basalt: cssColor("--color-basalt", "#16262b"),
        pelagos: cssColor("--color-pelagos", "#14535f"),
        phrygana: cssColor("--color-phrygana", "#545d4e"),
        ammos: cssColor("--color-ammos", "#e2dacb"),
      };
      const note = el.querySelector<HTMLElement>(".estate-map-3d-note");
      /* The same breakpoint as the phone rules in patterns.css, where the card becomes a band. */
      const phone = window.matchMedia("(max-width: 767px)");
      const buttons = places.map((p) => el.querySelector<HTMLElement>(`[data-place="${CSS.escape(p.key)}"] .estate-map-3d-button`));
      const leaders = places.map((p) => {
        const g = el.querySelector(`[data-leader="${CSS.escape(p.key)}"]`);
        return { line: g?.querySelector("line") ?? null, dot: g?.querySelector("circle") ?? null };
      });
      if (await step()) return;

      let slice = performance.now();
      const scene = new Scene();
      scene.background = token.limestone;

      const lambert = (color: Color) => keep(new MeshLambertMaterial({ color }));
      const basic = (color: Color, opacity = 1) =>
        keep(new MeshBasicMaterial({ color, side: DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }));
      const edge = () => keep(new LineBasicMaterial({ color: token.phrygana, transparent: true, opacity: EDGE_OPACITY }));
      const context = edge();

      /* One edge material per place, so opening it changes that place's lines and nothing else. */
      const placeOf = new Map<string, string>();
      const placeEdges = new Map<string, LineBasicMaterial>();
      for (const p of places) {
        placeEdges.set(p.key, edge());
        for (const id of p.elementIds) placeOf.set(id, p.key);
      }
      const edgeFor = (e: RenderElement) => {
        const key = placeOf.get(e.id);
        return (key && placeEdges.get(key)) || context;
      };

      const add = (g: BufferGeometry, m: Material, x = 0, y = 0, z = 0) => {
        keep(g);
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
      };
      const surface = (pos: number[], m: Material, colors?: number[]) => {
        const g = new BufferGeometry();
        g.setAttribute("position", new Float32BufferAttribute(pos, 3));
        if (colors) g.setAttribute("color", new Float32BufferAttribute(colors, 3));
        return add(g, m);
      };
      /** A flat rectangle on the ground, turned about the vertical axis. */
      const rect = (w: number, d: number, m: Material, x: number, z: number, y: number, deg = 0) => {
        const g = new PlaneGeometry(w, d);
        g.rotateX(-Math.PI / 2);
        g.rotateY(deg * DEG);
        return add(g, m, x, y, z);
      };
      /** A flat polygon from its outline, fanned from the centroid (the plan's outlines are near-convex). */
      const polygon = (pts: [number, number][], m: Material, y: number) => {
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const pos: number[] = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i]!;
          const b = pts[(i + 1) % pts.length]!;
          pos.push(cx, y, cz, b[0], y, b[1], a[0], y, a[1]);
        }
        return surface(pos, m);
      };
      /** A band of constant width along a polyline. */
      const band = (pts: [number, number][], width: number, m: Material, y: number) => {
        const pos: number[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, z1] = pts[i]!;
          const [x2, z2] = pts[i + 1]!;
          const len = Math.hypot(x2 - x1, z2 - z1) || 1;
          const nx = (-(z2 - z1) / len) * (width / 2);
          const nz = ((x2 - x1) / len) * (width / 2);
          pos.push(x1 - nx, y, z1 - nz, x2 - nx, y, z2 - nz, x2 + nx, y, z2 + nz);
          pos.push(x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz, x1 + nx, y, z1 + nz);
        }
        return surface(pos, m);
      };
      /** A closed outline on the ground, in the given edge material. */
      const outline = (pts: [number, number][], y: number, m: LineBasicMaterial) => {
        const pos: number[] = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i]!;
          const b = pts[(i + 1) % pts.length]!;
          pos.push(a[0], y, a[1], b[0], y, b[1]);
        }
        const g = keep(new BufferGeometry());
        g.setAttribute("position", new Float32BufferAttribute(pos, 3));
        scene.add(new LineSegments(g, m));
      };
      /** A soft contact shade: basalt vertex colours, ~0.10 alpha at the centre to none at the edges. */
      const shade = (w: number, d: number, x: number, z: number, deg: number, height: number) => {
        const g = new PlaneGeometry(w * 1.3, d * 1.3, 6, 6);
        g.rotateX(-Math.PI / 2);
        const pos = g.getAttribute("position");
        const colors: number[] = [];
        const fade = (t: number) => {
          const u = Math.min(1, Math.abs(t));
          return 1 - u * u * (3 - 2 * u);
        };
        for (let i = 0; i < pos.count; i++) {
          const a = SHADE_ALPHA * fade(pos.getX(i) / (w * 0.65)) * fade(pos.getZ(i) / (d * 0.65));
          colors.push(token.basalt.r, token.basalt.g, token.basalt.b, a);
        }
        g.setAttribute("color", new Float32BufferAttribute(colors, 4));
        g.rotateY(deg * DEG);
        const m = keep(new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
        /* Away from the sun, further for a taller house. */
        const away = new Vector3(-SUN_DIR.x, 0, -SUN_DIR.z).normalize().multiplyScalar(height * 0.3);
        add(g, m, x + away.x, 0.015, z + away.z);
      };

      const framed = framingPoints(plan);
      const midX = framed.reduce((s, p) => s + p[0], 0) / framed.length;
      const midZ = framed.reduce((s, p) => s + p[2], 0) / framed.length;

      /*
       * The ground. Far larger than the frame on purpose: an orthographic camera
       * looking down at an angle shows a plane's corners as diagonal cuts across
       * the frame, and the first render had exactly that. At this size no edge
       * can enter the view at any aspect ratio.
       */
      const FIELD = 800;
      rect(FIELD, FIELD, lambert(token.limestone), midX, midZ, 0);

      const sand = basic(token.ammos);
      const pools = basic(token.pelagos, POOL_OPACITY);

      const draw = (e: RenderElement) => {
        const { x, z } = e.position;
        const deg = e.orientationDeg;
        const f = e.footprint;
        switch (e.kind) {
          case "shore": {
            /*
             * The shoreline: sea on its sea-ward side (negative z), a sand band on
             * the land side. The sea is still: pelagos, a few percent lighter at
             * the waterline and deepening to the token over a short band. The
             * strips run in columns of constant x, so no two overlap.
             */
            const pts: [number, number][] =
              f && "points" in f
                ? [...f.points].sort((a, b) => a[0] - b[0])
                : [
                    [x - FIELD / 4, z],
                    [x + FIELD / 4, z],
                  ];
            const line: [number, number][] = [[midX - FIELD / 2, pts[0]![1]], ...pts, [midX + FIELD / 2, pts[pts.length - 1]![1]]];
            const far = Math.min(...line.map((p) => p[1])) - FIELD / 2;
            const shallow = token.pelagos.clone().lerp(token.limestone, SHALLOWS);
            const deep = token.pelagos;
            const pos: number[] = [];
            const col: number[] = [];
            /** Two triangles over a column of constant x: near edge (z1n, z2n) in one colour, far edge (z1f, z2f) in another. */
            const quad = (x1: number, x2: number, z1n: number, z2n: number, z1f: number, z2f: number, near: Color, farColor: Color) => {
              pos.push(x1, 0.01, z1n, x2, 0.01, z2n, x2, 0.01, z2f, x1, 0.01, z1n, x2, 0.01, z2f, x1, 0.01, z1f);
              for (const c of [near, near, farColor, near, farColor, farColor]) col.push(c.r, c.g, c.b);
            };
            for (let i = 0; i < line.length - 1; i++) {
              const [x1, z1] = line[i]!;
              const [x2, z2] = line[i + 1]!;
              quad(x1, x2, z1, z2, z1 - SHALLOWS_DEPTH, z2 - SHALLOWS_DEPTH, shallow, deep);
              quad(x1, x2, z1 - SHALLOWS_DEPTH, z2 - SHALLOWS_DEPTH, far, far, deep, deep);
            }
            surface(pos, keep(new MeshBasicMaterial({ vertexColors: true, side: DoubleSide })), col);
            band(
              line.map(([px, pz]) => [px, pz + 0.8] as [number, number]),
              1.6,
              sand,
              0.02
            );
            break;
          }
          case "lane": {
            if (f && "points" in f) band(f.points, 2.2, sand, 0.03);
            else {
              const [w, d] = rectOf(f, [2.2, 20]);
              rect(w, d, sand, x, z, 0.03, deg);
            }
            break;
          }
          case "compound": {
            if (f && "points" in f) outline(f.points, 0.05, context);
            break;
          }
          case "apron":
          case "venue":
          case "table":
          case "garden": {
            const pts = f && "points" in f ? f.points : corners(...rectOf(f, [2, 2]), x, z, deg);
            const y = e.kind === "apron" ? 0.035 : 0.04;
            polygon(pts, sand, y);
            outline(pts, y + 0.01, edgeFor(e));
            break;
          }
          case "helipad": {
            const [w] = rectOf(f, [8, 8]);
            const g = new CircleGeometry(w / 2, 48);
            g.rotateX(-Math.PI / 2);
            add(g, sand, x, 0.05, z);
            const ring: [number, number][] = [];
            for (let i = 0; i < 48; i++) ring.push([x + (Math.cos((i / 48) * 2 * Math.PI) * w) / 2, z + (Math.sin((i / 48) * 2 * Math.PI) * w) / 2]);
            outline(ring, 0.06, edgeFor(e));
            /* The letter, as two bars and a crossbar — in basalt. DESIGN-PLAN.md bans gold, ochre and brass. */
            const s = w / 8;
            const c = Math.cos(deg * DEG);
            const sn = Math.sin(deg * DEG);
            const letter = basic(token.basalt);
            for (const [bw, bd, dx] of [
              [0.5 * s, 3.2 * s, -1 * s],
              [0.5 * s, 3.2 * s, 1 * s],
              [2 * s, 0.5 * s, 0],
            ] as const) {
              rect(bw, bd, letter, x + dx * c, z - dx * sn, 0.07, deg);
            }
            break;
          }
          case "villa": {
            const [w, d] = rectOf(f, [7, 6]);
            const h = STOREY * (e.storeys ?? 1);
            shade(w, d, x, z, deg, h);
            const g = new BoxGeometry(w, h, d);
            g.rotateY(deg * DEG);
            add(g, lambert(token.limestone), x, h / 2, z);
            const lines = new LineSegments(keep(new EdgesGeometry(g)), edgeFor(e));
            lines.position.set(x, h / 2, z);
            scene.add(lines);
            break;
          }
          case "pool": {
            const [w, d] = rectOf(f, [2.4, 4]);
            rect(w, d, pools, x, z, 0.08, deg);
            outline(corners(w, d, x, z, deg), 0.09, edgeFor(e));
            break;
          }
        }
      };
      for (const e of plan.elements) {
        draw(e);
        if (performance.now() - slice >= SLICE_MS) {
          if (await step()) return;
          slice = performance.now();
        }
      }

      scene.add(new HemisphereLight(0xffffff, token.limestone, HEMI));
      const sun = new DirectionalLight(0xffffff, SUN);
      sun.position.copy(SUN_DIR).multiplyScalar(100);
      scene.add(sun);

      /* An orthographic view from the sea side (see VIEW), aimed at the framed centre. */
      const target = new Vector3(midX, 0, midZ);
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      camera.position.copy(target).addScaledVector(VIEW, 200);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      /*
       * A CAMERA OF ITS OWN FOR A LAYOUT IN PROGRESS. A layout reads, projects
       * and searches over many tasks (`layoutFrame` below); computing its
       * projection on a copy means the drawn frame is never left fitted to a
       * size whose labels have not been placed yet, and a layout that is
       * stopped half way through leaves nothing of itself behind.
       */
      const scratch = camera.clone();
      const view = framed.map((p) => new Vector3(...p).applyMatrix4(camera.matrixWorldInverse));
      const minX = Math.min(...view.map((v) => v.x));
      const maxX = Math.max(...view.map((v) => v.x));
      const minY = Math.min(...view.map((v) => v.y));
      const maxY = Math.max(...view.map((v) => v.y));
      if (await step()) return;

      /* ---- 3. The shader programs ----------------------------------------- */
      mark(ESTATE3D_MARK.compile);
      const parallel = r.extensions.has("KHR_parallel_shader_compile");
      const programs = r.info.programs ?? [];
      const drawables: Object3D[] = [];
      scene.traverse((o) => {
        if ((o as Mesh).isMesh || (o as LineSegments).isLine) drawables.push(o);
      });
      /* One object at a time against the scene's lights; a task ends wherever a new program was created. */
      for (const o of drawables) {
        const before = programs.length;
        r.compile(o, camera, scene);
        if (programs.length !== before && (await step())) return;
      }
      /* Until the driver says every program has linked: a non-blocking query with the extension; ready at once without it. */
      const isReady = (p: Program) => {
        const ready = (p as Program & { isReady?: () => boolean }).isReady;
        return typeof ready !== "function" || ready.call(p);
      };
      const compiling = new Set(programs);
      for (;;) {
        for (const p of compiling) if (isReady(p)) compiling.delete(p);
        if (!compiling.size) break;
        await delay(POLL_MS);
        if (stopped()) return;
      }
      mark(ESTATE3D_MARK.compiled, { khrParallelShaderCompile: parallel, programs: programs.length });
      /* Each program's first use, in a task of its own: without the extension, this is where its link is waited for. */
      const gl = r.getContext();
      for (const p of [...programs]) {
        p.getUniforms();
        if (gl.getProgramParameter(p.program as WebGLProgram, gl.LINK_STATUS) !== true) {
          fail();
          return;
        }
        if (await step()) return;
      }

      /* ---- 4. The label layout --------------------------------------------- */
      /* Before the first layout: the buttons are measured once, in the font they are drawn in. */
      await document.fonts?.ready;
      if (stopped()) return;
      mark(ESTATE3D_MARK.layout);

      const probe = new Vector3();
      let size = { w: 0, h: 0 };
      let boxes: Box[] = [];
      let noteBox: Box | null = null;
      /* The size the layout in flight, or the last one to land, was made for. */
      let wanted = { w: 0, h: 0 };
      /* The button and chip sizes the current layout was made with. */
      let laidOutSizes = "";

      /** Every read the layout needs, in one pass and before any write. */
      const measure = (): Measured => ({
        w: el.clientWidth,
        h: el.clientHeight,
        note: note ? { x: note.offsetLeft, y: note.offsetTop, w: note.offsetWidth, h: note.offsetHeight } : null,
        sizes: buttons.map((b) => {
          const chip = b?.firstElementChild as HTMLElement | null;
          return { w: b?.offsetWidth ?? 44, h: b?.offsetHeight ?? 44, cw: chip?.offsetWidth ?? null, ch: chip?.offsetHeight ?? null };
        }),
      });

      /*
       * THE FIT. The framed extent, plus a margin, is scaled to the room the frame
       * leaves once the note's band is set aside, and its centre is put at the
       * centre of that room. The note stands at the top of the frame at every width
       * (patterns.css says why), so its height is reserved at the top. The bottom
       * branch is kept so that moving the note in CSS alone can never put it over
       * the drawing: the fit follows wherever the note is measured.
       */
      const fitBounds = (w: number, h: number, noteAt: Box | null) => {
        let padTop = FRAME_PAD;
        let padBottom = FRAME_PAD;
        if (noteAt) {
          if (noteAt.y < h / 2) padTop = Math.max(padTop, noteAt.y + noteAt.h + 8);
          else padBottom = Math.max(padBottom, h - noteAt.y + 8);
        }
        const roomW = Math.max(1, w - 2 * FRAME_PAD);
        const roomH = Math.max(1, h - padTop - padBottom);
        const scale = Math.min(roomW / ((maxX - minX) * (1 + FRAME_MARGIN)), roomH / ((maxY - minY) * (1 + FRAME_MARGIN)));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const top = cy + (padTop + roomH / 2) / scale;
        return { left: cx - w / 2 / scale, right: cx + w / 2 / scale, top, bottom: top - h / scale };
      };
      /** The fit, on a camera: the scratch camera while a layout runs, the real one in its final task. */
      const applyBounds = (cam: OrthographicCamera, b: { left: number; right: number; top: number; bottom: number }) => {
        cam.left = b.left;
        cam.right = b.right;
        cam.top = b.top;
        cam.bottom = b.bottom;
        cam.updateProjectionMatrix();
      };

      /** The label search's input, from the current projection and one measurement. */
      const layoutInput = (m: Measured, cam: OrthographicCamera) => {
        const { w, h } = m;
        /* px per plan unit across the frame; a ground circle's widest screen radius is its radius times this. */
        const pxPerUnit = w / (cam.right - cam.left);
        const labels: LabelInput[] = places.map((p, i) => {
          probe.set(...p.at).project(cam);
          const s = m.sizes[i]!;
          return {
            ax: (probe.x * 0.5 + 0.5) * w,
            ay: (-probe.y * 0.5 + 0.5) * h,
            w: s.w,
            h: s.h,
            clear: p.clear ? p.clear * pxPerUnit : 0,
          };
        });
        const avoid: Box[] = m.note ? [m.note] : [];
        /* Every villa and pool on screen: the outline of its projected ground and roof corners, and the place it belongs to. */
        const massing: Massing[] = [];
        for (const e of plan.elements) {
          if (e.kind !== "villa" && e.kind !== "pool") continue;
          const [fw, fd] = rectOf(e.footprint, e.kind === "villa" ? [7, 6] : [2.4, 4]);
          const top = e.kind === "villa" ? STOREY * (e.storeys ?? 1) : 0.1;
          const pts: [number, number][] = [];
          for (const [cx, cz] of corners(fw, fd, e.position.x, e.position.z, e.orientationDeg)) {
            for (const y of [0, top]) {
              probe.set(cx, y, cz).project(cam);
              pts.push([(probe.x * 0.5 + 0.5) * w, (-probe.y * 0.5 + 0.5) * h]);
            }
          }
          massing.push({ hull: convexHull(pts), owner: places.findIndex((p) => p.elementIds.includes(e.id)) });
        }
        return { labels, avoid, massing };
      };

      /** Every write the layout makes, after the reads: button positions, then leaders. */
      const apply = (m: Measured, labels: LabelInput[]) => {
        places.forEach((_, i) => {
          const b = buttons[i];
          const box = boxes[i]!;
          if (!b) return;
          b.style.setProperty("--x", `${box.x}px`);
          b.style.setProperty("--y", `${box.y}px`);
        });
        places.forEach((_, i) => {
          const box = boxes[i]!;
          const l = labels[i]!;
          const s = m.sizes[i]!;
          /* The leader runs from the anchor to the nearest edge of the visible chip, not of the 44 px target around it. */
          const cw = s.cw ?? box.w;
          const ch = s.ch ?? box.h;
          const cx0 = box.x + (box.w - cw) / 2;
          const cy0 = box.y + (box.h - ch) / 2;
          const ex = Math.min(Math.max(l.ax, cx0), cx0 + cw);
          const ey = Math.min(Math.max(l.ay, cy0), cy0 + ch);
          const { line, dot } = leaders[i]!;
          const far = Math.hypot(ex - l.ax, ey - l.ay) > 3;
          line?.setAttribute("x1", l.ax.toFixed(1));
          line?.setAttribute("y1", l.ay.toFixed(1));
          line?.setAttribute("x2", (far ? ex : l.ax).toFixed(1));
          line?.setAttribute("y2", (far ? ey : l.ay).toFixed(1));
          dot?.setAttribute("cx", l.ax.toFixed(1));
          dot?.setAttribute("cy", l.ay.toFixed(1));
        });
      };

      const placeCard = () => {
        const key = openRef.current;
        const i = places.findIndex((p) => p.key === key);
        if (i < 0 || !boxes[i]) return;
        const card = el.querySelector<HTMLElement>(`#estate3d-${CSS.escape(key!)}`);
        if (!card) return;
        const others = boxes.filter((_, j) => j !== i);
        const noteFoot = noteBox ? noteBox.y + noteBox.h : 0;
        /* A band across the frame (patterns.css), on the edge that leaves its own button in view; the px² of other places it covers. */
        const band = () => {
          card.dataset.band = "bottom";
          const h = card.offsetHeight;
          const edge = bandEdge(boxes[i]!, h, size, noteFoot, others);
          card.dataset.band = edge;
          card.style.setProperty("--band-top", `${noteFoot}px`);
          return coveredBy({ x: 0, y: edge === "top" ? noteFoot : size.h - h, w: size.w, h }, others);
        };
        if (phone.matches) {
          band();
          return;
        }
        delete card.dataset.band;
        const at = cardPosition(boxes[i]!, { w: card.offsetWidth, h: card.offsetHeight }, size, { top: noteFoot + 8, obstacles: others });
        /* Beside its button when that hides no other place; otherwise a band, if the band hides less. */
        if (at.covered > 0 && band() < at.covered) return;
        delete card.dataset.band;
        card.style.setProperty("--card-x", `${at.x}px`);
        card.style.setProperty("--card-y", `${at.y}px`);
      };

      /*
       * THE LAYOUT, AS TASKS. Every read in one pass, the projection onto the
       * scratch camera, the label search a step per task, and then ONE task
       * that writes: the canvas size, the drawing, the buttons, the leaders,
       * `data-placed` and the open card.
       *
       * The build's own first layout takes this path and so does every later
       * one, so there is no path left that lays out in a single task. That
       * matters because a resize is ordinary in the middle of a build — Chrome
       * Android collapses its URL bar as the reader scrolls, which changes the
       * layout viewport, and 768 px can be crossed at any moment — and the
       * single task the old resize path used (measure, fit, project every
       * anchor and hull, the whole label search, render, write, place the card)
       * was the longest task the diagram had, against the 200 ms the INP gate
       * allows. Nothing here is longer than the final task the record measured.
       *
       * Resolves true when it placed the diagram.
       */
      const layoutFrame = async (first = false): Promise<boolean> => {
        const m = measure();
        if (!m.w || !m.h) return false;
        wanted = { w: m.w, h: m.h };
        const bounds = fitBounds(m.w, m.h, m.note);
        applyBounds(scratch, bounds);
        const input = layoutInput(m, scratch);
        if (await step()) return false;

        const search = layoutLabelsSteps(input.labels, { w: m.w, h: m.h }, input.avoid, { massing: input.massing });
        let found: Box[];
        for (;;) {
          const next = search.next();
          if (next.done) {
            found = next.value;
            break;
          }
          if (await step()) return false;
        }
        if (await step()) return false;

        /* ONE TASK: the writes, and nothing in it that the search did. */
        if (first) mark(ESTATE3D_MARK.swap);
        size = { w: m.w, h: m.h };
        noteBox = m.note;
        laidOutSizes = JSON.stringify(m.sizes);
        boxes = found;
        applyBounds(camera, bounds);
        r.setSize(m.w, m.h, false);
        r.render(scene, camera);
        apply(m, input.labels);
        el.dataset.placed = "true";
        placeCard();
        return true;
      };

      /*
       * ONE LAYOUT AT A TIME. A resize that arrives while a layout is running
       * sets `again` and is laid out when that one lands, so two searches never
       * interleave and a reader who keeps resizing gets one layout per landing
       * rather than one per event. Each landing is self-consistent: the drawing,
       * the labels and the card are all the size that was searched for.
       * `wanted` is that size, so a delivery for a size already being laid out
       * costs nothing. The build holds the flight until its own layout lands.
       */
      let laying = true;
      let again = false;
      const run = async () => {
        laying = true;
        try {
          while (again && !stopped()) {
            again = false;
            /* A task of its own first, never the caller's: an observer's callback and the build's last task both stay the size they were measured at. */
            if (await step()) return;
            await layoutFrame();
          }
        } finally {
          laying = false;
        }
      };
      /** Lay out again: for a size the layout was not made for, or (`force`) for the same size measured differently. */
      const frame = (force = false) => {
        if (!force) {
          const m = measure();
          if (!m.w || !m.h || (m.w === wanted.w && m.h === wanted.h)) return;
        }
        again = true;
        if (!laying) void run();
      };

      /*
       * THE OBSERVERS, FROM HERE AND NOT FROM THE SWAP. The diagram is built
       * over about a second and a half on a phone, and a resize inside that
       * window used to be handled by nothing at all until the build's last task
       * absorbed it whole. Now it is laid out like any other. A ResizeObserver
       * delivers at most once per rendering frame, so it needs no throttle of
       * its own, and its first delivery is the frame's initial size, which the
       * build is about to lay out anyway.
       */
      const ro = new ResizeObserver(() => frame());
      ro.observe(el);
      undo.push(() => ro.disconnect());
      /* The phone rules change the card's shape rather than the frame's box, so a crossing needs the card placed again either way. */
      const onPhoneChange = () => frame(true);
      phone.addEventListener("change", onPhoneChange);
      undo.push(() => phone.removeEventListener("change", onPhoneChange));
      /* A web font that arrives later still gets its buttons measured in it, if it changed their size. */
      const fontsDone = () => {
        if (JSON.stringify(measure().sizes) !== laidOutSizes) frame(true);
      };
      document.fonts?.addEventListener("loadingdone", fontsDone);
      undo.push(() => document.fonts?.removeEventListener("loadingdone", fontsDone));

      /* A frame with no size yet (a hidden ancestor): wait until it has one. */
      for (let m = measure(); !m.w || !m.h; m = measure()) {
        await new Promise<void>((resolve) => {
          const wait = new ResizeObserver(() => {
            wait.disconnect();
            resolve();
          });
          wait.observe(el);
          /*
           * The cleanup RESOLVES this wait as well as disconnecting. An
           * unmounted frame is detached, so it has no size and its observer
           * never fires again: a build left suspended here would hold the
           * scene, every geometry's attribute arrays, the renderer and this
           * element for the life of the document. Resumed, it returns at the
           * `stopped()` below.
           */
          undo.push(() => {
            wait.disconnect();
            resolve();
          });
        });
        if (stopped()) return;
      }

      /* ---- 5. The layout, then one final task: drawn, placed, ready ---- */
      /* The observer's first delivery, if it has come, is the size measured next. */
      again = false;
      const placed = await layoutFrame(true);
      laying = false;
      if (stopped()) return;
      /*
       * AN UNDRAWN DIAGRAM IS WHAT THE 2D MAP IS FOR. If the frame lost its
       * size under the build, the final task did not run: nothing has been
       * drawn (the canvas is opaque — the renderer is created with
       * `alpha: false`) and no button or leader is shown (`:not([data-placed])`
       * in patterns.css). The reader keeps the photograph instead of being
       * given a black box.
       */
      if (!placed || el.dataset.placed !== "true") {
        fail();
        return;
      }
      /* A resize that came after the build measured: laid out again now, a task at a time, while the diagram is revealed. */
      if (again) void run();

      let lit: string | null = null;
      const highlight = (key: string | null) => {
        if (key === lit) return;
        lit = key;
        for (const [k, m] of placeEdges) {
          const on = k === key;
          m.color.copy(on ? token.pelagos : token.phrygana);
          m.opacity = on ? 1 : EDGE_OPACITY;
        }
        r.render(scene, camera);
      };
      controls.current = { highlight, placeCard };

      /*
       * The first frame was drawn in this task. If the hook swaps the diagram in
       * within it, that frame is what the reader sees; a swap in a later task
       * draws again, because an undisplayed drawing buffer need not survive.
       */
      let fresh = true;
      queueMicrotask(() => {
        fresh = false;
      });
      const show: ShowDiagram = () => {
        if (disposed) return;
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
        if (!fresh) r.render(scene, camera);
        mark(ESTATE3D_MARK.shown);
      };
      onReady(show);
    };

    build().catch((err: unknown) => {
      if (disposed) return;
      if (process.env.NODE_ENV !== "production") console.warn("EstateMap3D: the build failed; the 2D map stays.", err);
      onFail();
    });

    return () => {
      disposed = true;
      controls.current = null;
      for (const u of undo.splice(0).reverse()) u();
      for (const d of disposables) d.dispose();
      if (renderer) {
        renderer.dispose();
        /* A context the browser has already taken back cannot be released again, and asking throws a warning. */
        if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
        renderer.domElement.remove();
      }
      delete el.dataset.placed;
    };
  }, [plan, places, onFail, onReady]);

  /* One re-render per open or close, and the card beside its button — before paint, so it never flashes at 0,0. */
  useLayoutEffect(() => {
    openRef.current = open;
    controls.current?.highlight(open);
    controls.current?.placeCard();
  }, [open]);

  /*
   * While a card is open, three things close it.
   *  - A click or tap outside every place. `click`, not `pointerdown`: on touch
   *    a pointerdown fires the moment a finger lands, before the browser knows
   *    the gesture is a scroll, so a reader who began scrolling the page from
   *    the list lost the card (B5 says a TAP outside closes). A click on another
   *    place's button is left to that button: this listener runs after React's,
   *    and closing here would undo the card it had just opened.
   *  - Focus moving outside its place (see the header): a Tab past the Visit
   *    link, or a Shift+Tab back, no longer lands on a button under the card.
   *  - Escape, which also returns focus to its button.
   */
  useEffect(() => {
    if (!open) return;
    const el = host.current;
    const place = () => el?.querySelector<HTMLElement>(`[data-place="${CSS.escape(open)}"]`) ?? null;
    const click = (e: MouseEvent) => {
      if (e.target instanceof Element && el?.contains(e.target) && e.target.closest(".estate-map-3d-place")) return;
      setOpen(null);
    };
    const focus = (e: FocusEvent) => {
      if (e.target instanceof Node && place()?.contains(e.target)) return;
      setOpen(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const p = place();
      const hadFocus = !!p && (p.contains(document.activeElement) || document.activeElement === document.body);
      setOpen(null);
      if (hadFocus) p?.querySelector<HTMLButtonElement>(".estate-map-3d-button")?.focus();
    };
    document.addEventListener("click", click);
    document.addEventListener("focusin", focus);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const notDrawn = plan.notDrawn.length ? `Not drawn: ${plan.notDrawn.join(", ")}. ` : "";

  return (
    <div
      ref={host}
      className={`estate-map-frame estate-map-frame--3d${plan.preview ? " estate-map-frame--preview" : ""}`}
      inert={staged}
      aria-hidden={staged ? true : undefined}
    >
      <svg className="estate-map-3d-leaders" aria-hidden="true" focusable="false">
        {places.map((p) => (
          <g key={p.key} data-leader={p.key} className={open === p.key ? "is-open" : undefined}>
            <line />
            <circle r="2.5" />
          </g>
        ))}
      </svg>

      {places.map((p) => {
        const isOpen = open === p.key;
        const cardId = `estate3d-${p.key}`;
        return (
          <div key={p.key} className="estate-map-3d-place" data-place={p.key}>
            <button
              type="button"
              className={`estate-map-3d-button${isOpen ? " is-open" : ""}`}
              aria-expanded={isOpen}
              aria-controls={cardId}
              onClick={() => setOpen(isOpen ? null : p.key)}
            >
              <span className={`estate-map-3d-chip${p.index ? "" : " estate-map-3d-chip--named"}`}>
                {/*
                  On a phone a list place's chip is a disc carrying its number in
                  the list beneath, so the two read as one legend. The number is
                  NOT aria-hidden: below 768 px it is the only visible text on
                  the button, and a name that does not contain the visible label
                  fails WCAG 2.5.3 (a speech-input reader says "tap 01"). From
                  768 px up it is display:none and leaves the name alone. The
                  space between the two spans is dropped by the chip's flex
                  layout and keeps the name "01 Villa Thoi", not "01Villa Thoi".

                  A place the list does not carry (the helipad, the Rituals
                  venue) has no number to borrow. It used to get the 2D marker's
                  dot, which left two identical, unexplained discs on a phone;
                  it keeps its plan name visible instead, at every width.
                */}
                {p.index ? <span className="tabular estate-map-3d-index">{pad2(p.index)}</span> : null}{" "}
                <span className="caption estate-map-3d-name">{p.name}</span>
              </span>
            </button>
            <div id={cardId} className="estate-map-card estate-map-3d-card" hidden={!isOpen}>
              {p.hotspot ? (
                <EstateMapCardContent
                  name={p.hotspot.label}
                  line={p.hotspot.line}
                  ledger={p.hotspot.ledger}
                  href={p.hotspot.href}
                  thumb={p.hotspot.thumb}
                />
              ) : (
                <EstateMapCardContent name={p.name} href={p.href} />
              )}
            </div>
          </div>
        );
      })}

      {/*
        The note follows the plan, never a sentence typed for one state of it.
        On a review build its first word is "Preview": the positions are
        inferred from aerial photographs and nobody has verified them, and a
        screenshot of this build must say so on its face. On the public build
        the gate has already required every drawn element to be owner-verified.
        Either way it names what is not drawn, because the list beneath carries
        every place and the drawing does not. Two lengths; CSS shows the short
        one on a phone, inside the frame's box so nothing below it moves.
      */}
      <p className="caption estate-map-3d-note">
        <span className="estate-map-3d-note-long">
          {plan.preview
            ? "Preview — unverified. Positions are inferred from the estate’s aerial photographs and are not yet confirmed by the owner; this build is never public. "
            : "A diagram of the estate, confirmed by the owner. "}
          {notDrawn}The list below carries every place.
        </span>
        <span className="estate-map-3d-note-short">
          {plan.preview ? "Preview — unverified positions. " : "A diagram, owner-confirmed. "}
          {plan.notDrawn.length ? `${plan.notDrawn.length} not drawn; all listed.` : "All listed below."}
        </span>
      </p>
    </div>
  );
}
