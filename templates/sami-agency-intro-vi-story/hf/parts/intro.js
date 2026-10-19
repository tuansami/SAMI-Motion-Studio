/* SAMI Agency Intro: tiện ích chung cho 12 cảnh, nạp SAU sami-hf.js: <script src="hf/parts/intro.js"></script> → window.I
 * Mọi chuyển động gắn vào timeline GSAP của cảnh (tua được, tất định). Một easing: SAMI.EASE.
 *   I.src(key)                 giá trị ô ảnh (copy) → URL trong cảnh ("lib:img/…" = SAMI_Library, "img/…" = public/)
 *   I.bindImgs(root)           [data-img="KEY"] → ảnh nền / <img src>
 *   I.lapse(tl, child, at, dur, fps)   tua nhanh: chạy hết timeline con trong `dur` giây, giữ hình theo bước (cảm giác time-lapse)
 *   I.hud(parent, label)       HUD "▶▶ ZEITRAFFER ×16 + đồng hồ"; I.clock(tl, hud, at, dur, hours) cho đồng hồ chạy vụt
 *   I.type(tl, el, text, at, cps)      gõ chữ từng ký tự
 *   I.count(tl, el, to, at, dur, {dec, pre, suf})   số đếm lên (dấu phẩy thập phân kiểu Đức)
 *   I.flash(tl, at, {color, peak})     chớp sáng toàn khung
 *   I.shake(tl, el, at, {amp, n})      rung (giữ hình từng khung)
 *   I.mark(el, size) / I.word(el, h)   logo SAMI (vector) → {svg, outer, stripes, clip} (clip: rect để quét chữ S vào)
 *   I.cursor(tl, parent, pts, {pen})   con trỏ đi qua [x, y, t, click?] (px trong parent)
 *   I.icon(name)                       icon nét (svg string)
 *   I.app(parent, file, id)            khung app thiết kế (công cụ, canvas, bảng) → {app, canvas, panel, tool(tl, name, at)}
 */
