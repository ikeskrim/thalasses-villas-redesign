import { expect, test, type Page } from "@playwright/test";

/**
 * THE CLAUSE, THE INVENTORY AND THE LEDGER WITHOUT FRAMER — `DECISIONS.md` D-028.
 *
 * The owner's ruling: "Remaining Framer on the estate page and footer: measure
 * the cost, then defer." The mechanism is the one D-026 removed from the scroll
 * reveals. Framer serialised its `initial` state into the served HTML:
 *   - every animated hero tail arrived at opacity 0 with its characters pulled
 *     left (estate 18, villa-thoi 26, weddings 25 characters);
 *   - the first inventory panel arrived at opacity 0, 10px low, although the
 *     inventory's animation is documented as a response to a click
 *     (PHASE-3-DELIVERABLES §2, row 4);
 *   - the footer's clause never animated at all, and still made every page
 *     preload the 120 kB Framer chunk.
 *
 * Now the Clause is plain server markup, and an animated tail tracks open in
 * CSS: transform only, on `screen`, with motion allowed. The inventory switch is
 * a Web Animation started by the click that asked for it. The ledger's count-up
 * has its own observer. Each check asserts the mechanism AND that the motion is
 * still there, because deleting an animation would pass a "nothing hidden"
 * check too:
 *
 *   1. Served HTML: no clause character and no inventory panel carries an inline
 *      opacity 0 or an inline transform, on every template that renders one.
 *   2. Motion allowed: the hero tail runs `clause-track` from first paint, with
 *      the documented 1.05s, easing, 12ms stagger (from the last character)
 *      and per-character offsets; no two neighbouring characters ever stand
 *      closer than in the closed tail, so it never overprints itself; it is
 *      never faded, and it comes to rest.
 *   3. Reduced motion: no hero character is ever translated, no animation is
 *      ever attached to one, and the tail is never faded.
 *   4. The first inventory panel is never hidden, moved or animated, through
 *      hydration and after it.
 *   5. A click on a group animates the panel that replaces it: opacity and a
 *      10px rise over 0.5s; opacity only, over 0.25s, under reduced motion.
 *  5b. A second click during that animation leaves the new panel one
 *      animation, its own, and it comes to rest; a click on the group already
 *      shown neither replaces nor animates its panel.
 *   6. The ledger counts up on first entry — not before it, and not again on a
 *      second entry — from the true value, and lands on it; under reduced
 *      motion only the true value is ever printed.
 *
 * Every check first proves it is looking at something (CONVENTIONS §18).
 *
 * FALSIFICATIONS (CONVENTIONS §16). RUN on 2026-09-18: eight source mutations,
 * each built on its own (`next build` in this worktree), each proven present in
 * the build it ran on — in the served HTML, the built CSS or a built chunk —
 * and each red at its own named assertion.
 *   - M1, three mutations at once, each with its own target: an inline
 *     `opacity: 0` on every clause character; `motion` imported back into
 *     `Inventory`; the ledger's `isIntersecting` gate dropped, so the
 *     observer's first, off-screen callback starts the count-up at hydration.
 *     → 1 red on all eleven routes at "serves clause characters at opacity 0"
 *     (71 of 71 characters on the estate); 2 red at "the tail was faded
 *     (effective opacity 0)"; 3 red at "the tail was faded under reduced
 *     motion"; `qa.spec.ts` red at "faded to 0 under reduced motion";
 *     `perf-structure.spec.ts` red at "loads framer-motion" on the estate,
 *     the five villas and weddings and green on `/`, location, the
 *     experiences, careers, contact, terms, the gallery, the styleguide and
 *     the 404; 6 red at "the count-up ran before the ledger was reached (31
 *     frames below the truth)", with the reduced-motion ledger still green.
 *   - M2, the `clause-track` keyframes renamed so `animation-name` resolves to
 *     nothing → 2 red at "has no clause-track animation on these characters";
 *     3 and `qa.spec.ts` green.
 *   - M3a, the `no-preference` condition dropped from the animation's media
 *     query, `transform: none !important` left in place → 3 red at "an
 *     animation was attached under reduced motion" (120 to 206 samples), while
 *     "translated under reduced motion" stayed GREEN: `globals.css`'s
 *     `!important` still held every character at rest. It is the second guard,
 *     not the first.
 *   - M3, the same with that rule removed as well → 3 red at "a character was
 *     translated under reduced motion" (124 to 259 samples). 2 green, and
 *     `qa.spec.ts`'s after-load transform check green: by the time it reads,
 *     the tail is at rest.
 *   - M4, the stagger back to the forward direction (the build the review
 *     measured) → 2 red at "the tail overprinted itself": two neighbours came
 *     −9.56 px (estate), −12.83 px (villa-thoi) and −11.83 px (weddings)
 *     closer than at rest, against the closed tail's −4.80 px. This is the
 *     assertion that keeps the tail legible without a fade.
 *   - M6, the stagger at 24ms, still from the last character → 2 red at "the
 *     stagger is not 12ms per character from the last", with the overprint
 *     check green: direction and interval are guarded separately.
 *   - M5, two mutations: a hook-only Framer import (`useReducedMotion`) in
 *     `Inventory`, and a panel node reused across switches (no `key`) whose
 *     previous animation is never cancelled → `perf-structure.spec.ts` red at
 *     "loads framer-motion" on the seven animated templates THROUGH THE BARE
 *     `"(prefers-reduced-motion)"` QUERY ALONE: no chunk in that build held
 *     all three of the old literals (transformPerspective 1, originX 0,
 *     pathLength 0), so the three-literal signature saw nothing. 5b red at
 *     "after a second click mid-switch the panel runs 2 animations, not one",
 *     and 5 red at "the panel was never replaced" (the reused node).
 *   - M7, the switch no longer gated on a click, so every commit animates → 4
 *     red at "the first panel was faded (opacity 0) without a click" and 5 red
 *     at "the first panel was animated before any click".
 *   - M8, `el.animate()` never reached (the no-WAAPI fallback always taken)
 *     → 5 red at "the switch did not animate (0 animations on the new panel)"
 *     with motion allowed and under reduced motion, and 5b red at its own
 *     precondition, "the first switch was not running when the second click
 *     came — the overlap was not tested".
 * Against the Framer build itself (HEAD, d20fa2b), this same file ran on
 * 2026-09-17: 1 to 5 red on every route they cover, 5b and 6 green. The
 * switch's edges and the count-up's behaviour are kept, not changed; the
 * served state, the hero tail and the first panel are what changed.
 *
 * NOT FALSIFIABLE BY A ONE-LINE MUTATION, and why it is still asserted: the
 * "group already shown" half of 5b. Dropping the `g.clause === active` guard in
 * `Inventory` changes nothing observable, because `setActive` to the same value
 * makes React bail out before any effect runs. The assertion pins the
 * BEHAVIOUR for a mechanism that is not keyed by group, which M5's reused node
 * shows is a real regression shape.
 */

