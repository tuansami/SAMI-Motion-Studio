/* SAMI Carousel toolkit (window.CX) — for "live carousel" slides: each slide is a seamless loop, frame 0 is a finished
 * design, and one protagonist object can travel through every slide. Loaded after gsap + sami-hf.js.
 * Everything is a pure function of t (seconds in the slide): no Math.random / Date / rAF.
 * window.SAMI.slide = {index, count, start, total} (start/total in seconds across the whole carousel).
 */
(function () {
  'use strict';
  var S = window.SAMI || {}, X = {}, TAU = Math.PI * 2;
  if (S.carousel && S.carousel.theme) document.documentElement.setAttribute('data-theme', S.carousel.theme);

  X.clamp = function (v, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return Math.min(b, Math.max(a, v)); };
  X.lerp = function (a, b, s) { return a + (b - a) * s; };
  X.prog = function (t, a, b) { return X.clamp((t - a) / (b - a)); };
  X.ease = S.EASE || function (s) { return 1 - Math.pow(1 - s, 3); };
  X.inOut = function (s) { return s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2; };
  /** eased 0→1 between a and b */
  X.tw = function (t, a, b) { return X.ease(X.prog(t, a, b)); };
  X.hash = S.rnd || function (n) { var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  /** damped spring impulse (0 at dt=0, rings out) and settle (0→1 with overshoot) — physical, still deterministic */
  X.kick = function (dt, f, d) { f = f || 3; d = d || 7; return dt < 0 ? 0 : Math.exp(-d * dt) * Math.sin(TAU * f * dt); };
  X.settle = function (dt, f, d) { f = f || 2.2; d = d || 6; return dt <= 0 ? 0 : 1 - Math.exp(-d * dt) * Math.cos(TAU * f * dt); };
  X.pulse = function (t, c, w) { return Math.exp(-Math.pow((t - c) / w, 2)); };
  /** loop-safe periodic value: period must divide the slide length */
  X.wave = function (t, period, phase) { return Math.sin(TAU * (t / period + (phase || 0))); };

  /** drive render(t) from the slide timeline (registered for Hyperframes); returns the timeline */
  X.loop = function (render) {
    var tl = S.timeline(), clock = {t: 0};
    tl.fromTo(clock, {t: 0}, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { render(clock.t); }}, 0);
    render(0);
    return tl;
  };

  /**
   * Hop path through waypoints [{t, x, y, h, ease:'linear|out|in|inOut', land:0.4}] (x,y = centre).
   * Between points: x eases, y follows a parabola of height h. `land` = squash amount when arriving.
   */
  X.path = function (pts) {
    var E = {linear: function (s) { return s; }, out: function (s) { return 1 - Math.pow(1 - s, 3); }, in: function (s) { return s * s * s; }, inOut: X.inOut};
    var at = function (t) {
      if (t <= pts[0].t) return {x: pts[0].x, y: pts[0].y, vx: 0, vy: 0, i: 0};
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        if (t <= b.t) {
          var T = b.t - a.t, s = (t - a.t) / T, e = (E[b.ease] || E.linear), sx = e(s), h = b.h || 0;
          var s2 = Math.min(1, s + 1e-3), x2 = a.x + (b.x - a.x) * e(s2), y2 = a.y + (b.y - a.y) * e(s2) - 4 * h * s2 * (1 - s2);
          var x = a.x + (b.x - a.x) * sx, y = a.y + (b.y - a.y) * sx - 4 * h * s * (1 - s);
          return {x: x, y: y, vx: (x2 - x) / (1e-3 * T), vy: (y2 - y) / (1e-3 * T), i: i};
        }
      }
      var p = pts[pts.length - 1]; return {x: p.x, y: p.y, vx: 0, vy: 0, i: pts.length - 1};
    };
    /** squash/stretch state for an object following the path */
    var body = function (t) {
      var p = at(t), sp = Math.hypot(p.vx, p.vy), st = X.clamp(sp / 5000, 0, 0.35), q = 0;
      pts.forEach(function (w) { if (!w.land) return; var dt = t - w.t; if (dt > -0.05 && dt < 0.5) { q += w.land * (dt < 0 ? X.pulse(dt, 0, 0.025) : Math.exp(-dt * 15) * Math.cos(dt * 36)); st *= X.clamp(Math.abs(dt) / 0.09); } });
      return {x: p.x, y: p.y, ang: Math.atan2(p.vy, p.vx), st: st, q: q};
    };
    return {at: at, body: body, pts: pts};
  };
  /** apply a path body to an element (transform-origin: bottom centre recommended) */
  X.place = function (el, b, w, h) {
    var sq = 1 + b.q, a = 1 + b.st;
    el.style.transform = 'translate(' + (b.x - w / 2) + 'px,' + (b.y - h / 2) + 'px) rotate(' + b.ang + 'rad) scale(' + a + ',' + (1 / a) + ') rotate(' + (-b.ang) + 'rad) scale(' + sq + ',' + (1 / sq) + ')';
  };

  /** dot grid on a canvas with ripples: draw(t, ripples=[{t,x,y,v,a}], breathe 0..1) */
  X.grid = function (canvas, opt) {
    opt = opt || {};
    var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, gap = opt.gap || 54, dots = [];
    for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) dots.push([x, y]);
    return function (t, ripples, breathe) {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = opt.color || 'rgba(255,255,255,1)';
      for (var i = 0; i < dots.length; i++) {
        var x0 = dots[i][0], y0 = dots[i][1], dx = 0, dy = 0, g = 0;
        (ripples || []).forEach(function (w) {
          var dt = t - w.t; if (dt < 0 || dt > 1.6) return;
          var ex = x0 - w.x, ey = y0 - w.y, d = Math.hypot(ex, ey) || 1, R = dt * (w.v || 1400);
          var band = Math.exp(-Math.pow((d - R) / 70, 2)) * Math.exp(-dt * 2.4) * (w.a || 1);
          dx += ex / d * band * 22; dy += ey / d * band * 22; g += band;
        });
        var br = breathe ? breathe * 0.6 * Math.sin(TAU * (t / S.dur) * 2 + x0 * 0.013 + y0 * 0.009) : 0; // periodic in the slide → loops
        ctx.globalAlpha = X.clamp((opt.alpha || 0.16) + g * 0.55, 0, 0.9);
        ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, Math.max(0.6, 2.2 + g * 3 + br), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  };

  /** deterministic particle burst: returns draw(t, t0, x, y, life) */
  X.burst = function (parent, n, seed, cls) {
    var ps = [];
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i'); d.className = 'cx-p ' + (cls || '') + (X.hash(seed + i * 7.3) > 0.55 ? ' alt' : '');
      parent.appendChild(d);
      ps.push({el: d, ang: -Math.PI / 2 + (X.hash(seed + i * 3.1) - 0.5) * Math.PI * 1.7, spd: 480 + X.hash(seed + i * 5.7) * 860, rot: (X.hash(seed + i * 9.9) - 0.5) * 900, k: 0.6 + X.hash(seed + i * 1.3) * 0.9});
    }
    return function (t, t0, x, y, life) {
      life = life || 1.1; var dt = t - t0;
      ps.forEach(function (p) {
        if (dt < 0 || dt > life) { p.el.style.opacity = 0; return; }
        var px = x + Math.cos(p.ang) * p.spd * dt, py = y + Math.sin(p.ang) * p.spd * dt + 1300 * dt * dt;
        p.el.style.opacity = 1 - Math.pow(dt / life, 2);
        p.el.style.transform = 'translate(' + px + 'px,' + py + 'px) rotate(' + (45 + p.rot * dt) + 'deg) scale(' + p.k * (1 - 0.4 * dt / life) + ')';
      });
    };
  };

  /** count from a to b between t0 and t1 (eased), formatted for de-DE by default */
  X.count = function (el, t, t0, t1, a, b, opt) {
    opt = opt || {}; var v = X.lerp(a, b, X.tw(t, t0, t1));
    el.textContent = (opt.prefix || '') + v.toLocaleString(opt.locale || 'de-DE', {maximumFractionDigits: opt.decimals || 0, minimumFractionDigits: opt.decimals || 0}) + (opt.suffix || '');
  };

  /** largest font-size (≤ max) so the element fits maxW on one line (measured once, at build time) */
  X.fit = function (el, maxW, max, min) {
    max = max || 320; min = min || 60; el.style.whiteSpace = 'nowrap';
    var lo = min, hi = max;
    for (var i = 0; i < 18; i++) { var mid = (lo + hi) / 2; el.style.fontSize = mid + 'px'; if (el.scrollWidth > maxW) hi = mid; else lo = mid; }
    el.style.fontSize = lo + 'px'; return lo;
  };

  /** run fn once, as soon as web fonts are loaded (call it at the top of render(t)): text measuring needs real fonts */
  X.ready = function (fn) {
    var done = false;
    return function () { if (done) return true; if (document.fonts && document.fonts.status !== 'loaded') return false; done = true; fn(); return true; };
  };

  /** type text on: n chars visible at t (cps = chars per second) */
  X.type = function (el, text, t, t0, cps) { var n = Math.max(0, Math.min(text.length, Math.floor((t - t0) * (cps || 22)))); el.textContent = text.slice(0, n); return n; };

  /**
   * Standard slide chrome inside #frame: topbar (series · 0N / 0M), hairline, swipe pill (not on the last slide),
   * and a progress line that continues across the whole carousel (slide.start + t) / total.
   * Returns update(t).
   */
  X.chrome = function (frame, opt) {
    opt = opt || {};
    var sl = S.slide || {index: 0, count: 1, start: 0, total: S.dur}, pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var top = document.createElement('div'); top.className = 'cx-top';
    top.innerHTML = '<span class="cx-series"><i></i>' + (opt.series || (S.carousel && S.carousel.series) || '') + '</span><span class="cx-count">' + pad(sl.index + 1) + ' / ' + pad(sl.count) + '</span>';
    var hair = document.createElement('div'); hair.className = 'cx-hair';
    var prog = document.createElement('div'); prog.className = 'cx-prog'; prog.innerHTML = '<i></i>';
    frame.appendChild(top); frame.appendChild(hair); frame.appendChild(prog);
    var swipe = null;
    if (sl.index < sl.count - 1 && opt.swipe !== false) {
      swipe = document.createElement('div'); swipe.className = 'cx-swipe';
      swipe.innerHTML = '<span>' + (opt.swipeText || (S.carousel && S.carousel.swipe) || 'Swipe') + '</span><svg width="34" height="20" viewBox="0 0 34 20"><path d="M2 10H30M21 2l10 8-10 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      frame.appendChild(swipe);
    }
    var bar = prog.firstChild;
    return function (t) {
      bar.style.transform = 'scaleX(' + X.clamp((sl.start + t) / (sl.total || S.dur)) + ')';
      if (swipe) swipe.style.transform = 'translateX(' + (8 * Math.max(0, X.wave(t, 1)) ) + 'px)'; // nudges on every beat pair, loop-safe
    };
  };

  window.CX = X;
})();
