"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { DEFAULT_LOCALE, LOCALES, PUBLISHED_LOCALES, withLocale, type Locale } from "@/lib/locale";

/**
 * THE EDITORIAL LANGUAGE SWITCHER — EN / ΕΛ.
 *
 * A staggered split-letter reveal rather than a dropdown: the inactive language
 * unrolls character by character on hover or focus, and swaps on click.
 *
 * IT RENDERS NOTHING TODAY, AND THAT IS THE POINT.
 *
 * `/el` is not published. The Greek corpus exists — about 18,000 words — but it
 * is `copyStatus: "draft"` with 371 questions still waiting on the owner's
 * native review, and no `/el` route is built. A switcher offering a language
 * that 404s is a promise the site cannot keep, and `tests/locale.spec.ts`
 * asserts its absence for exactly that reason:
 *
 *     "the language switcher is absent while one locale is published"
 *
 * So this is built, wired and tested, and gated on `PUBLISHED_LOCALES`. The day
 * a second locale is added to that array, the switcher appears on every page by
 * itself — no edit here, no forgotten component, and the same test flips from
 * asserting absence to asserting presence.
 *
 * Building it now and hiding it behind the real gate is the honest version of
 * "implement the switcher": the work is done, and it cannot ship draft copy
 * through a side door before the owner has read it.
 */

/** The endonym, not the English name. A Greek reader looks for Ελληνικά. */
const LABEL: Record<string, string> = { en: "EN", el: "ΕΛ" };

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  /* The gate. Nothing renders — not an empty element, not a hidden one. */
  if (PUBLISHED_LOCALES.length < 2) return null;

  /*
   * The locale from the path. `src/lib/locale.ts` has no reader for this —
   * `withLocale` writes one — and adding a public helper to the site's locale
   * module for one component would be a wider change than the need. The
   * homepage is bare `/` and belongs to the default locale, which is the one
   * case a naive first-segment read gets wrong.
   */
  const first = pathname.split("/").filter(Boolean)[0];
  const current: Locale =
    (LOCALES as readonly string[]).includes(first ?? "") ? (first as Locale) : DEFAULT_LOCALE;
  const others = PUBLISHED_LOCALES.filter((l) => l !== current);

  return (
    <div
      className="lang"
      data-language-switcher=""
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <span className="lang-current micro" aria-hidden="true">
        {LABEL[current] ?? current.toUpperCase()}
      </span>

      <ul className={`lang-list${open ? " is-open" : ""}`}>
        {others.map((locale) => {
          const label = LABEL[locale] ?? locale.toUpperCase();
          return (
            <li key={locale}>
              <a
                href={withLocale(pathname, locale)}
                className="lang-link micro"
                lang={locale}
                /* The accessible name is the whole word; the split letters
                   below are decoration and are hidden from assistive tech. */
                aria-label={locale === "el" ? "Ελληνικά" : "English"}
              >
                {/*
                  SPLIT AT RENDER, NOT BY A LIBRARY. The label is two or three
                  characters; pulling in SplitText to stagger them would be
                  ~7 kB to animate four letters, and a per-character transition
                  delay in CSS does the same job with none of it.
                */}
                {[...label].map((ch, i) => (
                  <span
                    key={`${ch}-${i}`}
                    className="lang-ch"
                    aria-hidden="true"
                    style={{ transitionDelay: `${i * 45}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
