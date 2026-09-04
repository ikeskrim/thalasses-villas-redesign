"use client";

import { useEffect } from "react";

import { getSmoothScroll, onSmoothScrollChange } from "@/lib/smooth-scroll";

/**
 * DIRECTION F — the motion layer. Phase 1 and Phase 2.
 *
 * The F+ directive sets a three-tier "weirdness dial" and a phased build with a
 * Core Web Vitals gate between phases. Phase 1 (the hero handoff, the split
 * manifesto, quiet reveals) passed its gate; this file now also carries Phase
 * 2's Level-2 work — the Discover Crete parallax and the settle of the wedding
 * deck. The Phase 2 set-pieces that are not motion-library work live elsewhere:
 * the deck's stacking is CSS `position: sticky` (hotel.css), the distance
 * count-ups are `Distance.tsx`, the villa morph is `lib/view-transition.ts`.
 *
 * FIVE RULES IT IS BUILT AGAINST, all from the directive's constitution:
 *
 *   1. CONVERSION IS SACRED. Nothing here touches, overlaps, delays or obscures
 *      Book Now, "Check availability", or the booking bar. The only motion the
 *      booking affordance has is the CSS hover it already had.
 *   2. TRANSFORM AND OPACITY ONLY. Every property animated below is composited.
 *      Nothing animates width, height, top or left, because a reflow per frame
 *      is how a page loses INP and CLS at once.
 *   3. THE PAGE WORKS WITHOUT THIS FILE. The reveal's starting state is set
 *      HERE, in JavaScript, not in the stylesheet — so with JS disabled every
 *      element is simply visible. A stylesheet that hides content and waits for
 *      script is a page that is blank to anything that does not run one.
 *   4. REDUCED MOTION IS A PATH, NOT A SWITCH. Under `reduce` this file
 *      installs nothing at all: no ScrollTrigger, no split, no parallax. There
 *      is no animation to cancel because none is ever created.
 *   5. ONE SET-PIECE PER SCREENFUL. The hero handoff is the only scrubbed
 *      effect above the fold; the deck is many screens below it.
 *
 * ONE LENIS, NOT TWO. The site shell (`SmoothScroll.tsx`) owns the smooth
 * scroll and publishes it through `lib/smooth-scroll`. Phase 1 constructed a
 * SECOND Lenis here on GSAP's ticker — two smooth-scroll loops on one document,
 * which is precisely the fighting-over-the-frame stutter the handle's own
 * comment names. ScrollTrigger now attaches to the shell's instance when there
 * is one, and to native scroll when there is not (touch, `reduce`).
 *
 * STAGED SETUP, ON IDLE. Measured on the gate's phone profile (4× CPU), the
 * whole setup as one synchronous block was a 110ms long task followed by a
 * 65ms one — most of the blocking-time regression that Phase 2 showed, and in
 * fact the cost of Phase 1's own setup finally RUNNING, since a
 * temporal-dead-zone throw had been cutting it short before its refresh. So it
 * now waits for the browser to be idle, then builds in stages with a yield to
 * the main thread between each, so no single task crosses the 50ms line that
 * blocking time is counted from. The effects are identical; they arrive a few
 * frames later, after the page has painted and settled — which is the right
 * order anyway.
 */

/* The reveal's resting state, applied only when motion is actually wanted. */
const HIDDEN = { autoAlpha: 0, y: 18 } as const;

/** Resolve on the next idle period, or after `timeout` if none comes. */
const idle = (timeout = 1500) =>
  new Promise<void>((resolve) => {
    /* Safari has no requestIdleCallback; a short timeout is the same idea. */
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => resolve(), { timeout });
    } else {
      window.setTimeout(resolve, 200);
    }
  });

