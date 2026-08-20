import type { Metadata } from "next";

import { Reveal } from "@/components/motion/Reveal";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { getTerms } from "@/lib/content";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  robots: { index: false, follow: true },
  alternates: alternatesFor("/en/terms"),
};

/**
 * TERMS — rendered complete, and NOT quietly rewritten.
 *
 * The legacy terms are inherited boilerplate and they name a different company:
 * "Ink Hotel" appears SEVEN times (the brief said five; seven is what the file
 * contains). They also carry two documented double-encoding faults.
 *
 * This is legal text. Silently substituting "Thalasses Villas" for another
 * company's name would be me editing a contract, which is not mine to do — and
 * quietly shipping the wrong company name is not acceptable either. So both
 * readings are on the page: the captured text, and the proposed correction,
 * marked as proposed. The owner and their lawyer decide; the page tells the
 * truth in the meantime.
 */
const WRONG_PARTY = "Ink Hotel";
const RIGHT_PARTY = "Thalasses Villas";

function Corrected({ text }: { text: string }) {
  if (!text.includes(WRONG_PARTY)) return <>{text}</>;
  const parts = text.split(WRONG_PARTY);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 ? (
            <mark className="d-terms-fix" title={`Legacy text reads "${WRONG_PARTY}" — correction proposed, pending owner and legal review`}>
              {RIGHT_PARTY}
              <span className="sr-only"> (corrected from &quot;{WRONG_PARTY}&quot;, pending owner review)</span>
            </mark>
          ) : null}
        </span>
      ))}
    </>
  );
}

export default function TermsPage() {
  const terms = getTerms() as unknown as {
    pageHeading?: string;
    sections?: { heading: string | null; paragraphs?: string[]; list?: string[] }[];
  };
  const sections = terms.sections ?? [];
  const occurrences = JSON.stringify(sections).split(WRONG_PARTY).length - 1;

  return (
    <PageShell>
      <PageHead beat="Legal" title={terms.pageHeading ?? "Terms and Conditions"} />

      <section className="canon d-terms-notice">
        <p className="small">
          <strong>Under review.</strong> These terms were inherited from the previous site and
          name another company, <em>{WRONG_PARTY}</em>, in {occurrences} places. Each is shown
          here corrected to <em>{RIGHT_PARTY}</em> and marked, so the substitution is visible
          rather than silent. The wording has not otherwise been altered, and the whole document
          is pending the owner&rsquo;s legal review before launch.
        </p>
      </section>

      <section className="canon d-terms">
        {sections.map((s, i) => (
          <Reveal key={s.heading ?? i} index={Math.min(i, 3)} className="d-terms-section">
            {s.heading ? <h2 className="display c4 d-terms-heading">{s.heading}</h2> : null}
            {(s.paragraphs ?? []).map((p, j) => (
              <p key={j} className="small d-terms-p">
                <Corrected text={p} />
              </p>
            ))}
            {s.list?.length ? (
              <ul className="small d-terms-list">
                {s.list.map((l, j) => (
                  <li key={j}>
                    <Corrected text={l} />
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>
        ))}
      </section>
    </PageShell>
  );
}