(function () {
  'use strict';
  var S = window.SAMI, I = (window.I = {});
  var NS = 'http://www.w3.org/2000/svg';
  I.$ = function (q, r) { return (r || document).querySelector(q); };
  I.$$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  I.el = function (tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  I.svg = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  // ── ảnh từ ô ảnh (copy) ─────────────────────────────────────────────
  I.url = function (v) {
    v = String(v || '').trim(); if (!v) return null;
    if (/^(https?:|data:|public\/|hf\/|lib\/)/.test(v)) return v;
    if (/^lib:/.test(v)) return 'lib/' + v.slice(4);
    return 'public/' + v.replace(/^\/+/, '');
  };
  I.src = function (key) { return I.url(S.copy[key]); };
  I.bindImgs = function (root) {
    I.$$('[data-img]', root).forEach(function (e) {
      var u = I.src(e.getAttribute('data-img')); if (!u) return;
      if (e.tagName === 'IMG') e.src = u; else { e.classList.add('photo'); e.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; }
    });
  };

  // ── thời gian ──────────────────────────────────────────────────────
  // Nhịp giữ (bản chữ dài): {S01: [[7.4, 3]]} = từ nhịp 7.4 của S01 trở đi, mọi mốc SAMI.beat() lùi 3 nhịp (giữ hình cho kịp đọc).
  // Mẫu gốc để trống; tools/build-lang.mjs ghi lại dòng này theo "holds" của lang/<lang>.json (và cộng nhịp vào độ dài cảnh).
  var HOLDS = {"S01":[[2.8,1],[7.4,3]],"S02":[[1.4,1],[4.6,1]],"S03":[[5.5,2]],"S04":[[17.6,3]],"S05":[[9.5,2]],"S06":[[11.6,2]],"S07":[[7,3]],"S08":[[9.2,1]],"S09":[[5.2,2]],"S10":[[5.6,2]],"S11":[[3.4,1],[10,4]],"S12":[[9,1]]};
  var sid = (I.$('[data-composition-id]') || {getAttribute: function () { return ''; }}).getAttribute('data-composition-id');
  var holds = HOLDS[sid] || [];
  if (holds.length) {
    var beat0 = S.beat;
    S.beat = function (n) { var x = n; holds.forEach(function (h) { if (n >= h[0]) x += h[1]; }); return beat0(x); };
  }

  /** dòng dẫn chuyện <div class="story" data-copy="Sxx_story">: chữ vào từng từ ở `at`, rời ở `out` (nếu có). Ô chữ trống/không có → ẩn. */
  I.story = function (tl, at, out) {
    var el = I.$('.story'); if (!el) return null;
    if (!el.textContent.trim()) { el.style.display = 'none'; return null; }
    tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.25}, at);
    S.arrive(tl, S.words(el), at, {stagger: 0.035, dist: 18, blur: 6, dur: 0.4});
    if (out != null) S.leave(tl, el, out, {dist: -16, blur: 8, dur: 0.35});
    return el;
  };

  /** time-lapse: timeline con chạy hết trong `dur` giây của cảnh, giữ hình theo bước 1/fps → nhìn như tua nhanh */
  I.lapse = function (tl, child, at, dur, fps) {
    var L = child.duration(), step = 1 / (fps || 12), p = {t: 0};
    child.pause(0);
    var seek = function () { var real = p.t * dur; child.seek(Math.min(L, Math.floor(real / step) * step * (L / dur)), false); };
    tl.to(p, {t: 1, duration: dur, ease: 'none', onUpdate: seek, onComplete: seek, onReverseComplete: seek}, at);
    return child;
  };

  /** HUD tua nhanh */
  I.hud = function (parent, label, mult) {
    var h = I.el('div', 'hud', parent);
    h.innerHTML = '<span class="rec"></span><span class="ff"><svg viewBox="0 0 24 24"><path d="M3 5v14l9-7zM12 5v14l9-7z" fill="#fff"/></svg></span>' +
      '<span class="lbl">' + (label || 'ZEITRAFFER') + '</span><span class="x">×' + (mult || 16) + '</span><span class="tc">00:00:00</span>';
    return h;
  };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  /** đồng hồ HUD chạy vụt từ 0 tới `hours` giờ trong `dur` giây */
  I.clock = function (tl, hud, at, dur, hours, startH) {
    var tc = hud.querySelector('.tc'), p = {v: 0}, total = (hours || 6) * 3600, s0 = (startH || 0) * 3600;
    var put = function () { var s = Math.floor(s0 + p.v * total); tc.textContent = pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60); };
    put();
    tl.to(p, {v: 1, duration: dur, ease: 'none', onUpdate: put, onComplete: put, onReverseComplete: put}, at);
    var rec = hud.querySelector('.rec');
    for (var k = 0; k < dur * 2; k++) tl.set(rec, {opacity: k % 2 ? 1 : 0.25}, at + k * 0.5);
  };

  /** gõ chữ (từng ký tự, có con trỏ nhấp nháy theo nhịp) */
  I.type = function (tl, el, text, at, cps, caret) {
    text = String(text || ''); cps = cps || 22;
    var t = I.el('span', 'typed', null), c = caret === false ? null : I.el('span', 'caret', null, '|');
    el.innerHTML = ''; el.appendChild(t); if (c) el.appendChild(c);
    for (var i = 0; i <= text.length; i++) tl.set(t, {textContent: text.slice(0, i)}, at + i / cps);
    if (c) { tl.set(c, {opacity: 1}, 0); var end = at + text.length / cps; for (var k = 1; k < 8; k++) tl.set(c, {opacity: k % 2 ? 0 : 1}, end + k * 0.25); }
    return at + text.length / cps;
  };

  var fmt = function (v, dec) { return v.toFixed(dec || 0).replace('.', ','); };
  /** số đếm lên, kiểu Đức (1,5) */
  I.count = function (tl, el, to, at, dur, o) {
    o = o || {}; var p = {v: o.from || 0};
    var put = function () { el.textContent = (o.pre || '') + fmt(p.v, o.dec) + (o.suf || ''); };
    put();
    tl.to(p, {v: to, duration: dur || 1, ease: S.EASE, onUpdate: put, onComplete: put, onReverseComplete: put}, at);
  };

  /** chớp sáng toàn khung */
  I.flash = function (tl, at, o) {
    o = o || {};
    var f = I.el('div', 'flash', document.querySelector('[data-composition-id]'));
    f.style.cssText = 'position:absolute;inset:0;z-index:90;pointer-events:none;opacity:0;background:' + (o.color || '#fff');
    tl.fromTo(f, {opacity: o.peak || 0.85}, {opacity: 0, duration: o.dur || 0.45, ease: S.EASE, immediateRender: false}, at);
    return f;
  };

  /** rung: giữ hình từng khung (tl.set), tất định */
  I.shake = function (tl, el, at, o) {
    o = o || {}; var n = o.n || 8, a = o.amp || 18;
    for (var i = 0; i < n; i++) { var k = 1 - i / n; tl.set(el, {x: (S.rnd(i * 3.1 + 1) - 0.5) * 2 * a * k, y: (S.rnd(i * 7.7 + 2) - 0.5) * 2 * a * k}, at + i / 30); }
    tl.set(el, {x: 0, y: 0}, at + n / 30);
  };

  // ── logo SAMI ──────────────────────────────────────────────────────
  var gradId = 0;
  I.mark = function (el, size, mono) {
    var L = window.SAMI_LOGO, id = 'sg' + (++gradId), h = size || 200, w = h * 1000 / 1008;
    var svg = I.svg('svg', {width: w, height: h, viewBox: L.markBox, style: 'display:block;overflow:visible'}, el);
    if (!mono) {
      var d = I.svg('defs', {}, svg), g = I.svg('linearGradient', {id: id, x1: -356, y1: 564, x2: 644, y2: -444, gradientUnits: 'userSpaceOnUse'}, d);
      [[0, 'mint'], [0.3, 'mint'], [0.55, 'purple'], [0.8, 'mint'], [1, 'mint']].forEach(function (s) { I.svg('stop', {offset: s[0], 'stop-color': 'var(--c-' + s[1] + ')', style: 'stop-color:var(--c-' + s[1] + ')'}, g); });
    }
    var fill = mono || 'url(#' + id + ')';
    var cp = I.svg('clipPath', {id: id + 'c'}, I.svg('defs', {}, svg)), clip = I.svg('rect', {x: -356, y: -444, width: 1000, height: 1008}, cp);
    var outer = I.svg('path', {d: L.outer, fill: fill, 'clip-path': 'url(#' + id + 'c)'}, svg);
    var stripes = L.stripes.map(function (p) { return I.svg('path', {d: p, fill: fill}, svg); });
    return {svg: svg, outer: outer, stripes: stripes, clip: clip};
  };
  I.word = function (el, h, color) {
    var L = window.SAMI_LOGO; h = h || 80;
    var svg = I.svg('svg', {width: h * 911 / 256, height: h, viewBox: L.wordBox, style: 'display:block;overflow:visible'}, el);
    var g = I.svg('g', {transform: L.wordShift}, svg);
    I.svg('path', {d: L.word, fill: color || '#fff'}, g);
    return svg;
  };

  // ── con trỏ ────────────────────────────────────────────────────────
  var ARROW = '<svg viewBox="0 0 20 25" width="100%" height="100%"><path d="M1 1 L1 20 L6 15.5 L9.5 23.5 L13 22 L9.6 14.2 L16 14 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var PEN = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2 2l7.6 18.4 2.9-6.9 6.9-2.9z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/><circle cx="11.2" cy="11.2" r="1.6" fill="#111"/></svg>';
  /** pts: [[x, y, t, click?], …] (px trong parent) */
  I.cursor = function (tl, parent, pts, o) {
    o = o || {}; var sz = o.size || 46;
    var c = I.el('div', 'cur', parent, o.pen ? PEN : ARROW);
    c.style.cssText = 'position:absolute;left:0;top:0;width:' + sz + 'px;height:' + sz * 1.2 + 'px;z-index:60;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))';
    var prev = null;
    pts.forEach(function (p) {
      if (!prev) tl.set(c, {x: p[0], y: p[1]}, 0);
      else tl.to(c, {x: p[0], y: p[1], duration: Math.max(0.08, (p[2] - prev[2]) * 0.85), ease: S.EASE}, prev[2]);
      if (p[3]) {
        var r = I.el('div', 'ripple', parent);
        r.style.cssText = 'position:absolute;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;border:5px solid var(--c-mint);left:' + p[0] + 'px;top:' + p[1] + 'px;z-index:59;opacity:0';
        tl.fromTo(r, {scale: 0.2, opacity: 1}, {scale: 1.4, opacity: 0, duration: 0.5, ease: S.EASE, immediateRender: false}, p[2]);
        tl.to(c, {scale: 0.82, duration: 0.07, yoyo: true, repeat: 1, transformOrigin: '0 0', ease: S.EASE}, p[2]);
      }
      prev = p;
    });
    return c;
  };

  // ── icon nét (24×24) ───────────────────────────────────────────────
  var P = {
    brand: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    menu: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M8 8h6M8 12h6M8 16h3"/>',
    web: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 6.5h.01M9 6.5h.01"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>',
    bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    ads: '<path d="M3 11l18-8v18L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.6 1-1.1a5.5 5.5 0 0 0 0-7.7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    move: '<path d="M4 3l7 17 2.5-7.5L21 10z"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
    rect: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    drop: '<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    wa: '<path fill="currentColor" stroke="none" transform="scale(.75)" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4c-1.1-1.8-1.7-3.8-1.7-5.9C5.1 10.1 10 5.3 16 5.3S26.9 10.1 26.9 16 22 26.6 16 26.6zm6-7.9c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/>',
    food: '<path d="M7 2v8a2 2 0 0 0 4 0V2M9 10v12M17 2c-2 1-3 3.5-3 6.5V13h3v9"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'
  };
  I.icon = function (name, o) {
    o = o || {};
    return '<svg viewBox="0 0 24 24" fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || 'currentColor') + '" stroke-width="' + (o.sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block">' + (P[name] || '') + '</svg>';
  };
  /** khung app thiết kế: thanh tiêu đề + công cụ + canvas + bảng phải → {app, canvas, panel, tool(tl, name, at)} */
  I.app = function (parent, file, id) {
    var a = I.el('div', 'app', parent); if (id) a.id = id;
    var top = I.el('div', 'top', a, '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="file"></span><span class="tag">100 %</span>');
    top.querySelector('.file').textContent = file || '';
    var tools = I.el('div', 'tools', a), names = ['move', 'pen', 'rect', 'type', 'drop', 'img'], tmap = {};
    names.forEach(function (n) { tmap[n] = I.el('div', 't', tools, I.icon(n)); });
    var canvas = I.el('div', 'canvas', a), panel = I.el('div', 'panel', a);
    return {app: a, canvas: canvas, panel: panel, tool: function (tl, name, at) { names.forEach(function (n) { tl.set(tmap[n], {attr: {class: 't' + (n === name ? ' on' : '')}}, at); }); }};
  };
  /** nạp SVG (chữ) đồng bộ, để vẽ nét logo thật (null khi lỗi) */
  I.svgText = function (url) {
    try { var x = new XMLHttpRequest(); x.open('GET', url, false); x.send(null); return x.status === 0 || x.status === 200 ? x.responseText : null; } catch (e) { return null; }
  };

  // điền chữ ngay (trước khi cảnh tách từ để làm chuyển động) và để DOMContentLoaded không điền lại đè mất các span đã tách.
  // Sửa chữ trong Studio = nạp lại cảnh (shim.js), nên không cần giữ data-copy sau bước này.
  S.bindCopy();
  I.$$('[data-copy]').forEach(function (e) { e.setAttribute('data-bound', e.getAttribute('data-copy')); e.removeAttribute('data-copy'); });
  I.bindImgs();
})();
