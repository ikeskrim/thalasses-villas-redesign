# The owner-video path with a real ffmpeg — tranche 14, the WebM ladder — 2026-09-17T17:42:47.750Z

Repository: `C:/Users/mcapt/Downloads/Νέος φάκελος/thalasses-villas-redesign` at d20fa2b plus the uncommitted ladder change; scripts/ingest-drive.mjs sha256 8b46d378856755ea.
ffmpeg: `ffmpeg version 9.0.1-full_build-www.gyan.dev Copyright (c) 2000-2026 the FFmpeg developers` (`C:/Users/mcapt/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe`), ffprobe beside it.
Encoders: libx264 true, libvpx-vp9 true.
Command run for each case: `INGEST_OUT_ROOT=<work>/<case> FFMPEG_PATH=<ffmpeg.exe> INGEST_FFMPEG_SHIM=<argv-shim.mjs> node scripts/ingest-drive.mjs --transcode-pending`, from the repository root, against a hand-written manifest in the shape the ingest writes (needs-transcode, with its recorded commands). The shim logs the argv and runs the real ffmpeg with it. Case 7 runs with no shim, through `FFMPEG_PATH` alone.
Budget: 2,621,440 B. Ladder: WebM 1920, 1280, 960 on the long edge; MP4 at 1920.

**The machine is shared** with other Claude sessions that build and run QA concurrently. Every timing below is wall time on that machine, indicative only.

## Case 1 — testsrc2, 3840×2160, 30 fps, 12 s, with a 440 Hz audio track

Source: 35,324,971 B, coded 3840×2160, h264; generated in 8.0 s.
Pipeline: exit 0 in 18.4 s.

```
WEBM AT 1920     2026-09-17-0e67e150-dummy-testsrc2
  variants-ready   2026-09-17-0e67e150-dummy-testsrc2
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS variants in order poster.jpg, loop-1920.mp4, loop-1920.webm — poster.jpg, loop-1920.mp4, loop-1920.webm
- PASS the WebM is the 1920 rung, nothing tried before it — {"rung":1920,"tried":[]}
- PASS no fallback — null
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm — and nothing after (loop-1280.webm, loop-960.webm never ran) — 3 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 92,051 B | 0.4 s | kept |
| loop-1920.mp4 | 1920 | 2,540,752 B | 3.5 s | kept |
| loop-1920.webm | 1920 | 2,044,050 B | 14.1 s | kept |

- PASS poster.jpg is 1920×1080 — 1920×1080, 92,051 B
- PASS loop-1920.mp4 within the budget — 2,540,752 B
- PASS MP4 is H.264 High, yuv420p, 1920×1080 — h264 High yuv420p 1920×1080
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-1920.webm within the budget — 2,044,050 B
- PASS WebM is VP9, 1920×1080 — vp9 1920×1080
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-1920.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 92,051 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,540,752 B
- PASS recorded size of loop-1920.webm is its size on disk — 2,044,050 B

## Case 2 — case 1's recorded command lines, run through a shell

commandLine() writes each step as a line to paste into a shell; the long-edge filter holds single quotes and commas, so the line double-quotes it. The five lines case 1 recorded are run here in order, every one of them (a maintainer running them by hand would stop at the first WebM that fits; running all five checks every rung's filter). The clip folder is created first, as the pipeline does and as the recorded reason tells a maintainer to: ffmpeg does not create it. Git Bash runs them with `ffmpeg` as a shell function that calls the shim, which runs the real ffmpeg. cmd.exe runs them with the leading `ffmpeg` replaced by the node and shim paths, logging argv only. PowerShell was not checked: a PowerShell function wrapper re-parses `-b:v` as a parameter, so it would test the wrapper rather than the line.

Git Bash: exit 0 in 37.2 s.

- PASS Git Bash ran all five recorded lines, exit 0 — 5 runs
- PASS Git Bash handed ffmpeg exactly heroVariantPlan()'s argv for every line

| line | output | size | dimensions | encode time |
|---|---|---|---|---|
| 1 | poster.jpg | 92,051 B | 1920×1080 | 0.4 s |
| 2 | loop-1920.mp4 | 2,538,446 B | 1920×1080 | 2.7 s |
| 3 | loop-1920.webm | 2,044,050 B | 1920×1080 | 12.9 s |
| 4 | loop-1280.webm | 1,870,486 B | 1280×720 | 9.7 s |
| 5 | loop-960.webm | 1,769,485 B | 960×540 | 11.1 s |

- PASS from the shell, poster.jpg is 1920×1080 — 1920×1080
- PASS from the shell, loop-1920.mp4 is 1920×1080 — 1920×1080
- PASS from the shell, loop-1920.webm is 1920×1080 — 1920×1080
- PASS from the shell, loop-1280.webm is 1280×720 — 1280×720
- PASS from the shell, loop-960.webm is 960×540 — 960×540
- PASS no recorded line holds a character cmd.exe expands outside quotes (% ^ & | < >)
cmd.exe: exit 0.
- PASS cmd.exe handed the program exactly heroVariantPlan()'s argv for every line — 5 lines

## Case 3 — testsrc2 with full-strength temporal noise, 1920×1080, 12 s (the tranche-13 worst case)

Source: 535,099,155 B, coded 1920×1080, h264; generated in 21.1 s.
Pipeline: exit 0 in 158.7 s.

```
MP4 ONLY         2026-09-17-54b71481-dummy-noise  — MP4 FALLBACK ONLY: no WebM rung fit the 2621440-byte budget (1920: 17225636 bytes, 1280: 6913972 bytes, 960: 5054380 bytes), so this clip has no WebM; each over-budget WebM was deleted. The MP4 is its only loop.
  variants-ready   2026-09-17-54b71481-dummy-noise
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 1,780,868 B | 1.0 s | kept |
| loop-1920.mp4 | 1920 | 2,373,086 B | 7.5 s | kept |
| loop-1920.webm | 1920 | 17,225,636 B | 82.3 s | over budget → deleted |
| loop-1280.webm | 1280 | 6,913,972 B | 34.0 s | over budget → deleted |
| loop-960.webm | 960 | 5,054,380 B | 33.2 s | over budget → deleted |

