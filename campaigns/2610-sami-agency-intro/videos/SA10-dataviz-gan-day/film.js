// SA10 · "Khách tìm quán bằng điện thoại, và họ tìm 'gần đây'" — lemo-opuscar dataviz style.
// One sheet of paper, one take. A pencil-drawn phone whose screen is a calendar heatmap: every cell is a real month of
// Google Trends interest in „in der Nähe" (DE, 1/2004–9/2026). Then the cells become 273 columns, a waffle adds Eurostat
// (87 / 100 online by phone), and the camera returns to the phone: a map, two levers, the SAMI end card.
import * as E from './engine.js';
import { clamp, lerp, seg, eio, eo, hash, monotone } from '/core/lib.js';
const { P } = E;

export const BEAT = 2 / 3;                    // 90 BPM; a 16th = 5 frames at 30 fps
const b = n => Math.round(n * BEAT * 30) / 30;
export const DUR = b(134.5);                  // 89.67 s
const ACC = '#08DDA4';                        // the one accent (SAMI mint), never data
const NAVY = '#0C0628', LAV = '#E3E4F7', AMBER = '#F59E0B';

// sequential ramp (no natural centre): paper → blue → deep ink-blue. Pale values stay pale.
const SEQ = [[0, '#F3EFE7'], [.06, '#EAEDEC'], [.18, '#D6E4EE'], [.35, '#AFCDE3'], [.52, '#7FAFD6'], [.68, '#4F8BC4'], [.82, '#2C66A6'], [.93, '#18477F'], [1, '#0D2F5C']];
const SEQC = SEQ.map(([u, h]) => [u, [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))]);
function seqColor(v) {
  const u = clamp(v / 100);
  for (let i = 0; i < SEQC.length - 1; i++) { const [a, ca] = SEQC[i], [bb, cb] = SEQC[i + 1]; if (u <= bb) { const f = (u - a) / (bb - a); return E.rgb(ca.map((c, j) => c + (cb[j] - c) * f)); } }
  return E.rgb(SEQC[SEQC.length - 1][1]);
}

// ---------- timeline (seconds; every value is a whole frame) ----------
const T = {
  box: [b(.5), b(1.4)], write: [b(1.4), b(3.4)], mag: [b(3.4), b(3.8)], dotTap: b(4), fall: [b(5), b(6)], phone: [b(5.5), b(8.5)],
  head: [b(10), b(11.5)], grid: [b(10), b(11.5)], legend: b(11), n1: b(15),
  n2: b(37), flipRed: b(40.5), hush1: [b(41), b(42)], aug: b(42), n3: b(43),
  morph: [b(50), b(53)], crane: [b(49.5), b(53.5)], yaxis: [b(52.5), b(54)], refs: [b(54.5), b(55.5)], bracket: [b(55.5), b(56.5)],
  pan: [b(66), b(68)], waf1: [b(68), b(71)], wl1: b(71), waf2: [b(72), b(73.5)], wl2: b(73.5),
  hush2: [b(80), b(81)], back: [b(80), b(83)], strike: [b(82), b(82.75)], rewrite: [b(82.75), b(84.5)], streets: [b(83), b(85)],
  user: b(85), ring: [b(85.25), b(86.25)], pins: [b(86.5), b(87), b(87.5)],
  ghost: [b(93.5), b(94.5)], ghostNote: b(94.5),
  move: [b(104.5), b(105.5)], mint: b(105.5), tag: b(106), lev1: b(106), stars: [b(108), b(109)], lev2: b(109),
  breath: [b(117.5), b(119.5)], expand: [b(119.5), b(120.5)], end: b(120.5),
};

let D, L, V, logo;
const C = [];                                 // cells: {i, ym, r, m, v, t, x, y, w, h}
let G;                                        // phone geometry
export function setup(data, w, h, logoImg) {
  D = data; V = h > w; logo = logoImg; E.setSize(w, h);
  L = V ? {
    ph: { cx: 0, cy: -140, w: 500, h: 1000, r: 62, ins: 18, sb: 62 },
    head: { x: -250, y1: -775, y2: -717, size: 46 },
    cap: { x: 90, y: 1560, size: 40, maxW: 900 }, src: { x: 90, y: 1650, size: 19, maxW: 900 },
    chart: { x0: -450, x1: 450, y0: -1180, k: 6.4 }, waf: { x: 1300, y: -1700, cell: 36, gap: 6, sep: 30 },
    camPhone: { x: 0, y: -60 }, camChart: { x: 0, y: -1490 }, margin: { l: -510, r: 510 }, note: 34,
  } : {
    ph: { cx: 0, cy: 0, w: 470, h: 940, r: 58, ins: 17, sb: 54 },
    head: { x: 650, y1: -398, y2: -346, size: 42 },
    cap: { x: 1180, y: 390, size: 37, maxW: 650, col: true }, src: { x: 1180, y: 905, size: 18, maxW: 650 },
    chart: { x0: -560, x1: 440, y0: -1060, k: 5.6 }, waf: { x: 1700, y: -1540, cell: 34, gap: 5, sep: 40 },
    camPhone: { x: 430, y: 0 }, camChart: { x: 300, y: -1340 }, margin: { l: -500, r: 615 }, note: 34,
  };
  const p = L.ph, x0 = p.cx - p.w / 2, y0 = p.cy - p.h / 2, ix0 = x0 + p.ins, ix1 = x0 + p.w - p.ins, iy0 = y0 + p.ins, iy1 = y0 + p.h - p.ins;
  const sx0 = ix0 + 14, sx1 = ix1 - 14, sy0 = iy0 + 26, sy1 = sy0 + p.sb;
  const gy0 = sy1 + 48, gy1 = iy1 - 22, gx0 = ix0 + 8, gx1 = ix1 - 8;
  G = { x0, y0, x1: x0 + p.w, y1: y0 + p.h, ix0, ix1, iy0, iy1, sx0, sx1, sy0, sy1, gy0, gy1, gx0, gx1, cw: (gx1 - gx0) / 12, rh: (gy1 - gy0) / 23, mY: sy1 + 32 };
  C.length = 0;
  D.months.forEach((ym, i) => {
    const r = Math.floor(i / 12), m = i % 12;
    C.push({ i, ym, r, m, v: D.values[i], t: cellTime(r, m), x: G.gx0 + m * G.cw + 2.5, y: G.gy0 + r * G.rh + 2.5, w: G.cw - 5, h: G.rh - 5 });
  });
  camKeys();
}
function cellTime(r, m) {
  let t;
  if (r <= 6) t = b(11.5) + r * b(.5) + m * b(.5) / 12;            // 2004–2010: half a beat per year
  else if (r <= 14) t = b(16) + (r - 7) * BEAT + m * BEAT / 12;     // 2011–2018: one beat per year
  else if (r <= 17) t = b(24) + (r - 15) * 2 * BEAT + m * 2 * BEAT / 12; // 2019–2021: two beats per year
  else if (r <= 20) t = b(30) + (r - 18) * 3 * BEAT + m * BEAT / 4; // 2022–2024: a 16th per month
  else if (r === 21) t = m <= 6 ? b(39) + m * BEAT / 4 : m === 7 ? T.aug : b(43) + (m - 8) * BEAT / 4;   // 2025: a held beat before August
  else t = b(44) + m * BEAT / 4;                                    // 2026 (1–9)
  return Math.round(t * 30) / 30;
}
const cellC = c => [c.x + c.w / 2, c.y + c.h / 2];
// chart geometry for the morph target
const colX = i => L.chart.x0 + i / C.length * (L.chart.x1 - L.chart.x0);
const colW = () => (L.chart.x1 - L.chart.x0) / C.length;
const cy = v => L.chart.y0 - v * L.chart.k;
const brX = () => colX(14 * 12 + 6);              // the bracket stands over mid-2018, where the columns are still low
// waffle geometry: two 10×10 grids side by side
function wafCell(which, k) {
  const w = L.waf, side = 10 * w.cell + 9 * w.gap, x0 = which === 0 ? w.x - w.sep / 2 - side : w.x + w.sep / 2;
  const r = Math.floor(k / 10), c = k % 10;
  return [x0 + c * (w.cell + w.gap), w.y + r * (w.cell + w.gap), w.cell, w.cell];
}
const wafSide = () => 10 * L.waf.cell + 9 * L.waf.gap;
// map geometry (on the phone screen)
function mapGeom() {
  const mx = (G.gx0 + G.gx1) / 2, my = (G.gy0 + G.gy1) / 2 + (V ? 10 : 0), R = (G.gx1 - G.gx0) * .36;
  return {
    mx, my, R,
    pins: [[mx - R * .55, my - R * .45, 'Phở Nhà'], [mx + R * .5, my - R * .1, 'Quán Mây'], [mx - R * .2, my + R * .6, 'Bếp Sen']],
    ghost: [mx + R * 1.12, my + R * 1.15], ghostIn: [mx + R * .12, my - R * .78],
  };
}

