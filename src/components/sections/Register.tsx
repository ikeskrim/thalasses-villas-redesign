"use client";

import Link from "next/link";
import { useState } from "react";

import type { RegisterRow } from "@/lib/register";

/**
 * Beat 06 — THE REGISTER (DESIGN-PLAN §6.3).
 *
 * The two-tier experiences system. Fourteen of the twenty-one experience pages
 * carry forty words or fewer — one has twelve — so a grid of equal cards would
 * either pad them with invented copy or expose them as empty.
 *
 * Instead: flagship experiences get their own page; compact ones EXPAND IN
 * PLACE and never mint a thin URL. That also fixes the criticism levelled at
 * three of the four candidate directions, which put their best component behind
 * a desktop hover — there is no hover here, so the behaviour is identical on a
 * phone and on a 1920 display.
 */
export function Register({ rows }: { rows: RegisterRow[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="register">
      {rows.map((row) => {
        const isOpen = open === row.slug;
        return (
          <li key={row.slug} className="register-row">
            {row.flagship ? (
              <Link href={`/en/experiences/${row.slug}`} className="register-trigger">
                <span className="display c4 register-name">{row.name}</span>
                <span className="micro register-action">Read</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="register-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`reg-${row.slug}`}
                  onClick={() => setOpen(isOpen ? null : row.slug)}
                >
                  <span className="display c4 register-name">{row.name}</span>
                  <span className="micro register-action">{isOpen ? "Close" : "More"}</span>
                </button>
                <div
                  id={`reg-${row.slug}`}
                  className="register-panel"
                  hidden={!isOpen}
                >
                  {row.line ? <p className="small register-line">{row.line}</p> : null}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { RegisterRow };
