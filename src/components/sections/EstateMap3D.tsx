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
} from "three";

import type { RenderElement, RenderPlan } from "@/lib/estate-plan-gate";
import type { Hotspot } from "./EstateMap";
import { EstateMapCardContent } from "./EstateMapCard";
import {
  STOREY,
  bandEdge,
  cardPosition,
  convexHull,
  corners,
  coveredBy,
  framingPoints,
  layoutLabels,
  placesFor,
  rectOf,
  type Box,
  type Massing,
} from "./estate-map-3d-layout";

/**
 * THE ESTATE MAP, IN THREE DIMENSIONS — drawn from `content/estate-plan.json`.
 *
 * It mounts only when the provenance gate is open (DECISIONS.md D-021): on the
 * public build that means every drawn element is owner-verified, and on a local
 * review build (`scripts/estate3d-preview.mjs`) the note says in its first
 * words that the geometry is unverified. Positions are data. Correcting one is
 * an edit to the JSON, never to this file.
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
 * COST DISCIPLINE, from the project's standing rules:
 *  - One canvas, one context, created only when `EstateMap` decides this page
 *    wants it. Nothing here is imported otherwise, so three.js is not in any
 *    route's initial JavaScript.
 *  - Render on demand. There is no animation loop: one frame after build, one
 *    per resize, and one when a place is opened or closed (its edges change
 *    colour; nothing moves). The motion budget is untouched because nothing
 *    moves.
 *  - The context is KEPT when the reader scrolls away. Releasing it would free
 *    GPU memory for a diagram that is off screen, and cost the ~141 ms
 *    renderer-and-first-frame task again on the way back (qa/perf/ESTATE3D-cost.md).
 *    This is a build default, logged with step B.
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

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(v || fallback);
};

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

const pad2 = (n: number) => String(n).padStart(2, "0");

type Controls = { highlight: (key: string | null) => void; placeCard: () => void };

export function EstateMap3D({ plan, hotspots, onFail }: { plan: RenderPlan; hotspots: Hotspot[]; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const places = useMemo(() => placesFor(plan, hotspots), [plan, hotspots]);
  const [open, setOpen] = useState<string | null>(null);
  const openRef = useRef<string | null>(null);
  const controls = useRef<Controls | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      onFail();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const canvas = renderer.domElement;
    canvas.className = "estate-map-3d-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.prepend(canvas);

    /* The site's own tokens (globals.css), read live so a palette change reaches the diagram. */
    const token = {
      limestone: cssColor("--color-limestone", "#e8e9e3"),
      basalt: cssColor("--color-basalt", "#16262b"),
      pelagos: cssColor("--color-pelagos", "#14535f"),
      phrygana: cssColor("--color-phrygana", "#545d4e"),
      ammos: cssColor("--color-ammos", "#e2dacb"),
    };

    const scene = new Scene();
    scene.background = token.limestone;
    const disposables: { dispose: () => void }[] = [];
    const keep = <T extends { dispose: () => void }>(x: T): T => {
      disposables.push(x);
      return x;
    };

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

    for (const e of plan.elements) {
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
    const view = framed.map((p) => new Vector3(...p).applyMatrix4(camera.matrixWorldInverse));
    const minX = Math.min(...view.map((v) => v.x));
    const maxX = Math.max(...view.map((v) => v.x));
    const minY = Math.min(...view.map((v) => v.y));
    const maxY = Math.max(...view.map((v) => v.y));

    const note = el.querySelector<HTMLElement>(".estate-map-3d-note");
    /* The same breakpoint as the phone rules in patterns.css, where the card becomes a band. */
    const phone = window.matchMedia("(max-width: 767px)");
    const probe = new Vector3();
    let boxes: Box[] = [];
    let size = { w: 0, h: 0 };
    let disposed = false;

    /*
     * THE FIT. The framed extent, plus a margin, is scaled to the room the frame
     * leaves once the note's band is set aside, and its centre is put at the
     * centre of that room. The note stands at the top of the frame at every width
     * (patterns.css says why), so its height is reserved at the top. The bottom
     * branch is kept so that moving the note in CSS alone can never put it over
     * the drawing: the fit follows wherever the note is measured.
     */
    const fit = (w: number, h: number) => {
      let padTop = FRAME_PAD;
      let padBottom = FRAME_PAD;
      if (note) {
        if (note.offsetTop < h / 2) padTop = Math.max(padTop, note.offsetTop + note.offsetHeight + 8);
        else padBottom = Math.max(padBottom, h - note.offsetTop + 8);
      }
      const roomW = Math.max(1, w - 2 * FRAME_PAD);
      const roomH = Math.max(1, h - padTop - padBottom);
      const scale = Math.min(roomW / ((maxX - minX) * (1 + FRAME_MARGIN)), roomH / ((maxY - minY) * (1 + FRAME_MARGIN)));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      camera.left = cx - w / 2 / scale;
      camera.right = cx + w / 2 / scale;
      camera.top = cy + (padTop + roomH / 2) / scale;
      camera.bottom = camera.top - h / scale;
      camera.updateProjectionMatrix();
    };

    /** The buttons, leaders and any open card, placed from the current projection and the buttons' measured sizes. */
    const layout = () => {
      const { w, h } = size;
      if (!w || !h) return;
      const buttons = places.map((p) => el.querySelector<HTMLElement>(`[data-place="${CSS.escape(p.key)}"] .estate-map-3d-button`));
      /* px per plan unit across the frame; a ground circle's widest screen radius is its radius times this. */
      const pxPerUnit = w / (camera.right - camera.left);
      const labels = places.map((p, i) => {
        probe.set(...p.at).project(camera);
        const b = buttons[i];
        return {
          ax: (probe.x * 0.5 + 0.5) * w,
          ay: (-probe.y * 0.5 + 0.5) * h,
          w: b?.offsetWidth ?? 44,
          h: b?.offsetHeight ?? 44,
          clear: p.clear ? p.clear * pxPerUnit : 0,
        };
      });
      const avoid: Box[] = note ? [{ x: note.offsetLeft, y: note.offsetTop, w: note.offsetWidth, h: note.offsetHeight }] : [];
      /* Every villa and pool on screen: the outline of its projected ground and roof corners, and the place it belongs to. */
      const massing: Massing[] = [];
      for (const e of plan.elements) {
        if (e.kind !== "villa" && e.kind !== "pool") continue;
        const [fw, fd] = rectOf(e.footprint, e.kind === "villa" ? [7, 6] : [2.4, 4]);
        const top = e.kind === "villa" ? STOREY * (e.storeys ?? 1) : 0.1;
        const pts: [number, number][] = [];
        for (const [cx, cz] of corners(fw, fd, e.position.x, e.position.z, e.orientationDeg)) {
          for (const y of [0, top]) {
            probe.set(cx, y, cz).project(camera);
            pts.push([(probe.x * 0.5 + 0.5) * w, (-probe.y * 0.5 + 0.5) * h]);
          }
        }
        massing.push({ hull: convexHull(pts), owner: places.findIndex((p) => p.elementIds.includes(e.id)) });
      }
      boxes = layoutLabels(labels, { w, h }, avoid, { massing });

      places.forEach((p, i) => {
        const b = buttons[i];
        const box = boxes[i]!;
        const l = labels[i]!;
        if (b) {
          b.style.setProperty("--x", `${box.x}px`);
          b.style.setProperty("--y", `${box.y}px`);
        }
        /* The leader runs from the anchor to the nearest edge of the visible chip, not of the 44 px target around it. */
        const chip = b?.firstElementChild as HTMLElement | null;
        const cw = chip?.offsetWidth ?? box.w;
        const ch = chip?.offsetHeight ?? box.h;
        const cx0 = box.x + (box.w - cw) / 2;
        const cy0 = box.y + (box.h - ch) / 2;
        const ex = Math.min(Math.max(l.ax, cx0), cx0 + cw);
        const ey = Math.min(Math.max(l.ay, cy0), cy0 + ch);
        const leader = el.querySelector(`[data-leader="${CSS.escape(p.key)}"]`);
        const line = leader?.querySelector("line");
        const dot = leader?.querySelector("circle");
        const far = Math.hypot(ex - l.ax, ey - l.ay) > 3;
        line?.setAttribute("x1", l.ax.toFixed(1));
        line?.setAttribute("y1", l.ay.toFixed(1));
        line?.setAttribute("x2", (far ? ex : l.ax).toFixed(1));
        line?.setAttribute("y2", (far ? ey : l.ay).toFixed(1));
        dot?.setAttribute("cx", l.ax.toFixed(1));
        dot?.setAttribute("cy", l.ay.toFixed(1));
      });
      el.dataset.placed = "true";
      placeCard();
    };

    const placeCard = () => {
      const key = openRef.current;
      const i = places.findIndex((p) => p.key === key);
      if (i < 0 || !boxes[i]) return;
      const card = el.querySelector<HTMLElement>(`#estate3d-${CSS.escape(key!)}`);
      if (!card) return;
      const others = boxes.filter((_, j) => j !== i);
      const noteFoot = note ? note.offsetTop + note.offsetHeight : 0;
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

    const frame = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h || (w === size.w && h === size.h)) return;
      size = { w, h };
      renderer.setSize(w, h, false);
      fit(w, h);
      renderer.render(scene, camera);
      layout();
    };

    let lit: string | null = null;
    const highlight = (key: string | null) => {
      if (key === lit) return;
      lit = key;
      for (const [k, m] of placeEdges) {
        const on = k === key;
        m.color.copy(on ? token.pelagos : token.phrygana);
        m.opacity = on ? 1 : EDGE_OPACITY;
      }
      renderer.render(scene, camera);
    };

    controls.current = { highlight, placeCard };

    /* A ResizeObserver delivers at most once per rendering frame, so it needs no throttle of its own; `frame` skips an unchanged size. */
    const ro = new ResizeObserver(frame);
    ro.observe(el);
    frame();
    /* The buttons' widths depend on the web font; a late font would leave them measured in the fallback. */
    document.fonts?.ready.then(() => {
      if (!disposed) layout();
    });

    const lost = (e: Event) => {
      e.preventDefault();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      disposed = true;
      controls.current = null;
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      /* A context the browser has already taken back cannot be released again, and asking throws a warning. */
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      canvas.remove();
      delete el.dataset.placed;
    };
  }, [plan, places, onFail]);

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
    <div ref={host} className={`estate-map-frame estate-map-frame--3d${plan.preview ? " estate-map-frame--preview" : ""}`}>
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
