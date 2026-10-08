# Slide anatomy + CX toolkit

Every slide = `slides/<ID>.html`, declared in `project.json → scenes[]` as `{"id":"C02","start":180,"end":360,"engine":"hyperframes","src":"slides/C02.html","cues":[…]}` (frames @30; 180 = 6 s). The Studio injects `window.SAMI` (copy, brand, `slide {index,count,start,total}`, `carousel {series,handle,theme,swipe}`, `photo`), `_sami/sami.css`, `carousel.css`, GSAP, `sami-hf.js`, `carousel.js` (`window.CX`).

```html
<!doctype html><html><head>
<link rel="stylesheet" href="_fonts/be-vietnam-pro/900.css"> <!-- + 500/700/800, jetbrains-mono/600 -->
<link rel="stylesheet" href="slides/_shared.css">            <!-- template layout: #kick #big #small #demo #pin #fx -->
<style>/* slide-specific */</style></head><body>
<div id="root" data-composition-id="C02">
  <div id="frame">
    <canvas id="grid" class="cx-grid" width="1080" height="1350"></canvas>
    <div id="kick" class="cx-kicker" data-copy="C02_kicker"></div>
    <div id="big" class="cx-big" data-copy="C02_big"></div>
    <div id="small" class="cx-small" data-copy="C02_small"></div>
    <div id="demo">…</div>
    <div class="cx-triplet" data-copy="C02_triplet"></div>
    <div id="fx"></div>
  </div>
</div>
<script src="slides/_pin.js"></script>
<script>
  const S = window.SAMI, X = window.CX; S.bindCopy();
  const frame = document.getElementById('frame'), chrome = X.chrome(frame);
  const grid = X.grid(document.getElementById('grid'), {color: '#ffffff', alpha: 0.16});
  const pin = makePin(frame);
  const path = pinPath({land: {t: 1.0, x: 540, y: 730}, entryY: 640, hops: [{t: 2.0, x: 540, y: 730, h: 90}], exit: 4.9, exitY: 640});
  let chars = []; const layout = X.ready(() => { chars = bigWord(document.getElementById('big'), 936); });
  X.loop((t) => { layout(); chrome(t); drawPin(pin, path, t, 730); grid(t, [{t: 1.0, x: 540, y: 730}], 1); /* … */ });
</script></body></html>
```

| CX | Use |
|---|---|
| `X.loop(render)` | registers the slide timeline; `render(t)` every frame, t in seconds |
| `X.ready(fn)` | run once when fonts are loaded (measure/fit text here) |
| `X.chrome(frame, {series, swipe:false})` | topbar `series · 0N / 0M`, hairline, Swipe pill (auto-hidden on the last slide), progress bar continuing across the carousel; returns `update(t)` |
| `X.tw(t,a,b)`, `X.prog`, `X.ease` (SAMI EASE), `X.inOut`, `X.lerp`, `X.clamp` | timing |
| `X.kick(dt,f,d)` / `X.settle(dt,f,d)` / `X.pulse(t,c,w)` / `X.wave(t,period)` | spring impulse, overshoot settle, gaussian, loop-safe periodic |
| `X.path([{t,x,y,h,ease,land}])` → `.at(t)`, `.body(t)` | hopping paths with squash/stretch; `X.place(el, body, w, h)` |
| `X.grid(canvas,{gap,color,alpha})` → `draw(t, ripples[{t,x,y,a}], breathe)` | dot grid with shockwaves |
| `X.burst(parent, n, seed)` → `draw(t, t0, x, y, life)` | deterministic particles |
| `X.count(el, t, t0, t1, from, to, {suffix, decimals})` | count-up (de-DE) — must be back at the frame-0 value by the loop end, or keep frame 0 = final value |
| `X.fit(el, maxW, max, min)`, `X.type(el, text, t, t0, cps)`, `X.hash(n)` | text fitting, typing, deterministic random |
| template `_pin.js`: `makePin(frame)`, `pinPath({entry:'drop'|'left', land, hops, exit, exitY})`, `drawPin(pin, path, t, groundY)`, `bigWord(el, maxW)` | protagonist + BIG WORD letters |

Themes: `carousel.theme` = `sami` (brand navy/mint/purple) · `cream` · `tomato` · `forest` · `noir` → CSS vars `--k-bg --k-bg2 --k-ink --k-dim --k-accent --k-accent2 --k-line`.
Blank slide (Studio 1.2.1, ＋ Thêm slide → Slide trống): `slides/<ID>.html` from `lib/hf/carousel-blank.html` (chrome + `#txt` with copy `<ID>_kicker/_big/_small`). When Tuấn asks "viết slide P04: …", rewrite that file in place (keep the chrome, copy keys, seamless loop).
Photo slides: `slides/photo.html` (from `lib/hf/photo-slide.html`) + `scene.photo {img, hit, push, shine, motes, kick, focus:[x,y]}`.
Full photo mode (1.1, OpenCV): `carousel-new.mjs` runs `lib/py/sami_layers.py <img> public/img/layers/<ID>/` per image → `photo.layers {dir, text:[{file,x,y,w,h}], subject:{file,bbox,area}|null}` + `depth` (subject parallax, 0.025) + `pop` (text blocks pop on the hit, staggered 0.12 s, 0.05). Layers only scale UP around themselves → no inpainting, frame 0 = original. Subject is dropped when GrabCut is not trustworthy (solidity < 0.72, less texture than the background, < 6 % or > 65 % of the frame). `--no-layers` = old light mode. Studio 1.2: tab Chữ → "🎞 Ảnh động" shows the found layers (red = text blocks, green = subject), re-splits (`POST /api/carousel/layers {id, scene, noSubject?}`), and has sliders for hit / push / depth / pop / motes + shine / kick: tell the user to tune there. Re-split one image: `python <app>/lib/py/sami_layers.py public/img/P03.jpg public/img/layers/P03/` and copy `layers.json` into the scene.
