import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * BOOKING DEEP LINKS — asserted against what the engine was VERIFIED to do.
 *
 * The booking link is the one thing on this site that must never be a redesign
 * artefact: a link that quietly fails is a lost sale nobody reports. So the
 * assertions here are tied to `content/booking.json.reVerification`, which
 * records a live check of the engine on 2026-08-23 — not a re-reading of the
 * Phase 0 note, but a fresh fetch of the engine and its JS bundle.
 *
 * That re-check found the engine **had been redeployed** (a different bundle
 * hash) and that the parameter set was unchanged, which is exactly why it is
 * worth re-running rather than trusting.
 *
 * It also found two things the Phase 0 note had wrong or missing:
 *
 *   THE LANGUAGE. The note said the engine "renders in Greek without lang". It
 *   does not — it content-negotiates on `Accept-Language`. A Greek browser gets
 *   Greek, a German browser gets German, and a client sending no preference
 *   gets **Croatian**. `lang` is required because the visitor's browser decides
 *   otherwise, which is a different and more important reason.
 *
 *   PAST DATES. A past `checkin` is accepted silently — 200, and a body the
 *   same length as a valid search. The engine will never refuse it, so the UI
 *   is the only place it can be caught.
 *
 * These tests run entirely offline. Reaching out to a third party's server on
 * every suite run would make this project's gate depend on somebody else's
 * uptime, which is how a guard becomes something people skip.
 */
const VERIFIED = (
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "booking.json"), "utf-8")) as {
    reVerification: { queryParameters: string[] };
  }
).reVerification;

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/en/weddings",
];

test.describe("booking deep links", () => {
  test("the verified parameter set is recorded and non-empty", () => {
    expect(
      VERIFIED.queryParameters.length,
      "no verified parameter list — this whole file is asserting against nothing"
    ).toBeGreaterThan(5);
    expect(VERIFIED.queryParameters).toContain("checkin");
    expect(VERIFIED.queryParameters).toContain("children");
    expect(
      VERIFIED.queryParameters.filter((p) => /age/i.test(p)),
      "an ages parameter appeared in the verified set — the child-count-only decision needs revisiting"
    ).toEqual([]);
  });

  for (const route of ROUTES) {
    test(`${route} — every booking link is well formed`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      const hrefs = await page
        .locator('a[href*="reserve-online.net"]')
        .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));

      expect(hrefs.length, `${route} has no booking link`).toBeGreaterThan(0);

      const today = new Date().toISOString().slice(0, 10);

      for (const raw of hrefs) {
        const url = new URL(raw);

        expect(url.protocol, `${raw} is not https`).toBe("https:");
        expect(url.hostname).toBe("thalassesvillas.reserve-online.net");

        /* Only parameters the engine was verified to read. */
        for (const key of url.searchParams.keys()) {
          if (key === "lang") continue; /* server-side, not a bundle literal */
          expect(
            VERIFIED.queryParameters,
            `${raw} sends "${key}", which the engine was not verified to accept`
          ).toContain(key);
        }

        /* lang is pinned, or the visitor's browser picks the language. */
        expect(url.searchParams.get("lang"), `${raw} does not pin a language`).toMatch(/^(en|el)$/);

        /* nights XOR checkout — the engine rejects both together. */
        const hasNights = url.searchParams.has("nights");
        const hasCheckout = url.searchParams.has("checkout");
        expect(hasNights && hasCheckout, `${raw} sends nights AND checkout`).toBe(false);

        /* No past or malformed date may ever leave this site. */
        const checkin = url.searchParams.get("checkin");
        if (checkin !== null) {
          expect(checkin, `${raw} has a malformed checkin`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(
            checkin >= today,
            `${raw} sends a past checkin — the engine accepts it silently and shows nothing`
          ).toBe(true);
        }

        /* Encoding: the round-trip must be lossless and nothing double-encoded. */
        expect(raw, `${raw} contains a double-encoded sequence`).not.toMatch(/%25[0-9A-Fa-f]{2}/);
        expect(url.toString()).toBe(new URL(url.toString()).toString());
        for (const [, value] of url.searchParams) {
          expect(value, `${raw} has an unencoded space`).not.toContain(" ");
        }
      }
    });
  }

  test("the ledger refuses a past date typed straight into the field", async ({ page }) => {
    /*
     * `min` on a date input constrains the PICKER, not the keyboard — and this
     * bar builds its URL in an effect rather than on submit, so browser
     * validation never runs. The date has to be dropped in code, and this is
     * the assertion that it is.
     */
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const field = page.locator("#ledger-checkin");
    await expect(field).toHaveAttribute("min", new Date().toISOString().slice(0, 10));

    const reserve = page.locator('a[href*="reserve-online.net"]').last();
    await field.fill("2020-01-01");
    await page.waitForTimeout(250);

    const href = await reserve.getAttribute("href");
    expect(
      new URL(href!).searchParams.has("checkin"),
      "a past date typed into the field reached the booking URL"
    ).toBe(false);

    /* And a future one still gets through — the guard must not block everything. */
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    await field.fill(future);
    await page.waitForTimeout(250);
    const ok = await reserve.getAttribute("href");
    expect(new URL(ok!).searchParams.get("checkin")).toBe(future);
  });
});
