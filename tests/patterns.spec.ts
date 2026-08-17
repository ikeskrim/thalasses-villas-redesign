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
