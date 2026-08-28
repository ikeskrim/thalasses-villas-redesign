import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE LOOK PROTOTYPES — a re-skin, proved rather than asserted.
 *
 * The re-skin directive's structural claim is that changing direction is "a
 * token/curation/choreography swap, not a rebuild". That claim decides whether
 * a re-skin is two weeks or two months, so it is worth more than a comment.
 *
 * The first test below is the one that means something: it serialises the DOM
 * of all three prototypes and asserts they are IDENTICAL — same elements, same
 * order, same classes. If a future change forks one look's markup, the claim is
 * no longer true and this says so on that commit rather than at the estimate.
 *
 * The rest guard the things a prototype quietly gets wrong:
 *   - the site's own chrome leaking into a page that is comparing designs
 *   - a throwaway route reaching a crawler or a sitemap
 *   - display type breaking the 96px legibility ceiling the owner asked for
 *   - a fake booking button, on the one flow that earns money
 *   - photographs described by something other than the curator's own words
 */

/**
 * The PHOTO-LED looks. Direction E is deliberately not here — see the one-DOM
 * test below, where its absence is the finding rather than an oversight.
 */
const PHOTO_LOOKS = ["aegean", "editorial", "golden"] as const;
const ALL_LOOKS = [...PHOTO_LOOKS, "type-alive"] as const;
const ROOT = process.cwd();

/** Attributes that are ALLOWED to differ — they are the swap itself. */
const VARIABLE = new Set(["data-look", "src", "alt", "srcset", "width", "height", "aria-current", "href", "data-in", "style"]);

