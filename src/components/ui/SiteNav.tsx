"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export interface NavEntry {
  n: string;
  label: string;
  href: string;
}

/**
 * THE NAVIGATION — with the glass spec deferred from the elevation pass.
 *
 * Glass was cut then because there was nothing to glass. It ships here, with
 * the component it belongs to.
 *
 * Behaviour:
 *  - Transparent over the hero, so the first screen stays a photograph.
 *  - After the hero it gains `backdrop-filter: blur()` and a hairline rule —
 *    the one place on the site that uses backdrop-filter, and it is on a fixed
 *    element with no sticky descendants, so it cannot repeat T-203.
 *  - The booking affordance is always reachable: it is in the bar at every
 *    width, never hidden behind the menu toggle.
 *
 * Keyboard-complete by construction: a skip link first, real buttons and links
 * throughout, `aria-expanded` on the toggle, focus moved into the panel on open
 * and returned to the toggle on close, and Escape closes it.
 */
export function SiteNav({
  entries,
  bookHref,
}: {
  entries: NavEntry[];
  bookHref: string;
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The glass switches on once the hero is behind you.
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a href="#main" className="skip-link micro">
        Skip to content
      </a>

      <header className={`nav${solid ? " is-solid" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-mark" aria-label="Thalasses Villas, home">
            Thalasses
          </Link>

          {/* The numbered register, in the site's own beat numbering. */}
          <nav className="nav-register" aria-label="Sections">
            <ul>
              {entries.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="nav-link">
                    <span className="tabular nav-index">{e.n}</span>
                    <span>{e.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Renders nothing until a second locale is published — see the
              component. It is wired now so the day /el ships it simply appears. */}
          <LanguageSwitcher />

          {/*
            Always reachable, at every width — but "Check availability" is 207px
            of nowrap type, and with the wordmark and the Menu button beside it
            the bar measured 447px against a 390px phone. The toggle was pushed
            clean off the right edge at 320, 360, 390 AND 430: the mobile menu
            was unreachable on every phone. The document-level overflow suite
            cannot see it, because a `position: fixed` element contributes
            nothing to documentElement.scrollWidth.

            Two spans, one displayed per breakpoint. `display: none` removes the
            other from the accessibility tree entirely, so the accessible name is
            always exactly the visible text — which is what keeps this from
            becoming a WCAG 2.5.3 (Label in Name) problem the way an aria-label
            override would.
          */}
          <a
            className="nav-book micro"
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="Book"
          >
            <span className="nav-book-full">Check availability</span>
            <span className="nav-book-short">Book</span>
          </a>

          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle micro"
            aria-expanded={open}
            aria-controls="nav-panel"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <div
          id="nav-panel"
          ref={panelRef}
          className="nav-panel"
          hidden={!open}
        >
          <ul>
            {entries.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="display c3" onClick={() => setOpen(false)}>
                  <span className="tabular nav-index">{e.n}</span> {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>
    </>
  );
}

/** The register, in beat order. Kept here so every page shares one source. */
export const NAV_ENTRIES: NavEntry[] = [
  { n: "01", label: "The Villas", href: "/#collection" },
  { n: "02", label: "The Estate", href: "/en/the-estate" },
  { n: "03", label: "Experiences", href: "/en/experiences" },
  { n: "04", label: "Weddings", href: "/en/weddings" },
  { n: "05", label: "Gallery", href: "/en/gallery" },
  { n: "06", label: "Location", href: "/en/location" },
];
