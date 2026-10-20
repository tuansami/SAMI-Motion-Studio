/* SA17 · bộ dựng chung "Darkroom & Light Table": thời gian, bụi trong luồng đèn, hồ sơ Google + danh sách Maps vẽ bằng code.
   Mọi thứ là hàm thuần của thời gian timeline (không rAF, không random — dùng SAMI.rnd). */
(function () {
  var S = window.SAMI, DR = window.DR = {};
  var NS = 'http://www.w3.org/2000/svg';
  DR.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  DR.L = function (t, a, b) { return DR.cl((t - a) / (b - a)); };
  DR.E = function (t, a, b) { return S.EASE(DR.L(t, a, b)); };
  DR.mix = function (a, b, k) { return a + (b - a) * k; };
  DR.R = function (i, k) { return S.rnd(i * 7.13 + (k || 0) * 131.7 + 3.1); };
  /** đồng hồ cảnh: draw(t) mỗi khung, seek được */
  DR.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  DR.el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  DR.div = function (cls, parent, html) {
    var d = document.createElement('div'); if (cls) d.className = cls; if (html != null) d.innerHTML = html; if (parent) parent.appendChild(d); return d;
  };

  /** bụi lơ lửng trong luồng đèn: trả về draw(t) */
  DR.dust = function (host, n, seed) {
    var box = DR.div('dust', host), ps = [];
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i'), s = 2 + 5 * DR.R(i, seed + 1);
      d.style.width = d.style.height = s + 'px'; box.appendChild(d);
      ps.push({e: d, x: DR.R(i, seed + 2), y: DR.R(i, seed + 3), v: 0.006 + 0.014 * DR.R(i, seed + 4), a: 0.2 + 0.7 * DR.R(i, seed + 5), ph: 6.28 * DR.R(i, seed + 6)});
    }
    return function (t) {
      ps.forEach(function (p) {
        var x = (p.x + 0.012 * Math.sin(t * 0.6 + p.ph)) * S.w, y = ((p.y - p.v * t) % 1 + 1) % 1 * S.h;
        p.e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        p.e.style.opacity = (p.a * (0.6 + 0.4 * Math.sin(t * 1.3 + p.ph))).toFixed(3);
      });
    };
  };

  // ── icon (stroke, kiểu giao diện)
  DR.ico = {
    search: '<svg viewBox="0 0 30 30" fill="none" stroke="#5F6368" stroke-width="3" stroke-linecap="round"><circle cx="13" cy="13" r="8"/><path d="M19 19 L26 26"/></svg>',
    call: '<svg viewBox="0 0 30 30" fill="none" stroke="#1A73E8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4 L11 4 L13 10 L10 12 C11.5 15.5 14.5 18.5 18 20 L20 17 L26 19 L26 23 C26 25 24 27 22 26.5 C13 25 5 17 3.5 8 C3 6 5 4 7 4 Z"/></svg>',
    route: '<svg viewBox="0 0 30 30" fill="none" stroke="#1A73E8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3 L27 15 L15 27 L3 15 Z"/><path d="M11 18 L11 14 L18 14 M15.5 11 L18.5 14 L15.5 17"/></svg>',
    table: '<svg viewBox="0 0 30 30" fill="none" stroke="#1A73E8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="22" height="20" rx="3"/><path d="M4 12 L26 12 M10 3 L10 8 M20 3 L20 8 M10 19 L13.5 22 L20 16"/></svg>',
    share: '<svg viewBox="0 0 30 30" fill="none" stroke="#1A73E8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="7" r="3.5"/><circle cx="8" cy="15" r="3.5"/><circle cx="22" cy="23" r="3.5"/><path d="M11 13.5 L19 8.5 M11 16.5 L19 21.5"/></svg>',
    check: '<svg viewBox="0 0 30 30" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15.5 L12.5 21 L23 9.5"/></svg>'
  };

  /** hồ sơ Google của quán hư cấu. state 'old' = ảnh tối, giờ cũ, review chưa trả lời; 'new' = đầy đủ */
  DR.gbp = function (host, state, o) {
    o = o || {};
    var old = state === 'old', name = o.name || 'Hiên Nhà';
    var g = DR.div('gbp', host);
    var img = old ? '<img src="public/img/before.webp" style="filter:brightness(.42) saturate(.55) contrast(.9) blur(1.6px);transform:scale(1.15) rotate(-4deg)">'
                  : '<img src="public/img/after-1.webp" style="object-position:50% 58%">';
    g.innerHTML =
      '<div class="cv">' + img + '<div class="cnt">' + (old ? '3 Fotos · 2019' : '48 Fotos') + '</div></div>' +
      '<div class="bd"><div class="nm">' + name + ' · Nürnberg</div>' +
      '<div class="rt"><span class="st">' + (old ? '★★★<b>★★</b>' : '★★★★★') + '</span><span>Vietnamesisch</span></div>' +
      '<div class="op">' + (old ? '<span class="r">Geschlossen</span> · Öffnet Mo 11:00' : '<span class="g">Geöffnet</span> · schließt um 22:00') + '</div></div>' +
      '<div class="btns">' +
        '<div class="btn b1"><i>' + DR.ico.call + '</i>Anrufen</div>' +
        '<div class="btn b2"><i>' + DR.ico.route + '</i>Route</div>' +
        '<div class="btn b3"><i>' + DR.ico.table + '</i>Reservieren</div>' +
        '<div class="btn b4"><i>' + DR.ico.share + '</i>Teilen</div></div>' +
      '<div class="row r-h"><div class="ic">◷</div><div>' + (old ? 'Mo–So 11:00–22:00<small>Zuletzt aktualisiert 2019</small>' : 'Di–So 11:30–22:00 · Mo Ruhetag<small>Feiertage aktualisiert</small>') + '</div></div>' +
      '<div class="row r-r"><div class="ic">★</div><div>' + (old ? '„Essen kalt, lange gewartet.“<small style="color:#D93025">Keine Antwort vom Inhaber</small>' : '„Sehr freundlich, Sommerrollen top!“<small>Antwort vom Inhaber</small>') + '</div></div>';
    return g;
  };

  /** danh sách kết quả Maps (quán hư cấu ở vị trí idx) */
  DR.mlist = function (host, o) {
    var box = DR.div('mlist', host), items = o.items;
    items.forEach(function (it) {
      DR.div('it', box, '<div><div class="nm">' + it[0] + '</div><div class="ln"><span style="color:#F9AB00">' + it[1] + '</span> · ' + it[2] + '</div><div class="ln">' + it[3] + '</div></div>' +
        '<div class="th">' + (it[4] ? '<img src="' + it[4] + '" style="' + (it[5] || '') + '">' : '<div style="position:absolute;inset:0;background:' + it[6] + '"></div>') + '</div>');
    });
    return box;
  };
})();
