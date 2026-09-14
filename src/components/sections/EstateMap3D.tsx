"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BoxGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
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
  type BufferGeometry,
  type Material,
} from "three";

import {
  PLAN_APRON,
  PLAN_BOUNDS,
  PLAN_COMPOUND,
  PLAN_HELIPAD,
  PLAN_LANE,
  PLAN_POOLS,
  PLAN_SPOTS,
  PLAN_VILLAS,
  SHORE_Z,
} from "./estate-plan";

/**
 * THE ESTATE MAP, IN THREE DIMENSIONS — an experiment (`feat/estate-3d`).
 *
 * A DIAGRAM, NEVER A PICTURE. Flat colour, box massing, no textures, no
 * photographs, no sky: the property imagery rule is that guests book what they
 * see, and a rendered villa is something nobody can book. This draws where
 * things are, in the site's own palette, and says on its face that it is not
 * a survey.
 *
 * COST DISCIPLINE, from the project's standing rules:
 *  - One canvas, one context, created only when `EstateMap` decides this page
 *    wants it (WebGL present, reduced motion off, the section near the
 *    viewport). Nothing here is imported otherwise, so three.js is not in any
 *    route's initial JavaScript.
 *  - Render on demand. There is no animation loop: one frame after build, one
 *    per resize. The motion budget is untouched because nothing moves.
 *  - Everything created is disposed on unmount, and the context is released.
 *
 * ACCESSIBILITY: the canvas is `aria-hidden`. Every place it shows is a real
 * link or label in the DOM, positioned over its spot, and the permanent list
 * beneath the map is unchanged.
 */

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(v || fallback);
};

