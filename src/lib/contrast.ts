/**
 * WCAG 2.x relative luminance and contrast, used by /styleguide to compute the
 * palette's ratios at render time rather than restating numbers from a document.
 * If a token is ever changed, the styleguide reports the truth immediately.
 */

export interface Token {
  name: string;
  hex: string;
  role: string;
  rationale: string;
  /** Surface-only tokens are structurally incapable of becoming an accent. */
  surfaceOnly?: boolean;
  darkGroundsOnly?: boolean;
}

export const PALETTE: Token[] = [
  {
    name: "limestone",
    hex: "#E8E9E3",
    role: "Page ground · ~80% of surface area",
    rationale:
      "Limestone dust, not cream. Green is the highest channel (R232 G233 B227), so it reads as dry Cretan stone in shade. The yellow is pulled to zero deliberately.",
  },
  {
    name: "basalt",
    hex: "#16262B",
    role: "Ink · body copy, clauses, ledger and footer ground",
    rationale:
      "The dark grey-green rock at the tideline. A blue-green near-black, never neutral charcoal — the darkest thing on this site still belongs to the sea.",
  },
  {
    name: "pelagos",
    hex: "#14535F",
    role: "Interactive + immersive · links, focus, the datum rule",
    rationale:
      "The Libyan Sea off Rethymno at depth. The line you follow and the thing you click are the same colour, because both are the sea. Passes AA at every size, so it needs no lint rule.",
  },
  {
    name: "phrygana",
    hex: "#545D4E",
    role: "Secondary text on light · captions, distances, item names",
    rationale:
      "Dry thyme and sea-squill on the slope behind the villas. Replaces the neutral grey a default system reaches for, so even the quietest text comes from the site.",
  },
  {
    name: "preveli",
    hex: "#A4CCC9",
    role: "Secondary text and rules on dark grounds",
    rationale:
      "The chalky pale turquoise of the shallows at Damnoni and Preveli. This is the break-out value — no AI-default luxury palette contains it.",
    darkGroundsOnly: true,
  },
  {
    name: "ammos",
    hex: "#E2DACB",
    role: "Surface only · the Inventory ground and enquiry card",
    rationale:
      "Dry sand above the tideline. A change of stock, the way a book switches to uncoated paper for its back matter. Never a text colour.",
    surfaceOnly: true,
  },
];

function channel(v: number): number {
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return (
    0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export type Verdict = "AAA" | "AA" | "AA large only" | "fail";

export function verdict(ratio: number): Verdict {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA large only";
  return "fail";
}

export function tokenHex(name: string): string {
  return PALETTE.find((t) => t.name === name)?.hex ?? "#000000";
}