// ---------- texts ----------
const HEAD = ['Mức tìm „in der Nähe“ ở Đức,', 'từng tháng · 2004 → 2026'];
const CAPS = [
  { id: 'c1', t0: b(.5), t1: b(9.5), kicker: 'tối nay', text: 'Tối nay, ở đâu đó tại Đức, một người đói bụng mở điện thoại.' },
  { id: 'c2', t0: b(10.2), t1: b(22.8), kicker: '2004 → 2010', text: 'Mỗi ô là một tháng, từ 2004 đến nay. Ô càng đậm, người Đức gõ „in der Nähe“ trên Google càng nhiều.' },
  { id: 'c3', t0: b(23), t1: b(40.4), kicker: '2011 → 2025', text: 'Rồi điện thoại thông minh nằm trong mọi túi áo. Từng ô đậm dần lên, và đậm nhất luôn là mùa hè.' },
  { id: 'c4', t0: b(42.3), t1: b(49.8), kicker: '8/2025 → 9/2026', text: 'Tháng 8 năm 2025 lập kỷ lục. Năm 2026 vẫn sát đỉnh.' },
  { id: 'c5', t0: b(53.7), t1: b(65.8), kicker: '1/2004 → 9/2026 · 273 tháng', text: 'Xếp 273 tháng thành một hàng: từ 2019 đến 2025, mức tìm „in der Nähe“ ở Đức tăng hơn ba lần.' },
  { id: 'c6', t0: b(66), t1: b(79.8), kicker: 'Eurostat · 2025 · người 16–74 tuổi', text: 'Và họ tìm bằng điện thoại: năm 2025, cứ 100 người Đức thì 87 người lên mạng bằng điện thoại.' },
  { id: 'c7', t0: b(81.6), t1: b(93.3), kicker: 'minh họa', text: 'Người đói không tìm quán ngon nhất nước Đức. Họ tìm quán gần đây, đang mở cửa, ngay trên bản đồ.' },
  { id: 'c8', t0: b(93.4), t1: b(104.5), kicker: 'minh họa', text: 'Quán hiện ra lúc đó có khách. Quán vắng mặt, dù nấu ngon đến đâu, cũng như đóng cửa.' },
  { id: 'c9', t0: b(104.6), t1: b(117.3), kicker: 'hai đòn bẩy', text: 'Hai đòn bẩy để quán của bạn hiện ra đúng lúc đó, và SAMI làm cả hai cho nhà hàng tại Đức.' },
];
const SRC1 = 'Nguồn: Google Trends, Đức, 1/2004–9/2026, cụm „in der Nähe“ · chỉ số 0–100 (100 = tháng cao nhất, 8/2025) là tỷ trọng trên tổng lượt tìm, không phải số lượt · dữ liệu: Google Trends';
const SRC2 = 'Nguồn: Eurostat isoc_ci_dev_i, 2025 · CC BY 4.0';
const SRC3 = 'Minh họa · tên quán hư cấu';

// ---------- camera ----------
let zK, xK, yK;
function camKeys() {
  const sbx = (G.sx0 + G.sx1) / 2, sby = (G.sy0 + G.sy1) / 2 + 40, cp = L.camPhone, cc = L.camChart;
  const wx = V ? L.waf.x : L.waf.x + 330, wy = V ? cc.y : cc.y - 20;
  const mg = mapGeom();
  zK = monotone([[0, V ? 2.15 : 1.9], [b(5), V ? 2.05 : 1.8], [b(9), 1.0], [b(16), 1.0], [b(18), V ? 1.3 : 1.0], [b(30), V ? 1.3 : 1.0], [b(33), 1.0],
    [b(49.5), 1.0], [b(51.5), .82], [b(53.5), 1.0], [b(66), 1.0], [b(67), .9], [b(68), 1.0], [b(80), 1.0], [b(81.5), .88], [b(83), 1.0],
    [b(86), 1.0], [b(88), V ? 1.18 : 1.0], [b(102), V ? 1.18 : 1.0], [b(104.5), 1.0], [b(140), 1.0]]);
  xK = monotone([[0, sbx + (V ? 0 : 0)], [b(5), sbx], [b(9), cp.x], [b(49.5), cp.x], [b(53.5), cc.x], [b(66), cc.x], [b(68), wx], [b(80), wx], [b(83), cp.x],
    [b(86), cp.x], [b(88), V ? mg.mx : cp.x], [b(102), V ? mg.mx : cp.x], [b(104.5), cp.x], [b(140), cp.x]]);
  yK = monotone([[0, sby], [b(5), sby], [b(9), cp.y], [b(16), cp.y], [b(49.5), cp.y], [b(53.5), cc.y], [b(66), cc.y], [b(68), wy], [b(80), wy], [b(83), cp.y],
    [b(86), cp.y], [b(88), V ? mg.my - 40 : cp.y], [b(102), V ? mg.my - 40 : cp.y], [b(104.5), cp.y], [b(140), cp.y]]);
}
function rowFrac(t) {                                 // continuous index of the newest cell
  if (t <= C[0].t) return 0;
  for (let i = 0; i < C.length - 1; i++) if (t < C[i + 1].t) return i + eio(seg(t, C[i].t, C[i + 1].t));
  return C.length - 1;
}
export function camAt(t) {
  let zoom = zK(t), x = xK(t), y = yK(t);
  // track the newest row (newest row at ~58 % of the height) while zoomed in
  const w = seg(t, b(16), b(18)) * (1 - seg(t, b(30), b(33)));
  if (w > 0) {
    const f = rowFrac(t), c = C[Math.floor(f)], ry = c.y + c.h / 2, viewH = E.H / zoom;
    const yt = clamp(ry - .08 * viewH, G.y0 + viewH / 2 - 60, G.y1 - viewH / 2 + 80);
    y = lerp(y, yt, w * (V ? 1 : .6));
  }
  // punch-in on the record month: 2 frames in, decaying shake
  let sx = 0, sy = 0; const pk = t - T.aug;
  if (pk > 0 && pk < 1.3) { const d = Math.exp(-pk * 4.2); zoom *= 1 + .2 * clamp(pk / .066) * d; sx = Math.sin(pk * 61) * 14 * d; sy = Math.cos(pk * 47) * 10 * d; }
  return { x, y, zoom, roll: 0, sx, sy };
}

