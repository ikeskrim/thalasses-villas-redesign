import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/** Parity for the six Seasats-pattern components. */
test.describe("the six patterns", () => {
  test("1 — the litany renders every line and one payoff", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const lines = await page.locator(".litany-line").count();
    expect(lines).toBeGreaterThanOrEqual(4);
    expect(lines).toBeLessThanOrEqual(6);
    await expect(page.locator(".litany-payoff")).toHaveCount(1);
    // One frame per line, so a line can never be paired with nothing.
    expect(await page.locator(".litany-frame").count()).toBe(lines);
  });

  test("2 — three acts, four verified cards each", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });
    const acts = page.locator(".act");
    await expect(acts).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      expect(await acts.nth(i).locator(".act-card").count(), `act ${i + 1}`).toBe(4);
    }
    // Product register: act titles are imperatives and they CLOSE.
    for (const t of await page.locator(".act-title").allTextContents()) {
      expect(t.trim(), `"${t}" must close with a full stop`).toMatch(/\.$/);
    }
    // And never carry a fact-tail — that belongs to the Clause.
    expect(await page.locator(".act-title .clause-tail").count()).toBe(0);
  });

  test("2b — the act selector is keyboard operable with aria-current", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });
    const tabs = page.locator(".acts-tab");
    if (await tabs.count()) {
      await expect(page.locator('.acts-tab[aria-current="true"]')).toHaveCount(1);
      await tabs.nth(2).focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      await expect(page.locator('.acts-tab[aria-current="true"]')).toHaveCount(1);
    }
  });

  test("3 — the estate map renders every marker and a full list fallback", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const markers = await page.locator(".estate-map-marker").count();
    expect(markers).toBeGreaterThanOrEqual(6);
    expect(markers).toBeLessThanOrEqual(9);
    // The same places are always readable, never locked behind a pointer.
    expect(await page.locator(".estate-map-list-item").count()).toBe(markers);

    const first = page.locator(".estate-map-marker").first();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
  });

  test("4 — spec ledgers use tabular figures, never a table", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });
    expect(await page.locator(".ledger-inline").count()).toBeGreaterThan(0);
    // The banned elements stay banned.
    expect(await page.locator(".act-card table, .estate-map-card table").count()).toBe(0);
  });

  test("5 — chips filter to the right counts and survive in the URL", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    const dir = path.join(process.cwd(), "content", "experiences");
    const cats: Record<string, number> = {};
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const e = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as {
        categoryProposed: string;
      };
      cats[e.categoryProposed] = (cats[e.categoryProposed] ?? 0) + 1;
    }

    await expect(page.locator(".drag-card")).toHaveCount(21);

    for (const [cat, n] of Object.entries(cats)) {
      await page.locator(`.chip:has-text("${cat}")`).first().click();
      await page.waitForTimeout(250);
      await expect(page.locator(".drag-card"), `${cat} should show ${n}`).toHaveCount(n);
      expect(page.url().toLowerCase()).toContain(cat.toLowerCase());
    }

    // A linked filter restores on load.
    await page.goto("/#sea", { waitUntil: "load" });
    await page.waitForTimeout(300);
    await expect(page.locator(".drag-card")).toHaveCount(cats["Sea"]!);
  });

  test("6 — the odometer counts real metres", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator(".odometer")).toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    const text = await page.locator(".odometer").innerText();
    expect(text).toMatch(/\d+\.\d\s*m/);
  });

  test("registers never mix: no clause heads an act, no imperative takes a tail", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });
    // Clause labels never end in a full stop; act titles always do.
    const clauses = (
      await page.locator(".clause").evaluateAll((e) => e.map((x) => x.getAttribute("aria-label")))
    ).filter(Boolean) as string[];
    for (const c of clauses) expect(c).not.toMatch(/\.$/);
    const acts = await page.locator(".act-title").allTextContents();
    for (const a of acts) expect(a.trim()).toMatch(/\.$/);
  });
});

