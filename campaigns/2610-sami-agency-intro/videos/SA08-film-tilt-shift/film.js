// SA08 · "Một con phố, mười nhà hàng, một quyết định" — timeline, máy quay, cảnh, chữ, sự kiện âm thanh.
// 96 BPM: 1 nhịp = 0,625 s, 1 ô nhịp = 2,5 s. Tua nhanh giật theo nốt móc kép (0,15625 s); camera mượt mọi khung.
import { clamp, lerp, seg, eio, eo, back, hash } from '/core/lib.js';
import { C, L, setLight, setCam, proj, ppm, poly, path, line3, disc, box, quadXform, shade, css, rgb, mix,
  initPost, post, SHOPS, FILL, TREES, LAMPS, YOURS, person, shirt } from './world.js';

export const BEAT = 0.625, BAR = 2.5, Q = BEAT / 4;
export const DUR = 87.5;
const ME = SHOPS[YOURS], NB = SHOPS[YOURS + 1];
let W, H, U, P, logo, sg, MEAS;

// ---------- thời gian thế giới ----------
// wt = "thời gian trình chiếu" của thế giới: 1 khi tua nhanh, 0,3 khi thời gian thực (S4)
const TS0 = 29.4, TS1 = 30.0, RT1 = 37.5;
function wtOf(t) {
  if (t < TS0) return t;
  if (t < TS1) { const u = (t - TS0) / (TS1 - TS0); return TS0 + (TS1 - TS0) * (u - 0.35 * u * u); }
  const a = TS0 + (TS1 - TS0) * 0.65;
  if (t < RT1) return a + 0.3 * (t - TS1);
  return a + 0.3 * (RT1 - TS1) + (t - RT1);
}
const WT_RT1 = wtOf(RT1);
const tOfWt = w => { if (w < TS0) return w; if (w < WT_RT1) return lerp(TS0, RT1, (w - TS0) / (WT_RT1 - TS0)); return RT1 + (w - WT_RT1); };
const realTime = t => t >= TS1 && t < RT1;
const stepT = t => (t >= TS0 && t < RT1) ? t : Math.floor(t / Q) * Q;           // giật hình tua nhanh
export const speedLabel = t => t < TS0 ? '×24' : t < TS1 ? '×24 → ×1' : t < RT1 ? '×1' : t < 62.5 ? '▸▸' : '×24';

// ---------- trạng thái câu chuyện ----------
const PIN_T = i => { const order = [0, 1, 2, 3, 4, 5, 7, 8, 9]; const k = order.indexOf(i); return k < 0 ? 44.4 : BEAT * (k + 1); };
const OFF_T = i => { const order = [0, 9, 1, 8, 2, 3, 7, 4, 5]; const k = order.indexOf(i); return k < 0 ? 999 : 71.25 + k * BEAT; };
const L1 = 37.5, L2 = 43.75, L3 = 50.0, L4 = 56.25, S6 = 62.5, S7 = 70.0, S8 = 77.5;
function glowMe(t) { return t < L1 ? 0.04 : t < L2 ? lerp(.04, .3, seg(t, 42.2, 43)) : t < L3 ? lerp(.3, .55, seg(t, 44.4, 45.2)) : t < L4 ? lerp(.55, .75, seg(t, 50, 51)) : lerp(.75, 1, seg(t, 58, 59)); }
const shopOn = (i, t) => i === YOURS ? glowMe(t) : (t < OFF_T(i) ? 1 : 0);
function occ(i, t) {
  if (i === YOURS) return t < 52 ? 0 : t < S6 ? lerp(0, .45, seg(t, 52, 62)) : lerp(.45, 1, seg(t, 62.5, 68));
  const base = 0.45 + 0.4 * hash(i * 3.7);
  if (t >= S7) return t < OFF_T(i) - 1.2 ? base * 0.8 : 0;
  return t > S6 ? base * 0.75 : base;
}
// sức hút của từng quán với dòng người (theo thời gian phim)
function attract(i, t) {
  if (t >= S7) return i === YOURS ? 2 : 0.05;
  if (i === YOURS) return t < L1 ? 0 : t < L3 ? 0.08 : t < L4 ? 0.5 : t < S6 ? 1.4 : 7;
  return (i === YOURS + 1 ? 1.7 : 1) * (t >= S6 ? 0.5 : 1);
}
function nightOf(t) {
  if (t < TS1) return lerp(0.18, 0.34, t / TS1);
  if (t < RT1) return 0.36;
  if (t < S6) return 0.22 + 0.2 * (0.5 - 0.5 * Math.cos((stepT(t) - RT1) / BAR * Math.PI * 2));   // ngày ↔ đêm theo ô nhịp
  if (t < S7) return lerp(0.42, 0.55, seg(t, S6, S7));
  return 0.86;
}

// ---------- dòng người ----------
const VIS = [];      // khách đi vào quán: {s (wt bắt đầu), x0, dir, v, door, shop, col}
const THRU = [];     // người đi ngang
function buildCrowd() {
  let j = 0;
  for (let w = -12; w < 95; w += 0.2, j++) {
    const t = tOfWt(Math.max(0, w));
    if (t > 76 || (t >= S7 && hash(j * 1.9) < 0.6)) continue;
    const ws = SHOPS.map(s => attract(s.i, t)), tot = ws.reduce((a, b) => a + b, 0);
    let r = hash(j * 7.31 + 0.5) * tot, shop = 0; for (; shop < 9 && r > ws[shop]; shop++) r -= ws[shop];
    const s = SHOPS[shop], dir = hash(j * 2.7) < 0.5 ? 1 : -1;
    VIS.push({ s: w, dir, x0: dir > 0 ? -95 : 95, v: 3.6 + hash(j * 4.1) * 1.4, door: s.x0 + s.w * 0.62, shop, col: shirt(j), lane: 4.7 + hash(j * 9.7) * 1.1, id: j });
  }
  for (let k = 0; k < 70; k++) THRU.push({ x0: hash(k * 3.3) * 200 - 100, dir: hash(k * 1.1) < .5 ? 1 : -1, v: 3.4 + hash(k * 5.9) * 1.6, z: k % 3 === 0 ? 15.2 + hash(k) * 2.2 : 4.6 + hash(k * 8.1) * 1.3, col: shirt(k + 500) });
}
function visPos(p, w) {
  const d = w - p.s; if (d < 0) return null;
  const along = Math.abs(p.door - p.x0), tin = 1.6 + (p.lane - 0.6);
  const walked = d * p.v;
  if (walked < along) return [p.x0 + p.dir * walked * Math.sign(p.door - p.x0) * p.dir, p.lane];
  const u = (walked - along) / tin; if (u > 1) return null;
  return [p.door, lerp(p.lane, 0.5, u)];
}
const wrap = (x, a, b) => a + ((((x - a) % (b - a)) + (b - a)) % (b - a));

// cặp đôi S3 (diễn viên chính, đường đi viết tay)
function couple(t) {
  if (t < 19.5 || t > 28.6) return null;
  const ts = stepT(t);
  if (ts < 27.6) { const x = lerp(-8, NB.x0 + NB.w * 0.55, seg(ts, 19.5, 27.6)); return [[x, 5.0], [x - 0.75, 5.5]]; }
  const u = seg(ts, 27.6, 28.6), x = NB.x0 + NB.w * 0.55; return [[x, lerp(5.0, 0.6, u)], [x - 0.6, lerp(5.5, 1.0, u)]];
}

// người đứng tra điện thoại (S2) + bong bóng tiếng Đức
const ASK = [
  { x: -27, z: 5.4, t0: 10.4, t1: 14.8, text: 'Restaurant in der Nähe', go: 3, col: '#e63946' },
  { x: -15.5, z: 5.1, t0: 11.7, t1: 16.0, text: 'Pho in der Nähe', go: 7, col: '#2a9d8f' },
  { x: -5.5, z: 5.5, t0: 14.9, t1: 19.3, text: 'Sushi in der Nähe', go: 3, col: '#f1c453' },
  { x: 3.5, z: 5.0, t0: 16.0, t1: 20.0, text: 'Tisch für 2, heute', go: 9, col: '#8d5bd1' },
];
function askPos(a, t) {               // đứng yên tới hết bong bóng + 0,6 s, rồi đi (giật) về quán đích
  const ts = stepT(t), leave = a.t1 + 0.6;
  if (ts < leave) return [a.x, a.z];
  const s = SHOPS[a.go], door = s.x0 + s.w * 0.62, d = (ts - leave) * 4.5, along = Math.abs(door - a.x);
  if (d < along) return [a.x + Math.sign(door - a.x) * d, a.z];
  const u = (d - along) / 4.5; return u > 1 ? null : [door, lerp(a.z, 0.5, u)];
}

