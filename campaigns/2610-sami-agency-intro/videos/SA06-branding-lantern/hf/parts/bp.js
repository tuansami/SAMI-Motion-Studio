/* SA06 · bộ dùng chung: thời gian (hàm của t, seek được), màu, con trỏ, cửa sổ công cụ thiết kế không nhãn hiệu, logo Mizuki */
(function () {
  'use strict';
  var S = window.SAMI, EASE = S.EASE, B = (window.BP = {});
  // 16:9: bỏ ngắt dòng cứng của bản dọc trong tiêu đề, để chữ tự cân dòng theo cột trái
  if (S.landscape) document.querySelectorAll('.hd br').forEach(function (b) { b.replaceWith(' '); });
  B.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  B.L = function (t, a, b) { return B.cl((t - a) / (b - a)); };
  B.E = function (t, a, b) { return EASE(B.L(t, a, b)); };
  B.mix = function (a, b, u) { return a + (b - a) * u; };
  /** vào rồi ra: 0 → 1 (a..b) … 1 → 0 (c..d) */
  B.io = function (t, a, b, c, d) { return B.E(t, a, b) * (1 - B.E(t, c, d)); };
  B.wob = function (t, t1, a, f) { if (t < t1) return 0; var d = t - t1; return (a || 0.08) * Math.exp(-d * 7) * Math.sin(d * (f || 28)); };
  B.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  B.typed = function (txt, t, t0, t1) { return txt.slice(0, Math.round(txt.length * B.L(t, t0, t1))); };
  /** nội suy theo khoá [[t, a, b, …], …] với easing giữa các khoá */
  B.keys = function (t, ks) {
    if (t <= ks[0][0]) return ks[0].slice(1);
    for (var i = 1; i < ks.length; i++) if (t < ks[i][0]) {
      var u = B.E(t, ks[i - 1][0], ks[i][0]);
      return ks[i].slice(1).map(function (v, j) { return B.mix(ks[i - 1][j + 1], v, u); });
    }
    return ks[ks.length - 1].slice(1);
  };
  function hx(c) { c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)]; }
  B.lerpC = function (a, b, u) { var x = hx(a), y = hx(b); return 'rgb(' + x.map(function (v, i) { return Math.round(B.mix(v, y[i], B.cl(u))); }).join(',') + ')'; };
  B.$ = function (s) { return document.querySelector(s); };
  B.list = function (key) { return (S.text(key) || '').split('|').map(function (x) { return x.trim(); }); };
  B.tc = function (sec) { sec = Math.floor(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };

  /** từ / dòng hiện theo kiểu "in" ra: nhích lên + bỏ mờ (không lố) */
  B.rise = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.fromTo(targets, {opacity: 0, y: opt.dy == null ? 28 : opt.dy, filter: 'blur(8px)'},
      {opacity: 1, y: 0, filter: 'blur(0px)', duration: opt.dur || 0.55, stagger: opt.stagger == null ? 0.05 : opt.stagger}, at);
  };
  B.fall = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.to(targets, {opacity: 0, y: opt.dy == null ? -20 : opt.dy, filter: 'blur(8px)', duration: opt.dur || 0.4, stagger: opt.stagger || 0}, at);
  };

  var ICONS = {
    move: '<path d="M8 4 L8 26 L13 21 L17 30 L21 28 L17 19 L24 19 Z" fill="#E6E7EE"/>',
    pen: '<path d="M16 4 L24 18 L16 30 L8 18 Z" fill="none" stroke="#E6E7EE" stroke-width="2.4" stroke-linejoin="round"/><circle cx="16" cy="17" r="2.6" fill="#E6E7EE"/>',
    ell: '<circle cx="16" cy="17" r="10" fill="none" stroke="#E6E7EE" stroke-width="2.4"/>',
    rect: '<rect x="6" y="7" width="20" height="20" rx="2" fill="none" stroke="#E6E7EE" stroke-width="2.4"/>',
    text: '<path d="M7 8 H25 M16 8 V28" stroke="#E6E7EE" stroke-width="3" stroke-linecap="round"/>',
    drop: '<path d="M22 5 L27 10 L13 24 L8 25 L9 20 Z" fill="none" stroke="#E6E7EE" stroke-width="2.4" stroke-linejoin="round"/>',
    grid: '<path d="M6 12 H26 M6 20 H26 M12 6 V26 M20 6 V26" stroke="#E6E7EE" stroke-width="2"/>'
  };
  /** cửa sổ công cụ: {cls, file, tool (icon đang chọn), layers [..], on (layer chọn), props (html)} → {el, cv, art, scale, ff, tcEl} */
  B.tool = function (parent, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'tool std ' + (o.cls || '');
    var side = ['move', 'pen', 'ell', 'rect', 'text', 'drop', 'grid'].map(function (k) {
      return '<svg viewBox="0 0 32 32" class="' + (k === o.tool ? 'on' : '') + '" data-ic="' + k + '">' + ICONS[k] + '</svg>';
    }).join('');
    var layers = (o.layers || []).map(function (n, i) { return '<div class="ly' + (i === o.on ? ' on' : '') + '"><i></i>' + n + '</div>'; }).join('');
    el.innerHTML = '<div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="file">' + (o.file || 'Mizuki_Brandkit · Artboard 1') + '</div>' +
      '<div class="zoom">' + (o.zoom || '100%') + '</div><div class="ff"><span class="rec"></span>▶▶ ×16 <span class="tc">00:00:00</span></div></div>' +
      '<div class="side">' + side + '</div><div class="cv"><div class="paper"></div><div class="art"></div></div>' +
      '<div class="panel"><h6>LAYERS</h6>' + layers + '</div>' + (o.props ? '<div class="props">' + o.props + '</div>' : '');
    parent.appendChild(el);
    var cv = el.querySelector('.cv'), art = el.querySelector('.art');
    if (o.props) cv.style.bottom = '62px';
    var sc = Math.min(cv.offsetWidth, cv.offsetHeight) / 800 * (o.fit || 0.96);
    art.style.transform = 'scale(' + sc.toFixed(4) + ')';
    return {el: el, cv: cv, art: art, scale: sc, paper: cv.querySelector('.paper'), ff: el.querySelector('.ff'), tcEl: el.querySelector('.tc'), panel: el.querySelector('.panel'),
      /** đồng hồ tua nhanh ×16: base giây + t × 16 */
      tick: function (t, base) { this.tcEl.textContent = B.tc((base || 0) + t * 16); }};
  };

  /** con trỏ mũi tên trắng viền tối */
  B.cursor = function (parent) {
    var c = document.createElement('div'); c.className = 'cursor';
    c.innerHTML = '<svg viewBox="0 0 40 40" width="40" height="40"><path d="M6 3 L6 33 L13.5 26 L18.5 37 L24 34.5 L19 23.5 L29 23.5 Z" fill="#fff" stroke="#111" stroke-width="2.4" stroke-linejoin="round"/></svg>';
    parent.appendChild(c);
    c.at = function (x, y, press) { c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (press ? 0.86 : 1) + ')'; };
    return c;
  };
  B.selb = function (parent, cls) { var s = document.createElement('div'); s.className = 'selb ' + (cls || ''); s.innerHTML = '<i></i><i></i><i></i><i></i>'; parent.appendChild(s); return s; };
  B.box = function (el, x, y, w, h) { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px'; };

  /** logo Mizuki: <g> chứa path symbol + chữ; trả {g, sym:[path], word:[path], all:[path]} */
  B.logo = function (svg, o) {
    o = o || {};
    var M = window.MZ_LOGO, ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g');
    function mk(arr) {
      return arr.map(function (p) {
        var e = document.createElementNS(ns, 'path'); e.setAttribute('d', p[0]); e.setAttribute('fill-rule', 'evenodd'); e.len = p[1];
        e.setAttribute('stroke-dasharray', p[1] + ' ' + p[1]); g.appendChild(e); return e;
      });
    }
    var sym = mk(M.sym), word = o.noWord ? [] : mk(M.word);
    svg.appendChild(g);
    return {g: g, sym: sym, word: word, all: sym.concat(word),
      /** vẽ nét: u 0..1 (stagger giữa các path) */
      draw: function (paths, u, st) {
        st = st == null ? 0.25 : st;
        paths.forEach(function (p, i) { var k = B.cl((u * (1 + st * (paths.length - 1)) - i * st)); p.setAttribute('stroke-dashoffset', (p.len * (1 - k)).toFixed(1)); });
      }};
  };
})();
