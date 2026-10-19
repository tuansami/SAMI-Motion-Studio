/* SA05 · bảng đua dùng chung (10 làn, cùng vị trí ở mọi cảnh → match-cut). Mọi thứ là hàm của t (seek được). */
(function () {
  'use strict';
  var S = window.SAMI, EASE = S.EASE, R = (window.LR = {});
  R.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  R.L = function (t, a, b) { return R.cl((t - a) / (b - a)); };
  R.E = function (t, a, b) { return EASE(R.L(t, a, b)); };
  R.mix = function (a, b, u) { return a + (b - a) * u; };
  /** rơi từ trên xuống, chạm đất lúc t1 rồi nảy tắt dần (độ lệch y, px) */
  R.drop = function (t, t0, t1, h) {
    if (t < t1) { var u = R.L(t, t0, t1); return -h * (1 - u * u); }
    var d = t - t1; return -h * 0.07 * Math.exp(-d * 9) * Math.sin(d * 26);
  };
  /** nảy khi bị "đánh": hệ số scale thêm, tắt dần */
  R.wob = function (t, t1, a) { if (t < t1) return 0; var d = t - t1; return (a || 0.08) * Math.exp(-d * 8) * Math.sin(d * 30); };
  /** pop: 0 → 1 trong 0,35 s, vượt nhẹ rồi về (scale), không fade chậm */
  R.pop = function (t, t0) { if (t < t0) return 0; var u = R.E(t, t0, t0 + 0.3); return u + R.wob(t, t0 + 0.12, 0.12); };
  /** đồng hồ cảnh: gọi draw(t) mỗi khung */
  R.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  /** gõ chữ: trả về chuỗi đã gõ tới thời điểm t */
  R.typed = function (txt, t, t0, t1) { var n = Math.round(txt.length * R.L(t, t0, t1)); return txt.slice(0, n); };

  // ── đội đua (Minh họa, tên tưởng tượng) — thứ tự ban đầu, giá trị "điểm hồ sơ" không hiện số
  R.TEAMS = [
    {nm: 'Mekong Haus', v: 100}, {nm: 'Hanoi Gasse', v: 95}, {nm: 'Phở Station 7', v: 90, neu: 1}, {nm: 'Bambus Küche', v: 84},
    {nm: 'Saigon Eck', v: 78}, {nm: 'Reisfeld Kitchen', v: 72}, {nm: 'Lotus Garten', v: 66}, {nm: 'Grüne Papaya', v: 60},
    {nm: 'Lúa Non', v: 52, you: 1}, {nm: 'Indochine Imbiss', v: 45}
  ];
  R.YOU = 8; R.VMAX = 106;
  R.BOOST = [16, 6, 12, 6, 5, 7]; // 52 → 68 → 74 → 86 → 92 → 97 → 104 : hạng 9 → 7 → 6 → 4 → 3 → 2 → 1

  /** hình học bảng theo tỉ lệ (có thể ghi đè) */
  R.geo = function (o) {
    var g = S.landscape ? {x: 1000, y: 118, w: 830, rowH: 72, gap: 13, slotW: 72} : {x: 72, y: 712, w: 936, rowH: 68, gap: 13, slotW: 76};
    o = o || {}; Object.keys(o).forEach(function (k) { g[k] = o[k]; });
    g.step = g.rowH + g.gap; g.barX = g.slotW + 16; g.barW = g.w - g.barX;
    return g;
  };

  var BOWL = '<svg class="bowl" viewBox="0 0 40 40"><path d="M4 18 H36 A16 15 0 0 1 4 18 Z" fill="#FFF4DF" stroke="#0C0628" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 13 q-3 -4 0 -8 M20 13 q-3 -4 0 -8 M26 13 q-3 -4 0 -8" fill="none" stroke="#0C0628" stroke-width="3" stroke-linecap="round"/></svg>';

  /** dựng bảng: trả {el, g, rows, slots, set(vals, t, opt)} */
  R.board = function (parent, o) {
    var g = R.geo(o), el = document.createElement('div');
    el.className = 'board'; el.style.left = g.x + 'px'; el.style.top = g.y + 'px'; el.style.width = g.w + 'px'; el.style.height = (g.step * 10) + 'px';
    var slots = [], rows = [];
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('div'); s.className = 'slot' + (i < 3 ? ' top' : '');
      s.style.top = (i * g.step) + 'px'; s.style.width = g.slotW + 'px'; s.style.height = g.rowH + 'px'; s.textContent = i + 1;
      el.appendChild(s); slots.push(s);
    }
    R.TEAMS.forEach(function (tm, i) {
      var r = document.createElement('div'); r.className = 'row' + (tm.you ? ' you' : '') + (tm.neu ? ' neu' : '');
      r.style.left = g.barX + 'px'; r.style.height = g.rowH + 'px'; r.style.width = g.barW + 'px';
      r.innerHTML = '<div class="bar">' + (tm.you ? BOWL : '') + '<span class="nm">' + tm.nm + '</span>' + (tm.you ? '<div class="spd"></div>' : '') + '</div>' +
        (tm.neu ? '<span class="tagn">NEU</span>' : '');
      el.appendChild(r); rows.push({el: r, bar: r.querySelector('.bar'), spd: r.querySelector('.spd'), tag: r.querySelector('.tagn'), tm: tm, i: i});
    });
    parent.appendChild(el);
    var B = {el: el, g: g, rows: rows, slots: slots};
    /** giá trị hiện tại của mỗi đội tại t (đội khác nhấp nhô rất nhẹ, không đổi chỗ) */
    B.vals = function (t, youV) {
      return R.TEAMS.map(function (tm, i) { return tm.you ? youV : tm.v + 0.45 * Math.sin(t * 1.6 + i * 1.7); });
    };
    /** vị trí liên tục của đội i (0 = đầu bảng): tổng số đội đang hơn, làm mượt quanh lúc vượt */
    B.pos = function (vals, i) {
      var p = 0;
      for (var j = 0; j < vals.length; j++) if (j !== i) { var x = R.cl((vals[j] - vals[i] + 1.4) / 2.8); p += x * x * (3 - 2 * x); }
      return p;
    };
    B.rank = function (vals, i) { var r = 1; for (var j = 0; j < vals.length; j++) if (j !== i && vals[j] > vals[i]) r++; return r; };
    /** đặt mọi làn. opt: {grow: 0..1 (độ dài thanh), drop: fn(i)->dy, dim: fn(i)->0..1, spd: 0..1} */
    B.set = function (vals, opt) {
      opt = opt || {};
      rows.forEach(function (r, i) {
        var p = B.pos(vals, i), y = p * g.step + (opt.drop ? opt.drop(i, p) : 0);
        var gr = opt.growI ? opt.growI(i) : (opt.grow == null ? 1 : opt.grow);
        var w = Math.max(0.0001, gr) * vals[i] / R.VMAX * g.barW;
        r.el.style.visibility = gr > 0.001 ? 'visible' : 'hidden';
        r.el.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
        r.bar.style.width = w.toFixed(1) + 'px';
        if (r.tag) r.tag.style.left = (w - 40).toFixed(0) + 'px';
        var d = opt.dim ? opt.dim(i, p) : 0;
        r.el.style.opacity = (1 - 0.62 * d).toFixed(3);
        r.el.style.filter = d > 0.01 ? 'grayscale(' + d.toFixed(2) + ')' : 'none';
        if (r.tm.you) r.spd.style.opacity = (opt.spd || 0).toFixed(3);
      });
    };
    return B;
  };
})();
(function () {
  var S = window.SAMI, R = window.LR;
  /** telop/khối bật vào kiểu game show: phóng từ nhỏ + nhích lên, không làm mờ */
  R.popIn = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.fromTo(targets, {opacity: 0, scale: opt.from == null ? 0.4 : opt.from, y: opt.dy == null ? 26 : opt.dy},
      {opacity: 1, scale: 1, y: 0, duration: opt.dur || 0.34, stagger: opt.stagger || 0}, at);
  };
  R.popOut = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.to(targets, {opacity: 0, scale: 0.6, duration: opt.dur || 0.25, stagger: opt.stagger || 0}, at);
  };
  /** cuộn hoa văn nền */
  R.scroll = function (el, t, vx, vy, per) { per = per || 181.02; el.style.transform = 'translate(' + ((t * vx) % per).toFixed(1) + 'px,' + ((t * vy) % per).toFixed(1) + 'px)'; };
})();