const NOT_FOUND = "/en/no-such-page-served-motion";
const VILLAS = ["villa-thoi", "villa-persi", "villa-eeanthe", "villa-melia", "villa-pueblo"];

/** [route, inventory panels it serves] */
const SERVED: [string, number][] = [
  ["/en/the-estate", 1],
  ...VILLAS.map((v): [string, number] => [`/en/villas/${v}`, 1]),
  ["/en/weddings", 1],
  ["/en/location", 0],
  ["/en/experiences", 0],
  ["/en/careers", 0],
  [NOT_FOUND, 0],
];

/** The three animated hero clauses the owner's captures cover. */
const HEROES = ["/en/the-estate", "/en/villas/villa-thoi", "/en/weddings"];

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } as const;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } as const;

/** Clause C1/C2 open tracking is 0.3em, translated at 16px per em (`Clause.tsx`). */
const C1_STEP = -4.8;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
/**
 * The 12ms stagger runs from the LAST character (`globals.css`): character i
 * of n waits (n − 1 − i) × 12ms, so no two neighbours are ever closer than in
 * the closed tail. Staggered from the first, the tail overprinted itself.
 */
const delayOf = (i: number, n: number) => (n - 1 - i) * 12;

/* ------------------------------------------------------------------ 1 -- */

test.describe("clause and inventory — the server HTML is the finished page", () => {
  for (const [route, panels] of SERVED) {
    test(`${route} serves clause characters and inventory panels with no hidden or moved state`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} did not answer as expected`).toBe(route === NOT_FOUND ? 404 : 200);
      const html = await res.text();

      const chars = html.match(/<span[^>]*\sclass="clause-char"[^>]*>/g) ?? [];
      const flows = html.match(/<div[^>]*\sclass="inventory-flow"[^>]*>/g) ?? [];
      expect(chars.length, `${route} serves no clause characters, so the checks below would look at nothing`).toBeGreaterThan(0);
      expect(flows.length, `${route} serves ${flows.length} inventory panels, expected ${panels}`).toBe(panels);

      /*
       * Inline style ATTRIBUTES of the two elements Framer used to write. The
       * `<noscript>` override in `layout.tsx` contains `[style*="opacity:0"]`
       * as a selector, so a bare substring search would find the guard.
       */
      const styleOf = (tag: string) => /\sstyle="([^"]*)"/.exec(tag)?.[1] ?? "";
      const transparent = (tags: string[]) =>
        tags.filter((t) => /(?:^|;)\s*opacity\s*:\s*0(?:\.0*)?\s*(?:;|$)/.test(styleOf(t)));
      const moved = (tags: string[]) => tags.filter((t) => /(?:^|;)\s*transform\s*:/.test(styleOf(t)));

      expect(transparent(chars), `${route} serves clause characters at opacity 0 — hidden before any script has run`).toEqual([]);
      expect(moved(chars), `${route} serves clause characters with an inline transform`).toEqual([]);
      expect(transparent(flows), `${route} serves the inventory panel at opacity 0`).toEqual([]);
      expect(moved(flows), `${route} serves the inventory panel with an inline transform`).toEqual([]);
    });
  }
});

/* --------------------------------------------------------------- 2, 3 -- */

type HeroSample = {
  frames: number;
  chars: number;
  first: { i: number; count: number; name: string | null; duration: number; delay: number; easing: string; currentTime: number | null; x: number }[] | null;
  minOpacity: number;
  moved: number;
  attached: number;
  /** The smallest (translation of a character − translation of the one before it) any frame showed, in px. */
  closest: number;
  pairs: number;
};

/** Every frame from the first one that has the hero's characters: opacity, translation, animations. */
function sampleHero() {
  const s: HeroSample = { frames: 0, chars: 0, first: null, minOpacity: 1, moved: 0, attached: 0, closest: 1e9, pairs: 0 };
  (window as unknown as { __hero: HeroSample }).__hero = s;
  const effective = (el: Element) => {
    let o = 1;
    for (let n: Element | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  const shift = (el: Element) => {
    const t = getComputedStyle(el).transform;
    return t === "none" ? 0 : new DOMMatrixReadOnly(t).m41;
  };
  const frame = () => {
    const chars = [...document.querySelectorAll("main h1.clause .clause-char")];
    if (chars.length) {
      s.frames++;
      s.chars = chars.length;
      /*
       * The first frame: each character's animation and where it stands. A
       * CSS animation is created when its element is first styled, so here
       * most characters are still inside their stagger delay, where the
       * `backwards` fill holds the starting offset exactly.
       */
      s.first ??= chars.map((el, i) => {
        const anims = el.getAnimations();
        const a = anims[0];
        const timing = a?.effect?.getComputedTiming();
        return {
          i,
          count: anims.length,
          name: a ? (a instanceof CSSAnimation ? a.animationName : a.constructor.name) : null,
          duration: Number(timing?.duration ?? 0),
          delay: Number(timing?.delay ?? 0),
          /* A CSS animation's timing function lives on its keyframes; the effect itself is linear. */
          easing: String((a?.effect as KeyframeEffect | null | undefined)?.getKeyframes()[0]?.easing ?? ""),
          currentTime: a?.currentTime == null ? null : Number(a.currentTime),
          x: shift(el),
        };
      });
      /*
       * Neighbours: how much closer than at rest a character stands to the one
       * before it. The closed tail at first paint is exactly one step; anything
       * below that is two characters piling onto each other.
       */
      let before: number | null = null;
      for (const el of chars) {
        const o = effective(el);
        const x = shift(el);
        if (o < s.minOpacity) s.minOpacity = o;
        if (Math.abs(x) > 0.01) s.moved++;
        if (el.getAnimations().length) s.attached++;
        if (before !== null) {
          s.pairs++;
          s.closest = Math.min(s.closest, x - before);
        }
        before = x;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const readHero = (page: Page) => page.evaluate(() => (window as unknown as { __hero: HeroSample }).__hero);

test.describe("clause — the hero tail tracks open in CSS, motion allowed", () => {
  test.use({ ...DESKTOP, contextOptions: { reducedMotion: "no-preference" } });

  for (const route of HEROES) {
    test(`${route}: the tail runs clause-track from first paint, is never faded, and comes to rest`, async ({ page }) => {
      await page.addInitScript(sampleHero);
      await page.goto(route, { waitUntil: "load" });
      /* 1.05s plus the last character's stagger, and a margin. */
      await page.waitForTimeout(2000);

      const s = await readHero(page);
      expect(s.frames, "the sampler barely ran — it never saw the hero's characters").toBeGreaterThan(10);
      expect(s.first, "no first frame was recorded").not.toBeNull();
      const first = s.first!;
      expect(first.length, "the hero changed its character count while it was sampled").toBe(s.chars);

      const unanimated = first.filter((c) => c.count !== 1 || c.name !== "clause-track").map((c) => `${c.i}: ${c.count} × ${c.name}`);
      expect(unanimated, `${route}: the hero tail has no clause-track animation on these characters`).toEqual([]);

      /*
       * LEGIBLE ON EVERY FRAME. No fade hides a waiting character, so no two
       * neighbours may ever stand closer than in the closed tail (one step).
       * The first frame shows that closed tail, so the minimum is the step
       * itself — unless the tail overprints.
       */
      expect(s.pairs, "no pair of neighbouring characters was sampled").toBeGreaterThan(0);
      expect(s.closest, `${route}: the closed tail was never sampled (closest pair ${s.closest}px) — the check below saw nothing`).toBeLessThanOrEqual(C1_STEP + 0.05);
      expect(
        s.closest,
        `${route}: two neighbouring characters came ${s.closest}px closer than at rest, past the closed tail's ${C1_STEP}px — the tail overprinted itself`
      ).toBeGreaterThanOrEqual(C1_STEP - 0.05);

      for (const c of first) {
        expect(c.duration, `character ${c.i}: the tail no longer tracks open over 1.05s`).toBe(1050);
        expect(c.easing, `character ${c.i}: the tail lost the site's easing`).toBe(EASE);
        expect(c.delay, `character ${c.i} of ${first.length}: the stagger is not 12ms per character from the last`).toBeCloseTo(delayOf(c.i, first.length), 3);
      }

      /* Characters still waiting out their stagger show the starting offset itself. */
      const waiting = first.filter((c) => c.currentTime !== null && c.currentTime < c.delay);
      expect(waiting.length, "no character was still inside its stagger on the first frame — the offsets were not observed").toBeGreaterThan(2);
      for (const c of waiting) {
        expect(c.x, `character ${c.i} started at ${c.x}px, not at ${c.i} × ${C1_STEP}px`).toBeCloseTo(c.i * C1_STEP, 2);
      }
      expect(s.moved, "no frame showed a translated character — the tail never moved").toBeGreaterThan(0);

      expect(s.minOpacity, `${route}: the tail was faded (effective opacity ${s.minOpacity}) — it must be legible from first paint`).toBe(1);

      const rest = await page.evaluate(() =>
        [...document.querySelectorAll("main h1.clause .clause-char")].map((el) => `${getComputedStyle(el).transform} ${el.getAnimations().length}`)
      );
      expect(new Set(rest), `${route}: the tail did not come to rest at its final tracking`).toEqual(new Set(["none 0"]));
    });
  }
});

