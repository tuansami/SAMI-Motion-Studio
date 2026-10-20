/* SA18 · Pictogram kit: biểu tượng phẳng, người que có khớp, bộ đếm trống số, phễu feed (canvas), khối màu chuyển cảnh.
 * Mọi thứ là hàm của thời gian timeline (PG.clock) — không rAF, không Math.random. */
(function () {
  const S = window.SAMI;
  const PG = (window.PG = {});
  const cl = (x) => Math.min(1, Math.max(0, x));
  PG.L = (t, a, b) => cl((t - a) / (b - a));
  PG.E = (t, a, b) => S.EASE(PG.L(t, a, b));
  PG.mix = (a, b, k) => a + (b - a) * k;
  PG.T0 = S.t0; // giây trong clip của nhịp cắt vào
  PG.OUT = S.dur - S.t0; // nhịp cắt ra
  /** chạy fn(t) mỗi khung theo thời gian timeline */
  PG.clock = (tl, fn) => { const c = {t: 0}; tl.to(c, {t: S.dur, duration: S.dur, ease: 'none', onUpdate: () => fn(c.t)}, 0); fn(0); };
  PG.$ = (s) => document.querySelector(s);
  PG.$$ = (s) => Array.from(document.querySelectorAll(s));

  // ── biểu tượng (viewBox 0 0 100 100, tô đặc)
  const P = {
    heart: '<path d="M50 90 C20 68 5 52 5 33 A22 22 0 0 1 50 22 A22 22 0 0 1 95 33 C95 52 80 68 50 90Z"/>',
    chair: '<rect x="16" y="2" width="13" height="62" rx="6"/><rect x="16" y="52" width="64" height="13" rx="6"/><rect x="18" y="58" width="11" height="40" rx="5"/><rect x="67" y="58" width="11" height="40" rx="5"/>',
    table: '<rect x="0" y="22" width="100" height="13" rx="6"/><rect x="43" y="30" width="14" height="60" rx="6"/><rect x="24" y="86" width="52" height="12" rx="6"/>',
    eye: '<path d="M2 50 C20 18 80 18 98 50 C80 82 20 82 2 50Z"/><circle cx="50" cy="50" r="19" fill="var(--cut,#0C0628)"/><circle cx="50" cy="50" r="9"/>',
    camera: '<path d="M8 30 h22 l8 -12 h24 l8 12 h22 a6 6 0 0 1 6 6 v46 a6 6 0 0 1 -6 6 h-84 a6 6 0 0 1 -6 -6 v-46 a6 6 0 0 1 6 -6z"/><circle cx="50" cy="57" r="20" fill="var(--cut,#0C0628)"/><circle cx="50" cy="57" r="11"/>',
    play: '<rect x="6" y="6" width="88" height="88" rx="22"/><path d="M40 30 L72 50 L40 70Z" fill="var(--cut,#0C0628)"/>',
    story: '<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="40 9"/><circle cx="50" cy="50" r="30"/>',
    graphic: '<rect x="6" y="40" width="40" height="54" rx="8"/><circle cx="72" cy="28" r="22"/><path d="M52 94 L74 54 L96 94Z"/>',
    pin: '<path d="M50 98 C50 98 12 60 12 36 A38 38 0 0 1 88 36 C88 60 50 98 50 98Z"/><circle cx="50" cy="36" r="14" fill="var(--cut,#0C0628)"/>',
    env: '<rect x="4" y="18" width="92" height="66" rx="10"/><path d="M8 24 L50 56 L92 24" fill="none" stroke="var(--cut,#0C0628)" stroke-width="7" stroke-linejoin="round"/>',
    house: '<path d="M50 6 L96 46 H84 V94 H16 V46 H4Z"/><rect x="40" y="62" width="20" height="32" fill="var(--cut,#0C0628)"/>',
    knife: '<path d="M14 86 L70 30 C80 20 92 18 96 22 C90 40 72 56 30 96Z"/><rect x="2" y="78" width="30" height="14" rx="6" transform="rotate(-45 17 85)"/>',
    basket: '<path d="M4 40 H96 L86 92 H14Z"/><path d="M26 40 L44 10 M74 40 L56 10" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M30 52 V80 M50 52 V80 M70 52 V80" stroke="var(--cut,#0C0628)" stroke-width="6" stroke-linecap="round"/>',
    book: '<path d="M4 16 C24 10 40 12 48 20 V92 C40 84 24 82 4 88Z M96 16 C76 10 60 12 52 20 V92 C60 84 76 82 96 88Z"/>',
    building: '<rect x="12" y="22" width="76" height="76" rx="6"/><path d="M4 26 H96 L88 8 H12Z"/><rect x="40" y="62" width="20" height="36" fill="var(--cut,#0C0628)"/><rect x="22" y="40" width="14" height="14" rx="3" fill="var(--cut,#0C0628)"/><rect x="64" y="40" width="14" height="14" rx="3" fill="var(--cut,#0C0628)"/>',
    fork: '<path d="M30 6 V36 C30 46 38 50 44 50 V96 H56 V50 C62 50 70 46 70 36 V6 H62 V32 H56 V6 H44 V32 H38 V6Z"/>',
    check: '<path d="M10 52 L38 80 L92 20" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>',
    bell: '<path d="M50 6 C30 6 20 22 20 42 V64 L8 80 H92 L80 64 V42 C80 22 70 6 50 6Z"/><circle cx="50" cy="88" r="10"/>',
    tap: '<path d="M38 10 a10 10 0 0 1 20 0 V44 l18 4 a10 10 0 0 1 8 11 l-4 26 a14 14 0 0 1 -14 12 H44 a14 14 0 0 1 -11 -6 L14 74 a8 8 0 0 1 12 -10 l12 10Z"/>',
    gift: '<rect x="6" y="36" width="88" height="22" rx="5"/><rect x="12" y="56" width="76" height="40" rx="5"/><rect x="44" y="36" width="12" height="60" fill="var(--cut,#0C0628)"/><path d="M50 36 C30 36 22 26 28 18 C34 10 46 20 50 36 C54 20 66 10 72 18 C78 26 70 36 50 36Z"/>',
    menu: '<rect x="12" y="4" width="76" height="92" rx="10"/><rect x="26" y="20" width="48" height="8" rx="4" fill="var(--cut,#0C0628)"/><rect x="26" y="40" width="48" height="6" rx="3" fill="var(--cut,#0C0628)"/><rect x="26" y="54" width="36" height="6" rx="3" fill="var(--cut,#0C0628)"/><rect x="26" y="68" width="44" height="6" rx="3" fill="var(--cut,#0C0628)"/>',
    wall: '<rect x="0" y="0" width="100" height="100" rx="8"/><path d="M0 33 H100 M0 66 H100 M33 0 V33 M70 33 V66 M40 66 V100" stroke="var(--cut,#0C0628)" stroke-width="5"/>',
    sofa: '<rect x="2" y="30" width="96" height="40" rx="16"/><rect x="0" y="54" width="100" height="28" rx="12"/><rect x="8" y="80" width="10" height="16" rx="4"/><rect x="82" y="80" width="10" height="16" rx="4"/>',
    pan: '<ellipse cx="40" cy="62" rx="36" ry="12"/><rect x="70" y="56" width="30" height="10" rx="5"/>',
    cal: '<rect x="6" y="14" width="88" height="80" rx="12"/><rect x="24" y="4" width="12" height="20" rx="5"/><rect x="64" y="4" width="12" height="20" rx="5"/><rect x="14" y="34" width="72" height="52" rx="6" fill="var(--cut,#0C0628)"/>',
    dine: '<rect x="24" y="40" width="52" height="9" rx="4"/><rect x="45" y="44" width="10" height="42" rx="4"/><rect x="6" y="24" width="8" height="62" rx="4"/><rect x="6" y="56" width="24" height="8" rx="4"/><rect x="22" y="60" width="7" height="26" rx="3"/><rect x="86" y="24" width="8" height="62" rx="4"/><rect x="70" y="56" width="24" height="8" rx="4"/><rect x="71" y="60" width="7" height="26" rx="3"/>',
    star: '<path d="M50 4 L62 36 L96 38 L70 60 L80 94 L50 74 L20 94 L30 60 L4 38 L38 36Z"/>',
  };
  PG.icon = (name, color, cls, cut) => `<svg viewBox="0 0 100 100" class="pg ${cls || ''}" style="color:${color || 'currentColor'};fill:${color || 'currentColor'};${cut ? '--cut:' + cut : ''}">${P[name]}</svg>`;
  PG.P = P;

  // ── người que: góc tuyệt đối (độ) tính từ hướng thẳng xuống, dương = nghiêng về +x
  const dv = (a) => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
  PG.figSVG = (o) => {
    o = Object.assign({lean: 0, aL: [8, 8], aR: [-8, -8], lL: [3, 3], lR: [-3, -3], color: '#fff', back: 0.72, w: 13}, o);
    const hip = [0, 0], up = dv(o.lean + 180);
    const sh = [hip[0] + up[0] * 40, hip[1] + up[1] * 40];
    const hd = [sh[0] + up[0] * 23, sh[1] + up[1] * 23];
    const limb = (base, ang, l1, l2) => { const a = dv(ang[0]), b = dv(ang[1]); const j = [base[0] + a[0] * l1, base[1] + a[1] * l1]; const e = [j[0] + b[0] * l2, j[1] + b[1] * l2]; return `M${base[0].toFixed(1)} ${base[1].toFixed(1)} L${j[0].toFixed(1)} ${j[1].toFixed(1)} L${e[0].toFixed(1)} ${e[1].toFixed(1)}`; };
    const st = (d, op, w) => `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
    return `<g>${st(limb(sh, o.aL, 20, 19), o.back, o.w)}${st(limb(hip, o.lL, 23, 23), o.back, o.w + 1)}` +
      `${st(`M${hip[0]} ${hip[1]} L${sh[0].toFixed(1)} ${sh[1].toFixed(1)}`, 1, o.w + 7)}` +
      `${st(limb(hip, o.lR, 23, 23), 1, o.w + 1)}${st(limb(sh, o.aR, 20, 19), 1, o.w)}` +
      `<circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="12.5" fill="${o.color}"/>${o.extra || ''}</g>`;
  };
  /** <svg> chứa người que; hông ở (0,0), cao ~ 115 đơn vị. size = chiều cao px */
  PG.fig = (el, o, size) => { el.setAttribute('viewBox', '-60 -80 120 130'); if (size) { el.style.width = size * 120 / 130 + 'px'; el.style.height = size + 'px'; } el.innerHTML = PG.figSVG(o); };
  PG.walk = (ph, extra) => { const s = Math.sin(ph), c = Math.cos(ph);
    return Object.assign({lean: 6, lR: [26 * s, 26 * s - 26 * Math.max(0, -c)], lL: [-26 * s, -26 * s - 26 * Math.max(0, c)], aR: [-24 * s, -24 * s + 26], aL: [24 * s, 24 * s + 26]}, extra || {}); };
  PG.sit = (extra) => Object.assign({lean: -6, lR: [90, 4], lL: [84, 0], aR: [20, 78], aL: [14, 70]}, extra || {});
  PG.phonePose = (extra) => Object.assign({lean: -4, aR: [26, 150], aL: [20, 140]}, extra || {});

  PG.lerpPose = (a, b, k) => { const o = Object.assign({}, b); ['lean'].forEach((x) => { o[x] = PG.mix(a[x] || 0, b[x] || 0, k); }); ['aL', 'aR', 'lL', 'lR'].forEach((x) => { const A = a[x] || [0, 0], B = b[x] || [0, 0]; o[x] = [PG.mix(A[0], B[0], k), PG.mix(A[1], B[1], k)]; }); return o; };
  PG.STAND = {lean: 0, aL: [8, 8], aR: [-8, -8], lL: [3, 3], lR: [-3, -3]};
  /** đặt người que: el là <svg>, (x, y) = vị trí hông trên khung, size = chiều cao px */
  PG.place = (el, x, y, size, pose, flip) => { PG.fig(el, pose, size); const sc = size / 130; el.style.position = 'absolute'; el.style.left = (x - 60 * sc) + 'px'; el.style.top = (y - 80 * sc) + 'px'; el.style.transform = flip ? 'scaleX(-1)' : ''; };
  // ── bộ đếm trống số: n cột, value có thể là số thực (cột thấp nhất trượt mượt), blur theo tốc độ
  PG.odo = (el, n, sep) => {
    el.classList.add('odo'); el.innerHTML = '';
    const cols = [];
    for (let i = n - 1; i >= 0; i--) {
      const c = document.createElement('span'); c.className = 'odc';
      c.innerHTML = '<span class="ods">' + '01234567890'.split('').map((d) => '<i>' + d + '</i>').join('') + '</span>';
      el.appendChild(c); cols.unshift(c.firstChild);
      if (sep && i === 3) { const s = document.createElement('span'); s.className = 'odsep'; s.textContent = '.'; el.appendChild(s); }
    }
    return (v, blurPerCol) => {
      for (let i = 0; i < n; i++) {
        const p = v / Math.pow(10, i);
        let d = p % 10; if (i > 0) { const lowFrac = (v % Math.pow(10, i)) / Math.pow(10, i); const fl = Math.floor(d); d = fl + Math.max(0, (lowFrac - 0.9) * 10); }
        cols[i].style.transform = 'translateY(' + (-d / 11 * 100).toFixed(3) + '%)';
        cols[i].style.filter = blurPerCol ? 'blur(' + (blurPerCol[i] || 0) + 'px)' : 'none';
      }
    };
  };

  // ── khối màu chuyển cảnh: el (đã đặt .wipe) phình từ 0 → phủ khung
  PG.wipe = (el, t, a, b, max) => { const k = PG.E(t, a, b); el.style.transform = 'translate(-50%,-50%) scale(' + (k * (max || 1)).toFixed(4) + ')'; el.style.opacity = k > 0 ? 1 : 0; };

  // ── phễu feed (canvas): dải feed dọc bị uốn thành phễu khi k: 0 → 1
  // o = {cx, top, H, W, k, scroll, cardH, gap, colors[], wall, spout, alpha}
  PG.funnel = (ctx, o) => {
    const k = o.k, p = 1 + 1.6 * k;
    const yOf = (u) => o.top + o.H * (1 - Math.pow(1 - cl(u), p) * (k > 0 ? 1 : 1)) * 1;
    const yLin = (u) => o.top + o.H * u;
    const Y = (u) => PG.mix(yLin(u), yOf(u), k);
    const hw = (u) => o.W / 2 * PG.mix(1, 0.085 + 1.32 * Math.pow(1 - cl(u), 1.55), k);
    const X = (u, a) => o.cx + a * hw(u);
    const region = (u0, u1, a0, a1) => {
      const N = 8; ctx.beginPath();
      for (let i = 0; i <= N; i++) { const u = u0 + (u1 - u0) * i / N; const x = X(u, a0), y = Y(u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      for (let i = N; i >= 0; i--) { const u = u0 + (u1 - u0) * i / N; ctx.lineTo(X(u, a1), Y(u)); }
      ctx.closePath();
    };
    const pitch = o.cardH + o.gap, Hf = o.H;
    ctx.lineJoin = 'round';
    // thẻ feed
    const first = Math.floor(o.scroll / pitch) - 1;
    for (let i = first; i < first + Math.ceil(Hf / pitch) + 3; i++) {
      const y0 = i * pitch - o.scroll, y1 = y0 + o.cardH;
      if (y1 < 0 || y0 > Hf) continue;
      const u0 = cl(y0 / Hf), u1 = cl(y1 / Hf); if (u1 - u0 < 0.002) continue;
      const fade = 1 - PG.L(u0, 0.78, 0.97) * k;
      const col = o.colors[((i % o.colors.length) + o.colors.length) % o.colors.length];
      ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * fade;
      const rr = 20 * (hw((u0 + u1) / 2) / (o.W / 2));
      region(u0, u1, -1, 1); ctx.fillStyle = col.card; ctx.fill(); ctx.lineWidth = rr; ctx.strokeStyle = col.card; ctx.stroke();
      // ảnh món (vùng trên) + chấm tim (dưới trái)
      const uh = u0 + (u1 - u0) * 0.74;
      region(u0 + (u1 - u0) * 0.07, uh, -0.86, 0.86); ctx.fillStyle = col.photo; ctx.fill();
      // đĩa tròn trong ảnh
      const um = u0 + (u1 - u0) * 0.4, rx = hw(um) * 0.34, ry = (Y(uh) - Y(u0)) * 0.26;
      ctx.beginPath(); ctx.ellipse(o.cx, Y(um), Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2); ctx.fillStyle = col.plate; ctx.fill();
      const ub = u0 + (u1 - u0) * 0.87, hx = X(ub, -0.72), hy = Y(ub), hs = Math.max(0.5, (Y(u1) - Y(uh)) * 0.36);
      PG.heartPath(ctx, hx, hy, hs); ctx.fillStyle = col.heart; ctx.fill();
      region(ub - (u1 - u0) * 0.03, ub + (u1 - u0) * 0.03, -0.45, 0.6); ctx.fillStyle = col.line; ctx.fill();
    }
    ctx.globalAlpha = 1;
    // thành phễu
    if (k > 0.001 && o.wall) {
      ctx.globalAlpha = PG.L(k, 0, 0.6);
      ctx.strokeStyle = o.wall; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40; const x = o.cx + s * (hw(u) + 26), y = Y(u) - 10; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } if (o.spout) ctx.lineTo(o.cx + s * (hw(1) + 26), Y(1) + o.spout * PG.L(k, 0.4, 1)); ctx.stroke(); }
      // vành miệng phễu
      const rx = hw(0) + 26; ctx.beginPath(); ctx.ellipse(o.cx, Y(0) - 10, rx, rx * 0.14 * k, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return {Y, hw, neckY: Y(1), neckW: hw(1)};
  };
  PG.heartPath = (ctx, x, y, s) => { // tim tâm (x,y), cỡ s ≈ nửa bề rộng
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.85);
    ctx.bezierCurveTo(x - s * 0.6, y + s * 0.4, x - s * 0.95, y + s * 0.05, x - s * 0.95, y - s * 0.3);
    ctx.arc(x - s * 0.5, y - s * 0.3, s * 0.45, Math.PI, 0); ctx.arc(x + s * 0.4 + s * 0.05, y - s * 0.3, s * 0.45, Math.PI, 0);
    ctx.bezierCurveTo(x + s * 0.95, y + s * 0.05, x + s * 0.6, y + s * 0.4, x, y + s * 0.85); ctx.closePath();
  };
  PG.canvas = (el) => { el.width = S.w; el.height = S.h; return el.getContext('2d'); };
  PG.FEED = [
    {card: '#FFFFFF', photo: '#FFB547', plate: '#FFFFFF', heart: '#FF6B6B', line: '#D6D4EE'},
    {card: '#FFFFFF', photo: '#08DDA4', plate: '#0C0628', heart: '#FF6B6B', line: '#D6D4EE'},
    {card: '#FFFFFF', photo: '#7667FE', plate: '#E3E4F7', heart: '#FF6B6B', line: '#D6D4EE'},
    {card: '#FFFFFF', photo: '#FF8FA3', plate: '#FFFFFF', heart: '#FF6B6B', line: '#D6D4EE'},
  ];

  /** tô vệt bút cho mọi em.hl trong el, quét trong [a, a+d] */
  PG.marker = (tl, el, a, d) => { el.querySelectorAll('em.hl').forEach((m, i) => { tl.fromTo(m, {'--hk': '0%'}, {'--hk': '100%', duration: d || 0.5, ease: S.EASE}, a + i * 0.25); }); };
  /** tiêu đề vào theo từng từ + vệt bút */
  PG.head = (tl, el, a, o) => { o = o || {}; if (S.landscape) el.innerHTML = el.innerHTML.replace(/<br\s*\/?>/g, ' '); const w = S.words(el); S.arrive(tl, w, a, {dist: o.dist || 34, blur: 8, dur: 0.55, stagger: o.stagger || 0.06}); PG.marker(tl, el, a + w.length * (o.stagger || 0.06) + 0.1, 0.5); return w; };
  /** lưới chấm trôi */
  PG.drift = (el, t, vx, vy) => { el.style.transform = 'translate(' + ((t * (vx || 0)) % 60).toFixed(2) + 'px,' + ((t * (vy == null ? 14 : vy)) % 60).toFixed(2) + 'px)'; };
})();
