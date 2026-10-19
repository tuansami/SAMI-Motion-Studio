/* SA03 · cỗ máy 4 bánh răng chữ (S05–S09). Một thế giới chung (toạ độ px ở tỉ lệ 1) → camera đi liền mạch qua các cảnh.
 * Bánh răng k: tâm (x, y), bán kính chia R, số răng N = R/20 (cùng bước răng → ăn khớp thật).
 * Góc quay là hàm của GIÂY VIDEO (không phải giây trong clip) nên mọi cảnh khớp pha với nhau.
 * Bánh răng 1 bước một răng mỗi nhịp (tạch theo phách 122 BPM); bánh răng sau quay theo công thức ăn khớp.
 */
(function () {
  'use strict';
  var S = window.SAMI, K = window.SK, NS = 'http://www.w3.org/2000/svg';
  var M = (window.MACH = {});
  var P = K.P;
  // tâm (9:16 zigzag dọc · 16:9 zigzag ngang) — khoảng cách tâm = R_A + R_B
  var R = [260, 200, 240, 180];
  var ANG = [0, -50, -130, -50]; // chuỗi đi LÊN: bánh răng trước luôn nằm dưới, không đè chữ
  var G = [{x: 0, y: 0}];
  for (var i = 1; i < 4; i++) {
    var a = ANG[i] * Math.PI / 180, d = R[i - 1] + R[i];
    G.push({x: G[i - 1].x + d * Math.cos(a), y: G[i - 1].y + d * Math.sin(a), th: a});
  }
  G.forEach(function (g, i) { g.R = R[i]; g.N = R[i] / 20; });
  M.G = G;
  // khung bắt đầu cảnh S05..S08 → thời điểm lắp bánh răng (giây video)
  var ST = [738, 900, 1062, 1225];
  M.ACT = ST.map(function (f) { return f / 30 + 1.6 * K.BEAT; });
  // chữ trên vành
  var WORD = ['S05_word', 'S06_word', 'S07_word', 'S08_word'].map(function (k) { return S.text(k).replace(/\.$/, '').toUpperCase(); });

  var el = function (tag, at, par) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; };
  function gearPath(Rp, N) {
    var ro = Rp + 18, ri = Rp - 20, step = 2 * Math.PI / N, wr = step * 0.3, wt = step * 0.16, d = '';
    var pt = function (r, an) { return (r * Math.cos(an)).toFixed(1) + ' ' + (r * Math.sin(an)).toFixed(1); };
    for (var k = 0; k < N; k++) {
      var c = k * step;
      d += (k === 0 ? 'M' : 'L') + pt(ri, c - wr) + 'L' + pt(ro, c - wt) + 'L' + pt(ro, c + wt) + 'L' + pt(ri, c + wr);
      d += 'A' + ri + ' ' + ri + ' 0 0 1 ' + pt(ri, c + step - wr);
    }
    return d + 'Z';
  }
  M.build = function (parent) {
    var svg = el('svg', {width: K.W, height: K.H, viewBox: '0 0 ' + K.W + ' ' + K.H, id: 'mach'});
    svg.style.cssText = 'position:absolute;left:0;top:0;z-index:2;overflow:visible';
    parent.appendChild(svg);
    var defs = el('defs', {}, svg);
    var world = el('g', {id: 'world'}, svg);
    M.world = world; M.parts = [];
    // mũi tên doanh thu (dưới bánh răng)
    M.arrow = el('g', {id: 'arrow'}, world);
    G.forEach(function (g, i) {
      var ghost = el('circle', {cx: g.x, cy: g.y, r: g.R, fill: 'none', stroke: '#8C88A6', 'stroke-width': 3, 'stroke-dasharray': '14 12'}, world);
      var gw = el('g', {transform: 'translate(' + g.x + ' ' + g.y + ')'}, world);
      var rot = el('g', {}, gw);
      el('path', {d: gearPath(g.R, g.N), fill: '#7667FE'}, rot);
      var rb = g.R * 0.74, rt = g.R * 0.6;
      el('circle', {r: rb, fill: '#FFFFFF'}, rot);
      var id = 'ring' + i;
      el('path', {id: id, d: 'M ' + (-g.R * 0.67) + ' 0 A ' + g.R * 0.67 + ' ' + g.R * 0.67 + ' 0 1 1 ' + (g.R * 0.67) + ' 0 A ' + g.R * 0.67 + ' ' + g.R * 0.67 + ' 0 1 1 ' + (-g.R * 0.67) + ' 0', fill: 'none'}, defs);
      var tx = el('text', {'font-family': 'Inter', 'font-weight': 800, 'font-size': Math.round(g.R * 0.12), fill: '#0C0628', 'dominant-baseline': 'central', textLength: (2 * Math.PI * g.R * 0.67 - 4).toFixed(0), lengthAdjust: 'spacing'}, rot);
      var tp = el('textPath', {href: '#' + id}, tx);
      var rep = g.R > 230 ? 3 : 2; var s = ''; for (var k = 0; k < rep; k++) s += WORD[i] + '  ·  ';
      tp.textContent = s;
      el('circle', {r: rt, fill: '#7667FE'}, rot);
      // nan: 4 khe cắt
      for (var k2 = 0; k2 < 4; k2++) { var an = k2 * Math.PI / 2 + Math.PI / 4; el('circle', {cx: (rt * 0.62 * Math.cos(an)).toFixed(1), cy: (rt * 0.62 * Math.sin(an)).toFixed(1), r: (rt * 0.17).toFixed(1), fill: '#ECEBF3'}, rot); }
      el('circle', {r: rt * 0.36, fill: '#0C0628'}, gw);
      var num = el('text', {'font-family': 'Inter', 'font-weight': 900, 'font-size': Math.round(rt * 0.36), fill: '#FFFFFF', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'letter-spacing': '-1'}, gw);
      num.textContent = '0' + (i + 1);
      M.parts.push({ghost: ghost, gw: gw, rot: rot});
    });
    return svg;
  };
  /** góc bánh răng 1 (độ) tại giây video gs: một răng mỗi nhịp, tạch (ease) trong 45 % đầu nhịp */
  M.phi1 = function (gs) {
    var b = (gs - M.ACT[0]) / K.BEAT; if (b < 0) return 0;
    var f = b - Math.floor(b);
    return (Math.floor(b) + S.EASE(Math.min(1, f / 0.45))) * 360 / G[0].N;
  };
  M.phis = function (gs) {
    var out = [M.phi1(gs)];
    for (var i = 1; i < 4; i++) {
      var A = G[i - 1], B = G[i], th = B.th * 180 / Math.PI;
      out.push(th + 180 - 180 / B.N - (A.N / B.N) * (out[i - 1] - th));
    }
    return out;
  };
  /** camera: điểm thế giới (wx, wy) hiện ở (sx, sy) màn hình, tỉ lệ s */
  M.cam = function (wx, wy, s, sx, sy) {
    M.world.setAttribute('transform', 'translate(' + (sx - wx * s).toFixed(2) + ' ' + (sy - wy * s).toFixed(2) + ') scale(' + s.toFixed(4) + ')');
  };
  /** vị trí camera chuẩn cho chặng k (0..3) và toàn cảnh (k = 4) */
  M.preset = function (k) {
    if (k < 4) return P ? {x: G[k].x, y: G[k].y, s: 1.12, sx: 560, sy: 1300} : {x: G[k].x, y: G[k].y, s: 0.95, sx: 1420, sy: 600};
    return P ? {x: 140, y: -475, s: 0.7, sx: 440, sy: 1310} : {x: 140, y: -475, s: 0.62, sx: 1260, sy: 590};
  };
  M.lerpCam = function (a, b, u) { var o = {}; for (var k in a) o[k] = a[k] + (b[k] - a[k]) * u; return o; };
  M.applyCam = function (c) { M.cam(c.x, c.y, c.s, c.sx, c.sy); };
  /** cập nhật bánh răng tại giây video gs */
  M.update = function (gs) {
    var ph = M.phis(gs);
    M.parts.forEach(function (p, i) {
      var a = M.ACT[i];
      var u = K.E(gs, a - 0.05, a + 0.55);                // lắp vào trục
      var vis = gs >= a - 0.05;
      p.gw.style.display = vis ? '' : 'none';
      var spin = (1 - u) * 90 * (i % 2 ? -1 : 1);         // xoáy nhẹ khi lắp, dừng đúng pha ăn khớp
      p.rot.setAttribute('transform', 'rotate(' + (ph[i] + spin).toFixed(3) + ')');
      p.gw.setAttribute('transform', 'translate(' + G[i].x + ' ' + G[i].y + ') scale(' + (0.55 + 0.45 * u).toFixed(4) + ')');
      p.gw.style.opacity = Math.min(1, u * 3);
      var showGhost = !vis && (i === 0 || gs > M.ACT[i - 1] + 0.3);
      p.ghost.style.display = showGhost ? '' : 'none';
      p.ghost.setAttribute('stroke-dashoffset', (-gs * 30).toFixed(1));
    });
    return ph;
  };
})();