// ---------- notes (pinned in data space) ----------
let NOTES;
function notes() {
  if (NOTES) return NOTES;
  const ns = L.note, cell = (r, m) => C[r * 12 + m];
  const aug = cell(21, 7), rx = G.x1 + 22, mg = mapGeom();
  const s2019 = cell(15, 0), s2025 = cell(21, 0);
  const lx = V ? L.margin.l : L.margin.l;
  NOTES = [
    { id: 'n1', lines: ['2004–2010:', 'gần như chưa ai gõ'], x: G.gx0 + 22, y: G.gy0 + G.rh * 2.6, size: ns + 4, col: P.blue, t0: T.n1, dur: 1.2, t1: b(49.5), maxW: G.gx1 - G.gx0 - 40 },
    { id: 'n2', lines: ['mùa hè', 'luôn đậm nhất'], x: rx, y: G.gy0 + G.rh * 14.2, size: ns, col: P.blue, t0: T.n2, dur: 1.2, t1: b(49.5), lead: [cell(16, 7).x + cell(16, 7).w + 30, cell(16, 7).y + 4], maxW: L.margin.r - rx - 10 },
    { id: 'n3', lines: ['8/2025:', 'kỷ lục, 100'], x: rx, y: G.gy0 + G.rh * 20.2, size: ns + 4, col: P.red, t0: T.n3, dur: 1.0, t1: b(49.5), lead: [aug.x + aug.w + 6, aug.y + aug.h / 2], ring: cellC(aug), maxW: L.margin.r - rx - 10 },
    // chart
    { id: 'm25', lines: ['TB 2025: 77'], x: brX() - 16, y: cy(77.3) + 12, size: ns, col: P.ink, t0: T.refs[0] + .5, dur: .8, t1: b(65.8), align: 'right' },
    { id: 'x33', lines: ['× 3,3'], x: brX() - 16, y: cy(50) + 16, size: ns + 14, col: P.red, t0: T.bracket[1], dur: .6, t1: b(65.8), align: 'right' },
    { id: 'm19', lines: ['TB 2019: 23'], x: brX() - 16, y: cy(23.1) + 8, size: ns, col: P.ink, t0: T.refs[0] + .1, dur: .8, t1: b(65.8), align: 'right' },
    // waffles
    { id: 'w1', lines: ['điện thoại', '87 / 100'], x: wafCell(0, 0)[0], y: L.waf.y - (V ? 76 : 70), size: ns + 2, col: P.blue, t0: T.wl1, dur: 1.0, t1: b(79.8), sizes: [ns + 2, ns + 14], up: true },
    { id: 'w2', lines: ['máy tính bàn', '33 / 100'], x: wafCell(1, 0)[0], y: L.waf.y - (V ? 76 : 70), size: ns + 2, col: P.ink, t0: T.wl2, dur: 1.0, t1: b(79.8), sizes: [ns + 2, ns + 14], up: true },
    // map
    { id: 'gh', lines: ['quán của bạn?'], x: mg.ghost[0] + (V ? 26 : 30), y: mg.ghost[1] + 64, size: ns, col: P.red, t0: T.ghostNote, dur: 1.0, t1: b(104.8), align: 'right' },
    { id: 'l1', lines: ['① Google Ads Maps:', 'lên đầu bản đồ', 'đúng lúc khách gõ'], x: lx, y: V ? G.gy0 + G.rh * 3 : G.gy0 + G.rh * 4, size: ns, col: P.blue, t0: T.lev1, dur: 1.4, t1: b(117.3), maxW: G.x0 - lx - 16, lead: [mg.ghostIn[0] - 18, mg.ghostIn[1] - 30] },
    { id: 'l2', lines: ['② Local SEO:', 'ảnh, giờ mở cửa,', 'đánh giá đầy đủ'], x: rx, y: V ? G.gy0 + G.rh * 9 : G.gy0 + G.rh * 8, size: ns, col: P.blue, t0: T.lev2, dur: 1.6, t1: b(117.3), maxW: L.margin.r - rx - 10, lead: [mg.ghostIn[0] + 60, mg.ghostIn[1] - 40] },
  ];
  // shrink to fit the margin
  const g = new OffscreenCanvas(8, 8).getContext('2d');
  for (const nt of NOTES) if (nt.maxW) {
    const w = Math.max(...nt.lines.map((ln, i) => E.measureHand(g, ln, nt.sizes ? nt.sizes[i] : nt.size, 400, 'Patrick Hand')));
    if (w > nt.maxW) { const k = nt.maxW / w; nt.size *= k; if (nt.sizes) nt.sizes = nt.sizes.map(s => s * k); }
  }
  return NOTES;
}
function noteBox(nt) {
  const g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  let w = 0, h = 0;
  nt.lines.forEach((ln, i) => { const sz = nt.sizes ? nt.sizes[i] : nt.size; w = Math.max(w, E.measureHand(g, ln, sz, 400, 'Patrick Hand')); h += sz * 1.12; });
  const x0 = nt.align === 'right' ? nt.x - w : nt.x, top = nt.y - (nt.sizes ? nt.sizes[0] : nt.size) * .85;
  return [x0, top, x0 + w, top + h];
}
function drawNote(g, nt, t, cam) {
  if (t < nt.t0 || t > nt.t1 + .3) return null;
  const a = 1 - seg(t, nt.t1, nt.t1 + .3);
  const pr = seg(t, nt.t0, nt.t0 + nt.dur), n = nt.lines.length; let tip = null, yy = nt.y;
  g.save(); g.globalAlpha *= a;
  nt.lines.forEach((ln, i) => {
    const sz = nt.sizes ? nt.sizes[i] : nt.size, p = clamp(pr * n - i);
    if (i > 0) yy += (nt.sizes ? nt.sizes[i - 1] : nt.size) * .3 + sz * .82;
    const r = E.handText(g, ln, nt.x, yy, { size: sz, color: nt.col, progress: p, align: nt.align || 'left', zoom: cam.zoom, weight: 400 });
    if (p > 0 && p < 1) tip = r.tip;
  });
  if (nt.lead && pr >= 1) {
    const bx = noteBox(nt), lp = seg(t, nt.t0 + nt.dur, nt.t0 + nt.dur + .35);
    const from = [nt.lead[0] < bx[0] ? bx[0] - 6 : nt.lead[0] > bx[2] ? bx[2] + 6 : (bx[0] + bx[2]) / 2, nt.lead[1] < bx[1] ? bx[1] - 4 : bx[3] + 2];
    if (nt.lead[1] >= bx[1] && nt.lead[1] <= bx[3]) from[1] = (bx[1] + bx[3]) / 2;
    const tp = E.leader(g, from, nt.lead, { color: nt.col, progress: lp, seed: hash(nt.t0) * 9 });
    if (lp > 0 && lp < 1) tip = tp;
    if (nt.ring) E.pencilStroke(g, E.ringPath(nt.ring[0], nt.ring[1], V ? 26 : 24, 3), { color: nt.col, width: 2, progress: seg(t, nt.t0 + nt.dur + .3, nt.t0 + nt.dur + .7), passes: 1 });
  }
  g.restore();
  return tip;
}

// ---------- main render ----------
export function renderFilm(g, t) {
  const cam = camAt(t);
  E.drawPaper(g, cam, { dots: .9 });
  E.applyCam(g, cam);
  const tips = [];

  drawHeadline(g, t, tips);
  drawPhone(g, t, cam, tips);
  if (t < T.streets[1] + .1) drawGrid(g, t, cam, tips);
  if (t >= T.morph[0] - .1) drawChart(g, t, cam, tips);
  if (t >= T.pan[0] - .5 && t < T.back[1] + .5) drawWaffles(g, t, cam, tips);
  if (t >= T.streets[0] - .1) drawMap(g, t, cam, tips);
  for (const nt of notes()) { const tp = drawNote(g, nt, t, cam); if (tp) tips.push(tp); }
  drawExpand(g, t, cam);

  // ---------- screen space ----------
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawThePencil(g, t, cam, tips);
  if (t < T.breath[0]) {
    for (const c of CAPS) drawCaption(g, c, t);
    const s1 = seg(t, b(10.5), b(11.2)) * (1 - seg(t, b(65.8), b(66.2)));
    const s2 = seg(t, b(66.6), b(67.2)) * (1 - seg(t, b(79.8), b(80.2)));
    const s3 = seg(t, b(87.5), b(88)) * (1 - seg(t, b(117.3), b(117.5)));
    if (s1 > 0) drawSource(g, SRC1, s1); if (s2 > 0) drawSource(g, SRC2, s2); if (s3 > 0) drawSource(g, SRC3, s3);
  }
  if (t >= T.expand[1] - .05) drawEndCard(g, t);
}

