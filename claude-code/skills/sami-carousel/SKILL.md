---
name: sami-carousel
description: Make "live" motion carousels for Instagram/Facebook/LinkedIn in SAMI Motion Studio — every slide is a seamless-loop 4:5 MP4 (1080×1350, 30 fps) with its own sound, built in HTML+CSS+GSAP (Hyperframes). Two modes, from a topic (motion) or from finished slide images (photo). Use whenever someone wants an animated/moving/video carousel, to animate carousel slides, or add motion, music or SFX to carousel images.
---

# SAMI live carousel (Studio 0.7+)

A carousel post where each slide is a short looping video instead of a still. People swipe, every slide moves, the beat carries on. Reply to Tuấn in Vietnamese; on-screen copy for the DE market is German. Write "SAMI" in capitals.

## Where
- App `Z:\SAMI_Video\SAMI_Motion_Studio` (`<app>`). A carousel is a normal Studio project with `project.json → "type": "carousel"`, `formats: ["4:5"]`, and one HTML scene per slide (`slides/<ID>.html`). Preview + Chữ tab work in the Studio as usual; **Xuất** renders the carousel (one MP4 per slide).
- Naming like videos: `YYMMDD-V<NN>-<tieu-de>-v.<n>`, folder in `<app>/projects`.

## Pick the mode
| The user gives… | Mode | Start |
|---|---|---|
| a topic, message, notes | **motion** | `node <app>/tools/carousel-new.mjs <app>/projects/<name> --name "<name>" [--theme sami\|cream\|tomato\|forest\|noir] [--handle …]` → 5-slide SAMI template (Google-Maps pin travels through every slide) |
| finished slide images (PNG/JPG) | **photo** | `… carousel-new.mjs <dir> --name "<name>" --images 01.png 02.png …` → each image becomes a slide; frame 0 = the original image, motion = breathing push, light sweep, motes, kick on the hit |
Ask at most one question, only if it changes the whole piece. Defaults: 5 slides (hook, 3 value, CTA), theme `sami`, CTA "Kommentiere KEYWORD", 6 s per slide.

## Workflow (⛔ = wait for OK)
1. **Concept + storyboard** ⛔ in `brief/SCRIPT_STORYBOARD.md`: per slide → BIG WORD, small line, demo/moment, the hit time (on the 0.5 s grid), SFX. Arc: hook (problem in ≤ 4 words) → one rule per value slide → CTA. 3–7 slides (max 20). Find ONE protagonist object for the topic (pin for Maps, coin for money, cursor for UX) that proves each point by moving and exits right / enters left across slides.
2. **Build** (motion): edit `slides/<ID>.html` (demo + choreography) and `project.json → copy` (all text, Vietnamese labels) + `scenes[].cues` (SFX on the frame of each visual hit). Keep the chrome (`X.chrome`), the BIG WORD (`bigWord`), small line, triplet. API: `references/cx-api.md`. Photo mode: tune `scenes[].photo {hit, push, shine, motes, kick, focus}` and cues.
3. **QA**: `node <app>/server/cli-validate.mjs .` (no ✗) → `node <app>/server/cli-carousel.mjs . stills` → Read `out/qa/<ID>_cover.jpg` (frame 0 = thumbnail, must be a finished readable design) and `<ID>_mid.jpg`. Optional `… audio` → listen to `out/carousel/audio/<ID>.wav`.
4. **Render** ⛔ ONLY when Tuấn asks in chat (~1 min per 6 s slide): Studio tab Xuất, or `node <app>/server/cli-render.mjs . --request "<his words>"` (needs the Studio switch "Cho phép Claude Code xuất video"; see sami-motion-studio) → `out/carousel/<stamp>/NN-<ID>.mp4` + `covers/` + `seams/` + `contact-sheet.jpg` + `qa.json` + `preview.html` (Instagram-style swipe preview). Check: every slide has sound, seam PSNR ≥ 22 dB (else look at `seams/<ID>.jpg`: last | first frame), contact sheet top row = covers.
5. **Deliver**: MP4s in order + caption + keyword. Post them together as one carousel; leave the platform's music sticker off (it replaces the slides' sound).

## Rules that keep renders correct
- Pure function of time: everything inside `X.loop(render)`; no `Math.random`/`Date`/rAF/timers (use `X.hash`). Measure text only inside `X.ready(fn)` (fonts loaded).
- **Seamless loop:** slide length = whole bars (4/6/8 s); every effect back at rest before the end; periodic motion must divide the slide (`X.wave(t, period)`); hits ≥ 0.8 s before the end (sound tails wrap to the start).
- **Frame 0 is the thumbnail:** all text fully visible and at rest at t = 0; motion adds life, never reveals the text.
- **Safe zones:** 72 px margin; Instagram overlays top-right counter and bottom-right sound icon.
- Text is code (never baked into images). No invented stats; German copy reads naturally; no em-dash in copy.
- Sound: groove (`carousel.audio.mode: "groove"`), a song continuing across swipes (`"music"`, `music.src` lib:/project, `start` on a downbeat, rights cleared), or SFX only (`"sfx"`). SFX names: `pop click tick whoosh whoosh_in whoosh_out riser impact chime ping notification boop sparkle typing thump swoosh_reverse glitch cash`, or `{"src": "lib:sfx/…"}`. All synthesised locally (numpy), $0.

## References
`references/cx-api.md` (CX toolkit, pin helpers, slide anatomy) · `references/design.md` (layout grammar, themes, copy patterns) · Studio skill `sami-motion-studio` for library, assets, ffmpeg.