- PASS the 1920 WebM came out over budget — 17,225,636 B
- PASS the 1920 rung is recorded as over, with its size — in the MP4-only note
- PASS poster.jpg is 1920×1080 — 1920×1080, 1,780,868 B
- PASS loop-1920.mp4 within the budget — 2,373,086 B
- PASS MP4 is H.264 High, yuv420p, 1920×1080 — h264 High yuv420p 1920×1080
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS MP4 only: webm null, fallback mp4-only — null mp4-only
- PASS MP4 only: no .webm on disk — loop-1920.mp4, poster.jpg
- PASS MP4 only: every rung ran and every rung was over budget
- RECORDED OUTCOME: MP4 only. WebM sizes when ffmpeg exited: loop-1920.webm 17,225,636 B; loop-1280.webm 6,913,972 B; loop-960.webm 5,054,380 B.
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 1,780,868 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,373,086 B

## Case 4 — block noise: testsrc2 960×540 with full-strength temporal noise, enlarged ×2 with nearest-neighbour to 1920×1080, 12 s (forces MP4 only)

No test-only ladder hook was added to the script: this case forces the fallback with its input alone. Each noise pixel is a 2×2 block, so the 960 rung sees the full 960×540 noise field rather than an average of it.

Source: 264,077,767 B, coded 1920×1080, h264; generated in 11.4 s.
Pipeline: exit 0 in 177.4 s.

