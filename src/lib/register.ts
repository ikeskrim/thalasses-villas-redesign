import type { Experience } from "@/types/content";

export interface RegisterRow {
  slug: string;
  name: string;
  line: string | null;
  /** Enough real copy to carry an editorial page on its own. */
  flagship: boolean;
  wordCount: number;
}

/**
 * The two-tier split (D3, DESIGN-PLAN §6.3).
 *
 * `needsContent` is set in the inventory from the real body-copy word count —
 * 14 of the 21 experiences are at or under 40 words. Those render compact and
 * expand in place; the rest get their own page. Once an owner-approved draft
 * lands (`copyStatus: "approved"`) an experience is promoted automatically.
 *
 * Kept out of the client component so a server component can call it.
 */
export function toRegisterRows(experiences: Experience[]): RegisterRow[] {
  return experiences.map((e) => ({
    slug: e.slug,
    name: e.name,
    line: e.shortDescription,
    flagship: !e.needsContent || e.copyStatus === "approved",
    wordCount: e.wordCount,
  }));
}
