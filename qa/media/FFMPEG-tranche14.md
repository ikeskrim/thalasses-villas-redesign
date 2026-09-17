# The WebM ladder with a real ffmpeg (tranche fourteen)

DECISIONS.md D-028: "Over-budget WebM: lower resolution within ≤2.5 MB, MP4 fallback." D-031 records how `scripts/ingest-drive.mjs` now does it. This record is the evidence. The full run report is beside it, verbatim: `ffmpeg-report-tranche14.md`.

**The answer.**
- **An over-budget WebM is cut again lower,** at 1280 and then 960 on the long edge. The first rung within 2,621,440 B is kept.
- **A lower rung was kept by the real pipeline.** On moderate noise (case 9, `alls=12`), the pipeline kept the 960 rung at 2,607,614 B, after 1920 (3,074,733 B) and 1280 (2,858,620 B) came out over.
- **If no rung fits, the clip keeps the poster and the MP4 alone,** and it is still a finished clip. Full-strength and block noise both ended that way.
- **Nothing over budget is left on disk,** and a failed cut leaves none of its files.
- **Portrait and rotated clips stay 1080×1920,** a smaller source is never enlarged, and a 10-bit HEVC source gives 8-bit loops.
- **All 267 checks passed.**

## 1. How it was run

**The run.**
- **Date:** 2026-09-17, from 17:42Z.
- **What it ran against:** the repository at d20fa2b plus the uncommitted ladder change (`scripts/ingest-drive.mjs` sha256 8b46d378…, the committed version).
- **The encoder:** ffmpeg 9.0.1 (gyan.dev full build) with libx264, libvpx-vp9 and libx265, and ffprobe beside it.

**Each case.**
1. A synthetic clip is generated with ffmpeg's own test sources.
2. A `needs-transcode` manifest is written in the shape the ingest writes.
3. `node scripts/ingest-drive.mjs --transcode-pending` runs from the repository root, with `INGEST_OUT_ROOT` set to the case folder and `FFMPEG_PATH` set to the absolute path of the binary.
4. A pass-through shim (`INGEST_FFMPEG_SHIM`) logs every argv and runs the real ffmpeg. Case 7 runs with no shim.

**Checks on every output.** ffprobe checks the codec, profile, pixel format, dimensions, duration, audio and rotation, and the MP4's box order is checked for faststart. The argv ffmpeg received must equal the plan, up to the rung that was kept.

**The repository.** Its git status and working-tree diff were unchanged across the whole run.

**Where the scripts live.** The check script and the shim are session scratch (`ffmpeg-verify-t14b.mjs`, `argv-shim.mjs`), extended from tranche thirteen's `ffmpeg-verify.mjs`.

**The machine is shared** with other Claude sessions that build and run QA concurrently. Timings are wall time, and indicative only.

## 2. Results

| case | input | outcome | sizes and dimensions | pipeline time |
|---|---|---|---|---|
| 1 | testsrc2 3840×2160, 30 fps, 12 s, with 440 Hz audio | WebM at 1920; only the poster, MP4 and 1920 WebM ran | MP4 2,540,752 B, H.264 High yuv420p 1920×1080, 8.0 s, silent, faststart; WebM 2,044,050 B, VP9 Profile 0 yuv420p 1920×1080, 8.0 s, silent | 18.4 s |
| 2 | case 1's five recorded lines, through Git Bash (real ffmpeg) and cmd.exe (argv only) | every line ran, and the argv equals the plan | 1920×1080, 1280×720 and 960×540 outputs from the shell | — |
| 3 | testsrc2 1920×1080 with full-strength temporal noise | **MP4 only** | WebM 1920: 17,225,636 B, 1280: 6,913,972 B, 960: 5,054,380 B, all deleted; MP4 2,373,086 B | 158.7 s |
| 4 | block noise: 960×540 noise enlarged ×2 with nearest-neighbour | **MP4 only**, forced by the input alone | WebM 26,335,456 / 7,331,302 / 5,340,305 B, all deleted; MP4 2,540,999 B | 177.4 s |
| 5 | native portrait testsrc2 1080×1920 | WebM at 1920 | poster, MP4 and WebM all 1080×1920; MP4 2,569,108 B; WebM 2,024,617 B | 20.5 s |
| 6 | 1920×1080 remuxed with a 90° display rotation | WebM at 1920; outputs upright, no rotation left | all 1080×1920; MP4 1,694,123 B; WebM 1,976,991 B | 19.6 s |
| 7 | testsrc2 1280×720, **no shim** | WebM at 1920 | all 1280×720, not enlarged; MP4 2,521,079 B; WebM 1,741,566 B | 12.9 s |
| 8 | `FFMPEG_PATH` pointing at nothing | exit 1, "Nothing was changed", manifest unchanged, no clip folder | — | 0.1 s |
| 9 | moderate temporal noise, stepped down until a lower rung is kept | **WebM at 960**, at `alls=12` | see §3 | 452.4 s for four levels |
| 10 | testsrc2 1920×1080 as **HEVC Main 10, yuv420p10le** | WebM at 1920 | MP4 H.264 High yuv420p; WebM VP9 Profile 0 yuv420p; both 1920×1080; MP4 2,513,981 B; WebM 1,955,567 B | 17.3 s |

