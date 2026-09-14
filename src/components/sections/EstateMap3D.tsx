"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Float32BufferAttribute,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";

import type { Footprint, RenderElement, RenderPlan } from "@/lib/estate-plan-gate";

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
 * COST DISCIPLINE, from the project's standing rules:
 *  - One canvas, one context, created only when `EstateMap` decides this page
 *    wants it. Nothing here is imported otherwise, so three.js is not in any
 *    route's initial JavaScript.
 *  - Render on demand. There is no animation loop: one frame after build, one
 *    per resize. The motion budget is untouched because nothing moves.
 *  - Everything created is disposed on unmount, and the context is released.
 *
 * ACCESSIBILITY: the canvas is `aria-hidden`. Every place it shows is a real
 * link or label in the DOM, positioned over its spot, and the permanent list
 * beneath the map is unchanged.
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
/** A storey, in plan units. Only the villas' storey counts are on record (content/villas/203.json:23), not heights. */
const STOREY = 2.6;

type Spot = { id: string; label: string; href: string | null; at: [number, number, number]; kind: string; hang?: "below" };

const rectOf = (f: Footprint | null, fallback: [number, number]): [number, number] => (f && "w" in f ? [f.w, f.d] : fallback);

const shorePoints = (e: RenderElement, span: number): [number, number][] => {
  const f = e.footprint;
  if (f && "points" in f) return [...f.points].sort((a, b) => a[0] - b[0]);
  return [
    [e.position.x - span, e.position.z],
    [e.position.x + span, e.position.z],
  ];
};

/** Every [x, z] an element occupies, for framing the camera. */
function extent(e: RenderElement): [number, number][] {
  const f = e.footprint;
  if (f && "points" in f) return f.points;
  const { x, z } = e.position;
  const [w, d] = rectOf(f, [2, 2]);
  const r = Math.hypot(w, d) / 2;
  return [
    [x - r, z - r],
    [x + r, z + r],
  ];
}

/** The plan's framing: its extent, its centre, and the span the camera fits. */
function framing(plan: RenderPlan) {
  const all = plan.elements.flatMap(extent);
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minZ = Math.min(...all.map((p) => p[1]));
  const maxZ = Math.max(...all.map((p) => p[1]));
  return { midX: (minX + maxX) / 2, midZ: (minZ + maxZ) / 2, span: Math.max(maxX - minX, maxZ - minZ, 20) };
}

/**
 * Where each label stands, in plan units. Pure: derived from the plan alone, so
 * it is computed once per plan rather than set from inside the renderer.
 */
function planSpots(plan: RenderPlan): Spot[] {
  const spots: Spot[] = [];
  const spot = (e: RenderElement, at: [number, number, number], hang?: "below") =>
    spots.push({ id: e.id, label: e.name, href: e.href, at, kind: e.kind, hang });

  for (const e of plan.elements) {
    const { x, z } = e.position;
    switch (e.kind) {
      case "shore":
        /*
         * Drawn, never labelled. The site has no name on record for the
         * shoreline itself: "private beach" is only a caption on a garden-path
         * photograph and a sunbed sign (content/estate-plan.json, beach-line),
         * and a label here would be a name invented for it. The numbered list
         * beneath carries "The private beach" as the 2D map does.
         */
        break;
      case "venue":
      case "table":
      case "garden":
        spot(e, [x, 0.5, z]);
        break;
      case "helipad": {
        const [w] = rectOf(e.footprint, [8, 8]);
        /* Anchored beyond the pad, not on it: a label over the pad would cover the letter. */
        spot(e, [x, 0.5, z - w / 2 - 1.5]);
        break;
      }
      case "villa":
        spot(e, [x, STOREY * (e.storeys ?? 1) + 0.6, z]);
        break;
    }
  }

  /*
   * THE POOL LINE: one label for the four villas' pools, as the 2D map has one
   * hotspot for them. Anchored at the land-side end of the villa pool nearest
   * the lane (lowest x, then highest z), hanging below — the placement D-020
   * found clears the villa labels. Derived from the drawn pools, never typed in.
   *
   * Only the villa pools, by id: the plan also draws the Rituals pool on the
   * venue's terrace, which is a pool but not one of "the pool line", and which
   * would otherwise be the lowest x and take the label out to the shore.
   */
  const VILLA_POOL_IDS = new Set(["thoi-pool", "persi-pool", "melia-pool", "eeanthe-pool"]);
  const pools = plan.elements.filter((e) => e.kind === "pool" && VILLA_POOL_IDS.has(e.id));
  if (pools.length) {
    const anchor = [...pools].sort((a, b) => a.position.x - b.position.x || b.position.z - a.position.z)[0]!;
    const [, d] = rectOf(anchor.footprint, [2.4, 4]);
    spots.push({ id: "pools", label: "The pool line", href: null, kind: "pools", at: [anchor.position.x, 0.15, anchor.position.z + d / 2], hang: "below" });
  }
  return spots;
}