```
MP4 ONLY         2026-09-17-a82ae239-dummy-blocknoise  — MP4 FALLBACK ONLY: no WebM rung fit the 2621440-byte budget (1920: 26335456 bytes, 1280: 7331302 bytes, 960: 5340305 bytes), so this clip has no WebM; each over-budget WebM was deleted. The MP4 is its only loop.
  variants-ready   2026-09-17-a82ae239-dummy-blocknoise
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 1,501,946 B | 0.7 s | kept |
| loop-1920.mp4 | 1920 | 2,540,999 B | 6.3 s | kept |
| loop-1920.webm | 1920 | 26,335,456 B | 88.2 s | over budget → deleted |
| loop-1280.webm | 1280 | 7,331,302 B | 36.6 s | over budget → deleted |
| loop-960.webm | 960 | 5,340,305 B | 45.0 s | over budget → deleted |

- PASS MP4 only: webm null, fallback mp4-only — null mp4-only
- PASS variants are poster.jpg and loop-1920.mp4 only
- PASS every WebM rung ran, and each was over budget — 26,335,456 B, 7,331,302 B, 5,340,305 B
- PASS no .webm is left on disk
- PASS the note says MP4 FALLBACK ONLY and names each rung's size
- PASS the run printed MP4 ONLY
- PASS poster.jpg is 1920×1080 — 1920×1080, 1,501,946 B
- PASS loop-1920.mp4 within the budget — 2,540,999 B
- PASS MP4 is H.264 High, yuv420p, 1920×1080 — h264 High yuv420p 1920×1080
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 1,501,946 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,540,999 B

## Case 5 — native portrait: testsrc2, 1080×1920, 30 fps, 12 s

Source: 10,470,542 B, coded 1080×1920, h264; generated in 2.1 s.
Pipeline: exit 0 in 20.5 s.

```
WEBM AT 1920     2026-09-17-f014385f-dummy-portrait
  variants-ready   2026-09-17-f014385f-dummy-portrait
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm — and nothing after (loop-1280.webm, loop-960.webm never ran) — 3 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 113,755 B | 0.2 s | kept |
| loop-1920.mp4 | 1920 | 2,569,108 B | 2.0 s | kept |
| loop-1920.webm | 1920 | 2,024,617 B | 17.9 s | kept |

- PASS the WebM is the 1920 rung — {"rung":1920,"tried":[]}
- PASS poster.jpg is 1080×1920 — 1080×1920, 113,755 B
- PASS loop-1920.mp4 within the budget — 2,569,108 B
- PASS MP4 is H.264 High, yuv420p, 1080×1920 — h264 High yuv420p 1080×1920
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-1920.webm within the budget — 2,024,617 B
- PASS WebM is VP9, 1080×1920 — vp9 1080×1920
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- PASS poster, MP4 and WebM are all 1080×1920 (not 1920×3414) — 1080×1920, 1080×1920
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-1920.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 113,755 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,569,108 B
- PASS recorded size of loop-1920.webm is its size on disk — 2,024,617 B

## Case 6 — phone-style rotation: testsrc2 1920×1080, 12 s, remuxed with `-display_rotation:v:0 90` (stream copy)

Source: 9,617,984 B, coded 1920×1080, display rotation 90°, h264; generated in 2.0 s.
- PASS the source is coded 1920×1080 and carries a ±90° display rotation — 1920×1080, rotation 90
Pipeline: exit 0 in 19.6 s.

```
WEBM AT 1920     2026-09-17-ab609179-dummy-rotated
  variants-ready   2026-09-17-ab609179-dummy-rotated
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm — and nothing after (loop-1280.webm, loop-960.webm never ran) — 3 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 95,296 B | 0.2 s | kept |
| loop-1920.mp4 | 1920 | 1,694,123 B | 2.0 s | kept |
| loop-1920.webm | 1920 | 1,976,991 B | 17.0 s | kept |

- PASS poster.jpg is 1080×1920 — 1080×1920, 95,296 B
- PASS loop-1920.mp4 within the budget — 1,694,123 B
- PASS MP4 is H.264 High, yuv420p, 1080×1920 — h264 High yuv420p 1080×1920
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-1920.webm within the budget — 1,976,991 B
- PASS WebM is VP9, 1080×1920 — vp9 1080×1920
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- PASS the rotation is applied once: outputs are upright 1080×1920 — 1080×1920, 1080×1920
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-1920.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 95,296 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 1,694,123 B
- PASS recorded size of loop-1920.webm is its size on disk — 1,976,991 B

## Case 7 — a 1280×720 source: testsrc2, 30 fps, 12 s (run with NO shim, through FFMPEG_PATH alone)

Source: 4,697,103 B, coded 1280×720, h264; generated in 1.0 s.
Pipeline: exit 0 in 12.9 s.

```
WEBM AT 1920     2026-09-17-81237d11-dummy-small
  variants-ready   2026-09-17-81237d11-dummy-small
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS no shim ran (FFMPEG_PATH was the binary used)
- PASS variants in order poster.jpg, loop-1920.mp4, loop-1920.webm
- PASS the WebM is the 1920 rung, nothing tried before it — {"rung":1920,"tried":[]}
- PASS poster.jpg is 1280×720 — 1280×720, 57,182 B
- PASS loop-1920.mp4 within the budget — 2,521,079 B
- PASS MP4 is H.264 High, yuv420p, 1280×720 — h264 High yuv420p 1280×720
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-1920.webm within the budget — 1,741,566 B
- PASS WebM is VP9, 1280×720 — vp9 1280×720
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- PASS nothing was enlarged: every output is 1280×720
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-1920.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 57,182 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,521,079 B
- PASS recorded size of loop-1920.webm is its size on disk — 1,741,566 B