/** Give the main thread back for a frame between stages. */
const yieldToMain = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export default function HotelMotion() {
  useEffect(() => {
    /*
     * Reduced motion decides everything, and it decides it before any library
     * is imported — so a reader who asked for stillness never pays the bytes
     * either.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;

      /* Let the page paint and settle before any of this touches layout. */
      await idle();
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger, SplitText);
      gsap.ticker.lagSmoothing(0);

      /*
       * Attach ScrollTrigger to the shell's Lenis, now or when it arrives.
       * The handle can be null at mount — the shell's effect may not have run
       * yet — so subscribe rather than read once.
       */
      let detachLenis: (() => void) | undefined;
      const attach = () => {
        detachLenis?.();
        detachLenis = undefined;
        const lenis = getSmoothScroll();
        if (!lenis) return;
        const update = () => ScrollTrigger.update();
        lenis.on("scroll", update);
        detachLenis = () => lenis.off("scroll", update);
      };
      attach();
      const unsubscribe = onSmoothScrollChange(attach);

      /* An empty context; every stage adds to it, so one revert undoes all. */
      const ctx = gsap.context(() => {});

      /* ------------------------------------------------ STAGE 1: HERO -- */
      /*
       * The handoff: as the hero leaves, thin letterbox bars close in and the
       * frame drifts up behind the content below. Scrubbed, so it is the
       * reader's own scroll doing it rather than a timed animation playing at
       * them. The bars are scaled from the edges — `scaleY` on an element
       * already in place — so nothing reflows and the hero's height never
       * changes.
       *
       * The hero's paragraph and marker simply rise. No split — the directive's
       * avoid-list is explicit that per-character motion on body copy makes
       * text cheap, and this is the sentence that has to be READ.
       */
      ctx.add(() => {
        const hero = document.querySelector<HTMLElement>(".ho-hero");
        if (hero) {
          const bars = hero.querySelectorAll<HTMLElement>(".ho-letterbox");
          const frames = hero.querySelectorAll<HTMLElement>(".ho-slide");
          gsap.set(bars, { scaleY: 0 });
          gsap
            .timeline({
              scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
            })
            .to(bars, { scaleY: 1, ease: "none" }, 0)
            /* 8% travel — the directive's ceiling for parallax. */
            .to(frames, { yPercent: -8, ease: "none" }, 0);
        }
        const heroCopy = document.querySelectorAll<HTMLElement>(".ho-hero-copy p");
        if (heroCopy.length) {
          gsap.set(heroCopy, HIDDEN);
          gsap.to(heroCopy, { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.25, stagger: 0.08, ease: "power2.out" });
        }
      });

      await yieldToMain();
      if (cancelled) return;

      /* ------------------------------------------- STAGE 2: MANIFESTO -- */
      /*
       * Split into lines and lifted through a mask. Run after
       * `document.fonts.ready` because splitting before the webfont lands
       * measures the fallback's line breaks and then re-wraps under the
       * reader — the classic way this effect ships broken.
       *
       * The heading keeps its accessible name: SplitText's `aria` handling
       * plus an explicit label means a screen reader hears one sentence, not
       * a list of line fragments.
       */
      const line = document.querySelector<HTMLElement>(".ho-hero-copy h1");
      if (line) {
        const label = line.textContent?.trim() ?? "";
        document.fonts.ready.then(() => {
          if (cancelled) return;
          ctx.add(() => {
            const split = SplitText.create(line, { type: "lines", mask: "lines", autoSplit: true });
            line.setAttribute("aria-label", label);
            for (const l of split.lines) (l as HTMLElement).setAttribute("aria-hidden", "true");
            gsap.from(split.lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: "power3.out" });
          });
        });
      }

      /* --------------------------------------------- STAGE 3: REVEALS -- */
      /*
       * ScrollTrigger.batch rather than a trigger per card. There are six villa
       * cards, twenty-one experiences, a press wall and four footer columns;
       * one trigger each is over thirty live triggers, which is the number the
       * directive names as the ceiling. `batch` keeps the count in single
       * figures.
       *
       * THE SAFETY NET. Nothing this sets to `autoAlpha: 0` may stay there.
       * `batch` collects entering elements over a 100ms window, so an instant
       * jump to the bottom outruns it — measured, a walk stepping 600px every
       * 45ms left the whole press wall at `visibility: hidden`. §A.2 says motion
       * decorates structure and never replaces it, so a sweep on scroll-idle
       * reveals anything at or above the fold that is somehow still hidden.
       */
      ctx.add((self) => {
        const reveal = document.querySelectorAll<HTMLElement>(
          ".ho-card, .ho-press a, .ho-press div, .ho-distances div, .ho-head, .ho-group > h3"
        );
        gsap.set(reveal, HIDDEN);
        ScrollTrigger.batch(reveal, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out", overwrite: true }),
        });
        const sweep = () => {
          for (const el of reveal) {
            if (gsap.getProperty(el, "autoAlpha") !== 0) continue;
            if (el.getBoundingClientRect().top > window.innerHeight) continue;
            gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.3, overwrite: true });
          }
        };
        let idleTimer = 0;
        const onScroll = () => {
          window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(sweep, 200);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        self.add(() => () => {
          window.removeEventListener("scroll", onScroll);
          window.clearTimeout(idleTimer);
        });
      });

      await yieldToMain();
      if (cancelled) return;

      /* ---------------------------------- STAGE 4: PHASE 2, LEVEL 2/3 -- */
      /*
       * DISCOVER CRETE — depth, not drama: the aerial is 12% taller than its
       * frame (CSS, fine pointer only) and drifts from -8% to 0 as the section
       * crosses the viewport. Touch and `reduce` never reach this branch.
       *
       * THE WEDDING DECK — CSS sticky stacks the cards. This adds only the
       * settle: as the next card arrives over it, the covered card eases back
       * by 4% and dims — scale and opacity, nothing else — so the stack reads
       * as depth rather than as a pile. Fine pointer only.
       */
      if (fine) {
        ctx.add(() => {
          const crete = document.querySelector<HTMLElement>(".ho-crete-figure");
          const creteImg = crete?.querySelector<HTMLElement>("img");
          if (crete && creteImg) {
            gsap.fromTo(
              creteImg,
              { yPercent: -8 },
              {
                yPercent: 0,
                ease: "none",
                scrollTrigger: { trigger: crete, start: "top bottom", end: "bottom top", scrub: 0.4 },
              }
            );
          }
          const cards = [...document.querySelectorAll<HTMLElement>(".ho-deck-card")];
          cards.forEach((card, i) => {
            const next = cards[i + 1];
            if (!next) return;
            gsap.to(card, {
              scale: 0.96,
              autoAlpha: 0.55,
              ease: "none",
              /* Pixels, not rem — ScrollTrigger parses px and %, and the sticky
                 offset in hotel.css is 4.75rem = 76px at a 16px root. */
              scrollTrigger: { trigger: next, start: "top bottom", end: "top 76px", scrub: 0.3 },
            });
          });
        });
        await yieldToMain();
        if (cancelled) return;
      }

      ScrollTrigger.refresh();

      cleanup = () => {
        ctx.revert();
        unsubscribe();
        detachLenis?.();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
