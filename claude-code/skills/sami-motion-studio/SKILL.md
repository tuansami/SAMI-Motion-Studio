---
name: sami-motion-studio
description: Make or revise SAMI motion-graphics videos in a SAMI Motion Studio project (project.json + hf/ HTML scenes or scenes/ TSX) for 16:9/9:16/1:1/4:5 — brief, storyboard on the 120 BPM grid, Hyperframes (HTML+CSS+GSAP, default) or Remotion scenes, shared SAMI_Library assets, SFX/music cues, stills QA, Studio export (NVENC). Use for any Studio video project, template or scene.
---

# SAMI Motion Studio (v0.6+)

Premium motion ads for SAMI Marketing Agency and its hospitality clients (restaurants, nail, spa, hotels). Owner Tuấn (CEO): reply in Vietnamese, concise, push back when a request hurts conversion or brand. Write "SAMI" in capitals.

## Where things are
- **App:** `Z:\SAMI_Video\SAMI_Motion_Studio` only (never a D: copy). UI http://localhost:5178 (user starts it with `Start-Studio.bat`; don't start the server yourself). Check `package.json` version + top of `CHANGELOG.md` before relying on this file.
- **Shared library:** `Z:\SAMI_Video\SAMI_Library` (music, SFX, voice, img, video, lottie, fonts, luts, masks, brands) → reference as `lib:<kind>/<file.ext>`. See `references/library.md`.
- **Cache (always deletable):** `Z:\SAMI_Video\.sami-cache`. `node <app>/tools/cleanup.mjs` (dry run) / `--apply`.
- **Project** = folder with `project.json`, `hf/` (HTML scenes) and/or `scenes/` (TSX), `public/{img,video,audio,lottie,fonts}`, `brief/` (BRIEF, TRANG_THAI, SCRIPT_STORYBOARD, GOP_Y), `out/`, `CLAUDE.md`.
- **Naming:** folder, `project.json name` and exports = `YYMMDD-V<NN>-<tieu-de-khong-dau>-v.<n>` (e.g. `261007-V22-maps-cuoi-nam-berlin-v.1`). Next free V-number from `<app>/projects`; a new version keeps V and bumps `v.N`.

## Session protocol (token-safe, mandatory)
1. One video = one project folder = one fresh session; work only inside it.
2. Read in order: `CLAUDE.md` → `brief/TRANG_THAI.md` → only the files the task names.
3. Never read `node_modules/`, `out/`, `public/_engine|_lib|_hf/`, other projects, app engine code (unless an error points there), whole videos. Look only at stills you need.
4. End every session by updating `brief/TRANG_THAI.md` (stage · locked decisions · next · client feedback by round · tech notes), ≤ 1 page.
5. Stop and ask when the brief lacks a deciding fact (CTA, language, ratios, which assets are real) or contradicts "Đã chốt".

## Pick the engine (per scene)
| Scene needs | Engine | File |
|---|---|---|
| Kinetic type, cards, icons, charts, drawn-in-code SVG/Canvas, transitions, carousel slides — **default for every NEW scene** | **Hyperframes** (HTML + CSS + GSAP, web-core, Apache-2.0) | `hf/<ID>.html` + `{"engine":"hyperframes","src":"hf/<ID>.html"}` |
| Existing v1 projects; scene already in TSX; heavy React logic or reuse of TSX helpers in `lib/remotion` | **Remotion** | `scenes/<ID>.tsx` + `scenes/index.ts` |
Both engines live in one timeline: crossfades, warp (TSX only), titles, subtitles, overlays, audio and film look are applied by the Studio to every scene. Details: `references/hyperframes.md`, `references/remotion.md`, `references/mixing.md`.

## Decide the job
| Request | Who / where |
|---|---|
| Wording, scene length, titles, subtitles, SFX, colours, logo/watermark/arrows/Lottie, export | **User in Studio** (tell them the tab) |
| New/changed visual, new scene | `hf/<ID>.html` (default) or `scenes/<ID>.tsx`, plus `project.json → scenes/copy` |
| New text field | `project.json → copy.<ID>_<name>` with a Vietnamese `label` saying WHERE it appears |
| Music / SFX / voice | `references/audio-sfx.md` — library first (`lib:sfx/…`), cue on the beat grid |
| Images / video / music / voice to find or generate | `references/providers.md` (MCP `sami-media`): library → stock → browser subscriptions → paid API only after estimate + Tuấn's OK |
| Reusable template | `<app>/docs/TEMPLATE_STANDARD.md`; `node <app>/server/cli-template.mjs check templates/<id>` without ✗ |
| Motion carousel (Instagram/Facebook slides that move) | skill **sami-carousel** (`type: "carousel"`, one loop MP4 per slide) |
| Whole new video | Studio "Tạo dự án mới" from a template (`hf-starter` for HTML scenes) + client asset folder; never copy an old project |
| Client feedback round | `brief/TRANG_THAI.md → Phản hồi khách (vòng N)`: do [Claude] lines, point [Studio] lines to the tab |