test.describe("T-203 — the pin must stay pinned", () => {
  test("no ancestor of the sticky stage carries a sticky-killing property", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });

    const bad = await page.evaluate(() => {
      const sticky = document.querySelector(".acts-sticky") as HTMLElement | null;
      if (!sticky) return ["no .acts-sticky element"];
      const out: string[] = [];
      if (getComputedStyle(sticky).position !== "sticky") {
        out.push(`.acts-sticky computed position is "${getComputedStyle(sticky).position}", not "sticky"`);
      }
      let el = sticky.parentElement;
      while (el && el !== document.documentElement) {
        const cs = getComputedStyle(el);
        const name = `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`;
        if (cs.transform !== "none") out.push(`${name} has transform`);
        if (cs.filter !== "none") out.push(`${name} has filter`);
        if (cs.backdropFilter !== "none") out.push(`${name} has backdrop-filter`);
        if (!["auto", ""].includes(cs.willChange)) out.push(`${name} has will-change: ${cs.willChange}`);
        if (!["none", ""].includes(cs.contain)) out.push(`${name} has contain: ${cs.contain}`);
        if (!cs.overflowY.includes("visible")) out.push(`${name} has overflow-y: ${cs.overflowY}`);
        el = el.parentElement;
      }
      return out;
    });
    expect(bad, `sticky chain compromised:\n  ${bad.join("\n  ")}`).toEqual([]);
  });

  test("the stage holds at the top through the whole pinned run", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    /*
     * Wait for the ELEMENT, not for a page-level heuristic.
     *
     * `networkidle` never settled once the nav began prefetching; `load` fires
     * before React hydrates, so the server-rendered STACKED variant was still
     * mounted and `.acts-sticky` was null. Both are proxies for "the thing I am
     * about to assert on exists" — so wait for that thing instead. This is the
     * same lesson as T-203b: an instrument that shares an assumption with its
     * subject can confirm the aim, never the target.
     */
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });

    /*
     * Geometry is read AFTER each scroll, never precomputed.
     *
     * The first version computed the container's document offset once at
     * scrollY 0 and then scrolled to fractions of it. Below-the-fold images
     * load as you descend, so every offset above the acts section moves and the
     * precomputed target lands somewhere else entirely — the test reported a
     * released pin on a section that pins correctly. Steps 1 and 2 of the
     * T-203b diagnosis ruled out both the stacked variant (PINNED mounted,
     * reduce false, pointer fine) and zero-travel geometry (900px sticky inside
     * a 2700px container = 1800px of travel).
     *
     * A sticky child pins while the scroll sits between the container's top and
     * (top + travel). Outside that window it is SUPPOSED to move — so the
     * assertion has to know where it currently is, not where it once was.
     */
    const readings = await page.evaluate(async () => {
      const acts = document.querySelector(".acts") as HTMLElement;
      const sticky = document.querySelector(".acts-sticky") as HTMLElement;
      const out: { frac: number; withinRun: boolean; stickyTop: number }[] = [];

      for (const frac of [0.15, 0.45, 0.75]) {
        const live = acts.getBoundingClientRect().top + window.scrollY;
        const travel = acts.offsetHeight - sticky.offsetHeight;
        window.scrollTo(0, live + travel * frac);
        await new Promise((r) => setTimeout(r, 400));

        // Re-read after the scroll: is the viewport actually inside the run?
        const now = acts.getBoundingClientRect();
        const withinRun = now.top <= 1 && now.bottom >= sticky.offsetHeight - 1;
        out.push({ frac, withinRun, stickyTop: Math.round(sticky.getBoundingClientRect().top) });
      }
      return out;
    });

    for (const r of readings) {
      expect(r.withinRun, `viewport was not inside the pinned run at ${r.frac}`).toBe(true);
      expect(
        Math.abs(r.stickyTop),
        `stage slid to ${r.stickyTop}px at ${r.frac} of the run — the pin released early`
      ).toBeLessThanOrEqual(2);
    }
  });
});

/**
 * THE DIRECTIVE AUDIT (T-221 – T-225).
 *
 * Five defects confirmed by measurement against a section-by-section critique.
 * Three further claims in the same critique were refuted by measurement and are
 * asserted here in the opposite direction, so that a future reviewer reading the
 * same page gets a test rather than an argument.
 */
test.describe("the numbered spine", () => {
  test("homepage beats are gapless, unique, and every section carries one", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".litany-beat");

    const labels = (await page.locator("main .micro").allTextContents())
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => /^\d\d — /.test(s));

    const numbers = labels.map((s) => s.slice(0, 2));

    // Gapless 01..N — beat 08 was simply missing, and Location carried no label.
    expect(numbers, `beat numbers: ${labels.join(" | ")}`).toEqual(
      numbers.map((_, i) => String(i + 1).padStart(2, "0"))
    );
    expect(new Set(numbers).size, "a beat number is used twice").toBe(numbers.length);

    // The collision that started it: the helipad beat and act one both read
    // "Arrival", because the act EYEBROWS were claiming beat numbers.
    const names = labels.map((s) => s.slice(5).toLowerCase());
    expect(new Set(names).size, `two beats share a name: ${names.join(" | ")}`).toBe(names.length);
  });

  test("every in-page nav anchor resolves to a real element", async ({ page }) => {
    // The nav linked to /#experiences and nothing carried that id.
    await page.goto("/", { waitUntil: "load" });
    const dead = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')]
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h.includes("#") && !h.startsWith("http"))
        .map((h) => h.slice(h.indexOf("#") + 1))
        .filter((id) => id && id !== "main" && !document.getElementById(id))
    );
    expect([...new Set(dead)], "nav anchors pointing at nothing").toEqual([]);
  });
});

