import type { Metadata } from "next";
import Link from "next/link";

import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { EstateMap } from "@/components/sections/EstateMap";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { TheRun } from "@/components/sections/TheRun";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { Ledger } from "@/components/ui/Ledger";
import { HOTSPOTS } from "@/app/home-data";
import { estateCta } from "@/lib/booking";
import { getEstate, getEstateVillas, getSite } from "@/lib/content";
import { byN } from "@/lib/selects";
import { practicalNotes, squareFeet, stayIncludes, villaServices } from "@/lib/villa-page";
import { alternatesFor } from "@/lib/locale";
import { CHH_MARK, partnerPolicies, recoveredFromPartner } from "@/lib/chh";
import { Draft } from "@/components/sections/PageShell";

export const metadata: Metadata = {
  title: "The Entire Estate",
  description:
    "Four villas taken together as one house — 9 bedrooms, 6 bathrooms, sleeping 18 in beds, with four private pools and a private beach fifty metres from the door.",
  alternates: alternatesFor("/en/the-estate"),
};

/** Owner-confirmed. Nothing on this page is estimated. */
const FACTS = {
  bedrooms: 9,
  bathrooms: 6,
  sleeps: 18,
  pools: 4,
  sizeSqm: 240,
  diningSeats: 18,
  distanceToBeach: "about 50 m",
};

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

