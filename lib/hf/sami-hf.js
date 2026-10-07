/* SAMI runtime cho cảnh Hyperframes (HTML + CSS + GSAP) — nạp sau gsap.min.js.
 * Studio chèn trước file này: window.SAMI = {copy, brand, ratio, w, h, fps, scene, dur, t0}.
 * Quy tắc giống engine Remotion:
 *  • MỘT easing cho cả phim: SAMI.EASE (cubic-bezier(.22,1,.36,1)) — không spring, không easing khác.
 *  • Lưới nhạc 120 BPM: 1 nhịp = 0.5 s. Thời gian trong cảnh tính từ đầu clip; nhịp cắt vào cảnh ở SAMI.t0 (= 8/30 s).
 *  • Không Math.random / Date / requestAnimationFrame — mọi chuyển động là hàm của thời gian timeline (seek được).
 *    Cần ngẫu nhiên → SAMI.rnd(seed).
 */
(function () {
  'use strict';
  var S = (window.SAMI = window.SAMI || {});
  S.copy = S.copy || {}; S.brand = S.brand || {}; S.ratio = S.ratio || '16:9';
  S.fps = S.fps || 30; S.t0 = S.t0 == null ? 8 / 30 : S.t0; S.dur = S.dur || 5;
  S.portrait = S.h > S.w; S.square = S.h === S.w; S.landscape = S.w > S.h;

  // ── easing: cubic-bezier(0.22, 1, 0.36, 1) (expo-out) — giống engine/src/lib/anim.ts
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    var sx = function (t) { return ((ax * t + bx) * t + cx) * t; };
    var sy = function (t) { return ((ay * t + by) * t + cy) * t; };
    var dx = function (t) { return (3 * ax * t + 2 * bx) * t + cx; };
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x, i, d;
      for (i = 0; i < 8; i++) { d = sx(t) - x; if (Math.abs(d) < 1e-6) break; var s = dx(t); if (Math.abs(s) < 1e-6) break; t -= d / s; }
      var lo = 0, hi = 1; t = Math.min(1, Math.max(0, t));
      if (Math.abs(sx(t) - x) > 1e-5) { t = x; for (i = 0; i < 30; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
      return sy(t);
    };
  }
  S.EASE = bezier(0.22, 1, 0.36, 1);
  S.bezier = bezier;

  // ── nhịp nhạc
  S.BEAT = 0.5; S.BAR = 2;
  /** thời điểm (giây trong clip) của nhịp n sau nhịp cắt vào cảnh */
  S.beat = function (n) { return S.t0 + n * S.BEAT; };
  S.bar = function (n) { return S.beat(n * 4); };

  // ── chữ từ project.json → copy (sửa trong tab Chữ của Studio)
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  // quy ước chữ giống engine Remotion (Words): *từ* = tô màu gradient, " / " (dấu / đứng riêng) = xuống dòng
  var SLASH = /(?:^|\s+)\/(?=\s|$)\s*/g;
  S.text = function (key, fallback) { var v = S.copy[key]; return v == null ? (fallback == null ? '' : fallback) : String(v).replace(/\*/g, '').replace(SLASH, ' ').replace(/\s+/g, ' ').trim(); };
  /** *từ* → <em class="hl">từ</em>, " / " hoặc xuống dòng → <br> */
  S.html = function (key, fallback) {
    var v = S.copy[key]; v = v == null ? (fallback == null ? '' : fallback) : String(v);
    return esc(v).replace(/\*([^*]+)\*/g, '<em class="hl">$1</em>').replace(SLASH, '<br>').replace(/\n/g, '<br>');
  };
  /** gắn chữ cho mọi phần tử có data-copy="KEY" */
  S.bindCopy = function (root) {
    (root || document).querySelectorAll('[data-copy]').forEach(function (el) { el.innerHTML = S.html(el.getAttribute('data-copy'), el.innerHTML); });
  };
  /** giá trị theo tỉ lệ: SAMI.pick({'16:9': 120, '9:16': 96, default: 100}) */
  S.pick = function (m) { return m[S.ratio] != null ? m[S.ratio] : m['default'] != null ? m['default'] : m['16:9']; };
  /** vùng an toàn của nền tảng (px trên khung) — giống engine/src/core/format.tsx SAFE */
  S.SAFE = {'16:9': {top: 60, bottom: 60, side: 96}, '9:16': {top: 220, bottom: 380, side: 72}, '1:1': {top: 70, bottom: 90, side: 70}, '4:5': {top: 90, bottom: 140, side: 70}}[S.ratio] || {top: 60, bottom: 60, side: 80};

  // ── ngẫu nhiên tất định (giống rnd() của engine)
  S.rnd = function (seed) { var x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  /** timeline chính của cảnh — paused, đăng ký cho runtime Hyperframes tua */
  S.timeline = function (id) {
    var root = document.querySelector('[data-composition-id]');
    id = id || (root && root.getAttribute('data-composition-id')) || 'root';
    var tl = window.gsap.timeline({paused: true, defaults: {ease: S.EASE}});
    window.__timelines = window.__timelines || {};
    window.__timelines[id] = tl;
    // giữ timeline dài đúng bằng clip (để tua tới cuối không bị kẹt)
    tl.set({}, {}, S.dur);
    return tl;
  };

  /** tách chữ thành từng từ (span.w) để stagger; giữ <em class="hl"> */
  S.words = function (el) {
    var out = [];
    var walk = function (node, wrapHl) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = p;
            frag.appendChild(s); out.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return out;
  };

  /** "arrive" chuẩn SAMI: rise + un-blur + fade (giống arrive() của engine) */
  S.arrive = function (tl, target, at, opt) {
    opt = opt || {};
    return tl.fromTo(target, {opacity: 0, y: opt.dist == null ? 40 : opt.dist, filter: 'blur(' + (opt.blur == null ? 12 : opt.blur) + 'px)'},
      {opacity: 1, y: 0, filter: 'blur(0px)', duration: opt.dur || 0.6, stagger: opt.stagger || 0, ease: S.EASE}, at);
  };
  S.leave = function (tl, target, at, opt) {
    opt = opt || {};
    return tl.to(target, {opacity: 0, y: opt.dist == null ? -30 : opt.dist, filter: 'blur(' + (opt.blur == null ? 12 : opt.blur) + 'px)', duration: opt.dur || 0.5, stagger: opt.stagger || 0, ease: S.EASE}, at);
  };

  /** thu nhỏ cỡ chữ cho vừa bề rộng (đo một lần lúc dựng, không theo thời gian) */
  S.fit = function (el, maxW, minPx) {
    var px = parseFloat(getComputedStyle(el).fontSize) || 100; minPx = minPx || 24;
    el.style.whiteSpace = 'nowrap';
    while (el.scrollWidth > maxW && px > minPx) { px -= 2; el.style.fontSize = px + 'px'; }
    return px;
  };

  // brand → CSS variables (--c-navy, --c-mint, … + --grad)
  var root = document.documentElement, C = S.brand.colors || {};
  Object.keys(C).forEach(function (k) { root.style.setProperty('--c-' + k, C[k]); });
  if (S.brand.gradient) root.style.setProperty('--grad', S.brand.gradient);
  root.setAttribute('data-ratio', S.ratio.replace(':', 'x'));
  root.style.setProperty('--w', S.w + 'px'); root.style.setProperty('--h', S.h + 'px');
  root.style.setProperty('--safe-top', S.SAFE.top + 'px'); root.style.setProperty('--safe-bottom', S.SAFE.bottom + 'px'); root.style.setProperty('--safe-side', S.SAFE.side + 'px');

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { S.bindCopy(); });
  else S.bindCopy();
})();