function drawHeadline(g, t, tips) {
  const h = L.head, p = seg(t, ...T.head);
  if (p <= 0) return;
  const wA = E.setType(g, HEAD[0], h.x, h.y1, { size: h.size, font: 'Newsreader', weight: 600, color: P.ink, progress: clamp(p * 1.6), rise: 8 });
  const wB = E.setType(g, HEAD[1], h.x, h.y2, { size: h.size * .78, font: 'Newsreader', weight: 500, color: P.inkSoft, progress: clamp(p * 1.6 - .6), rise: 8 });
  // legend: the ramp, 0 … 100
  const lp = seg(t, T.legend, T.legend + .5);
  if (lp > 0) {
    const lx = V ? G.x1 - 150 : h.x + wB + 30, ly = V ? h.y2 + 30 : h.y2 - 14, lw = 150;
    for (let i = 0; i < 30; i++) { if (i / 30 > lp) break; g.fillStyle = seqColor(i / 29 * 100); g.fillRect(lx + i * lw / 30, ly - 9, lw / 30 + .6, 14); }
    g.strokeStyle = P.ink; g.lineWidth = 1; g.globalAlpha = lp; g.strokeRect(lx, ly - 9, lw, 14); g.globalAlpha = 1;
    E.setType(g, '0', lx - 8, ly + 4, { size: 16, align: 'right', alpha: lp }); E.setType(g, '100', lx + lw + 8, ly + 4, { size: 16, alpha: lp });
  }
}
function phonePath() {
  const r = L.ph.r, { x0, y0, x1, y1 } = G, out = [];
  const arc = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + i / 8 * Math.PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); out.push(out[0]);
  return out;
}
function drawPhone(g, t, cam, tips) {
  // search box (drawn first, in close-up)
  const bp = seg(t, ...T.box), { sx0, sx1, sy0, sy1 } = G;
  if (bp > 0) {
    const R = (sy1 - sy0) / 2, path = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i / 10 * Math.PI; path.push([sx0 + R + Math.cos(a) * R, sy0 + R + Math.sin(a) * R]); }
    for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI; path.push([sx1 - R + Math.cos(a) * R, sy0 + R + Math.sin(a) * R]); }
    path.push(path[0]);
    g.save(); g.globalAlpha = .9 * bp; g.fillStyle = '#FBF9F4'; g.beginPath(); g.roundRect(sx0, sy0, sx1 - sx0, sy1 - sy0, R); g.fill(); g.restore();
    const tp = E.pencilStroke(g, path, { color: P.ink, width: 2, progress: bp, seed: 4, passes: 2, wobble: .3 });
    if (bp < 1) tips.push(tp);
  }
  // the query, handwritten; later struck and rewritten
  const qs = V ? 34 : 30, qx = sx0 + 26, qy = (sy0 + sy1) / 2 + qs * .32;
  const wp = seg(t, ...T.write);
  if (wp > 0) {
    const r = E.handText(g, 'in der Nähe', qx, qy, { size: qs, color: P.blue, progress: wp, zoom: cam.zoom, weight: 400 });
    if (wp < 1) tips.push(r.tip);
    const sp = seg(t, ...T.strike);
    if (sp > 0) { const tp = E.pencilStroke(g, [[qx - 4, qy - qs * .3], [qx + r.w + 6, qy - qs * .34]], { color: P.red, width: 3, progress: sp, seed: 9 }); if (sp < 1) tips.push(tp); }
  }
  const rw = seg(t, ...T.rewrite);
  if (rw > 0) {
    const w0 = E.measureHand(g, 'in der Nähe', qs, 400, 'Patrick Hand');
    const r = E.handText(g, 'Restaurant in der Nähe', qx + w0 + 14, qy, { size: qs * .64, color: P.blue, progress: rw, zoom: cam.zoom, weight: 400 });
    if (rw < 1) tips.push(r.tip);
  }
  // magnifier
  const mp = seg(t, ...T.mag);
  if (mp > 0) {
    const mx = sx1 - 34, my = (sy0 + sy1) / 2 - 3, mr = V ? 11 : 10;
    const tp = E.pencilStroke(g, [...E.ringPath(mx, my, mr, 2, 1.0, -1.5), [mx + mr * .75, my + mr * .75], [mx + mr * 1.6, my + mr * 1.6]], { color: P.ink, width: 2.2, progress: mp, passes: 1 });
    if (mp < 1) tips.push(tp);
  }
  // the full stop: the pencil taps a dot after the query and it falls into the screen (becomes January 2004)
  if (t >= T.dotTap && t < C[0].t + .1) {
    const w0 = E.measureHand(g, 'in der Nähe', qs, 400, 'Patrick Hand');
    const a = [qx + w0 + 10, qy - 2], c0 = cellC(C[0]), u = eio(seg(t, ...T.fall));
    const x = lerp(a[0], c0[0], u), y = lerp(a[1], c0[1], u) - Math.sin(u * Math.PI) * 60;
    E.dataDot(g, x, y, 6, P.blue, { fresh: t - T.dotTap, ringW: 1.4 });
    if (t < T.dotTap + .15) tips.push(a);
  }
  // phone body
  const pp = seg(t, ...T.phone);
  if (pp > 0) {
    const tp = E.pencilStroke(g, phonePath(), { color: P.ink, width: 2.6, progress: pp, seed: 2, passes: 2, wobble: .35 });
    if (pp < 1) tips.push(tp);
    const ip = seg(pp, .55, 1), { ix0, ix1, iy0, iy1 } = G;
    if (ip > 0) E.pencilStroke(g, [[ix0, iy0], [ix1, iy0], [ix1, iy1], [ix0, iy1], [ix0, iy0]], { color: P.inkSoft, width: 1.3, progress: ip, seed: 5, passes: 1, wobble: .3 });
    const cx = (G.x0 + G.x1) / 2;
    if (pp > .8) E.pencilStroke(g, [[cx - 34, G.y0 + 10], [cx + 34, G.y0 + 10]], { color: P.ink, width: 3, progress: seg(pp, .8, 1), passes: 1 });
    if (pp > .9) E.pencilStroke(g, [[G.x1 + 3, G.y0 + 170], [G.x1 + 3, G.y0 + 250]], { color: P.ink, width: 3.5, progress: seg(pp, .9, 1), passes: 1 });
  }
}
function drawGrid(g, t, cam, tips) {
  const gp = seg(t, ...T.grid);
  if (gp <= 0) return;
  const mo = seg(t, ...T.morph);
  // faint pencil grid
  const fade = 1 - seg(t, ...T.streets);
  g.save(); g.globalAlpha *= .35 * fade;
  for (let k = 0; k <= 12; k++) { const x = G.gx0 + k * G.cw; if (k / 12 <= gp * 1.2) E.pencilStroke(g, [[x, G.gy0], [x, G.gy1]], { color: P.inkSoft, width: 1, progress: clamp(gp * 1.3 - k * .02), passes: 1, seed: k, wobble: .2 }); }
  for (let k = 0; k <= 23; k++) { const y = G.gy0 + k * G.rh; E.pencilStroke(g, [[G.gx0, y], [G.gx1, y]], { color: P.inkSoft, width: 1, progress: clamp(gp * 1.4 - k * .015), passes: 1, seed: 40 + k, wobble: .2 }); }
  g.restore();
  // month numbers + year labels
  if (fade > 0) {
    for (let m = 0; m < 12; m++) E.setType(g, String(m + 1), G.gx0 + (m + .5) * G.cw, G.mY, { size: V ? 15 : 14, align: 'center', color: P.inkSoft, alpha: fade, progress: seg(t, T.grid[0] + m * .04, T.grid[0] + .5 + m * .04) });
    for (let r = 0; r < 23; r++) if (r % 2 === 0 || r === 21) {
      const c = C[r * 12]; if (t < c.t - .05) continue;
      const yy = c.y + c.h / 2 + 6, isRec = r === 21;
      E.setType(g, String(2004 + r), G.x0 - 12, yy, { size: V ? 17 : 15, align: 'right', color: isRec ? P.red : P.inkSoft, weight: isRec ? 500 : 400, alpha: fade });
    }
  }
  // cells: fill on their beat; during the morph they fly to the chart
  for (const c of C) {
    if (t < c.t) continue;
    const fr = t - c.t, col = seqColor(c.v);
    const u = clamp((t - (T.morph[0] + c.i / C.length * (T.morph[1] - T.morph[0] - .7))) / .7);
    if (u >= 1) continue;
    const e = eio(u), cw = colW(), h1 = Math.max(1.2, c.v * L.chart.k);
    const tx = colX(c.i), ty = L.chart.y0 - h1;
    const x = lerp(c.x, tx, e), y = lerp(c.y, ty, e) - Math.sin(e * Math.PI) * 120, w = lerp(c.w, cw - .5, e), hh = lerp(c.h, h1, e);
    const pop = fr < .22 && u <= 0 ? 1 + .25 * Math.sin(fr / .22 * Math.PI) : 1;
    g.save(); g.translate(x + w / 2, y + hh / 2); g.scale(pop, pop);
    g.fillStyle = col; g.beginPath(); g.roundRect(-w / 2, -hh / 2, w, hh, lerp(5, 0, e)); g.fill();
    if (e < .6) { g.globalAlpha = (1 - e / .6) * (.55 + .45 * clamp(1 - c.v / 30)); g.lineWidth = 1; g.strokeStyle = P.ink; g.stroke(); }
    g.restore();
    if (fr < .5 && u <= 0 && c.r >= 15) { g.save(); g.globalAlpha = (1 - fr / .5) * .5; g.strokeStyle = col; g.lineWidth = 1.2; g.strokeRect(c.x - fr * 14, c.y - fr * 14, c.w + fr * 28, c.h + fr * 28); g.restore(); }
  }
  // the pencil taps the newest cell
  const last = C[C.length - 1];
  if (t >= C[0].t - .2 && t <= last.t + .25 && mo <= 0) {
    const f = rowFrac(t), i = Math.floor(f), u = f - i, a = C[i], bb = C[Math.min(C.length - 1, i + 1)];
    const [ax, ay] = cellC(a), [bx, by] = cellC(bb);
    const hop = a.r === bb.r ? 14 : 40;
    tips.push([lerp(ax, bx, u), lerp(ay, by, u) - Math.sin(u * Math.PI) * hop]);
  }
  // summer oval (June–August, 2021–2024)
  const sp = seg(t, T.n2 - .9, T.n2 - .1);
  if (sp > 0 && t < b(49.5)) {
    const x0 = C[5].x - 6, x1 = C[7].x + C[7].w + 6, y0 = C[17 * 12].y - 6, y1 = C[20 * 12].y + C[20 * 12].h + 6;
    const cx = (x0 + x1) / 2, cyy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 8, ry = (y1 - y0) / 2 + 10, path = [];
    for (let i = 0; i <= 48; i++) { const a = -2.1 + i / 48 * Math.PI * 2.12; path.push([cx + Math.cos(a) * rx * (1 + .04 * Math.sin(i)), cyy + Math.sin(a) * ry]); }
    const tp = E.pencilStroke(g, path, { color: P.blue, width: 2.2, progress: sp, passes: 1, seed: 6 });
    if (sp < 1) tips.push(tp);
  }
}
function drawChart(g, t, cam, tips) {
  const ch = L.chart, mo = seg(t, ...T.morph);
  // settled columns
  for (const c of C) {
    const u = clamp((t - (T.morph[0] + c.i / C.length * (T.morph[1] - T.morph[0] - .7))) / .7);
    if (u < 1) continue;
    const h1 = Math.max(1.2, c.v * ch.k);
    g.fillStyle = seqColor(c.v); g.fillRect(colX(c.i), ch.y0 - h1, colW() - .5, h1);
  }
  // top line in ink once all columns landed
  const lp = seg(t, T.morph[1] - .3, T.morph[1] + .5);
  if (lp > 0) {
    const pts = C.map(c => [colX(c.i) + colW() / 2, cy(c.v)]);
    E.inkLine(g, pts.slice(0, Math.max(2, Math.floor(pts.length * lp))), { width: 1.6, color: P.ink, alpha: .85 });
  }
  // axes
  const ap = seg(t, ...T.yaxis);
  if (mo > 0) E.pencilStroke(g, [[ch.x0 - 4, ch.y0], [ch.x1 + 6, ch.y0]], { color: P.ink, width: 1.8, progress: clamp(mo * 1.4), passes: 1, wobble: .2 });
  if (ap > 0) {
    const tp = E.pencilStroke(g, [[ch.x0 - 12, ch.y0], [ch.x0 - 12, cy(108)]], { color: P.ink, width: 2, progress: ap, seed: 2, passes: 1, wobble: .2 });
    if (ap < 1) tips.push(tp);
    for (const v of [0, 50, 100]) if (ap > (v + 4) / 108) {
      E.pencilStroke(g, [[ch.x0 - 21, cy(v)], [ch.x0 - 12, cy(v)]], { color: P.ink, width: 1.5, passes: 1 });
      E.setType(g, String(v), ch.x0 - 26, cy(v) + 7, { size: 19, align: 'right', color: P.inkSoft });
    }
    E.setType(g, '100 = tháng cao nhất (8/2025)', ch.x0 - 2, cy(108) + 4, { size: 18, color: P.inkSoft, progress: seg(t, T.yaxis[0] + .4, T.yaxis[1] + .4) });
  }
  if (mo > .3) for (const yr of [2004, 2008, 2012, 2016, 2020, 2024]) {
    const i = (yr - 2004) * 12, x = colX(i);
    if (mo < .3 + i / C.length * .7) continue;
    E.pencilStroke(g, [[x, ch.y0], [x, ch.y0 + 9]], { color: P.ink, width: 1.3, passes: 1 });
    E.setType(g, String(yr), x, ch.y0 + 32, { size: 18, align: 'center', color: P.inkSoft });
  }
  // reference levels: average 2019 and average 2025, dashed from their twelve columns back to the bracket
  const rp = seg(t, ...T.refs), bx = brX();
  if (rp > 0 && t < b(66)) {
    for (const [yr, v] of [[2019, 23.1], [2025, 77.3]]) drawDashed(g, bx, colX((yr - 2004) * 12 + 12), cy(v), rp, P.ink);
  }
  const bp = seg(t, ...T.bracket);
  if (bp > 0 && t < b(66)) {
    const x = bx, ya = cy(77.3), yb = cy(23.1), m = (ya + yb) / 2;
    const path = [[x + 9, yb], ...E.quadPath([x + 9, yb], [x, yb], [x, yb - 9], 4).slice(1), [x, m + 8], [x - 9, m], [x, m - 8], [x, ya + 9], ...E.quadPath([x, ya + 9], [x, ya], [x + 9, ya], 4).slice(1)];
    const tp = E.pencilStroke(g, path, { color: P.red, width: 2.4, progress: bp, passes: 1 });
    if (bp < 1) tips.push(tp);
  }
}
function drawDashed(g, x0, x1, y, p, col) {
  const n = Math.floor((x1 - x0) / 12), m = Math.ceil(n * p);
  for (let i = 0; i < m; i++) E.pencilStroke(g, [[x0 + i * 12, y], [x0 + i * 12 + 7, y]], { color: col, width: 1.6, passes: 1, wobble: .1, seed: i });
}
function drawWaffles(g, t, cam, tips) {
  const ap = seg(t, T.pan[0], T.pan[1]);
  if (ap <= 0) return;
  const counts = [87, 33], spans = [T.waf1, T.waf2], cols = [P.blue, P.graphite];
  for (const w of [0, 1]) {
    for (let k = 0; k < 100; k++) {
      const [x, y, s] = wafCell(w, k), filled = k < counts[w];
      const tk = lerp(spans[w][0], spans[w][1], k / Math.max(1, counts[w] - 1));
      // empty outline: drawn as the pan lands
      g.save(); g.globalAlpha *= .5 * clamp(ap * 1.5 - k * .004); g.strokeStyle = P.inkSoft; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, s - 1, s - 1); g.restore();
      if (filled && t >= tk) {
        const fr = t - tk, pop = fr < .2 ? 1 + .3 * Math.sin(fr / .2 * Math.PI) : 1;
        g.save(); g.translate(x + s / 2, y + s / 2); g.scale(pop, pop); g.fillStyle = cols[w]; g.globalAlpha *= w ? .55 : .92;
        g.beginPath(); g.roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4, 4); g.fill(); g.restore();
      }
    }
    const last = Math.min(counts[w] - 1, Math.floor(seg(t, ...spans[w]) * (counts[w] - 1)));
    if (t >= spans[w][0] && t <= spans[w][1] + .1) { const [x, y, s] = wafCell(w, last); tips.push([x + s / 2, y + s / 2 - 10]); }
  }
  // small mono legends under each waffle
  const yb = L.waf.y + wafSide() + 34;
  E.setType(g, '1 ô = 1 người', wafCell(0, 0)[0], yb, { size: 19, color: P.inkSoft, progress: seg(t, T.waf1[0], T.waf1[0] + .6) });
  E.setType(g, 'lên mạng bằng thiết bị này', wafCell(1, 0)[0] + wafSide(), yb, { size: 19, color: P.inkSoft, align: 'right', progress: seg(t, T.waf2[0], T.waf2[0] + .6) });
}
function pinPath(cx, cy, s) {                          // a map pin: round head, pointed foot at (cx, cy)
  const out = [], R = s * .5, hy = cy - s * 1.0;
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (0.78 + i / 40 * 1.44); out.push([cx + Math.cos(a) * R, hy + Math.sin(a) * R]); }
  out.push([cx, cy]); out.push(out[0]); return out;
}
function starPath(cx, cy, r) {
  const out = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return out;
}
function drawMap(g, t, cam, tips) {
  if (t > T.expand[1] + .1) return;
  const mg = mapGeom(), { gx0, gx1, gy0, gy1 } = G, sc = V ? 1 : .9;
  // streets (pencil, soft): two avenues, a curve, a few side streets
  const st = [
    [[gx0, gy0 + (gy1 - gy0) * .32], [gx1, gy0 + (gy1 - gy0) * .27]],
    [[gx0 + (gx1 - gx0) * .3, gy0], [gx0 + (gx1 - gx0) * .38, gy1]],
    E.quadPath([gx0, gy1 - (gy1 - gy0) * .22], [gx0 + (gx1 - gx0) * .6, gy0 + (gy1 - gy0) * .55], [gx1, gy0 + (gy1 - gy0) * .62], 20),
    [[gx0 + (gx1 - gx0) * .72, gy0], [gx0 + (gx1 - gx0) * .66, gy0 + (gy1 - gy0) * .45]],
    [[gx0, gy0 + (gy1 - gy0) * .78], [gx0 + (gx1 - gx0) * .5, gy0 + (gy1 - gy0) * .86]],
    [[gx0 + (gx1 - gx0) * .82, gy0 + (gy1 - gy0) * .6], [gx0 + (gx1 - gx0) * .9, gy1]],
  ];
  const sp = seg(t, ...T.streets);
  st.forEach((p, i) => { const pr = clamp(sp * st.length - i); if (pr > 0) { const tp = E.pencilStroke(g, p, { color: P.inkSoft, width: i < 2 ? 5 : 3, progress: pr, passes: 1, seed: 70 + i, alpha: .45, wobble: .4 }); if (pr < 1) tips.push(tp); } });
  // the hungry guest: a blue dot with a dashed "nearby" radius
  if (t >= T.user) {
    const rp = seg(t, ...T.ring);
    if (rp > 0) {
      const n = 46, m = Math.ceil(n * rp);
      for (let i = 0; i < m; i++) { const a0 = i / n * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI * 2 / n * .55; E.pencilStroke(g, [[mg.mx + Math.cos(a0) * mg.R, mg.my + Math.sin(a0) * mg.R], [mg.mx + Math.cos((a0 + a1) / 2) * mg.R, mg.my + Math.sin((a0 + a1) / 2) * mg.R], [mg.mx + Math.cos(a1) * mg.R, mg.my + Math.sin(a1) * mg.R]], { color: P.blue, width: 1.8, passes: 1, seed: i }); }
      g.save(); g.globalAlpha *= .07 * rp; g.fillStyle = P.blue; g.beginPath(); g.arc(mg.mx, mg.my, mg.R, 0, Math.PI * 2); g.fill(); g.restore();
      if (rp < 1) tips.push([mg.mx + Math.cos(rp * Math.PI * 2 - Math.PI / 2) * mg.R, mg.my + Math.sin(rp * Math.PI * 2 - Math.PI / 2) * mg.R]);
    }
    E.dataDot(g, mg.mx, mg.my, 10 * sc, P.blue, { fresh: t - T.user, ring: '#FFFFFF', ringW: 3 });
  }
  // three restaurants inside the radius (fictional names)
  mg.pins.forEach(([x, y, name], i) => {
    const t0 = T.pins[i]; if (t < t0) return;
    const fr = t - t0, s = 46 * sc * (fr < .25 ? 1 + .3 * Math.sin(fr / .25 * Math.PI) : 1);
    E.inkShape(g, pinPath(x, y, s), { fill: '#EFE6D8', hatch: .3, progress: 1, seed: 20 + i, width: 1.8 });
    E.dataDot(g, x, y - s * 1.0, 6 * sc, P.paper, { fresh: 9, ring: P.ink, ringW: 1.4, ripple: 0 });
    const lw = 15 * sc * name.length * .62 + 22;
    g.save(); g.globalAlpha *= clamp(fr / .3); g.fillStyle = '#FBF9F4'; g.strokeStyle = P.inkSoft; g.lineWidth = 1;
    g.beginPath(); g.roundRect(x + s * .45, y - s * 1.35, lw, 30 * sc, 6); g.fill(); g.stroke(); g.restore();
    E.setType(g, name, x + s * .45 + 11, y - s * 1.35 + 21 * sc, { size: 16 * sc, font: 'IBM Plex Mono', weight: 500, color: P.ink, alpha: clamp(fr / .3) });
  });
  // your restaurant: a dashed pin outside the radius… then it moves to the top as the sponsored result
  if (t >= T.ghost[0]) {
    const mv = eio(seg(t, ...T.move)), gx = lerp(mg.ghost[0], mg.ghostIn[0], mv), gy = lerp(mg.ghost[1], mg.ghostIn[1], mv) - Math.sin(mv * Math.PI) * 50;
    const s = 54 * sc, path = pinPath(gx, gy, s), gp = seg(t, ...T.ghost);
    if (t < T.mint) {
      const R = E.resample(path, 2), end = R.total * gp;
      for (let i = 1; i < R.pts.length; i++) { if (R.len[i] > end) break; if (R.len[i] % 16 < 9) { g.strokeStyle = P.red; g.lineWidth = 2; g.beginPath(); g.moveTo(...R.pts[i - 1]); g.lineTo(...R.pts[i]); g.stroke(); } }
      if (gp < 1) tips.push(R.pts[Math.min(R.pts.length - 1, Math.floor(gp * (R.pts.length - 1)))]);
    } else {
      const fr = t - T.mint, k = fr < .25 ? 1 + .35 * Math.sin(fr / .25 * Math.PI) : 1;
      E.inkShape(g, pinPath(gx, gy, s * k), { fill: ACC, hatch: .35, progress: 1, seed: 31, width: 2 });
      E.dataDot(g, gx, gy - s * k, 7.5 * sc, P.paper, { fresh: 9, ring: P.ink, ringW: 1.5, ripple: 0 });
      if (t >= T.tag) {
        const a = clamp((t - T.tag) / .3), tw = 132 * sc;
        g.save(); g.globalAlpha *= a; g.fillStyle = NAVY; g.beginPath(); g.roundRect(gx - tw - s * .5, gy - s * 1.45, tw, 30 * sc, 6); g.fill(); g.restore();
        E.setType(g, 'Gesponsert', gx - tw / 2 - s * .5, gy - s * 1.45 + 21 * sc, { size: 16 * sc, font: 'IBM Plex Mono', weight: 500, color: ACC, align: 'center', alpha: a });
      }
      // local SEO: stars, photos, opening hours drawn around the pin
      const sp2 = seg(t, ...T.stars);
      for (let i = 0; i < 5; i++) {
        const pr = clamp(sp2 * 8 - i); if (pr <= 0) continue;
        const sx = gx + s * .55 + i * 22 * sc, sy = gy - s * .55;
        g.save(); g.globalAlpha *= pr; g.fillStyle = AMBER; g.beginPath(); starPath(sx, sy, 9 * sc).forEach((p, j) => j ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill(); g.restore();
        if (pr < 1) tips.push([sx, sy]);
      }
      const ph = clamp(sp2 * 8 - 5.5);
      if (ph > 0) for (let i = 0; i < 3; i++) { const px = gx + s * .55 + i * 36 * sc, py = gy - s * .2; E.pencilStroke(g, [[px, py], [px + 30 * sc, py], [px + 30 * sc, py + 24 * sc], [px, py + 24 * sc], [px, py]], { color: P.ink, width: 1.4, progress: clamp(ph * 3 - i), passes: 1, seed: 50 + i }); }
      const ck = clamp(sp2 * 8 - 7);
      if (ck > 0) { const cx = gx + s * .55 + 120 * sc, cyy = gy - s * .2 + 12 * sc; E.pencilStroke(g, E.ringPath(cx, cyy, 11 * sc, 4, 1.02), { color: P.ink, width: 1.5, progress: ck, passes: 1 }); E.pencilStroke(g, [[cx, cyy - 7 * sc], [cx, cyy], [cx + 5 * sc, cyy + 3 * sc]], { color: P.ink, width: 1.5, progress: ck, passes: 1 }); }
    }
  }
}
// the "nearby" radius widens until it is the whole frame: the end card lives inside it
function drawExpand(g, t, cam) {
  const p = seg(t, ...T.expand);
  if (p <= 0 || t > T.expand[1] + .1) return;
  const mg = mapGeom(), r = lerp(mg.R, 2600, eio(p));
  g.save(); g.fillStyle = NAVY; g.beginPath(); g.arc(mg.mx, mg.my, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = ACC; g.lineWidth = 3; g.globalAlpha = 1 - p; g.beginPath(); g.arc(mg.mx, mg.my, r, 0, Math.PI * 2); g.stroke(); g.restore();
}

// ---------- the pencil ----------
function drawThePencil(g, t, cam, tips) {
  if (t > T.breath[0] + 1.5) return;
  let tip = tips.length ? tips[tips.length - 1] : null, lift;
  if (!tip) { tip = hoverPoint(t); lift = .55 + .08 * Math.sin(t * 1.7); }
  else lift = .05 + .04 * Math.abs(Math.sin(t * 9));
  // hesitation over the record month: hover, tremble
  if (t >= T.hush1[0] && t < T.aug) { const c = cellC(C[21 * 12 + 7]); tip = [c[0] + Math.sin(t * 40) * 1.5, c[1] - 30]; lift = .35 + .05 * Math.sin(t * 13); }
  let S = E.w2s(cam, tip[0], tip[1]);
  const ex = seg(t, T.breath[0], T.breath[0] + 1.2);
  if (ex > 0) { S = [lerp(S[0], E.W + 400, eio(ex)), lerp(S[1], E.H + 300, eio(ex))]; lift = lerp(lift, 1.0, ex); }
  E.drawPencil(g, { tip: S, s: (V ? .56 : .6) * Math.min(1.3, Math.max(.85, cam.zoom * .8)), lift, flip: pencilFlip(t), ang: V ? .9 : .62 });
}
function hoverPoint(t) {
  const mg = mapGeom();
  if (t < T.dotTap) return [G.sx1 - 60, G.sy1 + 40];
  if (t < T.phone[0]) return [G.x1 - 40, G.y0 + 80];
  if (t < T.morph[0]) { const c = C[Math.min(C.length - 1, Math.floor(rowFrac(t)))]; return [c.x + 30, c.y - 20]; }
  if (t < T.pan[0]) return [L.chart.x1 - 60, cy(60)];
  if (t < T.back[0]) return [L.waf.x + 120, L.waf.y + wafSide() + 60];
  return [mg.mx + mg.R * .6, mg.my + mg.R * 1.4];
}
function pencilFlip(t) {                              // 0 = blue end, 1 = red end; a lead change marks a turn
  const k = [[0, 0], [T.flipRed, 0], [T.flipRed + .3, 1], [b(49), 1], [b(49.5), 0], [b(81), 0], [b(81.5), 1], [b(92.6), 1], [b(93.1), 1], [b(104.4), 1], [b(104.9), 0], [200, 0]];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], eio(seg(t, k[i][0], k[i + 1][0])));
  return 0;
}

