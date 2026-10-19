/* SA03 · "Swiss Kinetic" — tiện ích chung cho mọi cảnh.
 * Nhịp nhạc 122 BPM (SK.BEAT = 0,4918 s). Mọi điểm cắt nằm trên ô nhịp (4 nhịp).
 * Thời gian trong clip t (giây) ↔ giây video: g = start/30 + t − 8/30.
 * Không Math.random / Date / rAF: mọi thứ là hàm của thời gian timeline.
 */
(function () {
  'use strict';
  var S = window.SAMI;
  var K = (window.SK = {});
  K.BEAT = 60 / 122; K.BAR = 4 * K.BEAT;
  K.P = S.h > S.w; // dọc
  K.W = S.w; K.H = S.h;
  K.M = K.P ? 72 : 96; K.COL = K.P ? 136 : 122; K.GUT = 24; K.NC = K.P ? 6 : 12;
  /** x của mép trái cột i (0-based) */
  K.cx = function (i) { return K.M + i * (K.COL + K.GUT); };
  /** bề rộng n cột */
  K.cw = function (n) { return n * K.COL + (n - 1) * K.GUT; };

  K.cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  K.L = function (t, a, b) { return K.cl((t - a) / (b - a)); };
  K.E = function (t, a, b) { return S.EASE(K.L(t, a, b)); };
  K.mix = function (a, b, u) { return a + (b - a) * u; };

  K.start = 0;
  /** khai báo khung bắt đầu của cảnh trong video (project.json → start) */
  K.init = function (startFrame) { K.start = startFrame; return K; };
  K.g = function (t) { return K.start / 30 + t - 8 / 30; };
  /** giây trong clip của nhịp n sau điểm cắt */
  K.b = function (n) { return S.t0 + n * K.BEAT; };

  var $ = (K.$ = function (s) { return document.querySelector(s); });
  var $$ = (K.$$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); });

  /** điền chữ từ copy rồi tách dòng thành khe cắt .ln > .li (gỡ data-copy để không bị điền đè sau DOMContentLoaded) */
  K.bind = function (el) {
    if (typeof el === 'string') el = $(el);
    var key = el.getAttribute('data-copy');
    var html = key ? S.html(key, el.innerHTML) : el.innerHTML;
    if (key) { el.removeAttribute('data-copy'); el.setAttribute('data-k', key); }
    el.innerHTML = html.split(/<br\s*\/?>/i).map(function (l) { return '<span class="ln"><span class="li">' + l + '</span></span>'; }).join('');
    return el;
  };
  K.lines = function (el) { if (typeof el === 'string') el = $(el); return Array.prototype.slice.call(el.querySelectorAll('.li')); };
  /** chữ trồi lên khỏi khe cắt, từng dòng */
  K.reveal = function (tl, el, at, o) {
    o = o || {};
    var li = K.lines(el);
    tl.fromTo(li, {yPercent: 118}, {yPercent: 0, duration: o.dur || 0.62, stagger: o.stagger == null ? 0.11 : o.stagger, ease: S.EASE}, at);
    return at + (li.length - 1) * (o.stagger == null ? 0.11 : o.stagger) + (o.dur || 0.62);
  };
  /** chữ rời đi lên trên qua khe cắt */
  K.hide = function (tl, el, at, o) {
    o = o || {};
    tl.to(K.lines(el), {yPercent: -118, duration: o.dur || 0.42, stagger: o.stagger == null ? 0.05 : o.stagger, ease: S.EASE}, at);
  };

  /** một đồng hồ cho cả cảnh: các hàm vẽ nhận t (giây trong clip) */
  var draws = [];
  K.draw = function (f) { draws.push(f); };
  K.run = function (tl) {
    var c = {t: 0};
    var go = function () { for (var i = 0; i < draws.length; i++) draws[i](c.t); };
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: go}, 0);
    go();
  };

  /** lưới giấy: cột dọc (mép cột) + vài đường ngang. reveal(t) → 0..1 mọc từ (ox, oy) */
  K.grid = function (rows) {
    var g = document.createElement('div'); g.id = 'grid';
    var root = $('[data-composition-id]'); root.insertBefore(g, root.firstChild);
    var xs = [];
    for (var i = 0; i < K.NC; i++) { xs.push(K.cx(i)); xs.push(K.cx(i) + K.COL); }
    xs.forEach(function (x) { var d = document.createElement('i'); d.className = 'gc'; d.style.left = (x - 1) + 'px'; g.appendChild(d); });
    (rows || (K.P ? [220, 1540] : [60, 1020])).forEach(function (y) { var d = document.createElement('i'); d.className = 'gr'; d.style.top = (y - 1) + 'px'; g.appendChild(d); });
    return g;
  };

  /** chú thích góc: tên phim (trái) + bộ đếm nhịp (phải) + dấu đăng ký in ấn */
  K.chrome = function (label) {
    var root = $('[data-composition-id]');
    var y = K.P ? 112 : 40;
    var a = document.createElement('div'); a.className = 'note'; a.id = 'n-l';
    a.style.left = K.M + 'px'; a.style.top = y + 'px';
    a.innerHTML = '<b>SAMI</b> · Tuyên ngôn 03' + (label ? '<br>' + label : '');
    var b = document.createElement('div'); b.className = 'note'; b.id = 'n-r';
    b.style.right = K.M + 'px'; b.style.top = y + 'px'; b.style.textAlign = 'right';
    root.appendChild(a); root.appendChild(b);
    var rg = [[K.M - 52, K.P ? 1830 : 1036], [K.W - K.M + 18, K.P ? 1830 : 1036]];
    if (K.P) rg.forEach(function (p) { var r = document.createElement('div'); r.className = 'reg'; r.style.left = p[0] + 'px'; r.style.top = p[1] + 'px'; r.innerHTML = '<i></i>'; root.appendChild(r); });
    K.draw(function (t) {
      var g = Math.max(0, K.g(t));
      var beat = Math.floor(g / K.BEAT + 1e-6) + 1;
      b.innerHTML = '122 BPM · nhịp <b>' + ('00' + beat).slice(-3) + '</b><br>' + g.toFixed(1).replace('.', ',') + ' s';
    });
    return {l: a, r: b};
  };

  /** nhát dao: đường mực cắt ngang (tuyến tính), rồi khối gập về đường giữa */
  K.knife = function (tl, el, at, o) {
    o = o || {};
    if (typeof el === 'string') el = $(el);
    var k = document.createElement('div'); k.className = 'knife';
    var r = {x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight};
    var root = $('[data-composition-id]'); root.appendChild(k);
    k.style.left = (o.x == null ? r.x - 40 : o.x) + 'px';
    k.style.width = (o.w == null ? r.w + 80 : o.w) + 'px';
    k.style.top = (o.y == null ? r.y + r.h / 2 : o.y) + 'px';
    tl.fromTo(k, {scaleX: 0}, {scaleX: 1, duration: o.cut || 0.28, ease: 'none'}, at);
    tl.to(el, {scaleY: 0, duration: 0.34, ease: S.EASE, transformOrigin: '50% ' + (o.y == null ? '50%' : (o.y - r.y) + 'px')}, at + (o.cut || 0.28));
    tl.to(k, {scaleX: 0, transformOrigin: '100% 50%', duration: 0.3, ease: S.EASE}, at + (o.cut || 0.28) + 0.2);
    return k;
  };

  /** đếm số từ (để kiểm thời gian đọc trong console khi dựng) */
  K.words = function (s) { return String(s).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length; };
})();

