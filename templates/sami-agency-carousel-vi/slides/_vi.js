/* Carousel "SAMI Agency" tiếng Việt: tiện ích chung cho 8 slide (nạp sau _pin.js) → window.V
 *   V.img(key) / V.bindImgs(root)   ô ảnh trong copy ("lib:img/…" = SAMI_Library) → ảnh nền của [data-img="KEY"] hoặc <img>
 *   V.flow()                        đặt câu nhỏ ngay dưới CHỮ LỚN, vùng minh hoạ (#demo) từ dưới câu nhỏ tới y 1160 (gọi trong X.ready)
 *   V.icon(name, {fill, sw})        icon nét 24×24
 *   V.rel(el)                       toạ độ tâm/khung của phần tử trong khung 1080×1350 (gọi trong X.ready)
 * Mọi chuyển động là hàm của t trong X.loop (lặp liền mạch, khung 0 = ảnh bìa hoàn chỉnh).
 */
(function () {
  'use strict';
  var S = window.SAMI, V = (window.V = {});
  // chữ tiếng Việt dựng sẵn (NFC) để tách từng chữ cái không vỡ dấu
  Object.keys(S.copy || {}).forEach(function (k) { if (typeof S.copy[k] === 'string') S.copy[k] = S.copy[k].normalize('NFC'); });
  V.$ = function (q, r) { return (r || document).querySelector(q); };
  V.$$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  V.el = function (tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  V.url = function (v) {
    v = String(v || '').trim(); if (!v) return null;
    if (/^(https?:|data:|public\/|lib\/|slides\/)/.test(v)) return v;
    if (/^lib:/.test(v)) return 'lib/' + v.slice(4);
    return 'public/' + v.replace(/^\/+/, '');
  };
  V.img = function (key) { return V.url(S.copy[key]); };
  V.bindImgs = function (root) {
    V.$$('[data-img]', root).forEach(function (e) {
      var u = V.img(e.getAttribute('data-img')); if (!u) return;
      if (e.tagName === 'IMG') e.src = u; else e.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")';
    });
  };
  V.rel = function (el) {
    var f = V.$('#frame').getBoundingClientRect(), r = el.getBoundingClientRect();
    return {x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2, l: r.left - f.left, t: r.top - f.top, r: r.right - f.left, b: r.bottom - f.top, w: r.width, h: r.height};
  };
  // chữ hoa có dấu chồng (Ễ, Ậ, Ắ…) cao hơn chữ hoa thường → đẩy CHỮ LỚN xuống theo cỡ chữ để dấu không chạm nhãn nhỏ
  var STACK = /[ầấẩẫậằắẳẵặềếểễệồốổỗộ]/i, MARK = /[àáảãạăâèéẻẽẹêìíỉĩịòóỏõọôơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
  V.flow = function (o) {
    o = o || {};
    var big = V.$('#big'), small = V.$('#small'), demo = V.$('#demo'), kick = V.$('#kick');
    var txt = big.textContent, fs = parseFloat(getComputedStyle(big).fontSize) || 200;
    big.style.top = Math.round(V.rel(kick).b + 12 + fs * (STACK.test(txt) ? 0.34 : MARK.test(txt) ? 0.22 : 0.06)) + 'px';
    small.style.top = Math.round(V.rel(big).b + (o.gap || 34)) + 'px';
    var top = Math.round(V.rel(small).b + (o.gap2 || 46)), bottom = o.bottom || 1160;
    if (demo) { demo.style.top = top + 'px'; demo.style.height = Math.max(320, bottom - top) + 'px'; }
    return {top: top, h: bottom - top};
  };
  var P = {
    brand: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    menu: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M8 8h6M8 12h6M8 16h3"/>',
    web: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 6.5h.01M9 6.5h.01"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>',
    bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    ads: '<path d="M3 11l18-8v18L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.6 1-1.1a5.5 5.5 0 0 0 0-7.7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    move: '<path d="M4 3l7 17 2.5-7.5L21 10z"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
    rect: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    drop: '<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    wa: '<path fill="currentColor" stroke="none" transform="scale(.75)" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4c-1.1-1.8-1.7-3.8-1.7-5.9C5.1 10.1 10 5.3 16 5.3S26.9 10.1 26.9 16 22 26.6 16 26.6zm6-7.9c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/>',
    food: '<path d="M7 2v8a2 2 0 0 0 4 0V2M9 10v12M17 2c-2 1-3 3.5-3 6.5V13h3v9"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'
  };
  V.icon = function (name, o) {
    o = o || {};
    return '<svg viewBox="0 0 24 24" fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || 'currentColor') + '" stroke-width="' + (o.sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block">' + (P[name] || '') + '</svg>';
  };
})();