## Case 8 — FFMPEG_PATH pointing at nothing, no shim

- PASS exit code 1 — 1
- PASS says nothing was changed — ffmpeg was not found: put it on PATH, or point FFMPEG_PATH at the binary. Nothing was changed.
- PASS manifest unchanged
- PASS no clip folder was made

## Case 9 — moderate temporal noise, 1920×1080, 12 s: the pipeline keeps a lower WebM rung

Full-strength noise (case 3) falls through to MP4 only, and testsrc2 fits at 1920. This case lowers the noise step by step until the pipeline's own keep decision picks a rung below 1920, and records every level it tried.

### noise alls=45

Source: 433,379,257 B, coded 1920×1080, h264; generated in 19.8 s.
Pipeline: exit 0 in 134.0 s.

```
MP4 ONLY         2026-09-17-1bf3cafb-dummy-noise-45  — MP4 FALLBACK ONLY: no WebM rung fit the 2621440-byte budget (1920: 9983839 bytes, 1280: 5324992 bytes, 960: 3913765 bytes), so this clip has no WebM; each over-budget WebM was deleted. The MP4 is its only loop.
  variants-ready   2026-09-17-1bf3cafb-dummy-noise-45
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 1,390,496 B | 0.8 s | kept |
| loop-1920.mp4 | 1920 | 2,239,673 B | 5.6 s | kept |
| loop-1920.webm | 1920 | 9,983,839 B | 60.8 s | over budget → deleted |
| loop-1280.webm | 1280 | 5,324,992 B | 30.8 s | over budget → deleted |
| loop-960.webm | 960 | 3,913,765 B | 35.2 s | over budget → deleted |

- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 1,390,496 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,239,673 B
- alls=45: MP4 only; WebM sizes when ffmpeg exited: loop-1920.webm 9,983,839 B; loop-1280.webm 5,324,992 B; loop-960.webm 3,913,765 B.
### noise alls=30

Source: 374,141,499 B, coded 1920×1080, h264; generated in 16.4 s.
Pipeline: exit 0 in 142.1 s.

```
MP4 ONLY         2026-09-17-0c8c97e3-dummy-noise-30  — MP4 FALLBACK ONLY: no WebM rung fit the 2621440-byte budget (1920: 6714533 bytes, 1280: 4926463 bytes, 960: 3553298 bytes), so this clip has no WebM; each over-budget WebM was deleted. The MP4 is its only loop.
  variants-ready   2026-09-17-0c8c97e3-dummy-noise-30
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 1,167,284 B | 0.7 s | kept |
| loop-1920.mp4 | 1920 | 2,410,907 B | 6.0 s | kept |
| loop-1920.webm | 1920 | 6,714,533 B | 70.0 s | over budget → deleted |
| loop-1280.webm | 1280 | 4,926,463 B | 35.1 s | over budget → deleted |
| loop-960.webm | 960 | 3,553,298 B | 29.7 s | over budget → deleted |

- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 1,167,284 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,410,907 B
- alls=30: MP4 only; WebM sizes when ffmpeg exited: loop-1920.webm 6,714,533 B; loop-1280.webm 4,926,463 B; loop-960.webm 3,553,298 B.
### noise alls=20

Source: 321,922,710 B, coded 1920×1080, h264; generated in 17.3 s.
Pipeline: exit 0 in 103.7 s.