export function EstateMap3D({ plan, onFail }: { plan: RenderPlan; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Record<string, { left: number; top: number }>>({});
  const spots = useMemo(() => planSpots(plan), [plan]);

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
    const palette = {
      ground: cssColor("--color-limestone", "#e8e9e3"),
      sea: cssColor("--color-pelagos", "#14535f"),
      sand: cssColor("--color-ammos", "#e3d5bd"),
      line: cssColor("--color-phrygana", "#8a8275"),
      mark: cssColor("--color-basalt", "#16262b"),
    };
    const villaColor = palette.ground.clone().lerp(new Color("#ffffff"), 0.55);
    const poolColor = palette.sea.clone().lerp(palette.ground, 0.45);
    const surface = palette.sand.clone().lerp(palette.ground, 0.35);

    const scene = new Scene();
    scene.background = palette.ground;
    const disposables: { dispose: () => void }[] = [];
    const lambert = (color: Color, doubleSided = false) => {
      const m = new MeshLambertMaterial({ color });
      /* A hand-built surface's winding follows its outline's direction, so it is seen from both sides. */
      if (doubleSided) m.side = 2;
      disposables.push(m);
      return m;
    };
    const add = (g: BufferGeometry, m: Material, x = 0, y = 0, z = 0) => {
      disposables.push(g);
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };
    const surfaceFrom = (pos: number[]) => {
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    };
    /** A flat rectangle on the ground, turned about the vertical axis. */
    const rect = (w: number, d: number, color: Color, x: number, z: number, y: number, deg = 0) => {
      const g = new PlaneGeometry(w, d);
      g.rotateX(-Math.PI / 2);
      g.rotateY(deg * DEG);
      return add(g, lambert(color), x, y, z);
    };
    /** A flat polygon from its outline, fanned from the centroid (the plan's outlines are near-convex). */
    const polygon = (pts: [number, number][], color: Color, y: number) => {
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const pos: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        pos.push(cx, y, cz, b[0], y, b[1], a[0], y, a[1]);
      }
      return add(surfaceFrom(pos), lambert(color, true));
    };
    /** A band of constant width along a polyline. */
    const band = (pts: [number, number][], width: number, color: Color, y: number) => {
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
      return add(surfaceFrom(pos), lambert(color, true));
    };
    const outline = (pts: [number, number][], y: number) => {
      const pos: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        pos.push(a[0], y, a[1], b[0], y, b[1]);
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(pos, 3));
      const m = new LineBasicMaterial({ color: palette.line });
      disposables.push(g, m);
      scene.add(new LineSegments(g, m));
    };

    const { midX, midZ, span } = framing(plan);

    /*
     * The ground. Far larger than the plan on purpose: an orthographic camera
     * looking down at an angle shows a plane's corners as diagonal cuts across
     * the frame, and the first render had exactly that. At this size no edge
     * can enter the view at any aspect ratio.
     */
    const FIELD = 800;
    rect(FIELD, FIELD, palette.ground, midX, midZ, 0);

    for (const e of plan.elements) {
      const { x, z } = e.position;
      const deg = e.orientationDeg;
      const f = e.footprint;
      switch (e.kind) {
        case "shore": {
          /* The shoreline: sea on its sea-ward side (negative z), a sand band on the land side. */
          const pts = shorePoints(e, span);
          const line: [number, number][] = [[midX - FIELD / 2, pts[0]![1]], ...pts, [midX + FIELD / 2, pts[pts.length - 1]![1]]];
          const far = Math.min(...line.map((p) => p[1])) - FIELD / 2;
          const sea: number[] = [];
          for (let i = 0; i < line.length - 1; i++) {
            const [x1, z1] = line[i]!;
            const [x2, z2] = line[i + 1]!;
            sea.push(x1, 0.01, z1, x2, 0.01, far, x2, 0.01, z2);
            sea.push(x1, 0.01, z1, x1, 0.01, far, x2, 0.01, far);
          }
          add(surfaceFrom(sea), lambert(palette.sea, true));
          band(
            line.map(([px, pz]) => [px, pz + 0.8] as [number, number]),
            1.6,
            palette.sand,
            0.02
          );
          break;
        }
        case "lane": {
          if (f && "points" in f) band(f.points, 2.2, surface, 0.03);
          else {
            const [w, d] = rectOf(f, [2.2, 20]);
            rect(w, d, surface, x, z, 0.03, deg);
          }
          break;
        }
        case "compound": {
          if (f && "points" in f) outline(f.points, 0.05);
          break;
        }
        case "apron":
        case "venue":
        case "table":
        case "garden": {
          const color = e.kind === "garden" ? palette.line.clone().lerp(palette.ground, 0.6) : surface;
          if (f && "points" in f) polygon(f.points, color, 0.04);
          else {
            const [w, d] = rectOf(f, [2, 2]);
            rect(w, d, color, x, z, 0.04, deg);
          }
          break;
        }
        case "helipad": {
          const [w] = rectOf(f, [8, 8]);
          const g = new CircleGeometry(w / 2, 40);
          g.rotateX(-Math.PI / 2);
          add(g, lambert(surface.clone().offsetHSL(0, 0, -0.06)), x, 0.05, z);
          /* The letter, as two bars and a crossbar — in basalt. DESIGN-PLAN.md bans gold, ochre and brass. */
          const s = w / 8;
          const c = Math.cos(deg * DEG);
          const sn = Math.sin(deg * DEG);
          for (const [bw, bd, dx] of [
            [0.5 * s, 3.2 * s, -1 * s],
            [0.5 * s, 3.2 * s, 1 * s],
            [2 * s, 0.5 * s, 0],
          ] as const) {
            rect(bw, bd, palette.mark, x + dx * c, z - dx * sn, 0.07, deg);
          }
          break;
        }
        case "villa": {
          const [w, d] = rectOf(f, [7, 6]);
          const h = STOREY * (e.storeys ?? 1);
          const g = new BoxGeometry(w, h, d);
          g.rotateY(deg * DEG);
          const box = add(g, lambert(villaColor), x, h / 2, z);
          const edges = new EdgesGeometry(g);
          const lm = new LineBasicMaterial({ color: palette.line });
          disposables.push(edges, lm);
          const lines = new LineSegments(edges, lm);
          lines.position.copy(box.position);
          scene.add(lines);
          break;
        }
        case "pool": {
          const [w, d] = rectOf(f, [2.4, 4]);
          rect(w, d, poolColor, x, z, 0.08, deg);
          break;
        }
      }
    }

    scene.add(new HemisphereLight(0xffffff, palette.sand.getHex(), 1.6));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(midX - 30, 50, midZ + 20);
    scene.add(sun);

    /* An orthographic view from the land side, with the sea at the top of the frame. */
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    camera.position.set(midX - 34, 60, midZ + 63);
    camera.lookAt(new Vector3(midX, 0, midZ));

    const frame = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const half = span * 0.55;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const next: Record<string, { left: number; top: number }> = {};
      for (const s of spots) {
        const v = new Vector3(...s.at).project(camera);
        next[s.id] = { left: (v.x * 0.5 + 0.5) * w, top: (-v.y * 0.5 + 0.5) * h };
      }
      setPlaced(next);
    };

    const ro = new ResizeObserver(frame);
    ro.observe(el);
    frame();

    const lost = (e: Event) => {
      e.preventDefault();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [plan, spots, onFail]);

  const notDrawn = plan.notDrawn.length ? `Not drawn: ${plan.notDrawn.join(", ")}. ` : "";

  return (
    <div ref={host} className={`estate-map-frame estate-map-frame--3d${plan.preview ? " estate-map-frame--preview" : ""}`}>
      {spots.map((s) => {
        const p = placed[s.id];
        if (!p) return null;
        return (
          <span
            key={s.id}
            className={`estate-map-3d-spot estate-map-3d-spot--${s.kind}`}
            /* patterns.css stands every label on its anchor; a "below" spot overrides only the vertical half of that. */
            style={{ left: p.left, top: p.top, ...(s.hang === "below" ? { transform: "translate(-50%, 0)" } : null) }}
          >
            {s.href ? (
              <Link href={s.href} className="micro estate-map-3d-label">
                {s.label}
              </Link>
            ) : (
              <span className="micro estate-map-3d-label">{s.label}</span>
            )}
          </span>
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
