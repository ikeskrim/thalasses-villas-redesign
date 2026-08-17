import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Magnetic } from "@/components/motion/Magnetic";
import { ImageReveal, Reveal } from "@/components/motion/Reveal";
import { Inventory } from "@/components/sections/Inventory";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { TheRun } from "@/components/sections/TheRun";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { villaCta } from "@/lib/booking";
import {
  COLLECTION_VILLA_IDS,
  getBookingConfig,
  getFacilitiesForVilla,
  getSite,
  getVilla,
  localImage,
} from "@/lib/content";
import { buildInventory } from "@/lib/inventory";
import { STAY_INCLUDES, VILLA_PAGE_COPY, detailRows, specStrip } from "@/lib/villa-page";
import type { Villa } from "@/types/content";

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
      ? {
          "@type": "Accommodation",
          amenityFeature: {
            "@type": "LocationFeatureSpecification",
            name: "Private swimming pool",
            value: true,
          },
        }
      : undefined,
  };
}

/**
 * THE VILLA TEMPLATE — Direction D.
 *
 * Order is the Aman / One&Only consensus, tokens and composition are D's:
 *   hero → spec strip → lede + book → gallery → amenities vs inclusions →
 *   story beats → cross-sell → booking bar.
 *
 * D's rules apply verbatim and are asserted in `tests/direction-d.spec.ts`:
 * display capped at 96px, `--section-y` between beats, names beside or below
 * their frames, and no horizontal overflow at any width.
 */
export default async function VillaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = KEY_BY_SLUG[slug];
  if (!key) notFound();

  const villa = getVilla(key);
  const copy = VILLA_PAGE_COPY[key]!;
  const facilities = getFacilitiesForVilla(villa);
  const inventory = buildInventory(facilities);
  const cta = villaCta(villa);
  const specs = specStrip(villa);
  const details = detailRows(villa);

  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const bookingCfg = getBookingConfig() as unknown as { host?: string };
  const host = bookingCfg.host ?? "thalassesvillas.reserve-online.net";
  const contact = site.contact ?? {};

  const runImages =
    villa.gallery.featured.length > 0
      ? villa.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }))
      : villa.gallery.allImages.map((u) => ({ url: u, caption: null }));

  const others = COLLECTION_VILLA_IDS.filter((k) => k !== key).map((k) => {
    const v = getVilla(k);
    return { villa: v, src: localImage(v.gallery.heroImage), copy: VILLA_PAGE_COPY[k]! };
  });

  return (
    <div className="d">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaJsonLd(villa)) }}
      />

      <main id="main">
        {/* ------------------------------------------------------ 01 HERO -- */}
        <Field
          src={villa.gallery.heroImage ?? ""}
          alt={`${villa.name}, Thalasses Villas`}
          horizonY={0.45}
          height="92svh"
          className="d-villa-hero"
        >
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro d-eyebrow">01 — {villa.name}</p>
            <Clause gerund={copy.gerund} tail={copy.tail} scale="c1" animate as="h1" />
          </div>
        </Field>

        {/* ------------------------------------------- 02 THE SPEC STRIP -- */}
        {/* Only what the registry confirms. Villa Pueblo simply has fewer
            cells — no dashes, no placeholders. (T-212.) */}
        <section className="canon d-spec">
          <Reveal>
            <p className="micro">02 — The house</p>
            <ul className="d-spec-strip">
              {specs.map((s) => (
                <li
                  key={s.label}
                  className={`d-spec-cell${s.sub ? " d-spec-cell--area" : ""}`}
                >
                  <span className="micro d-spec-label">{s.label}</span>
                  <span className="tabular d-spec-value">{s.value}</span>
                  {s.sub ? <span className="caption tabular d-spec-sub">{s.sub}</span> : null}
                </li>
              ))}
            </ul>
          </Reveal>

          {details.length ? (
            <Reveal index={1}>
              <dl className="d-detail">
                {details.map((d) => (
                  <div key={d.label} className="d-detail-row">
                    <dt className="micro">{d.label}</dt>
                    <dd className="small">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}

          <Reveal index={2}>
            <p className="d-villa-lede">{copy.lede}</p>
            <p className="d-villa-cta">
              <Magnetic>
                <a
                  href={cta.href}
                  className="btn-primary micro"
                  target={cta.kind === "availability" ? "_blank" : undefined}
                  rel={cta.kind === "availability" ? "noopener noreferrer" : undefined}
                  data-cursor="Book"
                >
                  {cta.label}
                </a>
              </Magnetic>
              {cta.secondary ? (
                <Link href={cta.secondary.href} className="micro d-link d-villa-cta-secondary">
                  {cta.secondary.label}
                </Link>
              ) : null}
            </p>
          </Reveal>
        </section>

        {/* ---------------------------------------------- 03 THE GALLERY -- */}
        <div className="canon d-villa-mark">
          <p className="micro">03 — The rooms</p>
          <div className="datum-rule" />
        </div>
        <TheRun images={runImages} villaName={villa.name} />

        {/* ------------------------------- 04 AMENITIES vs WHAT'S INCLUDED */}
        {/* The Aman split. Hard features on the left, what you are given on
            the right — the second list reads as generosity only because
            everything in it is verified. */}
        <Inventory data={inventory} villaName={villa.name} beat="04" />

        <section className="canon d-includes">
          <Reveal>
            <p className="micro">Your stay includes</p>
            <ul className="d-includes-list">
              {STAY_INCLUDES.map((i) => (
                <li key={i.label} className="d-includes-item">
                  <span className="display c4 d-includes-label">{i.label}</span>
                  <span className="small d-includes-note">{i.note}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ------------------------------------------ 05 THE STORY BEATS -- */}
        <section className="canon d-beats">
          <Reveal>
            <p className="micro">05 — {villa.name}, in detail</p>
          </Reveal>
          {copy.beats.map((b, i) => (
            <Reveal key={b.title} index={i} className="d-beat">
              <p className="micro d-beat-eyebrow">{b.eyebrow}</p>
              <h2 className="display c3 d-beat-title">{b.title}</h2>
              <p className="d-beat-body">{b.body}</p>
            </Reveal>
          ))}
        </section>

        {/* --------------------------------------------- 06 CROSS-SELL ---- */}
        <section className="canon d-others">
          <Reveal>
            <p className="micro">06 — The other houses</p>
          </Reveal>
          <ul className="d-others-grid">
            {others.map((o) => (
              <li key={o.villa.id}>
                <Link href={`/en/villas/${o.villa.slug}`} className="d-other">
                  {o.src ? (
                    <ImageReveal className="d-other-frame">
                      <Image
                        src={o.src}
                        alt={`${o.villa.name}, Thalasses Villas`}
                        fill
                        sizes="(max-width: 767px) 100vw, 25vw"
                        quality={80}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      />
                    </ImageReveal>
                  ) : (
                    <span className="d-other-frame" aria-hidden="true" />
                  )}
                  <span className="display c4 d-other-name">{o.villa.name}</span>
                  <span className="caption d-other-spec tabular">
                    {o.villa.specs.bedrooms} bd · sleeps {o.villa.specs.maxGuests}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
    </div>
  );
}