## Workflow (⛔ = wait for OK)
1. **Brief** ⛔: read `brief/`; ≤ 4 questions (audience/language, CTA + contact, length + ratios, which assets are real).
2. **Script + storyboard** ⛔: `brief/SCRIPT_STORYBOARD.md`, table on the 120 BPM grid (beat = 15 base frames = 0.5 s, cuts at 15n+1): scene · seconds · on-screen copy · motion · engine · SFX. Reading time: 6–10 words ≥ 1.5 s, stat ≥ 2 s, key offer ≥ 3 s. Copy must sound spoken. No code before approval.
3. **Data**: `project.json` scenes (contiguous, `engine`/`src` for HTML scenes), labelled copy, `formats`, audio cues (whoosh only on chapter cuts, typing in hook, pop on CTA, sub_hit on final logo).
4. **Scenes**: one file each, rules per engine (references). Sequential by default; ≥ 6 new scenes AND user wants speed → workflow `.claude/workflows/sami-motion-video.js`.
5. **QA** ⛔: `node <app>/server/cli-validate.mjs .` without ✗ → stills in every ratio `node <app>/server/cli-still.mjs . out/qa/S03.jpg 20,60,110 9:16` (HTML scenes use a fast snapshot; add `--exact` to see the final composite with titles) → Read them. Check clipping, diacritics, < 20 px text, dead frames, beat landings, invented numbers. `references/qa.md`.
6. **Hand-off**: user exports in Studio (FHD/2K/4K, 24/30/60, NVENC). HTML scenes render once into cached clips (`public/_hf`). Don't render finals in the cloud. Update `TRANG_THAI.md`.

## Exporting from Claude Code (Studio 0.8.1+) — ONLY when Tuấn asks in chat
- **Never start a render on your own** (not for QA, not "to check", not after finishing scenes). Stills (`cli-still`) are the QA tool. Render only when Tuấn's message asks to export / render / xuất video.
- Command (run in the background, wait for the completion notice, don't poll):
  `node <app>/server/cli-render.mjs <project dir> --request "<Tuấn's request, verbatim>" [--ratio 9:16] [--res 540p|FHD|2K|4K] [--fps 30] [--codec h264|h265] [--scene S03] [--draft]`
- It refuses unless the Studio switch "Cho phép Claude Code xuất video" (tab Xuất) is ON. If off: tell Tuấn; only if he says to turn it on: `node <app>/server/cli-render.mjs --enable --request "<his words>"`. Check with `--status`.
- Studio open → the job joins the Studio queue (visible, cancellable). Studio closed → renders in the CLI process. Same engine, same NVENC. Every enable/render is logged in `<app>/.studio/cli-render.log`.

## House rules
One easing `cubic-bezier(0.22,1,0.36,1)` (`tw/keys/arrive` in TSX, `SAMI.EASE`/`S.arrive` in HTML) · crossfade every cut (engine) · grain + vignette once (engine) · few SFX · cut ruthlessly · no raw screenshots as content (exception: videos about Google services may show real Maps/Ads UI in a phone frame, approved 2026-10-07) · no invented stats · no other agencies' work · no platform logos (exception: real Google logo in videos about Google services) · German on-screen text for the DE market, Southern Vietnamese female voice when there is VO · SAMI end card: lockup + "Strategy • Automation • Marketing • Intelligence" + WhatsApp + URL (client videos: client logo + CTA) · no em-dash in on-screen copy.

## Gotchas
- Never `Math.random`/`Date`/`requestAnimationFrame`/`setInterval` in scenes (HTML or TSX): renders are seeked frame by frame. Use `rnd()` / `SAMI.rnd()` and timelines.
- TSX: never `useCurrentFrame()` (breaks 24/60 fps) → `useT()`; read `COPY.X` inside the component; `<Words>/<Counter>/<TypeLabel>` + `OV`.
- HTML: register the timeline (`SAMI.timeline()`), bind text with `data-copy="KEY"` (live-editable in Studio), lay out per ratio with `[data-ratio="9x16"] …`, load fonts/GSAP locally (`_fonts/…`, `_gsap/…`), never from a CDN.
- All sound lives in `project.json → audio` (no `<Audio>`/unmuted video in scenes). Logos/watermarks/arrows/Lottie belong in `overlays`.
- User-pickable media in TSX: `media('img/x.jpg' | 'lib:img/x.jpg')` from `@engine/core/media`, not `staticFile`.
- Vietnamese stacked diacritics clip in masks: keep padding/line-height.
- Paid generation (ElevenLabs music/voice, image/video APIs) → state cost, get OK. NEVER generate images with the ElevenLabs connector unless Tuấn asks in text; stock first; batches via ChatGPT (5 images per prompt) or Gemini nano banana in the browser (Tuấn logs in).
- GPU: Studio 0.6 probes NVENC correctly (0.5's probe always failed → CPU). Diagnose: tab Xuất → Chẩn đoán GPU. ProRes is CPU.

## References (read only what the task needs)
`references/hyperframes.md` (HTML scene API + skeleton) · `references/remotion.md` (TSX scenes) · `references/mixing.md` (both engines, clips, stills) · `references/schema.md` (project.json fields) · `references/library.md` (SAMI_Library, `lib:` URIs, licences) · `references/audio-sfx.md` (grid, cues, music edit, voice ducking) · `references/assets.md` (stock/AI generation rules) · `references/qa.md` (validate, stills, lint, export checks) · `references/render-ffmpeg.md` (GPU, formats, cache cleanup).
