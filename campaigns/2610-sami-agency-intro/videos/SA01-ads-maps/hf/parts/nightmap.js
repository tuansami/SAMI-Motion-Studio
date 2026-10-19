/* SA01 · "Night Radar" — một thành phố đêm vẽ bằng code, dùng chung cho mọi cảnh (cùng toạ độ → match-cut).
 * Đơn vị thế giới = mét (2400 × 2400). Bản đồ (đường, khối nhà, sông) nằm trong <svg id="nm-map"> có viewBox = camera.
 * Lớp phủ (radar, người, đường đi) vẽ theo pixel màn hình mỗi khung trong onUpdate → kích thước không đổi khi zoom.
 * Không Math.random / Date / rAF: mọi thứ là hàm của thời gian timeline (SAMI.rnd cho ngẫu nhiên tất định).
 */
(function () {
  'use strict';
  var S = window.SAMI, NS = 'http://www.w3.org/2000/svg';
  var NM = (window.NM = {});
  var W = S.w, H = S.h;
  NM.W = W; NM.H = H;

  // ── điểm cố định của câu chuyện
  NM.YOU = {x: 1200, y: 1200};            // Phở Mây · quán của bạn
  NM.PERSON = {x: 905, y: 1462};          // người đang đói, cách ≈ 400 m
  NM.RIVALS = [
    {id: 'r1', x: 1012, y: 1338, name: 'Quán Gió'},
    {id: 'r2', x: 742, y: 1180, name: 'Bếp Sen'},
    {id: 'r3', x: 1090, y: 1650, name: 'Nhà Tre'},
    {id: 'r4', x: 1480, y: 1020, name: ''},
    {id: 'r5', x: 620, y: 1560, name: ''},
    {id: 'r6', x: 1560, y: 1480, name: ''},
    {id: 'r7', x: 880, y: 900, name: ''}
  ];

  // ── tiện ích thời gian (thuần hàm)
  var EASE = S.EASE;
  NM.cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  NM.L = function (t, a, b) { return NM.cl((t - a) / (b - a)); };
  NM.E = function (t, a, b) { return EASE(NM.L(t, a, b)); };
  NM.mix = function (a, b, u) { return a + (b - a) * u; };
  NM.dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };

  var el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  NM.el = el;

  // ── dựng bản đồ (một lần)
  function buildMap(svg) {
    var defs = el('defs', {}, svg);
    var g = el('g', {}, svg);
    el('rect', {x: -400, y: -400, width: 3200, height: 3200, fill: '#070420'}, g);
    var rnd = S.rnd;
    // lưới phố hơi lượn
    var ys = [120, 285, 440, 600, 765, 930, 1092, 1268, 1430, 1592, 1760, 1930, 2100, 2270];
    var xs = [110, 270, 432, 594, 760, 922, 1080, 1250, 1410, 1575, 1740, 1905, 2080, 2250];
    var wob = function (i, j) { return (rnd(i * 31 + j * 7.3) - 0.5) * 26; };
    // khối nhà giữa các phố
    var blocks = el('g', {fill: '#110d2b', stroke: '#1b1640', 'stroke-width': 2}, g);
    for (var i = 0; i < ys.length - 1; i++) for (var j = 0; j < xs.length - 1; j++) {
      var x0 = xs[j] + 16, x1 = xs[j + 1] - 16, y0 = ys[i] + 16, y1 = ys[i + 1] - 16;
      var r = rnd(i * 13 + j * 5.1);
      if (r < 0.1) continue; // quảng trường
      var n = r < 0.45 ? 1 : r < 0.8 ? 2 : 3;
      for (var k = 0; k < n; k++) {
        var a = x0 + (x1 - x0) * k / n, b = x0 + (x1 - x0) * (k + 1) / n - (k < n - 1 ? 10 : 0);
        el('rect', {x: a, y: y0, width: Math.max(10, b - a), height: y1 - y0, rx: 6}, blocks);
      }
    }
    // công viên + sông
    el('path', {d: 'M1440 1440 L1720 1446 L1730 1730 L1452 1720 Z', fill: '#0b2427', stroke: '#11343a', 'stroke-width': 3}, g);
    el('path', {d: 'M300 600 L560 610 L566 900 L310 890 Z', fill: '#0b2427', stroke: '#11343a', 'stroke-width': 3}, g);
    el('path', {d: 'M-200 520 C 300 420, 600 700, 1000 560 S 1700 300, 2100 470 S 2600 600, 2700 560', fill: 'none', stroke: '#0c1a44', 'stroke-width': 90, 'stroke-linecap': 'round'}, g);
    el('path', {d: 'M-200 520 C 300 420, 600 700, 1000 560 S 1700 300, 2100 470 S 2600 600, 2700 560', fill: 'none', stroke: '#13306a', 'stroke-width': 4, opacity: 0.6, 'stroke-dasharray': '30 22'}, g);
    // phố
    var streets = el('g', {fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, g);
    var poly = function (pts, w, c) { el('polyline', {points: pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), stroke: c, 'stroke-width': w}, streets); };
    ys.forEach(function (y, i) {
      var pts = []; for (var x = -200; x <= 2600; x += 200) pts.push([x, y + wob(i, x)]);
      var main = i % 3 === 1; poly(pts, main ? 26 : 14, main ? '#241f50' : '#1a1640');
    });
    xs.forEach(function (x, j) {
      var pts = []; for (var y = -200; y <= 2600; y += 200) pts.push([x + wob(j + 50, y), y]);
      var main = j % 3 === 2; poly(pts, main ? 26 : 14, main ? '#241f50' : '#1a1640');
    });
    // đại lộ chéo
    poly([[-200, 2350], [700, 1700], [1500, 1180], [2600, 520]], 34, '#2c2662');
    poly([[-200, 2350], [700, 1700], [1500, 1180], [2600, 520]], 2, '#5a4fb0');
    poly([[260, -200], [760, 700], [1350, 1600], [1800, 2600]], 22, '#241f50');
    // nhãn phố (tưởng tượng, chung chung)
    var lab = el('g', {fill: '#4a4380', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 22, 'letter-spacing': 2}, g);
    [['LINDENSTRASSE', 1300, 1084], ['BAHNHOFSTRASSE', 640, 1745], ['AM MARKT', 960, 1262], ['SÜDPLATZ', 1460, 1422], ['PARKWEG', 1290, 1586], ['WEISSE ELSTER', 1180, 520]].forEach(function (l) {
      var t = el('text', {x: l[1], y: l[2]}, lab); t.textContent = l[0];
    });
    return g;
  }

  // ── khung dựng
  NM.init = function (host) {
    host = host || document.getElementById('nm');
    var map = el('svg', {id: 'nm-map', width: W, height: H, preserveAspectRatio: 'xMidYMid slice'}, host);
    buildMap(map);
    var ov = el('svg', {id: 'nm-ov', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H}, host);
    var defs = el('defs', {}, ov);
    var sg = el('linearGradient', {id: 'nm-sweep', x1: 0, y1: 0, x2: 1, y2: 0}, defs);
    el('stop', {offset: 0, 'stop-color': '#08DDA4', 'stop-opacity': 0}, sg);
    el('stop', {offset: 1, 'stop-color': '#08DDA4', 'stop-opacity': 0.55}, sg);
    var rg = el('radialGradient', {id: 'nm-glow'}, defs);
    el('stop', {offset: 0, 'stop-color': '#08DDA4', 'stop-opacity': 0.55}, rg);
    el('stop', {offset: 1, 'stop-color': '#08DDA4', 'stop-opacity': 0}, rg);
    var pg = el('radialGradient', {id: 'nm-glowp'}, defs);
    el('stop', {offset: 0, 'stop-color': '#7667FE', 'stop-opacity': 0.6}, pg);
    el('stop', {offset: 1, 'stop-color': '#7667FE', 'stop-opacity': 0}, pg);
    NM.map = map; NM.ov = ov;
    NM.layer = {
      radar: el('g', {}, ov),
      routes: el('g', {fill: 'none', 'stroke-linecap': 'round'}, ov),
      dots: el('g', {}, ov)
    };
    var pins = document.createElement('div'); pins.id = 'nm-pins'; host.appendChild(pins); NM.pinsHost = pins;
    NM.pins = [];
    return NM;
  };

  // ── camera: điểm (x,y) của thế giới nằm ở vị trí (fx,fy) của màn hình; w = số mét theo bề ngang
  NM.cam = function (x, y, w, fx, fy) {
    fx = fx == null ? 0.5 : fx; fy = fy == null ? 0.5 : fy;
    var k = W / w, h = H / k;
    NM.k = k; NM.vx = x - fx * w; NM.vy = y - fy * h;
    NM.map.setAttribute('viewBox', NM.vx.toFixed(2) + ' ' + NM.vy.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2));
  };
  NM.p = function (pt) { return {x: (pt.x - NM.vx) * NM.k, y: (pt.y - NM.vy) * NM.k}; };

  // ── ghim (HTML, kích thước cố định)
  var PIN_YOU = '<svg viewBox="0 0 64 84" class="pin-svg"><defs><linearGradient id="pgy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08DDA4"/><stop offset="1" stop-color="#7667FE"/></linearGradient></defs><path d="M32 82 C32 82 4 50 4 30 A28 28 0 0 1 60 30 C60 50 32 82 32 82Z" fill="url(#pgy)"/><circle cx="32" cy="30" r="11" fill="#0C0628"/></svg>';
  var PIN_RIVAL = '<svg viewBox="0 0 64 84" class="pin-svg"><path d="M32 82 C32 82 4 50 4 30 A28 28 0 0 1 60 30 C60 50 32 82 32 82Z" fill="#E3E4F7"/><circle cx="32" cy="30" r="10" fill="#2a2558"/></svg>';
  NM.pin = function (pt, o) {
    o = o || {};
    var d = document.createElement('div');
    d.className = 'pin ' + (o.kind || 'rival');
    d.innerHTML = (o.kind === 'you' ? PIN_YOU : PIN_RIVAL) + (o.label ? '<div class="pin-lab">' + o.label + '</div>' : '');
    NM.pinsHost.appendChild(d);
    var p = {pt: pt, el: d, s: 1, o: 1, lift: 0};
    NM.pins.push(p);
    return p;
  };
  NM.placePins = function () {
    NM.pins.forEach(function (p) {
      var q = NM.p(p.pt);
      p.el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + (q.y - p.lift).toFixed(1) + 'px) scale(' + p.s.toFixed(3) + ')';
      p.el.style.opacity = p.o.toFixed(3);
    });
  };

  // ── radar (vòng + tia quét) theo pixel màn hình
  NM.radar = function () {
    var g = el('g', {}, NM.layer.radar);
    var r = {g: g, rings: [], slices: [], edge: el('line', {stroke: '#08DDA4', 'stroke-width': 3, opacity: 0.9}, g)};
    for (var i = 0; i < 4; i++) r.rings.push(el('circle', {fill: 'none', stroke: '#08DDA4', 'stroke-width': i === 3 ? 2.5 : 1.5, opacity: 0.3, 'stroke-dasharray': i === 3 ? '0' : '6 10'}, g));
    for (var j = 0; j < 16; j++) r.slices.push(el('path', {fill: '#08DDA4', 'fill-opacity': (0.30 * Math.pow((j + 1) / 16, 2)).toFixed(3)}, g));
    r.ping = el('circle', {fill: 'none', stroke: '#08DDA4', 'stroke-width': 4}, g);
    /** c = tâm (thế giới), R = bán kính (mét), ang = góc tia (độ), a = độ hiện, ping = 0..1 */
    r.draw = function (c, R, ang, a, ping) {
      var q = NM.p(c), rp = R * NM.k;
      g.setAttribute('opacity', a);
      r.rings.forEach(function (ci, i) { ci.setAttribute('cx', q.x); ci.setAttribute('cy', q.y); ci.setAttribute('r', rp * (i + 1) / 4); });
      var p1;
      r.slices.forEach(function (sl, j) {
        var a0 = (ang - 56 + j * 3.5) * Math.PI / 180, a1 = (ang - 56 + (j + 1) * 3.5 + 0.4) * Math.PI / 180;
        var s0 = {x: q.x + rp * Math.cos(a0), y: q.y + rp * Math.sin(a0)}, s1 = {x: q.x + rp * Math.cos(a1), y: q.y + rp * Math.sin(a1)};
        sl.setAttribute('d', 'M' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ' L' + s0.x.toFixed(1) + ' ' + s0.y.toFixed(1) + ' A' + rp.toFixed(1) + ' ' + rp.toFixed(1) + ' 0 0 1 ' + s1.x.toFixed(1) + ' ' + s1.y.toFixed(1) + ' Z');
      });
      p1 = {x: q.x + rp * Math.cos(ang * Math.PI / 180), y: q.y + rp * Math.sin(ang * Math.PI / 180)};
      r.edge.setAttribute('x1', q.x); r.edge.setAttribute('y1', q.y); r.edge.setAttribute('x2', p1.x); r.edge.setAttribute('y2', p1.y);
      ping = ping || 0;
      r.ping.setAttribute('cx', q.x); r.ping.setAttribute('cy', q.y); r.ping.setAttribute('r', rp * ping);
      r.ping.setAttribute('opacity', ping > 0 && ping < 1 ? (1 - ping) * 0.7 : 0);
    };
    return r;
  };
  /** độ sáng của điểm khi tia quét đi qua: 1 ngay sau tia, mờ dần sau 'tail' độ */
  NM.lit = function (c, pt, ang, tail) {
    var b = Math.atan2(pt.y - c.y, pt.x - c.x) * 180 / Math.PI;
    var d = ((ang - b) % 360 + 360) % 360;
    return d < (tail || 300) ? 1 - d / (tail || 300) : 0;
  };

  // ── người (chấm) + đường đi
  NM.dot = function (o) {
    o = o || {};
    var g = el('g', {}, NM.layer.dots);
    var d = {g: g,
      halo: el('circle', {r: o.halo || 30, fill: 'url(#' + (o.purple ? 'nm-glowp' : 'nm-glow') + ')'}, g),
      ring: el('circle', {r: 20, fill: 'none', stroke: o.color || '#08DDA4', 'stroke-width': 2.5}, g),
      core: el('circle', {r: o.r || 9, fill: o.color || '#08DDA4', stroke: '#06031A', 'stroke-width': 3}, g)};
    d.place = function (pt, a, pulse, scale) {
      var q = NM.p(pt); scale = scale == null ? 1 : scale;
      g.setAttribute('transform', 'translate(' + q.x.toFixed(1) + ',' + q.y.toFixed(1) + ') scale(' + scale.toFixed(3) + ')');
      g.setAttribute('opacity', a == null ? 1 : a);
      pulse = pulse == null ? 0 : pulse % 1;
      d.ring.setAttribute('r', 10 + pulse * 34); d.ring.setAttribute('opacity', (1 - pulse) * 0.8);
    };
    d.color = function (c) { d.core.setAttribute('fill', c); d.ring.setAttribute('stroke', c); };
    return d;
  };
  /** đường cong bậc hai từ a tới b, cong 'bend' (tỉ lệ độ dài, + = lệch trái) */
  NM.curve = function (a, b, bend) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    var c = {x: mx - dy * bend, y: my + dx * bend};
    return function (u) { var v = 1 - u; return {x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y}; };
  };
  /** đường đi dạng "phố" (đi theo chữ L qua toạ độ trung gian) */
  NM.polyFn = function (pts) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + NM.dist(pts[i - 1], pts[i]));
    var T = L[L.length - 1];
    var f = function (u) {
      var s = NM.cl(u) * T, i = 1; while (i < L.length - 1 && L[i] < s) i++;
      var w = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      return {x: NM.mix(pts[i - 1].x, pts[i].x, w), y: NM.mix(pts[i - 1].y, pts[i].y, w)};
    };
    f.len = T; return f;
  };
  NM.route = function (o) {
    o = o || {};
    var r = {p: el('path', {stroke: o.color || '#08DDA4', 'stroke-width': o.w || 5, opacity: 0.9, 'stroke-dasharray': o.dash || 'none'}, NM.layer.routes)};
    /** vẽ đoạn [0..u] của hàm đường fn */
    r.draw = function (fn, u, a) {
      var n = 40, d = '';
      for (var i = 0; i <= n; i++) { var q = NM.p(fn(u * i / n)); d += (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1); }
      r.p.setAttribute('d', u > 0.001 ? d : 'M0 0');
      r.p.setAttribute('opacity', u > 0.001 ? (a == null ? 0.9 : a) : 0);
    };
    return r;
  };

  /** đám đông tất định quanh một tâm: n điểm trong vành [r0, r1] */
  NM.crowd = function (n, c, r0, r1, seed) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = S.rnd(seed + i * 3.7) * Math.PI * 2, r = r0 + (r1 - r0) * Math.sqrt(S.rnd(seed + i * 9.1 + 2));
      out.push({x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.92, a: a, k: S.rnd(seed + i * 1.3 + 5)});
    }
    return out;
  };
})();

/* hạt sáng tiền cảnh: trôi chậm, tất định theo thời gian */
(function () {
  var S = window.SAMI, NM = window.NM;
  NM.motes = function (host, n, seed) {
    var box = document.createElement('div'); box.className = 'motes'; host.appendChild(box);
    var list = [];
    for (var i = 0; i < n; i++) {
      var m = document.createElement('i'); box.appendChild(m);
      list.push({el: m, x: S.rnd(seed + i * 2.1) * S.w, y: S.rnd(seed + i * 5.3) * S.h, v: 8 + S.rnd(seed + i * 7.7) * 22, s: 0.5 + S.rnd(seed + i) * 1.4, ph: S.rnd(seed + i * 3.3) * 6.28});
    }
    return function (t) {
      list.forEach(function (m) {
        var y = ((m.y - m.v * t) % S.h + S.h) % S.h, x = m.x + Math.sin(t * 0.6 + m.ph) * 18;
        m.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + m.s.toFixed(2) + ')';
        m.el.style.opacity = (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + m.ph))).toFixed(2);
      });
    };
  };
  /** đồng hồ của cảnh: gọi draw(t) mỗi khung (seek được) */
  NM.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
})();
