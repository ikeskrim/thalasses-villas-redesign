import Link from "next/link";

import { Clause } from "@/components/ui/Clause";

export interface SiteFooterProps {
  addressLines: string[];
  phones: string[];
  phoneHrefs: string[];
  email: string;
  careersEmail: string;
  socials: { platform: string; url: string }[];
  operatingLicence: string;
  operatingLicenceLabel: string;
  partner?: { name: string; url: string } | null;
}

/**
 * Beat 09 — the footer.
 *
 * The operating licence number is a LEGAL REQUIREMENT under Greek short-term
 * rental rules, not a design element, so it is set at body size in the primary
 * ink — never as a micro-label, never greyed out, never hidden behind a link.
 */
export function SiteFooter({
  addressLines,
  phones,
  phoneHrefs,
  email,
  careersEmail,
  socials,
  operatingLicence,
  operatingLicenceLabel,
  partner,
}: SiteFooterProps) {
  return (
    <footer className="site-footer on-dark">
      <div className="canon">
        <div className="clause-field">
          <Clause gerund="Living" tail="Unlimited" scale="c2" as="p" />
        </div>

        <div className="footer-grid">
          <div>
            <p className="micro footer-heading">Thalasses Villas</p>
            <address className="small footer-address">
              {addressLines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
          </div>

          <div>
            <p className="micro footer-heading">Contact</p>
            <ul className="small footer-list">
              {phones.map((p, i) => (
                <li key={p}>
                  <a href={phoneHrefs[i] ?? `tel:${p.replace(/\s/g, "")}`} className="footer-link tabular">
                    {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${email}`} className="footer-link">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="micro footer-heading">Careers</p>
            <ul className="small footer-list">
              <li>
                <a href={`mailto:${careersEmail}`} className="footer-link">
                  {careersEmail}
                </a>
              </li>
              <li>
                <Link href="/en/careers" className="footer-link">
                  Become one of us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="micro footer-heading">Follow</p>
            <ul className="small footer-list">
              {socials.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-legal">
          <p className="small">
            {operatingLicenceLabel}:{" "}
            <span className="tabular">{operatingLicence}</span>
          </p>
          <p className="small footer-legal-links">
            <Link href="/en/terms" className="footer-link">
              Terms &amp; Conditions
            </Link>
            {partner ? (
              <>
                <span aria-hidden="true"> · </span>
                <a
                  href={partner.url}
                  className="footer-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sales &amp; marketing by {partner.name}
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