/* điện thoại nét mực (S02, S03): ô tìm kiếm + hàng kết quả trừu tượng (không tên quán) */
(function () {
  var K = window.SK;
  K.phoneBox = function () { return K.P ? {x: K.cx(2), y: 940, w: K.cw(4), h: 1120} : {x: K.cx(7), y: 150, w: K.cw(4), h: 1000}; };
  K.phone = function (id) {
    var b = K.phoneBox();
    var p = document.createElement('div'); p.id = id || 'phone'; p.className = 'phone';
    p.style.cssText = 'position:absolute;z-index:4;left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.h + 'px;';
    var rows = '';
    for (var i = 0; i < 4; i++) rows += '<div class="pr"><i class="ph"></i><div class="pt"><i style="width:' + [78, 64, 70, 58][i] + '%"></i><i style="width:' + [44, 52, 38, 47][i] + '%"></i><span class="stars">' + '<b></b><b></b><b></b><b></b><b></b>' + '</span></div></div>';
    p.innerHTML = '<div class="pf"><div class="pbar"><svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="9" fill="none" stroke="#0C0628" stroke-width="3.4"/><path d="M20 20 L28 28" stroke="#0C0628" stroke-width="3.4" stroke-linecap="round"/></svg><span class="pq"></span><i class="caret"></i></div>' + rows + '</div>';
    K.$('[data-composition-id]').appendChild(p);
    return p;
  };
})();

/* 5 khối marketing rời rạc (S03 hỗn loạn → S04 re-flow vào lưới) */
(function () {
  var K = window.SK;
  // [x, y, w, h, xoay°] lúc lệch lưới
  K.MESS = K.P ? [[86, 900, 440, 196, -7], [520, 948, 410, 214, 6], [150, 1118, 490, 196, 4], [640, 1196, 340, 186, -9], [290, 1318, 390, 176, -3]]
               : [[1010, 300, 440, 196, -7], [1440, 340, 400, 214, 6], [1060, 520, 480, 196, 4], [1500, 610, 330, 186, -9], [1180, 740, 380, 176, -3]];
  // vị trí trong lưới (S04): 2 cột × 3 hàng, ô thứ 6 = "Báo cáo"
  K.GRIDPOS = function (i) {
    if (K.P) { var c = i % 2, r = Math.floor(i / 2); return [K.cx(c * 3), 1000 + r * 180, K.cw(3), 160, 0]; }
    var c2 = i % 2, r2 = Math.floor(i / 2); return [K.cx(6 + c2 * 3), 520 + r2 * 160, K.cw(3), 140, 0];
  };
  K.mods = function () {
    var root = K.$('[data-composition-id]'), out = [];
    for (var i = 0; i < 5; i++) {
      var m = document.createElement('div'); m.className = 'mod'; m.id = 'm' + (i + 1);
      m.innerHTML = '<span class="mt">' + window.SAMI.html('S03_m' + (i + 1)) + '</span><span class="eur">€ / tháng</span>';
      root.appendChild(m); out.push(m);
    }
    return out;
  };
  K.placeMod = function (m, r) {
    m.style.left = r[0] + 'px'; m.style.top = r[1] + 'px'; m.style.width = r[2] + 'px'; m.style.height = r[3] + 'px';
    m.style.transform = 'rotate(' + r[4].toFixed(2) + 'deg)';
  };
})();
