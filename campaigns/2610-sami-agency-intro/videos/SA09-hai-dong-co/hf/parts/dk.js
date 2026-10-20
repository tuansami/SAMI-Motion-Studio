/* SA09 · hàm chung "Dark Tech Keynote". Mọi chuyển động là hàm của t (seek được), ngẫu nhiên = SAMI.rnd(seed). */
(function () {
  'use strict';
  var S = window.SAMI, EASE = S.EASE, D = (window.DK = {});
  D.EASE = EASE;
  D.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  D.L = function (t, a, b) { return D.cl((t - a) / (b - a)); };
  D.E = function (t, a, b) { return EASE(D.L(t, a, b)); };
  D.mix = function (a, b, u) { return a + (b - a) * u; };
  D.$ = function (s) { return document.querySelector(s); };
  D.el = function (tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  /** đồng hồ cảnh: draw(t) mỗi khung theo timeline */
  D.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  /** chữ: tách từng từ, vào kiểu keynote (nhích lên + hết mờ), đứng yên */
  D.words = function (tl, sel, at, opt) {
    opt = opt || {};
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    var w = S.words(el);
    S.arrive(tl, w, at, {stagger: opt.stagger == null ? 0.06 : opt.stagger, dist: opt.dist == null ? 34 : opt.dist, blur: 10, dur: 0.65});
    return w;
  };
  D.fadeIn = function (tl, sel, at, opt) { opt = opt || {}; return S.arrive(tl, sel, at, {dist: opt.dist == null ? 24 : opt.dist, blur: opt.blur == null ? 8 : opt.blur, dur: opt.dur || 0.6, stagger: opt.stagger || 0}); };
  D.fadeOut = function (tl, sel, at, opt) { opt = opt || {}; return S.leave(tl, sel, at, {dist: opt.dist == null ? -20 : opt.dist, dur: opt.dur || 0.45, stagger: opt.stagger || 0}); };

  /** sân khấu: nền + đèn rọi + sàn lưới + hạt bụi. opt: {horizon (px từ trên), beamX (0..1), dust (số hạt), glow: 'ads'|'seo'|...} */
  D.stage = function (root, opt) {
    opt = opt || {};
    var st = D.el('div', 'stage', null);
    root.insertBefore(st, root.firstChild);
    D.el('div', 'bg', st);
    var beam = D.el('div', 'beam', st);
    var hz = opt.horizon == null ? S.h * 0.66 : opt.horizon;
    var fw = D.el('div', 'floorwrap', st); fw.style.top = hz + 'px';
    var floor = D.el('div', 'floor', fw);
    var line = D.el('div', 'horizon', st); line.style.top = hz + 'px';
    var gA = D.el('div', 'glowA', st), gB = D.el('div', 'glowB', st);
    var dust = D.el('div', 'dust', st), motes = [], n = opt.dust == null ? 34 : opt.dust;
    for (var i = 0; i < n; i++) {
      var m = D.el('i', '', dust);
      motes.push({el: m, x: S.rnd(i * 3.1 + 1) * S.w, y: S.rnd(i * 7.7 + 2) * S.h, v: 8 + S.rnd(i * 5.3) * 22, s: 0.4 + S.rnd(i * 9.1) * 0.9, ph: S.rnd(i * 2.2) * 6.28});
    }
    var bx = opt.beamX == null ? 0.5 : opt.beamX;
    var api = {el: st, beam: beam, floor: floor, glowA: gA, glowB: gB, horizon: hz, light: 1};
    /** cập nhật mỗi khung; light 0..1 = độ sáng đèn rọi */
    api.update = function (t, o) {
      o = o || {};
      var light = o.light == null ? 1 : o.light;
      beam.style.transform = 'translateX(' + ((bx - 0.5) * S.w + Math.sin(t * 0.35) * 26).toFixed(1) + 'px) rotate(' + (Math.sin(t * 0.3) * 1.6).toFixed(2) + 'deg)';
      beam.style.opacity = (0.85 * light).toFixed(3);
      floor.style.backgroundPosition = '0 ' + ((t * (o.speed == null ? 40 : o.speed)) % 120).toFixed(1) + 'px';
      motes.forEach(function (m, i) {
        var y = (m.y - t * m.v) % S.h; if (y < 0) y += S.h;
        var x = m.x + Math.sin(t * 0.6 + m.ph) * 18;
        m.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + m.s.toFixed(2) + ')';
        m.el.style.opacity = ((0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 1.3 + m.ph))) * (0.35 + 0.65 * light)).toFixed(3);
      });
      if (o.glowA) { gA.style.left = (o.glowA.x - 450) + 'px'; gA.style.top = (o.glowA.y - 450) + 'px'; gA.style.opacity = o.glowA.a.toFixed(3); } else gA.style.opacity = 0;
      if (o.glowB) { gB.style.left = (o.glowB.x - 450) + 'px'; gB.style.top = (o.glowB.y - 450) + 'px'; gB.style.opacity = o.glowB.a.toFixed(3); } else gB.style.opacity = 0;
    };
    api.update(0);
    return api;
  };

  /** khối 3D: {x, y, w, h, d, cls, rx, ry} → {wrap, box, f} (nội dung đặt trong f) */
  D.box = function (parent, o) {
    var wrap = D.el('div', 'persp', parent);
    wrap.style.left = o.x + 'px'; wrap.style.top = o.y + 'px'; wrap.style.width = o.w + 'px'; wrap.style.height = o.h + 'px';
    var b = D.el('div', 'b3 ' + (o.cls || ''), wrap); b.style.width = o.w + 'px'; b.style.height = o.h + 'px';
    var f = D.el('div', 'f', b), tp = D.el('div', 't', b), sd = D.el('div', 's', b);
    var d = o.d || 60;
    f.style.transform = 'translateZ(0px)';
    tp.style.height = d + 'px'; tp.style.transform = 'rotateX(-90deg)';
    sd.style.width = d + 'px'; sd.style.transform = 'rotateY(' + (o.left ? 90 : -90) + 'deg)';
    if (o.left) { sd.style.right = 'auto'; sd.style.left = '0'; sd.style.transformOrigin = '0 50%'; }
    var api = {wrap: wrap, box: b, f: f, rx: o.rx == null ? -16 : o.rx, ry: o.ry == null ? -18 : o.ry};
    api.pose = function (dx, dy, extraRy, sc) {
      b.style.transform = 'translate3d(' + (dx || 0).toFixed(1) + 'px,' + (dy || 0).toFixed(1) + 'px,0) rotateX(' + api.rx + 'deg) rotateY(' + (api.ry + (extraRy || 0)).toFixed(2) + 'deg) scale(' + (sc == null ? 1 : sc).toFixed(3) + ')';
    };
    api.pose(0, 0, 0);
    return api;
  };

  /** đường bánh răng (SVG path, tâm 0,0): N răng, bán kính lăn r; có lỗ trục + lỗ giảm trọng (evenodd) */
  D.gearPath = function (N, r, opt) {
    opt = opt || {};
    var m = 2 * r / N, ro = r + m * 0.95, rr = r - m * 1.15, p = [], k, a0, step = Math.PI * 2 / N;
    for (k = 0; k < N; k++) {
      a0 = k * step - step / 2; // răng tâm tại góc k*step
      var pts = [[rr, a0 + step * 0.04], [ro, a0 + step * 0.30], [ro, a0 + step * 0.70], [rr, a0 + step * 0.96]];
      pts.forEach(function (q, j) { p.push((k === 0 && j === 0 ? 'M' : 'L') + (q[0] * Math.cos(q[1])).toFixed(2) + ' ' + (q[0] * Math.sin(q[1])).toFixed(2)); });
    }
    p.push('Z');
    var hub = opt.hub == null ? r * 0.22 : opt.hub;
    p.push(circ(hub));
    var holes = opt.holes == null ? 5 : opt.holes, hr = r * 0.17, hd = r * 0.55;
    for (k = 0; k < holes; k++) { var a = k * Math.PI * 2 / holes + Math.PI / holes; p.push(circAt(hd * Math.cos(a), hd * Math.sin(a), hr)); }
    return p.join(' ');
    function circ(rad) { return circAt(0, 0, rad); }
    function circAt(cx, cy, rad) { return 'M' + (cx + rad).toFixed(2) + ' ' + cy.toFixed(2) + ' A' + rad + ' ' + rad + ' 0 1 0 ' + (cx - rad).toFixed(2) + ' ' + cy.toFixed(2) + ' A' + rad + ' ' + rad + ' 0 1 0 ' + (cx + rad).toFixed(2) + ' ' + cy.toFixed(2) + ' Z'; }
  };
  /** góc của bánh B khớp với bánh A: A tại cA (N răng, góc phiA độ), B tại cB (M răng) */
  D.meshAngle = function (cA, NA, phiA, cB, NB) {
    var al = Math.atan2(cB[1] - cA[1], cB[0] - cA[0]) * 180 / Math.PI;
    return -(NA / NB) * (phiA - al) + al + 180 + 180 / NB;
  };

  /** dòng khách (chấm sáng) chạy dọc đường cong pts [[x,y]...]: trả hàm draw(t, rate) */
  D.flow = function (parent, pts, o) {
    o = o || {};
    var n = o.n || 14, dots = [], i;
    for (i = 0; i < n; i++) { var e = D.el('i', 'fdot', parent); e.style.cssText = 'position:absolute;left:0;top:0;width:' + (o.size || 14) + 'px;height:' + (o.size || 14) + 'px;margin:-' + ((o.size || 14) / 2) + 'px;border-radius:50%;background:' + (o.color || '#fff') + ';box-shadow:0 0 14px ' + (o.color || '#fff') + ';z-index:' + (o.z || 6); dots.push(e); }
    var segs = [], tot = 0;
    for (i = 1; i < pts.length; i++) { var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.sqrt(dx * dx + dy * dy); segs.push(l); tot += l; }
    function at(u) {
      var d = u * tot;
      for (var j = 0; j < segs.length; j++) { if (d <= segs[j]) { var k = d / segs[j]; return [D.mix(pts[j][0], pts[j + 1][0], k), D.mix(pts[j][1], pts[j + 1][1], k)]; } d -= segs[j]; }
      return pts[pts.length - 1];
    }
    /** tStop: lúc ngừng phát chấm mới (chấm đang chạy đi tiếp tới đích) */
    return function (t, tStop, period) {
      period = period || 1.6;
      dots.forEach(function (e, k) {
        var birth = Math.floor((t / period - k / n)) * period + (k / n) * period; // lần phát gần nhất của chấm k
        var u = (t - birth) / period;
        var alive = birth <= (tStop == null ? 1e9 : tStop) && birth >= (o.t0 || 0);
        var p = at(D.cl(u));
        e.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
        e.style.opacity = alive ? (Math.min(1, u * 6, (1 - u) * 6)).toFixed(3) : 0;
      });
    };
  };
})();
