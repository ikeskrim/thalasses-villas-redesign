import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LookPage from "../LookPage";
import { LOOK_IDS, getLook } from "../looks-data";

export function generateStaticParams() {
  return LOOK_IDS.map((look) => ({ look }));
}

/* An unknown look is a 404, not a blank page rendering the first one. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ look: string }>;
}): Promise<Metadata> {
  const { look } = await params;
  const l = getLook(look);
  return {
    title: l ? `${l.name} — a look for Thalasses` : "Look",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ look: string }> }) {
  const { look } = await params;
  const l = getLook(look);
  if (!l) notFound();
  return <LookPage look={l} />;
}
