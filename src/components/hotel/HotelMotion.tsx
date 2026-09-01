"use client";

import { useEffect } from "react";

/**
 * DIRECTION F, PHASE 1 — the motion layer.
 *
 * The F+ directive sets a three-tier "weirdness dial" and its own build plan
 * puts Phase 1 first behind a Core Web Vitals gate. This is Phase 1 and only
 * Phase 1: the scroll handoff on the hero, the manifesto's split-line reveal,
 * and quiet staggered reveals everywhere else. No WebGL, no sticky decks, no
 * drag strips — those are Phase 2 and the directive says not to start them
 * until Phase 1 passes.
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
 *      installs nothing at all: no Lenis, no ScrollTrigger, no split. There is
 *      no animation to cancel because none is ever created.
 *   5. ONE SET-PIECE PER SCREENFUL. The hero handoff is the only scrubbed
 *      effect above the fold.
 */

/* The reveal's resting state, applied only when motion is actually wanted. */
const HIDDEN = { autoAlpha: 0, y: 18 } as const;

export default function HotelMotion() {
  useEffect(() => {
    /*
     * Reduced motion decides everything, and it decides it before any library
     * is imported — so a reader who asked for stillness never pays the bytes
     * either.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
        import("lenis"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger, SplitText);

      /*
       * Lenis drives the frame, GSAP owns the clock.
       *
       * `autoRaf: false` and adding Lenis to `gsap.ticker` is the documented
       * pairing: two independent requestAnimationFrame loops would fight over
       * the same frame and produce exactly the stutter smooth scroll is meant
       * to remove.
       */
      const lenis = new Lenis({ autoRaf: false, duration: 1.05 });
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", ScrollTrigger.update);

      const ctx = gsap.context(() => {
        /* ---------------------------------------------- HERO — Level 3 -- */
        /*
         * The handoff: as the hero leaves, thin letterbox bars close in and the
         * frame drifts up behind the content below. Scrubbed, so it is the
         * reader's own scroll doing it rather than a timed animation playing at
         * them.
         *
         * The bars are scaled from the edges — `scaleY` on an element already
         * in place — so nothing reflows and the hero's height never changes.
         */
        const hero = document.querySelector<HTMLElement>(".ho-hero");
        if (hero) {
          const bars = hero.querySelectorAll<HTMLElement>(".ho-letterbox");
          const frames = hero.querySelectorAll<HTMLElement>(".ho-slide");

          gsap.set(bars, { scaleY: 0 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.6,
              },
            })
            .to(bars, { scaleY: 1, ease: "none" }, 0)
            /* 8% travel — the directive's ceiling for parallax. */
            .to(frames, { yPercent: -8, ease: "none" }, 0);
        }

        /* ----------------------------------------- MANIFESTO — Level 2 -- */
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
            const split = SplitText.create(line, { type: "lines", mask: "lines", autoSplit: true });
            line.setAttribute("aria-label", label);
            for (const l of split.lines) (l as HTMLElement).setAttribute("aria-hidden", "true");
            gsap.from(split.lines, {
              yPercent: 110,
              duration: 0.8,
              stagger: 0.08,
              ease: "power3.out",
            });
          });
        }

        /*
         * The hero's paragraph and marker simply rise. No split — the directive's
         * avoid-list is explicit that per-character motion on body copy makes
         * text cheap, and this is the sentence that has to be READ.
         */
        const heroCopy = document.querySelectorAll<HTMLElement>(".ho-hero-copy p");
        if (heroCopy.length) {
          gsap.set(heroCopy, HIDDEN);
          gsap.to(heroCopy, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: 0.25,
            stagger: 0.08,
            ease: "power2.out",
          });
        }

        /* ------------------------------------------- EVERYTHING — L1 -- */
        /*
         * ScrollTrigger.batch rather than a trigger per card.
         *
         * There are six villa cards, twenty-one experiences, a press wall and
         * four footer columns. One trigger each is over thirty live triggers,
         * which is the number the directive names as the ceiling and a real
         * cost on every scroll frame. `batch` groups what enters together and
         * keeps the count in single figures.
         */
        const reveal = document.querySelectorAll<HTMLElement>(
          ".ho-card, .ho-press a, .ho-press div, .ho-distances div, .ho-head, .ho-group > h3"
        );
        gsap.set(reveal, HIDDEN);
        ScrollTrigger.batch(reveal, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power2.out",
              overwrite: true,
            }),
        });

        /*
         * THE SAFETY NET. Nothing this sets to `autoAlpha: 0` may stay there.
         *
         * `batch` collects entering elements over a 100 ms window before it
         * animates them, which is what keeps the trigger count in single
         * figures — and it means the reveal LAGS an instant jump. Jump to the
         * bottom with End, or land on a restored scroll position, and for a
         * moment the last section is `visibility: hidden`. Measured: a walk
         * that jumped 600px every 45ms left the whole press wall invisible;
         * the same walk pausing at the bottom left nothing.
         *
         * Real wheel scrolling never hit it, and coming back up re-triggers,
         * so no reader was going to be stranded. But `MOTION-DIRECTIVE.md` §A.2
         * says motion decorates structure and never replaces it, and content
         * whose visibility depends on a batching interval is content the motion
         * layer is holding hostage.
         *
         * So a cheap sweep on scroll-idle reveals anything at or above the fold
         * that is somehow still hidden. It runs after scrolling stops, does
         * nothing in the normal case, and cannot itself hide anything.
         */
        const sweep = () => {
          for (const el of reveal) {
            if (gsap.getProperty(el, "autoAlpha") !== 0) continue;
            if (el.getBoundingClientRect().top > window.innerHeight) continue;
            gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.3, overwrite: true });
          }
        };
        let idle = 0;
        const onScroll = () => {
          window.clearTimeout(idle);
          idle = window.setTimeout(sweep, 200);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        ctx.add(() => () => {
          window.removeEventListener("scroll", onScroll);
          window.clearTimeout(idle);
        });

        ScrollTrigger.refresh();
      });

      cleanup = () => {
        ctx.revert();
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