test.describe("copy defects found by reading, not by looking", () => {
  test("no doubled full stop anywhere in the rendered page", async ({ page }) => {
    // An .sr-only paragraph joined already-terminated litany lines with ". ",
    // producing "…is up.. The gate…". Invisible on screen, audible to a reader.
    for (const route of ["/", "/en/the-estate", "/en/villas/villa-eeanthe"]) {
      await page.goto(route, { waitUntil: "load" });
      const bad = await page.evaluate(() => {
        // SCRIPT and STYLE text is not rendered text. Next embeds the whole RSC
        // flight payload in a <script> in the body, so a naive TreeWalker reads
        // every string in the page twice — which is exactly the false "the
        // litany is duplicated" reading this suite exists to settle.
        const out: string[] = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) =>
            /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(n.parentElement?.tagName ?? "")
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT,
        });
        let n: Node | null;
        while ((n = w.nextNode())) {
          const v = n.nodeValue ?? "";
          if (/\w\.\.(\s|$)/.test(v)) out.push(v.trim().slice(0, 90));
        }
        return out;
      });
      expect(bad, `doubled full stop on ${route}`).toEqual([]);
    }
  });

  test("the litany is announced once, not twice", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const occurrences = await page.evaluate(() => {
      let n = 0;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (t) =>
          /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(t.parentElement?.tagName ?? "")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      let t: Node | null;
      while ((t = w.nextNode())) if (/before anyone else is up/.test(t.nodeValue ?? "")) n++;
      return n;
    });
    expect(occurrences, "the first litany line is announced more than once").toBe(1);
  });

  test("no distance is rendered as a blank dash", async ({ page }) => {
    // Eight of eleven beaches have no distance in the inventory. The old markup
    // printed "—" for each, which reads as missing data; they are a named run now.
    await page.goto("/", { waitUntil: "load" });
    const values = await page.locator(".coastline-value").allTextContents();
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v.trim(), "a distance rendered as an em dash placeholder").not.toMatch(/^[—–-]$/);
      expect(v.trim().length, "an empty distance cell").toBeGreaterThan(0);
    }
  });
});

test.describe("claims refuted by measurement", () => {
  test("the hero has a preloader, ambient motion and a scroll cue", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    // The preloader is real and session-scoped; it dismisses inside ~1.8s, which
    // is why a late look does not find it.
    let sawPreloader = false;
    for (let i = 0; i < 12 && !sawPreloader; i++) {
      sawPreloader = await page.evaluate(() => !!document.querySelector("[class*='preload']"));
      if (!sawPreloader) await page.waitForTimeout(150);
    }
    expect(sawPreloader, "no preloader rendered on first paint").toBe(true);

    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator(".kenburns img").first()).toBeVisible();
    const cue = page.locator(".hero-cue");
    await expect(cue).toHaveCount(1);
    // A real anchor, not a glyph: it must resolve and be keyboard reachable.
    expect(await cue.getAttribute("href")).toBe("#litany");
    await expect(page.locator("#litany")).toHaveCount(1);
  });

  test("the scroll cue never sits underneath the booking bar", async ({ page }) => {
    // The first version did, at every width: 62px of overlap on desktop, 198px
    // on a phone. The clearance is a token; this is what keeps it honest.
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "load" });
      await page.waitForSelector(".ledger");
      const r = await page.evaluate(() => {
        const led = document.querySelector(".ledger")?.getBoundingClientRect();
        const cue = document.querySelector(".hero-cue");
        const vis = cue ? getComputedStyle(cue).display !== "none" : false;
        const cb = cue?.getBoundingClientRect();
        return { ledgerTop: led?.top ?? null, cueBottom: cb?.bottom ?? null, visible: vis };
      });
      if (width < 768) {
        expect(r.visible, "the cue should not render on a phone").toBe(false);
        continue;
      }
      expect(r.visible, `no scroll cue at ${width}`).toBe(true);
      expect(
        r.cueBottom!,
        `cue overlaps the booking bar by ${Math.round(r.cueBottom! - r.ledgerTop!)}px at ${width}`
      ).toBeLessThanOrEqual(r.ledgerTop!);
    }
  });

  test("every Collection cell is image-forward", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const cells = await page.locator(".collection-cell").count();
    const withImage = await page.locator(".collection-cell img").count();
    expect(cells).toBe(5);
    expect(withImage, "a Collection cell renders as a bare text link").toBe(cells);
  });

  test("no experience card is a hole — image or a designed typographic card", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".drag-card");
    const holes = await page.evaluate(() =>
      [...document.querySelectorAll(".drag-card")]
        .filter((c) => !c.querySelector("img") && !c.querySelector(".drag-card-figure--typographic"))
        .map((c) => (c.textContent ?? "").trim().slice(0, 40))
    );
    expect(holes, "an experience card has neither a photograph nor the no-image treatment").toEqual([]);
  });
});
