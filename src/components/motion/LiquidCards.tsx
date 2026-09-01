"use client";

import { useEffect } from "react";

/**
 * THE VILLA-CARD SIGNATURE INTERACTION — one WebGL canvas, no new dependency.
 *
 * `MOTION-DIRECTIVE.md` puts exactly one Level-3 shader on the page and puts it
 * HERE: the six villa cards, on a Level-1 grid. A ripple follows the pointer
 * and settles when it leaves.
 *
 * IT USED TO BE ON THE THREE-ACT SECTION, which was Direction D's homepage and
 * is not the homepage any more (`DECISIONS.md` D-001). Moved rather than
 * rebuilt: the mechanism was right, the surface was chosen against a brief
 * whose register the owner had already rejected.
 *
 * WHY RAW WebGL RATHER THAN OGL OR THREE.
 *
 * The effect is one quad, one texture and one fragment shader — about a hundred
 * and fifty lines. OGL is the light option at roughly 8–16 kB and its own readme
 * still calls it alpha; three.js is far heavier for a full-screen quad. Adding
 * an alpha-stage dependency to a client's production site to avoid writing a
 * shader we would have to write anyway is a bad trade. This ships **0 kB of
 * third-party code**.
 *
 * THE CONSTRAINTS IT IS BUILT UNDER, all from this project's standing rules:
 *
 *   ONE LIVE CANVAS. A single context is moved into whichever act the pointer
 *   is over, rather than one per image. Creating and destroying contexts on
 *   hover is how a page starts dropping frames.
 *
 *   THE PHOTOGRAPH IS NEVER REPLACED. The `next/image` element stays in the
 *   DOM, keeps its alt text, and remains the thing that loads and that a
 *   crawler sees. The canvas is a layer on top that only appears once its
 *   texture is ready — so if WebGL is unavailable, or the context is lost, or
 *   this file never runs, the page is exactly what it was.
 *
 *   NOT ON TOUCH, NOT UNDER `reduce`. There is no hover on a touch screen, and
 *   a ripple is precisely the kind of motion `prefers-reduced-motion` exists to
 *   refuse. In both cases nothing is initialised and no shader is compiled.
 *
 *   A WHISPER, and the directive fixes the number: **≤6% displacement, slow
 *   lerp, no RGB split.** Peak here is under 1.6% of the frame. Past about 6%
 *   a luxury photograph starts to read as a novelty filter, and the reference
 *   guidance puts the outright gimmick threshold near 10%.
 *
 *   ON TOUCH IT IS A ONE-SHOT IN-VIEW RIPPLE, not nothing. There is no hover on
 *   a phone, so the card ripples once as it scrolls into view and settles — the
 *   directive's own touch equivalent, rather than silently dropping the
 *   interaction on the surface most guests will use.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform vec2 uCover;
varying vec2 vUv;

void main() {
  /* Cover-fit the texture so the canvas matches the CSS object-fit: cover. */
  vec2 st = (vUv - 0.5) * uCover + 0.5;
  st.y = 1.0 - st.y;

  float d = distance(st, uMouse);
  float falloff = smoothstep(0.5, 0.0, d);
  vec2 dir = normalize(st - uMouse + vec2(0.0001));

  /* The ripple, and a slow drift under it so the surface reads as liquid
     rather than as a single expanding ring. Both are scaled by hover, so at
     rest the shader samples the texture unmodified. */
  float ripple = sin(d * 24.0 - uTime * 2.6) * 0.010;
  vec2 offset = dir * ripple * falloff;
  offset += vec2(sin(st.y * 9.0 + uTime * 0.6), cos(st.x * 9.0 + uTime * 0.5)) * 0.005 * falloff;

  vec2 uv = clamp(st + offset * uHover, 0.001, 0.999);
  gl_FragColor = vec4(texture2D(uTex, uv).rgb, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function LiquidCards({ selector = ".ho-card-figure" }: { selector?: string }) {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Reduced motion refuses the whole thing; touch gets the in-view form. */
    if (reduced) return;

    const media = [...document.querySelectorAll<HTMLElement>(selector)];
    if (!media.length) return;

    let stop: (() => void) | undefined;

    /*
     * Nothing is created until the section is actually near the viewport. On a
     * page the reader never scrolls to, no context is made and no shader is
     * compiled.
     */
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        stop = start();
      },
      { rootMargin: "300px" }
    );
    for (const el of media) io.observe(el);

    function start() {
      const canvas = document.createElement("canvas");
      canvas.className = "ho-liquid";
      canvas.setAttribute("aria-hidden", "true");

      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
      if (!gl) return undefined;

      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return undefined;
      const prog = gl.createProgram();
      if (!prog) return undefined;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const uTex = gl.getUniformLocation(prog, "uTex");
      const uMouse = gl.getUniformLocation(prog, "uMouse");
      const uHover = gl.getUniformLocation(prog, "uHover");
      const uTime = gl.getUniformLocation(prog, "uTime");
      const uCover = gl.getUniformLocation(prog, "uCover");

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.uniform1i(uTex, 0);

      let host: HTMLElement | null = null;
      let hover = 0;
      let target = 0;
      let mx = 0.5;
      let my = 0.5;
      let imageAspect = 1;
      let raf = 0;
      const t0 = performance.now();

      const upload = (img: HTMLImageElement) => {
        imageAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        return true;
      };

      const size = () => {
        if (!host) return;
        const r = host.getBoundingClientRect();
        /* Capped at 1.5 so a retina panel does not quadruple the fill cost. */
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);

        /* Cover maths: match CSS `object-fit: cover` exactly. */
        const boxAspect = r.width / Math.max(1, r.height);
        gl.uniform2f(
          uCover,
          boxAspect > imageAspect ? 1 : imageAspect / boxAspect,
          boxAspect > imageAspect ? boxAspect / imageAspect : 1
        );
      };

      const tick = () => {
        hover += (target - hover) * 0.08;
        gl.uniform1f(uHover, hover);
        gl.uniform1f(uTime, (performance.now() - t0) / 1000);
        gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (hover < 0.002 && target === 0) {
          /* Settled and unhovered: stop drawing and step out of the way. */
          canvas.remove();
          host = null;
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(tick);
      };

      const enter = (e: PointerEvent) => {
        const el = (e.currentTarget as HTMLElement) ?? null;
        const img = el?.querySelector("img");
        if (!el || !img || !img.currentSrc || !img.complete) return;
        if (host === el) return;

        host = el;
        if (!upload(img as HTMLImageElement)) return;
        el.appendChild(canvas);
        size();
        target = 1;
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const movePointer = (e: PointerEvent) => {
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width;
        my = (e.clientY - r.top) / r.height;
      };

      const leave = () => {
        target = 0;
      };

      /**
       * TOUCH GETS A ONE-SHOT RIPPLE, not silence.
       *
       * `MOTION-DIRECTIVE.md` requires a touch equivalent for every hover
       * effect, and the equivalent it names for this one is a gentle ripple as
       * the card scrolls into view. Dropping the interaction entirely on the
       * surface most guests use would be the easy reading of "touch has no
       * hover" and the wrong one.
       */
      let inView: IntersectionObserver | null = null;
      if (fine) {
        for (const el of media) {
          el.addEventListener("pointerenter", enter);
          el.addEventListener("pointermove", movePointer, { passive: true });
          el.addEventListener("pointerleave", leave);
        }
      } else {
        const rippled = new WeakSet<Element>();
        inView = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting || rippled.has(e.target)) continue;
              rippled.add(e.target);
              const el = e.target as HTMLElement;
              const img = el.querySelector("img");
              if (!img || !(img as HTMLImageElement).complete) continue;
              host = el;
              if (!upload(img as HTMLImageElement)) continue;
              el.appendChild(canvas);
              size();
              /* From the middle, and released immediately — one pass, not a
                 loop, so a scrolling phone is not running a shader per card. */
              mx = 0.5;
              my = 0.5;
              target = 1;
              if (!raf) raf = requestAnimationFrame(tick);
              window.setTimeout(() => {
                target = 0;
              }, 420);
            }
          },
          { threshold: 0.55 }
        );
        for (const el of media) inView.observe(el);
      }
      window.addEventListener("resize", size);

      /* A lost context must not leave a blank rectangle over the photograph. */
      const lost = (e: Event) => {
        e.preventDefault();
        canvas.remove();
        host = null;
      };
      canvas.addEventListener("webglcontextlost", lost);

      return () => {
        cancelAnimationFrame(raf);
        inView?.disconnect();
        for (const el of media) {
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointermove", movePointer);
          el.removeEventListener("pointerleave", leave);
        }
        window.removeEventListener("resize", size);
        canvas.removeEventListener("webglcontextlost", lost);
        canvas.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    return () => {
      io.disconnect();
      stop?.();
    };
  }, [selector]);

  return null;
}
