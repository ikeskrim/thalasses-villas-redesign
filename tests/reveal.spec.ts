import { expect, test, type Page } from "@playwright/test";

/**
 * THE SCROLL REVEALS, ASSERTED BY MECHANISM — `DECISIONS.md` D-021.
 *
 * Tranche twelve found two budget failures with one cause (`qa/perf/
 * CHECKS-tranche12.md` §4-5): `Reveal` and `ImageReveal` served their hidden
 * starting state in the HTML. Careers' LCP paragraph arrived as `opacity:0`
 * and painted at 3,100 ms on the phone profile; the gallery's frames arrived
 * as `clip-path:inset(0 0 100% 0)` and scored a CLS of 0.2014.
 *
 * The owner's ruling names the mechanism, not a number to squeeze under: phone
 * CLS at or under 0.1 "via transform or clip-path with reserved dimensions",
 * and the careers LCP text "never starts at opacity 0". So nothing here is a
 * threshold. Each check asserts the MECHANISM is gone and that the motion is
 * still there, because a fix that deleted the reveal would pass a CLS budget
 * too:
 *
 *   1. The server HTML carries no hidden state — and does carry reveals.
 *   2. Careers on a phone: the body text's EFFECTIVE opacity is never 0 from
 *      first paint to the first scroll, while it sits in the first viewport.
 *   3. Gallery at 390 and 1440, UNDER hotel-cwv's throttling: no layout-shift
 *      source lies inside a gallery frame through a full wheel scroll, frames
 *      below the fold were still armed and still revealed, and the wipe ran as
 *      a transition rather than a snap.
 *   4. The arming edge is the REAL viewport edge: a frame whose top sits inside
 *      the entrance band's bottom strip at first paint is never curtained.
 *   5. Below the fold still animates: armed before it is reached, in after,
 *      with the rise and fade running as 0.8s transitions.
 *   6. A single jump past armed content — which no IntersectionObserver
 *      reports — still leaves nothing above the fold hidden (the idle sweep).
 *  6b. Continuous scrolling: the entrance band releases a block while scroll
 *      events still arrive under the sweep's 200ms idle gap (the observer).
 *   7. Reduced motion: never a curtain, never a scale, never a rise; the
 *      entrance is an opacity transition and nothing else.
 *   8. Scripting off: every reveal is simply visible.
 *
 * Every check first proves it is looking at something (CONVENTIONS §18): a
 * check over zero elements, or over a page whose script never ran, passes for
 * the wrong reason.
 *
 * FALSIFICATIONS (CONVENTIONS §16 — a fix you cannot falsify is not a fix).
 * All RUN on 2026-09-14. Each went red AT ITS OWN ASSERTION, not at a
 * precondition, and each mutation was proven present in the build it ran on
 * (`qa/perf/REVEAL-tranche13.md` §5 has the outputs).
 *   - 1: an inline `transform: translateY(24px)` on the Reveal wrapper → the
 *     inline-transform check (careers, contact, terms, boat-trip; the gallery,
 *     which has no Reveal text, stays green).
 *   - 2: `.reveal:not([data-reveal]):has(.d-exp-text) { transform:
 *     translateY(24px) }` → `moved`, in 501 samples. A transform on EVERY
 *     unarmed `.reveal` went red at the arming precondition instead, which
 *     proves nothing about `moved`, so the targeted form is the record.
 *   - 3: this test run against the Framer build itself (production before
 *     D-026, and an older main build) → the attribution assertion, with the
 *     recorded 0.2014 at 390 and 0.0827 at 1440, from `0,0 0x0` sources. A
 *     `REVEAL_FALSIFY=clip` switch that re-added only the clip over the new DOM
 *     did NOT go red and was removed; to repeat 3, run it against a pre-D-026
 *     build.
 *   - 4: `top >= bottom * 0.88` in `flush()` → "on screen at first paint — was
 *     armed".
 *   - 5: the `.reveal[data-reveal="in"]` transition deleted → "the block
 *     snapped in".
 *   - 6: `sweep()` a no-op → "nothing swept them", while 6b stays green.
 *   - 6b: `show(e.target)` removed from the band observer → "nothing was
 *     released during continuous scrolling", while 6 stays green. The two
 *     tests divide the mechanism between them.
 *   - 7: without `transition-property: none` on the reduced armed rule,
 *     globals.css's forced 250ms duration faded armed frames out (sampled at
 *     opacity 1, 0.95 … 0) and both routes failed.
 *
 * Budgets stay where they are (`scripts/hotel-cwv.mjs`); this file adds gates
 * and loosens none.
 */

const STRUCTURAL_ROUTES = [
  "/en/careers",
  "/en/gallery",
  "/en/contact",
  "/en/terms",
  "/en/experiences/boat-trip",
];

/* hotel-cwv's two device profiles. Test 3 adds its throttling as well. */
const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
} as const;
const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
  deviceScaleFactor: 1,
} as const;

