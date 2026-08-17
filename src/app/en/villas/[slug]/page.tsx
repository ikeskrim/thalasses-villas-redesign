import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Inventory } from "@/components/sections/Inventory";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { TheRun } from "@/components/sections/TheRun";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { Ledger } from "@/components/ui/Ledger";
import { villaCta } from "@/lib/booking";
import {
  COLLECTION_VILLA_IDS,
  getBookingConfig,
  getFacilitiesForVilla,
  getSite,
  getVilla,
} from "@/lib/content";
import { buildInventory } from "@/lib/inventory";
import type { Villa } from "@/types/content";

/** File key -> the clause that names this villa, and its page angle. */
const VILLA_PAGES: Record<
  string,
  { gerund: string; tail: string; angle: string }
> = {
  "200": {
    gerund: "Waking",
    tail: "At sea level, ground floor",
    angle: "Front row, single-storey, the sea at eye level.",
  },
  "201": {
    gerund: "Bathing",
    tail: "In the largest bathroom",
    angle: "Front row, single-storey, with a Jacuzzi bath beside the shower.",
  },
  "202": {
    gerund: "Waking",
    tail: "On the upper floor, three rooms",
    angle: "Rear row, two storeys, the sea arriving at the first-floor balcony.",
  },
  "203": {
    gerund: "Stepping",
    tail: "From bed into the pool",
    angle: "Rear row, two storeys, the ground-floor bedroom opening onto the pool.",
  },
  pueblo: {
    gerund: "Retreating",
    tail: "Adults only, direct beach access",
    angle:
      "The couples' retreat. Adults only, its own terrace bar, and private access straight onto the beach.",
  },
};

const KEY_BY_SLUG: Record<string, string> = {
  "villa-thoi": "200",
  "villa-persi": "201",
  "villa-eeanthe": "202",
  "villa-melia": "203",
  "villa-pueblo": "pueblo",
};

