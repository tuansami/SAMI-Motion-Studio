/* Brand giả tưởng cho slide Branding + Menu (C03): "Saigon Atelier" — nhà hàng HƯ CẤU (luôn kèm nhãn VÍ DỤ MINH HOẠ).
 * Logo: đèn lồng trong vòng tròn, vẽ bằng nét (để bút Pen vẽ từng đường), thân đèn tô đỏ, nắp tô vàng.
 *   CONCEPT.mark(parent, size) → {svg, lines: [nét để vẽ], fills: [mảng tô], body, caps}
 *   CONCEPT.PAL = bảng màu chốt [đỏ đèn lồng, vàng, ngọc (nền), kem, mực]
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mk = function (tag, a, p) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  var C = (window.CONCEPT = {});
  C.PAL = ['#C8402F', '#C9A227', '#0F3D3E', '#F3E9D8', '#1B1B1B'];
  // nét vẽ (thứ tự = thứ tự bút Pen đi qua)
  C.LINES = [
    'M100 8 A92 92 0 1 1 99.99 8',                                  // vòng ngoài
    'M100 26 V46',                                                   // dây treo
    'M84 54 C52 70 52 128 84 144 L116 144 C148 128 148 70 116 54 Z', // thân đèn
    'M92 54 C76 80 76 118 92 144',                                   // nan trái
    'M100 54 V144',                                                  // nan giữa
    'M108 54 C124 80 124 118 108 144',                               // nan phải
    'M96 154 L93 178 M100 154 V182 M104 154 L107 178'                // tua
  ];
  C.CAPS = ['M83 45 H117 V54 H83 Z', 'M85 144 H115 V153 H85 Z'];
  C.mark = function (parent, size, o) {
    o = o || {};
    var svg = mk('svg', {viewBox: '0 0 200 200', width: size, height: size, style: 'display:block;overflow:visible'}, parent);
    var body = mk('path', {d: C.LINES[2], fill: o.body || C.PAL[0], 'fill-opacity': o.filled === false ? 0 : 1, stroke: 'none'}, svg);
    var caps = C.CAPS.map(function (d) { return mk('path', {d: d, fill: o.color || C.PAL[1], 'fill-opacity': o.filled === false ? 0 : 1}, svg); });
    var lines = C.LINES.map(function (d) { return mk('path', {d: d, fill: 'none', stroke: o.color || C.PAL[1], 'stroke-width': o.sw || 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, svg); });
    return {svg: svg, lines: lines, body: body, caps: caps, fills: [body].concat(caps)};
  };
  /** tô màu cả logo (nét + nắp = màu chính, thân = màu đèn) */
  C.paint = function (m, color, body) {
    m.lines.forEach(function (l) { l.setAttribute('stroke', color); });
    m.caps.forEach(function (c) { c.setAttribute('fill', color); });
    if (body) m.body.setAttribute('fill', body);
  };
})();