/** `scaleY(0)` as `getComputedStyle` reports it: a curtain at rest. */
const CURTAIN_AT_REST = "matrix(1, 0, 0, 0, 0, 0)";

/** Wait until the observer has decided something, so the page's script provably ran. */
async function waitForArming(
  page: Page,
  selector = '[data-reveal="armed"]',
  { soft = false, timeout = 15_000 }: { soft?: boolean; timeout?: number } = {}
) {
  await expect
    .configure({ soft })
    .poll(() => page.evaluate((s) => document.querySelectorAll(s).length, selector), {
      message:
        `nothing matching ${selector} was ever armed — either the page's script never ` +
        `ran or nothing sits below the fold, and either way the checks below would ` +
        `pass without testing the reveal`,
      timeout,
    })
    .toBeGreaterThan(0);
}

/** Walk to the bottom by assignment, re-reading the height, then let the sweep run. */
async function walkToBottom(page: Page) {
  for (let y = 0, guard = 0; ; guard++) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    if (y >= max) break;
    y = Math.min(y + 600, max);
    if (guard > 600) throw new Error("walkToBottom() did not reach the bottom — the page keeps growing");
  }
  await page.waitForTimeout(1500);
}

/**
 * hotel-cwv's throttling, value for value (`scripts/hotel-cwv.mjs`, the CDP
 * block after `newContext`): a mid-range Android on Slow 4G, or a laptop.
 *
 * WHY IT IS HERE. The 0.2014 and the 0.0827 were only ever recorded under these
 * conditions, and the investigation's reading of them (`area-reveal.md` fact 7)
 * is that a frame only scored when its lazy image finished loading AFTER its
 * clip had opened. On an unthrottled local run the images can land first, and
 * then the old mechanism records nothing at all — so the attribution check
 * would pass on the very defect it exists to catch. Chromium only (CDP); the
 * WebKit project runs `smoke.spec.ts` alone.
 */
async function throttleLikeHotelCwv(page: Page, mobile: boolean) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 2 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: mobile ? 150 : 40,
    downloadThroughput: ((mobile ? 1.6 : 10) * 1024 * 1024) / 8,
    uploadThroughput: ((mobile ? 0.75 : 5) * 1024 * 1024) / 8,
  });
}

/* ------------------------------------------------------------------ 1 -- */

test.describe("reveals — the server HTML is the finished page", () => {
  for (const route of STRUCTURAL_ROUTES) {
    test(`${route} serves reveals with no hidden state`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} did not load`).toBe(200);
      const html = await res.text();

      const hosts = html.match(/\sclass="(?:[^"]*\s)?(?:reveal|image-reveal)(?:\s[^"]*)?"/g) ?? [];
      expect(
        hosts.length,
        `${route} serves no .reveal or .image-reveal element, so the checks below would be ` +
          `looking at nothing`
      ).toBeGreaterThan(0);

      /*
       * Inline style ATTRIBUTES only. The `<noscript>` override in `layout.tsx`
       * contains the text `[style*="opacity:0"]` as a selector, and a check for
       * the bare substring would fail on the guard written for this defect.
       */
      const styles = [...html.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1] ?? "");
      const transparent = styles.filter((s) => /(?:^|;)\s*opacity:\s*0(?:\.0*)?\s*(?:;|$)/.test(s));
      const clipped = styles.filter((s) => /clip-path:\s*inset\(/.test(s));
      expect(
        transparent,
        `${route} serves elements at opacity 0 — hidden before any script has run`
      ).toEqual([]);
      expect(
        clipped,
        `${route} serves a clip-path inset — a fully clipped image has an empty visual rect, ` +
          `which is the gallery's 0.2014 CLS`
      ).toEqual([]);
      /*
       * A transform in the served HTML moves text or a photograph before any
       * script has run, as surely as an opacity hides it. Test 8's `<noscript>`
       * rule forces `transform: none`, so only the served attribute can show
       * it: no tag of a reveal host or its media wrapper may carry one.
       */
      const hostTags =
        html.match(/<[a-z][^>]*\sclass="(?:[^"]*\s)?(?:reveal|image-reveal|image-reveal-media)(?:\s[^"]*)?"[^>]*>/g) ?? [];
      const moved = hostTags.filter((t) => /\sstyle="[^"]*\btransform\s*:/.test(t));
      expect(moved, `${route} serves a reveal host or media wrapper with an inline transform`).toEqual([]);
      expect(html, `${route}: the server armed a reveal; only script may`).not.toMatch(/\sdata-reveal=/);
    });
  }
});

/* ------------------------------------------------------------------ 2 -- */

