import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { KenBurns } from "@/components/motion/KenBurns";
import { Magnetic } from "@/components/motion/Magnetic";
import { Preloader } from "@/components/motion/Preloader";
import { ActsSection } from "@/components/sections/ActsSection";
import { CoastLine } from "@/components/sections/CoastLine";
import { Collection, type CollectionCell } from "@/components/sections/Collection";
import { DragRegister } from "@/components/sections/DragRegister";
import { EstateMap } from "@/components/sections/EstateMap";
import { estateCta } from "@/lib/booking";
import { Litany } from "@/components/sections/Litany";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { Odometer } from "@/components/ui/Odometer";
import {
  getAllExperiences,
  getBookingConfig,
  getLocation,
  getSite,
  getEstate,
  getVilla,
  localImage,
} from "@/lib/content";
import { toRegisterRows } from "@/lib/register";
import { byN } from "@/lib/selects";
import { ACTS, HOTSPOTS, LITANY } from "./home-data";

export const metadata: Metadata = {
  title: "Thalasses Villas — Living Unlimited",
  description:
    "An intimate seafront collection of five private villas in Pigianos Kampos, Rethymno, Crete, with an exclusive private beach fifty metres from the door.",
};

export default function Home() {
  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const location = getLocation() as unknown as {
    distances?: { name: string; value: string; note?: string }[];
    nearby?: { name: string; distance: string | null }[];
  };
  const booking = getBookingConfig() as unknown as { host?: string };
  const host = booking.host ?? "thalassesvillas.reserve-online.net";
  const contact = site.contact ?? {};

  const estate = getEstate();
  const cta = estateCta();
  const hero = byN(27);
  const mapFrame = byN(42);
  const weddingFrame = byN(9);
  const helipadFrame = byN(41);

  const front: CollectionCell[] = [
    { villa: getVilla("200"), ordinal: "I", gerund: "Waking", tail: "At sea level, ground floor" },
    { villa: getVilla("201"), ordinal: "II", gerund: "Bathing", tail: "In the largest bathroom" },
  ];
  const rear: CollectionCell[] = [
    { villa: getVilla("202"), ordinal: "III", gerund: "Waking", tail: "On the upper floor, three rooms" },
    { villa: getVilla("203"), ordinal: "IV", gerund: "Stepping", tail: "From bed into the pool" },
  ];
  const fifth: CollectionCell = {
    villa: getVilla("pueblo"),
    ordinal: "V",
    gerund: "Retreating",
    tail: "Adults only, direct beach access",
  };

  const experiences = getAllExperiences();
  const rows = toRegisterRows(experiences).map((r) => {
    const e = experiences.find((x) => x.slug === r.slug);
    return {
      ...r,
      image: localImage(e?.heroImage ?? null),
      category: e?.categoryProposed,
    };
  });

  return (
    <>
      {/* SmoothScroll and CustomCursor now live in the layout — site-wide. */}
      <Preloader />

      <main id="main">
        {/* 01 — Hero. Ken Burns until the owner's MP4 lands; the video slot is
            a content swap, not a code change. */}
        <section className="hero">
          <KenBurns src={hero.path} alt={hero.alt} width={hero.w} height={hero.h} objectPosition="50% 54%" />
          <div className="hero-scrim" aria-hidden="true" />
          <div className="hero-copy canon">
            <div className="clause-field">
              <Clause gerund="Living" tail="Unlimited" scale="c1" animate as="h1" />
            </div>
            <p className="hero-desire">Five private villas on a beach that belongs to no one else.</p>
            <p className="hero-proof">
              <Image
                src="/images/_site/thalasses__thalasses-cn-traveller-1.png"
                alt="Featured by Condé Nast Traveller"
                width={168}
                height={41}
                className="hero-proof-mark"
              />
              <span className="micro hero-proof-text">Condé Nast Traveller</span>
            </p>
          </div>
        </section>

        {/* 02 — The litany */}
        <Litany lines={LITANY} payoffGerund="Living" payoffTail="Whatever that means to you" />

        {/* 03 — The three acts, pinned */}
        <ActsSection acts={ACTS} />

        {/* 04 — THE SIGNAL. Restored to a standalone beat at full scale by
            owner ruling: a card grid is where facts live, a beat is where icons
            live, and "the only seafront villas with a helipad" is an icon.
            Spent once, at maximum size. Its Act I slot went to secure parking. */}
        <Field src={helipadFrame.path} alt={helipadFrame.alt} height="90svh" className="letterbox">
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro">04 — Arrival</p>
            <Clause gerund="Landing" tail="The only seafront villas with helipad" scale="c1" as="h2" />
            <span className="ghost ghost--right" aria-hidden="true">04</span>
          </div>
        </Field>

        {/* 05 — The Collection, with the datum geometry intact */}
        <div id="collection">
          <Collection front={front} rear={rear} fifth={fifth} />
        </div>

        {/* 06 — The estate map */}
        <EstateMap
          image={mapFrame.path}
          alt={mapFrame.alt}
          hotspots={HOTSPOTS}
          ledger={[
            { label: "Bedrooms", value: estate.specs.bedrooms ?? 9 },
            { label: "Bathrooms", value: estate.specs.bathrooms ?? 6 },
            { label: "Sleeps", value: estate.specs.maxGuests ?? 18 },
            { label: "Private pools", value: estate.specs.pools ?? 4 },
            { label: "Square metres", value: estate.specs.sizeSqm ?? 240 },
          ]}
          ctaLabel={cta.label}
          ctaHref={cta.href}
        />

        {/* 07 — The Register, with filter chips */}
        <section className="beat beat--wide" style={{ position: "relative", overflow: "hidden" }}>
          <span className="ghost ghost--right" aria-hidden="true">07</span>
          <p className="micro">07 — Experiences</p>
          <div className="clause-field">
            <Clause gerund="Asking" tail="For any of the following" scale="c2" as="h2" />
          </div>
          <DragRegister rows={rows} />
        </section>

        {/* 08 — Location */}
        <CoastLine
          entries={location.distances ?? []}
          beaches={(location.nearby ?? []).map((n) => ({ name: n.name, distance: n.distance }))}
        />

        {/* 09 — Weddings */}
        <Field src={weddingFrame.path} alt={weddingFrame.alt} height="92svh">
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro">09 — Weddings &amp; Events</p>
            <Clause gerund="Marrying" tail="On sand, beside the water" scale="c2" as="h2" />
            <p className="beat-cta">
              <Magnetic>
                <Link href="/en/weddings" className="btn-primary btn-primary--light micro" data-cursor="View">
                  Plan the day
                </Link>
              </Magnetic>
            </p>
          </div>
        </Field>

        <Odometer />
      </main>

      <BookingLedger host={host} />

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
