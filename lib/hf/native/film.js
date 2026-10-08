/* SAMI Studio 1.0 — "xuất Hyperframes thuần": runtime of the FILM composition (no Remotion).
 * The server (server/hf-native.mjs) writes index.html with <video> elements for every scene clip and footage clip,
 * plus window.FILM (timings, titles, subtitles, overlays, look). This file builds the text/overlay DOM once at load,
 * then ONE paused GSAP timeline drives everything through a clock tween → render(t) (same pattern as carousel.js),
 * so every frame is a pure function of time and Hyperframes can seek it.
 * The maths is a 1:1 port of engine/src: components/Scene.tsx (crossfade), core/Titles.tsx, core/Overlays.tsx,
 * core/Stickers.tsx, core/VideoTrack.tsx (fades), components/Brand.tsx FilmFinish (grain + vignette). Keep them in sync. */
(function () {
  var S = window.SAMI, F = window.FILM, gsap = window.gsap;
  var W = F.w, H = F.h, SHORT = Math.min(W, H), BASE = 30;
  var C = F.colors, GRAD = F.grad;
  var EASE = S.EASE;
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  /** eased tween 0→1 between base frame `start` and `start + dur` (= lib/anim.ts tw) */
  var tw = function (f, start, dur) { return EASE(clamp01((f - start) / Math.max(1, dur))); };
  var hex2rgba = function (hex, a) { var h = String(hex || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + (a == null ? 1 : a) + ')'; };
  var el = function (tag, css, parent) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e; };
  var root = document.querySelector('[data-composition-id]');
  var layer = function (z) { return el('div', 'position:absolute;inset:0;pointer-events:none;z-index:' + z, root); };

  // ── scenes: crossfade + blur (components/Scene.tsx) ──
  var scenes = F.scenes.map(function (s) { return {s: s, v: document.getElementById('sc-' + s.id)}; });
  var renderScenes = function (tb) {
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i].s, v = scenes[i].v; if (!v) continue;
      var f = tb - s.a, dur = s.b - s.a;
      if (f < 0 || f > dur) { v.style.visibility = 'hidden'; continue; }
      var pin = s.fadeIn > 0 ? tw(f, s.delay, s.fadeIn) : 1, pout = s.fadeOut > 0 ? tw(f, dur - s.fadeOut, s.fadeOut) : 0;
      var blur = (1 - pin) * 18 + pout * 18, sc = (1 + (1 - pin) * 0.04) * (1 - pout * 0.03);
      v.style.visibility = 'visible'; v.style.opacity = pin; v.style.filter = blur > 0.2 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none'; v.style.transform = 'scale(' + sc.toFixed(5) + ')';
    }
  };

  // ── footage: fades + pop for framed windows (core/VideoTrack.tsx); markup comes from the server ──
  var foot = F.footage.map(function (c) { return {c: c, w: document.getElementById('ft-' + c.id)}; });
  var renderFootage = function (ts) {
    for (var i = 0; i < foot.length; i++) {
      var c = foot[i].c, w = foot[i].w; if (!w) continue;
      var f = ts - c.at; if (f < 0 || f >= c.len) { w.style.visibility = 'hidden'; continue; }
      var op = Math.min(c.fin ? clamp01(f / c.fin) : 1, c.fout ? clamp01((c.len - f) / c.fout) : 1); // linear, like interpolate()
      w.style.visibility = 'visible'; w.style.opacity = op;
      if (c.framed) w.style.transform = 'scale(' + (c.fin ? 0.92 + 0.08 * clamp01(f / c.fin) : 1) + ')';
    }
  };

  // ── text (core/Titles.tsx) ──
  var textCss = function (s, stageH) {
    s = s || {};
    var css = 'font-family:' + (s.font ? '"' + s.font + '","Be Vietnam Pro",sans-serif' : F.fontHead) + ';font-weight:' + (s.weight || 800) + ';font-size:' + (s.size || Math.round(stageH * 0.06)) + 'px;color:' + (s.color || C.text) +
      ';letter-spacing:' + (s.letterSpacing != null ? s.letterSpacing + 'em' : '-0.02em') + ';line-height:' + (s.lineHeight || 1.15) + ';text-align:' + (s.align || 'center') + ';paint-order:stroke fill;';
    if (s.uppercase) css += 'text-transform:uppercase;'; if (s.italic) css += 'font-style:italic;';
    if (s.stroke) css += '-webkit-text-stroke:' + s.stroke.width + 'px ' + s.stroke.color + ';';
    if (s.shadow) css += 'text-shadow:0 4px 18px rgba(0,0,0,0.55),0 1px 3px rgba(0,0,0,0.6);';
    if (s.bg) css += 'background:' + hex2rgba(s.bg.color, s.bg.opacity == null ? 0.8 : s.bg.opacity) + ';border-radius:' + (s.bg.radius == null ? 14 : s.bg.radius) + 'px;padding:' + (s.bg.padY == null ? 12 : s.bg.padY) + 'px ' + (s.bg.padX == null ? 22 : s.bg.padX) + 'px;-webkit-box-decoration-break:clone;box-decoration-break:clone;';
    return css;
  };
  var parse = function (text) { var on = false; return String(text || '').split(' ').map(function (w) { if (w === '/') return {w: '/', hl: false}; var x = w, hl = on; if (x.charAt(0) === '*') { on = true; hl = true; x = x.slice(1); } if (x.slice(-1) === '*') { x = x.slice(0, -1); on = false; } return {w: x, hl: hl}; }); };
  /** one text block → {render(tb)}: item {text,start,end,anim,out,style}, pos {x,y}, mw (px) */
  var makeLine = function (it, x, y, mw, parent) {
    var wrap = el('div', 'position:absolute;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);width:' + mw + 'px;display:flex;justify-content:center;visibility:hidden', parent);
    var st = it.style || {}, stageH = SHORT * 1.35, anim = it.anim || 'rise', hlColor = st.highlight;
    var box = el('div', 'max-width:' + mw + 'px;' + textCss(st, stageH), wrap);
    var baseColor = st.color || C.text;
    var s0 = it.start * BASE, s1 = it.end * BASE;
    var words = [], typer = null;
    if (anim === 'typewriter') { typer = {el: el('span', 'white-space:pre-wrap', box), text: String(it.text).replace(/\*/g, '').replace(/ \/ /g, '\n')}; }
    else {
      var P = parse(it.text), n = P.filter(function (w) { return w.w !== '/'; }).length || 1, k = -1;
      P.forEach(function (wd) {
        if (wd.w === '/') { box.appendChild(document.createElement('br')); return; }
        k++;
        var outer = el('span', 'display:inline-block;white-space:pre', box), inner = el('span', 'display:inline-block', outer);
        inner.textContent = wd.w; if (k < n - 1) outer.appendChild(document.createTextNode(' '));
        if (wd.hl) { if (hlColor) inner.style.color = hlColor; else { inner.style.background = GRAD; inner.style.webkitBackgroundClip = 'text'; inner.style.backgroundClip = 'text'; inner.style.color = 'transparent'; } }
        words.push({o: outer, i: inner, k: k, n: n, hl: wd.hl});
      });
    }
    var perWord = Math.min(6, (s1 - s0) / ((words.length || 1) + 2));
    return function (tb) {
      if (tb < s0 - 1 || tb > s1 + 1) { wrap.style.visibility = 'hidden'; return; }
      wrap.style.visibility = 'visible';
      var outP = it.out === 'none' ? 0 : tw(tb, s1 - 10, 10), whole = tw(tb, s0, 14);
      var tr = []; if (anim === 'pop') tr.push('scale(' + (0.85 + whole * 0.15) + ')'); if (anim === 'slide') tr.push('translateX(' + ((1 - whole) * -60) + 'px)'); if (it.out === 'rise') tr.push('translateY(' + (-outP * 30) + 'px)');
      box.style.opacity = 1 - outP; box.style.transform = tr.join(' ');
      if (typer) { typer.el.textContent = typer.text.slice(0, Math.floor(Math.max(0, tb - s0) * 1.2)); return; }
      for (var j = 0; j < words.length; j++) {
        var w = words[j], p = 1, k2 = w.k;
        if (anim === 'words' || anim === 'rise') p = tw(tb, s0 + k2 * (anim === 'rise' ? 3 : perWord), 16);
        else if (anim === 'fade' || anim === 'pop' || anim === 'slide') p = tw(tb, s0, 14);
        else if (anim === 'karaoke' || anim === 'highlight') {
          var ws = s0 + ((s1 - s0 - 8) * k2) / w.n, we = s0 + ((s1 - s0 - 8) * (k2 + 1)) / w.n, active = tb >= ws && tb < we, said = tb >= ws;
          p = tw(tb, s0, 8);
          // same precedence as the React spread {...hlStyle, ...extra}: karaoke colour always wins; highlight only while active
          var hlCol = w.hl ? (hlColor || 'transparent') : '';
          if (anim === 'karaoke') { w.i.style.color = active ? (hlColor || C.mint) : said ? baseColor : hex2rgba(String(baseColor).charAt(0) === '#' ? baseColor : '#ffffff', 0.45); w.i.style.transform = 'scale(' + (active ? 1.06 : 1) + ')'; }
          else { w.i.style.background = active ? (hlColor || C.mint) : (w.hl && !hlColor ? GRAD : ''); w.i.style.color = active ? C.navyDeep : hlCol; w.i.style.borderRadius = active ? '8px' : ''; w.i.style.padding = active ? '0 0.12em' : ''; w.i.style.margin = active ? '0 -0.06em' : ''; }
        }
        if (anim === 'rise' || anim === 'words') { w.o.style.transform = 'translateY(' + ((1 - p) * 60) + '%)'; w.o.style.opacity = p; w.o.style.filter = p < 0.99 ? 'blur(' + ((1 - p) * 8).toFixed(2) + 'px)' : 'none'; }
        else w.o.style.opacity = p;
      }
    };
  };

  // ── stickers (core/Stickers.tsx): [kind, d|args, segA, segB, fill] in viewBox 0 0 100 100 ──
  var ST = {
    arrow: [1, [['p', 'M10 50 L86 50', 0, 0.7], ['p', 'M64 28 L88 50 L64 72', 0.55, 1]]],
    'arrow-curve': [1, [['p', 'M12 78 C 22 30, 60 18, 84 30', 0, 0.75], ['p', 'M66 16 L86 31 L68 48', 0.6, 1]]],
    circle: [1.6, [['p', 'M52 14 C 18 12, 4 34, 8 54 C 12 80, 58 90, 84 78 C 104 68, 98 30, 70 18 C 58 13, 40 14, 30 20', 0, 1]]],
    underline: [5, [['p', 'M4 60 C 30 40, 60 70, 96 44', 0, 1]]],
    tap: [1, [['tap']]],
    check: [1, [['p', 'M18 54 L40 76 L84 26', 0, 1]]],
    cross: [1, [['p', 'M22 22 L78 78', 0, 0.55], ['p', 'M78 22 L22 78', 0.45, 1]]],
    star: [1, [['p', 'M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z', 0, 1, true]]],
    heart: [1, [['p', 'M50 86 C 18 64, 6 44, 14 28 C 22 12, 44 12, 50 30 C 56 12, 78 12, 86 28 C 94 44, 82 64, 50 86 Z', 0, 1, true]]],
    'swipe-up': [0.8, [['p', 'M26 78 L50 56 L74 78', 0, 0.5], ['p', 'M26 56 L50 34 L74 56', 0.25, 0.75], ['p', 'M26 34 L50 12 L74 34', 0.5, 1]]],
    sparkle: [1, [['p', 'M50 10 C 54 40, 60 46, 90 50 C 60 54, 54 60, 50 90 C 46 60, 40 54, 10 50 C 40 46, 46 40, 50 10 Z', 0, 1, true]]],
    pin: [1, [['p', 'M50 90 C 30 64, 20 50, 20 36 C 20 18, 34 8, 50 8 C 66 8, 80 18, 80 36 C 80 50, 70 64, 50 90 Z', 0, 1], ['dot']]],
  };
  var NS = 'http://www.w3.org/2000/svg';
  var svgEl = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  var makeSticker = function (id, color, stroke, parent) {
    var def = ST[id] || ST.arrow, vbH = 100 / def[0], y0 = (100 - vbH) / 2;
    var svg = svgEl('svg', {viewBox: '0 ' + y0 + ' 100 ' + vbH, style: 'width:100%;height:auto;display:block;overflow:visible'}, parent);
    var parts = def[1].map(function (d) {
      if (d[0] === 'tap') { var ring = svgEl('circle', {cx: 50, cy: 50, fill: 'none', stroke: color, 'stroke-width': stroke * 0.8}, svg), dot = svgEl('circle', {cx: 50, cy: 50, r: 9, fill: color}, svg); return function (p) { ring.setAttribute('r', 10 + 30 * p); ring.setAttribute('opacity', 1 - p * 0.85); dot.setAttribute('opacity', Math.min(1, p * 3)); }; }
      if (d[0] === 'dot') { var c = svgEl('circle', {cx: 50, cy: 36, fill: color}, svg); return function (p) { c.setAttribute('r', 10 * Math.min(1, p * 1.4)); }; }
      var path = svgEl('path', {d: d[1], pathLength: 1, fill: d[4] ? color : 'none', stroke: color, 'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 1}, svg);
      return function (p) { var q = clamp01((p - d[2]) / (d[3] - d[2])); path.setAttribute('stroke-dashoffset', 1 - Math.min(1, q)); if (d[4]) path.setAttribute('fill-opacity', Math.min(1, q * 1.6)); };
    });
    return function (p) { parts.forEach(function (fn) { fn(p); }); };
  };

  // ── overlays (core/Overlays.tsx): image + sticker (Lottie is refused by the server check) ──
  var makeOverlay = function (o, parent) {
    var start = o.whole ? 0 : Math.max(0, o.start || 0), end = o.whole ? F.T : Math.max(start + 0.1, o.end || start + 2), len = (end - start) * BASE;
    var anim = o.anim || (o.kind === 'sticker' ? 'draw' : 'fade');
    var box = el('div', 'position:absolute;left:' + (o.pos && o.pos.x != null ? o.pos.x : 0.5) * W + 'px;top:' + (o.pos && o.pos.y != null ? o.pos.y : 0.5) * H + 'px;width:' + (o.width || 0.2) * SHORT + 'px;visibility:hidden', parent);
    var draw = null;
    if (o.kind === 'sticker') draw = makeSticker(o.sticker || 'arrow', o.color || '#08DDA4', o.stroke == null ? 6 : o.stroke, box);
    else if (o.url) { var img = el('img', 'width:100%;height:auto;display:block;border-radius:' + (o.radius || 0) + 'px', box); img.src = o.url; }
    return function (ts) {
      var t = (ts - start) * BASE;
      if (ts < start || ts >= end) { box.style.visibility = 'hidden'; return; }
      box.style.visibility = 'visible';
      var inP = anim === 'none' ? 1 : tw(t, 0, anim === 'draw' ? 22 : 12), outP = o.out === 'none' || o.whole ? 1 : 1 - tw(t, len - 10, 10);
      var tx = 0, ty = 0, sc = 1, blur = 0;
      if (anim === 'pop') sc = 0.6 + 0.4 * inP + Math.sin(inP * Math.PI) * 0.08;
      if (anim === 'zoom') sc = 1.25 - 0.25 * inP;
      if (anim === 'rise') ty = (1 - inP) * 60;
      if (anim === 'slide-left') tx = (1 - inP) * 120;
      if (anim === 'slide-right') tx = -(1 - inP) * 120;
      if (anim !== 'none' && anim !== 'draw') blur = (1 - inP) * 10;
      if (o.pulse) sc *= 1 + 0.05 * Math.sin((t / 15) * Math.PI);
      box.style.opacity = (o.opacity == null ? 1 : o.opacity) * (anim === 'draw' ? 1 : inP) * outP;
      box.style.transform = 'translate(-50%,-50%) translate(' + tx + 'px,' + ty + 'px) rotate(' + (o.rotate || 0) + 'deg) scale(' + sc + ')' + (o.flip ? ' scaleX(-1)' : '');
      box.style.filter = [blur > 0.2 ? 'blur(' + blur.toFixed(2) + 'px)' : '', o.shadow ? 'drop-shadow(0 12px 28px rgba(0,0,0,.45))' : ''].filter(Boolean).join(' ') || 'none';
      if (draw) draw(anim === 'draw' ? inP : 1);
    };
  };

  // ── layers, same order as Main.tsx: scenes · footage · overlays(under) · titles · subtitles · overlays(top) · film finish ──
  var R = [];
  var under = layer(30), titles = layer(40), subs = layer(50), top = layer(60), finish = layer(70);
  F.overlays.filter(function (o) { return (o.layer || 'under') === 'under'; }).forEach(function (o) { R.push(makeOverlay(o, under)); });
  F.titles.forEach(function (it) { var fn = makeLine(it, (it.pos && it.pos.x != null ? it.pos.x : 0.5) * W, (it.pos && it.pos.y != null ? it.pos.y : 0.82) * H, (it.maxWidth || 0.86) * W, titles); R.push(function (ts) { fn(ts * BASE); }); });
  if (F.subs) {
    var cfg = F.subs, portrait = H > W;
    var sx = (cfg.pos && cfg.pos.x != null ? cfg.pos.x : 0.5) * W, sy = (cfg.pos && cfg.pos.y != null ? cfg.pos.y : portrait ? 0.72 : 0.88) * H, smw = (cfg.maxWidth || 0.84) * W;
    var sst = Object.assign({size: Math.round(SHORT * 0.05), weight: 700, shadow: true}, cfg.style || {});
    // one cue at a time: a cue is shown only inside [start, end) (Titles.tsx Subtitles)
    var cues = cfg.items.map(function (c) { return {c: c, fn: makeLine({text: c.text, start: c.start, end: c.end, anim: cfg.anim || 'karaoke', out: 'none', style: sst}, sx, sy, smw, subs)}; });
    R.push(function (ts) { var tb = ts * BASE; for (var i = 0; i < cues.length; i++) { var on = tb >= cues[i].c.start * BASE && tb < cues[i].c.end * BASE; cues[i].fn(on ? tb : -1e9); } });
  }
  F.overlays.filter(function (o) { return o.layer === 'top'; }).forEach(function (o) { R.push(makeOverlay(o, top)); });
  // film finish: vignette + 6 grain frames cycled every 2 output frames
  el('div', 'position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,' + F.look.vignette + ') 100%)', finish);
  var grains = [];
  if (F.look.grain > 0) for (var g = 0; g < 6; g++) { var gi = el('img', 'position:absolute;inset:0;width:100%;height:100%;opacity:' + F.look.grain + ';mix-blend-mode:overlay;image-rendering:pixelated;visibility:hidden', finish); gi.src = 'public/_engine/grain' + g + '.png'; grains.push(gi); }

  var render = function (ts) {
    var tb = ts * BASE;
    renderScenes(tb); renderFootage(ts);
    for (var i = 0; i < R.length; i++) R[i](ts);
    if (grains.length) { var k = Math.floor(Math.round(ts * F.fps) / 2) % 6; for (var j = 0; j < 6; j++) grains[j].style.visibility = j === k ? 'visible' : 'hidden'; }
  };
  var tl = S.timeline('film'), clock = {t: 0};
  tl.fromTo(clock, {t: 0}, {t: F.T, duration: F.T, ease: 'none', onUpdate: function () { render(clock.t); }}, 0);
  render(0);
  window.__filmRender = render; // QA: window.__filmRender(3.2)
})();