/* một cảnh chặng (S05–S08): chữ chặng trước rời đi, camera pan tới bánh răng k, bánh răng lắp vào, chữ chặng k vào */
(function () {
  var S = window.SAMI, K = window.SK, M = window.MACH;
  M.STARTS = [738, 900, 1062, 1225];
  M.stageScene = function (k) {
    var B = K.b, $ = K.$, root = $('[data-composition-id]');
    K.init(M.STARTS[k]);
    var tl = S.timeline();
    K.grid(); K.chrome();
    M.build(root);
    var mk = function (n, pre) {
      var key = 'S0' + (5 + n) + '_';
      var w = document.createElement('div'); w.className = 'stg'; w.id = pre;
      var chips = S.text(key + 'chips').split(' · ').map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('');
      w.innerHTML = '<div class="cap slab">Chặng 0' + (n + 1) + ' / 04</div><div class="hd sword" data-copy="' + key + 'word"></div><div class="sub sline" data-copy="' + key + 'line"></div><div class="schips">' + chips + '</div>';
      root.appendChild(w);
      w.querySelectorAll('[data-copy], .slab').forEach(K.bind);
      return w;
    };
    var cur = mk(k, 'cur');
    if (k > 0) {
      var prev = mk(k - 1, 'prev');
      K.hide(tl, prev.querySelector('.sword'), B(0.1)); K.hide(tl, prev.querySelector('.sline'), B(0.2)); K.hide(tl, prev.querySelector('.slab'), B(0.1));
      tl.to(prev.querySelectorAll('.chip, .slab'), {clipPath: 'inset(0 0 100% 0)', duration: 0.35, stagger: 0.04}, B(0.1));
    } else {
      // từ khối tím phủ kín của S04: chữ S04 rời đi, khối tím quét lên lộ trang
      var pv = document.createElement('div'); pv.className = 'blk sig'; pv.style.cssText = 'left:0;top:0;width:' + K.W + 'px;height:' + K.H + 'px;z-index:8';
      var ph = document.createElement('div'); ph.className = 'hd'; ph.id = 'h04'; ph.setAttribute('data-copy', 'S04_head');
      ph.style.cssText = 'color:#fff;z-index:9;left:' + K.M + 'px;top:' + (K.P ? 262 : 150) + 'px;font-size:' + (K.P ? 112 : 104) + 'px;padding:' + (K.P ? '56px 52px' : '60px 64px');
      root.appendChild(pv); root.appendChild(ph); K.bind(ph);
      K.hide(tl, ph, B(0));
      tl.to(pv, {clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: S.EASE}, B(0.6));
    }
    tl.fromTo(cur.querySelector('.slab'), {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)', duration: 0.4}, B(1.3));
    K.reveal(tl, cur.querySelector('.slab'), B(1.3));
    K.reveal(tl, cur.querySelector('.sword'), B(1.5), {dur: 0.7});
    K.reveal(tl, cur.querySelector('.sline'), B(2.5));
    tl.fromTo(cur.querySelectorAll('.chip'), {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)', duration: 0.4, stagger: K.BEAT * 0.5}, B(3.5));
    var c0 = k === 0 ? (function () { var p = M.preset(0); p.s *= 1.6; return p; })() : M.preset(k - 1), c1 = M.preset(k);
    K.draw(function (t) {
      var gs = K.g(t);
      M.applyCam(M.lerpCam(c0, c1, K.E(t, B(0.2), B(2.0))));
      M.update(gs);
    });
    K.run(tl);
    return tl;
  };
})();
