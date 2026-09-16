# The provenance gate, checked (tranche thirteen)

The owner's ruling, as section A of the message that D-021 relays: the 3D map "renders publicly ONLY when provenance is "owner-verified"; until then the 2D hotspot map stays live and a test asserts the 3D canvas never mounts." D-021 records it in DECISIONS.md, and the gate itself is D-022.

This record holds two things the tranche-thirteen report lacked:
- evidence that the test can fail, which no run had shown before 2026-09-16 (§2);
- evidence that production holds the gate, which the report had cited only from the session log.

**The answer.**
- **The test can fail.** Against a build that mounts the 3D map while the plan is unverified, its frame check went red. Its canvas check, on its own, went red too. Its other assertions were not run red.
- **Production holds the gate.** On 2026-09-16:
  - `scripts/check-estate-gate.mjs` passed;
  - three of the four public-build tests passed (the fourth reads the local build);
  - the three.js chunk is deployed, but it is in no initial script, and a visit with the gate closed recorded no response carrying it.

## 1. The test

`tests/estate-3d.spec.ts:60`, "the gate follows the plan's provenance, and while it is closed the 3D canvas never mounts". It runs in `npm run qa` against the public build.

- **How it decides.** It decides the gate from the committed `content/estate-plan.json` with `decideEstate3D(plan, {})`, as a production build does. Today the gate is closed.
- **Preconditions.** It first asserts the conditions under which the diagram would mount: WebGL2 present, and motion allowed. It then scrolls the map into range and waits 2.5 s.
- **With the gate closed, it asserts, in order:**
  1. no `.estate-map-frame--3d` (line 81);
  2. no `canvas` in the map section (line 82);
  3. nine 2D markers;
  4. three.js never fetched;
  5. no render plan in the HTML or the flight data.

## 2. Falsified against the review build

**The subject** is the local review build, which is exactly the defect the test exists to catch: a page that mounts the diagram while the committed plan is unverified.
- Built with `ESTATE_3D_PREVIEW=1` into `.next-estate3d`, BUILD_ID `VK51yTboc5x7KXWnw1SRm`, from 1299cf0's code.
- Served on :3035.
- It opens the gate by that flag.
- Before the runs, its HTML was checked and carried the render plan (`estate-render-plan/1`).

**The config** is session scratch: `node_modules/.cache/pw-falsify/canvas.config.mjs`. It points the committed spec at :3035, on the Desktop Chrome project, with no retries. Both runs were made on 2026-09-16.

| run | spec | result | red at |
|---|---|---|---|
| 1 | `tests/estate-3d.spec.ts`, as committed | 1 failed (8.1 s) | line 81, `locator('.estate-map-frame--3d')`: expected 0, received 1; "14 × locator resolved to 1 element" |
| 2 | the same file with line 81 removed and nothing else changed | 1 failed (8.0 s) | the canvas check, `locator('section.estate-map canvas')`: expected 0, received 1; "14 × locator resolved to 1 element" |

- **Preconditions.** Both runs passed the two preconditions first, because both reached the closed-gate branch.
- **What run 2 shows.** The canvas check catches a mount on its own. After the test's own 2.5 s wait, the canvas was there at every poll, starting with the first.
- **What was not run red.** Each run stopped at its first failure. So the marker count, the three.js-fetch check and the render-plan checks were not run red here.
- **The temporary copy.**
  - A script wrote run 2's copy, `tests/estate-3d-canvas-only.falsify.spec.ts`. It refused to write it unless line 81 was the frame check and line 82 the canvas check.
  - The copy was deleted straight after the run, and `git status` then showed no trace of it.

## 3. Production

The target is `https://thalasses-villas-redesign.vercel.app`, main at 2ff36f8 (Vercel status: success).
- No site code changed after 1299cf0. `git diff --stat 1299cf0 2ff36f8` touches only DECISIONS.md, `qa/perf/` and `scripts/estate-inp.mjs`.
- So these runs check step B's code as deployed.

### 3.1 `check-estate-gate`, 12:46:31Z, verbatim

```
check-estate-gate https://thalasses-villas-redesign.vercel.app/en/the-estate at 2026-09-16T12:46:31.081Z
committed plan: gate CLOSED — not owner-verified: compound, thoi, persi, eeanthe, melia, thoi-pool, persi-pool, melia-pool, eeanthe-pool, rituals-pool, beach-line, helipad, helipad-apron, rituals-venue, lane
HTML 200: 9 markers, render plan absent
flight data 200: render plan absent
PASS: the deployment serves what the committed plan's gate decides
```

