import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageReveal, Reveal } from "@/components/motion/Reveal";
import { Draft, PageHead, PageShell } from "@/components/sections/PageShell";
import { getAllExperiences, getExperience, localImage } from "@/lib/content";

/**
 * SOFT-404 FIX. Without this, an unknown slug rendered the not-found boundary
 * with a **200 status** — measured, not assumed. A soft 404 tells a crawler the
 * page exists, which after a domain move is precisely how dead URLs stay in the
 * index and the migration leaks authority.
 *
 * The slug set is fully enumerable from the inventory, so anything outside it
 * is a genuine 404 and should be refused at the routing layer rather than
 * rendered and then apologised for.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllExperiences().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getExperience(slug);
  if (!e) return {};
  return {
    title: e.name,
    description: e.meta?.description ?? e.shortDescription ?? undefined,
    alternates: { canonical: `/en/experiences/${e.slug}` },
  };
}

/**
 * AN EXPERIENCE — the two-tier policy, rendered.
 *
 * Fourteen of the twenty-one have almost no copy on the legacy site (`bike-tours`
 * is a single word). D3 settled how that is handled: the page is built from what
 * exists rather than padded to look full, and anything drafted to fill a gap is
 * marked as draft where it is read.
 *
 * No experience invents a price, a duration or an inclusion. Where the registry
 * has none, the page simply does not claim one.
 */
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getExperience(slug);
  if (!e) notFound();

  const hero = localImage(e.heroImage);
  const others = getAllExperiences()
    .filter((x) => x.slug !== e.slug && x.categoryProposed === e.categoryProposed)
    .slice(0, 3);

  const body = (e.longDescription ?? e.shortDescription ?? "").trim();
  const thin = !body || body.split(/\s+/).length < 25;

  return (
    <PageShell>
      {hero ? (
        <section className="d-exp-hero">
          <ImageReveal className="d-exp-frame">
            <Image
              src={hero}
              alt={`${e.name}, Thalasses Villas`}
              fill
              sizes="100vw"
              quality={82}
              priority
              style={{ objectFit: "cover" }}
            />
          </ImageReveal>
        </section>
      ) : null}

      <PageHead beat={e.categoryProposed ?? "Experience"} title={e.name} />

      <section className="canon d-exp-body">
        <Reveal>
          {body ? <p className="prose-measure d-exp-text">{body}</p> : null}
          {thin ? <Draft what={`copy for ${e.name}`} /> : null}
        </Reveal>

        {e.highlights?.length ? (
          <Reveal index={1}>
            <p className="micro d-exp-mark">What it involves</p>
            <ul className="small d-estate-list">
              {e.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        <Reveal index={2}>
          <p className="d-villa-cta">
            <Link
              href={`/en/contact?enquiry=${encodeURIComponent(e.name)}`}
              className="btn-primary micro"
              data-cursor="Enquire"
            >
              Ask us to arrange it
            </Link>
          </p>
        </Reveal>
      </section>

      {others.length ? (
        <section className="canon d-others">
          <Reveal>
            <p className="micro">More {e.categoryProposed?.toLowerCase()}</p>
          </Reveal>
          <ul className="d-others-grid">
            {others.map((o) => {
              const src = localImage(o.heroImage);
              return (
                <li key={o.slug}>
                  <Link href={`/en/experiences/${o.slug}`} className="d-other">
                    {src ? (
                      <ImageReveal className="d-other-frame">
                        <Image
                          src={src}
                          alt={o.name}
                          fill
                          sizes="(max-width: 767px) 100vw, 25vw"
                          quality={80}
                          loading="lazy"
                          style={{ objectFit: "cover" }}
                        />
                      </ImageReveal>
                    ) : (
                      <span className="d-other-frame d-other-frame--typographic" aria-hidden="true" />
                    )}
                    <span className="display c4 d-other-name">{o.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
