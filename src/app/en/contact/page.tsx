import type { Metadata } from "next";

import { Reveal } from "@/components/motion/Reveal";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { EnquiryForm } from "@/components/ui/EnquiryForm";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Thalasses Villas — Pigianos Kampos, Rethymno, Crete.",
  alternates: { canonical: "/en/contact" },
};

/**
 * CONTACT.
 *
 * Every enquiry CTA on the site lands here, and the `?enquiry=` param carries
 * what it was about, so an owner reading the note knows which villa or which
 * occasion prompted it without asking.
 */
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry } = await searchParams;
  const site = getSite() as {
    contact?: {
      addressLines?: string[];
      phones?: string[];
      phoneHrefs?: string[];
      email?: string;
      consentText?: string;
    };
  };
  const c = site.contact ?? {};

  return (
    <PageShell>
      <PageHead
        beat="01 — Contact"
        title="Asking us anything"
        lede="A full estate buyout, a wedding, a question about a date — all of it starts here."
      />

      <section className="canon d-contact">
        <Reveal className="d-contact-details">
          <p className="micro d-exp-mark">Where we are</p>
          <address className="small d-contact-address">
            {(c.addressLines ?? []).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </address>

          <p className="micro d-exp-mark">By telephone</p>
          <ul className="small d-contact-list">
            {(c.phones ?? []).map((p, i) => (
              <li key={p}>
                <a
                  href={(c.phoneHrefs ?? [])[i] ?? `tel:${p.replace(/\s+/g, "")}`}
                  className="d-link"
                >
                  {p}
                </a>
              </li>
            ))}
          </ul>

          <p className="micro d-exp-mark">By email</p>
          <p className="small">
            <a href={`mailto:${c.email ?? "info@thalasses.com"}`} className="d-link">
              {c.email ?? "info@thalasses.com"}
            </a>
          </p>
        </Reveal>

        <Reveal className="d-contact-form" index={1}>
          <EnquiryForm consentText={c.consentText ?? undefined} subject={enquiry} />
        </Reveal>
      </section>
    </PageShell>
  );
}