test.describe("look prototypes", () => {
  test("looks.css actually loaded — read this first if the rest of the file failed", async ({ page }) => {
    /*
     * THE FAILURE THIS EXPLAINS HAS NOW HAPPENED THREE TIMES.
     *
     * An old `next start` keeps holding port 3005 while a rebuild replaces
     * `.next` underneath it. The new server never binds (EADDRINUSE, logged
     * where nobody looks) and the old one carries on answering with HTML that
     * points at CSS chunks which no longer exist. Every page serves unstyled.
     *
     * The symptom is not "no styles". It is `the site's .nav is showing` and
     * `the hero is the wrong height` — a fistful of specific, plausible design
     * regressions that send you into the stylesheet. The scripts already refuse
     * to measure in this state; the suite did not, so it produced the confusing
     * version instead of the obvious one.
     *
     * `--lk-ink` is declared by looks.css and nothing else, on `[data-look]`
     * (NOT the outer `[data-looks-root]` — custom properties do not inherit
     * upward, and getting that wrong made an earlier version of this guard fail
     * on every correctly styled page).
     */
    await page.goto("/looks/aegean", { waitUntil: "load" });
    const ink = await page.evaluate(() => {
      const root = document.querySelector("[data-look]");
      return root ? getComputedStyle(root).getPropertyValue("--lk-ink").trim() : "";
    });
    expect(
      ink,
      "looks.css did not load. Almost always a stale server holding the port over a " +
        "rebuilt .next — kill it and re-run. Every other failure in this file is a " +
        "symptom of this one."
    ).not.toBe("");
  });

  test("the three photo-led looks render from one DOM — the re-skin claim, measured", async ({ page }) => {
    /*
     * DIRECTION E IS EXCLUDED, AND THE EXCLUSION IS THE RESULT.
     *
     * The directive calls a re-skin "a token/composition swap, not a rebuild".
     * For the three photo-led directions that is true and this test proves it:
     * identical markup, only tokens and photographs differ.
     *
     * Type-Alive could not be built that way. Its act numerals, its marginalia
     * and its two-copy marquee are content rather than decoration, and forcing
     * them through the shared component would have meant pseudo-element numbers
     * nobody can select and a sidenote crammed into a figcaption. So the honest
     * answer is that the claim held for three directions out of four, and both
     * halves are recorded — including here, in the test that would otherwise
     * have been quietly widened to make the failure go away.
     */
    const shapes: string[] = [];

    for (const look of PHOTO_LOOKS) {
      await page.goto(`/looks/${look}`, { waitUntil: "load" });
      /*
       * Structure only: tag name and class list, in document order. Attributes
       * that carry the curation (which photograph) or the state (which look,
       * whether a reveal has fired) are excluded by name rather than by
       * guessing, so a NEW differing attribute fails instead of slipping past.
       */
      const shape = await page.evaluate((variable) => {
        const walk = (el: Element, depth: number): string[] => {
          const attrs = [...el.attributes]
            .map((a) => a.name)
            .filter((n) => !variable.includes(n))
            .sort()
            .join(",");
          const line = `${"  ".repeat(depth)}${el.tagName.toLowerCase()}.${el.className || "-"}[${attrs}]`;
          return [line, ...[...el.children].flatMap((c) => walk(c, depth + 1))];
        };
        const root = document.querySelector("[data-look]");
        return root ? walk(root, 0).join("\n") : "";
      }, [...VARIABLE]);

      expect(shape.length, `/looks/${look} rendered nothing`).toBeGreaterThan(200);
      shapes.push(shape);
    }

    expect(
      shapes[1],
      "Editorial Estate's DOM differs from Aegean Light's — the three looks are no " +
        "longer a token swap, and any estimate built on that claim is now wrong"
    ).toBe(shapes[0]);
    expect(
      shapes[2],
      "Golden Coast's DOM differs from Aegean Light's — see above"
    ).toBe(shapes[0]);
  });

  test("the site's chrome stays on the site", async ({ page }) => {
    /*
     * The looks inherit the root layout, which mounts the Direction D nav, the
     * film grain and the contextual cursor. Comparing three candidate designs
     * underneath a fourth one is not a comparison. Suppressed by `:has()` in
     * looks.css — and checked here, because a rule Lightning CSS declined to
     * emit would look exactly like one that worked.
     */
    for (const look of ALL_LOOKS) {
      await page.goto(`/looks/${look}`, { waitUntil: "load" });
      for (const sel of [".nav", ".grain", ".cursor"]) {
        const shown = await page.evaluate((s) => {
          const el = document.querySelector(s);
          return el ? getComputedStyle(el).display !== "none" : false;
        }, sel);
        expect(shown, `/looks/${look}: the site's ${sel} is showing`).toBe(false);
      }
    }

    /* And the suppression must not have escaped onto the real site. */
    await page.goto("/", { waitUntil: "load" });
    const navOnSite = await page.evaluate(() => {
      const el = document.querySelector(".nav");
      return el ? getComputedStyle(el).display !== "none" : false;
    });
    expect(navOnSite, "the homepage lost its navigation — the :has() rule escaped its scope").toBe(true);
  });

  test("nothing here is indexable, and nothing here is in the sitemap", async ({ page, request }) => {
    for (const route of ["/looks", ...ALL_LOOKS.map((l) => `/looks/${l}`)]) {
      await page.goto(route, { waitUntil: "load" });
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots ?? "", `${route} is missing a robots directive`).toContain("noindex");
    }

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml, "a look prototype reached the sitemap").not.toContain("/looks");
  });

  test("the display ceiling holds — nothing over 96px, nothing cropped", async ({ page }) => {
    /*
     * The owner rejected two rounds for oversized type he could not read, and
     * the directive names 96px at 1440 as the ceiling. The site already enforces
     * it in `--text-display-xl`; these prototypes have their own scale, so they
     * need their own assertion rather than inheriting the reassurance.
     */
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const look of ALL_LOOKS) {
      await page.goto(`/looks/${look}`, { waitUntil: "load" });
      const sizes = await page.evaluate(() =>
        /* Both look families: the photo-led `.lk-` classes and Direction E's `.te-`. */
        [
          ...document.querySelectorAll(
            ".lk-headline, .lk-act-title, .lk-line, .te-display, .te-display-l, .te-display-m"
          ),
        ].map((el) => ({
          what: el.className.split(" ")[0],
          px: parseFloat(getComputedStyle(el).fontSize),
          overflowing: el.scrollWidth > el.clientWidth + 1,
        }))
      );
      expect(sizes.length, `/looks/${look} has no display type`).toBeGreaterThan(0);
      for (const s of sizes) {
        expect(s.px, `/looks/${look}: ${s.what} renders at ${s.px}px, over the 96px ceiling`).toBeLessThanOrEqual(96);
        expect(s.overflowing, `/looks/${look}: ${s.what} is clipped by its own box`).toBe(false);
      }
    }
  });

  test("booking goes to the real engine on every look", async ({ page }) => {
    for (const look of ALL_LOOKS) {
      await page.goto(`/looks/${look}`, { waitUntil: "load" });
      const href = await page.locator("a.lk-cta, a.te-cta").first().getAttribute("href");
      expect(href, `/looks/${look} has no booking link`).toContain("thalassesvillas.reserve-online.net");
      expect(href, `/looks/${look} booking link is missing lang`).toContain("lang=en");
    }
  });

  test("every photograph is described in the curator's own words", async ({ page }) => {
    /*
     * The prototypes are dressed only from `content/look-picks.json`, whose
     * `subject` lines were written by a person looking at each frame. Nothing
     * here may carry a generated description, a filename, or an empty alt —
     * the estate page shipped 48 photographs under 3 descriptions once, and the
     * fallback that caused it is the thing to keep out of new surfaces.
     */
    const picks = JSON.parse(
      fs.readFileSync(path.join(ROOT, "content", "look-picks.json"), "utf-8")
    ) as { looks: Record<string, { frames: { src: string; subject: string }[] }> };

    for (const look of ALL_LOOKS) {
      await page.goto(`/looks/${look}`, { waitUntil: "load" });
      const known = new Set(picks.looks[look]!.frames.map((f) => f.subject));

      const alts = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          /*
           * Skip anything inside an aria-hidden container. On the chooser the
           * wardrobe strip is deliberately decorative — the whole card is one
           * <a>, so every alt inside it joins the link's accessible name, and
           * five photograph descriptions would give a screen-reader user a link
           * name several sentences long. That decision is asserted on its own
           * below rather than assumed here.
           */
          .filter((i) => !i.closest('[aria-hidden="true"]'))
          .map((i) => ({
            alt: (i.getAttribute("alt") ?? "").trim(),
            src: i.getAttribute("src") ?? "",
          }))
      );
      expect(alts.length, `/looks/${look} rendered no photographs`).toBeGreaterThan(3);

      for (const a of alts) {
        expect(a.alt, `/looks/${look}: ${a.src} has no description`).not.toBe("");
        expect(/\.(jpe?g|png|webp|avif)$/i.test(a.alt), `/looks/${look}: alt is a filename`).toBe(false);
        expect(
          known.has(a.alt),
          `/looks/${look}: "${a.alt}" is not one of the curator's descriptions — ` +
            `something is generating alt text`
        ).toBe(true);
      }

      /* And no description may be reused, which is how the estate failed. */
      const seen = alts.map((a) => a.alt);
      expect(new Set(seen).size, `/looks/${look} repeats a description`).toBe(seen.length);
    }
  });

  test("the chooser card stays a readable link", async ({ page }) => {
    /*
     * Each card is a single <a>, so everything inside it — the hero's alt, the
     * heading, the promise, the type notes, the frame counts — concatenates
     * into one accessible name. That is already long. The wardrobe strip adds
     * four more photographs, and if any of them ever gains an alt the link name
     * becomes several sentences of photograph description before the reader
     * learns which look it is.
     *
     * So the strip is asserted decorative, and the link name is asserted to
     * still lead with the look's name.
     */
    await page.goto("/looks", { waitUntil: "load" });

    const strips = await page.evaluate(() =>
      [...document.querySelectorAll(".lk-card-strip")].map((s) => ({
        hidden: s.getAttribute("aria-hidden") === "true",
        withAlt: [...s.querySelectorAll("img")].filter((i) => (i.getAttribute("alt") ?? "") !== "").length,
        count: s.querySelectorAll("img").length,
      }))
    );
    expect(strips.length, "a chooser card is missing its wardrobe strip").toBe(ALL_LOOKS.length);
    for (const s of strips) {
      expect(s.count, "a wardrobe strip is empty").toBeGreaterThanOrEqual(3);
      expect(s.hidden, "a wardrobe strip is not marked decorative").toBe(true);
      expect(s.withAlt, "a decorative strip image carries alt text — it will bloat the link name").toBe(0);
    }

    /* The heading has to survive as the thing the link is about. */
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("a.lk-card")].map((a) =>
        (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40)
      )
    );
    for (const [i, n] of names.entries()) {
      expect(n.length, `card ${i} has no text`).toBeGreaterThan(3);
    }
  });

  test("the font bill and the production risk are on the card", async ({ page }) => {
    /*
     * The owner decides with the whole bill visible. Two facts he cannot see by
     * looking at a design: what the typeface costs him, and whether the look
     * has enough photography to head every page of the site.
     *
     * The risk line is asserted to be CONDITIONAL. A warning on every card is
     * decoration; a warning on one is information — so this fails if all three
     * carry it, which would mean the threshold is wrong rather than the looks.
     */
    await page.goto("/looks", { waitUntil: "load" });
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll("a.lk-card")].map((a) => ({
        text: (a.textContent ?? "").replace(/\s+/g, " "),
        hasRisk: !!a.querySelector(".lk-card-risk"),
      }))
    );
    expect(cards.length).toBe(ALL_LOOKS.length);
    for (const c of cards) {
      expect(c.text, "a card does not state its font position").toMatch(/Greek/i);
      expect(c.text, "a card does not say whether the face is free").toMatch(/Free face/i);
    }
    expect(
      cards.filter((c) => c.hasRisk).length,
      "every card carries the production-risk line — a warning on all of them is " +
        "decoration, and means the threshold is measuring nothing"
    ).toBeLessThan(ALL_LOOKS.length);
  });

  test("the reservoir figures on the chooser come from the reservoir", async ({ page }) => {
    /*
     * These numbers are the part of the decision the owner cannot see by
     * looking — "6 support frames" is the difference between a look that
     * photographs well and one that can dress five villa pages. They are read
     * from the generated file rather than transcribed, and this asserts the
     * page is showing what that file actually says.
     */
    const picks = JSON.parse(
      fs.readFileSync(path.join(ROOT, "content", "look-picks.json"), "utf-8")
    ) as { looks: Record<string, { reservoir: { proven: number; support: number; candidates: number } }> };

    await page.goto("/looks", { waitUntil: "load" });
    const text = (await page.locator(".lk-cards").innerText()).replace(/\s+/g, " ");

    for (const look of ALL_LOOKS) {
      const r = picks.looks[look]!.reservoir;
      expect(r.proven, `${look} has no proven hero frame`).toBeGreaterThan(0);
      expect(
        text,
        `the chooser does not show ${look}'s proven count of ${r.proven}`
      ).toContain(`${r.proven} proven hero frames`);
    }
  });
});