// ---------- captions (figure caption = the storyteller) ----------
function capWords(c) { const ws = c.text.split(' '); return ws.map((w, i) => ({ w, t: c.t0 + .15 + i * Math.min(.09, 1.4 / ws.length) })); }
function capLayout(g, c) {
  const k = L.cap; g.save(); g.font = `400 ${k.size}px Newsreader`;
  const lines = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const wd of c.text.split(' ')) { const ww = g.measureText(wd).width; if (lw + ww > k.maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(ww); lw += ww + sp; }
  const lh = k.size * 1.22, maxLine = Math.max(...lines.map(l => l.reduce((a, bb) => a + bb + sp, -sp)));
  g.restore(); return { n: lines.length, lh, maxLine };
}
function capY(g, c) { const k = L.cap; if (!k.col) return k.y; const lay = capLayout(g, c); return k.y + (lay.n - 1) * lay.lh; }
function drawCaption(g, c, t) {
  if (t >= c.t0 && t <= c.t1 + .3) {
    const lay = capLayout(g, c), y = capY(g, c), top = y - (lay.n - 1) * lay.lh - L.cap.size * 2.1;
    const al = clamp((t - c.t0) / .2) * (1 - clamp((t - c.t1) / .3));
    g.save(); g.globalAlpha = .97 * al;
    const x0 = L.cap.col ? L.cap.x - 40 : 0, x1 = E.W, y1 = L.cap.col ? y + L.cap.size : E.H;
    const gr = g.createLinearGradient(0, top - 40, 0, top); gr.addColorStop(0, 'rgba(246,243,236,0)'); gr.addColorStop(1, 'rgba(246,243,236,1)');
    g.fillStyle = gr; g.fillRect(x0, top - 40, x1 - x0, 40); g.fillStyle = P.paper; g.fillRect(x0, top, x1 - x0, y1 - top + 30);
    g.restore();
  }
  E.caption(g, capWords(c), t, { x: L.cap.x, y: capY(g, c), size: L.cap.size, maxW: L.cap.maxW, kicker: c.kicker, t0: c.t0, t1: c.t1 });
}
function srcLines(g, s) {
  const k = L.src; g.save(); g.font = `400 ${k.size}px "IBM Plex Mono"`;
  const out = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const w of s.split(' ')) { const ww = g.measureText(w).width; if (lw + ww > k.maxW && out[out.length - 1].length) { out.push([]); lw = 0; } out[out.length - 1].push(w); lw += ww + sp; }
  g.restore(); return out.map(l => l.join(' '));
}
function drawSource(g, s, a) {
  const k = L.src, ls = srcLines(g, s);
  g.save(); g.globalAlpha = .85 * a; g.fillStyle = P.paper; g.fillRect(k.x - 12, k.y - k.size - 6, k.maxW + 24, ls.length * k.size * 1.35 + 10); g.restore();
  ls.forEach((ln, i) => E.setType(g, ln, k.x, k.y + i * k.size * 1.35, { size: k.size, color: P.inkSoft, alpha: a }));
}

