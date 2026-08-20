#!/usr/bin/env node
/**
 * THE TASTE AUDIT — the measurable half.
 *
 * "More expensive, or just more?" is a judgement and a person has to make it by
 * looking. But a good part of what makes a page look cheap is not judgement at
 * all — it is mechanical, repeatable, and invisible to every guard this project
 * already has:
 *
 *   WIDOWS      a display line ending in one lonely word. The single most
 *               common thing separating typeset from typed.
 *   COLLISIONS  two elements whose boxes overlap, or that sit closer than the
 *               rhythm token allows. `qa:overflow` catches a page that is too
 *               WIDE; nothing catches two things touching inside it.
 *   CONGESTION  more than one idea crammed into a viewport, which is the exact
 *               failure Direction D exists to prevent and which no assertion
 *               currently measures.
 *   OFF-SYSTEM  air between two beats that matches no rhythm token — the
 *               tell-tale of a number typed by hand into one file.
 *   MEASURE     a `ch` measure resolving against a font-size the type inside it
 *               does not use, which silently sets a column to a fraction of the
 *               width it was written for.
 *   TRACKING    small uppercase type carrying the NEGATIVE tracking of the
 *               display it is nested inside, because letter-spacing inherits.
 *
 * This reports; it does not fix. Output is a ranked list with selectors and
 * measurements so each finding can be judged and then either corrected or
 * dismissed for a stated reason. Anything that turns out to be a real class
 * gets promoted into the suite as a guard.
 *
 *   node scripts/taste-audit.mjs            all routes, 1440 and 390
 *   node scripts/taste-audit.mjs 390        one width
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const ONLY = process.argv[2];
const OUT = path.join(process.cwd(), "qa", "taste");

const ROUTES = [
  ["home", "/"],
  ["estate", "/en/the-estate"],
  ["villa-thoi", "/en/villas/villa-thoi"],
  ["villa-eeanthe", "/en/villas/villa-eeanthe"],
  ["villa-pueblo", "/en/villas/villa-pueblo"],
  ["gallery", "/en/gallery"],
  ["experiences", "/en/experiences"],
  ["experience-detail", "/en/experiences/private-chef"],
  ["weddings", "/en/weddings"],
  ["location", "/en/location"],
  ["careers", "/en/careers"],
  ["contact", "/en/contact"],
  ["terms", "/en/terms"],
];

const WIDTHS = [
  ["1440", 1440, 900],
  ["390", 390, 844],
].filter(([label]) => !ONLY || label === ONLY);

fs.mkdirSync(OUT, { recursive: true });

/**
 * THE SERVER HAS TO BE THERE, and a route that fails has to be LOUD.
 *
 * The first run of this script printed twenty-six `FAILED: ERR_CONNECTION_REFUSED`
 * lines and then, in the summary a person actually reads, "0 findings". Zero
 * findings is what a clean page looks like. The server had died halfway and the
 * report said the site was perfect.
 *
 * That is the same failure this project has now met five times — an instrument
 * reporting success because it never reached its subject — so it is closed the
 * same way: refuse to start without a server, and exit non-zero if any route
 * fails, so "0 findings" can only ever mean zero findings.
 */
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

/**
 * Runs IN THE PAGE. Everything here is measured from live layout — line boxes
 * from Range rects, gaps from bounding boxes — rather than inferred from CSS,
 * because CSS says what was asked for and layout says what happened.
 */
