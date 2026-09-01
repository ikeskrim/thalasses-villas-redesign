"use client";

import { useEffect, useRef } from "react";

import { getSmoothScroll, onSmoothScrollChange } from "@/lib/smooth-scroll";

/**
 * THE MEGA-FOOTER'S TYPOGRAPHIC STAGGER.
 *
 * The unveil itself — the footer sitting behind the page and being uncovered as
 * the content scrolls off — is **pure CSS** (`sections.css`, `.footer-reveal`).
 * That is a deliberate choice against the brief's letter and for its intent.
 *
 * A fixed layer behind an opaque page produces the identical parallax reveal
 * with **no scroll listener, no measurement, no JavaScript at all**, and it
 * cannot introduce layout shift because nothing is measured or moved. Doing it
 * with ScrollTrigger would mean a scroll handler and a pinned element on a page
 * whose long-task budget is already the project's one outstanding performance
 * problem, to arrive at the same picture.
 *
 * ScrollTrigger IS used, for the thing it is actually better at: staggering the
 * oversized type and the rules as the footer comes into view. That earns its
 * cost, and it is loaded **lazily** — GSAP is a dependency of this project but
 * appears on no page of the live site, so a static import here would put ~33 kB
 * gzip on every route to animate the bottom of three.
 *
 * Under `prefers-reduced-motion` nothing is imported and nothing animates; the
 * CSS reveal also collapses to a plain, static footer.
 */
export function FooterReveal() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const footer = document.querySelector<HTMLElement>(".site-footer");
    const slot = document.querySelector<HTMLElement>(".footer-reveal");
    if (!footer || !slot) return;

    /*
     * ARM THE REVEAL, and only from script.
     *
     * The footer is `position: fixed` behind the page, so the browser paints a
     * full-viewport layer on every load even though the page covers it — and
     * Chrome reported the footer's oversized word as the homepage's **LCP
     * element**, which is both wasted paint and a misleading number for anyone
     * doing performance work later.
     *
     * `visibility: hidden` until the slot is near fixes both. It is applied via
     * a class added HERE rather than in the stylesheet, because a CSS-only
     * version would hide the footer permanently for a reader without
     * JavaScript. Default is visible; script opts into the optimisation.
     */
    const nearby = new IntersectionObserver(
      (entries) => {
        for (const e of entries) slot.classList.toggle("is-near", e.isIntersecting);
      },
      { rootMargin: "100% 0px" }
    );
    slot.classList.add("footer-reveal--armed");
    nearby.observe(slot);

    /*
     * Only pay for GSAP once the footer is genuinely close. On a long page a
     * reader who never reaches the bottom never downloads it.
     */
    const io = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        done.current = true;

        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        /*
         * Lenis owns the scroll on desktop, so ScrollTrigger has to be told when
         * it moves — otherwise the trigger fires against the native scroll
         * position, which Lenis has decoupled from, and the stagger runs at the
         * wrong moment or not at all.
         */
        const attach = () => {
          const lenis = getSmoothScroll();
          if (!lenis) return;
          lenis.on("scroll", ScrollTrigger.update);
        };
        attach();
        unsubscribe = onSmoothScrollChange(attach);

        const ctx = gsap.context(() => {
          const rows = footer.querySelectorAll<HTMLElement>(
            ".footer-mega-line, .footer-rule, .footer-grid > div, .footer-legal"
          );
          /* Resting state set HERE, not in CSS: with no script the footer is
             simply visible, rather than a blank block waiting for a library. */
          gsap.set(rows, { autoAlpha: 0, y: 24 });
          gsap.to(rows, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: footer, start: "top 92%", once: true },
          });
        }, footer);

        cleanup = () => ctx.revert();
      },
      { rootMargin: "400px" }
    );
    io.observe(footer);

    return () => {
      cancelled = true;
      io.disconnect();
      nearby.disconnect();
      slot.classList.remove("footer-reveal--armed", "is-near");
      unsubscribe?.();
      cleanup?.();
    };
  }, []);

  return null;
}
