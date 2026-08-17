import Image from "next/image";
import Link from "next/link";

import { ImageReveal, Reveal } from "@/components/motion/Reveal";
import { Clause } from "@/components/ui/Clause";
import { localImage } from "@/lib/content";
import type { Villa } from "@/types/content";

/**
 * Beat 04 — THE COLLECTION (DESIGN-PLAN §6.1).
 *
 * The four estate villas are near-identical on paper — 2/1/4, 2/1/4, 3/2/6,
 * 2/2/4 — so any layout that leads on those numbers is lying about what
 * separates them. They are differentiated by POSITION and by one verified fact
 * each, and the datum rule is the real spatial axis: the front row sits below
 * it with the sea at eye level, the rear row above it with the sea arriving at
 * the first floor.
 *
 * Villa Pueblo is the fifth, and is deliberately not placed in that geometry —
 * it is not part of the estate, it is adults-only, and it has its own beach
 * access. Giving it a separate register is honest rather than tidy.
 *
 * No spec table, no icons, no badges, no "from €" strip.
 */

interface Cell {
  villa: Villa;
  ordinal: string;
  gerund: string;
  tail: string;
}

function VillaCell({ cell, index }: { cell: Cell; index: number }) {
  const { villa, ordinal, gerund, tail } = cell;
  const src = localImage(villa.gallery.heroImage);
  if (!src) return null;

  return (
    <Reveal as="article" index={index} className="collection-cell">
      <Link href={`/en/villas/${villa.slug}`} className="collection-link">
        <ImageReveal className="collection-figure">
          <Image
            src={src}
            alt={`${villa.name}, Thalasses Villas`}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            quality={80}
            style={{ objectFit: "cover" }}
          />
        </ImageReveal>
        <p className="tabular collection-ordinal">{ordinal}</p>
        <h3 className="display c3 collection-name">{villa.name}</h3>
        <Clause gerund={gerund} tail={tail} scale="c4" as="p" />
      </Link>
    </Reveal>
  );
}

export function Collection({
  front,
  rear,
  fifth,
}: {
  front: Cell[];
  rear: Cell[];
  fifth?: Cell;
}) {
  return (
    <section className="canon collection">
      <span className="ghost ghost--left" aria-hidden="true">04</span>
      <Reveal>
        <p className="micro">04 — The Collection</p>
        <div className="clause-field" style={{ marginTop: "var(--spacing-step-4)" }}>
          <Clause gerund="Choosing" tail="One of five" scale="c2" as="h2" />
        </div>
      </Reveal>

      {/* Rear row sits above the datum — two-storey, sea from the first floor. */}
      <div className="collection-row collection-row--rear">
        {rear.map((c, i) => (
          <VillaCell key={c.villa.id} cell={c} index={i} />
        ))}
      </div>

      {/* The datum: the same 1px --pelagos line as the hero and the ledger. */}
      <div className="datum-rule" role="presentation" />

      {/* Front row sits below the datum — single-storey, sea at eye level. */}
      <div className="collection-row collection-row--front">
        {front.map((c, i) => (
          <VillaCell key={c.villa.id} cell={c} index={i} />
        ))}
      </div>

      {fifth ? (
        <div className="collection-fifth">
          <VillaCell cell={fifth} index={0} />
        </div>
      ) : null}
    </section>
  );
}

export type { Cell as CollectionCell };
