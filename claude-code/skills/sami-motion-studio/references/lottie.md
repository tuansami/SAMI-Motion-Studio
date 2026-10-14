# Lottie inside Hyperframes (HTML) scenes: `SAMI.lottie` (Studio 1.3.1)

Use for animated icons, check marks, loaders, confetti, burst/sparkle effects that GSAP would take long to hand-draw. Not for a logo/watermark layer: that stays a Studio overlay (`project.json → overlays`, kind `lottie`, Remotion export only).

## Use
```html
<div id="ok" style="position:absolute;left:50%;top:40%;width:420px;height:420px;margin:-210px 0 0 -210px"></div>
<script>
  const S = window.SAMI, tl = S.timeline();
  S.lottie(tl, '#ok', {src: 'lib/lottie/check.json', at: S.beat(2), dur: 2.5});   // JSON from SAMI_Library
  // or  {src: 'public/lottie/x.json'}  (project file)  or  {data: {...}}
</script>
```
`S.lottie(tl, el|selector, {src|data, at=0, dur, loop=false, speed=1, fit='xMidYMid meet'})` → the lottie-web animation.
- `at`/`dur` are seconds on the clip time (same as GSAP positions; `S.beat(n)` works). Hidden before `at`, hidden after `at+dur` when `dur` is set, otherwise holds the last frame.
- `loop:true` repeats; `speed` scales playback. Size and position come from the container's CSS (the SVG fills it, `fit` = `preserveAspectRatio`). Animate the container with GSAP (arrive/scale/opacity) like any element.
- Studio injects `_lottie/lottie_svg.min.js` (lottie-web 5.13, SVG renderer) when the scene text contains `SAMI.lottie`, `data-lottie` or `_lottie/`. Never load it from a CDN (validate warns).

## Why this is safe for render
Every frame is a pure function of timeline time: a clock tween on `tl` calls `anim.goToAndStop(frame, true)`. Preview scrub, stills and the Hyperframes export give the same pixels (verified: dot position at 4 times matched the formula in snapshot AND `--exact`). The JSON is read with a synchronous XHR so it exists before the first seek.
Do NOT: `autoplay`, `anim.play()`, `loadAnimation` yourself (Hyperframes' built-in Lottie adapter would seek it from time 0 and ignore `at`), `loop` set on the animation, `setSpeed`, `Date`/rAF.

## Rules
- Prefer Lottie JSON (no images): `lib:lottie/…` or `public/lottie/`. Lottie with embedded raster assets works, keep them small. Expressions (`ex`) are unsupported by the SVG renderer; export from After Effects without them.
- Colours that must follow the brand: edit the JSON colours once, or wrap the container in a CSS `filter`/`mix-blend-mode`; don't recolour at runtime with random.
- Check: `cli-validate` → `cli-still … 20,40,80` (frames at and after `at`) → look that the first and last frame are right.
- Native export (`--engine native`) accepts this (the scene is plain HTML). It still refuses Studio **overlays** of kind lottie.
- Source of JSON: library first (`SAMI_Library/lottie`), then free packs (LottieFiles free licence, note it in the project). Check the licence before client use.
