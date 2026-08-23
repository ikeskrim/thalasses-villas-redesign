import "server-only";

import elChrome from "../../content/el/chrome.json";
import elExperiences from "../../content/el/experiences.json";
import elFacilities from "../../content/el/facilities.json";
import elHome from "../../content/el/home.json";
import elPages from "../../content/el/pages.json";
import elTerms from "../../content/el/terms.json";
import elVillaPageCopy from "../../content/el/villa-page-copy.json";
import elVillas from "../../content/el/villas.json";

import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

/**
 * THE GREEK OVERLAY.
 *
 * `content/` is the Phase 0 record of what the legacy site said, in the
 * language it said it. `content/el/` is a parallel overlay, and the English
 * registry is never touched — the record stays the record, and a translation
 * that disagreed with it would be visible rather than merged into it.
 *
 * **Everything here is `copyStatus: "draft"`.** The owner reads Greek natively;
 * this is a first draft for his eye. `tests/greek-corpus.spec.ts` asserts the
 * draft flag is present on every file, and `PUBLISHED_LOCALES` in
 * `src/lib/locale.ts` is what actually gates a public Greek route — flipping it
 * before the routes exist turns the suite red rather than shipping a locale of
 * 404s (T-280).
 *
 * EVERY LOOKUP FALLS BACK TO THE ENGLISH. A missing Greek string renders the
 * English one rather than an empty element or a key. That is the right failure
 * for a draft corpus: a page half in English is obviously unfinished, and a
 * page with holes in it looks broken in a way nobody can diagnose.
 *
 * Descriptions in the facilities overlay are keyed by the **English text**, not
 * by featureId. The same featureId carries different English in different villa
 * files — the estate says "4 Fully equipped kitchens" where a villa says
 * "Fully equipped kitchen" — so a featureId map held one Greek and the estate
 * would have told a reader there was one kitchen. Keying by the source string
 * is 1:1 by construction.
 */

type Dict = Record<string, unknown>;

const CORPUS: Record<Exclude<Locale, "en">, Dict> = {
  el: {
    chrome: elChrome as Dict,
    experiences: elExperiences as Dict,
    facilities: elFacilities as Dict,
    home: elHome as Dict,
    pages: elPages as Dict,
    terms: elTerms as Dict,
    villaPageCopy: elVillaPageCopy as Dict,
    villas: elVillas as Dict,
  },
};

function corpus(locale: Locale): Dict | null {
  if (locale === DEFAULT_LOCALE) return null;
  return CORPUS[locale as Exclude<Locale, "en">] ?? null;
}

/** Walks a dotted path, tolerating a missing branch at any depth. */
function at(root: unknown, path: string): unknown {
  let node: unknown = root;
  for (const key of path.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/**
 * One string, in the reader's language, falling back to the English.
 *
 * `t("home.litany.lines.0", englishLine, locale)`
 */
export function t(path: string, fallback: string, locale: Locale): string {
  const root = corpus(locale);
  if (!root) return fallback;
  const value = at(root, path);
  return typeof value === "string" && value.trim() ? value : fallback;
}

/** A whole branch — a beat, a set of lines — or the English shape if absent. */
export function tree<T>(path: string, fallback: T, locale: Locale): T {
  const root = corpus(locale);
  if (!root) return fallback;
  const value = at(root, path);
  return value == null ? fallback : (value as T);
}

/**
 * An amenity description, looked up by its English text.
 *
 * The one lookup that is keyed by content rather than by position, for the
 * reason in the header: featureIds are not unique across villa files and the
 * English is.
 */
export function tDescription(english: string | null | undefined, locale: Locale): string | null {
  if (!english) return null;
  const root = corpus(locale);
  if (!root) return english;
  const map = (root.facilities as Dict | undefined)?.descriptions as
    | Record<string, string>
    | undefined;
  return map?.[english] ?? english;
}

/** An amenity feature name, by featureId — these ARE stable across files. */
export function tFeature(id: number | string, english: string, locale: Locale): string {
  const root = corpus(locale);
  if (!root) return english;
  const map = (root.facilities as Dict | undefined)?.features as Record<string, string> | undefined;
  return map?.[String(id)] ?? english;
}

/** A tab or group heading in the inventory. */
export function tGroup(english: string, locale: Locale, kind: "tabs" | "groups" = "groups"): string {
  const root = corpus(locale);
  if (!root) return english;
  const map = (root.facilities as Dict | undefined)?.[kind] as Record<string, string> | undefined;
  return map?.[english] ?? english;
}

/**
 * How complete the overlay is, for the report and for the guard.
 *
 * Counted rather than claimed: a corpus that silently lost a file would
 * otherwise look exactly like one that did not.
 */
export function corpusStats(locale: Locale): { files: number; strings: number; notes: number } {
  const root = corpus(locale);
  if (!root) return { files: 0, strings: 0, notes: 0 };

  let strings = 0;
  let notes = 0;
  const walk = (node: unknown, inNotes: boolean) => {
    if (typeof node === "string") {
      if (inNotes) notes++;
      else strings++;
      return;
    }
    if (Array.isArray(node)) {
      for (const v of node) walk(v, inNotes);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, inNotes || k === "notes");
    }
  };
  walk(root, false);
  return { files: Object.keys(root).length, strings, notes };
}
