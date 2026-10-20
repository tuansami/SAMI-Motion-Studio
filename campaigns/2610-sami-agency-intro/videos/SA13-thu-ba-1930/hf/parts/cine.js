/* SA13 · bộ dựng chung "Cinematic Night": thời gian, mưa trên kính, bokeh, căn phòng quán Phở Lan vẽ bằng SVG.
   Mọi thứ là hàm thuần của thời gian timeline (không rAF, không random — dùng SAMI.rnd). */
(function () {
  var S = window.SAMI, CN = window.CN = {};
  var NS = 'http://www.w3.org/2000/svg';
  CN.cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  CN.L = function (t, a, b) { return CN.cl((t - a) / (b - a)); };
  CN.E = function (t, a, b) { return S.EASE(CN.L(t, a, b)); };
  CN.mix = function (a, b, k) { return a + (b - a) * k; };
  CN.R = function (i, k) { return S.rnd(i * 7.13 + (k || 0) * 131.7 + 3.1); };
  /** đồng hồ cảnh: draw(t) mỗi khung, seek được */
  CN.clock = function (tl, draw) {
    var c = {t: 0};
    tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: function () { draw(c.t); }}, 0);
    draw(0);
    return c;
  };
  CN.el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  var el = CN.el;

  /** canvas đúng khung (px thật) */
  CN.canvas = function (host, x, y, w, h, cls) {
    var c = document.createElement('canvas');
    c.className = cls || 'rain'; c.width = Math.round(w); c.height = Math.round(h);
    c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.width = w + 'px'; c.style.height = h + 'px';
    host.appendChild(c);
    return c;
  };

  /** mưa trên kính: hạt đọng + giọt trượt có vệt. draw(t, amount 0..1) */
  CN.rainGlass = function (cv, o) {
    o = o || {}; var seed = o.seed || 1, sc = o.scale || 1, ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    var nb = o.beads || Math.round(W * H / 2600), nd = o.drops || Math.round(W / 26);
    var beads = [], drops = [], i;
    for (i = 0; i < nb; i++) beads.push({x: CN.R(i, seed) * W, y: CN.R(i, seed + 1) * H, r: (0.8 + 3.2 * Math.pow(CN.R(i, seed + 2), 3)) * sc, ph: CN.R(i, seed + 3) * 6.28, life: CN.R(i, seed + 4)});
    for (i = 0; i < nd; i++) drops.push({x: CN.R(i, seed + 5) * W, ph: CN.R(i, seed + 6), v: (25 + 150 * Math.pow(CN.R(i, seed + 7), 2)) * sc, r: (2.2 + 3.2 * CN.R(i, seed + 8)) * sc, tr: (25 + 110 * CN.R(i, seed + 9)) * sc, on: CN.R(i, seed + 10)});
    var tint = o.tint || '255,214,160';
    return function (t, amt) {
      amt = amt == null ? 1 : amt;
      ctx.clearRect(0, 0, W, H);
      if (amt <= 0.001) return;
      for (var i = 0; i < beads.length; i++) {
        var b = beads[i]; if (b.life > amt) continue;
        var a = 0.55 + 0.25 * Math.sin(t * 0.7 + b.ph);
        ctx.fillStyle = 'rgba(2,10,12,' + (0.35 * a).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(b.x, b.y + b.r * 0.3, b.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(' + tint + ',' + (0.42 * a).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.82, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * a).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.28, 0, 6.283); ctx.fill();
      }
      for (var j = 0; j < drops.length; j++) {
        var d = drops[j]; if (d.on > amt) continue;
        var span = H + d.tr + 80, y = ((d.ph * span + d.v * t) % span) - d.tr * 0.2;
        var x = d.x + Math.sin(y * 0.018 + j) * 4 * sc;
        var g = ctx.createLinearGradient(0, y - d.tr, 0, y);
        g.addColorStop(0, 'rgba(' + tint + ',0)'); g.addColorStop(1, 'rgba(' + tint + ',0.32)');
        ctx.strokeStyle = g; ctx.lineWidth = d.r * 0.9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - Math.sin((y - d.tr) * 0.018 + j) * 2, y - d.tr); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'rgba(' + tint + ',0.55)'; ctx.beginPath(); ctx.ellipse(x, y, d.r, d.r * 1.25, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x - d.r * 0.35, y - d.r * 0.4, d.r * 0.32, 0, 6.283); ctx.fill();
      }
    };
  };

  /** mưa rơi ngoài trời (vệt xiên). draw(t, amount) */
  CN.rainFall = function (cv, o) {
    o = o || {}; var seed = o.seed || 9, ctx = cv.getContext('2d'), W = cv.width, H = cv.height, n = o.n || Math.round(W * H / 9000), list = [];
    for (var i = 0; i < n; i++) list.push({x: CN.R(i, seed) * (W + 200), ph: CN.R(i, seed + 1), v: 1400 + 900 * CN.R(i, seed + 2), l: 30 + 60 * CN.R(i, seed + 3), a: 0.08 + 0.22 * CN.R(i, seed + 4), on: CN.R(i, seed + 5)});
    var col = o.color || '200,225,225';
    return function (t, amt) {
      amt = amt == null ? 1 : amt; ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; ctx.lineWidth = o.width || 1.6;
      for (var i = 0; i < list.length; i++) {
        var d = list[i]; if (d.on > amt) continue;
        var span = H + d.l, y = (d.ph * span + d.v * t) % span - d.l, x = d.x - y * 0.12;
        ctx.strokeStyle = 'rgba(' + col + ',' + d.a.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d.l * 0.12, y + d.l); ctx.stroke();
      }
    };
  };

  /** bokeh: vòng sáng mờ trôi chậm. draw(t, amount) */
  CN.bokeh = function (host, o) {
    o = o || {}; var n = o.n || 18, seed = o.seed || 4, W = o.w || S.w, H = o.h || S.h, pal = o.pal || ['242,166,90', '255,213,154', '46,110,115', '120,190,190'], list = [];
    var wrap = document.createElement('div'); wrap.className = 'bokeh'; host.appendChild(wrap);
    for (var i = 0; i < n; i++) {
      var r = (o.rmin || 30) + ((o.rmax || 140) - (o.rmin || 30)) * CN.R(i, seed + 1), c = pal[Math.floor(CN.R(i, seed + 2) * pal.length)];
      var e = document.createElement('i');
      e.style.width = e.style.height = (2 * r) + 'px';
      e.style.background = 'radial-gradient(circle, rgba(' + c + ',.55) 0%, rgba(' + c + ',.32) 45%, rgba(' + c + ',.08) 68%, rgba(' + c + ',0) 72%)';
      e.style.filter = 'blur(' + (o.blur == null ? 3 : o.blur) + 'px)';
      wrap.appendChild(e);
      list.push({e: e, r: r, x: (o.x || 0) + CN.R(i, seed + 3) * W, y: (o.y || 0) + CN.R(i, seed + 4) * H, ph: CN.R(i, seed + 5) * 6.28, a: 0.35 + 0.65 * CN.R(i, seed + 6)});
    }
    return function (t, amt) {
      amt = amt == null ? 1 : amt;
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        b.e.style.transform = 'translate(' + (b.x - b.r + Math.sin(t * 0.25 + b.ph) * 26).toFixed(1) + 'px,' + (b.y - b.r + Math.cos(t * 0.2 + b.ph) * 14).toFixed(1) + 'px)';
        b.e.style.opacity = (amt * b.a * (0.75 + 0.25 * Math.sin(t * 0.9 + b.ph * 2))).toFixed(3);
      }
    };
  };

  /** phòng quán Phở Lan (cùng một khung cho S02 và S08).
      host: div absolute inset 0. Trả về {win:{x,y,w,h}, draw(t, st)} với st = {fill(i,j)->0..1, warm 0..1, clock h, lan 0..1, rain 0..1} */
  CN.room = function (host, o) {
    o = o || {};
    var W = S.w, H = S.h, P = S.portrait;
    var wallTop = P ? 0.385 * H : 0.14 * H, wallBot = P ? 0.615 * H : 0.56 * H;
    var R = {};
    // ── lớp sau: trần, tường, cửa sổ, lịch, đồng hồ, bếp, biển
    var back = el('svg', {width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, style: 'position:absolute;left:0;top:0'}, host);
    var defs = el('defs', {}, back);
    defs.innerHTML =
      '<linearGradient id="cnWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E2A2F"/><stop offset="1" stop-color="#173A3D"/></linearGradient>' +
      '<linearGradient id="cnCeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03090B"/><stop offset="1" stop-color="#0A1E22"/></linearGradient>' +
      '<linearGradient id="cnFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1A12"/><stop offset=".5" stop-color="#1B110C"/><stop offset="1" stop-color="#0C0806"/></linearGradient>' +
      '<linearGradient id="cnStreet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06181D"/><stop offset=".7" stop-color="#0D2C31"/><stop offset="1" stop-color="#1D3B3A"/></linearGradient>' +
      '<linearGradient id="cnKitchen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC27A"/><stop offset="1" stop-color="#B7652A"/></linearGradient>' +
      '<radialGradient id="cnGlow"><stop offset="0" stop-color="#FFD59A" stop-opacity=".95"/><stop offset=".25" stop-color="#F2A65A" stop-opacity=".45"/><stop offset="1" stop-color="#F2A65A" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cnPool"><stop offset="0" stop-color="#FFCF8A" stop-opacity=".75"/><stop offset="1" stop-color="#F2A65A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cnCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD59A" stop-opacity=".22"/><stop offset="1" stop-color="#FFD59A" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cnPerson" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A5432"/><stop offset=".18" stop-color="#2A2622"/><stop offset="1" stop-color="#0A1517"/></linearGradient>' +
      '<linearGradient id="cnTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6438"/><stop offset="1" stop-color="#5A3420"/></linearGradient>' +
      '<filter id="cnBlur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>' +
      '<filter id="cnNeon" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    el('rect', {x: 0, y: 0, width: W, height: wallTop, fill: 'url(#cnCeil)'}, back);
    el('rect', {x: 0, y: wallTop, width: W, height: wallBot - wallTop, fill: 'url(#cnWall)'}, back);
    // ván ốp chân tường
    el('rect', {x: 0, y: wallBot - (P ? 120 : 90), width: W, height: P ? 120 : 90, fill: '#0B2024'}, back);
    el('line', {x1: 0, y1: wallBot - (P ? 120 : 90), x2: W, y2: wallBot - (P ? 120 : 90), stroke: '#2E5A5C', 'stroke-width': 3, opacity: .6}, back);
    // sàn gỗ phối cảnh
    el('rect', {x: 0, y: wallBot, width: W, height: H - wallBot, fill: 'url(#cnFloor)'}, back);
    var vx = W / 2, vy = (wallTop + wallBot) / 2, fl = el('g', {stroke: '#3A2416', 'stroke-width': 2, opacity: .7}, back);
    for (var k = -14; k <= 14; k++) { var xb = vx + k * (P ? 70 : 110); var xf = vx + (xb - vx) * (H - vy) / (wallBot - vy); el('line', {x1: xb, y1: wallBot, x2: xf, y2: H}, fl); }
    // cửa sổ (đường phố đêm mưa phía sau)
    var win = P ? {x: 0.06 * W, y: wallTop + 40, w: 0.40 * W, h: wallBot - wallTop - 190} : {x: 0.38 * W, y: wallTop + 50, w: 0.24 * W, h: wallBot - wallTop - 150};
    R.win = win;
    el('rect', {x: win.x - 14, y: win.y - 14, width: win.w + 28, height: win.h + 28, rx: 6, fill: '#08191C', stroke: '#24484A', 'stroke-width': 4}, back);
    el('rect', {x: win.x, y: win.y, width: win.w, height: win.h, fill: 'url(#cnStreet)'}, back);
    var street = el('g', {}, back), cp = el('clipPath', {id: 'cnWinClip'}, defs);
    el('rect', {x: win.x, y: win.y, width: win.w, height: win.h}, cp);
    street.setAttribute('clip-path', 'url(#cnWinClip)');
    // mặt tiền bên kia đường (mờ)
    el('rect', {x: win.x + win.w * 0.08, y: win.y + win.h * 0.32, width: win.w * 0.55, height: win.h * 0.5, fill: '#2A2216', opacity: .7, filter: 'url(#cnBlur8)'}, street);
    el('rect', {x: win.x + win.w * 0.14, y: win.y + win.h * 0.44, width: win.w * 0.4, height: win.h * 0.3, fill: '#F2A65A', opacity: .35, filter: 'url(#cnBlur8)'}, street);
    var wb = [];
    for (var b = 0; b < 9; b++) wb.push(el('circle', {cx: win.x + CN.R(b, 21) * win.w, cy: win.y + win.h * (0.25 + 0.6 * CN.R(b, 22)), r: 10 + 26 * CN.R(b, 23), fill: CN.R(b, 24) > 0.45 ? '#F2A65A' : '#5FA7A8', opacity: .35, filter: 'url(#cnBlur8)'}, street));
    // khung chia kính
    el('line', {x1: win.x + win.w / 2, y1: win.y, x2: win.x + win.w / 2, y2: win.y + win.h, stroke: '#08191C', 'stroke-width': 10}, back);
    el('line', {x1: win.x, y1: win.y + win.h * 0.38, x2: win.x + win.w, y2: win.y + win.h * 0.38, stroke: '#08191C', 'stroke-width': 8}, back);
    // lịch tường
    var cal = P ? {x: 0.50 * W, y: wallTop + 40, w: 0.14 * W, h: 0.095 * H} : {x: 0.645 * W, y: wallTop + 50, w: 0.075 * W, h: 0.2 * H};
    R.cal = cal;
    var calG = el('g', {}, back);
    el('rect', {x: cal.x + 4, y: cal.y + 6, width: cal.w, height: cal.h, fill: '#000', opacity: .35}, calG);
    el('rect', {x: cal.x, y: cal.y, width: cal.w, height: cal.h, fill: '#E9DFC9'}, calG);
    el('rect', {x: cal.x, y: cal.y, width: cal.w, height: cal.h * 0.24, fill: '#A8402E'}, calG);
    R.calTop = el('text', {x: cal.x + cal.w / 2, y: cal.y + cal.h * 0.17, 'text-anchor': 'middle', fill: '#FBEFDC', 'font-family': 'IBM Plex Mono', 'font-weight': 500, 'font-size': cal.w * 0.13, 'letter-spacing': 2}, calG);
    R.calDay = el('text', {x: cal.x + cal.w / 2, y: cal.y + cal.h * 0.72, 'text-anchor': 'middle', fill: '#2A1A12', 'font-family': 'Fraunces', 'font-weight': 400, 'font-size': cal.w * 0.5}, calG);
    R.calSub = el('text', {x: cal.x + cal.w / 2, y: cal.y + cal.h * 0.9, 'text-anchor': 'middle', fill: '#6B5A48', 'font-family': 'IBM Plex Mono', 'font-weight': 500, 'font-size': cal.w * 0.105, 'letter-spacing': 1}, calG);
    R.calFly = el('g', {}, back); // trang xé bay ra (S08)
    R.calG = calG;
    // đồng hồ tường
    var ck = P ? {x: 0.57 * W, y: wallTop + 40 + 0.095 * H + 110, r: 0.06 * W} : {x: 0.682 * W, y: wallTop + 50 + 0.2 * H + 95, r: 0.03 * W};
    R.ck = ck;
    el('circle', {cx: ck.x + 4, cy: ck.y + 6, r: ck.r + 6, fill: '#000', opacity: .35}, back);
    el('circle', {cx: ck.x, cy: ck.y, r: ck.r + 6, fill: '#2B1B12'}, back);
    el('circle', {cx: ck.x, cy: ck.y, r: ck.r, fill: '#EDE3CF'}, back);
    for (var m = 0; m < 12; m++) { var an = m * Math.PI / 6; el('line', {x1: ck.x + Math.sin(an) * ck.r * 0.78, y1: ck.y - Math.cos(an) * ck.r * 0.78, x2: ck.x + Math.sin(an) * ck.r * 0.92, y2: ck.y - Math.cos(an) * ck.r * 0.92, stroke: '#2A1A12', 'stroke-width': m % 3 ? 2 : 4}, back); }
    R.hHand = el('line', {x1: ck.x, y1: ck.y, x2: ck.x, y2: ck.y - ck.r * 0.5, stroke: '#1A100A', 'stroke-width': 5, 'stroke-linecap': 'round'}, back);
    R.mHand = el('line', {x1: ck.x, y1: ck.y, x2: ck.x, y2: ck.y - ck.r * 0.78, stroke: '#1A100A', 'stroke-width': 3.5, 'stroke-linecap': 'round'}, back);
    el('circle', {cx: ck.x, cy: ck.y, r: 5, fill: '#A8402E'}, back);
    // bếp (ô chuyển món) + nồi + hơi nước
    var kt = P ? {x: 0.68 * W, y: wallTop + 150, w: 0.25 * W, h: wallBot - wallTop - 300} : {x: 0.745 * W, y: wallTop + 150, w: 0.2 * W, h: wallBot - wallTop - 260};
    R.kt = kt;
    el('rect', {x: kt.x, y: kt.y, width: kt.w, height: kt.h, fill: 'url(#cnKitchen)', opacity: .9}, back);
    el('rect', {x: kt.x - 20, y: kt.y + kt.h - 8, width: kt.w + 40, height: 22, fill: '#3A2416'}, back);
    var pot = {x: kt.x + kt.w * 0.5, y: kt.y + kt.h - 8, w: kt.w * 0.42};
    el('path', {d: 'M' + (pot.x - pot.w / 2) + ' ' + (pot.y - pot.w * 0.55) + ' h' + pot.w + ' v' + pot.w * 0.5 + ' q0 ' + pot.w * 0.05 + ' -' + pot.w * 0.06 + ' ' + pot.w * 0.05 + ' h-' + pot.w * 0.88 + ' q-' + pot.w * 0.06 + ' 0 -' + pot.w * 0.06 + ' -' + pot.w * 0.05 + 'z', fill: '#2A2522'}, back);
    R.steam = [];
    for (var s = 0; s < 3; s++) R.steam.push(el('path', {fill: 'none', stroke: '#FFF3DE', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .35, filter: 'url(#cnBlur8)'}, back));
    R.pot = pot;
    // biển neon
    R.sign = el('text', {x: kt.x + kt.w / 2, y: kt.y - (P ? 42 : 36), 'text-anchor': 'middle', fill: '#FFD59A', 'font-family': 'Fraunces', 'font-weight': 400, 'font-size': P ? 50 : 50, 'letter-spacing': P ? 3 : 6, filter: 'url(#cnNeon)'}, back);
    R.sign.textContent = o.sign || 'PHỞ LAN';
    // ── lớp mưa trên cửa sổ (canvas, giữa 2 lớp SVG)
    var cv = CN.canvas(host, win.x, win.y, win.w, win.h);
    var rainW = CN.rainGlass(cv, {seed: 3, scale: P ? 0.9 : 0.8});
    // ── lớp trước: đèn thả, bàn, ghế, người
    var front = el('svg', {width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, style: 'position:absolute;left:0;top:0'}, host);
    var rows = P ? 4 : 3, cols = P ? 3 : 4, yFront = P ? 0.885 * H : 0.925 * H, yBack = wallBot + (P ? 60 : 75), gap = P ? 380 : 400, sMax = P ? 1.1 : 1.0;
    R.tables = [];
    var lampLayer = el('g', {}, front);
    for (var r = 0; r < rows; r++) {
      var d = r / (rows - 1), y = yBack + Math.pow(d, 1.15) * (yFront - yBack), sc = (y - vy) / (yFront - vy) * sMax;
      for (var c = 0; c < cols; c++) {
        var x = vx + (c - (cols - 1) / 2) * gap * sc;
        R.tables.push(table(front, lampLayer, x, y, sc, r, c));
      }
    }
    function table(svg, lamps, x, y, s, r, c) {
      var T = {x: x, y: y, s: s, r: r, c: c, ppl: []};
      var g = el('g', {}, svg), top = y - 78 * s;
      // đèn thả
      var shadeY = top - (P ? 300 : 250) * s;
      T.cone = el('path', {d: 'M' + (x - 26 * s) + ' ' + shadeY + ' L' + (x - 130 * s) + ' ' + (top + 4 * s) + ' L' + (x + 130 * s) + ' ' + (top + 4 * s) + ' L' + (x + 26 * s) + ' ' + shadeY + 'Z', fill: 'url(#cnCone)'}, lamps);
      el('line', {x1: x, y1: P ? 0.3 * H : 0, x2: x, y2: shadeY - 30 * s, stroke: '#1C2E30', 'stroke-width': Math.max(1.5, 2.5 * s)}, lamps);
      el('path', {d: 'M' + (x - 10 * s) + ' ' + (shadeY - 30 * s) + ' L' + (x + 10 * s) + ' ' + (shadeY - 30 * s) + ' L' + (x + 36 * s) + ' ' + shadeY + ' L' + (x - 36 * s) + ' ' + shadeY + 'Z', fill: '#1E3638'}, lamps);
      T.glow = el('circle', {cx: x, cy: shadeY + 4 * s, r: 120 * s, fill: 'url(#cnGlow)'}, lamps);
      T.bulb = el('ellipse', {cx: x, cy: shadeY + 1, rx: 26 * s, ry: 6 * s, fill: '#FFE7BF'}, lamps);
      // bóng sàn
      el('ellipse', {cx: x, cy: y + 4 * s, rx: 170 * s, ry: 22 * s, fill: '#000', opacity: .45}, g);
      // ghế sau-trái & sau-phải (người ngồi phía sau bàn)
      var people = el('g', {}, g);
      var chairs = el('g', {stroke: '#3B2416', 'stroke-width': Math.max(2, 7 * s), fill: 'none', 'stroke-linecap': 'round'}, g);
      [[-1], [1]].forEach(function (sd) {
        var cx = x + sd[0] * 112 * s, seat = y - 44 * s;
        el('path', {d: 'M' + (cx - 26 * s) + ' ' + y + ' L' + (cx - 22 * s) + ' ' + seat + ' M' + (cx + 26 * s) + ' ' + y + ' L' + (cx + 22 * s) + ' ' + seat + ' M' + (cx - 30 * s) + ' ' + seat + ' L' + (cx + 30 * s) + ' ' + seat + ' M' + (cx + sd[0] * 28 * s) + ' ' + seat + ' L' + (cx + sd[0] * 36 * s) + ' ' + (seat - 92 * s)}, chairs);
        // người ngồi quay vào bàn (profile)
        var pg = el('g', {opacity: 0}, people), dir = -sd[0], hx = cx + sd[0] * 6 * s, hy = seat - 112 * s;
        el('path', {d: 'M' + (cx + sd[0] * 26 * s) + ' ' + (seat + 2 * s) + ' C' + (cx + sd[0] * 34 * s) + ' ' + (seat - 50 * s) + ' ' + (cx + sd[0] * 28 * s) + ' ' + (seat - 86 * s) + ' ' + (hx + sd[0] * 4 * s) + ' ' + (seat - 88 * s) +
          ' C' + (hx + dir * 24 * s) + ' ' + (seat - 90 * s) + ' ' + (hx + dir * 34 * s) + ' ' + (seat - 64 * s) + ' ' + (hx + dir * 52 * s) + ' ' + (seat - 40 * s) +
          ' L' + (hx + dir * 78 * s) + ' ' + (seat - 36 * s) + ' L' + (hx + dir * 78 * s) + ' ' + (seat - 28 * s) + ' L' + (cx + dir * 14 * s) + ' ' + (seat - 20 * s) + ' L' + (cx + dir * 22 * s) + ' ' + (seat + 2 * s) + 'Z', fill: 'url(#cnPerson)'}, pg);
        el('circle', {cx: hx + dir * 2 * s, cy: hy, r: 20 * s, fill: 'url(#cnPerson)'}, pg);
        T.ppl.push(pg);
      });
      // bàn: chân + mặt
      el('rect', {x: x - 6 * s, y: top, width: 12 * s, height: 78 * s, fill: '#2A1A10'}, g);
      el('ellipse', {cx: x, cy: y - 2 * s, rx: 34 * s, ry: 7 * s, fill: '#2A1A10'}, g);
      el('ellipse', {cx: x, cy: top + 7 * s, rx: 104 * s, ry: 22 * s, fill: '#3B2416'}, g);
      el('ellipse', {cx: x, cy: top, rx: 104 * s, ry: 22 * s, fill: 'url(#cnTop)'}, g);
      T.pool = el('ellipse', {cx: x, cy: top, rx: 80 * s, ry: 15 * s, fill: 'url(#cnPool)'}, g);
      // bát (khi có khách)
      T.bowls = el('g', {opacity: 0}, g);
      [-40, 40].forEach(function (dx) {
        el('ellipse', {cx: x + dx * s, cy: top - 4 * s, rx: 18 * s, ry: 6 * s, fill: '#F1EADC'}, T.bowls);
        el('ellipse', {cx: x + dx * s, cy: top - 6 * s, rx: 14 * s, ry: 3.6 * s, fill: '#C98A4A'}, T.bowls);
      });
      T.g = g;
      return T;
    }
    // chị Lan (đứng, cầm khăn) — cạnh bàn giữa hàng 3 (dọc) / hàng 2 (ngang)
    var lt = R.tables[P ? 2 * cols + 2 : 1 * cols + 3], ls = lt.s * 1.02, lx = lt.x - 150 * ls, ly = lt.y + 6 * ls;
    R.lan = el('g', {}, front);
    el('ellipse', {cx: lx, cy: ly, rx: 60 * ls, ry: 10 * ls, fill: '#000', opacity: .5}, R.lan);
    el('path', {d: 'M' + (lx - 26 * ls) + ' ' + ly + ' L' + (lx - 34 * ls) + ' ' + (ly - 150 * ls) + ' C' + (lx - 40 * ls) + ' ' + (ly - 230 * ls) + ' ' + (lx - 34 * ls) + ' ' + (ly - 268 * ls) + ' ' + (lx - 6 * ls) + ' ' + (ly - 276 * ls) +
      ' L' + (lx + 8 * ls) + ' ' + (ly - 276 * ls) + ' C' + (lx + 34 * ls) + ' ' + (ly - 268 * ls) + ' ' + (lx + 40 * ls) + ' ' + (ly - 236 * ls) + ' ' + (lx + 42 * ls) + ' ' + (ly - 196 * ls) +
      ' L' + (lx + 92 * ls) + ' ' + (ly - 150 * ls) + ' L' + (lx + 86 * ls) + ' ' + (ly - 138 * ls) + ' L' + (lx + 36 * ls) + ' ' + (ly - 166 * ls) + ' L' + (lx + 30 * ls) + ' ' + (ly - 150 * ls) + ' L' + (lx + 24 * ls) + ' ' + ly + 'Z', fill: 'url(#cnPerson)'}, R.lan);
    el('path', {d: 'M' + (lx - 18 * ls) + ' ' + (ly - 210 * ls) + ' L' + (lx + 22 * ls) + ' ' + (ly - 210 * ls) + ' L' + (lx + 28 * ls) + ' ' + (ly - 60 * ls) + ' L' + (lx - 26 * ls) + ' ' + (ly - 60 * ls) + 'Z', fill: '#3C2F27', opacity: .9}, R.lan);
    el('circle', {cx: lx + 2 * ls, cy: ly - 304 * ls, r: 25 * ls, fill: 'url(#cnPerson)'}, R.lan);
    el('circle', {cx: lx - 18 * ls, cy: ly - 318 * ls, r: 13 * ls, fill: '#1A1714'}, R.lan);
    el('rect', {x: lx + 78 * ls, y: ly - 156 * ls, width: 34 * ls, height: 22 * ls, rx: 4 * ls, fill: '#D9CDB6', opacity: .8}, R.lan);

    var steamPath = function (t, ph, x0, y0, hgt) { var dd = ''; for (var i = 0; i <= 14; i++) { var yy = y0 - i * hgt / 14, xx = x0 + Math.sin(i * 0.55 + t * 2.1 + ph) * 12 * (i / 14); dd += (i ? 'L' : 'M') + xx.toFixed(1) + ' ' + yy.toFixed(1); } return dd; };
    R.draw = function (t, st) {
      st = st || {};
      var warm = st.warm == null ? 0.55 : st.warm;
      rainW(t, st.rain == null ? 1 : st.rain);
      for (var i = 0; i < wb.length; i++) wb[i].setAttribute('opacity', (0.25 + 0.15 * Math.sin(t * 0.8 + i)).toFixed(3));
      R.steam.forEach(function (p, i) { p.setAttribute('d', steamPath(t, i * 2.1, R.pot.x - 30 + i * 30, R.pot.y - R.pot.w * 0.6, R.kt.h * 0.75)); p.setAttribute('opacity', (0.28 + 0.1 * Math.sin(t * 1.7 + i)).toFixed(3)); });
      R.tables.forEach(function (T, i) {
        var f0 = st.fill ? st.fill(i, 0) : 0, f1 = st.fill ? st.fill(i, 1) : 0, lit = st.lit ? st.lit(i) : warm;
        T.ppl[0].setAttribute('opacity', f0.toFixed(3)); T.ppl[1].setAttribute('opacity', f1.toFixed(3));
        T.ppl[0].setAttribute('transform', 'translate(0,' + ((1 - f0) * 14 * T.s).toFixed(2) + ')'); T.ppl[1].setAttribute('transform', 'translate(0,' + ((1 - f1) * 14 * T.s).toFixed(2) + ')');
        T.bowls.setAttribute('opacity', Math.max(f0, f1).toFixed(3));
        var fl = 1 + 0.03 * Math.sin(t * 3.1 + i * 1.7);
        T.glow.setAttribute('opacity', (lit * fl).toFixed(3)); T.cone.setAttribute('opacity', (0.4 + 0.9 * lit).toFixed(3));
        T.pool.setAttribute('opacity', (0.25 + 0.75 * lit).toFixed(3)); T.bulb.setAttribute('opacity', (0.4 + 0.6 * lit).toFixed(3));
      });
      var hrs = st.clock == null ? 19.5 : st.clock;
      R.mHand.setAttribute('transform', 'rotate(' + ((hrs % 1) * 360).toFixed(2) + ' ' + ck.x + ' ' + ck.y + ')');
      R.hHand.setAttribute('transform', 'rotate(' + ((hrs % 12) * 30).toFixed(2) + ' ' + ck.x + ' ' + ck.y + ')');
      R.lan.setAttribute('opacity', st.lan == null ? 1 : st.lan);
      R.lan.setAttribute('transform', 'translate(0,' + (Math.sin(t * 1.2) * 1.5).toFixed(2) + ')');
    };
    R.setCal = function (top, day, sub) { R.calTop.textContent = top; R.calDay.textContent = day; R.calSub.textContent = sub; };
    R.setCal('THỨ BA', '20', 'THÁNG 10');
    return R;
  };
})();
