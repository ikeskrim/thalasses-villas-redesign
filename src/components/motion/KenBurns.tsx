"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero move (elevation spec §1).
 *
 * The owner's MP4 is not yet available — extracting one from YouTube is not
 * something this build will do — so the hero ships with the specified fallback:
 * a very slow push on the single best still, 1.0 -> 1.06 over 20 seconds.
 *
 * Slow enough to read as breathing rather than as animation. When the master
 * file lands in content/media/, this component is swapped for a poster-first
 * <video> and nothing else on the page changes.
 */
export function KenBurns({
  src,
  alt,
  width,
  height,
  objectPosition = "50% 50%",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="kenburns"
      initial={reduced ? { scale: 1 } : { scale: 1 }}
      animate={reduced ? { scale: 1 } : { scale: 1.06 }}
      transition={reduced ? { duration: 0 } : { duration: 20, ease: "linear" }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={82}
        style={{ objectFit: "cover", objectPosition }}
      />
      <span className="sr-only">{`${width}×${height}`}</span>
    </motion.div>
  );
}
