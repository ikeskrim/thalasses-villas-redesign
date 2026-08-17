# What is excluded from this repository, and why

Generated from the same scan that produced `.gitignore`. Every rule below is
mechanical: an image is tracked if `content/**.json` or `src/**` references it,
by hash or by path, and it is not on the owner's ruled-off list.

**Tracked:** 712 image files, 389.6 MB.
**Excluded:** 160 image files, 40.6 MB — plus the regenerable directories below.

Nothing excluded here is unrecoverable. Every original is catalogued in
`content/assets-manifest.json` with its source URL, and every screenshot is
rebuilt by a single command.

---

## 1. Never in this repository, at any time — secrets

This repository is **public**. `.gitignore` excludes `.env`, `.env.*`, `*.pem`,
`*.key`, `*.p12`, `*.pfx`, `*.crt`, `.vercel/`, `secrets.json` and
`credentials.json`.

At the time of the first commit **no environment file existed in this project at
all**, and a credential scan across every staged text file — looking for
`sk-`, `ghp_`/`gho_`, `AKIA`, `xox[bapr]-`, PEM private-key headers and
`api_key`/`secret_token`-style assignments — returned zero matches.

The project needs no runtime secret today: booking is an outbound deep link to
`thalassesvillas.reserve-online.net`, and there is no server-side integration.
When the enquiry form gets a mail provider, **its key goes into Vercel
environment variables**, and the code reads it from `process.env`. It does not
go into a file in this tree, not even an ignored one.

---

## 2. Regenerable directories

| Path | Size | Rebuild with |
|---|---|---|
| `node_modules/` | — | `npm ci` |
| `.next/` | — | `npm run build` |
| `qa/screens/` | **217 MB** | `npm run qa:screens` |
| `qa/walkthrough/` | — | (not present; ignored pre-emptively) |
| `qa/diagnose/` | 1 MB | scratch output from a one-off diagnostic |
| `test-results/`, `playwright-report/` | — | `npm run qa` |
| `tsconfig.tsbuildinfo` | — | `npm run typecheck` |

`qa/screens` is the single largest excludable thing in the project: 30 full-page
screenshots at six breakpoints across five routes. It is evidence of a test run,
not an input to one.

**QA evidence that IS tracked**, because the deliverable documents cite it:
`qa/phase3/` (13 files, 12 MB), `qa/acts/`, `qa/curation/`, `qa/font-ab.png`.

---

## 3. Images ruled off the site by the owner

These are excluded from the repository as well as from the site. `localImage()`
already resolves each to `null` so none of them can render — but a public
repository is a form of publication too, and a frame the owner removed should
not be sitting in it. Provenance and the full ruling: `content/excluded-images.json`.

| File | Size | Why |
|---|---|---|
| `/images/_chh/AMZ_7491.jpg` | 700 KB | quarantined — provenance unverified, awaiting owner review |
| `/images/_chh/Rituals-p-4.webp` | 130 KB | quarantined — provenance unverified, awaiting owner review |
| `/images/_pool/4088b922635567e2a388c664796a8760.jpg` | 933 KB | public place — the Fortezza gate |
| `/images/_pool/635d506527ac868f8d19826ccd2cd581.jpg` | 729 KB | stock photography — cyclist silhouetted on a road |
| `/images/_pool/89b9b7d0649de8eaf9e70763e3b9c2f5.jpg` | 195 KB | quarantined — provenance unverified, awaiting owner review |
| `/images/_pool/9e80231c072456bb5f5b0de3f1943b64.jpg` | 501 KB | quarantined — provenance unverified, awaiting owner review |
| `/images/_pool/bc870bf24a014973d25acd877b7cf856.jpg` | 584 KB | stock photography — cyclist on a mountain ridge |
| `/images/_pool/d46d74613184883ec42184d66d1eef0a.jpg` | 885 KB | public place — municipal umbrellas, not the private beach |
| `/images/_pool/d75844e8e4b2b9664d2eb3e2103373e5.jpg` | 308 KB | branded third-party product — Mythos beer |
| `/images/_pool/fafea700c4a888003811c8139e89ec87.jpg` | 314 KB | almost certainly a different property — pool over mountains |

**Subtotal: 10 files, 5.2 MB.** Guarded in CI — `tests/parity.spec.ts` asserts
none of these hashes appears in the markup or the rendered images of any route.

---

## 4. The creteholidayhome scrape — not referenced anywhere

`public/images/_chh/` holds 168 files pulled from the sister site during Phase 0.
Sixteen are referenced by the inventory or the source and are tracked; two are on
the ruled-off list above; the remaining **150 files (35.4 MB)** are referenced by
nothing in `content/` or `src/` and are excluded.

They are not deleted from disk, and each is catalogued with its source URL in
`content/chh-manifest.json`. If Phase 4 needs one, re-admit it by adding a
negation line to `.gitignore` next to the sixteen already there.