// ---------- end card (SAMI colours inside the widened "nearby" radius) ----------
function endGeom() {
  const W = E.W;
  return V ? { cx: W / 2, logoY: 520, logoW: 640, tagY: 760, h1: [900, 990, 1080], h1s: 78, ctaY: [1210, 1262], ctaS: 38, pillY: 1340, urlY: 1490 }
           : { cx: W / 2, logoY: 150, logoW: 560, tagY: 370, h1: [490], h1s: 70, ctaY: [600], ctaS: 34, pillY: 660, urlY: 820 };
}
const H1 = ['Thêm khách.', 'Thêm doanh thu.', 'Thêm thời gian.'];
const CTA = vv => vv ? ['Nhắn WhatsApp cho SAMI, nhận phân tích', 'marketing miễn phí, không ràng buộc.'] : ['Nhắn WhatsApp cho SAMI, nhận phân tích marketing miễn phí, không ràng buộc.'];
function drawEndCard(g, t) {
  const W = E.W, H = E.H, k = endGeom(), a0 = seg(t, T.expand[1] - .05, T.expand[1] + .1);
  if (a0 <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = NAVY; g.fillRect(0, 0, W, H);
  g.globalAlpha = .06; E.drawPaper(g, { x: 0, y: 0, zoom: 1 }, { dots: 0 }); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.fillStyle = NAVY; g.globalAlpha = .9; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const gl = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(12,6,40,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1; };
  gl(W * .8, H * .2, W * .6, 'rgba(118,103,254,.33)', 1); gl(W * .15, H * .85, W * .55, 'rgba(8,221,164,.16)', 1);
  // the "nearby" rings keep breathing behind the logo (pencil, mint, faint)
  for (let i = 0; i < 3; i++) { const r = (V ? 300 : 260) + i * (V ? 70 : 60) + ((t - T.end) * 22) % (V ? 70 : 60); g.save(); g.globalAlpha = .1 * (1 - i / 3); E.pencilStroke(g, E.ringPath(k.cx, k.logoY, r, 7 + i, 1.0), { color: ACC, width: 1.5, passes: 1 }); g.restore(); }
  const e = s => eo(seg(t, T.end + s, T.end + s + .5));
  if (logo) { const lw = k.logoW, lh = lw * 1024 / 3120, a = e(0); g.globalAlpha = a; g.drawImage(logo, k.cx - lw / 2, k.logoY - lh / 2 + (1 - a) * 18, lw, lh); g.globalAlpha = 1; }
  txt(g, 'STRATEGY • AUTOMATION • MARKETING • INTELLIGENCE', k.cx, k.tagY, { size: V ? 22 : 20, weight: 600, color: LAV, a: e(.3) * .85, track: V ? 3 : 4 });
  if (V) H1.forEach((s, i) => txt(g, s, k.cx, k.h1[i], { size: k.h1s, weight: 800, color: i === 0 ? ACC : '#FFFFFF', a: e(.5 + i * .25) }));
  else txt(g, H1.join(' '), k.cx, k.h1[0], { size: k.h1s, weight: 800, color: '#FFFFFF', a: e(.5) });
  const ul = seg(t, T.end + 1.4, T.end + 2.0);
  if (ul > 0) { const yU = (V ? k.h1[0] : k.h1[0]) + 22, w = V ? 400 : 1100, x0 = V ? k.cx - w / 2 : k.cx - w / 2; E.pencilStroke(g, E.quadPath([x0, yU + 4], [x0 + w / 2, yU + 12], [x0 + w, yU]), { color: ACC, width: 5, progress: ul, passes: 2, seed: 21 }); }
  CTA(V).forEach((s, i) => txt(g, s, k.cx, k.ctaY[i], { size: k.ctaS, weight: 400, color: LAV, a: e(1.4 + i * .15) }));
  const pa = e(1.8), pop = pa < 1 ? .9 + .1 * pa : 1;
  drawPill(g, k.cx, k.pillY + (V ? 44 : 40), pop, pa);
  txt(g, 'sami-agency.de  ·  phản hồi trong 24 giờ', k.cx, k.urlY, { size: V ? 34 : 30, weight: 600, color: '#FFFFFF', a: e(2.2) });
  g.restore();
}
function drawPill(g, cx, cyy, s, a) {
  const w = (V ? 640 : 600) * s, h = (V ? 104 : 92) * s;
  g.save(); g.globalAlpha = a;
  g.fillStyle = ACC; g.beginPath(); g.roundRect(cx - w / 2, cyy - h / 2, w, h, h / 2); g.fill();
  const bx = cx - w / 2 + h * .62, by = cyy, r = h * .3;
  g.fillStyle = NAVY; g.beginPath(); g.arc(bx, by - 2, r, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(bx - r * .75, by + r * .45); g.lineTo(bx - r * 1.05, by + r * 1.15); g.lineTo(bx - r * .1, by + r * .9); g.closePath(); g.fill();
  g.fillStyle = ACC; [-.42, 0, .42].forEach(d => { g.beginPath(); g.arc(bx + d * r, by - 2, r * .13, 0, Math.PI * 2); g.fill(); });
  g.restore();
  txt(g, '+49 155 60456888', cx + h * .3, cyy + (V ? 15 : 13), { size: V ? 46 : 40, weight: 700, color: NAVY, a });
}
function txt(g, s, x, y, o) {
  g.save(); g.font = `${o.weight} ${o.size}px "Be Vietnam Pro"`; g.fillStyle = o.color; g.globalAlpha = o.a ?? 1; g.textAlign = 'center';
  if (o.track) g.letterSpacing = `${o.track}px`;
  g.fillText(s, x, y + (1 - (o.a ?? 1)) * 14); g.restore();
}

// ---------- TEXTS for readcheck (full text from the first visible frame, screen boxes) ----------
export function texts(t) {
  const cam = camAt(t), out = [], g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  const box = (id, text, bb) => { const a = E.w2s(cam, bb[0], bb[1]), c = E.w2s(cam, bb[2], bb[3]); out.push({ id, text, x0: Math.min(a[0], c[0]), y0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), y1: Math.max(a[1], c[1]) }); };
  const qs = V ? 34 : 30, qx = G.sx0 + 26, qy = (G.sy0 + G.sy1) / 2 + qs * .32, w0 = E.measureHand(g, 'in der Nähe', qs, 400, 'Patrick Hand');
  if (t >= T.write[0] && t < T.strike[0]) box('query', 'in der Nähe', [qx, qy - qs * .85, qx + w0, qy + qs * .3]);
  if (t >= T.rewrite[0] && t < T.expand[0]) box('query2', 'Restaurant in der Nähe', [qx + w0 + 14, qy - qs * .85, qx + w0 + 14 + E.measureHand(g, 'Restaurant in der Nähe', qs * .64, 400, 'Patrick Hand'), qy + qs * .3]);
  if (t >= T.head[0] && t < T.crane[0] + .4) {
    const h = L.head; g.font = `600 ${h.size}px Newsreader`; const wA = g.measureText(HEAD[0]).width;
    box('head', HEAD.join(' '), [h.x, h.y1 - h.size * .85, h.x + wA, h.y2 + h.size * .25]);
  }
  for (const nt of notes()) if (t >= nt.t0 && t <= nt.t1) box(nt.id, nt.lines.join(' '), noteBox(nt));
  for (const c of CAPS) if (t >= c.t0 && t <= c.t1) {
    const lay = capLayout(g, c), y = capY(g, c), top = y - (lay.n - 1) * lay.lh;
    out.push({ id: c.id, text: c.text, x0: L.cap.x, y0: top - L.cap.size, x1: L.cap.x + lay.maxLine, y1: y + L.cap.size * .3 });
  }
  const src = (id, s, a0, a1) => { if (t >= a0 && t < a1) { const k = L.src, n = srcLines(g, s).length; out.push({ id, text: s, x0: k.x, y0: k.y - k.size, x1: k.x + k.maxW, y1: k.y + (n - 1) * k.size * 1.35 + 6 }); } };
  src('src1', SRC1, b(11.2), b(65.8)); src('src2', SRC2, b(67.2), b(79.8)); src('src3', SRC3, b(88), b(117.3));
  if (t >= T.pins[2] + .3 && t < T.expand[0]) {
    const mg = mapGeom();
    mg.pins.forEach(([x, y, name], i) => box('pin' + i, name, [x + 20, y - 70, x + 40 + name.length * 10, y - 40]));
  }
  if (t >= T.end + .5) {
    const k = endGeom(), W = E.W;
    out.push({ id: 'endH1', text: H1.join(' '), x0: W * .05, y0: k.h1[0] - 80, x1: W * .95, y1: (V ? k.h1[2] : k.h1[0]) + 20 });
    out.push({ id: 'endCTA', text: CTA(V).join(' '), x0: W * .05, y0: k.ctaY[0] - 40, x1: W * .95, y1: k.ctaY[k.ctaY.length - 1] + 12 });
    out.push({ id: 'endWA', text: '+49 155 60456888', x0: W * .2, y0: k.pillY, x1: W * .8, y1: k.pillY + 90 });
    out.push({ id: 'endURL', text: 'sami-agency.de · phản hồi trong 24 giờ', x0: W * .1, y0: k.urlY - 34, x1: W * .9, y1: k.urlY + 10 });
  }
  return out;
}

// ---------- events (sound / cues) ----------
export function buildEvents() {
  const ev = [];
  ev.push({ t: T.box[0], type: 'scratch', d: T.box[1] - T.box[0] }, { t: T.write[0], type: 'write', d: T.write[1] - T.write[0] });
  ev.push({ t: T.mag[0], type: 'scratch', d: .25 }, { t: T.dotTap, type: 'tapdot' }, { t: T.fall[1], type: 'drop' });
  ev.push({ t: T.phone[0], type: 'draw', d: T.phone[1] - T.phone[0] });
  ev.push({ t: T.grid[0], type: 'ruler', d: T.grid[1] - T.grid[0] }, { t: T.head[0], type: 'type', d: .9 });
  for (const c of C) ev.push({ t: c.t, type: 'dot', v: c.v, i: c.i, r: c.r, m: c.m });
  for (const nt of notes()) ev.push({ t: nt.t0, type: 'write', d: nt.dur });
  ev.push({ t: T.n2 - .9, type: 'scratch', d: .8 });
  ev.push({ t: T.flipRed + .05, type: 'flip' }, { t: b(49.1), type: 'flip' }, { t: b(81.1), type: 'flip' }, { t: b(104.5), type: 'flip' });
  ev.push({ t: T.hush1[0], type: 'silence', d: T.hush1[1] - T.hush1[0] }, { t: T.aug, type: 'punch' });
  ev.push({ t: T.morph[0], type: 'sweep', d: T.morph[1] - T.morph[0] }, { t: T.crane[0], type: 'whoosh', d: .9 });
  for (let i = 0; i < C.length; i += 4) ev.push({ t: T.morph[0] + i / C.length * (T.morph[1] - T.morph[0] - .7) + .7, type: 'land', v: C[i].v, i });
  ev.push({ t: T.yaxis[0], type: 'ruler', d: 1.0 }, { t: T.refs[0], type: 'ruler', d: .6 }, { t: T.bracket[0], type: 'scratch', d: .6 });
  ev.push({ t: T.pan[0], type: 'whoosh', d: .9 });
  for (let k = 0; k < 87; k++) ev.push({ t: lerp(T.waf1[0], T.waf1[1], k / 86), type: 'unit', w: 0, k });
  for (let k = 0; k < 33; k++) ev.push({ t: lerp(T.waf2[0], T.waf2[1], k / 32), type: 'unit', w: 1, k });
  ev.push({ t: T.hush2[0], type: 'silence', d: T.hush2[1] - T.hush2[0] }, { t: T.hush2[1], type: 'whoosh', d: .9 });
  ev.push({ t: T.strike[0], type: 'strike', d: .5 }, { t: T.rewrite[0], type: 'write', d: T.rewrite[1] - T.rewrite[0] }, { t: T.streets[0], type: 'draw', d: T.streets[1] - T.streets[0] });
  ev.push({ t: T.user, type: 'pop', v: .5 }, { t: T.ring[0], type: 'tick', d: T.ring[1] - T.ring[0] });
  for (const tp of T.pins) ev.push({ t: tp, type: 'pin' });
  ev.push({ t: T.ghost[0], type: 'scratch', d: T.ghost[1] - T.ghost[0] });
  ev.push({ t: T.move[0], type: 'whoosh', d: .6 }, { t: T.mint, type: 'pin', big: 1 }, { t: T.tag, type: 'tap' }, { t: T.stars[0], type: 'stars', d: T.stars[1] - T.stars[0] });
  ev.push({ t: T.breath[0], type: 'silence', d: T.breath[1] - T.breath[0] });
  ev.push({ t: T.expand[0], type: 'ink', d: T.expand[1] - T.expand[0] }, { t: T.end, type: 'logo' }, { t: T.end + 1.8, type: 'pop', v: 1 }, { t: T.end + 1.4, type: 'scratch', d: .6 });
  return ev.sort((a, c) => a.t - c.t);
}