const audit = () => {
  const findings = [];
  const sel = (el) => {
    const cls = [...el.classList].slice(0, 3).join(".");
    return el.tagName.toLowerCase() + (cls ? "." + cls : "") + (el.id ? "#" + el.id : "");
  };
  const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();

  /* ------------------------------------------------------------ WIDOWS -- */
  /*
   * A widow is the LAST line of a wrapped block holding a single word. Line
   * boxes are recovered by walking the text with a Range one character at a
   * time and grouping by the top of each client rect — there is no line-box API
   * and this is the only way to see what actually wrapped.
   *
   * Only display registers are reported. A single-word last line in body copy
   * is normal prose; in 96px type it is the thing that makes a page look typed.
   */
  const DISPLAY = "h1, h2, h3, .display, .c1, .c2, .c3, .c4, .lede, .d-hero-lede";
  for (const el of document.querySelectorAll(DISPLAY)) {
    const t = text(el);
    if (!t || t.length < 12) continue;
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim().length > 8);
    if (!node) continue;

    const r = document.createRange();
    const tops = [];
    for (let i = 0; i < node.textContent.length; i++) {
      r.setStart(node, i);
      r.setEnd(node, i + 1);
      const rect = r.getClientRects()[0];
      if (!rect || rect.width === 0) continue;
      const top = Math.round(rect.top);
      if (!tops.length || Math.abs(tops[tops.length - 1].top - top) > 4) {
        tops.push({ top, chars: node.textContent[i] });
      } else {
        tops[tops.length - 1].chars += node.textContent[i];
      }
    }
    if (tops.length < 2) continue;
    const last = tops[tops.length - 1].chars.trim();
    const words = last.split(/\s+/).filter(Boolean);
    /*
     * A heading of three words or fewer has no non-widow arrangement — "Terms
     * and / Conditions" breaking at 390 is the only thing it can do, and
     * calling it a defect means the report contains findings nobody can act on,
     * which is how a report stops being read.
     */
    const total = t.split(/\s+/).filter(Boolean).length;
    if (words.length === 1 && last.length <= 14 && total >= 4) {
      findings.push({
        kind: "widow",
        selector: sel(el),
        detail: `${tops.length} lines, last is "${last}"`,
        text: t.slice(0, 70),
        size: Math.round(parseFloat(getComputedStyle(el).fontSize)),
      });
    }
  }

  /* -------------------------------------------------------- COLLISIONS -- */
  /*
   * Adjacent siblings whose boxes OVERLAP vertically. Deliberate overlaps exist
   * in this design (the ghost numeral, absolutely-positioned scrims), so
   * anything out of flow is excluded — a collision only counts when two things
   * in normal flow have run into each other.
   *
   * TWO EXCLUSIONS, both learned by this detector reporting eight collisions of
   * which zero were real:
   *
   *   MULTI-COLUMN. The villa inventory is `columns: 3`. Siblings in different
   *   columns share vertical space by definition, so subtracting one box's
   *   bottom from the next box's top reported an "overlap" of 858px on a layout
   *   that is working exactly as designed.
   *
   *   HIDDEN SUBTREES. The enquiry form's honeypot is a 1px clipped box marked
   *   `aria-hidden` on the WRAPPER. Its label and input are not individually
   *   marked, so descending into it found a label sitting on an input — which
   *   is what a visually-hidden field looks like, and is the point of it.
   */
  const hidden = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return true;
      const b = n.getBoundingClientRect();
      if (b.width <= 2 || b.height <= 2) return true;
    }
    return false;
  };
  for (const parent of document.querySelectorAll("section, article, div, ul, ol")) {
    if (hidden(parent)) continue;
    const pcs = getComputedStyle(parent);
    if (pcs.columnCount !== "auto" || parseFloat(pcs.columnWidth) > 0) continue;
    const kids = [...parent.children].filter((k) => {
      const cs = getComputedStyle(k);
      if (cs.position !== "static" && cs.position !== "relative") return false;
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (k.getAttribute("aria-hidden") === "true") return false;
      const b = k.getBoundingClientRect();
      return b.height > 4 && b.width > 4;
    });
    const flow = pcs.display;
    if (flow.includes("grid") || flow.includes("flex")) continue;
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1].getBoundingClientRect();
      const b = kids[i].getBoundingClientRect();
      const gap = b.top - a.bottom;
      if (gap < -2) {
        findings.push({
          kind: "collision",
          selector: `${sel(kids[i - 1])} / ${sel(kids[i])}`,
          detail: `overlap ${Math.round(-gap)}px inside ${sel(parent)}`,
          text: text(kids[i]).slice(0, 60),
        });
      }
    }
  }

  /* -------------------------------------------------------- CONGESTION -- */
  /*
   * Direction D's rule is one idea per viewport, and an "idea" is a BEAT — a
   * top-level child of `#main` — not a heading.
   *
   * Counting headings reported 46 congested viewports, none of them real. The
   * nav's six-entry register counted as six ideas. The litany's five lines are
   * stacked in the DOM and revealed one at a time by scroll, so a static
   * measurement saw all five at once. And every `Clause` counted twice, because
   * its gerund and its tail are an element inside an element.
   *
   * Beats have none of those problems: they are what the reader scrolls past,
   * and three of them starting inside one viewport is congestion by definition.
   */
  const vh = window.innerHeight;
  const mainEl = document.getElementById("main") || document.body;
  const tops = [...mainEl.children]
    .filter((k) => {
      const cs = getComputedStyle(k);
      if (cs.display === "none" || k.getBoundingClientRect().height <= 60) return false;
      /*
       * A DIVIDER IS NOT AN IDEA. The villa mark is a rule and a section
       * number with `--section-y` above it; it introduces the beat below
       * rather than being one, and counting it turned every villa page into
       * "three beats in a viewport". Anything carrying no words is structure.
       */
      return text(k).length > 3;
    })
    .map((el) => ({ el, y: el.getBoundingClientRect().top + window.scrollY }))
    .sort((a, b) => a.y - b.y);
  for (let i = 0; i < tops.length; i++) {
    const group = tops.filter((t) => t.y >= tops[i].y && t.y < tops[i].y + vh);
    if (group.length >= 3) {
      findings.push({
        kind: "congestion",
        selector: sel(tops[i].el),
        detail: `${group.length} beats begin within one ${vh}px viewport`,
        text: group.map((g) => sel(g.el)).join(" | "),
      });
      i += group.length - 1;
    }
  }

  /* ----------------------------------------------------------- TRACKING -- */
  /*
   * Small uppercase type that is not letterspaced.
   *
   * `letter-spacing` is INHERITED, and it inherits as a computed px value. A
   * 12px uppercase tail nested inside a 64px display line at `-0.02em` does not
   * inherit "-0.02em" — it inherits **-1.28px**, which at 12px is more than a
   * tenth of an em of negative tracking on capitals. The result is a label that
   * looks condensed and slightly broken beside type that looks correct, and
   * nothing in the CSS says anything is wrong: the tail rule simply never
   * mentions tracking, and the display above it is behaving properly.
   *
   * This design's whole micro register is letterspaced OPEN — `.micro` sets
   * +0.22em, the Direction D specimen sets the eyebrow at +0.14em — so any
   * small capital sitting at or below zero is a defect by the system's own
   * rules rather than by anyone's taste.
   */
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.textTransform !== "uppercase") continue;
    const size = parseFloat(cs.fontSize);
    if (size > 16) continue;
    const t = text(el);
    if (t.length < 3) continue;
    /* Only leaf-ish elements: a wrapper's text is its children's. */
    if ([...el.children].some((k) => text(k).length > 2)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;

    const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
    const em = ls / size;
    if (em < 0.02) {
      findings.push({
        kind: "tracking",
        selector: sel(el),
        detail: `${size}px uppercase at ${em.toFixed(3)}em tracking (${cs.letterSpacing})`,
        text: t.slice(0, 40),
      });
    }
  }

  /* ------------------------------------------------------------ MEASURE -- */
  /*
   * A `ch` measure resolving against the WRONG font-size.
   *
   * `ch` is one zero-width in the element's OWN font. Put `max-width: 22ch` on a
   * list item that inherits 17px body type while the display span inside it is
   * 44px, and the browser obediently computes 236px — for a line that was
   * written to run to about 485px. The column ends up at 40% of its intended
   * measure, in a half-empty grid cell, and every heading in it shatters into
   * ransom-note fragments. That is exactly what the homepage litany was doing,
   * and no guard in this project could see it: the page does not overflow, the
   * contrast is fine, the spacing is on-system, and the type is the right size.
   * Only looking at it revealed it, and only measuring explains it.
   *
   * The rule text is needed, not the computed style — `getComputedStyle` reports
   * `max-width` in px and the `ch` is long gone by then. So the same stylesheet
   * walk used for the rhythm tokens finds every rule that declares a `ch`
   * measure, and each matching element is compared against the largest type it
   * actually contains.
   */
  const chRules = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.cssRules) walk(rule.cssRules);
        if (!rule.selectorText || !rule.style) continue;
        if (/\d+ch\b/.test(rule.style.maxWidth || "")) {
          chRules.push({ selector: rule.selectorText, value: rule.style.maxWidth });
        }
      }
    };
    walk(rules);
  }

  const seenMeasure = new Set();
  for (const { selector, value } of chRules) {
    let els;
    try {
      els = document.querySelectorAll(selector);
    } catch {
      continue;
    }
    for (const el of els) {
      const own = parseFloat(getComputedStyle(el).fontSize);

      /*
       * How much of this container's text is actually set in its LARGEST
       * register? A beat holding a 44px heading over a paragraph of 17px prose
       * is a mixed-register block, and its 62ch measure is written for the
       * prose — correctly. Flagging those buried the one real finding in three
       * false ones. Only a block whose text is overwhelmingly the large size
       * has a measure that was meant for the large size.
       */
      let biggest = own;
      const chars = new Map();
      const walkText = (node) => {
        for (const kid of node.childNodes) {
          if (kid.nodeType === 3) {
            const t = (kid.textContent || "").trim();
            if (!t) continue;
            const fs = Math.round(parseFloat(getComputedStyle(node).fontSize));
            chars.set(fs, (chars.get(fs) ?? 0) + t.length);
            if (fs > biggest) biggest = fs;
          } else if (kid.nodeType === 1) {
            const r = kid.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            walkText(kid);
          }
        }
      };
      walkText(el);

      const totalChars = [...chars.values()].reduce((a, b) => a + b, 0);
      if (!totalChars) continue;
      const bigChars = chars.get(Math.round(biggest)) ?? 0;
      if (biggest <= own * 1.3) continue;
      if (bigChars / totalChars < 0.6) continue;

      /*
       * The intended width, measured rather than calculated. `ch` is font-
       * specific — the container inherits the sans body face and the display
       * span is a serif, so their zero-widths differ by more than their sizes
       * do. A probe placed INSIDE the large-type element and given the same
       * `ch` count reports exactly what the author asked for.
       */
      const big = [...el.querySelectorAll("*")].find(
        (k) => Math.round(parseFloat(getComputedStyle(k).fontSize)) === Math.round(biggest)
      );
      let intended = null;
      if (big) {
        const probe = document.createElement("span");
        probe.style.cssText = `display:block;position:absolute;visibility:hidden;width:${value}`;
        big.appendChild(probe);
        intended = Math.round(probe.getBoundingClientRect().width);
        probe.remove();
      }

      const key = `${selector}|${value}`;
      if (seenMeasure.has(key)) continue;
      seenMeasure.add(key);
      findings.push({
        kind: "measure",
        selector: `${selector}  { max-width: ${value} }`,
        detail:
          `resolves at ${Math.round(own)}px to ${Math.round(el.getBoundingClientRect().width)}px, ` +
          `but ${Math.round((bigChars / totalChars) * 100)}% of its text is ${Math.round(biggest)}px` +
          (intended ? ` — the measure asks for ${intended}px` : ""),
        text: text(el).slice(0, 50),
      });
    }
  }

  /* --------------------------------------------------------- OFF-SYSTEM -- */
  /*
   * Air between two beats that corresponds to NO rhythm token.
   *
   * This started out asking whether beats were separated by at least
   * `--section-y`, and reported 28 findings on a page with nothing wrong with
   * it. Every one resolved to a token that was doing its job: the photo-to-prose
   * transition is `--rhythm-photo-prose` (exactly 94px at 1440), the terms page
   * runs on `--section-y-tight` (exactly 106px), and the villa mark sits
   * `--spacing-step-5` above the run it introduces because a label belongs to
   * the thing it labels. The premise was wrong — this design has a FAMILY of
   * rhythm tokens, and holding all of them to the largest one is not a strict
   * guard, it is a misreading of the system.
   *
   * What is actually worth catching is the opposite: spacing that belongs to no
   * token at all, which is what a number typed by hand into one file looks
   * like. So the tokens are read from `:root` at runtime — never listed here,
   * so the guard cannot fall behind the system (CONVENTIONS §14) — and air is
   * accepted if it matches any single token, or any sum of two, since air is
   * normally one beat's bottom padding plus the next beat's top padding.
   */
  const tokens = new Map();
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; /* cross-origin sheet; ours are all same-origin */
    }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.cssRules) walk(rule.cssRules);
        if (!rule.selectorText || !rule.style) continue;
        if (!/:root|^html$/.test(rule.selectorText)) continue;
        for (const name of rule.style) {
          if (/^--(section-y|spacing-step-|rhythm-)/.test(name)) tokens.set(name, true);
        }
      }
    };
    walk(rules);
  }

  const px = (expr) => {
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;visibility:hidden;height:${expr}`;
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h;
  };
  const values = [...tokens.keys()].map((n) => px(`var(${n})`)).filter((v) => v > 0);
  const sectionY = px("var(--section-y)");

  const accepted = new Set();
  for (const a of values) {
    accepted.add(Math.round(a));
    for (const b of values) accepted.add(Math.round(a + b));
  }
  const onSystem = (v) => {
    for (let d = -2; d <= 2; d++) if (accepted.has(Math.round(v) + d)) return true;
    return false;
  };

  const beats = [...mainEl.children].filter((k) => {
    const cs = getComputedStyle(k);
    return cs.display !== "none" && k.getBoundingClientRect().height > 120;
  });
  for (let i = 1; i < beats.length; i++) {
    const A = beats[i - 1];
    const B = beats[i];
    /*
     * Full-bleed photographs BUTT together on purpose — whitespace between two
     * frames of the same sea breaks the horizon (Field's own rule), and a dark
     * interlude is separated by its change of ground rather than by air. Zero
     * is a deliberate value in both cases, so both are out of scope.
     */
    const cinematic = [A, B].some(
      (el) =>
        el.classList.contains("field") ||
        el.classList.contains("on-dark") ||
        el.classList.contains("d-hero") ||
        el.classList.contains("litany")
    );
    if (cinematic) continue;

    const csA = getComputedStyle(A);
    const csB = getComputedStyle(B);
    const air =
      parseFloat(csA.paddingBottom) +
      parseFloat(csB.paddingTop) +
      Math.max(parseFloat(csA.marginBottom), parseFloat(csB.marginTop)) +
      (B.getBoundingClientRect().top - A.getBoundingClientRect().bottom);

    if (air > 2 && !onSystem(air)) {
      findings.push({
        kind: "off-system",
        selector: `${sel(A)} / ${sel(B)}`,
        detail: `${Math.round(air)}px of air matches no rhythm token`,
        text: text(B).slice(0, 50),
      });
    }
  }

  return { findings, sectionY: Math.round(sectionY) };
};

const all = [];
const broken = [];
for (const [name, route] of ROUTES) {
  for (const [label, w, h] of WIDTHS) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(BASE + route, { waitUntil: "load", timeout: 90_000 });
      /* Scroll the whole page once so every reveal has fired before measuring. */
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y <= total; y += Math.round(h * 0.7)) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(70);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);

      const { findings, sectionY } = await page.evaluate(audit);
      for (const f of findings) all.push({ route: name, width: label, ...f });
      process.stdout.write(
        `  ${name.padEnd(18)} @ ${label.padEnd(5)} ${String(findings.length).padStart(3)} findings  (--section-y ${sectionY}px)\n`
      );
    } catch (e) {
      broken.push(`${name} @ ${label}`);
      process.stdout.write(`  ${name} @ ${label}  FAILED: ${String(e).slice(0, 90)}\n`);
    }
    await browser.close();
  }
}

const byKind = {};
for (const f of all) (byKind[f.kind] ??= []).push(f);

let md = "# Taste audit — the measurable half\n\n";
md += `Generated by \`node scripts/taste-audit.mjs\`. ${all.length} findings.\n\n`;
md += "Nothing here is automatically a defect. Each finding is a place to look.\n\n";
for (const kind of ["measure", "tracking", "collision", "congestion", "widow", "off-system"]) {
  const list = byKind[kind] ?? [];
  md += `## ${kind} — ${list.length}\n\n`;
  if (!list.length) {
    md += "None.\n\n";
    continue;
  }
  md += "| route | width | selector | measurement | text |\n|---|---|---|---|---|\n";
  for (const f of list) {
    md += `| ${f.route} | ${f.width} | \`${f.selector}\` | ${f.detail} | ${(f.text ?? "").replace(/\|/g, "/")} |\n`;
  }
  md += "\n";
}
fs.writeFileSync(path.join(OUT, "FINDINGS.md"), md);
fs.writeFileSync(path.join(OUT, "findings.json"), JSON.stringify(all, null, 2));

console.log(`\n${all.length} findings -> qa/taste/FINDINGS.md`);
for (const [k, v] of Object.entries(byKind)) console.log(`  ${k.padEnd(12)} ${v.length}`);

if (broken.length) {
  console.error(
    `\n${broken.length} of ${ROUTES.length * WIDTHS.length} route/width pairs never loaded:\n  ` +
      broken.join("\n  ") +
      `\nThe finding count above is NOT a clean bill of health — those pages were never looked at.`
  );
  process.exit(1);
}
