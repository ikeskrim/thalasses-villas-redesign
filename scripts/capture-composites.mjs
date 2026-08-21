#!/usr/bin/env node
/**
 * COMPOSITE CAPTURES — the frames a single screenshot cannot produce.
 *
 * These were Playwright *tests* until T-291, and they never belonged there.
 * Between them they carried **zero assertions and seven screenshots**: they
 * could not fail in a way that meant anything, they dirtied `qa/acts/` and
 * `qa/phase3/` on every suite run so unrelated commits kept sweeping up PNGs,
 * and they made `npm run qa` slower for no gate.
 *
 * This project already learned that lesson once — thirty screenshot tests
 * exhausted the runner's memory and were moved out to `scripts/capture.mjs`
 * under a doctrine worth restating: **evidence generation is not a correctness
 * gate.** A screenshot proves nothing about behaviour; it exists so a person can
 * look at it. These two survived that move by being small enough not to hurt.
 *
 * Three composites, none of which a `fullPage` screenshot can give you:
 *
 *  1. THE PINNED ACTS. A fullPage capture of a `position: sticky` section paints
 *     the sticky child once and leaves the tall container empty, which reads as
 *     a broken block to anyone reviewing it. These are what a visitor sees.
 *  2. EEANTHE AND PUEBLO SIDE BY SIDE. The point of the pair is that one villa
 *     has 104 photographs and the other has 5, and one template has to serve
 *     both without either looking wrong. Two files in a folder do not show that;
 *     the comparison has to be in one frame, same width, same beat.
 *  3. THE NAV IN BOTH STATES. Transparent over the hero, glass after it.
 *
 *   node scripts/capture-composites.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const ACTS_DIR = path.join(process.cwd(), "qa", "acts");
const SHOT_DIR = path.join(process.cwd(), "qa", "phase3");

async function reachable(url) {
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

if (!(await reachable(BASE))) {
  console.error(`No server at ${BASE}. Run \`npm start\` first.`);
  process.exit(1);
}

fs.mkdirSync(ACTS_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });

const browser = await chromium.launch();
let shots = 0;

/* ------------------------------------------------------------ THE ACTS -- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForSelector(".acts-sticky", { timeout: 15_000 });

  /*
   * Document offsets, not viewport ones. `boundingBox().y` is relative to the
   * CURRENT viewport, so using it as a scroll target lands somewhere arbitrary
   * — in the first version it landed past the end of the pinned run, where the
   * sticky child has already released. The screenshots showed a half-empty
   * section and a cut-off heading, and I nearly "fixed" a layout that was fine.
   */
  const rect = await page.evaluate(() => {
    const el = document.querySelector(".acts");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  });
  if (!rect) throw new Error("acts section not found — is the viewport wide enough to pin?");

  for (let i = 0; i < 3; i++) {
    /* Land in the middle of each third of the pinned run. */
    const y = rect.top + (rect.height / 3) * i + rect.height / 6;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(ACTS_DIR, `act-${i + 1}.png`) });
    shots++;
  }

  await page.locator(".estate-map-frame").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator(".estate-map-marker").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ACTS_DIR, "estate-map.png") });
  shots++;

  await page.locator(".litany-line").nth(2).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ACTS_DIR, "litany.png") });
  shots++;

  await page.close();
  process.stdout.write("  acts + estate map + litany\n");
}

/* ------------------------------------------------------- SIDE BY SIDE -- */
const PAIR = [
  { name: "eeanthe", path: "/en/villas/villa-eeanthe", note: "104 photographs" },
  { name: "pueblo", path: "/en/villas/villa-pueblo", note: "5 photographs" },
];

/** The beats to compare, addressed by SELECTOR — never by scroll offset. */
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

for (const w of WIDTHS) {
  const GAP = 24;
  const LABEL = 56;
  const page = await browser.newPage({
    viewport: { width: w.width * 2 + GAP * 3, height: w.height + LABEL + GAP * 2 },
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
  const shellUrl = `${BASE}/__phase3-sidebyside`;
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

  /*
   * Wait for the CONTENT, not for the document.
   *
   * The first version waited on `readyState === "complete"`, which is the load
   * event — and at 390 that never arrived inside 60s while the same capture
   * finished in 16s at 1440. CONVENTIONS §10: a page-level heuristic measures
   * the absence of activity, never the presence of the thing being captured.
   * The spec strip exists on both villas, so it is the honest signal that the
   * pane is ready to be walked. (Was `.villa-statement`, which the Direction D
   * rebuild replaced — a capture harness pinned to markup has to move with it.)
   */
  for (const p of PAIR) {
    await page.waitForFunction(
      (name) => {
        const f = document.getElementById(`pane-${name}`);
        return Boolean(f?.contentDocument?.querySelector(".d-spec-strip"));
      },
      p.name,
      { timeout: 60_000 }
    );
  }
  await page.waitForTimeout(2500);

  for (const beat of BEATS) {
    /* Walk each pane to the beat by SELECTOR, in viewport steps, so
       `whileInView` reveals actually fire — a jump straight to the target
       captures content in its initial, invisible state. */
    for (const p of PAIR) {
      await page.evaluate(
        async ({ name, selector }) => {
          const f = document.getElementById(`pane-${name}`);
          const win = f.contentWindow;
          const doc = f.contentDocument;
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
    shots++;
  }
  await page.close();
  process.stdout.write(`  side by side @ ${w.name}\n`);
}

/* ------------------------------------------------------------- THE NAV -- */
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w.width, height: w.height } });
  await page.goto(`${BASE}/en/villas/villa-eeanthe`, { waitUntil: "load" });
  await page.waitForSelector(".nav");
  await page.waitForTimeout(1200);

  /* State A — transparent over the hero. The first screen stays a photograph. */
  await page.screenshot({
    path: path.join(SHOT_DIR, `nav-a-transparent-${w.name}.png`),
    clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.55) },
  });
  shots++;

  /* State B — glass. The threshold is 0.72 viewport heights; land past it and
     wait for the class rather than for a fixed delay. */
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 1.1)));
  await page.waitForSelector(".nav.is-solid");
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(SHOT_DIR, `nav-b-glass-${w.name}.png`),
    clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.55) },
  });
  shots++;

  /* State C — the panel open, the only state showing the glass over a large
     surface rather than a 72px bar. It exists below 1024 only: on desktop the
     register is inline and the toggle is display:none, so there is no third
     state to capture rather than a state that failed. */
  const toggle = page.locator(".nav-toggle");
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForSelector("#nav-panel:not([hidden])");
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(SHOT_DIR, `nav-c-panel-${w.name}.png`),
      clip: { x: 0, y: 0, width: w.width, height: Math.round(w.height * 0.85) },
    });
    shots++;
  }
  await page.close();
  process.stdout.write(`  nav states @ ${w.name}\n`);
}

await browser.close();
console.log(`\n${shots} composites -> qa/acts, qa/phase3`);
