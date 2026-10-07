# Hyperframes scenes (HTML + CSS + GSAP): default engine for new scenes

## Declare
`project.json → scenes[i]`: `{"id":"S03","label":"…","start":241,"end":361,"engine":"hyperframes","src":"hf/S03.html"}`.
No `scenes/index.ts` entry is needed. A project may mix HTML and TSX scenes.

## Timing model
- The Studio stages the file per ratio and sets the root `data-width`, `data-height`, `data-start="0"` and `data-duration` (= scene length + 8 frames before + 8 after, the crossfade overlap). Don't hard-code them.
- Clip time 0 = 8 base frames **before** the cut. The cut beat is `SAMI.t0` (≈ 0.267 s). Use `SAMI.beat(n)` = cut + n × 0.5 s (120 BPM) and `SAMI.bar(n)` = 4 beats.
- Everything must be a pure function of timeline time: GSAP timelines (paused, registered) and CSS driven by them. No `Math.random`, `Date`, `requestAnimationFrame`, `setInterval`, CSS `@keyframes` with `animation` (not seekable), or autoplaying video.

## Paths (relative to the project root)
| Path | What |
|---|---|
| `public/img/x.jpg`, `public/video/…` | project media |
| `hf/parts/x.css`, `hf/x.svg` | files next to scenes |
| `lib/<kind>/<file>` | shared SAMI_Library (e.g. `lib/img/textures/paper.jpg`) |
| `_fonts/<family>/<weight>.css` | local fonts (fontsource): `be-vietnam-pro`, `inter`, `jetbrains-mono`, `anton`, `fraunces`, `playfair-display`, `montserrat`, `oswald`, `dm-sans`, `space-grotesk`, `bricolage-grotesque`, `caveat`, `cormorant`, `lora`, `nunito`, `roboto`, `fredoka`, `archivo-black`, `dm-serif-display`, `ibm-plex-mono`, `silkscreen`, `vt323` |
| `_gsap/gsap.min.js` | GSAP 3 (auto-injected; plugins: `_gsap/MotionPathPlugin.min.js`, `_gsap/DrawSVGPlugin.min.js`, `_gsap/SplitText.min.js`, …) |
| `_sami/sami.css`, `_sami/sami-hf.js` | SAMI runtime (auto-injected) |

## `window.SAMI` runtime (`lib/hf/sami-hf.js`)
| API | Use |
|---|---|
| `SAMI.copy`, `SAMI.text(key)`, `SAMI.html(key)` | copy values from the Chữ tab. `*word*` → `<em class="hl">` gradient, ` / ` → line break |
| `data-copy="KEY"` on an element | auto-filled with `SAMI.html(KEY)`; **live-updates** while the user types in Studio |
| `SAMI.timeline()` | paused GSAP timeline (default ease = SAMI.EASE), registered on `window.__timelines`, length = clip |
| `SAMI.EASE`, `SAMI.bezier()` | the ONE easing |
| `SAMI.beat(n)`, `SAMI.bar(n)`, `SAMI.t0`, `SAMI.dur`, `SAMI.fps` | grid + timing |
| `SAMI.arrive(tl, target, at, {dist, blur, dur, stagger})` / `SAMI.leave(…)` | standard rise + un-blur + fade (same as TSX `arrive`) |
| `SAMI.words(el)` | split into `span.w` for word stagger (keeps highlight) |
| `SAMI.fit(el, maxW)` | shrink font to fit a width (measured once) |
| `SAMI.ratio`, `SAMI.w`, `SAMI.h`, `SAMI.portrait/square/landscape`, `SAMI.pick({'16:9':a,'9:16':b,default:c})`, `SAMI.SAFE` | per-ratio layout; CSS: `[data-ratio="9x16"] .x {…}`, vars `--safe-top/bottom/side`, `--w`, `--h` |
| `SAMI.rnd(seed)` | deterministic random |
| CSS vars `--c-navy, --c-mint, --c-purple, --c-text, --c-muted, --c-line, --grad, --f-head, --f-ui, --f-mono` | brand from `project.json → brand` |
| classes `.clip .safe .center .card .mono em.hl` | base layout helpers |

## Skeleton
```html
<!doctype html>
<html><head>
<link rel="stylesheet" href="_fonts/be-vietnam-pro/800.css">
<style>
  #stage { position:absolute; inset:0; background: var(--c-navy); }
  #head { position:absolute; left:var(--safe-side); right:var(--safe-side); top:40%; font-weight:800; font-size:150px; letter-spacing:-.04em; text-align:center; }
  [data-ratio="9x16"] #head { font-size:120px; }
</style></head>
<body>
<div id="root" data-composition-id="S03">
  <div id="stage" class="clip"><div id="head" data-copy="S03_headline"></div></div>
</div>
<script>
  const S = window.SAMI, tl = S.timeline();
  S.arrive(tl, S.words(document.getElementById('head')), S.beat(0.5), {stagger: 0.2});
</script>
</body></html>
```
Full examples: `<app>/templates/hf-starter/hf/H01–H03.html` (drawn-in-code SVG grid, stroke-drawn icons, ring, counters).

## Drawn in code
SVG `stroke-dasharray/offset` animated by the timeline, `<canvas>` drawn in a GSAP `onUpdate` from the timeline's time (never rAF), CSS transforms. Shared blocks go in `<app>/lib/hf/` (`_sami/…`). Keep text in copy, never baked into images.

## Video/images inside an HTML scene
`<video src="public/video/x.mp4" muted playsinline class="clip" data-start="0.5" data-duration="3" data-media-start="2">`: Hyperframes extracts frames for frame-accurate renders (preview shows the live element). Sound always via `project.json → audio`.

## Check
`node <app>/server/cli-validate.mjs .` (timeline, CDN, random, missing files) → `cli-still` (fast snapshot) → Studio preview. `POST /api/hf/lint {id, scene}` runs Hyperframes' own linter.
