/* SA12 · bộ phận chung "Exploded Teardown": trang Quán Mây 8 lớp, rig 3D, nhãn bản vẽ, khung cảnh đếm ngược.
   Mọi chuyển động là hàm của thời gian timeline (không rAF/random/Date). Lưới nhạc 126 BPM: K.b(n). */
(function () {
  var S = window.SAMI, K = window.K = {};
  S.bindCopy(); // gắn chữ ngay (sami-hf.js gắn lúc DOMContentLoaded, sau script cảnh)
  K.$ = function (q, r) { return (r || document).querySelector(q); };
  K.$$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  K.el = function (tag, cls, html, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  K.P = S.portrait;
  K.B = 60 / 126;
  K.b = function (n) { return S.t0 + n * K.B; };           // phách nhạc 126 BPM tính từ nhịp cắt
  K.out = function () { return S.dur - 8 / 30; };            // nhịp cắt ra
  K.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  K.ramp = function (t, a, b) { return S.EASE(K.clamp((t - a) / (b - a), 0, 1)); };
  K.lerp = function (a, b, p) { return a + (b - a) * p; };

  /** chữ kể chuyện: từng từ rise + un-blur, rồi đứng yên */
  K.say = function (tl, sel, at, opt) {
    opt = opt || {}; var el = typeof sel === 'string' ? K.$(sel) : sel; if (!el) return at;
    var w = S.words(el); tl.set(el, {opacity: 1}, 0);
    S.arrive(tl, w, at, {dist: opt.dist || 30, blur: 10, dur: 0.7, stagger: opt.stagger || 0.055});
    return at + w.length * (opt.stagger || 0.055) + 0.7;
  };
  /** timeline phụ (không đăng ký) — tua trong K.tick để đọc giá trị tween đúng khung */
  K.sub = function () { return window.gsap.timeline({paused: true, defaults: {ease: S.EASE}}); };
  /** fn(t) mỗi khung theo thời gian timeline */
  // chạy cả trong tween con (dự phòng) lẫn onUpdate của timeline (chạy SAU mọi tween con → đọc đúng trạng thái khung)
  K.tick = function (tl, fn) {
    var o = {v: 0}; tl.to(o, {v: 1, duration: S.dur, ease: 'none', onUpdate: function () { fn(tl.time()); }}, 0);
    if (!tl._kf) { tl._kf = []; tl.eventCallback('onUpdate', function () { var t = tl.time(); tl._kf.forEach(function (f) { f(t); }); }); }
    tl._kf.push(fn); fn(0);
  };

  /** hạt bụi sáng trôi chậm (lớp tiền cảnh) */
  K.dust = function (tl, parent, n, seed, opt) {
    opt = opt || {};
    for (var i = 0; i < n; i++) {
      var d = K.el('i', '', null, parent), r = S.rnd(seed + i * 7.1), r2 = S.rnd(seed + i * 3.7), r3 = S.rnd(seed + i * 1.3), sz = 2 + r3 * (opt.max || 5);
      d.style.cssText = 'position:absolute;border-radius:50%;left:' + (r * S.w) + 'px;top:' + (r2 * S.h) + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + (opt.color || '#E3E4F7') + ';opacity:' + (0.1 + r3 * (opt.op || 0.3)) + ';filter:blur(' + (r3 > 0.7 ? 2 : 0) + 'px)';
      tl.to(d, {x: (S.rnd(seed + i) - 0.5) * 120, y: -(30 + r3 * (opt.rise || 120)), duration: S.dur, ease: 'none'}, 0);
    }
  };
  /** nền chung: lưới chấm trôi + sàn bóng + ánh viền */
  K.bg = function (tl, stage, opt) {
    opt = opt || {};
    var d = K.el('div', 'dots', null, stage);
    tl.fromTo(d, {x: 0, y: 0}, {x: -22, y: -30, duration: S.dur, ease: 'none'}, 0);
    var r1 = K.el('div', 'rim', null, stage); r1.style.cssText += 'left:-10%;top:' + (K.P ? 18 : 5) + '%;width:60%;height:40%;background:radial-gradient(circle,rgba(118,103,254,.55),transparent 65%)';
    var r2 = K.el('div', 'rim', null, stage); r2.style.cssText += 'right:-12%;top:' + (K.P ? 46 : 40) + '%;width:55%;height:40%;background:radial-gradient(circle,rgba(8,221,164,.3),transparent 65%)';
    tl.fromTo(r1, {x: 0}, {x: 60, duration: S.dur, ease: 'none'}, 0);
    tl.fromTo(r2, {x: 0}, {x: -50, duration: S.dur, ease: 'none'}, 0);
    var fx = K.el('div', '', null, stage); fx.style.cssText = 'position:absolute;inset:0;z-index:45;pointer-events:none';
    K.dust(tl, fx, opt.dust || 26, opt.seed || 12, {op: 0.28});
    return fx;
  };

  /** glitch RGB ngắn (bước theo khung, tất định) trong các cửa sổ [[t, dur], …] */
  K.glitch = function (tl, el, wins, amp, seed) {
    amp = amp || 22; seed = seed || 3;
    K.tick(tl, function (t) {
      var on = null; wins.forEach(function (w) { if (t >= w[0] && t < w[0] + w[1]) on = w; });
      if (!on) { el.style.textShadow = ''; el.style.translate = ''; el.style.clipPath = ''; return; }
      var f = Math.floor(t * 30), dx = (S.rnd(f * 1.7 + seed) - 0.5) * amp, y1 = S.rnd(f * 2.3 + seed) * 70;
      el.style.textShadow = dx + 'px 0 rgba(255,84,104,.9), ' + (-dx) + 'px 0 rgba(118,103,254,.9)';
      el.style.translate = (dx * 0.35) + 'px 0';
      el.style.clipPath = S.rnd(f + seed * 9) > 0.5 ? 'inset(' + y1 + '% 0 ' + (100 - y1 - 22) + '% 0)' : '';
    });
  };
  /** chữ giải mã kiểu glitch: p 0→1 từ a sang b */
  var GLY = '#%&/<>[]{}=+*01ÄÖÜß';
  K.scramble = function (a, b, p, seed) {
    var n = Math.max(a.length, b.length), out = '';
    for (var i = 0; i < n; i++) {
      var k = (i + 1) / n, ch;
      if (p >= k) ch = b[i] || ''; else if (p >= k - 0.25) ch = (b[i] || a[i] || ' ') === ' ' ? ' ' : GLY[Math.floor(S.rnd(seed + i * 3.1 + Math.floor(p * 40)) * GLY.length)]; else ch = a[i] || '';
      out += ch;
    }
    return out;
  };

  /** con trỏ chuột; K.path(tl, el, [{x,y,t,click}]) */
  K.cursor = function (parent) { return K.el('div', 'cursor', '<svg viewBox="0 0 24 24"><path d="M3 2 L3 19.5 L7.6 15.4 L10.7 22 L13.6 20.7 L10.6 14.3 L16.8 14.1 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>', parent); };
  K.path = function (tl, el, pts, clickFx) {
    tl.set(el, {x: pts[0].x, y: pts[0].y}, 0);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      tl.to(el, {x: p.x, y: p.y, duration: Math.max(0.05, p.t - q.t - 0.05), ease: S.EASE}, q.t);
      if (p.click) { tl.to(el, {scale: 0.82, duration: 0.06, transformOrigin: '10% 10%'}, p.t); tl.to(el, {scale: 1, duration: 0.12}, p.t + 0.06); if (clickFx) clickFx(p); }
    }
  };
  K.ring = function (tl, parent, x, y, at, color) {
    var r = K.el('i', 'ripple', null, parent); r.style.left = x + 'px'; r.style.top = y + 'px'; if (color) r.style.borderColor = color;
    tl.fromTo(r, {opacity: 0.95, scale: 0.2}, {opacity: 0, scale: 1.1, duration: 0.55, ease: 'power2.out', immediateRender: false}, at);
  };

  // ── món ăn vẽ bằng code (viewBox 0 0 100 100, nhìn từ trên) ──
  K.bowl = function (kind) {
    var s = '<circle cx="51" cy="53" r="47" fill="#000" opacity=".22"/><circle cx="50" cy="50" r="46" fill="#F7F3EC"/><circle cx="50" cy="50" r="43" fill="none" stroke="#3E5A86" stroke-width="2"/>';
    var leaf = function (x, y, r) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M0 0 C3 -5 9 -5 12 0 C9 5 3 5 0 0Z" fill="#5FA34B"/>'; };
    if (kind === 'pho') {
      s += '<circle cx="50" cy="50" r="37" fill="#D59A4C"/><circle cx="46" cy="45" r="30" fill="#E2AE62" opacity=".6"/>';
      for (var i = 0; i < 6; i++) s += '<path d="M' + (24 + i * 2) + ' ' + (34 + i * 6) + ' q12 -7 24 0 t24 0" stroke="#FFF6E4" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
      s += '<ellipse cx="40" cy="42" rx="10" ry="6" fill="#A2533E" transform="rotate(-18 40 42)"/><ellipse cx="60" cy="40" rx="9" ry="5.5" fill="#B4644C" transform="rotate(22 60 40)"/><ellipse cx="54" cy="60" rx="10" ry="6" fill="#9E4E39"/>';
      s += leaf(28, 58, -30) + leaf(64, 54, 35) + leaf(44, 70, 5) + '<circle cx="70" cy="64" r="2.6" fill="none" stroke="#D7262E" stroke-width="1.6"/><path d="M68 26 L80 22 A13 13 0 0 1 78 35Z" fill="#A8CF62"/>';
    } else if (kind === 'bun') {
      s += '<circle cx="50" cy="50" r="37" fill="#F1EADB"/>';
      for (var j = 0; j < 9; j++) s += '<path d="M' + (22 + (j % 3) * 4) + ' ' + (30 + j * 5) + ' q10 -4 20 0 t20 0 t14 0" stroke="#FFFFFF" stroke-width="2.4" fill="none" opacity=".95"/>';
      s += '<rect x="30" y="34" width="18" height="12" rx="4" fill="#8C4A26" transform="rotate(-12 39 40)"/><rect x="52" y="48" width="18" height="12" rx="4" fill="#7A3E1F" transform="rotate(14 61 54)"/><rect x="36" y="56" width="15" height="10" rx="4" fill="#94522B"/>';
      s += leaf(58, 30, 30) + leaf(24, 52, -40) + leaf(62, 70, 10);
    } else if (kind === 'roll') {
      s += '<circle cx="50" cy="50" r="38" fill="#EFE7DA"/>';
      for (var k = 0; k < 3; k++) { var y = 32 + k * 15; s += '<g transform="rotate(-20 50 50)"><rect x="20" y="' + y + '" width="58" height="13" rx="6.5" fill="#F7F1E6" stroke="#fff"/><ellipse cx="36" cy="' + (y + 6.5) + '" rx="6" ry="3.6" fill="#EF8D72" opacity=".8"/><rect x="50" y="' + (y + 3) + '" width="18" height="7" rx="3.5" fill="#6FB25A" opacity=".75"/></g>'; }
      s += '<circle cx="72" cy="72" r="9" fill="#fff" stroke="#E0D6C4"/><circle cx="72" cy="72" r="6" fill="#8A4B25"/>';
    } else { // curry
      s += '<circle cx="50" cy="50" r="37" fill="#E6A33B"/><circle cx="45" cy="44" r="27" fill="#F0B954" opacity=".55"/>';
      [[36, 40], [56, 36], [62, 56], [42, 60], [50, 48]].forEach(function (p, i) { s += '<rect x="' + p[0] + '" y="' + p[1] + '" width="9" height="9" rx="2" fill="#FBF3DC" transform="rotate(' + (i * 17) + ' ' + (p[0] + 4) + ' ' + (p[1] + 4) + ')"/>'; });
      s += leaf(30, 54, -20) + leaf(60, 68, 30) + '<circle cx="66" cy="42" r="2.4" fill="#D7262E"/>';
    }
    return '<svg viewBox="0 0 100 100">' + s + '</svg>';
  };
  K.cloudSvg = '<svg viewBox="0 0 36 24"><path d="M9 21 C3 21 1 16 4.5 13 C3.5 8 9 5.5 12.5 8.5 C14.5 3 23.5 3 25 9.5 C30.5 8.5 34.5 13 32 17.5 C31 20 29 21 27 21 Z" fill="none" stroke="#EFA48B" stroke-width="2.6" stroke-linejoin="round"/></svg>';
  K.MENU = [['pho', 'Phở Bò', 'A, F', '14,90 €'], ['roll', 'Sommerrollen [V]', 'F', '7,90 €'], ['bun', 'Bún Chả', 'A, F', '15,50 €'], ['curry', 'Tofu-Curry [V]', 'F', '13,90 €']];

  /** trang Quán Mây: 8 lớp (L[0] nền móng SEO … L[7] cookie). W = bề rộng px, cao = 2,08 W */
  K.page = function (parent, W, opt) {
    opt = opt || {}; var H = Math.round(W * 2.08);
    var pg = K.el('div', 'pg stk', null, parent); pg.style.width = W + 'px'; pg.style.height = H + 'px'; pg.style.fontSize = (W / 20) + 'px';
    var L = [];
    for (var i = 0; i < 8; i++) { var l = K.el('div', 'lay', null, pg); l.dataset.i = i; L.push(l); }
    // L0 · nền móng: cấu trúc SEO
    L[0].style.background = 'linear-gradient(160deg, rgba(8,221,164,.16), rgba(118,103,254,.12))';
    L[0].innerHTML = '<div class="code" style="top:7%">&lt;title&gt;Quán Mây · <em>Vietnamesisch in Leipzig</em>&lt;/title&gt;<br>&lt;meta name="description" …&gt;<br>&lt;link hreflang="<em>de</em>"&gt; &lt;link hreflang="<em>en</em>"&gt;<br>&lt;h1&gt;Frisch gekocht&lt;/h1&gt;<br><br>"@type": "<em>Restaurant</em>",<br>"servesCuisine": "Vietnamesisch",<br>"openingHours": "Di–So 11:30–22:00",<br>"acceptsReservations": <em>true</em><br><br>sitemap.xml · robots.txt<br>&lt;img alt="Phở Bò …"&gt;</div>';
    // L1 · lõi tốc độ: biểu đồ thác
    L[1].style.background = 'rgba(14,12,30,.55)';
    var wf = '<div class="wf" style="top:20%">';
    [['document', 0, 12], ['styles.css', 10, 26], ['fonts.woff2', 14, 38], ['hero.avif', 22, 58], ['menu.avif', 30, 66], ['app.js', 34, 74]].forEach(function (r) { wf += '<div class="r"><b>' + r[0] + '</b><span style="left:' + (40 + r[1] * 0.6) + '%;width:' + ((r[2] - r[1]) * 0.6) + '%"></span></div>'; });
    L[1].innerHTML = wf + '</div><div class="code" style="top:44%;font-size:.9em;color:#08DDA4">1,5 s</div>';
    // L2 · bố cục: nền trang, hero, khối
    L[2].innerHTML = '<div class="pgbg" style="position:absolute;inset:0;background:var(--cream)"></div><div class="hero"><div class="cloud" style="left:-8%;top:58%;width:42%;height:7%"></div><div class="cloud" style="left:58%;top:12%;width:30%;height:5%"></div>' +
      '<div class="bowl" style="left:46%;top:46%;width:66%;aspect-ratio:1">' + K.bowl('pho') + '</div></div>' +
      '<div class="sec" style="top:43%;height:15%;background:var(--cream2)"></div>';
    for (var r = 0; r < 4; r++) { var c = K.el('div', 'card', null, L[2]); c.style.top = (64.5 + r * 7) + '%'; c.style.height = '6.4%'; }
    // L3 · nút đặt bàn cố định
    L[3].innerHTML = '<div class="sticky"><i></i><span class="t">Jetzt reservieren</span></div>';
    // L4 · Speisekarte
    var m = '<div class="mh">Speisekarte</div><div class="pdf">PDF ↓</div>';
    K.MENU.forEach(function (it, i) { m += '<div class="row" style="top:' + (64.5 + i * 7) + '%"><div class="th">' + K.bowl(it[0]) + '</div><div class="nm2">' + it[1] + '<span class="al">Allergene: ' + it[2] + '</span></div><div class="pr">' + it[3] + '</div></div>'; });
    L[4].innerHTML = m;
    // L5 · ngôn ngữ: nav + chữ hero
    L[5].innerHTML = '<div class="nav"><div class="logo">' + K.cloudSvg + 'Quán Mây</div><div style="display:flex;align-items:center;gap:.6em"><div class="lang"><span class="on">DE</span><span>EN</span></div><div class="burger"></div></div></div>' +
      '<div class="h1">Frisch gekocht.<br><i>Jeden Tag.</i></div><div class="lead">Vietnamesische Küche in Leipzig</div><div class="hbtn">Tisch reservieren</div>';
    // L6 · Gutschein
    L[6].innerHTML = '<div class="gift"><svg class="ico" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M3 13 H21 M12 9 V21" stroke="#fff" stroke-width="1.8"/><path d="M12 9 C9 4 5 6 7.5 9 M12 9 C15 4 19 6 16.5 9" fill="none" stroke="#fff" stroke-width="1.8"/></svg><div><b>Gutschein verschenken</b><small>Online kaufen · 3 Jahre gültig</small></div><span class="chip">ab 25 €</span></div>';
    // L7 · cookie
    L[7].innerHTML = '<div class="cookie"><b>Wir verwenden Cookies</b><div class="ln" style="width:92%"></div><div class="ln" style="width:70%"></div>' +
      '<div class="tg">Notwendig <u class="on"></u></div><div class="tg">Statistik <u></u></div><div class="tg">Marketing <u></u></div>' +
      '<div class="bt"><span>Nur notwendige</span><span class="f">Alle akzeptieren</span></div></div>';
    // điểm neo cho nhãn (cạnh phải mỗi lớp, ở độ cao của bộ phận chính)
    var AY = [12, 30, 30, 92, 70, 6, 50, 62];
    L.forEach(function (l, i) { var a = K.el('i', 'anc', null, l); a.style.left = '100%'; a.style.top = AY[i] + '%'; l.anc = a; var b = K.el('i', 'anc', null, l); b.style.left = '0'; b.style.top = AY[i] + '%'; l.ancL = b; });
    return {el: pg, L: L, W: W, H: H};
  };

  /** rig 3D cho trang: st = {x, y, s, rx, ry, rz, ex (độ tách 0..1), gap, lift[8]} */
  K.rig = function (parent, W) {
    var cam = K.el('div', 'cam', null, parent), p = K.page(cam, W);
    var st = {x: S.w / 2, y: S.h / 2, s: 1, rx: 0, ry: 0, rz: 0, ex: 0, gap: 120, glass: 0, lift: [0, 0, 0, 0, 0, 0, 0, 0], op: [1, 1, 1, 1, 1, 1, 1, 1], bg: 1};
    p.st = st; p.cam = cam;
    p.apply = function () {
      p.el.style.transform = 'translate3d(' + (st.x - W / 2) + 'px,' + (st.y - p.H / 2) + 'px,0) scale(' + st.s + ') rotateX(' + st.rx + 'deg) rotateY(' + st.ry + 'deg) rotateZ(' + st.rz + 'deg)';
      p.L.forEach(function (l, i) {
        l.style.transform = 'translateZ(' + ((i - 3.5) * st.gap * st.ex + st.lift[i]) + 'px)';
        l.style.opacity = st.op[i] * (i < 2 ? K.clamp(st.ex * 1.5, 0, 1) : 1);
        l.style.boxShadow = st.glass > 0 ? 'inset 0 0 0 ' + (1.5 * st.glass) + 'px rgba(227,228,247,' + (0.45 * st.glass) + '), 0 0 ' + (40 * st.glass) + 'px rgba(118,103,254,' + (0.12 * st.glass) + ')' : '';
        if (st.glass > 0 && i > 2) l.style.background = 'rgba(227,228,247,' + (0.05 * st.glass) + ')'; else if (i > 2) l.style.background = '';
      });
      var bg = K.$('.pgbg', p.L[2]); bg.style.opacity = st.bg; K.$('.hero', p.L[2]).style.opacity = 0.35 + 0.65 * st.bg; K.$('.sec', p.L[2]).style.opacity = st.bg;
      K.$$('.card', p.L[2]).forEach(function (c) { c.style.opacity = 0.25 + 0.75 * st.bg; });
    };
    p.apply();
    return p;
  };

  /** nhãn bản vẽ: items [{anc, ix, nm, sp, x, y, align}] — đường dẫn từ chấm neo tới nhãn; it.p 0→1 (vẽ dây rồi hiện chữ) */
  K.leads = function (stage, items) {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'leads'); svg.setAttribute('width', S.w); svg.setAttribute('height', S.h); stage.appendChild(svg);
    items.forEach(function (it) {
      it.p = it.p || 0;
      it.line = document.createElementNS(NS, 'polyline'); svg.appendChild(it.line);
      it.dot = document.createElementNS(NS, 'circle'); it.dot.setAttribute('r', 6); svg.appendChild(it.dot);
      it.lb = K.el('div', 'lbl', '<span class="bg"></span>' + (it.ix ? '<span class="ix">' + it.ix + '</span>' : '') + '<span class="nm">' + it.nm + '</span>' + (it.sp ? '<span class="sp"' + (it.ix ? '' : ' style="padding-left:0"') + '>' + it.sp + '</span>' : ''), stage);
    });
    var upd = function (t) {
      if (t != null) items.forEach(function (it) { if (it.at != null) it.p = K.clamp((t - it.at) / 0.8, 0, 1); if (it.outAt != null) it.vis = 1 - K.clamp((t - it.outAt) / 0.25, 0, 1); });
      var r0 = stage.getBoundingClientRect(), k = S.w / r0.width;
      items.forEach(function (it) {
        var a = it.anc ? it.anc.getBoundingClientRect() : null;
        var ax = a ? (a.left + a.width / 2 - r0.left) * k : it.ax, ay = a ? (a.top + a.height / 2 - r0.top) * k : it.ay;
        var lx = typeof it.x === 'function' ? it.x() : it.x, ly = it.follow ? ay + (it.dy || 0) : it.y;
        var right = it.align === 'right', ex = lx + (right ? 14 : -14);
        var mx = ax + (ex - ax) * 0.55;
        var pts = [[ax, ay], [mx, ly + 0], [ex, ly]];
        if (Math.abs(ly - ay) < 6) pts = [[ax, ay], [ex, ly]];
        var p = K.clamp(it.p * 1.6, 0, 1), tot = 0, seg = [];
        for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
        var want = tot * p, out = [pts[0]];
        for (var j = 1; j < pts.length && want > 0; j++) { var f = Math.min(1, want / (seg[j - 1] || 1)); out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]); want -= seg[j - 1]; }
        it.line.setAttribute('points', out.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '));
        var vis = (it.vis == null ? 1 : it.vis);
        it.line.style.opacity = it.p > 0 ? vis : 0; it.dot.setAttribute('cx', ax); it.dot.setAttribute('cy', ay); it.dot.style.opacity = (it.p > 0 ? 1 : 0) * vis;
        var lo = K.clamp((it.p - 0.55) / 0.45, 0, 1);
        it.lb.style.opacity = lo * vis; it.lb.style.transform = 'translate(' + (right ? 0 : 0) + 'px,' + ((1 - lo) * 10) + 'px)';
        if (right) { it.lb.style.left = 'auto'; it.lb.style.right = (S.w - lx) + 'px'; it.lb.style.textAlign = 'right'; } else { it.lb.style.left = lx + 'px'; }
        it.lb.style.top = (ly - 20) + 'px';
      });
    };
    return {items: items, update: upd};
  };

  /** khung cảnh đếm ngược S04–S10. cfg = {n, key:'S04', pw, ph, build(plate, ctx), labels:[{key, anc(ctx)→el, at}], focus} */
  K.item = function (cfg) {
    var stage = K.$('#stage'), tl = S.timeline(), P = K.P, n = cfg.n;
    var fx = K.bg(tl, stage, {seed: 20 + n, dust: 20});
    // khung nhìn (macro) + trang Quán Mây phía sau, tối
    var V = P ? {x: 72, y: 540, w: 936, h: 820} : {x: 880, y: 80, w: 940, h: 920};
    var vp = K.el('div', 'vp', null, stage); vp.style.cssText += 'left:' + V.x + 'px;top:' + V.y + 'px;width:' + V.w + 'px;height:' + V.h + 'px';
    var bgp = K.page(vp, 760); bgp.el.style.left = (V.w / 2 - 380) + 'px';
    bgp.L.forEach(function (l, i) { if (i < 2) l.style.display = 'none'; l.style.opacity = i === n ? 1 : 0.55; });
    K.el('div', 'tint', null, vp);
    var fy = cfg.focus == null ? 0.5 : cfg.focus;
    tl.fromTo(bgp.el, {y: -bgp.H * fy + V.h / 2 + 120, scale: 2.2, opacity: 0}, {y: -bgp.H * fy + V.h / 2, scale: 1.15, opacity: 1, duration: 0.9}, 0);
    tl.to(bgp.el, {y: '-=70', duration: S.dur - 1.2, ease: 'none'}, 0.9);
    // tấm kính nổi: bộ phận được nhấc ra khỏi chồng lớp
    var pw = cfg.pw, ph = cfg.ph;
    var plate = K.el('div', 'plate', null, stage);
    var px0 = V.x + (V.w - pw) / 2, py0 = V.y + (V.h - ph) / 2 + (cfg.dy || 0);
    plate.style.cssText += 'left:' + px0 + 'px;top:' + py0 + 'px;width:' + pw + 'px;height:' + ph + 'px;' + (cfg.plateCss || '');
    tl.fromTo(plate, {opacity: 0, rotationX: 52, rotationZ: -24, scale: 0.62, y: 120, transformPerspective: 1800}, {opacity: 1, rotationX: 0, rotationZ: 0, scale: 1, y: 0, duration: 1.0}, 0.12);
    tl.to(plate, {y: -14, duration: S.dur - 2, ease: 'none'}, 1.1);
    // số đếm + kicker + thanh tiến trình + chồng lớp nhỏ
    var num = K.el('div', 'num', '0' + n + '<span class="f">0' + n + '</span>', stage);
    num.style.cssText += P ? 'left:64px;top:205px' : 'left:100px;top:62px;font-size:250px';
    var kk = K.el('div', 'kick', 'Điểm kiểm tra', stage); kk.style.cssText += 'position:absolute;z-index:20;' + (P ? 'left:392px;top:262px' : 'left:392px;top:118px;font-size:24px');
    var kk2 = K.el('div', 'mono', 'Lớp 0' + n + ' / 07', stage); kk2.style.cssText += 'position:absolute;z-index:20;font-size:' + (P ? 30 : 26) + 'px;color:var(--ink);' + (P ? 'left:392px;top:306px' : 'left:392px;top:156px');
    var rail = K.el('div', 'rail', null, stage); rail.style.cssText += P ? 'left:392px;top:368px' : 'left:392px;top:212px';
    for (var i = 7; i >= 1; i--) K.el('i', i === n ? 'on' : i > n ? 'done' : '', null, rail);
    var mini = K.el('div', 'mini', null, stage); mini.style.cssText += P ? 'left:850px;top:205px' : 'left:690px;top:40px';
    var ms = K.el('div', 's', null, mini), mp = [];
    for (var j = 0; j < 8; j++) { var q = K.el('i', 'p' + (j === n ? ' on' : ''), null, ms); q.style.transform = 'translateZ(' + (j * 14) + 'px)' + (j === n ? ' translateX(34px)' : ''); mp.push(q); }
    tl.fromTo(mp[n], {x: 0}, {x: 0, duration: 0.01}, 0);
    tl.fromTo([kk, kk2, rail, mini], {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.6, stagger: 0.06}, 0.2);
    tl.fromTo(num, {opacity: 0}, {opacity: 1, duration: 0.05}, S.t0 - 0.05);
    K.glitch(tl, num, [[S.t0 - 0.05, 0.42], [K.b(8), 0.14]], 26, n);
    // chữ
    var tx = K.el('div', '', null, stage); tx.style.cssText = 'position:absolute;z-index:30;' + (P ? 'left:72px;right:72px;top:1400px;text-align:center' : 'left:100px;width:720px;top:420px;text-align:left');
    var hd = K.el('div', 'hd shadow', S.html(cfg.key + '_head'), tx); hd.style.cssText = 'position:relative;left:auto;right:auto;opacity:0;' + (P ? 'font-size:68px' : 'font-size:66px;text-align:left');
    var sb = K.el('div', 'sub shadow', S.html(cfg.key + '_sub'), tx); sb.style.cssText = 'position:relative;left:auto;right:auto;opacity:0;margin-top:22px;' + (P ? '' : 'text-align:left;font-size:40px');
    K.say(tl, hd, K.b(0.8)); K.say(tl, sb, K.b(2.6), {stagger: 0.05});
    var ctx = {tl: tl, stage: stage, plate: plate, V: V, P: P, fx: fx, px: function (x) { return px0 + x; }, py: function (y) { return py0 + y; }, page: bgp};
    cfg.build(plate, ctx);
    // nhãn kỹ thuật trên khung nhìn
    if (cfg.labels) {
      var its = cfg.labels.map(function (l, k) {
        var right = k === 1, ps = l.pos && l.pos[P ? 'P' : 'L'];
        if (ps) right = ps.align === 'right';
        return {anc: l.anc(ctx), nm: S.html(l.key), sp: l.sp, align: right ? 'right' : 'left',
          x: ps ? ps.x : right ? V.x + V.w - 34 : V.x + 34, y: ps ? ps.y : right ? V.y + V.h - 58 : V.y + 46, at: l.at};
      });
      var ld = K.leads(stage, its);
      its.forEach(function (it) { it.outAt = K.out() - 0.42; });
      K.tick(tl, function (t) { ld.update(t); });
    }
    // bay xuyên lớp khi ra
    var o = K.out();
    tl.to(plate, {scale: 2.6, opacity: 0, rotationX: -8, duration: 0.5, ease: 'power2.in'}, o - 0.42);
    tl.to(bgp.el, {scale: 2, opacity: 0, duration: 0.5, ease: 'power2.in'}, o - 0.42);
    return ctx;
  };
})();