test.describe("clause — the hero tail under reduced motion", () => {
  test.use({ ...PHONE, contextOptions: { reducedMotion: "reduce" } });

  for (const route of HEROES) {
    test(`${route}: no character is ever translated, animated or faded`, async ({ page }) => {
      await page.addInitScript(sampleHero);
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(2000);

      const s = await readHero(page);
      expect(s.frames, "the sampler barely ran — it never saw the hero's characters").toBeGreaterThan(10);
      expect(s.chars, "the hero has no tail characters — nothing was checked").toBeGreaterThan(0);
      expect(s.moved, `${route}: a character was translated under reduced motion (${s.moved} samples)`).toBe(0);
      expect(s.attached, `${route}: an animation was attached under reduced motion (${s.attached} samples)`).toBe(0);
      expect(s.minOpacity, `${route}: the tail was faded under reduced motion (effective opacity ${s.minOpacity})`).toBe(1);
    });
  }
});

/* --------------------------------------------------------------- 4, 5 -- */

/** React has attached itself to the inventory rail: the page's script provably ran there. */
async function waitForInventoryHydration(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const b = document.querySelector(".inventory-group");
          return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber$"));
        }),
      { message: "the inventory never hydrated, so nothing after this proves anything", timeout: 15_000 }
    )
    .toBe(true);
}

