# The 3D estate map, review build: screenshots

Taken by `node scripts/estate3d-shots.mjs` from the local review build (`ESTATE_3D_PREVIEW=1`), never a public page (DECISIONS.md D-022, D-028).
The plan is unverified: positions are inferred from the estate's aerial photographs, and the note on every shot says so.

- Server: http://localhost:3035/en/the-estate
- Commit: `25f4e5145f769a9ad59042fdab0e5ef2591c8e63` (the working tree had uncommitted changes)
- BUILD_ID (as the server reported it): `wutO25T0a_C3p1M0PzW1v`
- The note read: Preview — unverified positions. 3 not drawn; all listed. (390 px)
- The note read: Preview — unverified. Positions are inferred from the estate’s aerial photographs and are not yet confirmed by the owner; this build is never public. Not drawn: Villa Pueblo, dining table for 18 people, vegetable garden. The list below carries every place. (768 px)
- The note read: Preview — unverified. Positions are inferred from the estate’s aerial photographs and are not yet confirmed by the owner; this build is never public. Not drawn: Villa Pueblo, dining table for 18 people, vegetable garden. The list below carries every place. (1024 px)
- The note read: Preview — unverified. Positions are inferred from the estate’s aerial photographs and are not yet confirmed by the owner; this build is never public. Not drawn: Villa Pueblo, dining table for 18 people, vegetable garden. The list below carries every place. (1440 px)
- The note read: Preview — unverified. Positions are inferred from the estate’s aerial photographs and are not yet confirmed by the owner; this build is never public. Not drawn: Villa Pueblo, dining table for 18 people, vegetable garden. The list below carries every place. (1920 px)
- The run completed.

Each shot is the diagram's frame with a 16 px margin, scrolled to the middle of the viewport. The site's custom cursor is hidden, and so is any fixed page chrome that takes the pointer and would stand over the frame (named per shot). A shot is refused if the note is covered.

| File | Viewport | DPR | Touch | State | Hidden for the shot | Taken |
|---|---|---|---|---|---|---|
| [estate3d-390-rest.png](estate3d-390-rest.png) | 390×844 | 2 | yes | at rest | nothing | 2026-09-18T20:25:46.263Z |
| [estate3d-390-thoi-open.png](estate3d-390-thoi-open.png) | 390×844 | 2 | yes | Villa Thoi's card open | nothing | 2026-09-18T20:25:46.263Z |
| [estate3d-768-rest.png](estate3d-768-rest.png) | 768×1024 | 1 | no | at rest | nothing | 2026-09-18T20:25:49.830Z |
| [estate3d-768-thoi-open.png](estate3d-768-thoi-open.png) | 768×1024 | 1 | no | Villa Thoi's card open | nothing | 2026-09-18T20:25:49.830Z |
| [estate3d-1024-rest.png](estate3d-1024-rest.png) | 1024×768 | 1 | no | at rest | nothing | 2026-09-18T20:25:53.460Z |
| [estate3d-1024-thoi-open.png](estate3d-1024-thoi-open.png) | 1024×768 | 1 | no | Villa Thoi's card open | nothing | 2026-09-18T20:25:53.460Z |
| [estate3d-1440-rest.png](estate3d-1440-rest.png) | 1440×900 | 1 | no | at rest | `header.nav.is-solid` | 2026-09-18T20:25:57.893Z |
| [estate3d-1440-thoi-open.png](estate3d-1440-thoi-open.png) | 1440×900 | 1 | no | Villa Thoi's card open | `header.nav.is-solid` | 2026-09-18T20:25:57.893Z |
| [estate3d-1440-helipad-open.png](estate3d-1440-helipad-open.png) | 1440×900 | 1 | no | the helipad's card open | `header.nav.is-solid` | 2026-09-18T20:25:57.893Z |
| [estate3d-1920-rest.png](estate3d-1920-rest.png) | 1920×1080 | 1 | no | at rest | nothing | 2026-09-18T20:26:01.639Z |
| [estate3d-1920-thoi-open.png](estate3d-1920-thoi-open.png) | 1920×1080 | 1 | no | Villa Thoi's card open | nothing | 2026-09-18T20:26:01.639Z |