**267 of 267 checks passed.**

## 3. The ladder, level by level (case 9)

| noise `alls` | 1920 WebM | 1280 WebM | 960 WebM | outcome |
|---|---|---|---|---|
| 45 | 9,983,839 B | 5,324,992 B | 3,913,765 B | MP4 only |
| 30 | 6,714,533 B | 4,926,463 B | 3,553,298 B | MP4 only |
| 20 | 3,700,567 B | 3,724,231 B | 3,160,055 B | MP4 only |
| 12 | 3,074,733 B | 2,858,620 B | **2,607,614 B** (kept, 960×540) | WebM at 960 |

At `alls=12`:
- **What the pipeline recorded.** `webm: {rung: 960, tried: [{1920, 3,074,733}, {1280, 2,858,620}]}`, `fallback: null`, and a note naming "the 960 rung, BELOW the MP4's 1920 rung".
- **What it left on disk.** Only the poster, the MP4 and the 960 WebM.

## 4. What this establishes

1. **The ruling's branch works with the real encoder.** When a WebM is over budget, the pipeline steps down and keeps the first rung that fits (case 9). When none fits, it keeps the MP4 alone and calls the clip finished (cases 3 and 4). Before this run, the keep decision had been exercised only against a fake ffmpeg.
2. **On noisy input the ladder is a weak lever.**
   - With the settings kept from tranche thirteen (single-pass VBR at 2411k), VP9's size falls far less than its pixel count. At `alls=20` the 1280 rung came out larger than the 1920 one. At `alls=12` the kept 960 rung was 99.5% of the budget.
   - A lower resolution helps only near the edge of the budget. The lever that would move these sizes is VP9's rate control (two-pass, or constrained quality with a cap), and that is not in D-028.
3. **The MP4's margin is thin.** Seven of the eight MP4s the run probed were 86.4–98.0% of the budget. Native portrait came closest, at 2,569,108 B, leaving 52,332 B. The rotated clip was 64.6%. The ladder does not help the MP4: an MP4 over budget still fails the clip.
4. **Phone footage.**
   - **Orientation.** A portrait clip, and a landscape clip carrying a 90° rotation, both come out upright at 1080×1920.
   - **10-bit sources.** A 10-bit HEVC source now gives 8-bit loops: `-pix_fmt yuv420p` on the WebM steps, new in this tranche. Without it, a 10-bit source gave a VP9 Profile 2 WebM (seen by the tranche-14 review).
   - **HDR.** Case 10's source is an SDR test signal, so HDR tone mapping is not established. Neither loop does any.

## 5. The tests beside this run

- **The ingest spec** (`tests/ingest-drive.spec.ts`) passes 9 of 9 through a Playwright configuration with no web server. The fake ffmpeg (`tests/fixtures/drive/fake-ffmpeg.mjs`) now fails like ffmpeg when the output folder is missing.
- **20 deliberate mutations** of `scripts/ingest-drive.mjs` each turned the spec red at a named assertion. The script was restored byte for byte after each.
  - The implementer's 16: the per-rung budget check, stop-at-first-fit, deleting over-budget files, ladder order, MP4-only as a success, the MP4 budget check, pending retries, never enlarging, the exit code, exactly-the-budget, partial outputs, stale fields, the poster's scale, an encoder error failing the clip, and the reason's two sentences.
  - Four for this tranche's review fixes: the clip-folder mkdir, the start-of-cut cleanup, a failed cut keeping its files, and the WebM pixel format.

## 6. Limits

- **Synthetic clips only:** test patterns and noise. No owner footage exists yet. Real phone video, HDR, variable frame rate and long clips are not exercised.
- **One encoder build, one machine,** and a shared one. The x264 sizes vary by a few kilobytes between runs of the same input: case 1's MP4 was 2,540,752 B here and 2,551,445 B in the implementer's run.
- **Case 9's levels** were chosen by stepping down until a rung fitted. They say nothing about where real footage lands.
- **The recorded lines** were checked through Git Bash and cmd.exe, not PowerShell.
- **No site markup.** No `<video>` exists on the site, so which source a browser picks is not established.
