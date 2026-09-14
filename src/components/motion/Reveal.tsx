"use client";

import type { CSSProperties, ReactNode } from "react";

import { observeReveal } from "@/lib/reveal-observer";

/**
 * THE REVEAL PRIMITIVES — rebuilt so the server HTML is the finished page.
 *
 * `DECISIONS.md` D-021 (the owner, tranche thirteen): `/en/gallery` phone CLS
 * at or under 0.1 "via transform or clip-path with reserved dimensions", and
 * the `/en/careers` LCP text "never starts at opacity 0". Guarded by
 * `tests/reveal.spec.ts`; the opacity guard in `tests/a11y.spec.ts` still
 * walks every route for anything left hidden.
 *
 * WHAT WAS WRONG. Both primitives were Framer `whileInView` components, and
 * Framer serialises `initial` into the server HTML (`qa/perf/CHECKS-tranche12.md`
 * §4-5, confirmed on production with plain GETs):
 *
 *   - Careers served its body text as `style="opacity:0;transform:
 *     translateY(24px)"`. That paragraph is the page's LCP element, and it
 *     could not paint until hydration and an in-view trigger: 3,100 ms on the
 *     phone profile, against a first paint near 1,000 ms.
 *   - The gallery served every frame as `clip-path:inset(0 0 100% 0)`. A fully
 *     clipped image has an EMPTY visual rect, recorded as `0,0 0x0`, and when
 *     the wipe opened after the lazy image had loaded, Layout Instability
 *     scored each image as a move from the origin to its real place. The
 *     recorded numbers fall straight out of that reading: phone, four
 *     166x125 frames, impact 4·166·125/(390·844) = 0.25216, distance 674/844
 *     = 0.79858, score 0.20137 (recorded 0.2014); desktop 0.12392 × 960/1440 =
 *     0.08262 (recorded 0.0827). The Chromium internals were not read; the
 *     attribution test in `tests/reveal.spec.ts` is the proof, not this sum.
 *
 * WHAT IT IS NOW. Both render plain markup with a class and no inline style
 * that hides anything, so the server HTML — and a reader with no JavaScript,
 * a crawler, print — gets the finished page. Script (`src/lib/reveal-observer.ts`)
 * then hides ONLY elements that are entirely below the viewport when they
 * register, and brings each in once as it enters. What a reader can already
 * see is never taken away, so it never has an entrance either: the careers
 * text, the contact details, the first terms section, the first four gallery
 * frames and the experience hero now simply arrive. That last one is what
 * DESIGN-PLAN §8.6 asked for all along — the LCP hero "never clipped".
 *
 * The per-index stagger travels as a custom property (`--reveal-delay`), which
 * matches none of the `<noscript>` selectors in `layout.tsx` (`opacity:0`,
 * `clip-path`, `transform`), so that override has nothing to undo here.
 *
 * WHY A REF PER INSTANCE AND NOT ONE ISLAND. `qa/perf/ISLANDS-tranche12.md`
 * suggests one observer island toggling classes. The natural mount point for it
 * is `PageShell`, and `PageShell` is rendered by `not-found.tsx` — the root 404
 * tree, which ships on every route including `/`, the A/B reference. So each
 * primitive stays its own small client boundary (no Framer, one stable ref
 * callback), all of them feeding ONE shared observer. Collapsing the boundaries
 * is a separate change with its own measurement.
 */

export interface RevealProps {
  children: ReactNode;
  /** Stagger index for sibling reveals. */
  index?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

/*
 * Module-level ref callbacks, so their identity never changes: React attaches
 * each once on mount and runs the returned cleanup once on unmount. An inline
 * arrow would detach and re-attach on every re-render — and `GalleryGrid`
 * re-renders its whole grid every time the lightbox opens.
 */
const textRef = (el: HTMLElement | null) => (el ? observeReveal(el, "text") : undefined);
const imageRef = (el: HTMLElement | null) => (el ? observeReveal(el, "image") : undefined);

/** The build's stagger, unchanged: 80 ms a step, capped at 400 ms. */
const STAGGER_MS = 80;
const STAGGER_CAP_MS = 400;

/**
 * Section reveal (PHASE-3-DELIVERABLES §2, row 4): a 24px rise and a fade,
 * 0.8s, `cubic-bezier(0.16,1,0.3,1)`, once. Under reduced motion, opacity only
 * over 0.25s with no stagger — a second designed state, not a degradation.
 */
export function Reveal({ children, index = 0, className = "", as: Tag = "div" }: RevealProps) {
  const delay = Math.min(Math.max(index, 0) * STAGGER_MS, STAGGER_CAP_MS);
  return (
    <Tag
      ref={textRef}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Image reveal: the same top-down wipe and 1.05 → 1 settle, by transform only.
 *
 * NO CLIP-PATH ANYWHERE. The frame keeps its own class — and with it the box
 * each host reserves (`.d-gallery-frame` 4:3, `.d-exp-frame` 68svh,
 * `.d-other-frame` 4:5, `.plates-opener` 82svh, `.plate-figure` 3:2) — plus
 * `image-reveal`. Inside it, the photograph's wrapper fills that box, and a
 * sibling curtain in the page's ground sits over it, anchored at the bottom.
 *
 * Armed, the curtain is `scaleY(1)` and the photograph `scale(1.05)`. On entry
 * the curtain shrinks to `scaleY(0)` over 1.1s while the photograph settles over
 * 1.2s. A bottom-anchored curtain at `scaleY(1 - t)` covers exactly the strip
 * `inset(0 0 (1 - t)·100% 0)` used to hide, so every frame of the wipe uncovers
 * the same region as before, top first, over the same limestone.
 *
 * WHY IT CANNOT SHIFT. The image is never clipped and never moved by layout:
 * its visual rect is its frame's box from the first paint on, whenever its lazy
 * load lands. Previous rect equals current rect, so the distance fraction — and
 * with it the 0.79858 above — is zero. Only transforms change, on the curtain
 * and on the wrapper, and a transform is not a layout shift (in-repo: the
 * letterbox `scaleY` and the parallax measured CLS 0, `RE-SKIN-DIRECTIVE.md`).
 *
 * Under reduced motion there is never a curtain or a scale: an armed frame is
 * transparent and fades in over 0.25s.
 */
export function ImageReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div ref={imageRef} className={className ? `image-reveal ${className}` : "image-reveal"}>
      <div className="image-reveal-media">{children}</div>
      <span className="reveal-curtain" aria-hidden="true" />
    </div>
  );
}