test.describe("reveals — careers on a phone, motion allowed", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "no-preference" } });

  test("the body text is never at opacity 0 from first paint to the first scroll", async ({ page }) => {
    await page.addInitScript(() => {
      const s = { samples: 0, zero: 0, min: 1, moved: 0, stopped: false };
      (window as unknown as { __careers: typeof s }).__careers = s;

      /*
       * EFFECTIVE opacity: the paragraph's own times every ancestor's. The old
       * hidden state sat on the Reveal WRAPPER, and the paragraph's own computed
       * opacity was 1 the whole time — a check that read only that would have
       * passed the build this test exists to reject.
       */
      const effective = (el: Element) => {
        let o = 1;
        for (let n: Element | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
        return o;
      };
      const sample = () => {
        if (s.stopped) return;
        const els = document.querySelectorAll(".d-exp-text");
        if (!els.length) return;
        s.samples++;
        for (const el of els) {
          const o = effective(el);
          if (o < s.min) s.min = o;
          if (o === 0) s.zero++;
          /* The rise lives on the wrapper too: text in view must not start 24px low either. */
          const host = el.closest(".reveal");
          if (host && getComputedStyle(host).transform !== "none") s.moved++;
        }
      };

      addEventListener("scroll", () => (s.stopped = true), { capture: true, passive: true, once: true });
      /* Every DOM change (parse, hydration, arming) and every frame. */
      new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true });
      const frame = () => {
        sample();
        if (!s.stopped) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    await page.goto("/en/careers", { waitUntil: "load" });
    /* The block below it (the mailto CTA) is armed at hydration: proof the observer ran. */
    await waitForArming(page, '.d-exp-body > .reveal[data-reveal="armed"]');
    /* hotel-cwv's settle. */
    await page.waitForTimeout(2500);

    const view = await page.evaluate(() => {
      const text = document.querySelector(".d-exp-text");
      const wrapper = text?.closest(".reveal");
      const r = text?.getBoundingClientRect();
      return {
        found: !!text,
        top: r?.top ?? -1,
        bottom: r?.bottom ?? -1,
        vh: window.innerHeight,
        scrollY: window.scrollY,
        wrapperState: wrapper?.getAttribute("data-reveal") ?? null,
      };
    });
    expect(view.found, "careers has no .d-exp-text — the page changed, not the reveal").toBe(true);
    expect(view.scrollY, "the page scrolled before it was checked").toBe(0);
    expect(
      view.top < view.vh && view.bottom > 0,
      `the careers body text is not in the first viewport (top ${view.top}, viewport ${view.vh}), ` +
        `so "never hidden in view" would be vacuous here`
    ).toBe(true);
    expect(view.wrapperState, "text in the first viewport was armed at hydration").toBeNull();

    const s = await page.evaluate(
      () =>
        (window as unknown as { __careers: { samples: number; zero: number; min: number; moved: number; stopped: boolean } })
          .__careers
    );
    expect(s.stopped, "a scroll happened during sampling, so the window is not first paint to first scroll").toBe(false);
    expect(s.samples, "the sampler barely ran — it saw nothing to check").toBeGreaterThan(10);
    expect(s.zero, `the careers body text read opacity 0 in ${s.zero} samples`).toBe(0);
    expect(s.min, "the careers body text was faded at some point before the first scroll").toBe(1);
    expect(s.moved, `the careers body text's reveal wrapper carried a transform in ${s.moved} samples`).toBe(0);
  });
});

/* ------------------------------------------------------------------ 3 -- */