type PanelSample = { frames: number; minOpacity: number; moved: number; animated: number };

test.describe("inventory — the first panel is never hidden", () => {
  test.use({ ...DESKTOP, contextOptions: { reducedMotion: "no-preference" } });

  for (const route of HEROES) {
    test(`${route}: the first panel is at rest from first paint, through hydration and after`, async ({ page }) => {
      await page.addInitScript(() => {
        const s: PanelSample = { frames: 0, minOpacity: 1, moved: 0, animated: 0 };
        (window as unknown as { __panel: PanelSample }).__panel = s;
        const frame = () => {
          const f = document.querySelector(".inventory-flow");
          if (f) {
            s.frames++;
            /* Its own values: the old hidden state sat on the panel itself. */
            const cs = getComputedStyle(f);
            s.minOpacity = Math.min(s.minOpacity, parseFloat(cs.opacity));
            if (cs.transform !== "none") s.moved++;
            if (f.getAnimations().length) s.animated++;
          }
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      await page.goto(route, { waitUntil: "load" });
      await waitForInventoryHydration(page);
      /* Framer's entrance ran for 0.5s after hydration; give anything like it time to show. */
      await page.waitForTimeout(1200);

      const s = await page.evaluate(() => (window as unknown as { __panel: PanelSample }).__panel);
      expect(s.frames, "the sampler never saw an inventory panel").toBeGreaterThan(10);
      expect(s.minOpacity, `${route}: the first panel was faded (opacity ${s.minOpacity}) without a click`).toBe(1);
      expect(s.moved, `${route}: the first panel was moved in ${s.moved} samples without a click`).toBe(0);
      expect(s.animated, `${route}: the first panel was animated without a click (${s.animated} samples)`).toBe(0);
    });
  }
});

type SwitchRecord = { kind: string; duration: number; easing: string; keyframes: { opacity: string | null; transform: string | null }[] }[];

for (const [mode, profile, expected] of [
  [
    "no-preference",
    DESKTOP,
    {
      kind: "Animation",
      duration: 500,
      easing: EASE,
      keyframes: [
        { opacity: "0", transform: "translateY(10px)" },
        { opacity: "1", transform: "none" },
      ],
    },
  ],
  [
    "reduce",
    PHONE,
    {
      kind: "Animation",
      duration: 250,
      easing: EASE,
      keyframes: [
        { opacity: "0", transform: null },
        { opacity: "1", transform: null },
      ],
    },
  ],
] as const) {
  test.describe(`inventory — the switch animates on a click, reduced motion ${mode}`, () => {
    test.use({ ...profile, contextOptions: { reducedMotion: mode } });

    for (const route of ["/en/villas/villa-thoi", "/en/the-estate"]) {
      test(`${route}: a click on a group animates the panel that replaces the first`, async ({ page }) => {
        await page.goto(route, { waitUntil: "load" });
        await waitForInventoryHydration(page);

        const groups = page.locator(".inventory-group");
        expect(await groups.count(), `${route} has fewer than two inventory groups — no switch to make`).toBeGreaterThan(1);
        await groups.nth(1).scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        const before = await page.evaluate(() => {
          const f = document.querySelector(".inventory-flow")!;
          f.setAttribute("data-test-first-panel", "");
          /* What the replacement panel is running at the moment it is inserted. */
          const w = window as unknown as { __switch: SwitchRecord | null };
          w.__switch = null;
          new MutationObserver((_, mo) => {
            const next = document.querySelector(".inventory-flow");
            if (!next || next.hasAttribute("data-test-first-panel")) return;
            mo.disconnect();
            w.__switch = next.getAnimations().map((a) => {
              const effect = a.effect as KeyframeEffect;
              return {
                kind: a.constructor.name,
                duration: Number(effect.getTiming().duration),
                easing: String(effect.getTiming().easing),
                keyframes: effect.getKeyframes().map((k) => ({
                  opacity: k.opacity == null ? null : String(k.opacity),
                  transform: k.transform == null ? null : String(k.transform),
                })),
              };
            });
          }).observe(document.querySelector(".inventory-body")!, { childList: true, subtree: true });
          return { animations: f.getAnimations().length };
        });
        expect(before.animations, `${route}: the first panel was animated before any click`).toBe(0);

        await groups.nth(1).click();
        await expect(groups.nth(1), "the click did not switch the group").toHaveAttribute("aria-current", "true");
        await expect
          .poll(() => page.evaluate(() => (window as unknown as { __switch: SwitchRecord | null }).__switch), {
            message: "the panel was never replaced — the switch was not observed",
            timeout: 5_000,
          })
          .not.toBeNull();

        const sw = await page.evaluate(() => (window as unknown as { __switch: SwitchRecord }).__switch);
        expect(sw.length, `${route}: the switch did not animate (${sw.length} animations on the new panel)`).toBe(1);
        expect(sw[0], `${route}: the switch is not the documented one for reduced motion ${mode}`).toEqual(expected);

        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const f = document.querySelector(".inventory-flow")!;
                const cs = getComputedStyle(f);
                return `${cs.opacity} ${cs.transform} ${f.getAnimations().length}`;
              }),
            { message: "the new panel never came to rest", timeout: 5_000 }
          )
          .toBe("1 none 0");
      });
    }
  });
}

