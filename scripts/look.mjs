#!/usr/bin/env node
/**
 * LOOK — one element, photographed.
 *
 * The taste audit measures; this is for the half that has to be judged by
 * looking at it. Give it a route, a selector and a width and it returns a
 * screenshot of that element with air around it, rather than a full-page strip
 * nobody can read.
 *
 *   node scripts/look.mjs /  ".litany"  1440  litany
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const [route, selector, width = "1440", name = "shot"] = process.argv.slice(2);
if (route === undefined || !selector) {
  console.error("usage: node scripts/look.mjs <route> <selector> [width] [name]");
  process.exit(1);
}

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";

/*
 * Git Bash rewrites a bare "/" argument into the MSYS root — the route arrives
 * as "C:/Program Files/Git/" and Playwright reports "Cannot navigate to invalid
 * URL", which reads like a Playwright problem and is a shell problem. Routes may
 * therefore be given WITHOUT the leading slash ("en/the-estate", or "" for the
 * homepage) and are normalised here.
 */
const routePath = /^[A-Za-z]:/.test(route) ? "/" : "/" + route.replace(/^\/+/, "");
const OUT = path.join(process.cwd(), "qa", "taste", "look");
fs.mkdirSync(OUT, { recursive: true });

const w = Number(width);
const h = w < 500 ? 844 : 900;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(BASE + routePath, { waitUntil: "load", timeout: 90_000 });

/* Scroll the whole page so every reveal has fired — otherwise the shot is of
   an element still at opacity 0, which looks like a rendering bug and is not. */
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= total; y += Math.round(h * 0.7)) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(90);
}

const el = page.locator(selector).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);

const file = path.join(OUT, `${name}-${w}.png`);
const box = await el.boundingBox();
if (box && box.height > h * 2.2) {
  /* Too tall to read in one frame: photograph the viewport around its top. */
  await page.screenshot({ path: file });
  console.log(`${file}  (element ${Math.round(box.height)}px — viewport shot)`);
} else {
  await el.screenshot({ path: file });
  console.log(`${file}  (${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)})`);
}
await browser.close();
