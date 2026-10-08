/* Khối "vẽ bằng code" cho cảnh Hyperframes (Studio 0.9): window.SAMI.B — nạp SAU sami-hf.js:
 *   <script src="_sami/blocks/blocks.js"></script>
 * Mọi chuyển động gắn vào timeline GSAP của cảnh (tua được, tất định). Màu lấy biến CSS (--k-accent nếu có kit khuôn, không thì --c-mint).
 *   B.bars(tl, el, [{label, value}], at, {max, unit, decimals, horizontal})   biểu đồ cột mọc lên + số đếm
 *   B.line(tl, el, [v1, v2, …], at, {dur, labels, area})                      đường biểu đồ tự vẽ + chấm cuối
 *   B.cursor(tl, el, [[x, y, t, click?], …])                                  con trỏ chuột đi qua các điểm (0..1 của el), nhấp có gợn sóng
 *   B.route(tl, svg, [[x, y], …], at, {dur, pins})                            đường đi trên bản đồ tự vẽ, chấm chạy theo, ghim ở hai đầu
 *   B.wipe(tl, el, at, {dir, dur, color})                                    chuyển cảnh: dải màu quét qua che rồi mở
 */
(function () {
  'use strict';
  var S = window.SAMI, B = (S.B = {});
  var NS = 'http://www.w3.org/2000/svg';
  var accent = function () { var c = getComputedStyle(document.documentElement); return (c.getPropertyValue('--k-accent') || c.getPropertyValue('--c-mint') || '#08DDA4').trim(); };
  var el = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  var fmt = function (v, d, unit) { return v.toFixed(d || 0).replace('.', ',') + (unit || ''); };

  B.bars = function (tl, box, data, at, o) {
    o = o || {}; var max = o.max || Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.12, col = o.color || accent();
    box.innerHTML = ''; box.style.display = 'flex'; box.style.alignItems = 'flex-end'; box.style.gap = (o.gap || 4) + '%';
    data.forEach(function (d, i) {
      var c = document.createElement('div'); c.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:.3em';
      var num = document.createElement('div'); num.style.cssText = 'font-weight:800;font-size:1.25em;font-variant-numeric:tabular-nums'; num.textContent = fmt(0, o.decimals, o.unit);
      var bar = document.createElement('div'); bar.style.cssText = 'width:100%;border-radius:.35em .35em .1em .1em;transform-origin:50% 100%;background:' + (d.color || (i === data.length - 1 || d.hi ? col : 'color-mix(in srgb,' + col + ' 38%, transparent)')) + ';height:' + (100 * d.value / max).toFixed(2) + '%';
      var lab = document.createElement('div'); lab.style.cssText = 'font-size:.8em;opacity:.75;white-space:nowrap'; lab.textContent = d.label || '';
      c.appendChild(num); c.appendChild(bar); c.appendChild(lab); box.appendChild(c);
      var t = at + i * (o.stagger == null ? 0.18 : o.stagger), o2 = {v: 0};
      tl.fromTo(bar, {scaleY: 0}, {scaleY: 1, duration: o.dur || 0.9, ease: S.EASE}, t);
      tl.to(o2, {v: d.value, duration: o.dur || 0.9, ease: S.EASE, onUpdate: function () { num.textContent = fmt(o2.v, o.decimals, o.unit); }}, t);
      tl.fromTo([num, lab], {opacity: 0}, {opacity: 1, duration: 0.3}, t);
    });
    return box;
  };

  B.line = function (tl, box, values, at, o) {
    o = o || {}; var col = o.color || accent(), w = 1000, h = 500, min = Math.min.apply(null, values), max = Math.max.apply(null, values), pad = 30;
    var pts = values.map(function (v, i) { return [pad + i * (w - 2 * pad) / Math.max(1, values.length - 1), h - pad - (max === min ? 0.5 : (v - min) / (max - min)) * (h - 2 * pad)]; });
    box.innerHTML = ''; var svg = el('svg', {viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none', style: 'width:100%;height:100%;overflow:visible'}, box);
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    if (o.area !== false) { var a = el('path', {d: d + ' L' + pts[pts.length - 1][0] + ' ' + h + ' L' + pts[0][0] + ' ' + h + ' Z', fill: col, opacity: 0.14}, svg); tl.fromTo(a, {opacity: 0}, {opacity: 0.14, duration: 0.8}, at + (o.dur || 1.6) * 0.6); }
    var line = el('path', {d: d, fill: 'none', stroke: col, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke'}, svg);
    var L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
    tl.to(line, {strokeDashoffset: 0, duration: o.dur || 1.6, ease: S.EASE}, at);
    var last = pts[pts.length - 1], dot = el('circle', {cx: last[0], cy: last[1], r: 14, fill: col}, svg);
    tl.fromTo(dot, {scale: 0, transformOrigin: last[0] + 'px ' + last[1] + 'px'}, {scale: 1, duration: 0.35}, at + (o.dur || 1.6));
    return svg;
  };

  B.cursor = function (tl, box, path, o) {
    o = o || {}; box.style.position = box.style.position || 'relative';
    var c = document.createElement('div'); c.style.cssText = 'position:absolute;left:0;top:0;width:' + (o.size || 44) + 'px;height:' + (o.size || 44) * 1.25 + 'px;z-index:20;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))';
    c.innerHTML = '<svg viewBox="0 0 20 25" width="100%" height="100%"><path d="M1 1 L1 20 L6 15.5 L9.5 23.5 L13 22 L9.6 14.2 L16 14 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    box.appendChild(c);
    var W = box.clientWidth, H = box.clientHeight, prev = null;
    path.forEach(function (p, i) {
      var x = p[0] * W, y = p[1] * H, t = p[2];
      if (!prev) tl.set(c, {x: x, y: y}, 0); else tl.to(c, {x: x, y: y, duration: Math.max(0.2, t - prev[2]) * 0.8, ease: S.EASE}, prev[2]);
      if (p[3]) {
        var r = document.createElement('div'); r.style.cssText = 'position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:4px solid ' + (o.color || accent()) + ';left:' + x + 'px;top:' + y + 'px;z-index:19;opacity:0';
        box.appendChild(r);
        tl.fromTo(r, {scale: 0.2, opacity: 1}, {scale: 1.4, opacity: 0, duration: 0.6}, t);
        tl.to(c, {scale: 0.85, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '0 0'}, t);
      }
      prev = p;
    });
    return c;
  };

  B.route = function (tl, svg, pts, at, o) {
    o = o || {}; var col = o.color || accent(), vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal : {width: svg.clientWidth, height: svg.clientHeight};
    var P = pts.map(function (p) { return [p[0] * vb.width, p[1] * vb.height]; });
    var d = 'M' + P[0][0] + ' ' + P[0][1]; for (var i = 1; i < P.length; i++) { var a = P[i - 1], b = P[i]; d += ' Q' + ((a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18).toFixed(1) + ' ' + ((a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18).toFixed(1) + ' ' + b[0] + ' ' + b[1]; }
    var path = el('path', {d: d, fill: 'none', stroke: col, 'stroke-width': o.width || 7, 'stroke-linecap': 'round', 'stroke-dasharray': '1 0'}, svg);
    var L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    var dur = o.dur || 2;
    tl.to(path, {strokeDashoffset: 0, duration: dur, ease: 'none'}, at);
    var dot = el('circle', {r: (o.width || 7) * 1.6, fill: '#fff', stroke: col, 'stroke-width': 4}, svg), prog = {p: 0};
    var place = function () { var q = path.getPointAtLength(L * prog.p); dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); };
    place(); tl.to(prog, {p: 1, duration: dur, ease: 'none', onUpdate: place}, at);
    if (o.pins !== false) [P[0], P[P.length - 1]].forEach(function (p, k) {
      var g = el('g', {}, svg); el('path', {d: 'M0 0 C -14 -18 -14 -34 0 -38 C 14 -34 14 -18 0 0 Z', fill: k ? col : '#555', transform: 'translate(' + p[0] + ' ' + p[1] + ') scale(1.6)'}, g);
      tl.fromTo(g, {opacity: 0, y: -30}, {opacity: 1, y: 0, duration: 0.4}, k ? at + dur : at - 0.3);
    });
    return path;
  };

  B.wipe = function (tl, box, at, o) {
    o = o || {}; var w = document.createElement('div'), dur = o.dur || 0.5, dir = o.dir || 'right';
    w.style.cssText = 'position:absolute;inset:0;z-index:50;pointer-events:none;background:' + (o.color || accent());
    box.appendChild(w);
    var from = {right: 'inset(0 100% 0 0)', left: 'inset(0 0 0 100%)', up: 'inset(100% 0 0 0)', down: 'inset(0 0 100% 0)'}[dir];
    var out = {right: 'inset(0 0 0 100%)', left: 'inset(0 100% 0 0)', up: 'inset(0 0 100% 0)', down: 'inset(100% 0 0 0)'}[dir];
    tl.fromTo(w, {clipPath: from}, {clipPath: 'inset(0 0 0 0)', duration: dur, ease: S.EASE}, at);
    tl.to(w, {clipPath: out, duration: dur, ease: S.EASE}, at + dur);
    return w;
  };
})();
