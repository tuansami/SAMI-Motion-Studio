/* SA02 · bộ phận chung: website Bếp Sen, món ăn vẽ bằng code, con trỏ, hạt nền, chữ kể chuyện. Mọi chuyển động đi qua timeline (không rAF/random). */
(function () {
  var S = window.SAMI, K = window.K = {};
  S.bindCopy(); // sami-hf.js gắn chữ lúc DOMContentLoaded (sau script cảnh) → gắn ngay để tách chữ được
  K.$ = function (q, r) { return (r || document).querySelector(q); };
  K.$$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  K.el = function (tag, cls, html, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

  /** chữ kể chuyện: từng từ rise + un-blur, rồi đứng yên */
  K.say = function (tl, sel, at, opt) {
    opt = opt || {}; var el = typeof sel === 'string' ? K.$(sel) : sel; if (!el) return at;
    var w = S.words(el); tl.set(el, {opacity: 1}, 0);
    S.arrive(tl, w, at, {dist: opt.dist || 34, blur: 10, dur: 0.7, stagger: opt.stagger || 0.06});
    return at + w.length * (opt.stagger || 0.06) + 0.7;
  };

  /** gọi fn(t) mỗi khung theo thời gian timeline (tua được, không rAF) */
  K.tick = function (tl, fn) { var o = {v: 0}; tl.to(o, {v: 1, duration: S.dur, ease: 'none', onUpdate: function () { fn(tl.time()); }}, 0); fn(0); };
  K.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  /** 0→1 có easing SAMI giữa a và b */
  K.ramp = function (t, a, b) { return S.EASE(K.clamp((t - a) / (b - a), 0, 1)); };

  /** hạt sáng trôi chậm (lớp tiền cảnh) */
  K.dust = function (tl, parent, n, seed, opt) {
    opt = opt || {}; var W = S.w, H = S.h;
    for (var i = 0; i < n; i++) {
      var d = K.el('i', 'dot', null, parent), r = S.rnd(seed + i * 7.1), r2 = S.rnd(seed + i * 3.7), r3 = S.rnd(seed + i * 1.3);
      var sz = 2 + r3 * (opt.max || 6);
      d.style.cssText += 'left:' + (r * W) + 'px;top:' + (r2 * H) + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + (opt.color || '#fff') + ';opacity:' + (0.12 + r3 * (opt.op || 0.35)) + ';filter:blur(' + (r3 > 0.7 ? 2 : 0) + 'px)';
      tl.to(d, {x: (S.rnd(seed + i) - 0.5) * 160, y: -(40 + r3 * (opt.rise || 160)), duration: S.dur, ease: 'none'}, 0);
    }
  };

  /** con trỏ chuột thật; trả về phần tử */
  K.cursor = function (parent, cls) {
    var c = K.el('div', 'cursor ' + (cls || ''), '<svg viewBox="0 0 24 24"><path d="M3 2 L3 19.5 L7.6 15.4 L10.7 22 L13.6 20.7 L10.6 14.3 L16.8 14.1 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>', parent);
    return c;
  };
  /** di chuyển con trỏ qua các điểm [{x,y,t,click}] (t tuyệt đối trong clip) */
  K.path = function (tl, el, pts, clickFx) {
    tl.set(el, {x: pts[0].x, y: pts[0].y}, 0);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      tl.to(el, {x: p.x, y: p.y, duration: Math.max(0.05, p.t - q.t - (p.hold || 0)), ease: S.EASE}, q.t);
      if (p.click) { tl.to(el, {scale: 0.82, duration: 0.06, transformOrigin: '10% 10%'}, p.t); tl.to(el, {scale: 1, duration: 0.12}, p.t + 0.06); if (clickFx) clickFx(p); }
    }
  };
  K.ring = function (tl, parent, x, y, at, color) {
    var r = K.el('i', 'ripple', null, parent); r.style.left = x + 'px'; r.style.top = y + 'px'; if (color) r.style.borderColor = color;
    tl.fromTo(r, {opacity: 0.9, scale: 0.2}, {opacity: 0, scale: 1.1, duration: 0.55, ease: 'power2.out', immediateRender: false}, at);
    return r;
  };


  /** cửa sổ công cụ thiết kế không nhãn hiệu, kích thước gốc 1000×1050 (S04, S05 dùng chung) */
  K.LAYERS = ['Navigation', 'Hero', 'Headline', 'Ảnh món', 'Speisekarte', 'Nút đặt bàn'];
  K.tool = function (parent) {
    var ic = function (d) { return '<span class="tbtn"><svg viewBox="0 0 24 24">' + d + '</svg></span>'; };
    var t = K.el('div', 'tool', null, parent); t.id = 'tool';
    t.style.width = '1000px'; t.style.height = '1050px';
    t.innerHTML = '<div class="bar"><div class="dots"><i></i><i></i><i></i></div>' +
      '<span class="tbtn on" style="margin-left:14px"><svg viewBox="0 0 24 24"><path d="M5 3 L5 19 L9.5 15 L12.5 21 L15 20 L12 14 L18 14 Z"/></svg></span>' +
      ic('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9 H20 M9 9 V20"/>') + ic('<path d="M5 6 V4 H19 V6 M12 4 V20 M9 20 H15"/>') + ic('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17 L9 13 L13 16 L17 12 L21 15"/>') + ic('<circle cx="12" cy="12" r="8"/><path d="M12 4 V20 M4 12 H20"/>') +
      '<span class="fname">Bếp Sen · Website <span style="opacity:.5">/ Desktop + Mobil</span></span><span style="width:150px"></span></div>' +
      '<div class="canvas" style="left:0;top:64px;width:1000px;height:726px;overflow:hidden"><div id="world" style="position:absolute;left:0;top:0;width:1000px;height:726px;transform-origin:0 0"></div></div>' +
      '<div class="panel" style="left:0;top:790px;width:430px;height:260px;border-top-width:1px;border-right-width:1px"><div class="ptitle">Layers</div><div id="layers" style="height:196px;overflow:hidden"><div id="lyin"></div></div></div>' +
      '<div class="panel" style="left:430px;top:790px;width:570px;height:260px;border-top-width:1px"><div class="ptitle">Stil · Farben</div><div id="swatches" style="margin-bottom:16px"></div><div class="ptitle" style="margin-bottom:8px">Schrift</div><div id="fonts"></div></div>';
    var L = K.$('#lyin', t);
    K.LAYERS.forEach(function (n, i) { var r = K.el('div', 'layer', '<i></i>' + n, L); r.id = 'ly' + i; if (i > 3) r.style.display = 'none'; });
    var cols = ['#1F3B2D', '#E8A5A0', '#F5EFE4', '#C49A5A', '#17261D'], W = K.$('#swatches', t);
    cols.forEach(function (c, i) { var sw = K.el('span', 'sw', null, W); sw.id = 'sw' + i; sw.style.background = c; });
    var F = K.$('#fonts', t);
    [['Fraunces', 'Fraunces', '600 · Titel'], ['Inter', 'Inter', '500 · Text']].forEach(function (f, i) { var r = K.el('div', 'fontrow', '<span style="font-family:' + f[1] + ';font-weight:600">' + f[0] + '</span><small>' + f[2] + '</small>', F); r.id = 'fr' + i; });
    return t;
  };

  // ── món ăn vẽ bằng code (viewBox 0 0 200 200) ──
  var uid = 0;
  K.food = function (kind) {
    var p = 'f' + (uid++);
    var plate = '<defs><radialGradient id="' + p + 'pl" cx="45%" cy="40%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#EFE8DC"/><stop offset="1" stop-color="#D9CDB9"/></radialGradient>' +
      '<radialGradient id="' + p + 'br" cx="42%" cy="38%"><stop offset="0" stop-color="#E9B66A"/><stop offset=".7" stop-color="#C98A3E"/><stop offset="1" stop-color="#9C6326"/></radialGradient>' +
      '<radialGradient id="' + p + 'sh" cx="50%" cy="50%"><stop offset=".6" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'cr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6D27A"/><stop offset="1" stop-color="#E0A53E"/></linearGradient></defs>' +
      '<circle cx="104" cy="108" r="92" fill="url(#' + p + 'sh)"/>';
    var leaf = function (x, y, r, s) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + (s || 1) + ')" d="M0 0 C6 -10 18 -10 24 0 C18 10 6 10 0 0 Z" fill="#4E9A3F" stroke="#2F6B27" stroke-width="1"/><path transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + (s || 1) + ')" d="M2 0 L22 0" stroke="#86C26E" stroke-width="1.2"/>'; };
    if (kind === 'pho') {
      var s = plate + '<circle cx="100" cy="100" r="90" fill="#F7F2EA"/><circle cx="100" cy="100" r="86" fill="none" stroke="#3B6E8F" stroke-width="3"/><circle cx="100" cy="100" r="74" fill="url(#' + p + 'br)"/>';
      for (var i = 0; i < 9; i++) { var a = i * 40; s += '<path d="M' + (60 + (i % 3) * 12) + ' ' + (70 + i * 7) + ' q 22 -14 44 0 t 40 0" fill="none" stroke="#FFF6E2" stroke-width="5" stroke-linecap="round" opacity=".92" transform="rotate(' + (a % 50 - 25) + ' 100 100)"/>'; }
      s += '<ellipse cx="82" cy="86" rx="20" ry="12" fill="#9E4E3A" transform="rotate(-20 82 86)"/><ellipse cx="118" cy="80" rx="19" ry="11" fill="#B0614A" transform="rotate(25 118 80)"/><ellipse cx="108" cy="118" rx="21" ry="12" fill="#A3533E" transform="rotate(-8 108 118)"/>';
      s += '<path d="M82 86 m-14 0 q14 -6 28 0" stroke="#D99A84" stroke-width="2" fill="none" transform="rotate(-20 82 86)"/>';
      s += leaf(58, 116, -30) + leaf(130, 104, 40) + leaf(96, 140, 10, .9) + leaf(70, 70, 60, .8);
      s += '<circle cx="138" cy="132" r="5" fill="none" stroke="#D7262E" stroke-width="3"/><circle cx="146" cy="122" r="4" fill="none" stroke="#D7262E" stroke-width="3"/>';
      s += '<path d="M140 62 L164 52 A26 26 0 0 1 160 78 Z" fill="#9BCB5A" stroke="#5C8E2E" stroke-width="2"/>';
      s += '<ellipse cx="78" cy="70" rx="22" ry="8" fill="#fff" opacity=".18" transform="rotate(-30 78 70)"/>';
      return '<svg viewBox="0 0 200 200">' + s + '</svg>';
    }
    if (kind === 'rolls') {
      var r = plate + '<circle cx="100" cy="100" r="88" fill="url(#' + p + 'pl)"/><circle cx="100" cy="100" r="70" fill="none" stroke="#E2D6C2" stroke-width="2"/>';
      for (var j = 0; j < 3; j++) {
        var y = 62 + j * 34;
        r += '<g transform="rotate(-18 100 100)"><rect x="40" y="' + y + '" width="112" height="30" rx="15" fill="#F4EEE2" opacity=".96"/><ellipse cx="70" cy="' + (y + 15) + '" rx="13" ry="8" fill="#F08A6E" opacity=".75"/><ellipse cx="98" cy="' + (y + 15) + '" rx="12" ry="8" fill="#F29C7D" opacity=".7"/><rect x="112" y="' + (y + 8) + '" width="30" height="14" rx="7" fill="#6FB25A" opacity=".65"/><rect x="40" y="' + y + '" width="112" height="30" rx="15" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></g>';
      }
      r += '<circle cx="150" cy="148" r="20" fill="#fff" stroke="#E2D6C2" stroke-width="2"/><circle cx="150" cy="148" r="14" fill="#8A4B25"/><circle cx="146" cy="145" r="3" fill="#D7262E"/>' + leaf(46, 150, -40, .8);
      return '<svg viewBox="0 0 200 200">' + r + '</svg>';
    }
    // bánh xèo
    var b = plate + '<circle cx="100" cy="100" r="88" fill="url(#' + p + 'pl)"/>';
    b += '<path d="M28 112 A72 72 0 0 1 172 112 Z" fill="url(#' + p + 'cr)" stroke="#C88A2E" stroke-width="2"/>';
    for (var k = 0; k < 14; k++) b += '<circle cx="' + (44 + S.rnd(k) * 112) + '" cy="' + (60 + S.rnd(k + 9) * 48) + '" r="' + (2 + S.rnd(k + 3) * 4) + '" fill="#B9762A" opacity=".55"/>';
    b += '<path d="M28 112 L172 112" stroke="#A86A22" stroke-width="3"/>' + leaf(52, 138, 10) + leaf(84, 146, -12) + leaf(118, 140, 22) + leaf(146, 130, 40, .9);
    b += '<ellipse cx="104" cy="122" rx="12" ry="6" fill="#F7C9C0"/><ellipse cx="80" cy="124" rx="9" ry="5" fill="#E9F0D9"/>';
    return '<svg viewBox="0 0 200 200">' + b + '</svg>';
  };

  /** website Bếp Sen. mode 'd' (desktop) | 'm' (di động). fontPx = cỡ chữ gốc (em) */
  K.site = function (parent, mode, w, h, fontPx) {
    var s = K.el('div', 'site' + (mode === 'm' ? ' m' : ''), null, parent);
    s.style.width = w + 'px'; s.style.height = h + 'px'; s.style.fontSize = fontPx + 'px';
    var lotus = '<svg viewBox="0 0 40 30" style="width:1.1em;height:.85em"><path d="M20 28 C12 22 10 12 20 2 C30 12 28 22 20 28Z" fill="#E8A5A0"/><path d="M20 28 C10 27 3 20 2 12 C10 12 17 18 20 28Z" fill="#C98580"/><path d="M20 28 C30 27 37 20 38 12 C30 12 23 18 20 28Z" fill="#C98580"/></svg>';
    s.innerHTML =
      '<div class="nav blk" data-b="nav"><div class="logo">' + lotus + 'Bếp Sen</div><div class="links"><span>Speisekarte</span><span>Gutschein</span><span>Kontakt</span><span>DE | EN</span></div>' +
      (mode === 'm' ? '<div class="burger"></div>' : '<div class="btn" style="font-size:.46em;padding:.6em 1.2em">Reservieren</div>') + '</div>' +
      '<div class="hero blk" data-b="hero"><div class="htxt"><h1 class="blk" data-b="h1">Frisch.<br>Hausgemacht.<br><i>Vietnamesisch.</i></h1><p class="blk" data-b="p">Vietnamesische Küche in Dresden</p><div class="btn blk" data-b="cta">Jetzt reservieren</div></div>' +
      '<div class="himg blk" data-b="img">' + K.food('pho') + '</div></div>' +
      '<div class="cards">' +
      '<div class="card2 blk" data-b="c1"><div class="ph">' + K.food('pho') + '</div><div class="t"><span>Phở Bò</span><span>14,90 €</span></div><div class="a">Allergene: A, F</div></div>' +
      '<div class="card2 blk" data-b="c2"><div class="ph">' + K.food('rolls') + '</div><div class="t"><span>Gỏi cuốn</span><span>7,50 €</span></div><div class="a">Allergene: B, E · V</div></div>' +
      '<div class="card2 blk" data-b="c3"><div class="ph">' + K.food('xeo') + '</div><div class="t"><span>Bánh Xèo</span><span>13,50 €</span></div><div class="a">Allergene: C, F</div></div></div>' +
      (mode === 'm' ? '<div class="sticky blk" data-b="sticky"><span class="cal"></span>Jetzt reservieren</div>' : '<div class="foot blk" data-b="foot">Di–So 11:30–22:00 · Montag Ruhetag</div>');
    K.$$('.ph svg', s).forEach(function (v) { v.style.cssText = 'position:absolute;left:12%;top:4%;width:76%;height:92%'; });
    K.$$('.himg svg', s).forEach(function (v) { v.style.cssText = 'width:100%;height:100%;filter:drop-shadow(0 .4em .6em rgba(0,0,0,.35))'; });
    return s;
  };
})();
