"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Clause } from "@/components/ui/Clause";
import { Ledger, LedgerInline, type LedgerEntry } from "@/components/ui/Ledger";
import { Magnetic } from "@/components/motion/Magnetic";

export interface Hotspot {
  id: string;
  label: string;
  line: string;
  /** Percentage position on the frame. */
  x: number;
  y: number;
  href?: string;
  thumb?: string;
  ledger?: LedgerEntry[];
}

/**
 * PATTERN 3 — THE ESTATE MAP.
 *
 * Their annotated product render, translated. Ours is better suited to the
 * pattern than theirs, because the product IS a place: one aerial frame with
 * markers a visitor opens to learn what they are looking at.
 *
 * Accessibility is the whole design, not a pass afterwards:
 *  - every marker is a real <button>, in the tab order, operable by Enter/Space
 *  - opening one sets aria-expanded and reveals a card that is also in the DOM
 *    order right after its marker
 *  - beneath the frame there is a permanent LIST of the same places, so the
 *    information is never locked behind a pointer, a hover, or a working script
 *
 * Under reduced motion the card simply appears rather than animating.
 */
export function EstateMap({
  image,
  alt,
  hotspots,
  ledger,
  ctaLabel,
  ctaHref,
  beat = "05",
}: {
  image: string;
  alt: string;
  hotspots: Hotspot[];
  ledger: LedgerEntry[];
  ctaLabel: string;
  ctaHref: string;
  /**
   * Beat number in the HOST page's spine. It was hard-coded to the homepage's
   * "06", so /en/the-estate printed a beat number belonging to a different
   * document — the first thing that goes wrong when a numbered system is copied
   * into a shared component instead of being passed to it.
   *
   * `null` suppresses the label entirely, for the case where the map is the
   * second half of a beat that has already announced itself.
   */
  beat?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="estate-map canon" aria-label="The estate">
      {beat === null ? null : <p className="micro">{beat} — The Estate</p>}

      {/*
        This section carries the whole-estate proposition now that the pinned
        beat has given way to the map. Two things had to come with it: the
        clause, and the enquiry CTA — the estate is the highest-value thing
        Thalasses sells and it briefly had no call to action on this page.

        The heading is the Clause, not an invented line. An earlier draft read
        "Nine acres of it, marked." — the estate's area appears nowhere in the
        inventory, so that figure was fabricated and is gone.
      */}
      <div className="clause-field estate-map-heading">
        <Clause gerund="Gathering" tail="All four, one gate" scale="c2" as="h2" />
      </div>
      <Ledger entries={ledger} className="estate-map-ledger" />

      <div className="estate-map-frame">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="100vw"
          quality={82}
          style={{ objectFit: "cover" }}
        />
        <div className="estate-map-scrim" aria-hidden="true" />

        {hotspots.map((h) => {
          const isOpen = open === h.id;
          return (
            <div
              key={h.id}
              className="estate-map-spot"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <button
                type="button"
                className={`estate-map-marker${isOpen ? " is-open" : ""}`}
                aria-expanded={isOpen}
                aria-controls={`spot-${h.id}`}
                onClick={() => setOpen(isOpen ? null : h.id)}
              >
                <span className="sr-only">{h.label}</span>
                <span className="estate-map-dot" aria-hidden="true" />
              </button>

              <div
                id={`spot-${h.id}`}
                className="estate-map-card"
                hidden={!isOpen}
              >
                {h.thumb ? (
                  <span className="estate-map-thumb">
                    <Image src={h.thumb} alt="" fill sizes="120px" quality={75} style={{ objectFit: "cover" }} />
                  </span>
                ) : null}
                <span className="estate-map-card-body">
                  <span className="estate-map-card-name">{h.label}</span>
                  <span className="caption">{h.line}</span>
                  {h.ledger ? <LedgerInline entries={h.ledger} /> : null}
                  {h.href ? (
                    <Link href={h.href} className="micro estate-map-card-link">
                      Visit
                    </Link>
                  ) : null}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* The same information, always present, never behind an interaction. */}
      <ul className="estate-map-list">
        {hotspots.map((h, i) => (
          <li key={h.id} className="estate-map-list-item">
            <span className="tabular estate-map-list-index">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="estate-map-list-name">
                {h.href ? <Link href={h.href}>{h.label}</Link> : h.label}
              </span>
              <span className="caption estate-map-list-line">{h.line}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="estate-map-cta">
        <Magnetic>
          <Link href={ctaHref} className="btn-primary micro" data-cursor="Enquire">
            {ctaLabel}
          </Link>
        </Magnetic>
      </p>
    </section>
  );
}