for (const [label, profile] of [
  ["390", PHONE],
  ["1440", DESKTOP],
] as const) {
  test.describe(`reveals — gallery @ ${label}, motion allowed, hotel-cwv throttling`, () => {
    test.use({ ...profile, contextOptions: { reducedMotion: "no-preference" } });

    test("no layout shift has a source inside a gallery frame, and frames below the fold still reveal", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "the throttling is CDP, which is Chromium's");
      /* Slow 4G and a 4x CPU over a 66-frame page: minutes, not seconds. */
      test.setTimeout(300_000);

      await throttleLikeHotelCwv(page, profile.isMobile);

      await page.addInitScript(() => {
        type Shift = { t: number; value: number; node: string; previous: string; current: string };
        const w = window as unknown as {
          __frameShifts: Shift[];
          __cls: number;
          __armedThenIn: number;
          __wipe: { curtain: string[]; media: string[] } | null;
        };
        w.__frameShifts = [];
        w.__cls = 0;
        w.__armedThenIn = 0;
        w.__wipe = null;

        const rect = (r: DOMRectReadOnly) => `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
        type Source = { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const e = entry as PerformanceEntry & { value: number; sources?: Source[] };
            w.__cls += e.value;
            for (const src of e.sources ?? []) {
              const el = src.node instanceof Element ? src.node : (src.node?.parentElement ?? null);
              if (!el?.closest(".d-gallery-frame")) continue;
              w.__frameShifts.push({
                t: Math.round(e.startTime),
                value: e.value,
                node: `${el.tagName.toLowerCase()} in ${el.closest(".d-gallery-frame")!.className}`,
                previous: rect(src.previousRect),
                current: rect(src.currentRect),
              });
            }
          }
        }).observe({ type: "layout-shift", buffered: true });

        /* `${property} ${duration}ms` for each CSS transition running on an element. */
        const transitions = (el: Element | null) =>
          (el?.getAnimations() ?? []).map((a) =>
            a instanceof CSSTransition ? `${a.transitionProperty} ${Number(a.effect?.getTiming().duration)}ms` : a.constructor.name
          );

        /*
         * `oldValue`, not the attribute read at callback time: records are
         * delivered in batches, and a frame armed and released in one batch
         * would read "in" twice.
         *
         * The first release also records what is animating. `getAnimations()`
         * flushes style, so it sees the transitions the armed → in change has
         * just started — or sees none, if the wipe snapped.
         */
        new MutationObserver((records) => {
          for (const r of records) {
            const t = r.target as Element;
            if (!t.classList.contains("d-gallery-frame") || r.oldValue !== "armed") continue;
            w.__armedThenIn++;
            w.__wipe ??= {
              curtain: transitions(t.querySelector(":scope > .reveal-curtain")),
              media: transitions(t.querySelector(":scope > .image-reveal-media")),
            };
          }
        }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal"], attributeOldValue: true });
      });

      /*
       * EVERY PRECONDITION BELOW IS SOFT. A precondition that fails hard ends
       * the test before the attribution assertion runs, and then a red run on
       * the old build — where nothing is ever armed — says nothing about shifts
       * at all. Soft, they are all still reported, and the test is still red,
       * but the shift check always gets its say. That is how it was falsified
       * (see the header): run against the Framer build, it failed at the
       * attribution assertion with the recorded 0.2014 and 0.0827.
       */
      const soft = expect.configure({ soft: true });

      await page.goto("/en/gallery", { waitUntil: "load", timeout: 120_000 });
      await waitForArming(page, '.d-gallery-frame[data-reveal="armed"]', { soft: true, timeout: 60_000 });
      await page.waitForTimeout(2500);

      const before = await page.evaluate(() => {
        const frames = [...document.querySelectorAll(".d-gallery-frame")];
        return {
          frames: frames.length,
          inViewArmed: frames.filter(
            (f) => f.getBoundingClientRect().top < window.innerHeight && f.hasAttribute("data-reveal")
          ).length,
          inView: frames.filter((f) => f.getBoundingClientRect().top < window.innerHeight).length,
        };
      });
      soft(before.frames, "the gallery rendered almost no frames").toBeGreaterThan(8);
      soft(before.inView, "no gallery frame is in the first viewport — the page moved").toBeGreaterThan(0);
      soft(
        before.inViewArmed,
        "a frame the first viewport already showed was curtained — that covers painted, possibly LCP, content"
      ).toBe(0);

      /* hotel-cwv's session: the whole page with the wheel. */
      const { width, height } = profile.viewport;
      await page.mouse.move(width / 2, height / 2);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      const step = Math.round(height * 0.9);
      for (let y = 0; y <= total + height; y += step) {
        await page.mouse.wheel(0, step);
        await page.waitForTimeout(120);
      }
      await soft
        .poll(
          () => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - Math.round(window.scrollY)),
          { message: "the wheel scroll never reached the bottom of the gallery", timeout: 30_000 }
        )
        .toBeLessThanOrEqual(4);

      /*
       * Late loads are where the shift lived, so wait for them: every frame
       * was scrolled past, so every lazy image has been requested, and on
       * Slow 4G the last of them land well after the wheel stops.
       */
      await soft
        .poll(
          () =>
            page.evaluate(() =>
              [...document.querySelectorAll<HTMLImageElement>(".d-gallery-frame img")].filter((i) => !i.complete).length
            ),
          {
            message: "gallery images were still loading — late loads, where the shift lived, went unobserved",
            timeout: 120_000,
          }
        )
        .toBe(0);
      await page.waitForTimeout(1500);

      const r = await page.evaluate(() => {
        const w = window as unknown as {
          __frameShifts: { t: number; value: number; node: string; previous: string; current: string }[];
          __cls: number;
          __armedThenIn: number;
          __wipe: { curtain: string[]; media: string[] } | null;
        };
        return {
          frameShifts: w.__frameShifts,
          cls: w.__cls,
          armedThenIn: w.__armedThenIn,
          wipe: w.__wipe,
          stillArmed: document.querySelectorAll('.d-gallery-frame[data-reveal="armed"]').length,
        };
      });

      /* THE ASSERTION. Hard, and first. */
      expect(
        r.frameShifts.map((s) => `t=${s.t}ms ${s.value.toFixed(4)} ${s.node}: ${s.previous} -> ${s.current}`),
        `layout shifts with a source inside a gallery frame (summed CLS this session ${r.cls.toFixed(4)}). ` +
          `An image inside ImageReveal moved or changed its visual rect — the D-021 mechanism is back.`
      ).toEqual([]);

      expect(
        r.armedThenIn,
        "no gallery frame went from armed to in during a full scroll — the reveal is gone, not fixed"
      ).toBeGreaterThan(0);
      expect(r.stillArmed, "gallery frames are still curtained after scrolling past all of them").toBe(0);

      /*
       * And it is still a WIPE. An attribute that flips while the curtain and
       * the settle snap would pass everything above; so would a transition
       * whose `var(--ease-thalasses)` failed to resolve, which invalidates the
       * whole declaration at computed-value time and leaves no transition.
       */
      expect(r.wipe, "no released frame was captured").not.toBeNull();
      expect(r.wipe!.curtain, "the curtain did not transition when its frame was released").toContain(
        "transform 1100ms"
      );
      expect(r.wipe!.media, "the photograph did not settle from 1.05 when its frame was released").toContain(
        "transform 1200ms"
      );
    });
  });
}

/* ------------------------------------------------------------------ 4 -- */

test.describe("reveals — arming uses the real viewport edge, not the entrance band", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "no-preference" } });

  test("a gallery frame whose top sits in the bottom band at first paint is never curtained", async ({ page }) => {
    /*
     * WHY THIS NEEDS ITS OWN VIEWPORT. At the stock sizes no reveal happens to
     * sit between the band edge (88% of the height for text, 90% for images)
     * and the real bottom edge — so a rule that armed against the band, which
     * would hide content a reader was already looking at (`area-reveal.md`,
     * Risks), would pass every other check in this file. So the viewport is
     * sized to put one there: load, find the first frame below the fold, set
     * the height so its top sits near 95%, and repeat until one does (the page
     * head can depend on the height, so one pass may not land).
     *
     * Images, not text, because an armed text block carries its 24px rise on
     * itself and would read 24px lower than its layout; a frame's transforms
     * are on its children, so its own rect is its layout.
     */
    test.setTimeout(120_000);

    await page.addInitScript((rest) => {
      const s = { armedInView: [] as string[], curtainedInView: [] as string[] };
      (window as unknown as { __edge: typeof s }).__edge = s;
      const note = (list: string[], msg: string) => {
        if (list.length < 20 && !list.includes(msg)) list.push(msg);
      };

      /* The observer's decision, read the moment it is written: nothing has laid out in between. */
      new MutationObserver((records) => {
        for (const r of records) {
          const el = r.target as Element;
          if (r.oldValue !== null || el.getAttribute("data-reveal") !== "armed") continue;
          const t = getComputedStyle(el).transform;
          const top = el.getBoundingClientRect().top - (t === "none" ? 0 : new DOMMatrix(t).m42);
          if (top < innerHeight) note(s.armedInView, `${el.className}: top ${Math.round(top)} of ${innerHeight}`);
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal"], attributeOldValue: true });

      const frame = () => {
        for (const c of document.querySelectorAll(".image-reveal > .reveal-curtain")) {
          const top = c.parentElement!.getBoundingClientRect().top;
          const t = getComputedStyle(c).transform;
          if (top < innerHeight && t !== rest) note(s.curtainedInView, `curtain ${t} at top ${Math.round(top)} of ${innerHeight}`);
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, CURTAIN_AT_REST);

    const width = PHONE.viewport.width;
    let height: number = PHONE.viewport.height;
    const tried: string[] = [];
    let band: { i: number; top: number; state: string | null }[] = [];
    let vh = 0;

    for (let attempt = 0; attempt < 6; attempt++) {
      await page.setViewportSize({ width, height });
      await page.goto("/en/gallery", { waitUntil: "load" });
      await waitForArming(page, '.d-gallery-frame[data-reveal="armed"]');

      const m = await page.evaluate(() => ({
        vh: window.innerHeight,
        scrollY: window.scrollY,
        frames: [...document.querySelectorAll(".d-gallery-frame")].map((f, i) => ({
          i,
          top: f.getBoundingClientRect().top,
          state: f.getAttribute("data-reveal"),
        })),
      }));
      expect(m.scrollY, "the gallery did not open at the top").toBe(0);

      vh = m.vh;
      band = m.frames.filter((f) => f.top >= 0.91 * m.vh && f.top < 0.99 * m.vh);
      if (band.length) break;

      const next = m.frames.filter((f) => f.top >= m.vh).sort((a, b) => a.top - b.top)[0];
      tried.push(`${m.vh}px tall: first frame below the fold at ${next ? Math.round(next.top) : "none"}`);
      if (!next) break;
      height = Math.round(next.top / 0.95);
    }

    expect(
      band.length,
      `could not size the viewport so a frame's top lands between 91% and 99% of it — ` +
        `the check would be vacuous. Tried:\n  ${tried.join("\n  ")}`
    ).toBeGreaterThan(0);

    /* Let hydration, arming and a few hundred frames of sampling pass. */
    await page.waitForTimeout(1500);

    const now = await page.evaluate((indices) => {
      const frames = [...document.querySelectorAll(".d-gallery-frame")];
      return indices.map((i) => {
        const f = frames[i]!;
        return {
          top: Math.round(f.getBoundingClientRect().top),
          state: f.getAttribute("data-reveal"),
          curtain: getComputedStyle(f.querySelector(":scope > .reveal-curtain")!).transform,
          media: getComputedStyle(f.querySelector(":scope > .image-reveal-media")!).transform,
        };
      });
    }, band.map((f) => f.i));

    for (const f of now) {
      expect(f.top / vh, "the frame moved out of the band before it was checked").toBeGreaterThanOrEqual(0.9);
      expect(f.state, `a frame at ${f.top} of ${vh} — on screen at first paint — was armed`).toBeNull();
      expect(f.curtain, `a frame at ${f.top} of ${vh} is curtained`).toBe(CURTAIN_AT_REST);
      expect(f.media, `a frame at ${f.top} of ${vh} is overscaled`).toBe("none");
    }

    const s = await page.evaluate(
      () => (window as unknown as { __edge: { armedInView: string[]; curtainedInView: string[] } }).__edge
    );
    expect(s.armedInView, "reveals armed while their top was already inside the viewport").toEqual([]);
    expect(s.curtainedInView, "a curtain covered a frame that was already inside the viewport").toEqual([]);
  });
});