export function EstateMap3D({ onFail }: { onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Record<string, { left: number; top: number }>>({});

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

    const palette = {
      /* The site's own tokens (globals.css), read live so a palette change reaches the diagram. */
      ground: cssColor("--color-limestone", "#e8e9e3"),
      sea: cssColor("--color-pelagos", "#14535f"),
      sand: new Color("#e6d7b8"),
      lane: new Color("#cfc6b6"),
      villa: new Color("#fbfaf6"),
      pool: new Color("#5fb3b8"),
      line: new Color("#8a8275"),
      pad: new Color("#d9b44a"),
    };

    const scene = new Scene();
    scene.background = palette.ground;
    const disposables: (BufferGeometry | Material)[] = [];
    const flat = (w: number, d: number, color: Color, x: number, z: number, y = 0) => {
      const g = new PlaneGeometry(w, d);
      const m = new MeshLambertMaterial({ color });
      disposables.push(g, m);
      const mesh = new Mesh(g, m);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    /*
     * Ground, sea, beach line. Far larger than the plan on purpose: an
     * orthographic camera looking down at an angle shows a plane's corners
     * as diagonal cuts across the frame, and the first render had exactly
     * that. At this size no edge can enter the view at any aspect ratio.
     */
    const cx = (PLAN_BOUNDS.minX + PLAN_BOUNDS.maxX) / 2;
    const FIELD = 800;
    flat(FIELD, FIELD / 2, palette.ground, cx, SHORE_Z + FIELD / 4);
    flat(FIELD, FIELD / 2, palette.sea, cx, SHORE_Z - FIELD / 4, 0.01);
    flat(FIELD, 3.5, palette.sand, cx, SHORE_Z + 1.75, 0.02);

    /* Lane, apron, compound outline. */
    flat(PLAN_LANE.w, PLAN_LANE.d, palette.lane, PLAN_LANE.x, PLAN_LANE.z, 0.03);
    flat(PLAN_APRON.w, PLAN_APRON.d, palette.lane, PLAN_APRON.x, PLAN_APRON.z, 0.03);
    const outlineGeo = new EdgesGeometry(new BoxGeometry(PLAN_COMPOUND.w, 0.6, PLAN_COMPOUND.d));
    const outlineMat = new LineBasicMaterial({ color: palette.line });
    disposables.push(outlineGeo, outlineMat);
    const outline = new LineSegments(outlineGeo, outlineMat);
    outline.position.set(PLAN_COMPOUND.x, 0.3, PLAN_COMPOUND.z);
    scene.add(outline);

    /* Helipad: a disc and the letter, as two bars and a crossbar. */
    const padGeo = new CircleGeometry(PLAN_HELIPAD.r, 40);
    const padMat = new MeshLambertMaterial({ color: palette.lane.clone().offsetHSL(0, 0, -0.08) });
    disposables.push(padGeo, padMat);
    const pad = new Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(PLAN_HELIPAD.x, 0.05, PLAN_HELIPAD.z);
    scene.add(pad);
    for (const [w, d, dx] of [
      [0.5, 3.2, -1],
      [0.5, 3.2, 1],
      [2, 0.5, 0],
    ] as const) {
      flat(w, d, palette.pad, PLAN_HELIPAD.x + dx, PLAN_HELIPAD.z, 0.07);
    }

    /* Villas and pools: massing only. */
    for (const v of PLAN_VILLAS) {
      const g = new BoxGeometry(v.w, v.h, v.d);
      const m = new MeshLambertMaterial({ color: palette.villa });
      const e = new EdgesGeometry(g);
      const lm = new LineBasicMaterial({ color: palette.line });
      disposables.push(g, m, e, lm);
      const box = new Mesh(g, m);
      box.position.set(v.x, v.h / 2, v.z);
      scene.add(box);
      const edges = new LineSegments(e, lm);
      edges.position.copy(box.position);
      scene.add(edges);
    }
    for (const p of PLAN_POOLS) flat(p.w, p.d, palette.pool, p.x, p.z, 0.08);

    scene.add(new HemisphereLight(0xffffff, 0xd8cfbf, 1.6));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(-30, 50, 20);
    scene.add(sun);

    /* An isometric-leaning orthographic view from the south-west, sea at the top. */
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    camera.position.set(-40, 60, 55);
    const target = new Vector3(-6, 0, -8);
    camera.lookAt(target);

    const frame = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const half = 30;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const next: Record<string, { left: number; top: number }> = {};
      for (const s of PLAN_SPOTS) {
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
  }, [onFail]);

  return (
    <div ref={host} className="estate-map-frame estate-map-frame--3d">
      {PLAN_SPOTS.map((s) => {
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
        Two lengths of the same note; CSS shows one. On a phone the 4:3 frame
        is too small for the long one without covering the drawing, and the
        note cannot move below the frame without pushing the page (see
        patterns.css). The owner's open question is word for word in both.

        Both lengths say that the list carries every place, because the
        diagram does not carry every place, and it has to say so. The 2D map
        has nine hotspots. This drawing labels six of them (four villas, the
        beach and the pool line) and adds the helipad, which the 2D map never
        had. The long table and the vegetable garden are not placed, because no
        aerial on record establishes where they are, and a label here would be
        a position invented for them. Villa Pueblo is not drawn either
        (estate-plan.ts). All nine stay in the numbered list beneath the map,
        which this component never touches. On a phone, where every label is
        hidden, the list is the whole map.

        The phone says it as "all listed", not with the long note's sentence,
        to keep the band across the top of the frame at or near the height it
        had before. Estimated with Inter's own advance widths (11px, 0.01em
        tracking, kerning ignored), not rendered: this wording wraps to two
        lines at 390–430 px, as the note did before; three at 375 px, where it
        was two; three at 360 px, as before. The full sentence would have taken
        three lines at every phone width up to 430 px.
      */}
      <p className="caption estate-map-3d-note">
        <span className="estate-map-3d-note-long">
          A diagram, not a survey — drawn from the estate&rsquo;s aerial photographs. Villa Pueblo is set
          apart from the four and is not drawn. The list below carries every place. [TODO: owner to confirm
          which house in each row is which]
        </span>
        <span className="estate-map-3d-note-short">
          A diagram, not a survey. Villa Pueblo not drawn; all listed. [TODO: owner to confirm which house in
          each row is which]
        </span>
      </p>
    </div>
  );
}
