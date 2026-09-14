import Image from "next/image";
import Link from "next/link";

import { LedgerInline, type LedgerEntry } from "@/components/ui/Ledger";

/**
 * THE ESTATE MAP'S CARD — the inside of it, shared by the 2D map and the 3D
 * diagram, so "opens the same card" is one component rather than two copies
 * that drift (DECISIONS.md D-021: hotspots with a keyboard equivalent; step B,
 * B4).
 *
 * D-020 recorded that the diagram's bare labels lost the card detail the 2D map
 * carries: the line, the ledger, the link. With this both maps render it from
 * the same `HOTSPOTS` entry. A drawn place the list does not carry (the helipad,
 * the Rituals venue) passes only the plan's name and route: no line is written
 * for it here, because none exists in content.
 *
 * The link says "Visit", as the 2D card always has, and it is the only thing on
 * either map that navigates: a marker or a place button opens its card and
 * nothing else, so a first tap on a phone never leaves the page.
 */
export function EstateMapCardContent({
  name,
  line,
  ledger,
  href,
  thumb,
}: {
  name: string;
  line?: string;
  ledger?: LedgerEntry[];
  href?: string | null;
  thumb?: string;
}) {
  return (
    <>
      {thumb ? (
        <span className="estate-map-thumb">
          <Image src={thumb} alt="" fill sizes="120px" quality={75} style={{ objectFit: "cover" }} />
        </span>
      ) : null}
      <span className="estate-map-card-body">
        <span className="estate-map-card-name">{name}</span>
        {line ? <span className="caption">{line}</span> : null}
        {ledger ? <LedgerInline entries={ledger} /> : null}
        {href ? (
          <Link href={href} className="micro estate-map-card-link">
            Visit
          </Link>
        ) : null}
      </span>
    </>
  );
}
