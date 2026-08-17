import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { TheRun } from "@/components/sections/TheRun";
import { Clause } from "@/components/ui/Clause";
import { EstateMap } from "@/components/sections/EstateMap";
import { Field } from "@/components/ui/Field";
import { Ledger } from "@/components/ui/Ledger";
import { byN } from "@/lib/selects";
import { HOTSPOTS } from "@/app/home-data";
import { estateCta } from "@/lib/booking";
import { getEstate, getEstateVillas, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Entire Estate",
  description:
    "Four villas taken together as one house — 9 bedrooms, 6 bathrooms, sleeping 18 in beds, with four private pools and a private beach fifty metres from the door.",
  alternates: { canonical: "/en/the-estate" },
};

/** Owner-confirmed facts. Nothing on this page is estimated. */
const FACTS = {
  bedrooms: 9,
  bathrooms: 6,
  sleeps: 18,
  pools: 4,
  sizeSqm: 240,
  diningSeats: 18,
  distanceToBeach: "about 50 m",
};

const SERVICES = [
  "Cleaning every three days",
  "A reception desk, daily",
  "A Holiday Advisor and concierge",
];

const OUTDOOR = [
  "A private pool for each villa, heatable on advance request",
  "A hot tub, a barbecue station and a sitting area per villa",
  "A pool alarm system, for child safety",
  "Private sunbeds at the water's edge",
  "A playground, and a vegetable garden with the gardener's help",
];

function estateJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Thalasses Villas — The Entire Estate",
    description:
      "Four seafront villas taken together as one house, with a private beach in Pigianos Kampos, Rethymno, Crete.",
    numberOfRooms: FACTS.bedrooms,
    petsAllowed: undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Pigianos Kampos area",
      addressLocality: "Rethymno",
      postalCode: "74100",
      addressCountry: "GR",
    },
    geo: { "@type": "GeoCoordinates", latitude: 35.380146561951, longitude: 24.57279329824 },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Private beach", value: true },
      { "@type": "LocationFeatureSpecification", name: "Private swimming pools", value: FACTS.pools },
    ],
  };
}

export default function EstatePage() {
  const estate = getEstate();
  const villas = getEstateVillas();
  const cta = estateCta();
  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const contact = site.contact ?? {};

  const figures = [
    { value: FACTS.bedrooms, label: "Bedrooms" },
    { value: FACTS.bathrooms, label: "Bathrooms" },
    { value: FACTS.sleeps, label: "Sleep in beds" },
    { value: FACTS.pools, label: "Private pools" },
    { value: FACTS.sizeSqm, label: "Square metres" },
    { value: FACTS.diningSeats, label: "At one table" },
  ];

  const runImages = estate.gallery.featured.length
    ? estate.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }))
    : estate.gallery.allImages.map((u) => ({ url: u, caption: null }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(estateJsonLd()) }}
      />

      <main id="main">
        <Field
          src={estate.gallery.heroImage ?? ""}
          alt="The four villas of Thalasses Villas seen together from the sea"
          horizonY={0.42}
          height="92svh"
          priority
        >
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro" style={{ marginBottom: "var(--spacing-step-4)" }}>
              01 — The Entire Estate
            </p>
            <Clause gerund="Gathering" tail="All four, one gate" scale="c1" animate as="h1" />
          </div>
        </Field>

        <section className="estate on-dark">
          <span className="ghost ghost--right" aria-hidden="true">
            02
          </span>
          <div className="canon">
            <p className="micro">02 — Taken together</p>
            <Reveal>
              <p className="lede estate-lede">
                Four villas taken together as one house, {FACTS.distanceToBeach} from the water,
                with a private beach of golden sand, four private pools and a table that seats{" "}
                {FACTS.diningSeats} under the evening sun.
              </p>
            </Reveal>

            {/* The inherited ledger component, not a bespoke block. */}
            <Reveal index={1}>
              <Ledger entries={figures.map((f) => ({ label: f.label, value: f.value }))} />
              <dl className="estate-figures" hidden>
                {figures.map((f) => (
                  <div key={f.label} className="estate-figure">
                    <dt className="micro">{f.label}</dt>
                    <dd className="display c3 tabular estate-figure-value">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* Concierge, by design. Never framed as a booking that is missing. */}
            <Reveal index={2}>
              <p className="estate-cta-row">
                <Link href={cta.href} className="micro estate-cta">
                  {cta.label}
                </Link>
              </p>
              <p className="small estate-concierge">
                A full buyout is arranged in conversation, not in a booking form — so that arrival
                times, the chef, the table and the beach are all settled before you land.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="canon estate-detail">
          <p className="micro">03 — The four villas</p>
          <div className="grid-canon">
            <Reveal className="field-clause clause-field">
              <Clause gerund="Sharing" tail="One gate, one beach" scale="c2" as="h2" />
            </Reveal>
            <Reveal className="field-prose" index={1}>
              <p className="micro">The four villas</p>
              <ul className="small estate-villa-list">
                {villas.map((v) => (
                  <li key={v.id}>
                    <Link href={`/en/villas/${v.slug}`} className="estate-villa-link">
                      {v.name}
                    </Link>
                    <span className="tabular estate-villa-spec">
                      {v.specs.bedrooms} bd · {v.specs.bathrooms} ba · sleeps {v.specs.maxGuests}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="micro" style={{ marginTop: "var(--spacing-step-7)" }}>
                Outdoors
              </p>
              <ul className="small estate-list">
                {OUTDOOR.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>

              <p className="micro" style={{ marginTop: "var(--spacing-step-7)" }}>
                Included, at no charge
              </p>
              <ul className="small estate-list">
                {SERVICES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/*
          The estate map at full depth. The homepage carries an abbreviated
          version; this page is where it belongs, because the whole proposition
          here IS the geography — which house sits where, and how far the water
          is from each door.
        */}
        <EstateMap
          image={byN(42).path}
          alt={byN(42).alt}
          hotspots={HOTSPOTS}
          ledger={figures.map((f) => ({ label: f.label, value: f.value }))}
          ctaLabel={cta.label}
          ctaHref={cta.href}
          beat="04"
        />

        <div className="canon villa-marker">
          <p className="micro">05 — The rooms</p>
          <div className="datum-rule" />
        </div>
        <TheRun images={runImages} villaName="The Entire Estate" />
      </main>

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
