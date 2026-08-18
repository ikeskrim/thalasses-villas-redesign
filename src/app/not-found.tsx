import Link from "next/link";

import { PageShell } from "@/components/sections/PageShell";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { byN } from "@/lib/selects";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

/**
 * 404 — worth the brand.
 *
 * A page that has to admit something is missing is exactly where a luxury site
 * usually drops its voice and shows a wireframe. This one keeps the register:
 * the sea horizon, one clause, and two ways onward — home, and the thing the
 * visitor was most likely trying to do.
 *
 * It says what happened plainly rather than being cute about it. "Oops!" is a
 * brand deciding its own mistake is charming.
 */
export default function NotFound() {
  const frame = byN(61);

  return (
    <PageShell>
      <Field src={frame.path} alt={frame.alt} horizonY={frame.horizonY} height="72svh" className="d-villa-hero">
        <div className="canon clause-field" style={{ padding: 0 }}>
          <p className="micro d-eyebrow">404</p>
          <Clause gerund="Looking" tail="For something that moved" scale="c1" as="h1" />
        </div>
      </Field>

      <section className="canon d-exp-body">
        <p className="d-villa-lede">
          This page is not here. The site was rebuilt, and a few old addresses did not survive
          the move.
        </p>
        <p className="d-villa-cta">
          <Link href="/" className="btn-primary micro" data-cursor="Home">
            The five villas
          </Link>
          <Link href="/en/contact" className="micro d-link">
            Ask us directly
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