/**
 * THE ESTATE PAGE — Direction D.
 *
 * The villa template's logic at estate scale, and the one page where the
 * proposition IS the arithmetic: four houses that add up to something none of
 * them is alone. So the numbers take the beat, on this page's single dark
 * interlude, and the map gets full depth beneath them.
 *
 * Enquiry-only throughout, by design and not by omission. A full buyout is
 * arranged in conversation; there is no dates-only deep link for it, and the
 * page never implies one is missing.
 */
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
    { label: "Bedrooms", value: FACTS.bedrooms },
    { label: "Bathrooms", value: FACTS.bathrooms },
    { label: "Sleep in beds", value: FACTS.sleeps },
    { label: "Private pools", value: FACTS.pools },
    { label: "Square metres", value: FACTS.sizeSqm },
    { label: "At one table", value: FACTS.diningSeats },
  ];

  /* Recovered partner material, resolved once — see src/lib/chh.ts. */
  const recovered = recoveredFromPartner();
  const policies = partnerPolicies();
  /*
   * Each house's own contents, keyed by name. `includedVillas` names five
   * houses; `getEstateVillas()` returns the four in the collection, so a lookup
   * rather than a zip — an index-based pairing would silently describe Melia
   * with Eeanthe's bathroom the day the two lists diverge in order, and they
   * already differ in both order and length.
   */
  const included = Object.fromEntries(
    (estate.includedVillas ?? []).map((v) => [v.name, v.description])
  ) as Record<string, string | null>;

  /* The estate's OWN registry facts, which are a different thing entirely. */
  const notes = practicalNotes(estate);
  const services = villaServices(estate);

  /* Same derived spine as the villa template, and for the same reason: two of
     these beats are conditional and a typed number is a claim about all the
     others. (T-285, CONVENTIONS §14.) */
  const hasPractical = notes.length > 0 || services.length > 0;
  const spine = [
    "hero",
    "asone",
    "houses",
    "map",
    "outdoors",
    ...(hasPractical ? ["practical"] : []),
    ...(recovered.length > 0 ? ["partner"] : []),
    "rooms",
    "enquire",
  ];
  const beat = (name: string) => String(spine.indexOf(name) + 1).padStart(2, "0");

  const runImages = estate.gallery.featured.length
    ? estate.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }))
    : estate.gallery.allImages.map((u) => ({ url: u, caption: null }));

  return (
    <div className="d">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(estateJsonLd()) }}
      />

      <main id="main">
        {/* ----------------------------------------------------- 01 HERO --- */}
        <Field
          src={estate.gallery.heroImage ?? ""}
          alt="The four villas of Thalasses Villas seen together from the sea"
          horizonY={0.42}
          height="92svh"
          className="d-villa-hero"
        >
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro d-eyebrow">{beat("hero")} — The Entire Estate</p>
            <Clause gerund="Gathering" tail="All four, one gate" scale="c1" animate as="h1" />
          </div>
        </Field>

        {/* ------------------------------ 02 THE NUMBERS — dark interlude --- */}
        {/* This page's one deep passage, spent where the argument is. */}
        <section className="d-numbers on-dark">
          <span className="ghost ghost--right" aria-hidden="true">
            02
          </span>
          <div className="canon">
            <Reveal>
              <p className="micro">{beat("asone")} — Taken as one house</p>
              <p className="d-numbers-lede">
                Four villas behind a single gate, {FACTS.distanceToBeach} from the water, with a
                table that seats {FACTS.diningSeats} under the evening sun.
              </p>
            </Reveal>
            <Ledger entries={figures} className="d-ledger d-ledger--six" />
            <Reveal index={1}>
              <p className="d-numbers-sub small">
                {FACTS.sizeSqm} m² · {squareFeet(FACTS.sizeSqm)} sq ft across the four houses.
              </p>
              <p className="d-numbers-cta">
                <Magnetic>
                  <Link
                    href={cta.href}
                    className="btn-primary btn-primary--light micro"
                    data-cursor="Enquire"
                  >
                    {cta.label}
                  </Link>
                </Magnetic>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------- 03 THE FOUR HOUSES -- */}
        <section className="canon d-estate-detail">
          <Reveal>
            <p className="micro">{beat("houses")} — The four houses</p>
            <p className="d-villa-lede">
              Each has its own pool, its own terrace and its own front door. Together they are one
              address, and one arrival.
            </p>
          </Reveal>
          <Reveal index={1}>
            <ul className="d-estate-villas">
              {villas.map((v) => (
                <li key={v.id}>
                  <Link href={`/en/villas/${v.slug}`} className="d-estate-villa">
                    <span className="display c4 d-estate-villa-name">{v.name}</span>
                    <span className="caption tabular d-estate-villa-spec">
                      {v.specs.bedrooms} bd · {v.specs.bathrooms} ba · sleeps {v.specs.maxGuests}
                    </span>
                    {/*
                      What is actually IN each house — the registry has carried
                      this for every villa since Phase 0 and the estate page
                      showed only the three figures. Someone taking the whole
                      place wants to know which house has the Jacuzzi and which
                      has the shower cabin, and the answer was already written
                      down. (T-285.)
                    */}
                    {included[v.name] ? (
                      <span className="small d-estate-villa-detail">{included[v.name]}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ------------------------------------------------- 04 THE MAP ---- */}
        <EstateMap
          image={byN(42).path}
          alt={byN(42).alt}
          hotspots={HOTSPOTS}
          ledger={figures.slice(0, 5)}
          ctaLabel={cta.label}
          ctaHref={cta.href}
          beat={beat("map")}
        />

        {/* -------------------------------------------------- 05 OUTDOORS -- */}
        <section className="canon d-estate-lists">
          <Reveal>
            <p className="micro">{beat("outdoors")} — Outdoors</p>
            <ul className="small d-estate-list">
              {OUTDOOR.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="canon d-includes">
          <Reveal>
            <p className="micro">Your stay includes</p>
            <ul className="d-includes-list">
              {stayIncludes().map((i) => (
                <li key={i.label} className="d-includes-item">
                  <span className="display c4 d-includes-label">{i.label}</span>
                  <span className="small d-includes-note">{i.note}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* -------------------------------------------- 06 GOOD TO KNOW -- */}
        {/* The estate's own registry facts — not the partner's. See T-285. */}
        {hasPractical ? (
          <section className="canon d-practical">
            <Reveal>
              <p className="micro">{beat("practical")} — Good to know</p>
              {notes.length ? (
                <ul className="small d-practical-list">
                  {notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </Reveal>
            {services.length ? (
              <Reveal index={1} className="d-services">
                <p className="micro">Arranged on request</p>
                <ul className="small d-services-list">
                  {services.map((sv) => (
                    <li key={sv}>{sv}</li>
                  ))}
                </ul>
                <p className="caption d-services-note">
                  Arranged by the house and charged separately — distinct from what your stay
                  includes.
                </p>
              </Reveal>
            ) : null}
          </section>
        ) : null}

        {/* --------------------------------- 07 RECOVERED FROM THE PARTNER -- */}
        {/*
          Content the site has never carried, recovered from the Phase 0 capture
          of the manager's own page about this property (T-282).

          It is MARKED, and deliberately so. The same page states every figure in
          the owner's locked capacity table and states them exactly — which is
          why it is worth reading, and not why it is authoritative about a pool
          alarm. A third party agreeing about bedroom counts earns a hearing, not
          a byline.

          Shown rather than hidden because that is this project's convention for
          recovered-but-unconfirmed material, and because the owner cannot
          confirm what he cannot see. Each line stops rendering if its source
          phrase leaves the capture — see `src/lib/chh.ts`.
        */}
        {recovered.length > 0 ? (
          <section className="canon d-estate-lists">
            <Reveal>
              <p className="micro">{beat("partner")} — Also on the property</p>
              <ul className="d-recovered-list">
                {recovered.map((r) => (
                  <li key={r.key}>
                    <span className="display c4 d-recovered-label">{r.label}</span>
                    <span className="small d-recovered-note">{r.note}</span>
                  </li>
                ))}
              </ul>
              {policies.length > 0 ? (
                <ul className="small d-estate-list" style={{ marginTop: "var(--section-y-tight)" }}>
                  {policies.map((p) => (
                    <li key={p.label}>
                      {p.label}: {p.value}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Draft what={CHH_MARK} />
            </Reveal>
          </section>
        ) : null}

        {/* -------------------------------------------------- 08 THE ROOMS - */}
        <div className="canon d-villa-mark">
          <p className="micro">{beat("rooms")} — The rooms</p>
          <div className="datum-rule" />
        </div>
        <TheRun images={runImages} villaName="The Entire Estate" />

        {/* --------------------------------------------------- 09 ENQUIRE -- */}
        <section className="canon d-estate-close">
          <Reveal>
            <p className="micro">{beat("enquire")} — The whole estate</p>
            <div className="clause-field d-statement-clause">
              <Clause gerund="Taking" tail="The whole place, one party" scale="c2" as="h2" />
            </div>
            <p className="d-villa-lede">
              A full buyout is arranged in conversation, not in a booking form — so that arrival
              times, the chef, the table and the beach are settled before you land.
            </p>
            <p className="d-villa-cta">
              <Magnetic>
                <Link href={cta.href} className="btn-primary micro" data-cursor="Enquire">
                  {cta.label}
                </Link>
              </Magnetic>
            </p>
          </Reveal>
        </section>
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
    </div>
  );
}
