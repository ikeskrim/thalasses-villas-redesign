"use client";

import Image from "next/image";
import { useState } from "react";

import { ImageReveal } from "@/components/motion/Reveal";
import { Lightbox, type Frame } from "@/components/sections/Lightbox";

export interface Cluster {
  title: string;
  beat: string;
  frames: Frame[];
}

/**
 * THE GALLERY — clusters, not one endless grid.
 *
 * D's one-idea-per-viewport rule applies BETWEEN clusters rather than between
 * photographs: a gallery whose every frame is its own screen is a slideshow,
 * and a gallery with no pause at all is a contact sheet. So each cluster is a
 * named group with air around it, and inside a cluster the frames breathe
 * against each other.
 *
 * LOW-IMAGE DISCIPLINE, inherited from `TheRun`: a cluster of one or two frames
 * is laid out as a deliberately large plate rather than as a grid with holes.
 * The layout is a function of the count.
 *
 * Every thumbnail is a real <button>, so the lightbox opens by keyboard and by
 * tap, not only by mouse.
 */
export function GalleryGrid({ clusters }: { clusters: Cluster[] }) {
  const all = clusters.flatMap((c) => c.frames);
  const [open, setOpen] = useState<number | null>(null);
  let running = 0;

  return (
    <>
      {clusters.map((cluster) => {
        const start = running;
        running += cluster.frames.length;
        const sparse = cluster.frames.length <= 2;

        return (
          <section key={cluster.title} className="canon d-gallery-cluster">
            <p className="micro">
              {cluster.beat} — {cluster.title}
            </p>
            <ul className={`d-gallery-grid${sparse ? " d-gallery-grid--sparse" : ""}`}>
              {cluster.frames.map((f, i) => (
                <li key={f.src} className="d-gallery-cell">
                  <button
                    type="button"
                    className="d-gallery-btn"
                    onClick={() => setOpen(start + i)}
                    aria-label={`Open ${f.caption ?? f.alt}`}
                  >
                    <ImageReveal className="d-gallery-frame">
                      <Image
                        src={f.src}
                        alt={f.alt}
                        fill
                        sizes={sparse ? "(max-width: 767px) 100vw, 70vw" : "(max-width: 767px) 100vw, 33vw"}
                        quality={80}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      />
                    </ImageReveal>
                  </button>
                  {f.caption ? (
                    <p className="caption d-gallery-caption">{f.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Lightbox frames={all} openAt={open} onClose={() => setOpen(null)} />
    </>
  );
}
