"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { Magnetic } from "@/components/motion/Magnetic";
import { Clause } from "@/components/ui/Clause";

export interface PinnedEstateProps {
  image: string;
  alt: string;
  figures: { value: number | string; label: string }[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * The one pinned storytelling beat (elevation spec §3).
 *
 * The photograph holds still, filling the viewport, while the estate's case
 * scrolls over it — the only moment on the site where the page stops advancing
 * and something is argued. It is spent here because the full-estate buyout is
 * the highest-value thing Thalasses sells.
 *
 * Built with CSS `position: sticky` and a scroll-linked opacity rather than a
 * GSAP ScrollTrigger pin: sticky cannot desynchronise from the scrollbar, it
 * needs no layout measurement, and it degrades to a plain tall section if the
 * script never runs.
 *
 * Under prefers-reduced-motion the pin remains — it is layout, not animation —
 * but the cross-fade is replaced by everything simply being visible.
 */
export function PinnedEstate({ image, alt, figures, ctaLabel, ctaHref }: PinnedEstateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const veil = useTransform(scrollYProgress, [0, 0.35, 1], [0.15, 0.55, 0.72]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1]);

  return (
    <section ref={ref} className="pinned on-dark" aria-label="The Entire Estate">
      <div className="pinned-sticky">
        <motion.div className="pinned-media" style={reduced ? undefined : { scale }}>
          <Image
            src={image}
            alt={alt}
            fill
            sizes="100vw"
            quality={82}
            style={{ objectFit: "cover" }}
          />
        </motion.div>
        <motion.div
          className="pinned-veil"
          style={reduced ? { opacity: 0.62 } : { opacity: veil }}
          aria-hidden="true"
        />

        <div className="pinned-copy canon">
          <p className="micro">The Entire Estate</p>
          <div className="clause-field">
            <Clause gerund="Gathering" tail="All four, one gate" scale="c1" as="h2" />
          </div>
          <p className="lede pinned-lede">
            Take the four villas as one house — nine bedrooms, four private pools, and a table that
            seats eighteen with the sea fifty metres away.
          </p>

          <dl className="pinned-figures">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="micro">{f.label}</dt>
                <dd className="display c3 tabular">{f.value}</dd>
              </div>
            ))}
          </dl>

          <p className="pinned-cta">
            <Magnetic>
              <Link href={ctaHref} className="btn-primary micro" data-cursor="Enquire">
                {ctaLabel}
              </Link>
            </Magnetic>
          </p>
        </div>
      </div>
    </section>
  );
}
