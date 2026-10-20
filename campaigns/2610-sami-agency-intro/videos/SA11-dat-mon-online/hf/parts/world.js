/* SA11 · "Isometric Kitchen": thế giới chung cho mọi cảnh (bàn diorama, quán Bếp Gió, điện thoại khách, ống trung gian, máy trung gian, băng chuyền SAMI, đơn hàng, tiền).
 * Mọi chuyển động là hàm của t (seek được). Ngẫu nhiên = SAMI.rnd(seed). Trục: x → xuống-phải, y → xuống-trái, z → lên. */
(function () {
  'use strict';
  var S = window.SAMI, I = window.ISO, W = (window.W = {}), tri = I.tri;
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  W.cl = cl;
  W.L = function (t, a, b) { return cl((t - a) / (b - a)); };
  W.E = function (t, a, b) { return S.EASE(W.L(t, a, b)); };
  W.mix = function (a, b, u) { return a + (b - a) * u; };
  W.back = I.back;
  W.$ = function (s) { return document.querySelector(s); };
  W.el = function (tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

  W.INK = '#1F1A3D';
  I.PAL.ink = W.INK; I.PAL.paper = '#FBF6EC';
  W.T = {
    order: tri('#EE6A44', .22, .2), money: ['#F6D47A', '#E9B949', '#C2902B'], pipe: tri('#A9A3BC', .25, .2), pipeJ: tri('#8E88A4', .2, .25),
    machine: tri('#8C87A2', .25, .22), mint: tri('#08DDA4', .3, .22), purple: tri('#7667FE', .25, .22), navy: tri('#2E2A63', .15, .28),
    wall: ['#FBF3E4', '#EFE2CB', '#D8C6A6'], steel: tri('#C3C0CF', .3, .22), wood: tri('#C99A6B', .22, .22), cream: ['#FFF9EF', '#F3E8D6', '#DCCBB0'],
    board: ['#F8EFDF', '#E9D9BD', '#CDB894'], soil: tri('#C79D73', .1, .22), soil2: tri('#8E6B4D', .05, .2), blue: tri('#3C7FB1', .2, .22), white: ['#FFFFFF', '#ECEAF2', '#CFCBDB']
  };

  /** đồng hồ cảnh: draw(t) mỗi khung theo timeline */
  W.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  W.words = function (tl, sel, at, opt) {
    opt = opt || {};
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    var w = S.words(el);
    S.arrive(tl, w, at, {stagger: opt.stagger == null ? 0.05 : opt.stagger, dist: opt.dist == null ? 30 : opt.dist, blur: 8, dur: 0.6});
    return w;
  };
  W.fadeIn = function (tl, sel, at, opt) { opt = opt || {}; return S.arrive(tl, sel, at, {dist: opt.dist == null ? 22 : opt.dist, blur: opt.blur == null ? 6 : opt.blur, dur: opt.dur || 0.55, stagger: opt.stagger || 0}); };
  W.fadeOut = function (tl, sel, at, opt) { opt = opt || {}; return S.leave(tl, sel, at, {dist: opt.dist == null ? -18 : opt.dist, dur: opt.dur || 0.4, stagger: opt.stagger || 0}); };

  /** canvas toàn khung + engine iso */
  W.setup = function (root) {
    var cv = W.el('canvas', 'cv', null); cv.width = S.w; cv.height = S.h;
    root.insertBefore(cv, root.firstChild);
    var g = cv.getContext('2d'), iso = new I.Iso(g, S.w, S.h);
    iso.cv = cv;
    return iso;
  };
  /** camera: {x,y,z,k, cx, cy} (cx, cy = điểm màn hình của tâm camera) */
  W.cam = function (iso, c) { iso.cam = {x: c.x, y: c.y, z: c.z || 0, k: c.k}; iso.CX = c.cx == null ? S.w / 2 : c.cx; iso.CY = c.cy == null ? S.h / 2 : c.cy; };
  /** nội suy camera (zoom theo log) */
  W.lerpCam = function (a, b, u) {
    var o = {}; ['x', 'y', 'z', 'cx', 'cy'].forEach(function (k) { o[k] = W.mix(a[k] == null ? 0 : a[k], b[k] == null ? 0 : b[k], u); });
    o.k = Math.exp(W.mix(Math.log(a.k), Math.log(b.k), u));
    if (a.cx == null) { o.cx = null; o.cy = null; }
    return o;
  };

  /** nền kem + lưới chấm isometric (lớp xa, trôi chậm theo camera) */
  W.bg = function (iso, t, o) {
    o = o || {};
    var g = iso.g, sp = 44, dx = sp * I.C30 * 2, dy = sp;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = o.ground || '#F4EBDC'; g.fillRect(0, 0, S.w, S.h);
    var gr = g.createRadialGradient(S.w * 0.5, S.h * 0.45, 50, S.w * 0.5, S.h * 0.5, Math.max(S.w, S.h) * 0.75);
    gr.addColorStop(0, 'rgba(255,252,245,.9)'); gr.addColorStop(1, 'rgba(232,218,196,.6)');
    g.fillStyle = gr; g.fillRect(0, 0, S.w, S.h);
    var ox = ((-(iso.cam.x - iso.cam.y) * I.C30 * iso.cam.k * 0.12) % dx + dx) % dx, oy = ((-(iso.cam.x + iso.cam.y) * 0.5 * iso.cam.k * 0.12 + t * 4) % dy + dy) % dy;
    g.fillStyle = 'rgba(31,26,61,' + (o.dots == null ? 0.13 : o.dots) + ')';
    for (var r = -1; r * dy / 2 < S.h + dy; r++) {
      for (var c = -1; c * dx < S.w + dx; c++) {
        var x = c * dx + (r % 2 ? dx / 2 : 0) + ox, y = r * dy / 2 + oy;
        g.beginPath(); g.arc(x, y, 2.2, 0, I.TAU); g.fill();
      }
    }
  };

  /** camera toàn cảnh bàn (9:16 / 16:9) */
  W.FULL = function (dk) { dk = dk || 0; return S.landscape ? {x: 0, y: 0, z: 0.64, k: 31 + dk, cx: 1350, cy: 560} : {x: 0, y: 0, z: 0.64, k: 28 + dk, cx: 540, cy: 1150}; };
  // ── kích thước bàn diorama
  W.B = {x0: -10.5, x1: 11, y0: -9, y1: 9.2};
  /** bàn diorama: bóng mềm + 3 lớp địa tầng ở mặt cắt */
  W.board = function (iso, o) {
    o = o || {};
    var B = o.B || W.B, g = iso.g;
    // bóng đổ mềm dưới bàn (vẽ ngay, trước hàng đợi)
    var c = iso.P((B.x0 + B.x1) / 2 + 1.2, (B.y0 + B.y1) / 2 + 1.2, -2.2), k = iso.cam.k;
    g.save(); g.translate(c[0], c[1]); g.scale(1, 0.5);
    var R = (B.x1 - B.x0 + B.y1 - B.y0) * 0.5 * I.C30 * k * 1.05;
    var gr = g.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    gr.addColorStop(0, 'rgba(60,40,30,.22)'); gr.addColorStop(1, 'rgba(60,40,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, I.TAU); g.fill(); g.restore();
    var w = B.x1 - B.x0, d = B.y1 - B.y0, opt = {cull: false, bias: -400, layer: 0};
    iso.box(B.x0, B.y0, -1.6, w, d, 0.5, W.T.soil2, opt);
    iso.box(B.x0, B.y0, -1.1, w, d, 0.75, W.T.soil, opt);
    iso.box(B.x0, B.y0, -0.35, w, d, 0.35, W.T.board, opt);
    // lát gạch mờ trên mặt bàn
    if (o.tiles !== false) {
      for (var i = Math.ceil(B.x0); i < B.x1; i += 2) iso.line3([[i, B.y0, 0.001], [i, B.y1, 0.001]], '#1F1A3D', 1.5, {layer: 0, depth: -1e5, a: 0.06});
      for (var j = Math.ceil(B.y0); j < B.y1; j += 2) iso.line3([[B.x0, j, 0.001], [B.x1, j, 0.001]], '#1F1A3D', 1.5, {layer: 0, depth: -1e5, a: 0.06});
    }
  };

  // ── điện thoại khách (đứng, màn hình quay về +x)
  W.PH = {x: -8.15, y: -6.2, w: 0.55, d: 3.3, h: 5.8};
  W.phone = function (iso, t, o) {
    o = o || {};
    var P = W.PH, lit = o.lit == null ? 1 : o.lit;
    iso.box(P.x, P.y, 0, P.w, P.d, P.h, W.T.navy, {decal: function (I2, b) {
      var X = b.x + b.w + 0.01, m = 0.22, y0 = b.y + m, y1 = b.y + b.d - m, z0 = b.z + 0.45, z1 = b.z + b.h - 0.35;
      var q = function (a, bb, c, d2) { return [I2.L(X, a, c), I2.L(X, bb, c), I2.L(X, bb, d2), I2.L(X, a, d2)]; };
      I2.poly(q(y0, y1, z0, z1), lit > 0.5 ? '#FFFDF8' : '#232050');
      // thanh trên + khối nội dung
      I2.poly(q(y0, y1, z1 - 0.45, z1), o.bar || '#7667FE');
      for (var r = 0; r < 4; r++) {
        var zz = z1 - 1.0 - r * 0.85;
        I2.poly(q(y0 + 0.25, y1 - 0.25, zz - 0.55, zz), r === 0 ? (o.card || '#E9E5F7') : '#F1EEE8');
      }
      if (o.notify) { // thông báo đơn mới (khối cam san hô)
        var n = o.notify, zz2 = z1 - 0.55 - 0.1;
        I2.poly(q(y0 + 0.15, W.mix(y0 + 0.15, y1 - 0.15, I.back(cl(n), 1.6)), zz2 - 0.8, zz2), '#EE6A44');
      }
      I2.poly(q(b.y + b.d / 2 - 0.35, b.y + b.d / 2 + 0.35, b.z + 0.16, b.z + 0.28), '#9A95C4');
    }});
  };

  // ── ống trung gian (đường uốn khúc quanh bàn). A: từ điện thoại tới máy; B: từ máy tới quán
  W.MAC = {x: -2.2, y: 3.6, w: 4.4, d: 3.9, h: 3.0};
  W.PIPE_A = [[-7.25, -3.7, 0.75], [-7.25, 6.2, 0.75], [-5.2, 6.2, 0.75], [-5.2, 6.2, 2.6], [-3.4, 6.2, 2.6], [-3.4, 6.2, 0.75], [-2.2, 6.2, 0.75]];
  W.PIPE_B = [[2.2, 5.0, 0.75], [4.7, 5.0, 0.75], [4.7, 7.9, 0.75], [7.3, 7.9, 0.75], [7.3, 3.0, 0.75], [9.45, 3.0, 0.75], [9.45, 3.0, 2.1], [9.45, -1.0, 2.1]];
  W.PR = 0.4;
  function segs(path) {
    var out = [], tot = 0;
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1], b = path[i], l = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) + Math.abs(b[2] - a[2]);
      out.push({a: a, b: b, l: l, ax: b[0] !== a[0] ? 0 : b[1] !== a[1] ? 1 : 2}); tot += l;
    }
    return {s: out, tot: tot};
  }
  W.SA = segs(W.PIPE_A); W.SB = segs(W.PIPE_B);
  /** điểm trên đường theo tỉ lệ u (0..1) */
  W.along = function (sg, u) {
    var d = cl(u) * sg.tot;
    for (var i = 0; i < sg.s.length; i++) {
      var s = sg.s[i];
      if (d <= s.l || i === sg.s.length - 1) { var k = s.l ? Math.min(1, d / s.l) : 0; return {p: [W.mix(s.a[0], s.b[0], k), W.mix(s.a[1], s.b[1], k), W.mix(s.a[2], s.b[2], k)], ax: s.ax}; }
      d -= s.l;
    }
  };
  /** các khúc ống (mỗi khúc ≤ 1,1 đơn vị để sắp chiều sâu đúng); o.fly(i, c) → [dx,dy,dz] hoặc null (bay mất) */
  W.pipePieces = function () {
    var out = [];
    [W.SA, W.SB].forEach(function (sg, which) {
      sg.s.forEach(function (s) {
        var n = Math.max(1, Math.ceil(s.l / 1.1)), a = s.a, b = s.b;
        for (var k = 0; k < n; k++) {
          var p0 = [W.mix(a[0], b[0], k / n), W.mix(a[1], b[1], k / n), W.mix(a[2], b[2], k / n)], p1 = [W.mix(a[0], b[0], (k + 1) / n), W.mix(a[1], b[1], (k + 1) / n), W.mix(a[2], b[2], (k + 1) / n)];
          out.push({p0: p0, p1: p1, ax: s.ax, c: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], w: which});
        }
      });
    });
    return out;
  };
  W.PIECES = W.pipePieces();
  W.JOINTS = W.PIPE_A.slice(1, -1).concat(W.PIPE_B.slice(1, -1));
  function cylSeg(iso, p0, p1, ax, r, t3, o) {
    var a = [Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.min(p0[2], p1[2])], L = Math.abs(p1[ax] - p0[ax]);
    if (ax === 0) iso.cyl(a[0], a[1], a[2], r, L, t3, {axis: 'x', n: 14, bias: o && o.bias});
    else if (ax === 1) iso.cyl(a[0], a[1], a[2], r, L, t3, {axis: 'y', n: 14, bias: o && o.bias});
    else iso.cyl(a[0], a[1], a[2] - 0.0, r, L, t3, {n: 14, bias: o && o.bias});
  }
  W.cylSeg = cylSeg;
  /** ống + khớp. o: {fly(i,c)->offset|null, keep} */
  W.pipe = function (iso, t, o) {
    o = o || {};
    W.PIECES.forEach(function (pc, i) {
      var off = o.fly ? o.fly(i, pc.c) : [0, 0, 0];
      if (!off) return;
      var p0 = [pc.p0[0] + off[0], pc.p0[1] + off[1], pc.p0[2] + off[2]], p1 = [pc.p1[0] + off[0], pc.p1[1] + off[1], pc.p1[2] + off[2]];
      cylSeg(iso, p0, p1, pc.ax, W.PR, W.T.pipe);
    });
    if (!o.noJoints) W.JOINTS.forEach(function (j, i) {
      var off = o.flyJ ? o.flyJ(i, j) : [0, 0, 0]; if (!off) return;
      iso.sphere(j[0] + off[0], j[1] + off[1], j[2] + off[2], 0.55, W.T.pipeJ);
    });
    // miệng phễu ở điện thoại
    if (!o.noMouth) { var m = W.PIPE_A[0], off2 = o.flyJ ? o.flyJ(-1, m) : [0, 0, 0]; if (off2) iso.cyl(m[0] + off2[0], m[1] - 0.25 + off2[1], m[2] + off2[2], 0.62, 0.5, W.T.pipeJ, {axis: 'y', n: 16}); }
  };
  /** "bụng" đơn hàng chạy trong ống (vòng cam) tại vị trí u của đường sg */
  W.bulge = function (iso, sg, u, o) {
    var a = W.along(sg, u), p = a.p, h = 0.42, p0 = p.slice(), p1 = p.slice();
    p0[a.ax] -= h; p1[a.ax] += h;
    cylSeg(iso, p0, p1, a.ax, W.PR + 0.13, W.T.order, {bias: 0.3});
    return p;
  };

  /** máy trung gian (xám, không nhãn hiệu): phễu, đèn quay, khay phí. o: {coins: số xu trong khay, dz, dx} */
  W.machine = function (iso, t, o) {
    o = o || {};
    var M = W.MAC, dx = o.dx || 0, dy = o.dy || 0, dz = o.dz || 0;
    iso.box(M.x + dx, M.y + dy, dz, M.w, M.d, M.h, W.T.machine, {decal: function (I2, b) {
      // mặt +y: lưới tản nhiệt; mặt +x: khe nhả xu
      var Y = b.y + b.d + 0.01;
      for (var i = 0; i < 5; i++) { var zz = b.z + 0.6 + i * 0.42; I2.poly([I2.L(b.x + 0.5, Y, zz), I2.L(b.x + b.w - 0.5, Y, zz), I2.L(b.x + b.w - 0.5, Y, zz + 0.16), I2.L(b.x + 0.5, Y, zz + 0.16)], '#6F6A86'); }
      var X = b.x + b.w + 0.01;
      I2.poly([I2.L(X, b.y + 2.6, b.z + 0.5), I2.L(X, b.y + 3.5, b.z + 0.5), I2.L(X, b.y + 3.5, b.z + 1.1), I2.L(X, b.y + 2.6, b.z + 1.1)], '#4E4A63');
    }});
    iso.box(M.x + 0.6 + dx, M.y + 0.6 + dy, M.h + dz, M.w - 1.2, M.d - 1.2, 0.5, W.T.pipeJ);
    // đèn quay trên nóc (đỏ cam nhấp nháy = "phí")
    var bl = 0.5 + 0.5 * Math.sin(t * 6);
    iso.cyl(M.x + M.w / 2 + dx, M.y + M.d / 2 + dy, M.h + 0.5 + dz, 0.35, 0.5, tri(bl > 0.5 ? '#F2A33A' : '#B9873A'));
    // khay phí phía trước (+x)
    var tx = M.x + M.w + dx, ty = M.y + 2.4 + dy;
    iso.box(tx, ty, dz, 1.6, 1.8, 0.35, W.T.steel);
    var n = Math.floor(o.coins || 0);
    for (var c = 0; c < n; c++) {
      var col = c % 3, row = Math.floor(c / 3) % 3, lay = Math.floor(c / 9);
      iso.cyl(tx + 0.35 + col * 0.45, ty + 0.4 + row * 0.5, 0.35 + lay * 0.13 + dz, 0.2, 0.12, W.T.money, {n: 12});
    }
  };

  // ── quán Bếp Gió (cắt lớp: chỉ còn tường sau + tường trái, thấy bếp bên trong)
  W.RS = {x: 3, y: -8.2, w: 7.6, d: 7.2, h: 4.2};
  W.KASSE = [9.0, -2.4, 1.9];
  W.restaurant = function (iso, t, o) {
    o = o || {};
    var R = W.RS, X1 = R.x + R.w, Y1 = R.y + R.d;
    // sàn gạch caro
    for (var i = 0; i < 8; i++) for (var j = 0; j < 7; j++) {
      var x = R.x + i * (R.w / 8), y = R.y + j * (R.d / 7);
      iso.flat([[x, y], [x + R.w / 8, y], [x + R.w / 8, y + R.d / 7], [x, y + R.d / 7]], 0.02, (i + j) % 2 ? '#F1E6D2' : '#E2D3B8', {depth: -900});
    }
    // tường sau (y0) + tường trái (x0) có ô cửa cho băng chuyền
    iso.box(R.x - 0.3, R.y - 0.3, 0, R.w + 0.3, 0.3, R.h, W.T.wall, {decal: function (I2, b) {
      // cửa sổ có ánh đèn ấm
      var Y = b.y + b.d + 0.01, glow = o.glow == null ? 1 : o.glow;
      [[R.x + 0.8, R.x + 2.4], [R.x + 5.2, R.x + 6.8]].forEach(function (wx) {
        I2.poly([I2.L(wx[0], Y, 2.2), I2.L(wx[1], Y, 2.2), I2.L(wx[1], Y, 3.4), I2.L(wx[0], Y, 3.4)], glow > 0.5 ? '#FFD99A' : '#CDBFA6');
      });
    }});
    var cz = 1.35; // ô cửa băng chuyền: y -4.95..-4.05, z 0..1.35
    iso.box(R.x - 0.3, R.y, 0, 0.3, 3.2, R.h, W.T.wall);
    iso.box(R.x - 0.3, R.y + 4.2, 0, 0.3, R.d - 4.2, R.h, W.T.wall);
    iso.box(R.x - 0.3, R.y + 3.2, cz, 0.3, 1.0, R.h - cz, W.T.wall);
    // viền mái navy
    iso.box(R.x - 0.4, R.y - 0.4, R.h, R.w + 0.4, 0.5, 0.45, W.T.navy);
    iso.box(R.x - 0.4, R.y + 0.1, R.h, 0.5, R.d - 0.1, 0.45, W.T.navy);
    // biển hiệu trên tường sau
    iso.text3(o.sign || 'BẾP GIÓ', R.x + 2.9, R.y + 0.02, R.h - 0.55, {plane: 'xz', size: 0.95, tri: W.T.navy, face: '#2E2A63', bias: 2, weight: 800});
    // quầy bếp dọc tường sau + 2 nồi + hơi
    iso.box(R.x + 0.3, R.y + 0.1, 0, R.w - 0.6, 1.3, 1.25, W.T.steel);
    [R.x + 2.1, R.x + 4.4].forEach(function (px, k) {
      iso.cyl(px, R.y + 0.75, 1.25, 0.5, 0.65, W.T.steel, {n: 18});
      iso.cyl(px, R.y + 0.75, 1.9, 0.44, 0.02, ['#E9D2A6', '#E9D2A6', '#E9D2A6'], {n: 18});
      if (o.steam !== false) for (var s = 0; s < 3; s++) {
        var ph = ((t * 0.55 + s / 3 + k * 0.17) % 1);
        iso.bill(px + Math.sin(ph * 6 + s) * 0.15, R.y + 0.75, 2.0 + ph * 1.6, function (g) { g.beginPath(); g.arc(0, 0, 0.22 + ph * 0.25, 0, I.TAU); g.fillStyle = 'rgba(255,255,255,' + (0.55 * (1 - ph)).toFixed(3) + ')'; g.fill(); }, {bias: 5});
      }
    });
    // bàn ra món (cuối băng chuyền) + máy in phiếu + chuông
    iso.box(5.6, -5.4, 0, 1.3, 1.8, 0.95, W.T.steel);
    iso.box(5.75, -5.3, 0.95, 0.75, 0.7, 0.45, W.T.navy, {decal: function (I2, b) {
      var X = b.x + b.w + 0.01; I2.poly([I2.L(X, b.y + 0.1, b.z + 0.25), I2.L(X, b.y + 0.6, b.z + 0.25), I2.L(X, b.y + 0.6, b.z + 0.35), I2.L(X, b.y + 0.1, b.z + 0.35)], o.printLed ? '#08DDA4' : '#5A5690');
    }});
    if (o.ticket) iso.box(5.95, -5.2, 1.4, 0.04, 0.5, 0.05 + 1.0 * cl(o.ticket), W.T.cream, {bias: 1});
    var bell = o.bell || 0, bj = Math.sin(bell * 40) * (1 - bell) * 0.08 * (bell > 0 && bell < 1 ? 1 : 0);
    iso.cyl(6.3, -4.1, 0.95, 0.28, 0.08, W.T.steel, {n: 14});
    iso.cone(6.3 + bj, -4.1, 1.03, 0.24, 0.32, W.T.money, {n: 14});
    // đầu bếp
    var arm = o.chefArm == null ? 0.25 + 0.15 * Math.sin(t * 3) : o.chefArm;
    iso.bill(7.9, -5.6, 0, function (g) {
      I.person(g, {h: 2.3, body: '#F7F5FA', apron: '#E8E5F0', skin: '#D9A27A', arm: arm, face: o.chefFace || -1, legs: '#3B3660'});
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, -2.12, 0.3, 0.12, 0, 0, I.TAU); g.fill(); g.fillRect(-0.22, -2.45, 0.44, 0.34); g.beginPath(); g.arc(0, -2.48, 0.26, 0, I.TAU); g.fill();
    });
    // quầy két (Kasse) phía trước
    iso.box(8.2, -3.1, 0, 1.9, 1.6, 1.15, W.T.wood);
    iso.box(8.35, -2.85, 1.15, 0.9, 0.85, 0.55, W.T.navy, {decal: function (I2, b) {
      var X = b.x + b.w + 0.01, gl = o.kasse || 0;
      I2.poly([I2.L(X, b.y + 0.15, b.z + 0.22), I2.L(X, b.y + 0.7, b.z + 0.22), I2.L(X, b.y + 0.7, b.z + 0.45), I2.L(X, b.y + 0.15, b.z + 0.45)], gl > 0.05 ? '#08DDA4' : '#4E4A80');
    }});
  };

  // ── băng chuyền SAMI thẳng từ điện thoại vào bếp (dọc trục x, y = -4.5)
  W.BELT = {x0: -7.6, x1: 5.6, y0: -4.95, y1: -4.05, h: 0.5};
  /** o: {grow 0..1, speed, spark} */
  W.belt = function (iso, t, o) {
    o = o || {};
    var B = W.BELT, len = (B.x1 - B.x0) * (o.grow == null ? 1 : o.grow);
    if (len <= 0.02) return;
    var n = Math.ceil(len / 1.2);
    for (var i = 0; i < n; i++) {
      var xa = B.x0 + i * len / n, w = len / n;
      iso.box(xa, B.y0, 0, w, B.y1 - B.y0, B.h, W.T.purple, {decal: function (I2, b) {
        I2.poly([I2.L(b.x, b.y + 0.12, b.z + b.h + 0.005), I2.L(b.x + b.w, b.y + 0.12, b.z + b.h + 0.005), I2.L(b.x + b.w, b.y + b.d - 0.12, b.z + b.h + 0.005), I2.L(b.x, b.y + b.d - 0.12, b.z + b.h + 0.005)], '#24205A');
        // vạch mint chạy
        var sp = o.speed == null ? 2.2 : o.speed;
        for (var q = 0; q < 24; q++) {
          var xs = B.x0 + ((q * 0.6 + t * sp) % 14.4);
          if (xs < b.x || xs + 0.12 > b.x + b.w || xs + 0.12 > B.x0 + len) continue;
          I2.poly([I2.L(xs, b.y + 0.18, b.z + b.h + 0.01), I2.L(xs + 0.12, b.y + 0.18, b.z + b.h + 0.01), I2.L(xs + 0.12, b.y + b.d - 0.18, b.z + b.h + 0.01), I2.L(xs, b.y + b.d - 0.18, b.z + b.h + 0.01)], '#08DDA4');
        }
      }});
    }
    if (o.spark) W.sparks(iso, t, [B.x0 + len, (B.y0 + B.y1) / 2, B.h + 0.1], o.spark);
  };
  /** tia lửa hàn (billboard) quanh điểm p */
  W.sparks = function (iso, t, p, a) {
    iso.bill(p[0], p[1], p[2], function (g) {
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1.4);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.95 * a).toFixed(2) + ')'); gr.addColorStop(0.35, 'rgba(8,221,164,' + (0.6 * a).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(8,221,164,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1.4, 0, I.TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,180,' + a.toFixed(2) + ')'; g.lineWidth = 0.06; g.lineCap = 'round';
      for (var i = 0; i < 12; i++) {
        var ph = (t * 3.1 + S.rnd(i) ) % 1, an = -Math.PI * (0.1 + 0.8 * S.rnd(i * 3.3 + Math.floor(t * 3.1 + S.rnd(i)))), r = 0.3 + ph * 1.6;
        g.beginPath(); g.moveTo(Math.cos(an) * r, Math.sin(an) * r + ph * ph * 1.2); g.lineTo(Math.cos(an) * (r + 0.35), Math.sin(an) * (r + 0.35) + ph * ph * 1.2); g.stroke();
      }
    }, {bias: 50, r: 3});
  };

  /** khối đơn hàng (cam san hô + băng dán kem). o: {s (scale), squash, keep} */
  W.order = function (iso, x, y, z, o) {
    o = o || {};
    var s = (o.s == null ? 1 : o.s) * 0.85, sq = o.squash || 0, h = s * (1 - sq), w = s * (1 + sq * 0.5);
    if (s <= 0.01) return;
    var k0 = iso.keep; iso.keep = true;
    iso.box(x - w / 2, y - w / 2, z, w, w, h, W.T.order, {bias: o.bias || 0.5, decal: function (I2, b) {
      var Z = b.z + b.h + 0.004, m = b.w * 0.42;
      I2.poly([I2.L(b.x, b.y + m, Z), I2.L(b.x + b.w, b.y + m, Z), I2.L(b.x + b.w, b.y + b.w - m, Z), I2.L(b.x, b.y + b.w - m, Z)], '#FFF4E2');
      var X = b.x + b.w + 0.004;
      I2.poly([I2.L(X, b.y + m, b.z), I2.L(X, b.y + b.w - m, b.z), I2.L(X, b.y + b.w - m, Z), I2.L(X, b.y + m, Z)], '#F3E2C6');
    }});
    iso.keep = k0;
  };
  /** người tí hon (billboard). o: {body, hair, face, arm, h, bag} */
  W.person = function (iso, x, y, z, o) {
    o = o || {};
    iso.bill(x, y, z || 0, function (g) {
      I.person(g, {h: o.h || 2.2, body: o.body || '#3C7FB1', hair: o.hair || '#2B2238', skin: o.skin || '#E1AC85', arm: o.arm == null ? 0.2 : o.arm, face: o.face || 1, legs: '#2E2A4F'});
      if (o.bag) { var hh = o.h || 2.2; g.fillStyle = '#EE6A44'; g.fillRect(0.12 * hh, -0.42 * hh, 0.24 * hh, 0.22 * hh); g.fillStyle = '#FFF4E2'; g.fillRect(0.21 * hh, -0.42 * hh, 0.06 * hh, 0.22 * hh); }
    }, {bias: o.bias || 0});
  };
  /** giọt tiền (cầu vàng) */
  W.drop = function (iso, x, y, z, r) { iso.sphere(x, y, z, r || 0.2, W.T.money, {bias: 1}); };
  /** vũng / vết bắn trên mặt bàn */
  W.splash = function (iso, x, y, a) {
    if (a <= 0 || a >= 1) return;
    var r = 0.25 + a * 0.6, pts = [];
    for (var i = 0; i < 16; i++) { var an = i / 16 * I.TAU; pts.push([x + Math.cos(an) * r, y + Math.sin(an) * r]); }
    iso.flat(pts, 0.03, 'rgba(233,185,73,' + (0.7 * (1 - a)).toFixed(3) + ')', {depth: -800});
  };

  /** đặt phần tử HTML tại điểm thế giới (gốc = tâm dưới của phần tử nếu anchor 'bottom') */
  W.place = function (el, iso, p, o) {
    o = o || {};
    var s = iso.P(p[0], p[1], p[2]);
    el.style.left = (s[0] + (o.dx || 0)).toFixed(1) + 'px'; el.style.top = (s[1] + (o.dy || 0)).toFixed(1) + 'px';
    return s;
  };
  /** đường dẫn mực (leader) trên canvas: từ điểm thế giới tới điểm màn hình */
  W.leader = function (iso, p, sx, sy, a) {
    if (a <= 0) return;
    var g = iso.g, s = iso.P(p[0], p[1], p[2]);
    g.save(); g.strokeStyle = W.INK; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(W.mix(s[0], sx, a), W.mix(s[1], sy, a)); g.stroke();
    g.beginPath(); g.arc(s[0], s[1], 8, 0, I.TAU); g.fillStyle = '#FBF6EC'; g.fill(); g.stroke();
    g.beginPath(); g.arc(s[0], s[1], 3.4, 0, I.TAU); g.fillStyle = W.INK; g.fill();
    g.restore();
  };
})();