Exit code 0.
- **Markers.** The script counts markers in the HTML only, and fails only if there are none. It does not require nine.
- **The flight data.** It checks the flight data's HTTP status and whether it carries the render plan.
- **No redirect.** The flight-data request was not redirected, since the script would have printed the redirect.

### 3.2 The public-build tests against production, from 12:53:40Z

**The run.** The same config, with `CANVAS_BASE` set to production and `--grep-invert "static prerender"`.
- **Why that test is excluded.** It reads the local `.next` directory, so it says nothing about a deployment.
- **What was removed from the output.** Node's `NO_COLOR` warning, PowerShell's wrapping of it, and blank lines. The start time is in the heading. The rest is verbatim:

```
Running 3 tests using 1 worker
  ok 1 [chromium] › tests\estate-3d.spec.ts:50:7 › 3D estate map — the public build › three.js is not in the page's initial scripts (1.3s)
  ok 2 [chromium] › tests\estate-3d.spec.ts:60:7 › 3D estate map — the public build › the gate follows the plan's provenance, and while it is closed the 3D canvas never mounts (5.0s)
  ok 3 [chromium] › tests\estate-3d.spec.ts:121:9 › 3D estate map — the public build › under reduced motion › the 2D map stays, and three.js is never fetched (3.2s)
  3 passed (10.6s)
```

### 3.3 Where three.js is, 12:54–12:55Z, and 13:21Z

- **Initial scripts.** The estate page's HTML names 12 initial scripts, and none contains `WebGLRenderer`.
- **The gate hook.** One of those scripts carries it.
  - It returns without loading anything when the page passes no render plan, which is the case while the gate is closed.
  - It also returns under reduced motion, with Data Saver on, or without WebGL2.
  - Otherwise it waits for an IntersectionObserver with a 600 px margin, then calls Turbopack's async loader `11252`.
- **The chunk.** Loader `11252` fetches `/_next/static/immutable/chunks/40_g4nck4qwrd.js`.
  - The chunk answers HTTP 200: 559,796 B decoded, and it contains `WebGLRenderer`.
  - That is the size D-027 records for step B's lazy chunk.
- **The chunk's name** appears exactly once among the page's HTML and its 12 initial scripts (13:21Z): in the script that holds loader `11252`'s entry. No other lazy chunk was searched.
- **The review build's path doesn't carry over.** Its path for the same chunk, `/_next/static/chunks/04r_x7_oxlpca.js`, is 404 on production, because production serves chunks under `static/immutable/chunks/` with a different name.
- **So:** step B's 3D code is deployed, and with the gate closed the hook returns before its loader.
  - In the visit in §3.2 (test 2), no response carrying three.js had arrived by the time of the fetch check. That check runs after the 2.5 s wait, with the map in range.
  - The test listens for responses, not requests. That no request is made at all rests on the code reading above, together with the absent render plan (§3.1).

**The probes are session scratch:**
- `chunk-probe.mjs`, for the initial scripts;
- `loader-probe.mjs`, for the gate hook;
- `loader-probe2.mjs`, for loader `11252` and the chunk;
- `prod-framer-preload.mjs`, for the name search.

## 4. What had no committed record before this file

- **The production checks after the 844e862 and 1299cf0 deploys.** The session ran `check-estate-gate` against production after each deploy. Its log records a pass both times, at 2026-09-14T17:11:40Z and 20:54:41Z. Neither output was committed.
- **"The estate page's chunks include `WebGLRenderer`."** This was a session-only claim, made after 844e862.

§3 records the same kinds of check on today's deployment, whose site code is 1299cf0's. The earlier outputs stay session-only. The 844e862 deployment ran different site code, with a different chunk.

## 5. Limits

- **When a mount is caught.** A count-of-zero assertion passes at its first poll.
  - A diagram that mounted after the test's 2.5 s wait would pass lines 81–82.
  - Line 84 (three.js fetched) would catch it only if the chunk's response had already arrived by then, and its body had been read.
  - On this machine, on the unthrottled Desktop Chrome project that `npm run qa` uses, the diagram was mounted at the first poll.
- **One falsification subject:** a build that opens the gate by the review flag. Other ways the gate could open wrongly were not built for this record.
- **Production coverage.** One visit per test, Chromium only, from one machine.
