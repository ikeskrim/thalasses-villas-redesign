import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * PHASE 3 CAPTURES (T-211).
 *
 * Two deliverables the Phase 3 STOP asks for and screenshots of single pages
 * cannot give:
 *
 *  1. EEANTHE AND PUEBLO SIDE BY SIDE. The point of the pair is that one villa
 *     has 104 photographs and the other has 5, and the same template has to
 *     serve both without one looking wasteful or the other looking sparse. Two
 *     files in a folder do not let you see that; the comparison has to be in
 *     one frame, at the same width, on the same beat.
 *
 *     Both pages are mounted in same-origin iframes inside a real page from the
 *     site, so the origin, the fonts and the image pipeline are all genuine —
 *     nothing is re-rendered or re-styled for the capture. Each pane is scrolled
 *     to the SAME beat by selector, not by pixel offset: lazy images change the
 *     geometry as they load, which is exactly how the T-203b measurement went
 *     stale (Conventions §10).
 *
 *  2. THE NAV IN BOTH STATES. Transparent over the hero, glass after it. The
 *     switch is a scroll threshold at 0.72 viewport heights, so the two states
 *     are captured above and below it on the same page.
 */

const SHOT_DIR = path.join(process.cwd(), "qa", "phase3");

const PAIR = [
  { name: "eeanthe", path: "/en/villas/villa-eeanthe", note: "104 photographs" },
  { name: "pueblo", path: "/en/villas/villa-pueblo", note: "5 photographs" },
];

/** The beats to compare, addressed by selector — never by scroll offset. */
const BEATS = [
  { key: "01-arrival", selector: ".field", label: "01 — Arrival" },
  { key: "02-the-house", selector: ".d-spec-strip", label: "02 — The house" },
  { key: "03-the-rooms", selector: ".run-frame, .plates-opener", label: "03 — The rooms" },
  { key: "04-inside", selector: ".inventory", label: "04 — Inside" },
];

const WIDTHS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
];

test.beforeAll(() => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

for (const w of WIDTHS) {
  test(`side by side — Eeanthe and Pueblo @ ${w.name}`, async ({ page, baseURL }) => {
    test.setTimeout(180_000);

    const GAP = 24;
    const LABEL = 56;
    await page.setViewportSize({
      width: w.width * 2 + GAP * 3,
      height: w.height + LABEL + GAP * 2,
    });

    /*
     * The frame is served on the site's own origin by a fulfilled route, NOT by
     * writing into a page of the site.
     *
     * The first version did `goto("/")` and then replaced `document.body` with
     * the two iframes. React hydrates a moment later and reclaims the body it
     * owns, so the iframes were removed under the harness — `getElementById`
     * returned null for thirty seconds straight while the wait, quite correctly,
     * reported nothing. A same-origin URL the app does not serve has no React on
     * it at all, and the panes are same-origin, so they stay drivable.
     */
    const shellUrl = `${baseURL}/__phase3-sidebyside`;
    await page.route(shellUrl, (route) =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body:
          `<!doctype html><meta charset="utf-8"><title>side by side</title>` +
          `<body style="margin:0;background:#0e1a1e;display:flex;gap:${GAP}px;padding:${GAP}px;">` +
          PAIR.map(
            (p) => `
              <figure style="margin:0;display:flex;flex-direction:column;gap:8px;">
                <figcaption style="height:${LABEL - 8}px;color:#a4ccc9;font:500 13px/1.5 ui-sans-serif,system-ui;letter-spacing:.18em;text-transform:uppercase;">
                  ${p.name === "eeanthe" ? "Villa Eeanthe" : "Villa Pueblo"}
                  <br><span style="opacity:.6;letter-spacing:.08em;text-transform:none;">${p.note} · <span data-beat></span></span>
                </figcaption>
                <iframe id="pane-${p.name}" src="${p.path}" width="${w.width}" height="${w.height}"
                        style="border:0;display:block;background:#e8e9e3;"></iframe>
              </figure>`
          ).join("") +
          `</body>`,
      })
    );
    await page.goto(shellUrl, { waitUntil: "load" });

    // Wait for the CONTENT, not for the document.
    //
    // The first version waited on `readyState === "complete"`, which is the load
    // event — and at 390 that never arrived inside 60s while the same capture
    // finished in 16s at 1440. Conventions §10: a page-level heuristic measures
    // the absence of activity, never the presence of the thing being captured.
    // The spec strip exists on both villas, so it is the honest signal that the
    // pane is ready to be walked. (Was `.villa-statement`, which the Direction D
    // rebuild replaced — a capture harness pinned to markup has to move with it.)
    for (const p of PAIR) {
      await page.waitForFunction(
        (name) => {
          const f = document.getElementById(`pane-${name}`) as HTMLIFrameElement | null;
          return Boolean(f?.contentDocument?.querySelector(".d-spec-strip"));
        },
        p.name,
        { timeout: 60_000 }
      );
    }
    await page.waitForTimeout(2500);

    for (const beat of BEATS) {
      // Walk each pane to the beat by SELECTOR. Every pane is walked in
      // viewport steps first so `whileInView` reveals actually fire — a jump
      // straight to the target captures content in its initial, invisible state.
      for (const p of PAIR) {
        await page.evaluate(
          async ({ name, selector }) => {
            const f = document.getElementById(`pane-${name}`) as HTMLIFrameElement;
            const win = f.contentWindow!;
            const doc = f.contentDocument!;
            const target = doc.querySelector(selector);
            if (!target) return;
            const end = target.getBoundingClientRect().top + win.scrollY;
            const step = Math.round(f.clientHeight * 0.8);
            for (let y = win.scrollY; y < end; y += step) {
              win.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 180));
            }
            win.scrollTo(0, Math.max(0, end));
          },
          { name: p.name, selector: beat.selector }
        );
      }
      await page.waitForTimeout(1600);

      await page.evaluate((text) => {
        for (const cap of document.querySelectorAll("figcaption")) {
          const tail = cap.querySelector("[data-beat]");
          if (tail) tail.textContent = text;
        }
      }, beat.label);

      await page.screenshot({
        path: path.join(SHOT_DIR, `sidebyside-${w.name}-${beat.key}.png`),
      });
    }
  });

  test(`the nav in both states @ ${w.name}`, async ({ page }) => {
    await page.setViewportSize({ width: w.width, height: w.height });
    await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
    await page.waitForSelector(".nav");
    await page.waitForTimeout(1200);

    // State A — transparent over the hero. The first screen stays a photograph.
    await page.screenshot({
      path: path.join(SHOT_DIR, `nav-a-transparent-${w.name}.png`),
      clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.55) },
    });

    // State B — glass. The threshold is 0.72 viewport heights; land past it and
    // wait for the class rather than for a fixed delay.
    await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 1.1)));
    await page.waitForSelector(".nav.is-solid");
    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(SHOT_DIR, `nav-b-glass-${w.name}.png`),
      clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.55) },
    });

    // State C — the panel open, which is the only state that shows the glass
    // over a large surface rather than a 72px bar. It exists below 1024 only:
    // on desktop the register is inline and the toggle is display:none, so
    // there is no third state to capture rather than a state that failed.
    const toggle = page.locator(".nav-toggle");
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForSelector("#nav-panel:not([hidden])");
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(SHOT_DIR, `nav-c-panel-${w.name}.png`),
        clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.85) },
      });
    }
  });
}