/* ----------------------------------------------------------------- 5b -- */

/*
 * THE SWITCH'S EDGES. A second click while the first switch is still running
 * leaves the new panel with ONE animation, its own, and it comes to rest; a
 * click on the group already shown neither replaces nor animates its panel.
 * Today the panel is keyed by group, so a switch replaces the element and a
 * same-group click changes no state; these check the behaviour, whatever the
 * mechanism becomes.
 */
test.describe("inventory — a second click mid-switch, and a click on the group already shown", () => {
  test.use({ ...DESKTOP, contextOptions: { reducedMotion: "no-preference" } });

  for (const route of ["/en/villas/villa-thoi", "/en/the-estate"]) {
    test(`${route}: one animation per switch, and none for the group already shown`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await waitForInventoryHydration(page);

      const groups = page.locator(".inventory-group");
      expect(await groups.count(), `${route} has fewer than three inventory groups — no second switch to make`).toBeGreaterThan(2);
      await groups.nth(2).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      /* Both clicks in the page, 100ms apart, so the gap is the page's and not the driver's. */
      const mid = await page.evaluate(async () => {
        const buttons = [...document.querySelectorAll<HTMLButtonElement>(".inventory-group")];
        const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
        buttons[1]!.click();
        await frame();
        await new Promise((r) => setTimeout(r, 100));
        const running = document
          .querySelector(".inventory-flow")!
          .getAnimations()
          .map((a) => ({ state: a.playState, time: Number(a.currentTime ?? -1) }));
        buttons[2]!.click();
        await frame();
        return {
          running,
          current: buttons[2]!.getAttribute("aria-current"),
          now: document
            .querySelector(".inventory-flow")!
            .getAnimations()
            .map((a) => ({ state: a.playState, time: Number(a.currentTime ?? -1) })),
        };
      });
      expect(mid.running.map((a) => a.state), "the first switch was not running when the second click came — the overlap was not tested").toEqual(["running"]);
      expect(mid.current, "the second click did not switch the group").toBe("true");
      expect(mid.now.length, `${route}: after a second click mid-switch the panel runs ${mid.now.length} animations, not one`).toBe(1);
      expect(
        mid.now[0]!.time,
        `${route}: the panel's animation is ${mid.now[0]!.time}ms in — the first switch's (${mid.running[0]!.time}ms at the second click), not the second's`
      ).toBeLessThan(mid.running[0]!.time);

      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const f = document.querySelector(".inventory-flow")!;
              const cs = getComputedStyle(f);
              return `${cs.opacity} ${cs.transform} ${f.getAnimations().length}`;
            }),
          { message: "the panel never came to rest after two quick switches", timeout: 5_000 }
        )
        .toBe("1 none 0");

      const shown = await page.evaluate(() => {
        const f = document.querySelector(".inventory-flow")!;
        f.setAttribute("data-test-shown-panel", "");
        return f.textContent;
      });
      await groups.nth(2).click();
      await page.waitForTimeout(150);
      const again = await page.evaluate(() => {
        const f = document.querySelector(".inventory-flow")!;
        return { kept: f.hasAttribute("data-test-shown-panel"), text: f.textContent, animations: f.getAnimations().length };
      });
      await expect(groups.nth(2), "a click on the group already shown moved the selection").toHaveAttribute("aria-current", "true");
      expect(again.kept && again.text === shown, `${route}: a click on the group already shown replaced its panel`).toBe(true);
      expect(again.animations, `${route}: a click on the group already shown animated its panel`).toBe(0);
    });
  }
});