// ---------- máy quay ----------
const lerpCam = (a, b, u) => ({ t3: [0, 1, 2].map(i => lerp(a.t3[i], b.t3[i], u)), dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), u)), pitch: lerp(a.pitch, b.pitch, u), yaw: lerp(a.yaw, b.yaw, u), fov: lerp(a.fov, b.fov, u), bt: [0, 1, 2].map(i => lerp(a.bt[i], b.bt[i], u)), bw: lerp(a.bw, b.bw, u) });
function shot(t) {
  const p = P;
  const top0 = { t3: p ? [2, 0, -4] : [0, 0, -2], dist: p ? 250 : 140, pitch: 89.4, yaw: p ? 76 : 8, fov: 32, bt: [2, 0, 0], bw: 0.34 };
  const top1 = { ...top0, yaw: p ? 64 : 0 };
  const obl = { t3: p ? [-14, 2, 4] : [-14, 2, 4], dist: p ? 92 : 82, pitch: 46, yaw: p ? 42 : 18, fov: 30, bt: [-14, 1, 4], bw: 0.1 };
  if (t < 6.25) return lerpCam(top0, top1, eio(t / 6.25));
  if (t < 10) return lerpCam(top1, obl, eio(seg(t, 6.25, 10)));
  if (t < 20) { const u = seg(t, 10, 20), x = lerp(-14, 6, u); return { ...obl, t3: [x, 2, 4], bt: [x, 1, 4.8] }; }
  const cpl = t => { const c = couple(Math.min(Math.max(t, 19.6), 28.5)); return c ? c[0] : [NB.cx, 1]; };
  const fol = t => { const c = cpl(Math.min(t, 27.4)); return { t3: [c[0] + 2, 1.5, c[1]], dist: p ? lerp(88, 64, seg(t, 20, 29)) : lerp(78, 58, seg(t, 20, 29)), pitch: 44, yaw: p ? lerp(40, 26, seg(t, 20, 29)) : lerp(18, 12, seg(t, 20, 29)), fov: 30, bt: [c[0], 1, c[1]], bw: 0.075 }; };
  const close = t => ({ t3: p ? [14.6, 0.75, 1.0] : [16.8, 1.1, 1.0], dist: lerp(p ? 15 : 14, p ? 13 : 12.2, seg(t, 30.4, 37.5)), pitch: 9, yaw: -50, fov: p ? 30 : 26, bt: [13.6, 1.5, 1.0], bw: 0.05 });
  if (t < 20) return null;
  if (t < 29.2) { const a = fol(19.99), b = fol(t); return lerpCam(a, b, seg(t, 20, 20.001)); }
  if (t < 30.4) return lerpCam(fol(29.2), close(30.4), eio(seg(t, 29.2, 30.4)));
  if (t < RT1) return close(t);
  if (t < S6) { const u = seg(t, RT1, S6); return { t3: p ? [15, 6.4, 1.5] : [11.5, 5.4, 1.5], dist: lerp(p ? 64 : 44, p ? 56 : 38, u), pitch: 30, yaw: 14, fov: 32, bt: [15, 5, 0.5], bw: 0.15 }; }
  if (t < S7) { const u = eio(seg(t, S6, S7)); return { t3: [lerp(0, 12, u), 1, 4], dist: p ? 118 : 96, pitch: 48, yaw: p ? lerp(50, 40, u) : lerp(22, 14, u), fov: 30, bt: [15, 1, 3], bw: 0.11 }; }
  const u = seg(t, S7, S8); return { t3: [15, 2, 4], dist: lerp(p ? 96 : 84, p ? 74 : 66, u), pitch: 50, yaw: p ? 28 : 12, fov: 30, bt: [15, 1, 3], bw: 0.12 };
}