/* ------------------------------------------------------------------ 5 -- */

test.describe("reveals — below the fold still animates", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "no-preference" } });

  test("a terms section below the fold is armed before it is reached and revealed after", async ({ page }) => {
    await page.goto("/en/terms", { waitUntil: "load" });
    await waitForArming(page, '.d-terms-section[data-reveal="armed"]');

    /* Pin one, so the locator does not follow the attribute as it changes. */
    await page
      .locator('.d-terms-section[data-reveal="armed"]')
      .first()
      .evaluate((el) => el.setAttribute("data-test-reveal-target", ""));
    const target = page.locator("[data-test-reveal-target]");

    const armed = await target.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { opacity: cs.opacity, transform: cs.transform, top: el.getBoundingClientRect().top, vh: window.innerHeight };
    });
    expect(armed.top, "an element in view was armed").toBeGreaterThanOrEqual(armed.vh);
    expect(armed.opacity, "armed, but the stylesheet did not hide it").toBe("0");
    expect(armed.transform, "armed, but the 24px rise is not applied").toBe("matrix(1, 0, 0, 1, 0, 24)");

    /*
     * What starts animating the moment it is released. `getAnimations()`
     * flushes style, so inside the mutation callback it sees the transitions
     * the armed → in change starts — and none, if the block simply snaps in.
     */
    await target.evaluate((el) => {
      new MutationObserver((_, mo) => {
        if (el.getAttribute("data-reveal") !== "in") return;
        mo.disconnect();
        (window as unknown as { __released: string[] }).__released = el
          .getAnimations()
          .map((a) =>
            a instanceof CSSTransition ? `${a.transitionProperty} ${Number(a.effect?.getTiming().duration)}ms` : a.constructor.name
          );
      }).observe(el, { attributes: true, attributeFilter: ["data-reveal"] });
    });

    await target.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(target).toHaveAttribute("data-reveal", "in", { timeout: 5_000 });

    const released = await page.evaluate(() => (window as unknown as { __released?: string[] }).__released ?? null);
    expect(released, "the release was not observed").not.toBeNull();
    expect(
      released,
      "released, but the fade and the rise did not run as 0.8s transitions — the block snapped in"
    ).toEqual(expect.arrayContaining(["opacity 800ms", "transform 800ms"]));

    await expect
      .poll(
        () =>
          target.evaluate((el) => {
            const cs = getComputedStyle(el);
            return `${cs.opacity} ${cs.transform}`;
          }),
        { message: "the section was released but never finished arriving", timeout: 5_000 }
      )
      .toBe("1 none");
  });
});

