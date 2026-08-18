import { SiteFooter } from "@/components/sections/SiteFooter";
import { getSite } from "@/lib/content";

/**
 * The Direction D page frame.
 *
 * Six content pages were about to repeat the same footer wiring, the same
 * `.d` wrapper and the same `<main id="main">`. One shell instead, so the skip
 * link's target and the footer's facts have exactly one definition.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const contact = site.contact ?? {};

  return (
    <div className="d">
      <main id="main">{children}</main>
      <SiteFooter
        addressLines={contact.addressLines ?? []}
        phones={contact.phones ?? []}
        phoneHrefs={contact.phoneHrefs ?? []}
        email={contact.email ?? "info@thalasses.com"}
        careersEmail={site.careers?.careersEmail ?? "creteholidayhome@gmail.com"}
        socials={site.socials ?? []}
        operatingLicence={site.legal?.operatingLicence ?? ""}
        operatingLicenceLabel={site.legal?.operatingLicenceLabel ?? "Permission of legality"}
      />
    </div>
  );
}

/**
 * The standing draft policy, made visible.
 *
 * Copy that has not been approved is marked where it is read, not only in a
 * TODO file the owner will never open. It is deliberately plain rather than
 * decorative — a badge that looks designed reads as a feature.
 */
export function Draft({ what }: { what: string }) {
  return (
    <p className="micro d-draft" role="note">
      Draft — {what} — pending owner approval
    </p>
  );
}

/** A page opener: eyebrow, display heading, optional lede. One per page. */
export function PageHead({
  beat,
  title,
  lede,
}: {
  beat: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="canon d-pagehead">
      <p className="micro">{beat}</p>
      <h1 className="display c2 d-pagehead-title">{title}</h1>
      {lede ? <p className="d-villa-lede">{lede}</p> : null}
    </header>
  );
}
