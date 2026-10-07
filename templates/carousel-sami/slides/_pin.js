/* Nhân vật xuyên suốt carousel: chiếc ghim Google Maps.
 * Vào từ trái (slide 2+) hoặc rơi từ trên (slide 1), đáp xuống điểm `land`, nhảy tiếp các điểm `hops`, rời sang phải trước khi hết slide.
 * Ra phải ở slide N và vào từ trái ở slide N+1 cùng độ cao → khi vuốt trông như một chuyển động liền. */
(function () {
  var S = window.SAMI, X = window.CX;
  window.makePin = function (frame) {
    var el = document.createElement('div'); el.id = 'pin';
    el.innerHTML = '<svg viewBox="0 0 96 124"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--k-accent)"/><stop offset="1" style="stop-color:var(--k-accent2)"/></linearGradient></defs>' +
      '<path d="M48 122C48 122 6 70 6 44a42 42 0 0 1 84 0c0 26-42 78-42 78z" fill="url(#pg)"/><circle cx="48" cy="44" r="17" style="fill:var(--k-bg)"/></svg>';
    var sh = document.createElement('div'); sh.id = 'shadow';
    frame.appendChild(sh); frame.appendChild(el);
    return {el: el, shadow: sh};
  };
  /** path for this slide: {land:{t,x,y}, hops:[{t,x,y,h}], exit:t, entry:'left'|'drop'} — x,y = tip of the pin */
  window.pinPath = function (o) {
    var D = S.dur, pts = [];
    var y0 = o.entryY || o.land.y;
    if (o.entry === 'drop') pts.push({t: o.land.t - 0.5, x: o.land.x, y: -200});
    else pts.push({t: 0, x: -120, y: y0}, {t: Math.max(0.2, o.land.t - 0.55), x: o.land.x - 260, y: y0, h: 0});
    pts.push({t: o.land.t, x: o.land.x, y: o.land.y, h: o.entry === 'drop' ? 0 : 140, ease: o.entry === 'drop' ? 'in' : 'linear', land: 0.45});
    (o.hops || []).forEach(function (h) { pts.push({t: h.t, x: h.x, y: h.y, h: h.h || 160, land: 0.3}); });
    if (o.exit != null) { var last = pts[pts.length - 1]; pts.push({t: o.exit, x: last.x, y: last.y}, {t: D - 0.05, x: 1200, y: o.exitY || last.y, h: 220, ease: 'in'}); }
    return X.path(pts);
  };
  /** draw pin + ground shadow at time t (pin element is 96×124, tip at bottom centre) */
  window.drawPin = function (pin, path, t, groundY) {
    var b = path.body(t);
    pin.el.style.transform = 'translate(' + (b.x - 48) + 'px,' + (b.y - 124) + 'px) scale(' + (1 + b.q) + ',' + (1 / (1 + b.q)) + ') rotate(' + X.clamp(b.st * (b.ang > Math.PI / 2 || b.ang < -Math.PI / 2 ? -40 : 40), -14, 14) + 'deg)';
    var air = Math.max(0, (groundY == null ? b.y : groundY) - b.y);
    pin.shadow.style.transform = 'translate(' + b.x + 'px,' + (groundY == null ? b.y : groundY) + 'px) scale(' + X.clamp(1 - air / 600, 0.25, 1) + ')';
    pin.shadow.style.opacity = X.clamp(1 - air / 500, 0, 0.9) * (b.x > -60 && b.x < 1140 ? 1 : 0);
    return b;
  };
  /** BIG word → per-letter spans, fitted to the width; returns letters */
  window.bigWord = function (el, maxW) {
    var txt = el.textContent.trim(); el.innerHTML = '';
    var chars = Array.prototype.map.call(txt, function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; el.appendChild(s); return s; });
    X.fit(el, maxW, 230, 90);
    return chars;
  };
})();
