/**
 * THE SELECTS — the only photographs the homepage may use.
 *
 * Generated from content/photo-selects.json after the owner's curation rulings.
 * 871 images scored, 320 duplicates collapsed to 551 unique, 72 graded across two
 * independent passes, 18 earned an A. Ten frames were ruled off the site entirely
 * (stock, branded product, public places, a different property) and can never
 * appear here — see content/excluded-images.json.
 *
 * The set skews to dusk and golden hour, and that is now the launch site's stated
 * photographic identity: Thalasses in the golden hour. One grade, total cohesion.
 *
 * DO NOT hand-edit. Regenerate from photo-selects.json.
 */

export interface Select {
  n: number;
  path: string;
  alt: string;
  w: number;
  h: number;
  /** Approximate horizon as a fraction of height, for the shared datum. */
  horizonY?: number;
}

export const SELECTS: Select[] = [
  { n: 1, path: "/images/_chh/AMZ_7855.jpg", alt: "Beach umbrellas and loungers, golden hour, sea behind, Thalasses Villas", w: 1920, h: 1280, horizonY: 0.44 },
  { n: 7, path: "/images/_chh/AMZ_7867.jpg", alt: "Thatched umbrellas, low sun, sea, Thalasses Villas", w: 1920, h: 1280, horizonY: 0.42 },
  { n: 9, path: "/images/_pool/13ba81cb69bed6a720e6f30f2f21f085.jpg", alt: "Beach cabanas dressed at sunset, Thalasses Villas", w: 2248, h: 1536, horizonY: 0.46 },
  { n: 10, path: "/images/_pool/65070ce083cb1d043359d54469a98399.jpg", alt: "Lit villa exterior at dusk with hot tub, Thalasses Villas", w: 1920, h: 1080 },
  { n: 13, path: "/images/_pool/f4ce809444820e6479bd30644b38dcee.jpg", alt: "Two beach cabanas at sunset on the rocks, Thalasses Villas", w: 1920, h: 1080, horizonY: 0.45 },
  { n: 17, path: "/images/_pool/71c90c592c9de399a307c6c526e2fe8c.jpg", alt: "Villa exterior at dusk, pool lit green-blue, Thalasses Villas", w: 1920, h: 1080 },
  { n: 18, path: "/images/_pool/698ae610f28e6c0bf630084f01cb36c8.jpg", alt: "Terrace loungers facing the sea, Thalasses Villas", w: 1920, h: 1080, horizonY: 0.4 },
  { n: 21, path: "/images/_pool/9aa4e786f2a577fcefebfbe93dec1683.jpg", alt: "Villa exterior, blue hour, hot tub foreground, Thalasses Villas", w: 3300, h: 2200 },
  { n: 26, path: "/images/_pool/4061547978a0f802bc4712fee10f236d.jpg", alt: "Wedding gathering by the water, backlit, Thalasses Villas", w: 2248, h: 1536 },
  { n: 27, path: "/images/_pool/69978ac4f31b7bb1515c57cd50a73618.jpg", alt: "Couple dining on the rocks at sunset with lanterns, Thalasses Villas", w: 2248, h: 1536, horizonY: 0.38 },
  { n: 29, path: "/images/_pool/56a298fddcf18fa81f36814c8a32e16e.jpg", alt: "Turquoise pool against white architecture, Thalasses Villas", w: 1920, h: 1080 },
  { n: 31, path: "/images/_chh/Rituals-e-3-1.webp", alt: "Wedding gathering under palms, low sun, Thalasses Villas", w: 1920, h: 1080, horizonY: 0.43 },
  { n: 41, path: "/images/_pool/518c17aa30c3ce20e305c39048387004.jpg", alt: "Uplit garden path and villas at blue hour, Thalasses Villas", w: 1920, h: 1080 },
  { n: 42, path: "/images/_pool/47dc65d08c571df8d2e09eb267c9ebe7.jpg", alt: "White cubic villa with lit pool at dusk, Thalasses Villas", w: 2304, h: 1536 },
  { n: 44, path: "/images/_pool/37e6a0c5a79025d09b901cf0a82e55d0.jpg", alt: "Sunset gathering under canopies on the rocks, Thalasses Villas", w: 1920, h: 1080, horizonY: 0.41 },
  { n: 52, path: "/images/_pool/8bed1111a738437b6149ddf6c10eb26b.jpg", alt: "Turquoise plunge pool, white villa, timber deck, Thalasses Villas", w: 3300, h: 2200 },
  { n: 57, path: "/images/_chh/AMZ_7860.jpg", alt: "Couple with wine under beach umbrellas at sunset, Thalasses Villas", w: 1920, h: 1280, horizonY: 0.44 },
  { n: 61, path: "/images/_pool/b9423e7ace89e8a2f1885e05048c8385.jpg", alt: "Sunset over rocky seafront and horizon, Thalasses Villas", w: 1920, h: 1080, horizonY: 0.47 },
];

export const byN = (n: number): Select => {
  const s = SELECTS.find((x) => x.n === n);
  if (!s) throw new Error(`No A-grade select ${n}. Only curated frames may be used.`);
  return s;
};