/* ------------------------------------------------------------------ 6 -- */

test.describe("reveals — a jump past armed content", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "no-preference" } });

  test("one jump to the bottom of terms leaves nothing above the fold armed, with no further scroll", async ({
    page,
  }) => {
    /*
     * THE SWEEP'S OWN TEST. Every other walk in this suite and in `a11y.spec.ts`
     * moves in steps shorter than the entrance band, so every element crosses
     * the band on the way and the IntersectionObserver releases it alone —
     * deleting the sweep would leave them all green. A section that goes from
     * below the viewport to above it between two frames never intersects
     * anything and is never reported; that is an anchor jump, a restored
     * scroll, a fling. Only the idle sweep can release it.
     */
    await page.goto("/en/terms", { waitUntil: "load" });
    await waitForArming(page, '.d-terms-section[data-reveal="armed"]');

    /* Remember every armed block's LAYOUT bottom, in document coordinates, before the jump. */
    const armedAtStart = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[data-reveal="armed"]')];
      for (const el of els) {
        const t = getComputedStyle(el).transform;
        const lift = t === "none" ? 0 : new DOMMatrix(t).m42;
        el.setAttribute("data-test-jump-bottom", String(el.getBoundingClientRect().bottom - lift + window.scrollY));
      }
      return els.length;
    });
    expect(armedAtStart, "nothing was armed on terms").toBeGreaterThan(0);

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
    );

    /* No further scrolling from here on: only a timer can release anything now. */
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              [...document.querySelectorAll('[data-reveal="armed"]')].filter(
                (el) => el.getBoundingClientRect().top < window.innerHeight
              ).length
          ),
        {
          message: "armed blocks at or above the fold stayed hidden after a jump — nothing swept them",
          timeout: 3_000,
        }
      )
      .toBe(0);

    const r = await page.evaluate(() => {
      const marked = [...document.querySelectorAll("[data-test-jump-bottom]")];
      const passed = marked.filter((el) => Number(el.getAttribute("data-test-jump-bottom")) <= window.scrollY);
      return {
        scrollY: Math.round(window.scrollY),
        passed: passed.length,
        passedIn: passed.filter((el) => el.getAttribute("data-reveal") === "in").length,
      };
    });
    expect(
      r.passed,
      `the jump (to ${r.scrollY}) left no armed block entirely above the viewport, so it jumped past ` +
        `nothing and only the IntersectionObserver was tested`
    ).toBeGreaterThan(0);
    expect(r.passedIn, "blocks jumped over were not released").toBe(r.passed);
  });
});