```
MP4 ONLY         2026-09-17-d0baf22c-dummy-noise-20  — MP4 FALLBACK ONLY: no WebM rung fit the 2621440-byte budget (1920: 3700567 bytes, 1280: 3724231 bytes, 960: 3160055 bytes), so this clip has no WebM; each over-budget WebM was deleted. The MP4 is its only loop.
  variants-ready   2026-09-17-d0baf22c-dummy-noise-20
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 929,191 B | 0.6 s | kept |
| loop-1920.mp4 | 1920 | 2,336,771 B | 5.3 s | kept |
| loop-1920.webm | 1920 | 3,700,567 B | 42.0 s | over budget → deleted |
| loop-1280.webm | 1280 | 3,724,231 B | 28.5 s | over budget → deleted |
| loop-960.webm | 960 | 3,160,055 B | 26.7 s | over budget → deleted |

- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 929,191 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,336,771 B
- alls=20: MP4 only; WebM sizes when ffmpeg exited: loop-1920.webm 3,700,567 B; loop-1280.webm 3,724,231 B; loop-960.webm 3,160,055 B.
### noise alls=12

Source: 246,762,533 B, coded 1920×1080, h264; generated in 16.0 s.
Pipeline: exit 0 in 72.6 s.

```
WEBM AT 960      2026-09-17-ea4ef697-dummy-noise-12  — WebM: the 960 rung, BELOW the MP4's 1920 rung — the larger rungs came out over the 2621440-byte budget (1920: 3074733 bytes, 1280: 2858620 bytes) and were deleted. A rung is a ceiling on the long edge: a source smaller than it keeps its own size.
  variants-ready   2026-09-17-ea4ef697-dummy-noise-12
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm, loop-1280.webm, loop-960.webm — 5 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 625,020 B | 0.6 s | kept |
| loop-1920.mp4 | 1920 | 2,264,890 B | 3.7 s | kept |
| loop-1920.webm | 1920 | 3,074,733 B | 29.9 s | over budget → deleted |
| loop-1280.webm | 1280 | 2,858,620 B | 16.0 s | over budget → deleted |
| loop-960.webm | 960 | 2,607,614 B | 21.9 s | kept |

- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-960.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 625,020 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,264,890 B
- PASS recorded size of loop-960.webm is its size on disk — 2,607,614 B
- alls=12: WebM at 960; WebM sizes when ffmpeg exited: loop-1920.webm 3,074,733 B; loop-1280.webm 2,858,620 B; loop-960.webm 2,607,614 B.
- PASS alls=12: a lower rung was kept by the pipeline, and every rung above it is recorded over budget — {"rung":960,"tried":[{"rung":1920,"bytes":3074733},{"rung":1280,"bytes":2858620}]}
- PASS alls=12: fallback is null — null
- PASS alls=12: the note names the rung below the MP4's — DRAFT CUT: the first 8 seconds. Choosing the in and out points is an editorial call — re-cut before it becomes the hero. WebM: the 960 rung, BELOW the MP4's 192
- PASS poster.jpg is 1920×1080 — 1920×1080, 625,020 B
- PASS loop-1920.mp4 within the budget — 2,264,890 B
- PASS MP4 is H.264 High, yuv420p, 1920×1080 — h264 High yuv420p 1920×1080
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-960.webm within the budget — 2,607,614 B
- PASS WebM is VP9, 960×540 — vp9 960×540
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- RECORDED OUTCOME: WebM 960 at alls=12 (2,607,614 B, 960×540); MP4 2,264,890 B.

## Case 10 — a 10-bit HEVC source: testsrc2 1920×1080, 12 s, libx265 yuv420p10le

Source: 7,449,341 B, coded 1920×1080, hevc; generated in 9.9 s.
- PASS the source is HEVC Main 10, yuv420p10le — hevc Main 10 yuv420p10le
Pipeline: exit 0 in 17.3 s.

```
WEBM AT 1920     2026-09-17-7a2f476e-dummy-hevc10
  variants-ready   2026-09-17-7a2f476e-dummy-hevc10
```

- PASS exit code 0
- PASS manifest entry is variants-ready — variants-ready
- PASS no commands or reason left on the entry
- PASS the note is the DRAFT CUT note — DRAFT CUT: the first 8 seconds. Choosing the in and out poin
- PASS ffmpeg received exactly the planned argv, in order: poster.jpg, loop-1920.mp4, loop-1920.webm — and nothing after (loop-1280.webm, loop-960.webm never ran) — 3 ffmpeg runs logged
- PASS each line run is the recorded command line, verbatim
- PASS every run's -vf is the long-edge, no-upscale expression for its rung — scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2 | scale=w='min(1920,iw)':h='min(1920,ih)':…
- PASS ffmpeg ran from the output root

