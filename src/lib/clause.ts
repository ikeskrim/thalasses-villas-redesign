/**
 * Clause grammar enforcement (DESIGN-PLAN §2.2).
 *
 * > The gerund is an act of living. The tail is a fact you could check.
 *
 * No clause on this site ever ends in a full stop. That rule is what makes
 * "unlimited" structural rather than decorative, so it is enforced in code
 * instead of in a style guide nobody reads in month four.
 */

export type ClauseScale = "c1" | "c2" | "c3" | "c4";

export const GERUND_WORD_CAP = 3;
export const TAIL_WORD_CAP = 6;

/** Terminal punctuation is stripped on render and throws in development. */
const TERMINAL_PUNCTUATION = /[.!?;:]\s*$/;

export class ClauseGrammarError extends Error {
  constructor(message: string) {
    super(`Clause grammar: ${message}`);
    this.name = "ClauseGrammarError";
  }
}

export function stripTerminal(value: string): string {
  return value.replace(TERMINAL_PUNCTUATION, "");
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates a clause. Throws in development so a bad clause fails loudly during
 * the build; in production it degrades silently rather than blanking a page.
 */
export function assertClause(gerund: string, tail?: string): void {
  if (process.env.NODE_ENV === "production") return;

  if (!gerund.trim()) {
    throw new ClauseGrammarError("gerund is empty");
  }
  if (TERMINAL_PUNCTUATION.test(gerund)) {
    throw new ClauseGrammarError(
      `gerund "${gerund}" ends in terminal punctuation — no clause on this site is ever closed`
    );
  }
  if (wordCount(gerund) > GERUND_WORD_CAP) {
    throw new ClauseGrammarError(
      `gerund "${gerund}" is ${wordCount(gerund)} words; the cap is ${GERUND_WORD_CAP}`
    );
  }
  if (!/ing\b/i.test(gerund.split(/\s+/)[0] ?? "")) {
    throw new ClauseGrammarError(
      `"${gerund}" is not a gerund — the first word must be an act of living, ending in -ing`
    );
  }

  if (tail === undefined) return;

  if (TERMINAL_PUNCTUATION.test(tail)) {
    throw new ClauseGrammarError(
      `tail "${tail}" ends in terminal punctuation — the gap is the punctuation`
    );
  }
  if (wordCount(tail) > TAIL_WORD_CAP) {
    throw new ClauseGrammarError(
      `tail "${tail}" is ${wordCount(tail)} words; the cap is ${TAIL_WORD_CAP}`
    );
  }
}

/**
 * The five registers a tail may be drawn from (DESIGN-PLAN §2.2). A tail must
 * resolve to a fact in the build-time registry compiled from /content — this is
 * what converts place-specificity from a copywriting deliverable into a data
 * binding. Adjectives and moods have no register and cannot compile.
 *
 * The registry itself is built in Phase 2, when the pages that consume it exist.
 */
export type TailRegister = "distance" | "material" | "place" | "position" | "count";

export interface RegisteredTail {
  text: string;
  register: TailRegister;
  /** Dotted path into /content that proves the fact, e.g. "villas/200.specs.floors". */
  source: string;
}