/* ----------------------------------------------------------------- 6b -- */

test.describe("reveals — continuous scroll", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "no-preference" } });

  test("the entrance band releases a block while the page is still scrolling, before any idle gap", async ({ page }) => {
    /*
     * THE OBSERVER'S OWN TEST, the jump test's mirror. The idle sweep runs only
     * after IDLE_MS (200ms) without a scroll, resize or edge report, and every
     * scroll restarts that wait (`src/lib/reveal-observer.ts`). A release that
     * lands while scroll events are still arriving less than 200ms apart can
     * therefore only have come from the IntersectionObserver's entrance band —
     * a band that released nothing would leave the jump test green and this red.
     *
     * Scrolled in-page, a few pixels per animation frame, so the gaps are frame
     * gaps and not Playwright's input latency. A long task that stalls the page
     * for 200ms shows up as a gap and fails the test loudly, never vacuously.
     */
    await page.goto("/en/terms", { waitUntil: "load" });
    await waitForArming(page, '.d-terms-section[data-reveal="armed"]');

    const r = await page.evaluate(
      () =>
        new Promise<{ scrolls: number; releasesBeforeScroll: number; releases: number; maxGap: number; scrolledAfterFirst: boolean }>(
          (resolve) => {
            const scrolls: number[] = [];
            let first = -1;
            let releases = 0;
            let releasesBeforeScroll = 0;
            addEventListener("scroll", () => scrolls.push(performance.now()), { passive: true });
            new MutationObserver((records) => {
              for (const rec of records) {
                if (rec.oldValue !== "armed" || (rec.target as Element).getAttribute("data-reveal") !== "in") continue;
                /* A release before this test scrolled at all proves nothing about the band. */
                if (!scrolls.length) {
                  releasesBeforeScroll++;
                  continue;
                }
                releases++;
                if (first < 0) first = performance.now();
              }
            }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal"], attributeOldValue: true });

            let frames = 0;
            const step = () => {
              window.scrollBy(0, 24);
              frames++;
              /* Keep scrolling ~100ms past the first release, so "still scrolling" is observed, then stop. */
              if ((first < 0 || performance.now() - first < 100) && frames < 600) {
                requestAnimationFrame(step);
                return;
              }
              const upTo = first < 0 ? Infinity : first;
              const before = scrolls.filter((t) => t <= upTo);
              let maxGap = 0;
              for (let i = 1; i < before.length; i++) maxGap = Math.max(maxGap, before[i]! - before[i - 1]!);
              if (first >= 0 && before.length) maxGap = Math.max(maxGap, first - before[before.length - 1]!);
              resolve({
                scrolls: scrolls.length,
                releasesBeforeScroll,
                releases,
                maxGap: Math.round(maxGap),
                scrolledAfterFirst: first >= 0 && scrolls.some((t) => t > first),
              });
            };
            requestAnimationFrame(step);
          }
        )
    );

    expect(r.scrolls, "no scroll events fired — the page did not scroll").toBeGreaterThan(5);
    expect(r.releases, "nothing was released during continuous scrolling").toBeGreaterThan(0);
    expect(
      r.maxGap,
      `a ${r.maxGap}ms gap between scroll events before the first release: the idle sweep could have released it, so the band is unproven`
    ).toBeLessThan(200);
    expect(r.scrolledAfterFirst, "scrolling had already stopped when the first release came").toBe(true);
  });
});

/* ------------------------------------------------------------------ 7 -- */