| step | rung | size when ffmpeg exited | encode time | outcome |
|---|---|---|---|---|
| poster.jpg | 1920 | 95,649 B | 0.3 s | kept |
| loop-1920.mp4 | 1920 | 2,513,981 B | 2.1 s | kept |
| loop-1920.webm | 1920 | 1,955,567 B | 14.4 s | kept |

- PASS poster.jpg is 1920×1080 — 1920×1080, 95,649 B
- PASS loop-1920.mp4 within the budget — 2,513,981 B
- PASS MP4 is H.264 High, yuv420p, 1920×1080 — h264 High yuv420p 1920×1080
- PASS MP4 is 8 s long (±0.1) — 8.000000 s
- PASS MP4 has no audio stream — 0 audio
- PASS MP4 carries no display rotation — 0
- PASS MP4 is faststart (moov before mdat) — ftyp moov free mdat
- PASS loop-1920.webm within the budget — 1,955,567 B
- PASS WebM is VP9, 1920×1080 — vp9 1920×1080
- PASS WebM is 8-bit yuv420p (VP9 Profile 0) — yuv420p Profile 0
- PASS WebM is 8 s long (±0.1) — 8.000000 s
- PASS WebM has no audio stream — 0 audio
- PASS WebM carries no display rotation — 0
- PASS the clip folder holds exactly the recorded variants — loop-1920.mp4, loop-1920.webm, poster.jpg
- PASS no loop over the 2,621,440-byte budget is left in the clip folder
- PASS recorded size of poster.jpg is its size on disk — 95,649 B
- PASS recorded size of loop-1920.mp4 is its size on disk — 2,513,981 B
- PASS recorded size of loop-1920.webm is its size on disk — 1,955,567 B

## The repository

- PASS the repository's git status is unchanged by every run — 4 entries
- PASS the repository's working-tree diff is unchanged by every run — 14e51ef0b687fce1

## Summary

| case | outcome | sizes and dimensions | pipeline time |
|---|---|---|---|
| 1 testsrc2 4K + audio | WebM 1920 | MP4 2,540,752 B 1920×1080; WebM 2,044,050 B 1920×1080 | 18.4 s |
| 2 recorded lines via a shell | all five lines run | Git Bash (real ffmpeg) and cmd.exe (argv) give the planned argv |  |
| 3 full-strength noise 1920×1080 | MP4 only | MP4 2,373,086 B 1920×1080; WebM tried: loop-1920.webm 17,225,636 B, loop-1280.webm 6,913,972 B, loop-960.webm 5,054,380 B | 158.7 s |
| 4 block noise (forced) | MP4 only | MP4 2,540,999 B 1920×1080; WebM tried: loop-1920.webm 26,335,456 B, loop-1280.webm 7,331,302 B, loop-960.webm 5,340,305 B | 177.4 s |
| 5 native portrait 1080×1920 | WebM 1920 | MP4 2,569,108 B 1080×1920; WebM 2,024,617 B 1080×1920 | 20.5 s |
| 6 rotated phone-style | WebM 1920 | MP4 1,694,123 B 1080×1920; WebM 1,976,991 B 1080×1920 | 19.6 s |
| 7 1280×720 source (no shim) | WebM 1920 | MP4 2,521,079 B 1280×720; WebM 1,741,566 B 1280×720 | 12.9 s |
| 8 missing ffmpeg | exit 1, nothing changed |  | 0.1 s |
| 9 moderate noise, stepped | WebM 960 at alls=12 (2,607,614 B, 960×540); MP4 2,264,890 B |  | 452.4 s |
| 10 HEVC 10-bit source | WebM 1920, 8-bit | MP4 2,513,981 B 1920×1080; WebM 1,955,567 B 1920×1080; no HDR tone mapping (the source is SDR test signal) | 17.3 s |

Work folder: `C:/Users/mcapt/AppData/Local/Temp/claude/C--Users-mcapt-Downloads-------------/ef487ef2-0bed-4d94-8c46-edb2db20c150/scratchpad/t14-webm/run-b`, 2,333,040,919 B in all.

**267 of 267 checks passed.**