/* ------------------------------------------------------------------ 6 -- */

type LedgerSample = {
  frames: number;
  truth: string[] | null;
  /** Where the ledger stood on the first frame, and the viewport height then. */
  top: number | null;
  vh: number;
  texts: string[][];
  /** Frames on which a plain integer (> 1) was printed below its true value: the count-up running. */
  below: number;
};

function sampleLedger() {
  const s: LedgerSample = { frames: 0, truth: null, top: null, vh: 0, texts: [], below: 0 };
  (window as unknown as { __ledger: LedgerSample }).__ledger = s;
  const frame = () => {
    const values = [...document.querySelectorAll(".d-ledger .ledger-spec-value")].map((e) => (e.textContent ?? "").trim());
    if (values.length) {
      s.frames++;
      /* The first frame is the server's HTML: the truth, by rule (CONVENTIONS §7). */
      if (!s.truth) {
        s.truth = values;
        s.top = document.querySelector(".d-ledger")!.getBoundingClientRect().top;
        s.vh = window.innerHeight;
      }
      const truth = s.truth;
      const counting = values.some((v, i) => {
        const t = Number(truth[i]);
        const n = Number(v);
        return Number.isFinite(t) && t > 1 && Number.isFinite(n) && n < t;
      });
      if (counting) s.below++;
      const key = values.join("|");
      if (!s.texts.some((t) => t.join("|") === key) && s.texts.length < 400) s.texts.push(values);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const readLedger = (page: Page) => page.evaluate(() => (window as unknown as { __ledger: LedgerSample }).__ledger);
const ledgerNow = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll(".d-ledger .ledger-spec-value")].map((e) => (e.textContent ?? "").trim()));
const centreLedger = (page: Page) => page.evaluate(() => document.querySelector(".d-ledger")!.scrollIntoView({ block: "center" }));

/*
 * FIRST ENTRY, ONCE. The count-up is an event (`Ledger.tsx`): it must not run
 * before the ledger is reached — the estate's ledger starts below its entry
 * band, under a 92svh hero — it must run when it is, and it must not run again
 * when the reader scrolls away and back.
 */
for (const [mode, counts] of [
  ["no-preference", true],
  ["reduce", false],
] as const) {
  test.describe(`ledger — the count-up, reduced motion ${mode}`, () => {
    test.use({ ...DESKTOP, contextOptions: { reducedMotion: mode } });

    test(`the estate ledger ${counts ? "counts up on first entry only, once, and lands on the truth" : "prints only the true values"}`, async ({ page }) => {
      await page.addInitScript(sampleLedger);
      await page.goto("/en/the-estate", { waitUntil: "load" });
      await waitForInventoryHydration(page);
      /* Longer than a whole count-up (600ms): one started at hydration, off-screen, has printed by now. */
      await page.waitForTimeout(900);

      const before = await readLedger(page);
      expect(before.frames, "the sampler never saw the ledger").toBeGreaterThan(10);
      const truth = before.truth!;
      expect(truth.length, "the ledger has no values").toBeGreaterThan(0);
      expect(truth, "the served ledger states a zero").not.toContain("0");
      expect(
        truth.filter((t) => Number.isFinite(Number(t)) && Number(t) > 1).length,
        "the ledger has no plain integer to count"
      ).toBeGreaterThan(0);
      expect(
        before.top!,
        `the ledger started inside its entry band (top ${before.top}px of ${before.vh}px), so "not before entry" cannot be checked`
      ).toBeGreaterThan(before.vh * 0.85);
      expect(before.below, `the count-up ran before the ledger was reached (${before.below} frames below the truth)`).toBe(0);
      expect(await ledgerNow(page), "the ledger changed before it was reached").toEqual(truth);

      await centreLedger(page);
      await page.waitForTimeout(1500);
      const entered = await readLedger(page);
      expect(await ledgerNow(page), "the ledger did not land on the true values").toEqual(truth);
      if (counts) {
        expect(entered.below, "the count-up never ran: no frame printed a value below its truth").toBeGreaterThan(0);
      } else {
        expect(entered.texts, "under reduced motion the ledger printed something other than the truth").toEqual([truth]);
      }

      /* Away, out of the band, and back. */
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const away = await page.evaluate(() => {
        const r = document.querySelector(".d-ledger")!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, vh: window.innerHeight };
      });
      expect(
        away.top > away.vh * 0.85 || away.bottom < away.vh * 0.15,
        `scrolling away left the ledger in its entry band (${Math.round(away.top)} to ${Math.round(away.bottom)} of ${away.vh}px) — "once" was not tested`
      ).toBe(true);
      await centreLedger(page);
      await page.waitForTimeout(1200);
      const back = await readLedger(page);
      expect(
        back.below,
        `the count-up ran again on a second entry (${back.below - entered.below} more frames below the truth) — it runs once`
      ).toBe(entered.below);
      expect(await ledgerNow(page), "the ledger did not stay on the true values").toEqual(truth);
    });
  });
}
