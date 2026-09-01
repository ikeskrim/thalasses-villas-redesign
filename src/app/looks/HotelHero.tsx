"use client";

import { useEffect, useState } from "react";

/**
 * THE HOTEL HERO — the only interactive part of Direction F.
 *
 * Everything else on that page is a server component reading the registry, so
 * this is the whole of the JavaScript the direction costs. That split is not
 * housekeeping: `hotel-data.ts` reaches the villa registry through
 * `@/lib/content`, which is `server-only`, and a client component importing it
 * fails the build outright. Keeping the interactive surface this small is what
 * lets the rest of the page stay on the server.
 *
 * THE SLIDER STOPS FOR REDUCED MOTION BY NEVER STARTING. The media query is
 * read inside the interval effect rather than mirrored into state, so there is
 * no `setState` during an effect and no first transition for a reader who asked
 * for none — a slider that begins and is then cancelled has already moved once.
 */

export interface HeroFrame {
  src: string;
  alt: string;
}

export default function HotelHero({
  frames,
  line,
  paragraph,
  status,
}: {
  frames: HeroFrame[];
  line: string;
  paragraph: string;
  status: string;
}) {
  const [slide, setSlide] = useState(0);
  /* Set only by a click. Choosing a frame by hand stops the rotation. */
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((n) => (n + 1) % frames.length), 7000);
    return () => clearInterval(id);
  }, [paused, frames.length]);

  return (
    <section className="ho-hero" aria-label="Thalasses Villas">
      {/*
        THE VIDEO SLOT. Until the owner supplies footage this is a slow
        three-frame slider with a Ken Burns move on each. `content/image-sources.md`
        §5 already specifies the clip; dropping it into `public/video/` replaces
        this without touching the layout around it.
      */}
      {frames.map((f, i) => (
        <div className="ho-slide" key={f.src} data-on={i === slide ? "true" : "false"} aria-hidden={i !== slide}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.src}
            /* Only the first frame is described: the other two are the same
               subject re-shot, and three alts on one hero is three readings of
               a decoration. */
            alt={i === 0 ? f.alt : ""}
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      ))}
      <div className="ho-hero-scrim" aria-hidden="true" />

      <div className="ho-hero-copy">
        <h1>{line}</h1>
        <p>{paragraph}</p>
        <p className="ho-draft">{status}</p>
      </div>

      <div className="ho-dots">
        {frames.map((f, i) => (
          <button
            key={f.src}
            type="button"
            aria-current={i === slide ? "true" : undefined}
            aria-label={`Show image ${i + 1} of ${frames.length}`}
            onClick={() => {
              setPaused(true);
              setSlide(i);
            }}
          />
        ))}
      </div>
    </section>
  );
}
