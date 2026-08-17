import "server-only";

import { getBookingConfig } from "@/lib/content";
import type { Villa } from "@/types/content";

/**
 * Deep links into the WebHotelier engine.
 *
 * D4 (owner-confirmed): every booking routes through the property's own
 * subdomain, thalassesvillas.reserve-online.net (WebHotelier property THALASSES).
 *
 * Verified against the live rendered engine on 2026-08-06:
 *  - checkin / nights / checkout / adults / children / rooms all work.
 *  - lang=en is REQUIRED. The engine renders in Greek without it.
 *  - `room=` is INERT on this host. Passing room=THOI, room=WH200 or a
 *    deliberately bogus code all render the identical five room blocks, so a
 *    villa CTA cannot preselect its villa. Per D4 we link with dates only
 *    rather than silently falling back to the etouri account. See T-156.
 *  - There is no children-ages parameter, so the bar collects a count only.
 */

export interface BookingQuery {
  /** YYYY-MM-DD. Without it the engine opens on the search form. */
  checkin?: string;
  /** Use nights OR checkout, never both. */
  nights?: number;
  checkout?: string;
  adults?: number;
  /** A count only — the engine has no per-child ages parameter. */
  children?: number;
  rooms?: number;
}

const LANG = "en";

function host(): string {
  const cfg = getBookingConfig() as unknown as { host?: string };
  return cfg.host ?? "thalassesvillas.reserve-online.net";
}

/** Builds a booking URL. Omits empty values so the engine applies its defaults. */
export function bookingUrl(query: BookingQuery = {}): string {
  const url = new URL(`https://${host()}/`);
  const p = url.searchParams;

  if (query.checkin) p.set("checkin", query.checkin);

  // nights XOR checkout — sending both is rejected by the engine.
  if (query.nights != null && query.checkout) {
    throw new Error("bookingUrl: pass nights OR checkout, never both");
  }
  if (query.nights != null) p.set("nights", String(query.nights));
  else if (query.checkout) p.set("checkout", query.checkout);

  if (query.adults != null) p.set("adults", String(query.adults));
  if (query.children != null) p.set("children", String(query.children));
  if (query.rooms != null) p.set("rooms", String(query.rooms));

  p.set("lang", LANG);
  return url.toString();
}

/**
 * A villa's call to action.
 *
 * All five villas of the collection take bookings, including Villa Pueblo —
 * the owner confirmed the PUEBLO room code is live in WebHotelier (T-157).
 * Room preselect is impossible on this host (T-156), so every villa links to
 * the same dated availability search.
 */
export type VillaCta = {
  kind: "availability" | "enquiry";
  label: string;
  href: string;
  /** Shown alongside the primary CTA where the template has room for it. */
  secondary?: { label: string; href: string };
  note: string;
};

export function villaCta(villa: Villa, query: BookingQuery = {}): VillaCta {
  return {
    kind: "availability",
    label: "Check availability",
    href: bookingUrl(query),
    secondary: {
      label: "Enquire",
      href: `/en/contact?villa=${encodeURIComponent(villa.slug)}`,
    },
    note: "Dates only — room preselect is inert on this host (T-156).",
  };
}

/**
 * The Entire Estate is enquiry-by-design, not enquiry-by-limitation.
 *
 * The owner chose a concierge sale deliberately: a full-buyout product suits a
 * high-touch conversation, and direct booking of the whole estate would create
 * allotment conflicts with the individual villas. The copy must read as a
 * service, never as a missing booking feature.
 *
 * If an estate unit is later created on the THALASSES account, switching to
 * direct booking is a single config change here (T-164).
 */
export function estateCta(): VillaCta {
  return {
    kind: "enquiry",
    label: "Enquire — we design your stay",
    href: "/en/contact?enquiry=estate",
    note: "Concierge by design (T-158), not a limitation. Never frame as unavailable booking.",
  };
}