- `AMZ_7459.jpg` — 370 KB
- `AMZ_7479.jpg` — 526 KB
- `AMZ_7483.jpg` — 343 KB
- `AMZ_7518.jpg` — 468 KB
- `AMZ_7537.jpg` — 357 KB
- `AMZ_7548.jpg` — 436 KB
- `AMZ_7599.jpg` — 379 KB
- `AMZ_7613.jpg` — 418 KB
- `AMZ_7619.jpg` — 612 KB
- `AMZ_7632.jpg` — 472 KB
- `AMZ_7639.jpg` — 289 KB
- `AMZ_7647.jpg` — 315 KB
- `AMZ_7657.jpg` — 295 KB
- `AMZ_7667.jpg` — 273 KB
- `AMZ_7684.jpg` — 597 KB
- `AMZ_7691.jpg` — 346 KB
- `AMZ_7711.jpg` — 550 KB
- `AMZ_7733.jpg` — 590 KB
- `AMZ_7738.jpg` — 335 KB
- `AMZ_7745.jpg` — 296 KB
- `AMZ_7755.jpg` — 364 KB
- `AMZ_7765.jpg` — 308 KB
- `breakfast-6-1024x576-exp.webp` — 21 KB
- `car-rental-1024x576-exp.webp` — 11 KB
- `caretacarera-thalasses-3.webp` — 418 KB
- `caretacarera-thalasses.webp` — 371 KB
- `caretacarera-thalasses2.webp` — 370 KB
- `conde-nast-budge.png` — 77 KB
- `creteholidayhome.png` — 39 KB
- `DSC_0137.jpg` — 436 KB
- `DSC_0189.jpg` — 264 KB
- `DSC_0208.jpg` — 333 KB
- `DSC_9847.jpg` — 474 KB
- `DSC_9850.jpg` — 249 KB
- `DSC_9922.jpg` — 551 KB
- `kourtaliotiko-XNVVV.jpg` — 51 KB
- `private-chef-1024x576-exp.webp` — 18 KB
- `rethymnon-town-crete-1024x576-exp.webp` — 25 KB
- `ritual-drone-1.webp` — 934 KB
- `Ritual-drone.webp` — 844 KB
- `Rituals-e-.webp` — 173 KB
- `Rituals-e-10.webp` — 160 KB
- `Rituals-e-2-1.webp` — 212 KB
- `Rituals-e-2.webp` — 240 KB
- `Rituals-e-3.webp` — 191 KB
- `Rituals-e-4.webp` — 68 KB
- `Rituals-e-5.webp` — 230 KB
- `Rituals-e-6.webp` — 162 KB
- `Rituals-e-7.webp` — 235 KB
- `Rituals-e-8.webp` — 220 KB
- `Rituals-e-9.webp` — 117 KB
- `Rituals-e.webp` — 105 KB
- `Rituals-m-.webp` — 82 KB
- `Rituals-m-10.webp` — 231 KB
- `Rituals-m-11.webp` — 332 KB
- `Rituals-m-12.webp` — 131 KB
- `Rituals-m-2.webp` — 234 KB
- `Rituals-m-3.webp` — 185 KB
- `Rituals-m-4.webp` — 152 KB
- `Rituals-m-5.webp` — 127 KB
- `Rituals-m-6.webp` — 73 KB
- `Rituals-m-7.webp` — 221 KB
- `Rituals-m-8.webp` — 168 KB
- `Rituals-m-9.webp` — 203 KB
- `Rituals-m.webp` — 203 KB
- `Rituals-p-.webp` — 113 KB
- `Rituals-p-1-1.webp` — 148 KB
- `Rituals-p-10.webp` — 187 KB
- `Rituals-p-11.webp` — 252 KB
- `Rituals-p-12.webp` — 301 KB
- `Rituals-p-13.webp` — 271 KB
- `Rituals-p-14.webp` — 144 KB
- `Rituals-p-15.webp` — 165 KB
- `Rituals-p-3.webp` — 273 KB
- `Rituals-p-5.webp` — 187 KB
- `Rituals-p-6.webp` — 304 KB
- `Rituals-p-7.webp` — 181 KB
- `Rituals-p-8.webp` — 168 KB
- `Rituals-p-9.webp` — 119 KB
- `Rituals-t-.webp` — 74 KB
- `Rituals-t-2-1.webp` — 402 KB
- `Rituals-t-2.webp` — 281 KB
- `Rituals-t-3-1.webp` — 137 KB
- `Rituals-t-3.webp` — 194 KB
- `Rituals-t-4.webp` — 232 KB
- `Rituals-t-5.webp` — 241 KB
- `Rituals-t-6.webp` — 107 KB
- `Rituals-t-7.webp` — 370 KB
- `Rituals-t-8.webp` — 145 KB
- `Rituals-t-9.webp` — 206 KB
- `Rituals-t.webp` — 190 KB
- `thalases.png` — 173 KB
- `thalasses-all-2.webp` — 446 KB
- `Thalasses-Rituals-c.webp` — 160 KB
- `Thalasses-Villas-Private-Helipad-2s.webp` — 103 KB
- `transfer-1024x576-exp.webp` — 29 KB
- `Villa-Eeanthi-12_result.webp` — 92 KB
- `Villa-Eeanthi-13_result.webp` — 158 KB
- `Villa-Eeanthi-14_result.webp` — 125 KB
- `Villa-Eeanthi-17_result.webp` — 91 KB
- `Villa-Eeanthi-19_result.webp` — 97 KB
- `Villa-Eeanthi-22_result.webp` — 111 KB
- `Villa-Eeanthi-5_result.webp` — 161 KB
- `Villa-Eeanthi-6_result.webp` — 114 KB
- `Villa-Eeanthi-9_result.webp` — 264 KB
- `Villa-Melia-11_result.webp` — 214 KB
- `Villa-Melia-13_result.webp` — 437 KB
- `Villa-Melia-14_result.webp` — 260 KB
- `Villa-Melia-20_result.webp` — 86 KB
- `Villa-Melia-3_result.webp` — 160 KB
- `Villa-Persi-1_result.webp` — 255 KB
- `Villa-Persi-13_result.webp` — 239 KB
- `Villa-Persi-15_result.webp` — 90 KB
- `Villa-Persi-16_result.webp` — 130 KB
- `Villa-Persi-17_result.webp` — 83 KB
- `Villa-Persi-2_result.webp` — 252 KB
- `Villa-Persi-20_result.webp` — 70 KB
- `Villa-Persi-22_result.webp` — 122 KB
- `Villa-Persi-24_result.webp` — 355 KB
- `Villa-Persi-25_result.webp` — 322 KB
- `Villa-Persi-26_result.webp` — 374 KB
- `Villa-Persi-27_result.webp` — 123 KB
- `Villa-Persi-34_result.webp` — 134 KB
- `Villa-Persi-38_result.webp` — 242 KB
- `Villa-Persi-4_result.webp` — 386 KB
- `Villa-Persi-44_result.webp` — 204 KB
- `Villa-Persi-5_result.webp` — 367 KB
- `Villa-Persi-6_result.webp` — 104 KB
- `Villa-Persi-7_result.webp` — 174 KB
- `Villa-Persi-9_result.webp` — 188 KB
- `Villa-Thoi-1.jpg` — 384 KB
- `Villa-Thoi-11.jpg` — 191 KB
- `Villa-Thoi-13.jpg` — 192 KB
- `Villa-Thoi-15.jpg` — 141 KB
- `Villa-Thoi-16.jpg` — 135 KB
- `Villa-Thoi-20.jpg` — 196 KB
- `Villa-Thoi-31.jpg` — 219 KB
- `Villa-Thoi-33.jpg` — 402 KB
- `Villa-Thoi-35.jpg` — 238 KB
- `Villa-Thoi-8.jpg` — 178 KB
- `wedding-exp.webp` — 47 KB
- `Wedding-thalasses-2.webp` — 569 KB
- `Wedding-thalasses-4.webp` — 467 KB
- `Wedding-thalasses-5.webp` — 338 KB
- `Wedding-thalasses-6.webp` — 254 KB
- `Wedding-thalasses-7.webp` — 288 KB
- `Wedding-thalasses-8.webp` — 204 KB
- `wine-tasting-1024x576-exp.webp` — 24 KB
- `wine-tour-1024x576-exp.webp` — 22 KB
- `yoga-retret-1024x576-exp.webp` — 9 KB

---

## 5. What was NOT excluded, deliberately

- **`content/` in full (211 files, ~21 MB)** — including `content/raw/`,
  `content/raw-js/`, `content/text/` and `content/assets/`. These are the Phase 0
  provenance record: the pages the inventory was extracted from. The tests read
  from `content/`, and the fabrication guard builds its registry by walking it.
  Deleting the raw dumps would save 12 MB and cost the ability to prove where any
  fact came from.
- **`public/images/_pool/` in full, minus the eight ruled-off frames** — 686
  files, 368 MB. This is 94% of the repository and there is no smaller version of
  it that still deploys: every one of these is referenced by a villa gallery, an
  experience, the estate, or the curated A-frame selects. `next/image` derives
  its responsive variants from these originals at build and request time, so a
  pre-shrunk copy would degrade the delivered result rather than the repository.
- **`package-lock.json`** — required for a reproducible `npm ci` on Vercel.
- **`next-env.d.ts`** — generated, but Next expects it present.