test.describe("reveals — reduced motion", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "reduce" } });

  for (const [route, kind] of [
    ["/en/gallery", "image"],
    ["/en/terms", "text"],
  ] as const) {
    test(`${route}: no curtain, no scale and no rise at any frame`, async ({ page }) => {
      await page.addInitScript((rest) => {
        const s = {
          frames: 0,
          curtains: 0,
          armedText: 0,
          armedImage: 0,
          released: 0,
          fades: 0,
          violations: [] as string[],
        };
        (window as unknown as { __rm: typeof s }).__rm = s;
        const note = (msg: string) => {
          if (s.violations.length < 20 && !s.violations.includes(msg)) s.violations.push(msg);
        };
        const check = () => {
          s.frames++;
          const curtains = document.querySelectorAll(".reveal-curtain");
          s.curtains = Math.max(s.curtains, curtains.length);
          for (const c of curtains) {
            const t = getComputedStyle(c).transform;
            if (t !== rest) note(`a curtain was given ${t}`);
          }
          for (const m of document.querySelectorAll(".image-reveal-media")) {
            const t = getComputedStyle(m).transform;
            if (t !== "none") note(`a photograph was given ${t}`);
          }
          for (const el of document.querySelectorAll('.reveal[data-reveal="armed"]')) {
            s.armedText++;
            const cs = getComputedStyle(el);
            if (cs.transform !== "none") note(`an armed text block was given ${cs.transform}`);
            if (cs.opacity !== "0") note(`an armed text block sits at opacity ${cs.opacity}`);
          }
          for (const el of document.querySelectorAll('.image-reveal[data-reveal="armed"]')) {
            s.armedImage++;
            const cs = getComputedStyle(el);
            if (cs.opacity !== "0") note(`an armed frame sits at opacity ${cs.opacity}`);
          }
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);

        /*
         * The entrance itself: at each release, what starts animating in the
         * element and everything inside it. An opacity transition, and never
         * a transform one — a curtain or a settle that ran for 0.01ms would
         * slip between two animation frames of the check above.
         */
        new MutationObserver((records) => {
          for (const r of records) {
            const el = r.target as Element;
            if (r.oldValue !== "armed" || el.getAttribute("data-reveal") !== "in") continue;
            s.released++;
            /* Transitions only: an image's own `.blur-up` keyframes may be mid-run. */
            const props = el
              .getAnimations({ subtree: true })
              .filter((a): a is CSSTransition => a instanceof CSSTransition)
              .map((a) => a.transitionProperty);
            if (props.includes("opacity")) s.fades++;
            for (const p of props) if (p !== "opacity") note(`a release started a ${p} animation`);
          }
        }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal"], attributeOldValue: true });
      }, CURTAIN_AT_REST);

      await page.goto(route, { waitUntil: "load" });
      await waitForArming(page);
      await walkToBottom(page);

      const s = await page.evaluate(
        () =>
          (window as unknown as {
            __rm: {
              frames: number;
              curtains: number;
              armedText: number;
              armedImage: number;
              released: number;
              fades: number;
              violations: string[];
            };
          }).__rm
      );
      expect(s.frames, "the per-frame check barely ran").toBeGreaterThan(10);
      if (kind === "image") {
        expect(s.curtains, "no curtains on the page — nothing was checked").toBeGreaterThan(0);
        expect(s.armedImage, "no frame was ever armed under reduced motion — nothing was checked").toBeGreaterThan(0);
      } else {
        expect(s.armedText, "no text block was ever armed under reduced motion — nothing was checked").toBeGreaterThan(0);
      }
      expect(s.released, "nothing was released under reduced motion — the entrance was not checked").toBeGreaterThan(0);
      expect(s.violations, `${route} moved something under prefers-reduced-motion`).toEqual([]);
      expect(
        s.fades,
        `${route}: of ${s.released} releases, ${s.fades} faded in — the reduced entrance is an opacity transition`
      ).toBe(s.released);
      expect(
        await page.evaluate(() => document.querySelectorAll('[data-reveal="armed"]').length),
        `${route}: reveals still armed after walking the whole page`
      ).toBe(0);
    });
  }
});

/* ------------------------------------------------------------------ 8 -- */

test.describe("reveals — scripting off", () => {
  test.use({ javaScriptEnabled: false });

  for (const route of STRUCTURAL_ROUTES) {
    test(`${route}: every reveal is visible and at rest`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });

      const r = await page.evaluate((rest) => {
        const effective = (el: Element) => {
          let o = 1;
          for (let n: Element | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
          return o;
        };
        const hosts = [...document.querySelectorAll(".reveal, .image-reveal")];
        return {
          hosts: hosts.length,
          armed: document.querySelectorAll("[data-reveal]").length,
          faded: hosts.filter((el) => effective(el) !== 1).map((el) => el.className),
          moved: [...document.querySelectorAll(".reveal, .image-reveal-media")]
            .filter((el) => getComputedStyle(el).transform !== "none")
            .map((el) => el.className),
          curtained: [...document.querySelectorAll(".reveal-curtain")].filter(
            (c) => getComputedStyle(c).transform !== rest
          ).length,
        };
      }, CURTAIN_AT_REST);

      expect(r.hosts, `${route} has no reveal elements — nothing was checked`).toBeGreaterThan(0);
      expect(r.armed, `${route}: something was armed with scripting off`).toBe(0);
      expect(r.faded, `${route}: reveal content is faded with scripting off`).toEqual([]);
      expect(r.moved, `${route}: reveal content is displaced with scripting off`).toEqual([]);
      expect(r.curtained, `${route}: a curtain covers a photograph with scripting off`).toBe(0);
    });
  }
});
