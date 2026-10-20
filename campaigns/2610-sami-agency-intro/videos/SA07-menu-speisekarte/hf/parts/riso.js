/* SA07 · bộ dùng chung: thời gian (hàm của t, seek được), màu, menu cũ, trang menu Bếp Sen (hư cấu), công cụ thiết kế không nhãn hiệu */
(function () {
  'use strict';
  var S = window.SAMI, EASE = S.EASE, R = (window.RS = {});
  // 16:9: bỏ ngắt dòng cứng của bản dọc trong tiêu đề, để chữ tự cân dòng theo cột trái
  if (S.landscape) document.querySelectorAll('.hd br').forEach(function (b) { b.replaceWith(' '); });
  R.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  R.L = function (t, a, b) { return R.cl((t - a) / (b - a)); };
  R.E = function (t, a, b) { return EASE(R.L(t, a, b)); };
  R.mix = function (a, b, u) { return a + (b - a) * u; };
  R.io = function (t, a, b, c, d) { return R.E(t, a, b) * (1 - R.E(t, c, d)); };
  /** rung tắt dần sau t1 (cú dập) */
  R.wob = function (t, t1, a, f) { if (t < t1) return 0; var d = t - t1; return (a || 0.08) * Math.exp(-d * 7) * Math.sin(d * (f || 28)); };
  R.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  R.keys = function (t, ks) {
    if (t <= ks[0][0]) return ks[0].slice(1);
    for (var i = 1; i < ks.length; i++) if (t < ks[i][0]) {
      var u = R.E(t, ks[i - 1][0], ks[i][0]);
      return ks[i].slice(1).map(function (v, j) { return R.mix(ks[i - 1][j + 1], v, u); });
    }
    return ks[ks.length - 1].slice(1);
  };
  function hx(c) { c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)]; }
  R.lerpC = function (a, b, u) { var x = hx(a), y = hx(b); return 'rgb(' + x.map(function (v, i) { return Math.round(R.mix(v, y[i], R.cl(u))); }).join(',') + ')'; };
  R.$ = function (s) { return document.querySelector(s); };
  R.list = function (key) { return (S.text(key) || '').split('|').map(function (x) { return x.trim(); }); };
  R.tc = function (sec) { sec = Math.floor(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };
  R.rise = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.fromTo(targets, {opacity: 0, y: opt.dy == null ? 28 : opt.dy, filter: 'blur(8px)'},
      {opacity: 1, y: 0, filter: 'blur(0px)', duration: opt.dur || 0.55, stagger: opt.stagger == null ? 0.05 : opt.stagger}, at);
  };
  R.fall = function (tl, targets, at, opt) {
    opt = opt || {};
    return tl.to(targets, {opacity: 0, y: opt.dy == null ? -20 : opt.dy, filter: 'blur(8px)', duration: opt.dur || 0.4, stagger: opt.stagger || 0}, at);
  };
  /** nền: giấy trôi chậm + 2 vệt mực lớn (lớp sâu nhất) */
  R.bg = function (root, o) {
    o = o || {};
    var p = document.createElement('div'); p.className = 'paper'; root.insertBefore(p, root.firstChild);
    var b1 = document.createElement('div'), b2 = document.createElement('div');
    b1.className = b2.className = 'blob';
    b1.style.background = 'radial-gradient(circle, ' + (o.c1 || 'rgba(255,79,154,.16)') + ' 0%, rgba(255,79,154,0) 70%)';
    b2.style.background = 'radial-gradient(circle, ' + (o.c2 || 'rgba(0,163,160,.13)') + ' 0%, rgba(0,163,160,0) 70%)';
    root.insertBefore(b2, p.nextSibling); root.insertBefore(b1, p.nextSibling);
    var g = document.createElement('div'); g.className = 'grain'; root.appendChild(g);
    var v = document.createElement('div'); v.className = 'vig'; root.appendChild(v);
    var seed = o.seed || 0;
    return function (t) {
      var T = t + seed;
      p.style.transform = 'translate(' + (-(T * 7) % 18).toFixed(1) + 'px,' + (-(T * 4) % 18).toFixed(1) + 'px)';
      b1.style.width = b1.style.height = '1300px'; b2.style.width = b2.style.height = '1100px';
      b1.style.left = (S.w * 0.62 - 650 + 90 * Math.sin(T * 0.35)).toFixed(1) + 'px'; b1.style.top = (S.h * 0.2 - 650 + 60 * Math.cos(T * 0.3)).toFixed(1) + 'px';
      b2.style.left = (S.w * 0.2 - 550 + 80 * Math.cos(T * 0.27)).toFixed(1) + 'px'; b2.style.top = (S.h * 0.82 - 550 + 70 * Math.sin(T * 0.33)).toFixed(1) + 'px';
    };
  };

  // ── menu cũ: 80 món, chen chúc, có lỗi chính tả (cố ý) ─────────────────
  var OLD = ['Frülingsrole (4 Stk.)', 'Sommer Rolle mit Garnelen', 'Wan Tan frittiert', 'Krupuk', 'Glasnudelsalat', 'Papaya Salat', 'Hühnersuppe', 'Scharf-Sauer-Suppe',
    'Wan-Tan Suppe', 'Phở Bò', 'Phở Gà', 'Phở Tofu', 'Bún Chả', 'Bún Bò', 'Bún Nem', 'Gebratene Nudel mit Hünchen', 'Gebratene Nudel mit Rind', 'Gebratene Nudel mit Ente',
    'Gebratener Reiß mit Ei', 'Gebratener Reis mit Garnelen', 'Huhn Süß-Sauer', 'Huhn Curry', 'Huhn mit Erdnusssoße', 'Huhn Zitronengras', 'Rind mit Brokoli', 'Rind Curry',
    'Rind Zitronengras', 'Ente knusprig', 'Ente Curry', 'Ente Süß-Sauer', 'Tofu mit Gemüse', 'Tofu Curry', 'Garnelen Knoblauch', 'Garnelen Curry', 'Lachs gebraten',
    'Fisch süß-sauer', 'Gemüse gebraten', 'Reis extra', 'Gebackene Banane', 'Lychee', 'Cola', 'Fanta', 'Sprite', 'Wasser', 'Jasmin Tee', 'Kaffee', 'Bier 0,5l', 'Wein (rot/weiß)'];
  R.oldRows = function (n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var nm = OLD[i % OLD.length] + (i >= OLD.length ? (i % 3 === 0 ? ' groß' : i % 3 === 1 ? ' scharf' : ' spezial') : '');
      var pr = (4 + ((i * 37) % 130) / 10).toFixed(2).replace('.', ',');
      out.push({no: i + 1, nm: nm, pr: pr});
    }
    return out;
  };
  /** html của 1 dòng menu cũ: "12. Phở Gà ........ 12,90 Euro" (giá dính chữ, không căn) */
  R.oldRow = function (r) { return '<div class="row"><span class="n">' + r.no + '. ' + r.nm + (r.no % 4 === 1 ? ' <b>NEU!!</b>' : '') + '</span> ...... <span class="p">' + r.pr + ' Euro</span></div>'; };

  // ── menu mới Bếp Sen (quán hư cấu): 6 nhóm, ký hiệu dị ứng A–N, [V], DE/EN ──
  R.ALLERG = [['A', 'Gluten'], ['B', 'Krebstiere'], ['C', 'Eier'], ['D', 'Fisch'], ['E', 'Erdnüsse'], ['F', 'Soja'], ['G', 'Milch'], ['H', 'Schalenfrüchte'],
    ['I', 'Sellerie'], ['J', 'Senf'], ['K', 'Sesam'], ['L', 'Sulfite'], ['M', 'Lupinen'], ['N', 'Weichtiere']];
  R.MENU = [
    {g: 'Vorspeisen', it: [['Sommerrollen mit Tofu', 'Summer rolls with tofu', 'F', 1, '6,90'], ['Frühlingsrollen', 'Crispy spring rolls', 'A,C', 0, '5,90'], ['Papayasalat', 'Green papaya salad', 'D,E', 0, '7,50']]},
    {g: 'Suppen', it: [['Saure Suppe mit Garnelen', 'Sour soup with prawns', 'B,D', 0, '6,90'], ['Kokos-Zitronengras-Suppe', 'Coconut lemongrass soup', 'F', 1, '5,50']]},
    {g: 'Phở & Nudeln', it: [['Phở Gà', 'Chicken noodle soup', 'A,I', 0, '13,90'], ['Bún Chả Hà Nội', 'Grilled pork, rice noodles', 'A,F', 0, '14,50'], ['Phở Chay', 'Vegan pho', 'A,F', 1, '12,90']]},
    {g: 'Hauptgerichte', it: [['Ente mit Zitronengras', 'Duck with lemongrass', 'F', 0, '16,90'], ['Curry mit Tofu', 'Tofu curry', 'F,H', 1, '13,90'], ['Lachs in Karamellsauce', 'Salmon in caramel sauce', 'D,F', 0, '18,90']]},
    {g: 'Dessert', it: [['Chè Ba Màu', 'Three-colour bean dessert', '', 1, '5,50'], ['Gebackene Banane', 'Fried banana', 'A,G', 0, '5,90']]},
    {g: 'Getränke', it: [['Lotus-Eistee', 'Lotus iced tea', '', 1, '4,50'], ['Vietnamesischer Kaffee', 'Vietnamese coffee', 'G', 0, '4,20']]}
  ];
  /** biểu tượng hoa sen 2 mực (mực A cánh, mực B nước) */
  R.lotus = function () {
    return '<g class="ia" fill="var(--ia)"><path d="M50 14 C60 28 60 46 50 62 C40 46 40 28 50 14 Z"/><path d="M50 62 C34 56 22 42 20 26 C34 30 46 44 50 62 Z" opacity=".85"/>' +
      '<path d="M50 62 C66 56 78 42 80 26 C66 30 54 44 50 62 Z" opacity=".85"/></g>' +
      '<g fill="none" stroke="var(--ib)" stroke-width="4.5" stroke-linecap="round"><path d="M14 74 Q32 64 50 74 T86 74"/><path d="M22 86 Q36 79 50 86 T78 86"/></g>';
  };
  /** tô phở minh hoạ (vẽ code, 2 mực + chấm halftone) */
  R.bowl = function () {
    return '<defs><pattern id="ht" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.1" fill="var(--ia)"/></pattern></defs>' +
      '<g fill="none" stroke="var(--ib)" stroke-width="3.5" stroke-linecap="round"><path d="M44 18 q-8 -10 0 -18 M70 20 q-8 -10 0 -18 M96 18 q-8 -10 0 -18" opacity=".8"/></g>' +
      '<ellipse cx="72" cy="52" rx="66" ry="16" fill="url(#ht)" class="ia"/>' +
      '<g fill="none" stroke="var(--ib)" stroke-width="3" stroke-linecap="round"><path d="M22 50 q14 -8 28 0 t28 0 t28 0"/><path d="M30 57 q12 -6 24 0 t24 0 t24 0"/></g>' +
      '<circle cx="48" cy="46" r="6" fill="var(--ia)" class="ia"/><circle cx="96" cy="48" r="5" fill="var(--ia)" class="ia"/>' +
      '<path d="M6 52 Q10 112 72 116 Q134 112 138 52 Z" fill="var(--ib)"/><path d="M50 116 h44 l-6 10 h-32 Z" fill="var(--ib)"/>' +
      '<path d="M108 4 L132 62" stroke="var(--ia)" stroke-width="5" stroke-linecap="round" class="ia"/><path d="M118 2 L140 58" stroke="var(--ia)" stroke-width="5" stroke-linecap="round" class="ia"/>';
  };
  R.starBadge = function (txt) {
    var pts = [], i; for (i = 0; i < 24; i++) { var a = i * Math.PI / 12, r = i % 2 ? 31 : 38; pts.push((38 + r * Math.cos(a)).toFixed(1) + ',' + (38 + r * Math.sin(a)).toFixed(1)); }
    return '<svg class="star" viewBox="0 0 76 76"><polygon points="' + pts.join(' ') + '" fill="var(--yel)" class="ia"/><text x="38" y="35" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="12" fill="var(--ib)">' + (txt || 'HAUS') + '</text>' +
      '<text x="38" y="49" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="12" fill="var(--ib)">TIPP</text></svg>';
  };
  /** mã QR minh hoạ (mẫu tất định, không mã hoá gì) */
  R.qr = function (col) {
    col = col || 'var(--ib)'; var n = 21, s = '', x, y;
    function fin(ox, oy) { return '<rect x="' + ox + '" y="' + oy + '" width="7" height="7" fill="' + col + '"/><rect x="' + (ox + 1) + '" y="' + (oy + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (ox + 2) + '" y="' + (oy + 2) + '" width="3" height="3" fill="' + col + '"/>'; }
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if (S.rnd(x * 31 + y * 17 + 5) > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + col + '"/>';
    }
    return '<svg viewBox="-1 -1 23 23" shape-rendering="crispEdges"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>' + fin(0, 0) + fin(14, 0) + fin(0, 14) + s + '</svg>';
  };
  /** trang menu: o {hero, al, v, en, legend, qr, dish, dishsub} → {el, groups:[el], items:[el], sups, vs, ens, hero, setInk(a,b)} */
  R.page = function (parent, o) {
    o = o || {};
    var el = document.createElement('div'); el.className = 'pg';
    var dish = o.dish || S.text('S06_dish', 'Phở Sen Spezial'), dsub = o.dishsub || S.text('S06_dishsub', 'Rinderbrühe, 12 Stunden gekocht');
    function grp(G) {
      return '<div class="grp"><div class="gh ia">' + G.g + '</div>' + G.it.map(function (it) {
        return '<div class="it"><b class="nm">' + it[0] + (it[2] ? '<sup>' + it[2] + '</sup>' : '') + (it[3] ? '<i class="v">V</i>' : '') + '</b><em class="en">' + it[1] + '</em><span class="pr">' + it[4] + '</span></div>';
      }).join('') + '</div>';
    }
    var hero = '<div class="hero"><svg viewBox="0 0 144 128">' + R.bowl() + '</svg>' + R.starBadge() +
      '<div class="ht"><b>' + dish + '<sup style="font:600 10px/1 IBM Plex Mono,monospace;color:var(--ia);margin-left:4px">A,I</sup></b><i>' + dsub + '</i><span class="pr">15,90</span></div></div>';
    el.innerHTML = '<div class="hdr"><svg viewBox="0 0 100 100">' + R.lotus() + '</svg><div class="brand">Bếp Sen<small>Speisekarte · Menu · Dresden</small></div></div>' +
      '<div class="col c1">' + R.MENU.slice(0, 3).map(grp).join('') + '</div>' +
      '<div class="col c2">' + (o.hero === false ? '' : hero) + R.MENU.slice(3).map(grp).join('') + '</div>' +
      '<div class="leg">' + R.ALLERG.map(function (a) { return '<b>' + a[0] + '</b> ' + a[1]; }).join(' · ') + ' · <b style="color:var(--teal)">V</b> vegan</div>' +
      '<div class="qr">' + R.qr() + '</div>';
    parent.appendChild(el);
    var q = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };
    if (o.al === false) q('sup').forEach(function (e) { e.style.opacity = 0; });
    if (o.v === false) q('.v').forEach(function (e) { e.style.opacity = 0; });
    if (o.en === false) q('.en').forEach(function (e) { e.style.opacity = 0; });
    if (o.legend === false) q('.leg').forEach(function (e) { e.style.opacity = 0; });
    if (o.qr === false) q('.qr').forEach(function (e) { e.style.opacity = 0; });
    return {el: el, groups: q('.grp'), items: q('.it'), heads: q('.gh'), sups: q('.it sup'), vs: q('.v'), ens: q('.en'), hero: el.querySelector('.hero'), leg: el.querySelector('.leg'), qr: el.querySelector('.qr'),
      hdr: el.querySelector('.hdr'),
      setInk: function (a, b) { el.style.setProperty('--ia', a); el.style.setProperty('--ib', b); el.style.color = b; },
      /** lệch in: lớp mực A dịch (dx, dy) */
      mis: function (dx, dy) { q('.ia').forEach(function (e) { e.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)'; }); },
      place: function (x, y, s, rot) { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.transform = 'scale(' + s + ')' + (rot ? ' rotate(' + rot + 'deg)' : ''); }};
  };

  var ICONS = {
    move: '<path d="M8 4 L8 26 L13 21 L17 30 L21 28 L17 19 L24 19 Z" fill="#1B1B1B"/>',
    text: '<path d="M7 8 H25 M16 8 V28" stroke="#1B1B1B" stroke-width="3.4" stroke-linecap="round"/>',
    rect: '<rect x="6" y="7" width="20" height="20" rx="2" fill="none" stroke="#1B1B1B" stroke-width="2.8"/>',
    grid: '<path d="M6 12 H26 M6 20 H26 M12 6 V26 M20 6 V26" stroke="#1B1B1B" stroke-width="2.4"/>',
    img: '<rect x="5" y="7" width="22" height="18" rx="2" fill="none" stroke="#1B1B1B" stroke-width="2.6"/><path d="M7 23 L14 15 L19 20 L22 17 L26 22" fill="none" stroke="#1B1B1B" stroke-width="2.4"/>',
    drop: '<path d="M16 4 C10 13 7 17 7 21 a9 9 0 0 0 18 0 C25 17 22 13 16 4 Z" fill="none" stroke="#1B1B1B" stroke-width="2.6"/>'
  };
  /** cửa sổ công cụ: {cls, file, tool, props, panel(html)} → {el, cv, ff, tcEl, panel, tick} */
  R.tool = function (parent, o) {
    o = o || {};
    var el = document.createElement('div'); el.className = 'tool std ' + (o.cls || '');
    var side = ['move', 'text', 'rect', 'grid', 'img', 'drop'].map(function (k) { return '<svg viewBox="0 0 32 32" class="' + (k === o.tool ? 'on' : '') + '" data-ic="' + k + '">' + ICONS[k] + '</svg>'; }).join('');
    el.innerHTML = '<div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="file">' + (o.file || 'BepSen_Speisekarte · Seite 1') + '</div>' +
      '<div class="ff">▶▶ ×16 <span class="tc">00:00:00</span></div></div><div class="side">' + side + '</div><div class="cv"></div>' +
      '<div class="panel">' + (o.panel || '') + '</div>' + (o.props ? '<div class="props">' + o.props + '</div>' : '');
    parent.appendChild(el);
    var cv = el.querySelector('.cv');
    if (o.props) cv.style.bottom = '60px';
    return {el: el, cv: cv, ff: el.querySelector('.ff'), tcEl: el.querySelector('.tc'), panel: el.querySelector('.panel'),
      side: function (k) { el.querySelectorAll('.side svg').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-ic') === k); }); },
      tick: function (t, base) { this.tcEl.textContent = R.tc((base || 0) + t * 16); }};
  };
  R.cursor = function (parent) {
    var c = document.createElement('div'); c.className = 'cursor';
    c.innerHTML = '<svg viewBox="0 0 40 40" width="44" height="44"><path d="M6 3 L6 33 L13.5 26 L18.5 37 L24 34.5 L19 23.5 L29 23.5 Z" fill="#fff" stroke="#1B1B1B" stroke-width="2.6" stroke-linejoin="round"/></svg>';
    parent.appendChild(c);
    c.at = function (x, y, press) { c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (press ? 0.86 : 1) + ')'; };
    return c;
  };
  R.selb = function (parent) { var s = document.createElement('div'); s.className = 'selb'; s.innerHTML = '<i></i><i></i><i></i><i></i>'; parent.appendChild(s); return s; };
  R.box = function (el, x, y, w, h) { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px'; };
  /** tem dập: scale 1.6 → 1 + rung, tại t1 */
  R.stampAt = function (el, t, t1, rot) {
    var u = R.E(t, t1, t1 + 0.18);
    el.style.opacity = R.L(t, t1, t1 + 0.06).toFixed(3);
    el.style.transform = 'rotate(' + (rot || 0) + 'deg) scale(' + (1.7 - 0.7 * u + R.wob(t, t1 + 0.18, 0.06, 30)).toFixed(4) + ')';
  };
})();