export function generateStaticParams() {
  return COLLECTION_VILLA_IDS.map((key) => ({ slug: getVilla(key).slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = KEY_BY_SLUG[slug];
  if (!key) return {};
  const villa = getVilla(key);
  return {
    title: villa.name,
    description: villa.meta.description ?? undefined,
    alternates: { canonical: `/en/villas/${villa.slug}` },
    openGraph: {
      title: villa.meta.title ?? villa.name,
      description: villa.meta.description ?? undefined,
      url: `/en/villas/${villa.slug}`,
    },
  };
}

/** JSON-LD occupancy comes strictly from the locked capacity table. */
function villaJsonLd(villa: Villa) {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: villa.name,
    description: villa.shortDescription ?? undefined,
    numberOfBedrooms: villa.specs.bedrooms ?? undefined,
    numberOfBathroomsTotal: villa.specs.bathrooms ?? undefined,
    occupancy: villa.specs.maxGuests
      ? { "@type": "QuantitativeValue", maxValue: villa.specs.maxGuests, unitText: "guests in beds" }
      : undefined,
    floorSize: villa.specs.sizeSqm
      ? { "@type": "QuantitativeValue", value: villa.specs.sizeSqm, unitCode: "MTK" }
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Pigianos Kampos area",
      addressLocality: "Rethymno",
      postalCode: "74100",
      addressCountry: "GR",
    },
    geo:
      villa.map.lat && villa.map.lng
        ? { "@type": "GeoCoordinates", latitude: villa.map.lat, longitude: villa.map.lng }
        : undefined,
    containsPlace: villa.specs.pools
      ? { "@type": "Accommodation", amenityFeature: { "@type": "LocationFeatureSpecification", name: "Private swimming pool", value: true } }
      : undefined,
  };
}

export default async function VillaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = KEY_BY_SLUG[slug];
  if (!key) notFound();

  const villa = getVilla(key);
  const page = VILLA_PAGES[key]!;
  const facilities = getFacilitiesForVilla(villa);
  const inventory = buildInventory(facilities);
  const cta = villaCta(villa);
  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const bookingCfg = getBookingConfig() as unknown as { host?: string };
  const host = bookingCfg.host ?? "thalassesvillas.reserve-online.net";

  const runImages =
    villa.gallery.featured.length > 0
      ? villa.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }))
      : villa.gallery.allImages.map((u) => ({ url: u, caption: null }));

  const contact = site.contact ?? {};

  /**
   * THE SPEC LEDGER — content parity, not decoration.
   *
   * Until now a villa page printed exactly one of its own numbers ("Sleeping N
   * in beds") and buried the rest in JSON-LD, where a search engine could read
   * them and a guest could not. Bedrooms, bathrooms, floor area, the bed
   * breakdown, the view and the distance to the water are all owner-confirmed
   * facts sitting unrendered in the inventory. They are printed here, in the
   * approved ledger element, straight from `villa.specs` — never re-typed.
   *
   * Falsy values are dropped rather than shown as 0, per Conventions §7.
   */
  const figures = [
    { label: "Bedrooms", value: villa.specs.bedrooms },
    { label: "Bathrooms", value: villa.specs.bathrooms },
    { label: "Sleep in beds", value: villa.specs.maxGuests },
    { label: "Square metres", value: villa.specs.sizeSqm },
  ].filter((f): f is { label: string; value: number } => Boolean(f.value));

  const detail = [
    { label: "Bedrooms", value: villa.specs.bedroomsDetail },
    { label: "Bathrooms", value: villa.specs.bathroomsDetail },
    { label: "View", value: villa.specs.view },
    { label: "The beach", value: villa.specs.distanceToBeach },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaJsonLd(villa)) }}
      />

      <main id="main">
        <Field
          src={villa.gallery.heroImage ?? ""}
          alt={`${villa.name}, Thalasses Villas`}
          horizonY={0.45}
          height="88svh"
          priority
        >
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro" style={{ marginBottom: "var(--spacing-step-4)" }}>
              01 — {villa.name}
            </p>
            <Clause gerund={page.gerund} tail={page.tail} scale="c1" animate as="h1" />
          </div>
        </Field>

        {/*
          02 — THE HOUSE. The one deep passage on a villa page.

          Before this the template ran limestone → limestone → ammos → limestone,
          which is the only composition on the site with no ground change at all.
          The estate page opens on pelagos immediately after its hero; a villa
          now does the same, so the two read as siblings under one hand rather
          than as two templates that happen to share tokens. It also brings the
          atmosphere layer with it — sea-light and the ghost numeral only exist
          on a deep ground.
        */}
        <section className="villa-statement on-dark">
          <span className="ghost ghost--right" aria-hidden="true">
            02
          </span>
          <div className="canon">
            <p className="micro">02 — The house</p>
            <div className="grid-canon villa-statement-grid">
              <Reveal className="field-clause">
                {/* The fourth voice, spent once per page. Still `.lede`, so the
                    numeric-token guard keeps watching this line. */}
                <p className="lede aside-italic villa-angle">{page.angle}</p>
              </Reveal>
              <Reveal className="field-prose" index={1}>
                {villa.shortDescription ? (
                  <p className="prose-measure villa-prose">{villa.shortDescription}</p>
                ) : null}

                <Ledger entries={figures} className="villa-ledger" />

                {detail.length ? (
                  <dl className="villa-detail">
                    {detail.map((d) => (
                      <div key={d.label} className="villa-detail-row">
                        <dt className="micro">{d.label}</dt>
                        <dd className="small">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {/* Bed truths as clauses, not a table. */}
                <div className="villa-facts clause-field">
                  {villa.amenityFacts?.some((f) => /twin/i.test(f)) ? (
                    <Clause
                      gerund="Converting"
                      tail="Twins to a double on request"
                      scale="c4"
                      as="p"
                    />
                  ) : null}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 03 — THE ROOMS. A marker, not a heading: the photography is the
            protagonist here and a display line above it would only delay it.
            The label rides the datum rule, in the plate-index manner. */}
        <div className="canon villa-marker">
          <p className="micro">03 — The rooms</p>
          <div className="datum-rule" />
        </div>
        <TheRun images={runImages} villaName={villa.name} />

        {/* 04 — Inside. No ghost numeral: the group rail is `position: sticky`
            and the ghost needs `overflow: hidden` to stay inside the page. */}
        <Inventory data={inventory} villaName={villa.name} beat="04" />

        <section className="canon villa-cta">
          <span className="ghost ghost--left" aria-hidden="true">
            05
          </span>
          <Reveal>
            <p className="micro">05 — {villa.name}</p>
            <p style={{ marginTop: "var(--spacing-step-5)" }}>
              <Magnetic>
                <a
                  href={cta.href}
                  className="micro estate-cta villa-cta-primary"
                  target={cta.kind === "availability" ? "_blank" : undefined}
                  rel={cta.kind === "availability" ? "noopener noreferrer" : undefined}
                  data-cursor="Book"
                >
                  {cta.label}
                </a>
              </Magnetic>
              {cta.secondary ? (
                <Link
                  href={cta.secondary.href}
                  className="micro villa-cta-secondary"
                  style={{ marginLeft: "var(--spacing-step-6)" }}
                >
                  {cta.secondary.label}
                </Link>
              ) : null}
            </p>
          </Reveal>
        </section>
      </main>

      <BookingLedger host={host} villaName={villa.name} />

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
    </>
  );
}