// ---------- vẽ thế giới ----------
const GROUND = '#59625a';
function drawGround(g, t) {
  const k = 1;
  const q = (x0, x1, z0, z1, col, y = 0) => poly(g, [[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], css(shade(col, [0, 1, 0], k)));
  q(-160, 160, -70, -14, '#8f8a7e');        // sân sau
  q(-160, 160, 0, 6, '#d9d1c2');            // vỉa hè
  q(-160, 160, 6, 14, '#4b4e53');           // đường
  q(-160, 160, 14, 18, '#cfc7b8');          // vỉa hè đối diện
  q(-160, 160, 18, 90, '#6fa24a');          // công viên
  q(-160, 160, 33, 35.5, '#d8c79a', 0.01);  // lối đi công viên
  q(-160, 160, 5.92, 6.08, '#f4f1ea', 0.02); q(-160, 160, 13.92, 14.08, '#f4f1ea', 0.02);
  for (let x = -150; x < 150; x += 6) q(x, x + 3, 9.9, 10.1, '#f2f0ea', 0.02);       // vạch giữa
  for (let k2 = 0; k2 < 7; k2++) q(-3.6, 1.4, 6.6 + k2 * 1.05, 7.1 + k2 * 1.05, '#f5f2ea', 0.02);   // vạch qua đường
  for (let x = -150; x < 150; x += 2) q(x, x + 0.06, 0, 6, '#c6bdad', 0.01);         // khe gạch vỉa hè
  // bóng chân tường (AO)
  const a = proj([0, 0, 0]);
  if (path(g, [[-160, 0.01, 1.4], [160, 0.01, 1.4], [160, 0.01, 0], [-160, 0.01, 0]])) { g.fillStyle = 'rgba(30,30,60,.16)'; g.fill(); }
  // vũng đèn đường ban đêm
  if (L.night > 0.3) {
    g.globalCompositeOperation = 'lighter';
    for (const l of LAMPS) { const c = proj([l.x, 0, l.z]); if (!c) continue; const r = ppm(c[2]) * 6.5; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); gr.addColorStop(0, `rgba(255,190,110,${0.32 * (L.night - 0.3)})`); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(c[0], c[1], r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }
}

function windowsOf(b, t, on, isShop) {
  const fl = b.fl, fh = b.h / fl, out = [];
  for (let f = isShop ? 1 : 0; f < fl; f++) {
    const n = Math.max(2, Math.round(b.w / 2.7));
    for (let k = 0; k < n; k++) {
      const cx = b.x0 + (k + 0.5) * b.w / n, y0 = f * fh + fh * 0.3, y1 = y0 + fh * 0.5;
      const lit = hash(b.x0 * 3.1 + f * 7.7 + k * 1.3) < (0.15 + 0.6 * L.night) * on;
      out.push({ x0: cx - 0.55, x1: cx + 0.55, y0, y1, lit });
    }
  }
  return out;
}
function drawBuilding(g, b, t, isShop) {
  const z0 = b.z0 ?? -14, z1 = b.z1 ?? 0, e = C.eye, rh = b.roof === 'gable' ? 3.4 : 0, zm = (z0 + z1) / 2;
  const on = isShop ? shopOn(b.i, t) : 1;
  box(g, b.x0, b.x1, 0, b.h, z0, z1, b.col, 1, b.roof === 'flat' ? b.rc : b.col);
  if (b.roof === 'gable') {
    const nF = [0, 0.78, 0.62], nB = [0, 0.78, -0.62];
    if (e[2] < zm || e[1] > b.h + rh) poly(g, [[b.x1, b.h, z0], [b.x0, b.h, z0], [b.x0, b.h + rh, zm], [b.x1, b.h + rh, zm]], css(shade(b.rc, nB, 0.95)));
    if (e[0] < b.x0) poly(g, [[b.x0, b.h, z0], [b.x0, b.h, z1], [b.x0, b.h + rh, zm]], css(shade(b.col, [-1, 0, 0], .9)));
    if (e[0] > b.x1) poly(g, [[b.x1, b.h, z1], [b.x1, b.h, z0], [b.x1, b.h + rh, zm]], css(shade(b.col, [1, 0, 0], .9)));
    poly(g, [[b.x0, b.h, z1], [b.x1, b.h, z1], [b.x1, b.h + rh, zm], [b.x0, b.h + rh, zm]], css(shade(b.rc, nF, 1)));
    for (let k = 1; k < 4; k++) { const y = b.h + rh * k / 4, z = lerp(z1, zm, k / 4); line3(g, [b.x0, y, z], [b.x1, y, z], css(shade(b.rc, nF, .8)), 0.08); }
    if (isShop && b.i === YOURS) box(g, b.x0 + 2, b.x0 + 3, b.h, b.h + rh + 1.2, zm - 2.5, zm - 1.5, '#8c7d6e');   // ống khói bếp
  } else {
    box(g, b.x0 + 1.5, b.x0 + 3.3, b.h, b.h + 1.0, z0 + 3, z0 + 5, '#b9b6ae');
    box(g, b.x1 - 4, b.x1 - 2.8, b.h, b.h + 0.7, z0 + 6, z0 + 7.5, '#a8a49c');
  }
  if (e[2] <= z1) return;
  const fz = z1 + 0.02;
  for (const w of windowsOf(b, t, isShop ? (b.i === YOURS ? 1 : on) : 1, isShop)) {
    poly(g, [[w.x0 - 0.12, w.y0 - 0.12, fz], [w.x1 + 0.12, w.y0 - 0.12, fz], [w.x1 + 0.12, w.y1 + 0.12, fz], [w.x0 - 0.12, w.y1 + 0.12, fz]], css(shade(b.col, [0, 0, 1], 0.72)));
    const glass = w.lit ? [255, 205, 130] : shade('#7fa4bd', [0, .5, .86], 1);
    poly(g, [[w.x0, w.y0, fz + .01], [w.x1, w.y0, fz + .01], [w.x1, w.y1, fz + .01], [w.x0, w.y1, fz + .01]], css(glass));
  }
  if (!isShop) return;
  // mặt tiền tầng trệt
  const lit = on, gx0 = b.x0 + 0.6, gx1 = b.x1 - 0.6, door = b.x0 + b.w * 0.62;
  poly(g, [[gx0, 0.2, fz], [gx1, 0.2, fz], [gx1, 2.7, fz], [gx0, 2.7, fz]], css(mix([40, 44, 58], [255, 196, 120], lit * 0.95)));
  if (lit > 0.2) for (let k = 0; k < 3; k++) { const x = gx0 + (k + 0.6) * (gx1 - gx0) / 3.4; poly(g, [[x, 0.2, fz + .01], [x + 0.9, 0.2, fz + .01], [x + 0.9, 1.1, fz + .01], [x, 1.1, fz + .01]], css([150, 92, 52], 0.55 * lit)); }
  for (let x = gx0; x <= gx1 + 0.01; x += (gx1 - gx0) / 4) line3(g, [x, 0.2, fz + .02], [x, 2.7, fz + .02], 'rgba(40,36,40,.85)', 0.07);
  poly(g, [[door - 0.65, 0, fz + .02], [door + 0.65, 0, fz + .02], [door + 0.65, 2.45, fz + .02], [door - 0.65, 2.45, fz + .02]], css(mix([58, 46, 40], [210, 150, 90], lit)));
  // bảng hiệu
  poly(g, [[b.x0 + .3, 2.85, fz + .03], [b.x1 - .3, 2.85, fz + .03], [b.x1 - .3, 3.85, fz + .03], [b.x0 + .3, 3.85, fz + .03]], css(shade(b.i === YOURS ? '#3b2a2e' : '#2b2d36', [0, 0, 1], 1.15)));
  if (quadXform(g, [b.x0 + .3, 3.85, fz + .05], [b.x1 - .3, 3.85, fz + .05], [b.x0 + .3, 2.85, fz + .05], 400, 40)) {
    const sz = Math.abs(g.getTransform().d * 40);
    if (sz > 3) { g.fillStyle = lit > 0.3 ? (b.i === YOURS ? '#ffd6e0' : '#fff6e3') : '#8b8580'; g.font = `700 26px "Be Vietnam Pro"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.name, 200, 21); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // mái bạt
  const awn = b.i === YOURS ? mix(rgb('#9a9496'), rgb(b.awn), clamp(glowMe(t) * 1.4)) : rgb(b.awn);
  const nA = [0, 0.94, 0.33];
  const stripes = 6, ax0 = b.x0 + 0.35, ax1 = b.x1 - 0.35;
  for (let k = 0; k < stripes; k++) {
    const xa = lerp(ax0, ax1, k / stripes), xb = lerp(ax0, ax1, (k + 1) / stripes);
    const c = k % 2 ? mix(awn, [245, 240, 230], 0.75) : awn;
    const sh = shade('#ffffff', nA, 1);
    poly(g, [[xa, 2.8, z1 + .05], [xb, 2.8, z1 + .05], [xb, 2.3, z1 + 1.8], [xa, 2.3, z1 + 1.8]], css(c.map((v, i) => v * sh[i] / 255)));
  }
  poly(g, [[ax0, 2.3, z1 + 1.8], [ax1, 2.3, z1 + 1.8], [ax1, 2.05, z1 + 1.8], [ax0, 2.05, z1 + 1.8]], css(shade('#ffffff', [0, 0, 1], .9).map((v, i) => v * awn[i] / 255)));
}

function drawTerrace(items, s, t) {
  const n = Math.max(2, Math.floor(s.w / 3.3)), o = occ(s.i, stepT(t)), umb = [0, 3, 7, 9].includes(s.i);
  for (let k = 0; k < n; k++) {
    const x = s.x0 + (k + 0.5) * s.w / n, z = 2.9;
    const cz = proj([x, 0, z]); if (!cz) continue;
    items.push({ d: cz[2], pz: z, f: g => {
      for (const [dx, dz, seat] of [[-0.75, -0.2, 0], [0.75, 0.2, 1]]) {
        const busy = hash(s.i * 17.1 + k * 3.3 + seat) < o;
        box(g, x + dx - 0.22, x + dx + 0.22, 0, 0.45, z + dz - 0.22, z + dz + 0.22, '#7a5a3c');
        if (busy) person(g, x + dx, z + dz, shirt(s.i * 10 + k * 2 + seat), { h: 1.32, hair: hash(k + seat * 3 + s.i) > .5 ? '#2b1d14' : '#c9a36a' });
      }
      disc(g, x, 0.76, z, 0.5, css(shade('#f4f1ea', [0, 1, 0], 1)), 10);
      if (o > 0.05 && s.i === YOURS && t > L4) { const c = proj([x, 0.95, z]); if (c) { g.fillStyle = 'rgba(255,200,120,.9)'; g.beginPath(); g.arc(c[0], c[1], Math.max(1.2, ppm(c[2]) * 0.09), 0, 7); g.fill(); } }
      if (umb) { line3(g, [x, 0.7, z], [x, 2.35, z], '#55504a', 0.06); disc(g, x, 2.35, z, 1.35, css(shade(s.awn, [0, 1, 0], 1.05)), 12); }
    } });
  }
}

function drawTree(g, tr) {
  const b = proj([tr.x, 0, tr.z]), c = proj([tr.x, 4.8, tr.z]); if (!b || !c) return;
  const s = ppm(c[2]), r = tr.r * s;
  g.fillStyle = 'rgba(25,40,40,.28)'; g.beginPath(); g.ellipse(b[0] - r * 0.25, b[1] + r * 0.05, r * 0.95, r * 0.45, 0, 0, 7); g.fill();
  line3(g, [tr.x, 0, tr.z], [tr.x, 3.6, tr.z], '#6b4f3a', 0.3);
  const lit = shade('#5f9e3a', [0, 1, 0], 1.25), dark = shade('#2f6a2a', [0, 1, 0], 1);
  const gr = g.createRadialGradient(c[0] - r * 0.35, c[1] - r * 0.4, r * 0.1, c[0], c[1], r);
  gr.addColorStop(0, css(lit)); gr.addColorStop(1, css(dark));
  g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], r, 0, 7); g.fill();
}
function drawCar(g, x, z, dir, col, t) {
  const l = 2.1, w = 0.9;
  box(g, x - l, x + l, 0.25, 1.0, z - w, z + w, col);
  box(g, x - 1.1 + dir * -0.2, x + 1.1 + dir * -0.2, 1.0, 1.55, z - w * 0.85, z + w * 0.85, '#2a3340', 1, '#38404c');
  if (L.night > 0.3) { const hl = proj([x + dir * l, 0.7, z]); if (hl) { g.globalCompositeOperation = 'lighter'; const r = ppm(hl[2]) * 0.9; const gr = g.createRadialGradient(hl[0], hl[1], 0, hl[0], hl[1], r); gr.addColorStop(0, 'rgba(255,240,200,.8)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(hl[0] - r, hl[1] - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over'; } }
}
function drawLamp(g, l) {
  line3(g, [l.x, 0, l.z], [l.x, 4.6, l.z], '#3a3d44', 0.12);
  const c = proj([l.x, 4.6, l.z]); if (!c) return;
  const s = ppm(c[2]); g.fillStyle = L.night > 0.3 ? '#ffe2a8' : '#5a5e66'; g.beginPath(); g.arc(c[0], c[1], Math.max(1, s * 0.22), 0, 7); g.fill();
  if (L.night > 0.3) { g.globalCompositeOperation = 'lighter'; const r = s * 2.2; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); gr.addColorStop(0, `rgba(255,200,120,${0.55 * L.night})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); g.globalCompositeOperation = 'source-over'; }
}

// chủ quán (S4): tượng người mô hình sơn tay, to hơn ~25 %
function drawOwner(g, t) {
  const x = 13.6, z = 1.0, f = proj([x, 0, z]); if (!f) return;
  const s = ppm(f[2]) * 1.25, X = f[0], Y = f[1];
  const sigh = Math.sin(clamp(seg(t, 30.6, 31.8)) * Math.PI) * 0.035;      // thở dài: vai chùng
  const look = eio(seg(t, 31.0, 31.8)) - eio(seg(t, 32.2, 32.7)) * 0.7;      // nhìn sang quán bên, rồi cúi xuống điện thoại
  const raise = eio(seg(t, 32.2, 32.9));                                      // đưa điện thoại lên
  const nod = Math.sin(clamp(seg(t, 34.0, 34.6)) * Math.PI) * 0.03;          // gật đầu: quyết rồi
  const u = (v) => v * s;
  g.save(); g.translate(X, Y);
  g.fillStyle = 'rgba(20,20,40,.35)'; g.beginPath(); g.ellipse(0, 0, u(.42), u(.12), 0, 0, 7); g.fill();
  const leg = (dx) => { g.fillStyle = '#2d3142'; g.beginPath(); g.roundRect(dx - u(.09), -u(.86), u(.18), u(.86), u(.05)); g.fill(); g.fillStyle = '#1b1b22'; g.beginPath(); g.ellipse(dx + u(.04), -u(.02), u(.12), u(.05), 0, 0, 7); g.fill(); };
  leg(-u(.11)); leg(u(.11));
  const sh = -u(1.42 - sigh);                                                 // vai
  const tg = g.createLinearGradient(-u(.25), 0, u(.25), 0); tg.addColorStop(0, '#f3f1ec'); tg.addColorStop(0.6, '#ffffff'); tg.addColorStop(1, '#cfcac2');
  g.fillStyle = tg; g.beginPath(); g.moveTo(-u(.24), sh); g.lineTo(u(.24), sh); g.lineTo(u(.2), -u(.82)); g.lineTo(-u(.2), -u(.82)); g.closePath(); g.fill();
  g.fillStyle = '#2f5d50'; g.beginPath(); g.moveTo(-u(.17), -u(1.18)); g.lineTo(u(.17), -u(1.18)); g.lineTo(u(.21), -u(.62)); g.lineTo(-u(.21), -u(.62)); g.closePath(); g.fill();   // tạp dề
  // tay trái buông, tay phải cầm điện thoại
  g.strokeStyle = '#f0ede6'; g.lineCap = 'round'; g.lineWidth = u(.1);
  g.beginPath(); g.moveTo(-u(.24), sh + u(.06)); g.lineTo(-u(.3), -u(.86)); g.stroke();
  const hx = lerp(u(.28), u(.12), raise), hy = lerp(-u(.86), -u(1.2), raise);
  g.beginPath(); g.moveTo(u(.24), sh + u(.06)); g.quadraticCurveTo(u(.36), lerp(-u(1.05), -u(1.0), raise), hx, hy); g.stroke();
  g.fillStyle = '#d9a77c'; g.beginPath(); g.arc(-u(.3), -u(.84), u(.055), 0, 7); g.arc(hx, hy, u(.055), 0, 7); g.fill();
  if (t > 32.2) { g.fillStyle = '#222'; g.beginPath(); g.roundRect(hx - u(.05), hy - u(.15), u(.1), u(.17), u(.02)); g.fill(); g.fillStyle = `rgba(150,220,255,${raise})`; g.fillRect(hx - u(.04), hy - u(.14), u(.08), u(.14)); }
  // đầu
  const hdx = u(.05) * look, hdy = sh - u(.2) + u(nod * 3) - u(.06) * raise;
  g.fillStyle = '#e2b38b'; g.beginPath(); g.ellipse(hdx, hdy, u(.14), u(.165), 0, 0, 7); g.fill();
  g.fillStyle = '#1f1612'; g.beginPath(); g.ellipse(hdx - u(.03) * look, hdy - u(.07), u(.15), u(.11), 0, Math.PI, Math.PI * 2); g.fill();
    if (raise > 0.5) { g.fillStyle = 'rgba(160,220,255,.25)'; g.beginPath(); g.ellipse(hdx + u(.04), hdy + u(.04), u(.12), u(.12), 0, 0, 7); g.fill(); }
  g.restore();
  return { x: X, y: Y - s * 1.75, hand: [X + lerp(s * .28, s * .12, raise), Y + lerp(-s * .86, -s * 1.2, raise)], s };
}

// lớp 1: màn hình website dựng trên mặt tiền
function drawWebsite(g, t) {
  if (t < L1 + 0.5) return;
  const x0 = ME.x0 + 0.9, x1 = ME.x1 - 0.9, y0 = 4.5, y1 = 10.6, z = 0.12, cols = 4, rows = 3;
  const tiles = Math.floor((stepT(t) - 38.1) / (Q * 2)) + 1, lit = seg(t, 42.2, 42.6);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (r * cols + c >= tiles) continue;
    const a = [lerp(x0, x1, c / cols), lerp(y1, y0, r / rows)], b = [lerp(x0, x1, (c + 1) / cols), lerp(y1, y0, (r + 1) / rows)];
    poly(g, [[a[0] + .03, b[1] + .03, z], [b[0] - .03, b[1] + .03, z], [b[0] - .03, a[1] - .03, z], [a[0] + .03, a[1] - .03, z]], css(mix([34, 36, 48], [30, 32, 44], 0)));
  }
  line3(g, [x0, y0 - .3, z], [x1, y0 - .3, z], '#3b3d46', 0.12);
  if (lit <= 0) return;
  if (!quadXform(g, [x0, y1, z + .02], [x1, y1, z + .02], [x0, y0, z + .02], 820, 600)) return;
  g.globalAlpha = lit;
  g.fillStyle = '#fbf6ee'; g.fillRect(0, 0, 820, 600);
  g.fillStyle = '#3b2a2e'; g.fillRect(0, 0, 820, 78);
  g.fillStyle = '#ffd6e0'; g.font = '700 40px "Be Vietnam Pro"'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('Bếp Sen', 30, 40);
  g.font = '600 24px "Be Vietnam Pro"'; g.fillStyle = '#f3e9e0'; g.textAlign = 'right'; g.fillText('Speisekarte   Gutschein   DE | EN', 790, 40);
  const hero = g.createLinearGradient(0, 78, 0, 380); hero.addColorStop(0, '#e9b48f'); hero.addColorStop(1, '#a95b44'); g.fillStyle = hero; g.fillRect(0, 78, 820, 300);
  g.fillStyle = '#fff6ee'; g.beginPath(); g.ellipse(560, 250, 150, 70, 0, 0, 7); g.fill();
  g.fillStyle = '#d98b4e'; g.beginPath(); g.ellipse(560, 238, 128, 50, 0, 0, 7); g.fill();
  g.fillStyle = '#5c9a4a'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(500 + k * 20, 225 + (k % 2) * 12, 9, 0, 7); g.fill(); }
  g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '800 46px "Be Vietnam Pro"'; g.fillText('Vietnamesische', 34, 180); g.fillText('Küche', 34, 232);
  g.fillStyle = '#c9506f'; g.beginPath(); g.roundRect(34, 280, 300, 66, 33); g.fill();
  g.fillStyle = '#fff'; g.font = '700 28px "Be Vietnam Pro"'; g.fillText('Jetzt reservieren', 58, 314);
  g.fillStyle = '#3b2a2e'; g.font = '700 28px "Be Vietnam Pro"'; g.fillText('Speisekarte', 34, 420);
  const dishes = [['Phở Bò', 'A, C'], ['Bánh Xèo', 'C, F'], ['Gỏi Cuốn [V]', 'F']];
  dishes.forEach(([n, a], k) => { g.fillStyle = '#efe4d6'; g.beginPath(); g.roundRect(34 + k * 258, 450, 240, 120, 14); g.fill(); g.fillStyle = '#3b2a2e'; g.font = '700 26px "Be Vietnam Pro"'; g.fillText(n, 52 + k * 258, 492); g.fillStyle = '#8a6b5a'; g.font = '500 20px "IBM Plex Mono"'; g.fillText('Allergene: ' + a, 52 + k * 258, 535); });
  g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
  if (L.night > 0.2) { const c = proj([ME.cx, 7.5, 1]); if (c) { g.globalCompositeOperation = 'lighter'; const r = ppm(c[2]) * 7; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); gr.addColorStop(0, `rgba(255,220,200,${0.2 * lit})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); g.globalCompositeOperation = 'source-over'; } }
}
// thợ tí hon trên xe nâng (lớp 1)
function workers(items, t) {
  if (t < L1 || t > L2 - 0.6) return;
  const ts = stepT(t), lift = clamp(seg(ts, 37.6, 38.3)) * 4.0 - clamp(seg(ts, 42.6, 43.1)) * 4.0;
  const x = ME.x0 + 2 + ((Math.floor(ts / Q) % 6) / 6) * (ME.w - 4);
  const c = proj([x, 0, 1.6]); if (!c) return;
  items.push({ d: c[2] - 0.5, f: g => {
    box(g, x - 1.6, x + 1.6, 0, 0.5, 1.0, 2.4, '#f2b632');
    line3(g, [x - 1, 0.5, 1.7], [x - 1, 0.5 + lift, 1.7], '#555', 0.12); line3(g, [x + 1, 0.5, 1.7], [x + 1, 0.5 + lift, 1.7], '#555', 0.12);
    box(g, x - 1.4, x + 1.4, 0.5 + lift, 0.75 + lift, 1.0, 2.3, '#e9a020');
    for (let k = 0; k < 2; k++) person(g, x - 0.6 + k * 1.2, 1.6, '#ff7a1a', { seat: 0.75 + lift, h: 1.6, hair: '#f5d142' });
  } });
}

// ---------- overlay sắc nét: ghim, bong bóng, biển chữ ----------
function pin(g, x, y, sc, col = '#ea4335', label) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 9, 3.5, 0, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-6, -14, -19, -24, -19, -38); g.arc(0, -38, 19, Math.PI, 0); g.bezierCurveTo(19, -24, 6, -14, 0, 0); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(0, -38, 7.5, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, -39, 6.5, 0, 7); g.fill();
  g.restore();
}
function roundPanel(g, x, y, w, h, r, fill, stroke, lw) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function wrapText(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; }
  if (cur) lines.push(cur); return lines;
}
// bong bóng tìm kiếm (trắng, kính lúp) neo trên đầu người
function searchBubble(g, out, id, text, ax, ay, a, kind = 'search') {
  const fs = 34 * U, m = MEAS; m.font = `600 ${fs}px "Be Vietnam Pro"`;
  const tw = m.measureText(text).width, icon = kind === 'chat' ? 0 : fs * 1.2, pw = tw + icon + fs * 1.3, ph = fs * 2.0;
  let x = clamp(ax - pw / 2, 24 * U, W - pw - 24 * U), y = ay - ph - fs * 0.9;
  if (out) out.push({ id, text, x0: x, y0: y, x1: x + pw, y1: y + ph });
  if (!g) return;
  const sc = back(clamp(a * 3), 2.2), al = clamp(a * 4);
  g.save(); g.globalAlpha = al; g.translate(ax, ay - fs * 0.3); g.scale(sc, sc); g.translate(-ax, -(ay - fs * 0.3));
  const bg = kind === 'chat' ? '#25b35a' : kind === 'result' ? '#ffffff' : '#ffffff';
  g.shadowColor = 'rgba(10,10,40,.35)'; g.shadowBlur = 18 * U; g.shadowOffsetY = 6 * U;
  roundPanel(g, x, y, pw, ph, ph / 2, bg);
  g.shadowColor = 'transparent';
  g.fillStyle = bg; g.beginPath(); g.moveTo(clamp(ax, x + ph * .5, x + pw - ph * .5) - fs * .35, y + ph - 1); g.lineTo(ax, ay - fs * 0.35); g.lineTo(clamp(ax, x + ph * .5, x + pw - ph * .5) + fs * .35, y + ph - 1); g.fill();
  if (kind !== 'chat') {   // kính lúp
    const cx = x + fs * 0.95, cy = y + ph / 2 - fs * 0.06; g.strokeStyle = kind === 'result' ? '#ea4335' : '#4a5568'; g.lineWidth = fs * 0.11;
    g.beginPath(); g.arc(cx, cy, fs * 0.3, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx + fs * .21, cy + fs * .21); g.lineTo(cx + fs * .46, cy + fs * .46); g.stroke();
  }
  g.fillStyle = kind === 'chat' ? '#ffffff' : '#1d2433'; g.font = `600 ${fs}px "Be Vietnam Pro"`; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(text, x + fs * 0.65 + icon, y + ph / 2 + fs * 0.04);
  g.restore();
}
// biển chữ kiểu biển báo Đức (xanh dương, viền trắng)
const CAPS = [
  { id: 'c1', t0: 0.8, t1: 4.75, text: '18:30. Mười quán ăn chung một con phố.' },
  { id: 'c2', t0: 4.9, t1: 10.0, text: 'Chín quán sáng trên bản đồ. Quán thứ mười thì không.' },
  { id: 'c3', t0: 10.4, t1: 15.25, text: 'Không ai đi dạo tìm quán nữa. Họ hỏi điện thoại.' },
  { id: 'c4', t0: 15.4, t1: 20.0, text: 'Và điện thoại chỉ đường tới những quán nó biết.' },
  { id: 'c5', t0: 20.2, t1: 25.5, text: 'Bếp của bạn vẫn nóng, món của bạn có khi ngon nhất phố.' },
  { id: 'c6', t0: 25.6, t1: 30.2, text: 'Nhưng với khách đang đói, quán bạn như vô hình.' },
  { id: 'c7', t0: 31.3, t1: 37.4, text: 'Rồi một tối, bạn quyết định không chờ khách đi ngang nữa.' },
  { id: 'c8', t0: 38.0, t1: 43.65, text: 'Website riêng: Speisekarte có Allergene, đặt bàn trong vài chạm.' },
  { id: 'c9', t0: 43.9, t1: 49.9, text: 'Hồ sơ Google Maps đầy đủ ảnh món, giờ mở cửa, thực đơn.' },
  { id: 'c10', t0: 50.15, t1: 56.15, text: 'Quảng cáo Maps chạy đúng giờ mở cửa, tới đúng người đang ở gần.' },
  { id: 'c11', t0: 56.4, t1: 62.4, text: 'Và mỗi vị khách hài lòng để lại lời khen cho người đến sau.' },
  { id: 'c12', t0: 63.0, t1: 69.9, text: 'Vẫn con phố ấy, vẫn những người ấy. Lần này, họ tìm thấy bạn.' },
  { id: 'c13', t0: 70.6, t1: 77.5, text: 'Khách đã ở rất gần. Hãy để họ tìm thấy bạn.', big: true },
];
function caption(g, out, c, t) {
  const big = !!c.big, fs = (big ? 62 : 46) * U, m = MEAS; m.font = `700 ${fs}px "Be Vietnam Pro"`;
  const maxW = P ? W - 128 * U : (big ? W * 0.5 : W * 0.42), pad = 34 * U;
  const lines = wrapText(m, c.text, maxW - pad * 2), lh = fs * 1.34;
  const pw = big ? Math.max(...lines.map(l => m.measureText(l).width)) + pad * 2 : maxW, ph = lines.length * lh + pad * 1.6;
  const x = P ? (W - pw) / 2 : (big ? (W - pw) / 2 : 72 * U), yB = P ? H * (big ? 0.74 : 0.80) : H * (big ? 0.80 : 0.89), y = yB - ph;
  if (out) out.push({ id: c.id, text: c.text, x0: x, y0: y, x1: x + pw, y1: y + ph });
  if (!g) return;
  const a = Math.min(eo(seg(t, c.t0, c.t0 + 0.35)), 1 - seg(t, c.t1 - 0.3, c.t1)), dy = (1 - eo(seg(t, c.t0, c.t0 + 0.45))) * 26 * U;
  g.save(); g.globalAlpha = a; g.translate(0, dy);
  g.shadowColor = 'rgba(5,10,30,.45)'; g.shadowBlur = 24 * U; g.shadowOffsetY = 8 * U;
  roundPanel(g, x, y, pw, ph, 14 * U, big ? 'rgba(12,6,40,.92)' : 'rgba(22,72,140,.95)');
  g.shadowColor = 'transparent';
  roundPanel(g, x + 7 * U, y + 7 * U, pw - 14 * U, ph - 14 * U, 9 * U, null, big ? 'rgba(8,221,164,.9)' : 'rgba(255,255,255,.92)', 3 * U);
  g.fillStyle = '#ffffff'; g.font = `700 ${fs}px "Be Vietnam Pro"`; g.textBaseline = 'middle'; g.textAlign = big ? 'center' : 'left';
  lines.forEach((l, i) => g.fillText(l, big ? x + pw / 2 : x + pad, y + pad * 0.8 + lh * (i + 0.5)));
  g.restore();
}
function hud(g, t) {
  if (t >= S8) return;
  const fs = 34 * U, x = P ? 64 * U : 56 * U, y = P ? H * 0.085 : 64 * U;
  let clock;
  if (t < RT1) { const s = 18 * 3600 + 30 * 60 + Math.floor(wtOf(stepT(t)) * 24); clock = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; }
  else if (t < S6) clock = '▸▸ TUA NHANH';
  else { const s = (t < S7 ? 19 * 3600 + 5 * 60 : 22 * 3600 + 57 * 60) + Math.floor((stepT(t) - (t < S7 ? S6 : S7)) * 24); clock = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; }
  const sp = speedLabel(t), real = realTime(t);
  g.save(); g.font = `500 ${fs}px "IBM Plex Mono"`; g.textBaseline = 'top'; g.textAlign = 'left';
  const tw = g.measureText(clock).width, tag = t >= RT1 && t < S6 ? '' : (real ? '×1 THỜI GIAN THỰC' : sp === '×24 → ×1' ? '×24 → ×1' : '×24 TUA NHANH');
  g.font = `500 ${fs * 0.8}px "IBM Plex Mono"`; const tw2 = tag ? g.measureText(tag).width + fs : 0;
  roundPanel(g, x - 16 * U, y - 12 * U, tw + tw2 + 46 * U, fs * 1.5 + 4 * U, 10 * U, 'rgba(12,14,30,.62)');
  g.font = `500 ${fs}px "IBM Plex Mono"`; g.fillStyle = '#ffffff'; g.fillText(clock, x, y);
  if (tag) { g.font = `500 ${fs * 0.8}px "IBM Plex Mono"`; g.fillStyle = real ? '#08DDA4' : '#F59E0B'; g.fillText(tag, x + tw + fs * 0.7, y + fs * 0.12); }
  if (t >= RT1 - 0.2 && t < S6) {     // quy trình SAMI 4 bước
    const steps = ['01 WEBSITE', '02 GOOGLE MAPS', '03 QUẢNG CÁO MAPS', '04 LỜI KHEN'], cur = t < L2 ? 0 : t < L3 ? 1 : t < L4 ? 2 : 3;
    g.font = `500 ${fs * 0.9}px "IBM Plex Mono"`;
    steps.forEach((s, i) => { const yy = y + fs * 1.75 + i * fs * 1.12; g.fillStyle = i < cur ? 'rgba(8,221,164,.95)' : i === cur ? '#ffffff' : 'rgba(255,255,255,.45)'; g.fillText((i < cur ? '✓ ' : i === cur ? '▸ ' : '  ') + s, x, yy); });
  }
  g.restore();
}

// thẻ Google Maps (lớp 2) cạnh ghim quán bạn
function mapsCard(g, out, t, ax, ay) {
  if (t < 44.9 || t >= S6) return;
  const fs = 34 * U, w = 560 * U, h = 330 * U;
  let x = P ? clamp(ax - w * 0.5, 40 * U, W - w - 40 * U) : clamp(ax + 70 * U, 40 * U, W - w - 40 * U), y = P ? H * 0.2 : Math.max(60 * U, ay - h * 0.6);
  if (out) out.push({ id: 'maps', text: 'Bếp Sen Vietnamesisch · Geöffnet', x0: x, y0: y, x1: x + w, y1: y + h });
  if (!g) return;
  const a = eo(seg(t, 44.9, 45.3)) * (1 - seg(t, S6 - 0.4, S6));
  g.save(); g.globalAlpha = a;
  g.shadowColor = 'rgba(10,10,40,.35)'; g.shadowBlur = 22 * U; g.shadowOffsetY = 8 * U;
  roundPanel(g, x, y, w, h, 20 * U, '#ffffff'); g.shadowColor = 'transparent';
  const ph = [['#d98b4e', '#f3d3b0'], ['#7b4a3a', '#e9b48f'], ['#5c9a4a', '#cfe3b4']];
  ph.forEach((c, k) => { const gr = g.createLinearGradient(0, y, 0, y + 120 * U); gr.addColorStop(0, c[1]); gr.addColorStop(1, c[0]); g.fillStyle = gr; g.beginPath(); g.roundRect(x + 20 * U + k * 178 * U, y + 18 * U, 168 * U, 112 * U, 10 * U); g.fill(); });
  g.fillStyle = '#1d2433'; g.font = `800 ${fs * 1.12}px "Be Vietnam Pro"`; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillText('Bếp Sen', x + 24 * U, y + 146 * U);
  g.fillStyle = '#4a5568'; g.font = `500 ${fs * 0.8}px "Be Vietnam Pro"`; g.fillText('Vietnamesisch · ', x + 24 * U, y + 196 * U);
  const tw = g.measureText('Vietnamesisch · ').width; g.fillStyle = '#188038'; g.fillText('Geöffnet', x + 24 * U + tw, y + 196 * U);
  ['Route', 'Anrufen', 'Speisekarte'].forEach((b, k) => { const bx = x + 24 * U + k * 172 * U; roundPanel(g, bx, y + 250 * U, 160 * U, 54 * U, 27 * U, k === 0 ? '#1a73e8' : '#e8f0fe'); g.fillStyle = k === 0 ? '#fff' : '#1a73e8'; g.font = `600 ${fs * 0.72}px "Be Vietnam Pro"`; g.textAlign = 'center'; g.fillText(b, bx + 80 * U, y + 263 * U); });
  g.fillStyle = 'rgba(29,36,51,.55)'; g.font = `500 ${fs * 0.6}px "Be Vietnam Pro"`; g.textAlign = 'right'; g.fillText('Minh họa', x + w - 18 * U, y + 150 * U);
  g.restore();
}

// ---------- end card ----------
function endCard(g, out, t) {
  if (t < S8) return;
  const ir = eio(seg(t, S8, S8 + 0.9));
  const c0 = proj([ME.cx, ME.h + 5, -7]) || [W / 2, H / 2];
  if (g) {
    g.save(); g.beginPath(); g.arc(c0[0], c0[1], ir * Math.hypot(W, H), 0, 7); g.clip();
    const bg = g.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.45, Math.hypot(W, H) * 0.6);
    bg.addColorStop(0, '#1d1650'); bg.addColorStop(0.55, '#0C0628'); bg.addColorStop(1, '#07031a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 60; k++) { const x = hash(k * 3.1) * W, y = (hash(k * 7.7) * H - stepT(t) * 8 * U * (0.5 + hash(k))) % H; g.fillStyle = k % 3 ? 'rgba(118,103,254,.35)' : 'rgba(8,221,164,.35)'; g.beginPath(); g.arc(x, (y + H) % H, (1.5 + hash(k * 9) * 3) * U, 0, 7); g.fill(); }
    g.restore();
  }
  const A = (a, d = 0.5) => eo(seg(t, a, a + d)), cx = P ? W / 2 : W * 0.3;
  const lw = (P ? 600 : 620) * U, lh = lw * 1024 / 3120, ly = P ? H * 0.2 : H * 0.2;
  if (g && t > 78.1) { const a = A(78.1, 0.6); g.save(); g.globalAlpha = a; const sc = 0.9 + 0.1 * back(seg(t, 78.1, 78.8)); g.translate(cx, ly + lh / 2); g.scale(sc, sc); g.drawImage(logo, -lw / 2, -lh / 2, lw, lh); g.restore(); }
  const items = [];
  const hfs = (P ? 72 : 70) * U, hy = P ? H * 0.37 : H * 0.5;
  ['Thêm khách.', 'Thêm doanh thu.', 'Thêm thời gian.'].forEach((s, i) => items.push({ id: 'e' + i, t: 79.4 + i * 0.3, text: s, font: `800 ${hfs}px "Be Vietnam Pro"`, x: cx, y: hy + i * hfs * 1.22, col: '#ffffff', accent: true }));
  items.push({ id: 'tag', t: 80.6, text: 'Strategy • Automation • Marketing • Intelligence', font: `500 ${34 * U}px "Be Vietnam Pro"`, x: cx, y: P ? H * 0.565 : H * 0.84, col: 'rgba(227,228,247,.85)' });
  const rx = P ? W / 2 : W * 0.73;
  items.push({ id: 'wa', t: 81.9, text: 'WhatsApp +49 155 60456888', font: `800 ${50 * U}px "Be Vietnam Pro"`, x: rx, y: P ? H * 0.655 : H * 0.36, col: '#ffffff', pill: true });
  items.push({ id: 'off1', t: 82.5, text: 'Phân tích marketing miễn phí,', font: `600 ${40 * U}px "Be Vietnam Pro"`, x: rx, y: P ? H * 0.735 : H * 0.52, col: '#E3E4F7' });
  items.push({ id: 'off2', t: 82.5, text: 'không ràng buộc. Phản hồi trong 24 giờ.', font: `600 ${40 * U}px "Be Vietnam Pro"`, x: rx, y: P ? H * 0.735 + 54 * U : H * 0.52 + 54 * U, col: '#E3E4F7' });
  items.push({ id: 'url', t: 83.1, text: 'sami-agency.de', font: `800 ${54 * U}px "Be Vietnam Pro"`, x: rx, y: P ? H * 0.815 : H * 0.7, col: '#08DDA4' });
  for (const it of items) {
    if (t < it.t) continue;
    MEAS.font = it.font; const tw = MEAS.measureText(it.text).width, fsz = parseFloat(it.font.split(' ')[1]);
    const pw = it.pill ? tw + fsz * 2.6 : tw, ph = it.pill ? fsz * 1.9 : fsz * 1.3;
    if (out) out.push({ id: it.id, text: it.text, x0: it.x - pw / 2, y0: it.y - ph / 2, x1: it.x + pw / 2, y1: it.y + ph / 2 });
    if (!g) continue;
    const a = A(it.t, 0.45); g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 22 * U);
    if (it.pill) {
      const sc = back(seg(t, it.t, it.t + 0.4), 2.4); g.translate(it.x, it.y); g.scale(sc, sc); g.translate(-it.x, -it.y);
      g.shadowColor = 'rgba(37,179,90,.55)'; g.shadowBlur = 30 * U; roundPanel(g, it.x - pw / 2, it.y - ph / 2, pw, ph, ph / 2, '#25b35a'); g.shadowColor = 'transparent';
      const ix = it.x - pw / 2 + fsz * 1.05, iy = it.y; g.fillStyle = '#fff'; g.beginPath(); g.arc(ix, iy, fsz * 0.48, 0, 7); g.fill(); g.beginPath(); g.moveTo(ix - fsz * .42, iy + fsz * .2); g.lineTo(ix - fsz * .55, iy + fsz * .55); g.lineTo(ix - fsz * .1, iy + fsz * .44); g.fill();
      g.fillStyle = '#25b35a'; g.beginPath(); g.arc(ix - fsz * .16, iy, fsz * .07, 0, 7); g.arc(ix, iy, fsz * .07, 0, 7); g.arc(ix + fsz * .16, iy, fsz * .07, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.font = it.font; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it.text, ix + fsz * 0.8, it.y + fsz * 0.04);
    } else {
      g.font = it.font; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (it.accent) { const w1 = MEAS.measureText('Thêm ').width; g.textAlign = 'left'; g.fillStyle = '#08DDA4'; g.fillText('Thêm ', it.x - tw / 2, it.y); g.fillStyle = it.col; g.fillText(it.text.slice(5), it.x - tw / 2 + w1, it.y); }
      else { g.fillStyle = it.col; g.fillText(it.text, it.x, it.y); }
    }
    g.restore();
  }
}

// ---------- khung hình ----------
let CUR = null;
function frame(g, t) {
  const sh = shot(t) || shot(20);
  setCam(W, H, sh.t3, sh.dist, sh.pitch, sh.yaw, sh.fov);
  const out = [];
  const ts = stepT(t), wt = wtOf(ts), night = nightOf(t);
  setLight(night, P ? -0.25 : -0.4);
  if (g && t < S8 + 0.9) drawScene(t, ts, wt);
  // dải nét
  const bp = proj(sh.bt), by = bp ? clamp(bp[1], H * 0.12, H * 0.88) : H / 2;
  if (g && t < S8 + 0.9) post(g, W, H, { y: by, w: sh.bw * H, r1: 7 * U, r2: 17 * U, sat: 1.45 - 0.35 * night, vig: 0.32 + 0.2 * night, ramp: (realTime(t) ? 0.05 : 0.09) * H });
  overlays(g, out, t);
  return out;
}

function drawScene(t, ts, wt) {
  const g = sg;
  const sky = mix([196, 206, 214], [24, 28, 52], L.night);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = css(sky); g.fillRect(0, 0, W, H);
  drawGround(g, t);
  // đường đi của điện thoại (c4): chấm xanh trên vỉa hè từ người hỏi tới quán đích
  if (t > 15.3 && t < 20.4) for (const a of ASK) {
    if (t < a.t0) continue; const s = SHOPS[a.go], door = s.x0 + s.w * 0.62, n = 22, grow = seg(t, Math.max(15.3, a.t0), Math.max(15.3, a.t0) + 1.0), fade = 1 - seg(t, 19.8, 20.4);
    for (let k = 0; k < n * grow; k++) { const u = k / n, p = proj([lerp(a.x, door, u), 0.05, lerp(a.z, 1.0, u * u)]); if (!p) continue; g.fillStyle = `rgba(66,133,244,${0.9 * fade})`; g.beginPath(); g.arc(p[0], p[1], Math.max(2, ppm(p[2]) * 0.28), 0, 7); g.fill(); }
  }
  // vòng quảng cáo Maps (lớp 3)
  if (t > L3 && t < S6) for (let k = 0; k < 4; k++) {
    const u = ((t - L3) / 1.25 - k * 0.25) % 1; if (u < 0 || t - L3 < k * 0.3) continue;
    const r = 3 + u * 40, pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([ME.cx + Math.cos(a) * r, 0.06, 3 + Math.sin(a) * r * 0.8]); }
    if (path(g, pts)) { g.strokeStyle = `rgba(66,133,244,${0.85 * (1 - u)})`; g.lineWidth = Math.max(2, 5 * U); g.stroke(); g.fillStyle = `rgba(66,133,244,${0.08 * (1 - u)})`; g.fill(); }
  }
  const items = [];
  const push = (pt, f) => { const c = proj(pt); if (c) items.push({ d: c[2], f, pz: pt[2] }); };
  for (const b of FILL) push([(b.x0 + b.x1) / 2, b.h / 2, b.z1], g => drawBuilding(g, b, t, false));
  for (const s of SHOPS) { push([s.cx, s.h / 2, 0], g => drawBuilding(g, s, t, true)); drawTerrace(items, s, t); }
  for (const tr of TREES) push([tr.x, 3, tr.z], g => drawTree(g, tr));
  for (const l of LAMPS) push([l.x, 2, l.z], g => drawLamp(g, l));
  for (let k = 0; k < 9; k++) { const x = wrap(-90 + k * 23 + wt * 9, -110, 110); push([x, 1, 8], g => drawCar(g, x, 8, 1, ['#d7263d', '#f5f5f0', '#1b998b', '#2e86de', '#f4d35e', '#30343f', '#c0c0c8', '#ff8c42', '#3d5a80'][k], t)); }
  for (let k = 0; k < 8; k++) { const x = wrap(90 - k * 26 - wt * 8, -110, 110); push([x, 1, 12], g => drawCar(g, x, 12, -1, ['#f5f5f0', '#30343f', '#e63946', '#4f6d7a', '#f4d35e', '#c0c0c8', '#2a9d8f', '#8d5bd1'][k], t)); }
  for (let k = 0; k < 7; k++) { const x = -70 + k * 21 + (k > 3 ? 6 : 0); if (Math.abs(x - ME.cx) < 8) continue; push([x, 1, 13.0], g => drawCar(g, x, 13.0, 1, ['#a4b0be', '#2f3542', '#e1b12c', '#40739e', '#c23616', '#dcdde1', '#273c75'][k], t)); }
  for (const p of THRU) { const x = wrap(p.x0 + p.dir * p.v * wt, -100, 100); push([x, 0, p.z], g => person(g, x, p.z, p.col)); }
  for (const v of VIS) { const q = visPos(v, wt); if (!q) continue; push([q[0], 0, q[1]], g => person(g, q[0], q[1], v.col)); }
  for (const a of ASK) { const q = askPos(a, t); if (!q) continue; push([q[0], 0, q[1]], g => person(g, q[0], q[1], a.col, { phone: true })); }
  const cp = couple(t); if (cp) cp.forEach((q, i) => push([q[0], 0, q[1]], g => person(g, q[0], q[1], i ? '#ff7aa8' : '#1d3557', { phone: i === 0 })));
  workers(items, t);
  // khói bếp quán bạn (bếp vẫn nóng)
  if (t < S6) for (let k = 0; k < 6; k++) { const ph = ((ts * 0.8 + k / 6) % 1); push([ME.x0 + 2.5, ME.h + 5 + ph * 6, -9], g => { const c = proj([ME.x0 + 2.5 + ph * 2, ME.h + 5 + ph * 6, -9]); if (!c) return; g.fillStyle = `rgba(245,245,250,${0.45 * (1 - ph)})`; g.beginPath(); g.arc(c[0], c[1], ppm(c[2]) * (0.8 + ph * 1.6), 0, 7); g.fill(); }); }
  // dây đèn trên hiên quán bạn (lớp 4 trở đi)
  if (t > 58) push([ME.cx, 2.6, 3.8], g => { const on = seg(t, 58, 58.6); for (let k = 0; k <= 16; k++) { const u = k / 16, x = lerp(ME.x0 + 0.4, ME.x1 - 0.4, u), y = 3.0 - Math.sin(u * Math.PI * 4 % Math.PI) * 0.3, c = proj([x, y, 4.2]); if (!c) continue; const r = ppm(c[2]); g.fillStyle = `rgba(255,214,140,${on})`; g.beginPath(); g.arc(c[0], c[1], Math.max(1.4, r * 0.1), 0, 7); g.fill(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r * 0.8); gr.addColorStop(0, `rgba(255,190,110,${0.5 * on})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); g.globalCompositeOperation = 'source-over'; } });
  // chậu hoa tiền cảnh (cận cảnh S4)
  if (t > 29.6 && t < RT1) items.push({ d: 1e-3, keep: true, f: g => { box(g, 17.6, 18.6, 0, 0.7, 6.0, 7.0, '#b5654a'); for (let k = 0; k < 9; k++) { const c = proj([18.1 + (hash(k) - .5) * 0.9, 0.9 + hash(k * 3) * 0.5, 6.5 + (hash(k * 5) - .5) * 0.8]); if (!c) continue; g.fillStyle = k % 3 ? '#4f8f3a' : '#e85d75'; g.beginPath(); g.arc(c[0], c[1], ppm(c[2]) * 0.22, 0, 7); g.fill(); } } });
  items.sort((a, b) => b.d - a.d);
  const closeUp = t > 29.85 && t < RT1;
  for (const it of items) if (!closeUp || it.keep || (it.d > 9 && !(it.pz > 1.8))) it.f(g);
  if (t >= L1 - 0.1 && t < S8) drawWebsite(g, t);
  // ánh sáng cửa sổ ban đêm (cộng sáng, nằm trong cảnh nên sẽ mờ theo dải)
  if (L.night > 0.35) { g.globalCompositeOperation = 'lighter'; for (const s of SHOPS) { const on = shopOn(s.i, t); if (on < 0.05) continue; const c = proj([s.cx, 1.4, 0.5]); if (!c) continue; const r = ppm(c[2]) * s.w * 0.6; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); gr.addColorStop(0, `rgba(255,180,100,${0.35 * on * L.night})`); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); } g.globalCompositeOperation = 'source-over'; }
  if (t > 29.8 && t < RT1) CUR = drawOwner(g, t); else CUR = null;
}

