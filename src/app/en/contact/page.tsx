import type { Metadata } from "next";

import { Reveal } from "@/components/motion/Reveal";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { EnquiryForm } from "@/components/ui/EnquiryForm";
import { COLLECTION_VILLA_IDS, getVilla, getSite } from "@/lib/content";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Thalasses Villas — Pigianos Kampos, Rethymno, Crete.",
  alternates: alternatesFor("/en/contact"),
};

/**
 * CONTACT.
 *
 * Every enquiry CTA on the site lands here, and the `?enquiry=` param carries
 * what it was about, so an owner reading the note knows which villa or which
 * occasion prompted it without asking.
 */
/**
 * The enquiry subject is resolved from EITHER param, because two of them were
 * already in use before this page existed: `villaCta` emits `?villa=<slug>` and
 * `estateCta` emits `?enquiry=estate`. Rather than rewrite every call site and
 * risk missing one, the page accepts both and turns the slug into the villa's
 * real name — so the note the owner receives says "Villa Eeanthe", not
 * "villa-eeanthe".
 */
function resolveSubject(params: { enquiry?: string; villa?: string }): string | undefined {
  if (params.villa) {
    const match = COLLECTION_VILLA_IDS.map((k) => getVilla(k)).find(
      (v) => v.slug === params.villa
    );
    if (match) return match.name;
  }
  if (params.enquiry === "estate") return "The Entire Estate";
  return params.enquiry || undefined;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string; villa?: string }>;
}) {
  const params = await searchParams;
  const enquiry = resolveSubject(params);
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
