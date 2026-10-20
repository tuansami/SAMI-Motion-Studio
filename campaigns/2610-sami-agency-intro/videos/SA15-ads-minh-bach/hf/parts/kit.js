/* SA15 · bộ phận chung "Engineering Briefing Board": bảng nền, ống kính dòng tiền, hộp đen/kính isometric, thẻ nút, biểu tượng.
   Mọi chuyển động là hàm của thời gian timeline (không rAF/random/Date). Lưới nhạc 100 BPM: K.b(n) = nhịp cắt + n × 0,6 s. */
(function () {
  var S = window.SAMI, K = window.K = {}, NS = 'http://www.w3.org/2000/svg';
  S.bindCopy();
  K.$ = function (q, r) { return (r || document).querySelector(q); };
  K.$$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  K.el = function (tag, cls, html, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  K.sv = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  K.P = S.portrait;
  K.B = 0.6;
  K.b = function (n) { return S.t0 + n * K.B; };
  K.out = function () { return S.dur - 8 / 30; };
  K.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  K.ramp = function (t, a, b) { return S.EASE(K.clamp((t - a) / (b - a), 0, 1)); };
  K.lin = function (t, a, b) { return K.clamp((t - a) / (b - a), 0, 1); };
  K.lerp = function (a, b, p) { return a + (b - a) * p; };
  K.pick = function (p, l) { return K.P ? p : l; };
  K.list = function (key) { return S.text(key).split('|').map(function (s) { return s.trim(); }); };

  /** chữ kể chuyện: từng từ rise + un-blur, rồi đứng yên */
  K.say = function (tl, sel, at, opt) {
    opt = opt || {}; var el = typeof sel === 'string' ? K.$(sel) : sel; if (!el) return at;
    var w = S.words(el); tl.set(el, {opacity: 1}, 0);
    S.arrive(tl, w, at, {dist: opt.dist || 30, blur: 10, dur: 0.7, stagger: opt.stagger || 0.055});
    return at + w.length * (opt.stagger || 0.055) + 0.7;
  };
  K.sub = function () { return window.gsap.timeline({paused: true, defaults: {ease: S.EASE}}); };
  /** fn(t) mỗi khung theo thời gian timeline (chạy sau mọi tween con) */
  K.tick = function (tl, fn) {
    var o = {v: 0}; tl.to(o, {v: 1, duration: S.dur, ease: 'none', onUpdate: function () { fn(tl.time()); }}, 0);
    if (!tl._kf) { tl._kf = []; tl.eventCallback('onUpdate', function () { var t = tl.time(); tl._kf.forEach(function (f) { f(t); }); }); }
    tl._kf.push(fn); fn(0);
  };

  /** hạt bụi sáng trôi chậm (tiền cảnh) */
  K.dust = function (tl, parent, n, seed, opt) {
    opt = opt || {};
    for (var i = 0; i < n; i++) {
      var d = K.el('i', '', null, parent), r = S.rnd(seed + i * 7.1), r2 = S.rnd(seed + i * 3.7), r3 = S.rnd(seed + i * 1.3), sz = 2 + r3 * (opt.max || 4);
      d.style.cssText = 'position:absolute;border-radius:50%;left:' + (r * S.w) + 'px;top:' + (r2 * S.h) + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + (opt.color || '#CFE3F2') + ';opacity:' + (0.08 + r3 * (opt.op || 0.26)) + ';filter:blur(' + (r3 > 0.7 ? 2 : 0) + 'px)';
      tl.to(d, {x: (S.rnd(seed + i) - 0.5) * 100, y: -(30 + r3 * (opt.rise || 110)), duration: S.dur, ease: 'none'}, 0);
    }
  };
  /** bảng nền: lưới bản vẽ 2 cấp trôi chậm, ánh viền, dấu cắt góc, khung tiêu đề, bụi */
  K.board = function (tl, stage, opt) {
    opt = opt || {};
    var g = K.el('div', 'grid', null, stage);
    tl.fromTo(g, {x: 0, y: 0}, {x: -30, y: -45, duration: S.dur, ease: 'none'}, 0);
    var r1 = K.el('div', 'rim', null, stage); r1.style.cssText += 'left:-15%;top:' + (K.P ? 20 : 8) + '%;width:60%;height:40%;background:radial-gradient(circle,rgba(118,103,254,.42),transparent 65%)';
    var r2 = K.el('div', 'rim', null, stage); r2.style.cssText += 'right:-15%;top:' + (K.P ? 44 : 38) + '%;width:58%;height:42%;background:radial-gradient(circle,rgba(8,221,164,' + (opt.mint || 0.22) + '),transparent 65%)';
    tl.fromTo(r1, {x: 0}, {x: 50, duration: S.dur, ease: 'none'}, 0);
    tl.fromTo(r2, {x: 0}, {x: -40, duration: S.dur, ease: 'none'}, 0);
    var m = K.P ? {x: 44, t: 150, b: 300} : {x: 44, t: 40, b: 40};
    [['left', 'top', 'borderLeftWidth', 'borderTopWidth'], ['right', 'top', 'borderRightWidth', 'borderTopWidth'], ['left', 'bottom', 'borderLeftWidth', 'borderBottomWidth'], ['right', 'bottom', 'borderRightWidth', 'borderBottomWidth']].forEach(function (c) {
      var e = K.el('i', 'crop', null, stage); e.style[c[0]] = m.x + 'px'; e.style[c[1]] = (c[1] === 'top' ? m.t : m.b) + 'px'; e.style[c[2]] = '2px'; e.style[c[3]] = '2px';
    });
    if (opt.title !== false) {
      var tb = K.el('div', 'tblock', 'SA15 · BRIEFING BOARD · <b>' + (opt.sec || '') + '</b>', stage);
      tb.style.left = (m.x + 64) + 'px'; tb.style.top = (m.t + 10) + 'px';
      var tr = K.el('div', 'tblock', opt.right || 'REV 01', stage); tr.style.right = (m.x + 64) + 'px'; tr.style.top = (m.t + 10) + 'px';
      tl.fromTo([tb, tr], {opacity: 0}, {opacity: 1, duration: 0.6}, 0.1);
    }
    var fx = K.el('div', '', null, stage); fx.style.cssText = 'position:absolute;inset:0;z-index:45;pointer-events:none';
    K.dust(tl, fx, opt.dust || 24, opt.seed || 12);
    return fx;
  };
  /** svg toàn khung */
  K.svg = function (parent, z) { var s = K.sv('svg', {'class': 'full', width: S.w, height: S.h, viewBox: '0 0 ' + S.w + ' ' + S.h}, parent); s.style.zIndex = z == null ? 10 : z; return s; };
  /** đường cong Sankey ngang / dọc */
  K.bandH = function (x0, y0, x1, y1) { var m = (x0 + x1) / 2; return 'M' + x0 + ' ' + y0 + ' C' + m + ' ' + y0 + ' ' + m + ' ' + y1 + ' ' + x1 + ' ' + y1; };
  K.bandV = function (x0, y0, x1, y1) { var m = (y0 + y1) / 2; return 'M' + x0 + ' ' + y0 + ' C' + x0 + ' ' + m + ' ' + x1 + ' ' + m + ' ' + x1 + ' ' + y1; };

  /** ống kính dòng tiền: vỏ kính + lõi lỏng mint (đổ đầy theo thời gian) + giọt sáng chạy.
      opt = {w, at, dur, color, speed, empty(t)→0..1 (rút cạn)} */
  K.pipes = [];
  K.pipe = function (svg, d, opt) {
    opt = opt || {}; var w = opt.w || 14, g = K.sv('g', {}, svg), col = opt.color || '#08DDA4';
    var sh = K.sv('path', {d: d, fill: 'none', stroke: 'rgba(190,215,235,.38)', 'stroke-width': w + 12, 'stroke-linecap': 'round'}, g);
    var hol = K.sv('path', {d: d, fill: 'none', stroke: '#0B1119', 'stroke-width': w + 8, 'stroke-linecap': 'round'}, g);
    var liq = K.sv('path', {d: d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: 0.92}, g);
    var glow = K.sv('path', {d: d, fill: 'none', stroke: col, 'stroke-width': w + 14, 'stroke-linecap': 'round', opacity: 0.16}, g);
    var fl = K.sv('path', {d: d, fill: 'none', stroke: 'rgba(255,255,255,.85)', 'stroke-width': Math.max(3, w * 0.32), 'stroke-linecap': 'round', 'stroke-dasharray': '3 ' + (opt.gap || 26)}, g);
    var hi = K.sv('path', {d: d, fill: 'none', stroke: 'rgba(255,255,255,.18)', 'stroke-width': 2, transform: 'translate(0 ' + (-w / 2 - 3) + ')'}, g);
    var L = liq.getTotalLength();
    [liq, glow].forEach(function (p) { p.setAttribute('stroke-dasharray', L + ' ' + (L + 10)); });
    var o = {g: g, d: d, L: L, at: opt.at == null ? 0 : opt.at, dur: opt.dur || 0.9, speed: opt.speed || 90, col: col, shell: [sh, hol, hi], liq: liq,
      p: 0, fill: opt.fill, empty: opt.empty, show: opt.show};
    o.update = function (t) {
      var p = o.fill ? o.fill(t) : K.ramp(t, o.at, o.at + o.dur), e = o.empty ? o.empty(t) : 0; o.p = p;
      liq.setAttribute('stroke-dashoffset', L * (1 - p) - L * e * -1 * 0); // đổ đầy từ đầu ống
      if (e > 0) { liq.setAttribute('stroke-dashoffset', -L * e); }
      glow.setAttribute('stroke-dashoffset', e > 0 ? -L * e : L * (1 - p));
      var fo = K.clamp((p - 0.7) / 0.3, 0, 1) * (1 - e);
      fl.style.opacity = fo; fl.setAttribute('stroke-dashoffset', -t * o.speed);
      var sv = o.show ? o.show(t) : 1; g.style.opacity = sv;
    };
    K.pipes.push(o);
    return o;
  };
  K.flow = function (tl) { K.tick(tl, function (t) { K.pipes.forEach(function (p) { p.update(t); }); }); };

  /** đồng euro (SVG, viewBox 100) */
  K.coin = '<svg viewBox="0 0 100 100"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset=".55" stop-color="#E7B43A"/><stop offset="1" stop-color="#A9781C"/></linearGradient></defs>' +
    '<circle cx="50" cy="50" r="48" fill="url(#cg)"/><circle cx="50" cy="50" r="39" fill="none" stroke="#FFF1C2" stroke-opacity=".6" stroke-width="3"/>' +
    '<text x="50" y="66" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="46" fill="#7A5310">€</text></svg>';
  K.mkCoin = function (parent, size) { var c = K.el('div', '', K.coin, parent); c.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;margin:' + (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px;z-index:25;filter:drop-shadow(0 10px 18px rgba(0,0,0,.5))'; return c; };

  /** hộp isometric. s = cạnh. mode 'dark' | 'glass'. Trả về {pts, mat, slot, shards, update} */
  K.box = function (svg, cx, cy, s, opt) {
    opt = opt || {}; var hw = s * 0.866;
    var N = [cx, cy - s], E = [cx + hw, cy - s / 2], C = [cx, cy], W = [cx - hw, cy - s / 2], C2 = [cx, cy + s], E2 = [cx + hw, cy + s / 2], W2 = [cx - hw, cy + s / 2];
    var g = K.sv('g', {}, svg), pt = function (a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
    // ma trận mặt: toạ độ (u, v) ∈ [0, s]² → màn hình
    var M = {
      top: function (u, v) { return [W[0] + u * hw / s + v * hw / s, W[1] - u * 0.5 + v * 0.5]; },
      left: function (u, v) { return [W[0] + u * hw / s, W[1] + u * 0.5 + v]; },
      right: function (u, v) { return [C[0] + u * hw / s, C[1] - u * 0.5 + v]; }
    };
    var o = {g: g, pts: {N: N, E: E, C: C, W: W, C2: C2, E2: E2, W2: W2}, M: M, s: s, cx: cx, cy: cy, hw: hw};
    o.slot = M.top(s * 0.5, s * 0.5);
    // ── hộp kính (luôn có, nằm dưới vỏ đen) ──
    var gl = K.sv('g', {}, g); o.glass = gl;
    var back = K.sv('g', {stroke: 'rgba(200,225,245,.28)', 'stroke-width': 2, 'stroke-dasharray': '6 8', fill: 'none'}, gl);
    [[N, C], [W2, C], [E2, C]].forEach(function (l) { K.sv('line', {x1: l[0][0], y1: l[0][1], x2: l[1][0], y2: l[1][1]}, back); });
    o.inner = K.sv('g', {}, gl); // ống bên trong
    var faces = K.sv('g', {}, gl);
    K.sv('polygon', {points: pt([N, E, C, W]), fill: 'rgba(200,230,255,.07)'}, faces);
    K.sv('polygon', {points: pt([W, C, C2, W2]), fill: 'rgba(200,230,255,.045)'}, faces);
    K.sv('polygon', {points: pt([C, E, E2, C2]), fill: 'rgba(200,230,255,.06)'}, faces);
    var sheen = K.sv('polygon', {points: pt([M.left(s * 0.12, 0), M.left(s * 0.3, 0), M.left(s * 0.1, s), M.left(-s * 0.08 + s * 0.08, s)]), fill: 'rgba(255,255,255,.07)'}, faces);
    var ed = K.sv('g', {stroke: 'rgba(227,240,255,.85)', 'stroke-width': 2.6, fill: 'none', 'stroke-linejoin': 'round'}, gl);
    K.sv('polygon', {points: pt([N, E, E2, C2, W2, W])}, ed);
    K.sv('polyline', {points: pt([W, C, E])}, ed); K.sv('line', {x1: C[0], y1: C[1], x2: C2[0], y2: C2[1]}, ed);
    o.slotEl = K.sv('line', {x1: M.top(s * 0.5, s * 0.22)[0], y1: M.top(s * 0.5, s * 0.22)[1], x2: M.top(s * 0.5, s * 0.78)[0], y2: M.top(s * 0.5, s * 0.78)[1], stroke: '#08DDA4', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.9}, gl);
    o.edges = ed;
    // ── vỏ đen: các mảnh tam giác (để vỡ) ──
    var dk = K.sv('g', {}, g); o.dark = dk; o.shards = [];
    var FC = {top: '#1B2330', left: '#0D131B', right: '#121A25'}, nx = opt.nx || 3, ny = opt.ny || 4, seed = opt.seed || 5;
    ['top', 'left', 'right'].forEach(function (fn, fi) {
      var grid = [];
      for (var j = 0; j <= ny; j++) { grid.push([]); for (var i = 0; i <= nx; i++) {
        var u = i / nx * s, v = j / ny * s, edge = i === 0 || j === 0 || i === nx || j === ny;
        if (!edge) { u += (S.rnd(seed + fi * 50 + i * 7 + j * 13) - 0.5) * s / nx * 0.7; v += (S.rnd(seed + fi * 50 + i * 11 + j * 3) - 0.5) * s / ny * 0.7; }
        grid[j].push(M[fn](u, v)); } }
      for (var jj = 0; jj < ny; jj++) for (var ii = 0; ii < nx; ii++) {
        var a = grid[jj][ii], b = grid[jj][ii + 1], c = grid[jj + 1][ii + 1], d = grid[jj + 1][ii], flip = S.rnd(seed + ii * 5 + jj * 9 + fi) > 0.5;
        (flip ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]).forEach(function (tri) {
          var p = K.sv('polygon', {points: pt(tri), fill: FC[fn], stroke: FC[fn], 'stroke-width': 1.2, 'stroke-linejoin': 'round'}, dk);
          var mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, k = o.shards.length;
          o.shards.push({el: p, mx: mx, my: my, tri: tri, r: S.rnd(seed + k * 3.3), r2: S.rnd(seed + k * 1.7)});
        });
      }
    });
    // viền vỏ đen + khe xu + dấu hỏi
    var dke = K.sv('g', {stroke: 'rgba(143,163,184,.55)', 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round'}, dk);
    K.sv('polygon', {points: pt([N, E, E2, C2, W2, W])}, dke); K.sv('polyline', {points: pt([W, C, E])}, dke); K.sv('line', {x1: C[0], y1: C[1], x2: C2[0], y2: C2[1]}, dke);
    var s1 = M.top(s * 0.5, s * 0.22), s2 = M.top(s * 0.5, s * 0.78);
    o.slotDark = K.sv('line', {x1: s1[0], y1: s1[1], x2: s2[0], y2: s2[1], stroke: '#04060A', 'stroke-width': 12, 'stroke-linecap': 'round'}, dk);
    var q = M.left(s * 0.5, s * 0.56);
    o.q = K.sv('text', {x: 0, y: 0, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono', 'font-weight': 700, 'font-size': s * 0.42, fill: '#F5A524',
      transform: 'matrix(' + (hw / s) + ',0.5,0,1,' + q[0] + ',' + (q[1] + s * 0.14) + ')'}, dk);
    o.q.textContent = '?';
    // vết nứt: cạnh các mảnh (vẽ dần)
    var ck = K.sv('g', {stroke: '#08DDA4', 'stroke-width': 2.4, fill: 'none', opacity: 0, style: 'filter:drop-shadow(0 0 6px #08DDA4)'}, g); o.crack = ck; o.crackLines = [];
    o.shards.forEach(function (sh, k) { if (S.rnd(seed + k * 2.9) < 0.55) { var l = K.sv('polyline', {points: pt(sh.tri.concat([sh.tri[0]]))}, ck); var len = l.getTotalLength(); l.setAttribute('stroke-dasharray', len + ' ' + len); l.setAttribute('stroke-dashoffset', len); o.crackLines.push({el: l, len: len, d: Math.hypot(sh.mx - cx, sh.my - (cy - s * 0.2))}); } });
    /** c = nứt 0..1, x = vỡ 0..1 */
    o.update = function (c, x) {
      ck.style.opacity = c > 0 && x < 0.25 ? 1 - x * 4 : 0;
      var maxd = s * 1.3;
      o.crackLines.forEach(function (l) { var pr = K.clamp(c * 1.6 - l.d / maxd * 0.6, 0, 1); l.el.setAttribute('stroke-dashoffset', l.len * (1 - pr)); });
      o.shards.forEach(function (sh) {
        if (x <= 0) { sh.el.removeAttribute('transform'); sh.el.style.opacity = 1; sh.el.style.stroke = ''; return; }
        sh.el.style.stroke = 'rgba(160,190,215,.55)';
        var dx = sh.mx - cx, dy = sh.my - (cy - s * 0.1), dl = Math.hypot(dx, dy) || 1, sp = (0.6 + sh.r * 0.9) * s * 2.2;
        var tx = dx / dl * sp * x + (sh.r2 - 0.5) * s * 0.6 * x, ty = dy / dl * sp * x * 0.7 + s * 3.2 * x * x - s * 0.3 * x, rot = (sh.r - 0.5) * 520 * x, sc = 1 - 0.35 * x;
        sh.el.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ') rotate(' + rot.toFixed(1) + ' ' + sh.mx.toFixed(1) + ' ' + sh.my.toFixed(1) + ') translate(' + (sh.mx * (1 - sc)).toFixed(1) + ' ' + (sh.my * (1 - sc)).toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        sh.el.style.opacity = 1 - K.clamp((x - 0.35) / 0.55, 0, 1);
      });
      dke.style.opacity = x > 0 ? 0 : 1; o.slotDark.style.opacity = x > 0 ? 0 : 1; o.q.style.opacity = x > 0 ? 0 : o.q._op == null ? 1 : o.q._op;
    };
    if (opt.mode === 'glass') { dk.style.display = 'none'; ck.style.display = 'none'; }
    o.update(0, 0);
    return o;
  };

  /** thẻ nút */
  K.node = function (parent, x, y, w, small, big, opt) {
    opt = opt || {}; var n = K.el('div', 'node', (small ? '<small>' + small + '</small>' : '') + '<b>' + big + '</b>', parent);
    n.style.left = x + 'px'; n.style.top = y + 'px'; n.style.width = w + 'px'; if (opt.fs) n.querySelector('b').style.fontSize = opt.fs + 'px';
    return n;
  };
  /** vị trí cạnh trái/phải giữa thẻ (toạ độ stage) — đo một lần */
  K.port = function (n, side) { var r = n.getBoundingClientRect(), r0 = K.$('#stage').getBoundingClientRect(), k = S.w / r0.width; return [((side === 'r' ? r.right : r.left) - r0.left) * k, ((r.top + r.bottom) / 2 - r0.top) * k]; };

  /** biểu tượng nét (viewBox 48) */
  K.icon = function (name, col) {
    col = col || '#08DDA4'; var a = '<svg viewBox="0 0 48 48" fill="none" stroke="' + col + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">';
    var I = {
      cal: '<rect x="7" y="10" width="34" height="31" rx="5"/><path d="M7 19 H41 M16 6 V13 M32 6 V13"/><path d="M17 30 L22 35 L32 25"/>',
      phone: '<path d="M14 7 L20 7 L23 16 L18.5 19 C21 24.5 23.5 27 29 29.5 L32 25 L41 28 L41 34 C41 38 38 41 34 41 C19 40 8 29 7 14 C7 10 10 7 14 7 Z"/>',
      pin: '<path d="M24 43 C24 43 38 29 38 19 A14 14 0 0 0 10 19 C10 29 24 43 24 43 Z"/><circle cx="24" cy="19" r="5"/>',
      gift: '<rect x="7" y="18" width="34" height="23" rx="3"/><path d="M5 18 H43 M24 18 V41 M24 18 C19 9 11 11 15 18 M24 18 C29 9 37 11 33 18"/>',
      menu: '<path d="M10 8 H34 A4 4 0 0 1 38 12 V40 H14 A4 4 0 0 1 10 36 Z"/><path d="M17 17 H31 M17 24 H31 M17 31 H26"/>',
      search: '<circle cx="21" cy="21" r="12"/><path d="M30 30 L41 41"/>',
      doc: '<path d="M12 6 H30 L38 14 V42 H12 Z"/><path d="M30 6 V14 H38 M18 24 H32 M18 31 H32"/>'
    };
    return a + (I[name] || '') + '</svg>';
  };
  K.bubble = '<svg viewBox="0 0 48 48"><path d="M24 5 C13.5 5 5 12.8 5 22.5 C5 28 7.8 32.9 12.2 36.1 L10.5 43 L18.2 39.2 C20 39.7 22 40 24 40 C34.5 40 43 32.2 43 22.5 C43 12.8 34.5 5 24 5 Z" fill="#fff"/><path d="M15 22 H33 M15 28 H27" stroke="#25D366" stroke-width="3.4" stroke-linecap="round"/></svg>';

  /** con trỏ chuột; K.path(tl, el, [{x,y,t,click}]) */
  K.cursor = function (parent) { return K.el('div', 'cursor', '<svg viewBox="0 0 24 24"><path d="M3 2 L3 19.5 L7.6 15.4 L10.7 22 L13.6 20.7 L10.6 14.3 L16.8 14.1 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>', parent); };
  K.path = function (tl, el, pts) {
    tl.set(el, {x: pts[0].x, y: pts[0].y}, 0);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      tl.to(el, {x: p.x, y: p.y, duration: Math.max(0.05, p.t - q.t - 0.05), ease: S.EASE}, q.t);
      if (p.click) { tl.to(el, {scale: 0.82, duration: 0.06, transformOrigin: '10% 10%'}, p.t); tl.to(el, {scale: 1, duration: 0.12}, p.t + 0.06); }
    }
  };
  K.ring = function (tl, parent, x, y, at, color) {
    var r = K.el('i', 'ripple', null, parent); r.style.left = x + 'px'; r.style.top = y + 'px'; if (color) r.style.borderColor = color;
    tl.fromTo(r, {opacity: 0.95, scale: 0.2}, {opacity: 0, scale: 1.1, duration: 0.55, ease: 'power2.out', immediateRender: false}, at);
  };
  /** đặt câu phụ ngay dưới tiêu đề (đo bố cục một lần) */
  K.below = function (sub, head, gap, tl) { var f = function () { sub.style.top = (head.offsetTop + head.offsetHeight + (gap || 28)) + 'px'; }; f(); if (tl) K.tick(tl, f); };
  /** khung chữ kể chuyện: tạo #head/#sub theo vị trí truyền vào */
  K.text = function (stage, key, cls, pos) {
    var e = K.el('div', cls + ' shadow', S.html(key), stage); e.style.opacity = 0;
    var p = K.P ? pos.P : pos.L; for (var k in p) e.style[k] = typeof p[k] === 'number' ? p[k] + 'px' : p[k];
    return e;
  };
})();
