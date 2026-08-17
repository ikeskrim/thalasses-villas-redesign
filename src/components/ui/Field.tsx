import Image from "next/image";

import { imageDimensions, localImage } from "@/lib/content";

export interface FieldProps {
  /** A CDN URL from the inventory, or a local /images path. */
  src: string;
  alt: string;
  /**
   * The image's own horizon as a 0–1 fraction of its height. When supplied, the
   * frame is positioned so that horizon lands on the shared datum (56%), which
   * is what makes the waterline hold still across consecutive frames.
   * Omit for interiors, food and detail — those are never used full-bleed.
   */
  horizonY?: number;
  /** Viewport height of the frame. */
  height?: string;
  priority?: boolean;
  /** Content sits in the lower zone, over the scrim. */
  children?: React.ReactNode;
  className?: string;
}

const DATUM = 0.56;

/**
 * A full-bleed photograph (DESIGN-PLAN §2.5, §3.2).
 *
 * Two rules are enforced here rather than left to the caller:
 *  - The scrim is unconditional. At alpha 0.72 over a pure-white image the
 *    composite is #576366, where --limestone is 5.08:1 — AA body. That is the
 *    worst case that can physically occur, so no per-image luminance analysis
 *    is needed.
 *  - Consecutive Fields butt together with zero gap; whitespace between
 *    photographs of the sea would break the horizon.
 */
export function Field({
  src,
  alt,
  horizonY,
  height = "100svh",
  priority = false,
  children,
  className = "",
}: FieldProps) {
  const local = localImage(src);
  if (!local) return null;
  const dims = imageDimensions(src);

  // Shift the frame so the image's horizon sits on the shared datum.
  const objectPosition =
    horizonY != null
      ? `50% ${Math.min(100, Math.max(0, (horizonY - DATUM) * 100 + 50))}%`
      : "50% 50%";

  return (
    <section className={`field ${className}`} style={{ height }}>
      <Image
        src={local}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="100vw"
        quality={82}
        style={{ objectFit: "cover", objectPosition }}
        {...(dims ? {} : {})}
      />
      {children ? <div className="field-copy">{children}</div> : null}
    </section>
  );
}
