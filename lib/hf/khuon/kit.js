/* Khuôn SAMI: bộ kit dùng chung (nạp SAU sami-hf.js: <script src="_sami/khuon/kit.js">). window.SAMI.K
 * Khuôn không chứa chữ cứng: phần tử ghi data-slot="headline" → chữ của project.json → copy["<cảnh>_headline"];
 * ảnh ghi data-slot-img="p1_photo" → copy["<cảnh>_p1_photo"] ("img/x.jpg" của dự án hoặc "lib:img/…" của thư viện).
 * Gọi K.bind() ĐẦU script của cảnh (trước SAMI.words…). Slot trống + data-optional → phần tử bị ẩn (display:none).
 * Mọi chuyển động vẫn là hàm của timeline (seek được); ngẫu nhiên chỉ qua SAMI.rnd. */
(function () {
  'use strict';
  var S = window.SAMI, K = (S.K = {});
  K.theme = S.theme || (S.khuon && S.khuon.theme) || 'night';
  document.documentElement.setAttribute('data-theme', K.theme);
  // 1.2: a custom style (lib/hf/styles/<id>) follows the layout of its base theme; its look comes from style.css
  K.base = (S.style && S.style.base) || K.theme;
  document.documentElement.setAttribute('data-base', K.base);
  K.paper = K.base === 'paper'; K.night = K.base === 'night'; K.light = K.base === 'light';

  K.key = function (slot) { return S.scene + '_' + slot; };
  K.raw = function (slot) { var v = S.copy[K.key(slot)]; return v == null ? '' : String(v); };
  K.has = function (slot) { return K.raw(slot).trim() !== ''; };
  K.text = function (slot, fb) { return S.text(K.key(slot), fb); };
  K.html = function (slot, fb) { return S.html(K.key(slot), fb); };
  K.num = function (slot, fb) { var m = K.raw(slot).replace(/\s/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : (fb == null ? 0 : fb); };
  /** copy value of an image slot → URL usable inside the staged scene (null when empty) */
  K.url = function (v) {
    v = String(v || '').trim(); if (!v) return null;
    if (/^(https?:|data:|public\/|hf\/|lib\/|slides\/|media\/|_sami\/)/.test(v)) return v;
    if (/^lib:/.test(v)) return 'lib/' + v.slice(4);
    return 'public/' + v.replace(/^\/+/, '');
  };
  K.src = function (slot) { return K.url(K.raw(slot)); };
  /** slots that exist with a prefix + number, e.g. K.list('b', 5) → ['b1','b2','b3'] (stops at the first empty) */
  K.list = function (prefix, max, suffix) { var out = []; for (var i = 1; i <= (max || 9); i++) { var s = prefix + i + (suffix || ''); if (!K.has(s)) break; out.push(s); } return out; };

  /** fill every [data-slot] / [data-slot-img] under root */
  K.bind = function (root) {
    root = root || document;
    root.querySelectorAll('[data-slot]').forEach(function (el) {
      var slot = el.getAttribute('data-slot');
      if (!K.has(slot) && el.hasAttribute('data-optional')) { el.style.display = 'none'; el.setAttribute('data-empty', ''); return; }
      el.innerHTML = K.html(slot, el.getAttribute('data-default') || '');
    });
    root.querySelectorAll('[data-slot-img]').forEach(function (el) {
      var slot = el.getAttribute('data-slot-img'), u = K.src(slot);
      if (!u) { if (el.hasAttribute('data-optional')) { el.style.display = 'none'; el.setAttribute('data-empty', ''); return; } el.classList.add('k-ph'); el.textContent = el.getAttribute('data-ph') || 'ẢNH'; return; }
      if (el.tagName === 'IMG') el.src = u; else { el.classList.add('k-img'); el.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; }
    });
    return K;
  };

  /** text → cut-paper words (ransom note): span.r.r0..r3, tilted deterministically */
  K.ransom = function (el, opt) {
    opt = opt || {}; var seed = opt.seed || 7, words = [], html = el.innerHTML;
    var tmp = document.createElement('div'); tmp.innerHTML = html.replace(/<br\s*\/?>/gi, ' \n ');
    var parts = []; tmp.childNodes.forEach(function (n) {
      var hl = n.nodeType === 1 && n.tagName === 'EM';
      String(n.textContent).split(/(\s+)/).forEach(function (w) { if (w === '\n') parts.push({br: true}); else if (w.trim()) parts.push({w: w, hl: hl}); });
    });
    el.innerHTML = ''; el.classList.add('k-ransom');
    parts.forEach(function (p, i) {
      if (p.br) { var b = document.createElement('div'); b.style.flexBasis = '100%'; b.style.height = '0'; el.appendChild(b); return; }
      var r = S.rnd(seed + i * 3.1), v = p.hl ? (r > .5 ? 2 : 3) : (r < .55 ? 0 : r < .8 ? 1 : 2);
      var s = document.createElement('span'); s.className = 'r r' + v; s.textContent = p.w;
      // tilt via the individual rotate/translate properties: GSAP animates transform on top without losing it
      s.style.rotate = ((S.rnd(seed + i * 7.7) - .5) * 7).toFixed(2) + 'deg'; s.style.translate = '0 ' + ((S.rnd(seed + i * 5.3) - .5) * 10).toFixed(1) + 'px';
      el.appendChild(s); words.push(s);
    });
    return words;
  };

  /** pop in: scale from small + fade (always the one SAMI ease) */
  K.pop = function (tl, target, at, opt) {
    opt = opt || {};
    return tl.fromTo(target, {opacity: 0, scale: opt.from == null ? .6 : opt.from, rotation: opt.rot || 0},
      {opacity: 1, scale: 1, rotation: opt.rotTo == null ? 0 : opt.rotTo, duration: opt.dur || .5, stagger: opt.stagger || 0, ease: opt.ease || S.EASE, transformOrigin: opt.origin || '50% 50%'}, at);
  };
  /** stamp slam: big → normal, quick, with a little shake of the parent */
  K.slam = function (tl, el, at, shake) {
    tl.fromTo(el, {opacity: 0, scale: 2.4}, {opacity: 1, scale: 1, duration: .3, ease: S.EASE}, at);
    if (shake) tl.fromTo(shake, {x: 0, y: 0}, {keyframes: [{x: -10, y: 6, duration: .05}, {x: 8, y: -5, duration: .05}, {x: -4, y: 3, duration: .05}, {x: 0, y: 0, duration: .06}]}, at + .28);
    return tl;
  };
  /** count a number up: K.count(tl, el, 4.8, at, 1.4, {decimals: 1, prefix: '', suffix: ''}) */
  K.count = function (tl, el, to, at, dur, opt) {
    opt = opt || {}; var o = {v: opt.from || 0}, dec = opt.decimals == null ? (String(to).split('.')[1] || '').length : opt.decimals;
    var fmt = function (v) { var s = v.toFixed(dec); if (opt.comma) s = s.replace('.', ','); if (opt.sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, opt.sep); return (opt.prefix || '') + s + (opt.suffix || ''); };
    el.textContent = fmt(o.v);
    return tl.to(o, {v: to, duration: dur || 1.2, ease: S.EASE, onUpdate: function () { el.textContent = fmt(o.v); }}, at);
  };
  /** type text into an element, char by char (cps = characters per second); caret optional */
  K.type = function (tl, el, text, at, cps) {
    var o = {n: 0}; el.textContent = '';
    return tl.to(o, {n: text.length, duration: Math.max(.2, text.length / (cps || 18)), ease: 'none', onUpdate: function () { el.textContent = text.slice(0, Math.round(o.n)); }}, at);
  };
  /** draw SVG strokes (paths/lines/circles) */
  K.draw = function (tl, els, at, dur, stagger) {
    els = els instanceof Element ? [els] : Array.prototype.slice.call(els);
    els.forEach(function (p) { var L = p.getTotalLength ? p.getTotalLength() : 1000; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    return tl.to(els, {strokeDashoffset: 0, duration: dur || .8, stagger: stagger || 0, ease: S.EASE}, at);
  };
  /** slow camera push over the whole clip */
  K.push = function (tl, el, amount) { return tl.fromTo(el, {scale: 1}, {scale: 1 + (amount == null ? .045 : amount), duration: S.dur, ease: 'none'}, 0); };
  /** run a layout measurement now and again once web fonts are in (layout only, never timing) */
  K.layout = function (fn) { fn(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn); return K; };
  /** place a backdrop element vertically around a target (pad px), e.g. a paper strip behind a headline */
  K.around = function (bg, target, pad) { return K.layout(function () { var r = target.getBoundingClientRect(), p = pad == null ? 40 : pad; bg.style.top = (r.top - p) + 'px'; bg.style.height = (r.height + 2 * p) + 'px'; }); };
  /** scale an element so that its natural width fits maxW (measured once) */
  K.fitW = function (el, maxW) { var w = el.scrollWidth; el.style.scale = w > maxW ? (maxW / w).toFixed(3) : ''; return K; };

  // ── icons (inline SVG, stroke = currentColor) ─────────────────────────
  var P = {
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/>',
    star: '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z" fill="currentColor"/>',
    check: '<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    phone: '<path d="M6.6 2.5l3 .5 1.4 4-2.1 1.6a12 12 0 0 0 6.5 6.5l1.6-2.1 4 1.4.5 3a2 2 0 0 1-2 2.3A18 18 0 0 1 4.3 4.5a2 2 0 0 1 2.3-2z" fill="currentColor"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    globe: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" stroke-width="2"/>',
    route: '<path d="M12 2l9 9-9 9-9-9z" fill="currentColor"/><path d="M9 13v-2.5h5V8l3 3.5-3 3.5v-2.5h-3V13z" fill="#fff"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12.5h17M12 8.5v12M12 8.5C10 4 6 4.5 7 7c.6 1.5 5 1.5 5 1.5zM12 8.5c2-4.5 6-4 5-1.5-.6 1.5-5 1.5-5 1.5z" fill="none" stroke="currentColor" stroke-width="2"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    quote: '<path d="M4 18v-5c0-4 2-7 6-8l1 2c-2 .8-3 2.3-3 4h3v7zM13 18v-5c0-4 2-7 6-8l1 2c-2 .8-3 2.3-3 4h3v7z" fill="currentColor"/>',
    whatsapp: '<path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5z" fill="currentColor"/><path d="M8.6 7.6c.3-.6.6-.6 1-.6l.6.1 1 2.3c.1.3 0 .5-.1.7l-.6.8c.7 1.4 1.8 2.5 3.2 3.2l.8-.7c.2-.2.5-.2.7-.1l2.2 1c.2.4.2 1-.2 1.6-.5.7-1.6 1.2-2.6.9-3.3-.9-5.9-3.5-6.8-6.8-.2-.9 0-1.8.6-2.4z" fill="#fff"/>',
  };
  K.icon = function (name, cls) { return '<span class="k-ico ' + (cls || '') + '"><svg viewBox="0 0 24 24">' + (P[name] || P.check) + '</svg></span>'; };
  /** fill every [data-ico="name"] */
  K.icons = function (root) { (root || document).querySelectorAll('[data-ico]').forEach(function (el) { el.innerHTML = K.icon(el.getAttribute('data-ico')); }); return K; };
  /** 5 stars, the last one partially filled for e.g. 4.7 */
  K.stars = function (el, rating) {
    var r = Math.max(0, Math.min(5, rating == null ? 5 : rating)), h = '';
    for (var i = 0; i < 5; i++) { var f = Math.max(0, Math.min(1, r - i)); h += '<span class="k-ico" style="position:relative"><svg viewBox="0 0 24 24" style="color:rgba(0,0,0,.14);position:absolute;inset:0">' + P.star + '</svg><svg viewBox="0 0 24 24" style="position:absolute;inset:0;clip-path:inset(0 ' + ((1 - f) * 100).toFixed(0) + '% 0 0)">' + P.star + '</svg></span>'; }
    el.classList.add('k-stars'); el.innerHTML = h; return el.querySelectorAll('.k-ico');
  };
})();
