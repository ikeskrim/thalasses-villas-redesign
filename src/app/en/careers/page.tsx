import type { Metadata } from "next";

import { Reveal } from "@/components/motion/Reveal";
import { Draft, PageHead, PageShell } from "@/components/sections/PageShell";
import { getSite } from "@/lib/content";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Careers",
  description: "Become part of the team at Thalasses Villas, Rethymno, Crete.",
  alternates: alternatesFor("/en/careers"),
};

/**
 * CAREERS.
 *
 * The registry's paragraphs are rendered as captured, including one that
 * arrives with a U+FFFD replacement character where an em dash almost certainly
 * belonged. It is NOT silently repaired: the legacy bytes are damaged and the
 * correct reading is the owner's to confirm, so the damage is marked instead.
 * Same rule as the Terms encoding faults.
 *
 * The careers address is its own mailbox, not the general enquiry one.
 */
export default function CareersPage() {
  const site = getSite() as {
    careers?: {
      heading?: string;
      body?: string;
      paragraphs?: string[];
      careersEmail?: string;
    };
  };
  const c = site.careers ?? {};
  const email = c.careersEmail ?? "creteholidayhome@gmail.com";
  const damaged = (c.paragraphs ?? []).some((p) => p.includes("\uFFFD"));

  return (
    <PageShell>
      <PageHead beat="01 — Careers" title={c.heading ?? "Career Opportunities"} lede={c.body ?? undefined} />
      <section className="canon d-exp-body">
        <Reveal>
          {(c.paragraphs ?? []).map((p) => (
            <p key={p.slice(0, 40)} className="prose-measure d-exp-text">
              {p}
            </p>
          ))}
          {damaged ? <Draft what="one paragraph carries a corrupt character from the legacy source" /> : null}
        </Reveal>
        <Reveal index={1}>
          <p className="micro d-exp-mark">Write to us</p>
          <p className="d-villa-cta">
            <a href={`mailto:${email}`} className="btn-primary micro" data-cursor="Write">
              {email}
            </a>
          </p>
        </Reveal>
      </section>
    </PageShell>
  );
}