function overlays(g, out, t) {
  const pinsOn = !(t > 29.6 && t < RT1) && t < S8 + 0.6;
  let myPin = null;
  if (pinsOn) for (const s of SHOPS) {
    const pt = PIN_T(s.i); if (t < pt) continue;
    const top = s.h + (s.roof === 'gable' ? 3.4 : 1) + (s.i === YOURS ? lerp(-4, 1.5, eo(seg(t, 44.4, 45.0))) : 1.5);
    const c = proj([s.cx, top, s.roof === 'gable' ? -7 : -5]); if (!c) continue;
    const base = P ? 1.25 : 1.05, z = clamp(ppm(c[2]) / 22, 1.05, 1.6) * U * base;
    const offA = t >= S7 && s.i !== YOURS ? 1 - seg(t, OFF_T(s.i), OFF_T(s.i) + 0.35) : 1;
    const sc = z * back(seg(t, pt, pt + 0.35), 2.6) * (s.i === YOURS ? 1.35 : 1) * (s.i === YOURS && t > S7 ? 1 + 0.06 * Math.sin(t * 5) : 1);
    if (offA <= 0) continue;
    if (g) { g.save(); g.globalAlpha = offA * (s.i === YOURS ? 1 : (t > S6 ? 0.85 : 1)); pin(g, c[0], c[1], sc, s.i === YOURS ? '#ea4335' : '#e8584b'); g.restore(); }
    if (s.i === YOURS) myPin = [c[0], c[1] - 60 * sc];
    if (s.i === YOURS && t > L3 + 0.6 && t < S6 && g) { const a = seg(t, L3 + 0.6, L3 + 1); g.save(); g.globalAlpha = a; const fs = 26 * U; g.font = `700 ${fs}px "Be Vietnam Pro"`; const tw = g.measureText('Gesponsert').width; roundPanel(g, c[0] + 26 * sc, c[1] - 50 * sc, tw + 22 * U, fs * 1.5, 8 * U, '#fbbc04'); g.fillStyle = '#202124'; g.textBaseline = 'middle'; g.fillText('Gesponsert', c[0] + 26 * sc + 11 * U, c[1] - 50 * sc + fs * 0.76); g.restore(); }
  }
  // bong bóng tìm kiếm (S2) + cặp đôi (S3)
  for (const a of ASK) { if (t < a.t0 || t >= a.t1) continue; const q = [a.x, 1.9, a.z], c = proj(q); if (!c) continue; searchBubble(g, out, 'b' + a.text, a.text, c[0], c[1], t - a.t0); }
  const cp = couple(t);
  if (cp && t >= 20.6 && t < 24.9) { const c = proj([cp[0][0], 1.9, cp[0][1]]); if (c) searchBubble(g, out, 'bcouple', 'Asiatisch essen', c[0], c[1], t - 20.6); }
  // S4: tin nhắn của chủ quán
  if (CUR || (t > 32.5 && t < RT1)) {
    const hand = CUR ? CUR.hand : [W / 2, H / 2];
    if (t >= 32.6 && t < 33.4 && g) { const fs = 34 * U; const x = hand[0] + 40 * U, y = hand[1] - 150 * U; roundPanel(g, x, y, 150 * U, 70 * U, 35 * U, '#25b35a'); for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 12 - k)})`; g.beginPath(); g.arc(x + 45 * U + k * 30 * U, y + 35 * U, 8 * U, 0, 7); g.fill(); } }
    if (t >= 33.4) { const ax = P ? Math.max(hand[0], W * 0.42) : hand[0] + 120 * U; searchBubble(g, out, 'owner', 'Chào SAMI, quán mình cần khách.', ax, hand[1] - 150 * U, t - 33.4, 'chat'); }
  }
  // lớp 3: kết quả tìm kiếm trên đầu khách đi ngang
  if (t > 51.2 && t < 55.8) { const c = proj([ME.x0 - 7, 1.9, 5.2]); if (c) searchBubble(g, out, 'res1', 'Bếp Sen · 3 Min. zu Fuß', c[0], c[1], t - 51.2, 'result'); }
  // lớp 4: sao khi khách ra về
  if (t > L4 && t < S6) for (let k = 0; k < 4; k++) {
    const t0 = 56.9 + k * 1.25, t1 = t0 + 2.2; if (t < t0 || t >= t1) continue;
    const x = ME.x0 + 1.5 + ((k * 3.3) % (ME.w - 2)), c = proj([x, 3.4, 4.4 + (k % 2) * 0.8]); if (!c) continue;
    if (g) { const a = Math.min(eo(seg(t, t0, t0 + 0.3)), 1 - seg(t, t1 - 0.3, t1)); const fs = 34 * U; g.save(); g.globalAlpha = a; const y = c[1] - 40 * U - seg(t, t0, t1) * 50 * U; g.font = `700 ${fs}px "Be Vietnam Pro"`; const tw = g.measureText('★★★★★').width; roundPanel(g, c[0] - tw / 2 - 18 * U, y - fs * 0.85, tw + 36 * U, fs * 1.7, fs * 0.85, '#ffffff'); g.fillStyle = '#fbbc04'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★★★★★', c[0], y + 2 * U); g.restore(); }
  }
  if (myPin) mapsCard(g, out, t, myPin[0], myPin[1]);
  for (const c of CAPS) if (t >= c.t0 && t < c.t1) caption(g, out, c, t);
  if (g) hud(g, t);
  endCard(g, out, t);
}

// ---------- API ----------
export function setup(w, h, logoImg) {
  W = w; H = h; P = h > w; U = Math.min(w, h) / 1080; logo = logoImg;
  sg = initPost(W, H); MEAS = document.createElement('canvas').getContext('2d');
  buildCrowd();
}
export function renderFilm(g, t) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); frame(g, t); }
export function texts(t) {
  const out = []; const sh = shot(t) || shot(20); setCam(W, H, sh.t3, sh.dist, sh.pitch, sh.yaw, sh.fov);
  if (t > 29.8 && t < RT1) { const f = proj([13.6, 0, 1.0]); if (f) { const s = ppm(f[2]) * 1.25, raise = eio(seg(t, 32.2, 32.9)); CUR = { hand: [f[0] + lerp(s * .28, s * .12, raise), f[1] + lerp(-s * .86, -s * 1.2, raise)] }; } } else CUR = null;
  overlays(null, out, t);
  return out.map(o => ({ ...o, x0: Math.round(o.x0), y0: Math.round(o.y0), x1: Math.round(o.x1), y1: Math.round(o.y1) }));
}
export function buildEvents() {
  const ev = [];
  for (const s of SHOPS) if (s.i !== YOURS) ev.push({ t: PIN_T(s.i), type: 'pin', k: s.i });
  for (const w of [6.25, 29.2, RT1, S6, S7]) ev.push({ t: w, type: 'whoosh' });
  for (const a of ASK) ev.push({ t: a.t0, type: 'bubble' });
  ev.push({ t: 20.6, type: 'bubble' }, { t: 15.4, type: 'route' });
  for (const c of CAPS) ev.push({ t: c.t0, type: 'cap' });
  ev.push({ t: TS0, type: 'tapestop' }, { t: 30.15, type: 'bell' }, { t: 30.7, type: 'sigh' }, { t: 32.25, type: 'phone' });
  for (let k = 0; k < 6; k++) ev.push({ t: 32.6 + k * 0.13, type: 'tap' });
  ev.push({ t: 33.4, type: 'send' }, { t: 35.0, type: 'note' });
  for (let k = 0; k < 12; k++) ev.push({ t: 38.1 + k * Q * 2, type: 'tile' });
  ev.push({ t: 42.2, type: 'screen' }, { t: 44.4, type: 'pinrise' }, { t: 44.9, type: 'card' });
  for (let k = 0; k < 5; k++) ev.push({ t: L3 + k * 1.25, type: 'ripple' });
  ev.push({ t: 51.2, type: 'bubble' });
  for (let k = 0; k < 4; k++) ev.push({ t: 56.9 + k * 1.25, type: 'star' });
  ev.push({ t: 58, type: 'lights' });
  for (let k = 0; k < 14; k++) ev.push({ t: 63 + hash(k * 3.3) * 7, type: 'clink' });
  for (const s of SHOPS) if (s.i !== YOURS) ev.push({ t: OFF_T(s.i), type: 'off' });
  ev.push({ t: S8, type: 'iris' }, { t: 78.1, type: 'logo' }, { t: 81.9, type: 'pop' }, { t: 83.1, type: 'tick' });
  return ev.sort((a, b) => a.t - b.t);
}
