"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { RegisterRow } from "@/lib/register";

export interface DragRegisterProps {
  rows: (RegisterRow & { image?: string | null; category?: string })[];
}

/** PATTERN 5 — the mission filter, translated. Taxonomy is the existing grouping. */
const CHIPS = ["All", "Sea", "Land", "Wellness", "Taste", "Service"] as const;

/**
 * The Register as a horizontal drag gallery (elevation spec §3).
 *
 * Desktop: click-and-drag with the cursor reading "Drag". Touch: plain native
 * horizontal scroll — no JS momentum, because hijacking a phone's scroll is the
 * fastest way to make a premium site feel broken.
 *
 * Accessibility is not sacrificed to the gesture. The track is a real scroll
 * container, so the keyboard scrolls it natively; every card is a link or a
 * button in the tab order; and the compact tier still expands in place rather
 * than minting a thin URL for an experience with twelve words of copy.
 */
export function DragRegister({ rows }: DragRegisterProps) {
  const track = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [chip, setChip] = useState<string>("All");

  // Filter state lives in the URL hash so a filtered view can be linked.
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      const match = CHIPS.find((c) => c.toLowerCase() === h.toLowerCase());
      if (match) setChip(match);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const choose = (c: string) => {
    setChip(c);
    const url = new URL(window.location.href);
    url.hash = c === "All" ? "" : c.toLowerCase();
    window.history.replaceState(null, "", url.toString());
  };

  const visible = chip === "All" ? rows : rows.filter((r) => r.category === chip);
  const countFor = (c: string) =>
    c === "All" ? rows.length : rows.filter((r) => r.category === c).length;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    const onDown = (e: PointerEvent) => {
      down = true;
      moved = 0;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      setDragging(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startScroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      setDragging(false);
      // Suppress the click that follows a real drag, but keep plain clicks working.
      if (moved > 6) {
        const stop = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        (e.target as HTMLElement)?.addEventListener("click", stop, { capture: true, once: true });
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <ul className="chips" role="list" aria-label="Filter experiences">
        {CHIPS.map((c) => {
          const n = countFor(c);
          return (
            <li key={c}>
              <button
                type="button"
                className={`chip${chip === c ? " is-active" : ""}`}
                aria-pressed={chip === c}
                disabled={n === 0}
                onClick={() => choose(c)}
              >
                <span className="micro">{c}</span>
                <span className="tabular chip-count">{n}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul
        ref={track}
        className={`drag-register${dragging ? " is-dragging" : ""}`}
        data-cursor="Drag"
        aria-label="Experiences"
      >
        {visible.map((row) => {
        const isOpen = open === row.slug;
        return (
          <li key={row.slug} className="drag-card">
            {/*
              An experience whose only image was ruled off the site (the stock
              cyclists) gets a typographic card rather than an empty grey box.
              Per the ruling we do not substitute another stock image — the card
              simply waits for compliant photography.
            */}
            {row.image ? (
              <div className="drag-card-figure">
                <Image
                  src={row.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 72vw, 30vw"
                  quality={80}
                  draggable={false}
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className="drag-card-figure drag-card-figure--typographic">
                <span className="display c3">{row.name}</span>
              </div>
            )}

            {row.flagship ? (
              <Link
                href={`/en/experiences/${row.slug}`}
                className="drag-card-body"
                data-cursor="View"
              >
                <h3 className="display c4 drag-card-name">{row.name}</h3>
                <span className="micro drag-card-action">Read</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="drag-card-body"
                  aria-expanded={isOpen}
                  aria-controls={`drag-${row.slug}`}
                  onClick={() => setOpen(isOpen ? null : row.slug)}
                >
                  <h3 className="display c4 drag-card-name">{row.name}</h3>
                  <span className="micro drag-card-action">{isOpen ? "Close" : "More"}</span>
                </button>
                <div id={`drag-${row.slug}`} className="drag-card-panel" hidden={!isOpen}>
                  {row.line ? <p className="caption">{row.line}</p> : null}
                  {/*
                    EVERY EXPERIENCE HAS A PAGE, SO EVERY EXPERIENCE NEEDS A WAY
                    IN.

                    The two-tier register is right: fourteen of the twenty-one
                    have under forty words and expanding in place is a better
                    read than a page of white space. But all twenty-one are
                    ROUTED, sitemapped and given a share card, and the link
                    crawl found that only ten were reachable from anywhere on
                    the site — the other eleven existed, were indexable, and
                    could not be navigated to.

                    A page a crawler can index and a visitor cannot reach is the
                    worst of both: thin content in the index, and a dead end for
                    anyone who arrives on it from a legacy URL. The register
                    keeps its shape; the page keeps its way in. (T-297.)
                  */}
                  <Link
                    href={`/en/experiences/${row.slug}`}
                    className="micro drag-card-more"
                    data-cursor="View"
                  >
                    Open the page
                  </Link>
                </div>
              </>
            )}
          </li>
        );
      })}
      </ul>
    </>
  );
}
