"use client";

import dynamic from "next/dynamic";

import type { ClauseProps } from "./Clause";

/**
 * THE CLAUSE, LOADED ONLY WHERE IT RENDERS.
 *
 * For the root `not-found.tsx` and the `SiteFooter` it renders, and nowhere
 * else. The App Router serialises the root 404 element into EVERY page's
 * payload, so a client component anywhere in that tree ships — downloaded and
 * evaluated — on every route: the Clause brought framer-motion (a 118 kB chunk)
 * onto the Direction F homepage, which uses neither (measured, `qa/perf/`,
 * tranche twelve). Swapping only the 404's own import was not enough; the
 * footer inside it carried a second, measured by the flight payload still
 * naming `Clause` on `/`.
 *
 * Behind `next/dynamic` the chunk is requested only when one actually renders.
 * Server rendering is unchanged, so the clause is in the HTML as before; on the
 * inner pages, whose heroes import the Clause directly, the module is already
 * loaded and this adds nothing.
 */
const Clause = dynamic(() => import("./Clause").then((m) => m.Clause));

export function LazyClause(props: ClauseProps) {
  return <Clause {...props} />;
}
