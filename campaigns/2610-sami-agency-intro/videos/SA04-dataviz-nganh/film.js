// SA04 · "Ngành nhà hàng Đức: mỗi vị khách đều phải giành lấy" — lemo-opuscar dataviz style.
// One sheet of paper, one take. Every dot is a real month (Eurostat sts_setu_m, DE, I56, SCA; Destatis data).
import * as E from './engine.js';
import { clamp, lerp, seg, eio, eo, hash, monotone } from '/core/lib.js';
const { P } = E;

export const BEAT = 0.8;                     // 75 BPM; a 16th = 0.2 s = 6 frames at 30 fps
export const DUR = 89.6;
const ACC = '#08DDA4';                       // the one accent (SAMI mint), never data
const NAVY = '#0C0628', PURPLE = '#7667FE', LAV = '#E3E4F7';

let D, L, V, logo;                           // data, layout, vertical?, logo image
const M = [];                                // months: {i, ym, real, nom, x, y, yn, t}
export function setup(data, w, h, logoImg) {
  D = data; V = h > w; logo = logoImg; E.setSize(w, h);
  L = V ? {
    x0: -430, x1: 380, y0: 330, k: 6.6, dotR: 4.5,
    head: { x: -430, y1: -700, y2: -628, size: 60, oneLine: false }, rev: { x: -430, y: -540, size: 46 },
    cap: { x: 90, y: 1530, size: 40, maxW: 900 }, src: { x: 90, y: 1592, size: 20, maxW: 900 },
    zoomB: 1.9, zoomC: 1.4, yB: -250, yC: -40, card: [-540, -960, 540, 960],
  } : {
    x0: -860, x1: 170, y0: 300, k: 5.0, dotR: 4.6,
    head: { x: -860, y1: -400, y2: -400, size: 54, oneLine: true }, rev: { x: -860, y: -335, size: 42 },
    cap: { x: 1290, y: 560, size: 38, maxW: 560, col: true }, src: { x: 100, y: 1000, size: 19, maxW: 1700 },
    zoomB: 1.7, zoomC: 1.3, yB: -150, yC: 30, card: [-960, -540, 960, 540],
  };
  M.length = 0;
  const n = D.months.length, xw = L.x1 - L.x0;
  D.months.forEach((ym, i) => M.push({ i, ym, real: D.real[i], nom: D.nominal[i], x: L.x0 + (i + .5) / n * xw, y: yv(D.real[i]), yn: yv(D.nominal[i]), t: dotTime(i) }));
}
const yv = v => L.y0 - v * L.k;
// when each real-series dot lands (seconds): 2019 one per beat, 2020–21 eighths (with a held beat before April 2020), 2022+ sixteenths
function dotTime(i) {
  if (i < 12) return 8.0 + i * BEAT;
  if (i < 15) return 17.6 + (i - 12) * BEAT;            // 2020-01, -02, -03 (the drop)
  if (i === 15) return 20.8;                            // April 2020, after one beat of silence
  if (i < 36) return 21.6 + (i - 16) * .4;              // 2020-05 … 2021-12
  return 29.6 + (i - 36) * .2;                          // 2022-01 … 2026-07 (last at 40.4)
}
const T = {
  axis: [0, 1.6], head: [.4, 1.6], q: [1.6, 3.4], dive: [7.2, 8.0],
  shock: 19.2, april: 20.8, refLine: [40.8, 41.6], bracket: [41.6, 42.4],
  nom: [42.4, 47.2], nomNote: 47.2, gap: [48.0, 49.6], gapNote: 49.6,
  hush: [53.6, 54.4], push: [53.6, 54.8], strike: [54.8, 55.6], rev: [55.6, 57.6], back: [62.4, 63.2],
  cell: [63.0, 63.8], cellNote: 63.8, widen: [67.2, 68.8], cardText: 68.8, icons: [69.6, 71.6], breath: [76.0, 77.2],
  navy: [77.2, 78.0], end: 78.0,
};
const Y_NOTE = id => ({});

// ---------- texts (Vietnamese; storytelling captions) ----------
const CAPS = [
  { id: 'c1', t0: 8.0, t1: 17.4, kicker: '2019', text: 'Mỗi chấm là một tháng của cả ngành nhà hàng ở Đức: lượng bán thực tế, đã trừ phần tăng giá.' },
  { id: 'c2', t0: 17.6, t1: 29.4, kicker: '2020 → 2021', text: 'Rồi tháng Ba năm 2020 đến. Cả nước đóng cửa, và đường bút chì rơi thẳng xuống.' },
  { id: 'c3', t0: 29.6, t1: 42.2, kicker: '2022 → 7/2026', text: 'Từ 2022 khách quay lại. Nhưng đường kẻ dừng ở khoảng 80, và nằm yên ở đó suốt bốn năm.' },
  { id: 'c4', t0: 42.4, t1: 53.4, kicker: '2019 → 7/2026 · doanh thu tính bằng euro', text: 'Còn doanh thu tính bằng euro thì đã vượt mức 2019: tiền vào két nhiều hơn, vì mỗi món đắt hơn.' },
  { id: 'c5', t0: 54.4, t1: 63.0, kicker: 'nghĩa là', text: 'Khi thị trường không lớn thêm, mỗi vị khách bạn có là một vị khách quán khác không có.' },
];
const SRC = 'Nguồn: Eurostat sts_setu_m, số liệu Destatis · CC BY 4.0 · Gastronomie (WZ 56), đã hiệu chỉnh mùa vụ · 2019 = 100 (tính lại từ 2021 = 100) · số tạm thời, đến 7/2026';

// ---------- camera ----------
function fracIndex(t) {                                  // continuous "where the pencil is" along the series
  if (t <= M[0].t) return 0;
  for (let i = 0; i < M.length - 1; i++) if (t < M[i + 1].t) return i + eio(seg(t, M[i].t, M[i + 1].t));
  return M.length - 1;
}
const xAtIndex = f => { const i = Math.floor(f), u = f - i; return i >= M.length - 1 ? M[M.length - 1].x : lerp(M[i].x, M[i + 1].x, u); };
let zoomK, yK, fullK;
function camKeys() {
  zoomK = monotone([[0, 1.0], [7.2, 1.06], [8.0, L.zoomB], [17.6, L.zoomB * .94], [20.8, L.zoomC], [29.6, L.zoomC * .95], [40.4, 1.0], [53.6, 1.0], [54.8, 1.42], [62.4, 1.42], [63.2, 1.0], [88, 1.0]]);
  yK = monotone([[0, 0], [7.2, -40], [8.0, L.yB], [17.6, L.yB], [20.8, L.yC], [29.6, L.yC], [40.4, 0], [53.6, 0], [54.8, V ? -520 : -330], [62.4, V ? -520 : -330], [63.2, 0], [88, 0]]);
}
export function camAt(t) {
  if (!zoomK) camKeys();
  let zoom = zoomK(t), y = yK(t);
  const W = E.W, viewW = W / zoom;
  // tracking weight: follow the pencil (newest mark at ~60 % of the width) while the series is being drawn
  const w = seg(t, 7.2, 8.0) * (1 - seg(t, 39.6, 41.2));
  const fx = xAtIndex(fracIndex(t));
  const tipFrac = V ? .6 : .55;
  let xt = fx - (tipFrac - .5) * viewW;
  xt = Math.max(xt, L.x0 - (V ? 95 : 110) + viewW / 2);  // keep the y axis in view
  const xFull = 0, xHead = V ? -170 : -300;
  let x = lerp(xFull, xt, w);
  x = lerp(x, xHead, seg(t, 53.6, 54.8) * (1 - seg(t, 62.4, 63.2)));
  // punch-in on the March 2020 drop: 2 frames in, decaying shake
  let sx = 0, sy = 0; const pk = t - T.shock;
  if (pk > 0 && pk < 1.2) { const d = Math.exp(-pk * 4.5); zoom *= 1 + .16 * clamp(pk / .066) * d; sx = Math.sin(pk * 61) * 14 * d; sy = Math.cos(pk * 47) * 10 * d; }
  return { x, y, zoom, roll: 0, sx, sy };
}

// ---------- notes (pinned in data space) ----------
// each: id, text lines, anchor month index (for the leader), position in world, colour, write time
let NOTES;
function notes() {
  if (NOTES) return NOTES;
  const ix = ym => D.months.indexOf(ym);
  const apr = M[ix('2020-04')];
  let wi = ix('2020-11'); for (let i = ix('2020-11'); i <= ix('2021-05'); i++) if (M[i].real < M[wi].real) wi = i;   // winter-lockdown low
  const win = M[wi], last = M[M.length - 1], y25 = yv(79.1), y100 = yv(100), n25 = M[ix('2025-12')];
  const s = V ? 1 : .92;
  NOTES = [
    { id: 'q', lines: ['Nếu năm 2019 là 100,', 'hôm nay còn bao nhiêu?'], x: V ? -360 : -700, y: V ? -170 : -110, size: 56 * s, col: P.blue, t0: T.q[0], dur: 1.8, t1: 8.4 },
    { id: 'n1', lines: ['2019: bếp nóng, bàn kín.'], x: V ? -300 : L.x0 + 170, y: y100 - 62, size: 40 * s, col: P.blue, t0: 11.2, dur: 1.2, t1: 17.8, lead: [M[5].x, M[5].y - 10] },
    { id: 'n2', lines: ['4/2020: còn 31'], x: L.x0 + 4, y: yv(14), size: 42 * s, col: P.red, t0: 21.0, dur: .9, t1: 63.2, lead: [apr.x + 2, apr.y + 8], ring: apr },
    { id: 'n3', lines: ['hai mùa đông đóng cửa'], x: V ? win.x - 20 : win.x - 10, y: yv(4), size: 38 * s, col: P.red, t0: 25.6, dur: 1.2, t1: 63.2, lead: [win.x + 1, win.y + 10] },
    { id: 'ref', lines: ['mức 2019'], x: L.x1 - 4, y: y100 - 14, size: 34 * s, col: P.blue, t0: T.refLine[1] - .2, dur: .6, t1: 63.2, align: 'right' },
    { id: 'br', lines: ['−21 %', 'TB 2025 so với 2019'], x: n25.x - 26, y: (y100 + y25) / 2 + 4, size: 44 * s, col: P.red, t0: T.bracket[0] + .2, dur: .8, t1: 63.2, align: 'right', sizes: [44 * s, 28 * s] },
    { id: 'nom', lines: ['doanh thu +7,7 %', '(TB 2025, tính bằng euro)'], x: L.x1 - 4, y: yv(108) - (V ? 52 : 46), size: 38 * s, col: P.blue, t0: T.nomNote, dur: .9, t1: 63.2, align: 'right', sizes: [38 * s, 26 * s] },
    { id: 'gap', lines: ['giá tăng,', 'khách cân nhắc từng bữa'], x: V ? -90 : -330, y: yv(57), size: 42 * s, col: P.blue, t0: T.gapNote, dur: 1.4, t1: 63.2, lead: [V ? 40 : -150, yv(90)] },
  ];
  return NOTES;
}
function noteBox(nt) {                                   // world-space box of a note
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
    const b = noteBox(nt), lp = seg(t, nt.t0 + nt.dur, nt.t0 + nt.dur + .35);
    const from = [nt.lead[0] < b[0] ? b[0] - 6 : nt.lead[0] > b[2] ? b[2] + 6 : (b[0] + b[2]) / 2, nt.lead[1] < b[1] ? b[1] - 4 : b[3] + 2];
    if (nt.lead[1] >= b[1] && nt.lead[1] <= b[3]) from[1] = (b[1] + b[3]) / 2;
    E.leader(g, from, nt.lead, { color: nt.col, progress: lp, seed: hash(nt.t0) * 9 });
    if (nt.ring) E.pencilStroke(g, E.ringPath(nt.ring.x, nt.ring.y, 13, 3), { color: nt.col, width: 1.6, progress: seg(t, nt.t0 + nt.dur + .3, nt.t0 + nt.dur + .7), passes: 1 });
  }
  g.restore();
  return tip;
}

// ---------- main render ----------
export function renderFilm(g, t) {
  const cam = camAt(t), W = E.W, H = E.H;
  E.drawPaper(g, cam, { dots: .9 });
  E.applyCam(g, cam);
  const tips = [];                                       // where the pencil is touching (world)

  // headline (world space): fades while the camera is close, returns with the full view
  const hw = seg(t, 7.2, 8.0) * (1 - seg(t, 39.6, 41.2));
  const headA = 1 - hw;
  drawHeadline(g, t, headA, tips);

  // axes
  const ap = seg(t, ...T.axis);
  E.pencilStroke(g, [[L.x0, L.y0], [L.x0, yv(112)]], { color: P.ink, width: 2, progress: ap, seed: 2, passes: 1, wobble: .2 });
  if (ap > 0 && ap < 1) tips.push([L.x0, lerp(L.y0, yv(112), ap)]);
  for (const v of [0, 50, 100]) if (ap > (v + 5) / 112) {
    E.pencilStroke(g, [[L.x0 - 9, yv(v)], [L.x0, yv(v)]], { color: P.ink, width: 1.5, passes: 1 });
    E.setType(g, String(v), L.x0 - 14, yv(v) + 7, { size: 20, align: 'right', color: P.inkSoft });
  }
  E.setType(g, '2019 = 100', L.x0 + 10, yv(112) + 4, { size: 21, color: P.inkSoft, progress: seg(t, 1.0, 1.8) });
  // x axis grows with the series
  const fi = t < M[0].t ? -1 : fracIndex(t);
  const xEnd = t < M[0].t ? L.x0 : Math.max(L.x0, xAtIndex(fi) + 6);
  if (ap > 0) E.pencilStroke(g, [[L.x0, L.y0], [Math.max(L.x0 + 1, xEnd + (t > T.cell[0] ? 70 : 0) * seg(t, ...T.cell)), L.y0]], { color: P.ink, width: 1.8, passes: 1, wobble: .2 });
  for (const m of M) if (m.ym.endsWith('-01') && t >= m.t - .1) {
    E.pencilStroke(g, [[m.x - 4.5, L.y0], [m.x - 4.5, L.y0 + 9]], { color: P.ink, width: 1.3, passes: 1 });
    E.setType(g, V ? "'" + m.ym.slice(2, 4) : m.ym.slice(0, 4), m.x - 4.5 + (V ? 22 : 26), L.y0 + 32, { size: V ? 20 : 19, align: 'center', color: P.inkSoft });
  }

  // reference line at 100 (dashed pencil)
  const rp = seg(t, ...T.refLine);
  if (rp > 0 && t < 63.2 + .3) drawDashed(g, L.x0, L.x1, yv(100), rp, P.blue);

  // gap between nominal and real (prices) — graphite hatching, no colour
  const gp = seg(t, ...T.gap);
  if (gp > 0) drawGap(g, gp, t);

  // nominal series: a soft-ink line with hollow dots, drawn in one stroke
  const np = seg(t, ...T.nom);
  if (np > 0) {
    const pts = M.map(m => [m.x, m.yn]);
    const tip = E.pencilStroke(g, pts, { color: P.inkSoft, width: 2.2, progress: np, seed: 5, passes: 1, wobble: .15, grain: .25 });
    if (np < 1) tips.push(tip);
    const nShown = Math.floor(np * (M.length - 1) + 1e-6) + 1;
    for (let i = 0; i < nShown; i++) {
      const fr = t - lerp(T.nom[0], T.nom[1], i / (M.length - 1));
      E.dataDot(g, M[i].x, M[i].yn, L.dotR * .72, P.paper, { fresh: fr, ring: P.inkSoft, ringW: 1.3, ripple: 0 });
    }
  }

  // real series: ink line + dots coloured by value on a ramp centred on 2019 (= 100)
  const shown = M.filter(m => t >= m.t);
  if (shown.length) {
    const pts = shown.map(m => [m.x, m.y]);
    const last = shown[shown.length - 1], nx = M[last.i + 1];
    if (nx && t < nx.t) pts.push([lerp(last.x, nx.x, eo(seg(t, last.t, nx.t)) * 0), lerp(last.y, nx.y, 0)]);
    E.inkLine(g, pts, { width: 2.3, color: P.ink });
    const dense = t > 29.6;
    for (const m of shown) E.dataDot(g, m.x, m.y, L.dotR, E.valueColor(m.real, { center: 100, half: 72 }), { fresh: t - m.t, ripple: dense ? 0 : 1, ringW: 1.2 });
  }
  // the pencil taps the newest dot
  if (t >= M[0].t - .3 && t <= M[M.length - 1].t + .3) {
    const f = fracIndex(t), i = Math.floor(f), u = f - i;
    const a = M[i], b = M[Math.min(M.length - 1, i + 1)];
    tips.push([lerp(a.x, b.x, u), lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * (24 + Math.abs(b.y - a.y) * .3)]);
  }

  // bracket: the 2025 gap to 2019
  const bp = seg(t, ...T.bracket);
  if (bp > 0 && t < 63.5) {
    const n25 = M[D.months.indexOf('2025-12')], x = n25.x - 12, ya = yv(100), yb = yv(79.1);
    const path = [[x + 9, ya], ...E.quadPath([x + 9, ya], [x, ya], [x, ya + 9], 4).slice(1), [x, (ya + yb) / 2 - 8], [x - 8, (ya + yb) / 2], [x, (ya + yb) / 2 + 8], [x, yb - 9], ...E.quadPath([x, yb - 9], [x, yb], [x + 9, yb], 4).slice(1)];
    const tip = E.pencilStroke(g, path, { color: P.red, width: 2, progress: bp, passes: 1 });
    if (bp < 1) tips.push(tip);
    // dashed tick at TB 2025 level
    E.pencilStroke(g, [[x + 9, yb], [L.x1, yb]], { color: P.red, width: 1.2, progress: seg(t, T.bracket[0] + .3, T.bracket[1]), passes: 1 });
  }

  // notes
  for (const nt of notes()) { const tp = drawNote(g, nt, t, cam); if (tp) tips.push(tp); }

  // the empty next cell → widens into the card → navy end card
  drawCellAndCard(g, t, cam, tips);

  // ---------- screen space ----------
  g.setTransform(1, 0, 0, 1, 0, 0);
  // pencil
  drawThePencil(g, t, cam, tips);
  // figure captions + source line
  if (t < T.widen[0] + .3) {
    for (const c of CAPS) drawCaption(g, c, t);
    const sa = seg(t, 8.0, 8.6) * (1 - seg(t, T.widen[0], T.widen[0] + .3));
    if (sa > 0) drawSource(g, sa);
  }
  if (t >= T.navy[0]) drawEndCard(g, t);
}

function drawHeadline(g, t, a, tips) {
  if (a <= 0) return;
  const h = L.head, p = seg(t, ...T.head), A = 'Ngành nhà hàng Đức', B = 'đã hồi phục chưa?';
  g.save(); g.globalAlpha *= a;
  const wA = E.setType(g, A, h.x, h.y1, { size: h.size, font: 'Newsreader', weight: 600, color: P.ink, progress: clamp(p * 1.6), rise: 8 });
  const bx = h.oneLine ? h.x + wA + h.size * .28 : h.x;
  const wB = E.setType(g, B, bx, h.y2, { size: h.size, font: 'Newsreader', weight: 600, color: P.ink, progress: clamp(p * 1.6 - .6), rise: 8 });
  // strike + revision (the headline revised)
  const sp = seg(t, ...T.strike);
  if (sp > 0) {
    const yS = h.y2 - h.size * .3;
    const tip = E.pencilStroke(g, [[bx - 6, yS + 3], [bx + wB * .5, yS - 2], [bx + wB + 8, yS + 2]], { color: P.red, width: 4, progress: sp, passes: 2, seed: 8 });
    if (sp < 1) tips.push(tip);
    const rp = seg(t, ...T.rev), r = L.rev;
    const lines = V ? ['Chưa. Và mỗi vị khách', 'đều phải giành lấy.'] : ['Chưa. Và mỗi vị khách đều phải giành lấy.'];
    lines.forEach((ln, i) => {
      const res = E.handText(g, ln, r.x, r.y + i * r.size * 1.05, { size: r.size, color: P.red, progress: clamp(rp * lines.length - i), weight: 400 });
      const pp = clamp(rp * lines.length - i); if (pp > 0 && pp < 1) tips.push(res.tip);
    });
  }
  g.restore();
}
function headTexts(cam) {
  const h = L.head, g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  g.font = `600 ${h.size}px Newsreader`;
  const wA = g.measureText('Ngành nhà hàng Đức').width, wB = g.measureText('đã hồi phục chưa?').width;
  const bx = h.oneLine ? h.x + wA + h.size * .28 : h.x;
  return { wA, wB, bx };
}
function drawDashed(g, x0, x1, y, p, col) {
  const n = Math.floor((x1 - x0) / 16), m = Math.floor(n * p);
  for (let i = 0; i < m; i++) E.pencilStroke(g, [[x0 + i * 16, y], [x0 + i * 16 + 9, y]], { color: col, width: 1.5, passes: 1, wobble: .1, seed: i });
}
function drawGap(g, p, t) {
  const i0 = D.months.indexOf('2022-01'), seg2 = M.slice(i0), nU = Math.max(2, Math.floor(seg2.length * p));
  const s = seg2.slice(0, nU);
  g.save(); g.beginPath(); g.moveTo(s[0].x, s[0].yn); for (const m of s) g.lineTo(m.x, m.yn); for (let i = s.length - 1; i >= 0; i--) g.lineTo(s[i].x, s[i].y); g.closePath();
  g.fillStyle = 'rgba(168,40,58,.07)'; g.fill(); g.clip();
  g.strokeStyle = 'rgba(58,55,51,.28)'; g.lineWidth = 1.1;
  for (let x = s[0].x - 300; x < s[s.length - 1].x; x += 9) { g.globalAlpha = .5 + .5 * hash(x); g.beginPath(); g.moveTo(x, yv(60)); g.lineTo(x + 140, yv(120)); g.stroke(); }
  g.restore();
}

// the dashed "next month" cell, its question, the card it widens into, and the navy ink that rises in it
function cellRect() { const last = M[M.length - 1], w = V ? 36 : 40; return [last.x + 16, yv(100), last.x + 16 + w, L.y0]; }
function drawCellAndCard(g, t, cam, tips) {
  if (t < T.cell[0]) return;
  const c = cellRect(), wp = eio(seg(t, ...T.widen));
  const C = L.card.map((v, i) => v * 1.02);
  const r = [lerp(c[0], C[0], wp), lerp(c[1], C[1], wp), lerp(c[2], C[2], wp), lerp(c[3], C[3], wp)];
  if (wp > 0) {                                          // the widening cell is fresh paper over the chart
    g.save(); g.fillStyle = P.paper; g.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    g.globalAlpha = .9; g.fillStyle = '#F9F7F1'; g.fillRect(r[0] + 2, r[1] + 2, r[2] - r[0] - 4, r[3] - r[1] - 4); g.restore();
  }
  const cp = seg(t, ...T.cell);
  if (wp < 1) E.dashedCell(g, ...r, { progress: cp, color: P.blue, width: 1.8 });
  if (cp > 0 && cp < 1) tips.push([lerp(c[0], c[2], clamp(cp * 4)), c[1]]);
  // the question next to the cell
  const qx = c[2], qy = V ? yv(28) : yv(30);
  const qa = 1 - seg(t, T.widen[0], T.widen[0] + .25);
  if (t >= T.cellNote && qa > 0) {
    const pr = seg(t, T.cellNote, T.cellNote + 1.3), sz = V ? 44 : 40;
    g.save(); g.globalAlpha *= qa;
    const l1 = E.handText(g, 'tháng tới:', qx, qy, { size: sz, color: P.blue, progress: clamp(pr * 2), align: 'right', zoom: cam.zoom, weight: 400 });
    const l2 = E.handText(g, 'khách chọn quán nào?', qx, qy + sz * 1.1, { size: sz, color: P.blue, progress: clamp(pr * 2 - 1), align: 'right', zoom: cam.zoom, weight: 400 });
    if (pr > 0 && pr < .5) tips.push(l1.tip); else if (pr >= .5 && pr < 1) tips.push(l2.tip);
    if (pr >= 1) E.leader(g, [qx - 20, qy - sz * .9], [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2 + 30], { color: P.blue, progress: seg(t, T.cellNote + 1.3, T.cellNote + 1.7) });
    g.restore();
  }
  if (wp >= 1 && t < T.navy[1] + .05) drawCard(g, t, cam, tips);
  // navy ink rises inside the card (a chart operation: an area filling up), the end card lives on it
  const np = seg(t, ...T.navy);
  if (np > 0) {
    const yTop = lerp(C[3], C[1], eio(np));
    g.save(); g.fillStyle = NAVY; g.beginPath(); g.moveTo(C[0], C[3]);
    for (let i = 0; i <= 24; i++) { const x = lerp(C[0], C[2], i / 24); g.lineTo(x, yTop + Math.sin(i * 1.7 + np * 6) * 10 * (1 - np)); }
    g.lineTo(C[2], C[3]); g.closePath(); g.fill(); g.restore();
  }
}
const CARD_LINES_V = ['Trong một thị trường', 'như vậy, quán thắng', 'là quán được tìm thấy', 'trước và được tin trước.'];
const CARD_LINES_H = ['Trong một thị trường như vậy,', 'quán thắng là quán được tìm thấy', 'trước và được tin trước.'];
function cardGeom() {
  return V ? { x: -430, y: -560, size: 70, lh: 86, icY: 170, ic1: -220, ic2: 200, lab: 350, is: 1.7 }
           : { x: -820, y: -250, size: 66, lh: 82, icY: 0, ic1: 380, ic2: 720, lab: 190, is: 1.2 };
}
function drawCard(g, t, cam, tips) {
  const k = cardGeom(), lines = V ? CARD_LINES_V : CARD_LINES_H, p = seg(t, T.cardText, T.cardText + 1.4);
  E.setType(g, 'VẬY THÌ', k.x, k.y - k.size * 1.1, { size: 22, color: P.inkSoft, progress: seg(t, T.cardText - .2, T.cardText + .3), track: 3 });
  lines.forEach((ln, i) => E.setType(g, ln, k.x, k.y + i * k.lh, { size: k.size, font: 'Newsreader', weight: 500, color: P.ink, progress: clamp(p * lines.length - i), rise: 10 }));
  // underline "được tìm thấy" (blue) and "tin trước" (red) — measured on the printed lines
  const gm = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d')); gm.font = `500 ${k.size}px Newsreader`;
  const ul = (li, word, col, t0) => {
    const ln = lines[li], j = ln.indexOf(word); if (j < 0) return;
    const xa = k.x + gm.measureText(ln.slice(0, j)).width, xb = xa + gm.measureText(word).width, y = k.y + li * k.lh + 14;
    const up = seg(t, t0, t0 + .5), tip = E.pencilStroke(g, E.quadPath([xa - 4, y + 3], [(xa + xb) / 2, y + 8], [xb + 6, y]), { color: col, width: 3, progress: up, passes: 2, seed: li + 3 });
    if (up > 0 && up < 1) tips.push(tip);
  };
  if (V) { ul(2, 'được tìm thấy', P.blue, 70.4); ul(3, 'tin trước.', P.red, 71.0); }
  else { ul(1, 'được tìm thấy', P.blue, 70.4); ul(2, 'tin trước.', P.red, 71.0); }
  // two pencil drawings: a map pin (accent) and a website with a booking button
  const ip = seg(t, ...T.icons);
  const pin = pinPath(k.ic1, k.icY, 70 * k.is);
  if (ip > 0) {
    const tp = E.inkShape(g, pin, { fill: ACC, hatch: .4, progress: clamp(ip * 2), seed: 4 });
    if (ip < .5) tips.push(tp);
    if (ip > .45) E.pencilStroke(g, E.ringPath(k.ic1, k.icY - 31.5 * k.is, 12.6 * k.is, 2, 1.05), { color: P.ink, width: 2, progress: seg(ip, .45, .6), passes: 1 });
    const wb = webPath(k.ic2, k.icY, .95 * k.is), wpg = seg(ip, .5, 1);
    for (let i = 0; i < wb.length; i++) { const pp = clamp(wpg * wb.length - i); if (pp > 0) { const tp2 = E.pencilStroke(g, wb[i], { color: P.ink, width: 2, progress: pp, passes: 1, seed: 10 + i }); if (pp < 1) tips.push(tp2); } }
    if (wpg >= .9) {
      const s = .95 * k.is, bx = k.ic2 - 70 * s, by = k.icY + 28 * s;
      g.save(); g.fillStyle = ACC; g.globalAlpha *= seg(wpg, .9, 1); g.beginPath(); g.roundRect(bx, by, 140 * s, 30 * s, 6); g.fill(); g.restore();
      E.setType(g, 'Jetzt reservieren', k.ic2, by + 21 * s, { size: 14 * s, font: 'IBM Plex Mono', weight: 500, color: NAVY, align: 'center', progress: seg(wpg, .92, 1) });
    }
  }
  const lp = seg(t, 71.6, 72.8);
  E.handText(g, 'Google Maps · Ads', k.ic1, k.icY + k.lab - k.icY + (V ? 0 : 0), { size: V ? 40 : 36, color: P.blue, progress: clamp(lp * 2), align: 'center', zoom: cam.zoom, weight: 400 });
  E.handText(g, 'Website · đặt bàn', k.ic2, k.icY + k.lab - k.icY, { size: V ? 40 : 36, color: P.blue, progress: clamp(lp * 2 - 1), align: 'center', zoom: cam.zoom, weight: 400 });
}
function pinPath(cx, cy, s) {                          // a map-pin silhouette: circle head, pointed foot at (cx, cy + s*.55)
  const out = [], R = s * .5, hy = cy - s * .45;
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (0.85 + i / 40 * 1.3); out.push([cx + Math.cos(a) * R, hy + Math.sin(a) * R]); }
  out.push([cx, cy + s * .55]); return out;
}
function webPath(cx, cy, s) {                          // a browser window sketch, as separate strokes
  const w = 190 * s, h = 150 * s, x0 = cx - w / 2, y0 = cy - h / 2 - 20 * s;
  return [
    [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h], [x0, y0]],
    [[x0, y0 + 24 * s], [x0 + w, y0 + 24 * s]],
    [[x0 + 18 * s, y0 + 46 * s], [x0 + w - 18 * s, y0 + 46 * s]],
    [[x0 + 18 * s, y0 + 64 * s], [x0 + w * .6, y0 + 64 * s]],
  ];
}

// ---------- the pencil ----------
const restW = () => V ? [260, 120] : [300, 200];
function drawThePencil(g, t, cam, tips) {
  if (t > 79.6) return;
  let tip = tips.length ? tips[tips.length - 1] : null, lift = 0;
  if (!tip) {                                            // hover: a calm drift near the last action
    const base = hoverPoint(t); tip = base; lift = .55 + .08 * Math.sin(t * 1.7);
  } else {
    lift = .05 + .04 * Math.abs(Math.sin(t * 9));
  }
  let S = E.w2s(cam, tip[0], tip[1]);
  // exit after the card: the pencil slides out to the lower right and hands the story over
  const ex = seg(t, 76.0, 77.4);
  if (ex > 0) { S = [lerp(S[0], E.W + 400, eio(ex)), lerp(S[1], E.H + 300, eio(ex))]; lift = lerp(lift, 1.0, ex); }
  const flip = pencilFlip(t);
  E.drawPencil(g, { tip: S, s: (V ? .56 : .62) * Math.min(1.25, Math.max(.85, cam.zoom * .8)), lift, flip, ang: V ? .9 : .62 });
}
function hoverPoint(t) {
  if (t < 8.0) return [V ? 120 : -200, V ? -60 : 0];
  if (t < 42.4) return [M[M.length - 1].x, M[M.length - 1].y - 40];
  if (t < 54.8) return [V ? 200 : 0, yv(60)];
  if (t < 63.2) return [L.rev.x + 380, L.rev.y + 60];
  return [V ? 260 : 300, V ? 380 : 200];
}
function pencilFlip(t) {                                 // 0 = blue end, 1 = red end; a lead change marks a turn
  const k = [[0, 0], [17.0, 0], [17.5, 1], [42.0, 1], [42.4, 0], [54.2, 0], [54.7, 1], [62.6, 1], [63.1, 0], [90, 0]];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], eio(seg(t, k[i][0], k[i + 1][0])));
  return 0;
}

// ---------- captions (figure caption = the storyteller) ----------
function capWords(c) { const ws = c.text.split(' '); return ws.map((w, i) => ({ w, t: c.t0 + .15 + i * Math.min(.09, 1.4 / ws.length) })); }
function capLayout(g, c) {
  const k = L.cap; g.save(); g.font = `400 ${k.size}px Newsreader`;
  const lines = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const wd of c.text.split(' ')) { const ww = g.measureText(wd).width; if (lw + ww > k.maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(ww); lw += ww + sp; }
  const lh = k.size * 1.22, maxLine = Math.max(...lines.map(l => l.reduce((a, b) => a + b + sp, -sp)));
  g.restore(); return { n: lines.length, lh, maxLine };
}
function capY(g, c) {                                    // in the 16:9 column the caption grows downward from a fixed top
  const k = L.cap; if (!k.col) return k.y;
  const lay = capLayout(g, c); return k.y + (lay.n - 1) * lay.lh;
}
function drawCaption(g, c, t) {
  if (t >= c.t0 && t <= c.t1 + .3) {
    const lay = capLayout(g, c), y = capY(g, c), top = y - (lay.n - 1) * lay.lh - L.cap.size * 2.1;
    const al = clamp((t - c.t0) / .2) * (1 - clamp((t - c.t1) / .3));
    g.save(); g.globalAlpha = .9 * al;
    const x0 = L.cap.col ? L.cap.x - 40 : 0, x1 = E.W, y1 = L.cap.col ? y + L.cap.size : E.H;
    const gr = g.createLinearGradient(0, top - 40, 0, top); gr.addColorStop(0, 'rgba(246,243,236,0)'); gr.addColorStop(1, 'rgba(246,243,236,1)');
    g.fillStyle = gr; g.fillRect(x0, top - 40, x1 - x0, 40); g.fillStyle = P.paper; g.fillRect(x0, top, x1 - x0, y1 - top + 30);
    g.restore();
  }
  E.caption(g, capWords(c), t, { x: L.cap.x, y: capY(g, c), size: L.cap.size, maxW: L.cap.maxW, kicker: c.kicker, t0: c.t0, t1: c.t1 });
}
function srcLines(g) {
  const k = L.src; g.save(); g.font = `400 ${k.size}px "IBM Plex Mono"`;
  const out = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const w of SRC.split(' ')) { const ww = g.measureText(w).width; if (lw + ww > k.maxW && out[out.length - 1].length) { out.push([]); lw = 0; } out[out.length - 1].push(w); lw += ww + sp; }
  g.restore(); return out.map(l => l.join(' '));
}
function drawSource(g, a) {
  const k = L.src; srcLines(g).forEach((ln, i) => E.setType(g, ln, k.x, k.y + i * k.size * 1.35, { size: k.size, color: P.inkSoft, alpha: a }));
}

// ---------- end card (SAMI colours on the navy ink; paper tooth and a pencil stroke stay) ----------
function endGeom() {
  const W = E.W, H = E.H;
  return V ? { cx: W / 2, logoY: 520, logoW: 640, tagY: 760, h1: [900, 990, 1080], h1s: 78, ctaY: [1210, 1262], ctaS: 38, pillY: 1340, urlY: 1490, src: 1580 }
           : { cx: W / 2, logoY: 150, logoW: 560, tagY: 370, h1: [490], h1s: 70, ctaY: [600], ctaS: 34, pillY: 660, urlY: 820, src: 1010 };
}
const H1 = ['Thêm khách.', 'Thêm doanh thu.', 'Thêm thời gian.'];
const CTA = V => V ? ['Nhắn WhatsApp cho SAMI, nhận phân tích', 'marketing miễn phí, không ràng buộc.'] : ['Nhắn WhatsApp cho SAMI, nhận phân tích marketing miễn phí, không ràng buộc.'];
function drawEndCard(g, t) {
  const W = E.W, H = E.H, k = endGeom(), a0 = seg(t, T.navy[1] - .1, T.navy[1] + .2);
  if (a0 <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  // paper tooth over the ink (multiply-ish): keeps the material
  g.globalAlpha = .07 * a0; E.drawPaper(g, { x: 0, y: 0, zoom: 1 }, { dots: 0 }); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = NAVY; g.globalAlpha = .93 * a0; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  // soft glows
  const gl = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(12,6,40,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1; };
  gl(W * .2, H * .22, W * .6, 'rgba(118,103,254,.35)', a0); gl(W * .85, H * .8, W * .55, 'rgba(8,221,164,.18)', a0);
  const e = s => eo(seg(t, T.end + s, T.end + s + .5));
  // logo
  if (logo) { const lw = k.logoW, lh = lw * 1024 / 3120, a = e(0); g.globalAlpha = a; g.drawImage(logo, k.cx - lw / 2, k.logoY - lh / 2 + (1 - a) * 18, lw, lh); g.globalAlpha = 1; }
  txt(g, 'STRATEGY • AUTOMATION • MARKETING • INTELLIGENCE', k.cx, k.tagY, { size: V ? 22 : 20, weight: 600, color: LAV, a: e(.3) * .85, track: V ? 3 : 4 });
  if (V) H1.forEach((s, i) => txt(g, s, k.cx, k.h1[i], { size: k.h1s, weight: 800, color: i === 2 ? ACC : '#FFFFFF', a: e(.5 + i * .25) }));
  else txt(g, H1.join(' '), k.cx, k.h1[0], { size: k.h1s, weight: 800, color: '#FFFFFF', a: e(.5) });
  // pencil underline in mint under the headline
  const ul = seg(t, T.end + 1.4, T.end + 2.0);
  if (ul > 0) { g.save(); const yU = (V ? k.h1[2] : k.h1[0]) + 22, w = V ? 440 : 1100; E.pencilStroke(g, E.quadPath([k.cx - w / 2, yU + 4], [k.cx, yU + 12], [k.cx + w / 2, yU]), { color: ACC, width: 5, progress: ul, passes: 2, seed: 21 }); g.restore(); }
  CTA(V).forEach((s, i) => txt(g, s, k.cx, k.ctaY[i], { size: k.ctaS, weight: 400, color: LAV, a: e(1.4 + i * .15) }));
  // WhatsApp pill (drawn in code: a green chat bubble, no logo)
  const pa = e(1.8), pop = pa < 1 ? .9 + .1 * pa : 1;
  drawPill(g, k.cx, k.pillY + (V ? 44 : 40), pop, pa);
  txt(g, 'sami-agency.de  ·  phản hồi trong 24 giờ', k.cx, k.urlY, { size: V ? 34 : 30, weight: 600, color: '#FFFFFF', a: e(2.2) });
  g.restore();
}
function drawPill(g, cx, cy, s, a) {
  const w = (V ? 640 : 600) * s, h = (V ? 104 : 92) * s;
  g.save(); g.globalAlpha = a;
  g.fillStyle = ACC; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); g.fill();
  // bubble icon
  const bx = cx - w / 2 + h * .62, by = cy, r = h * .3;
  g.fillStyle = NAVY; g.beginPath(); g.arc(bx, by - 2, r, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(bx - r * .75, by + r * .45); g.lineTo(bx - r * 1.05, by + r * 1.15); g.lineTo(bx - r * .1, by + r * .9); g.closePath(); g.fill();
  g.fillStyle = ACC; [-.42, 0, .42].forEach(d => { g.beginPath(); g.arc(bx + d * r, by - 2, r * .13, 0, Math.PI * 2); g.fill(); });
  g.restore();
  txt(g, '+49 155 60456888', cx + h * .3, cy + (V ? 15 : 13), { size: V ? 46 : 40, weight: 700, color: NAVY, a });
}
function txt(g, s, x, y, o) {
  g.save(); g.font = `${o.weight} ${o.size}px "Be Vietnam Pro"`; g.fillStyle = o.color; g.globalAlpha = o.a ?? 1; g.textAlign = 'center';
  if (o.track) g.letterSpacing = `${o.track}px`;
  g.fillText(s, x, y + (1 - (o.a ?? 1)) * 14); g.restore();
}

// ---------- TEXTS for readcheck (full text from the first visible frame, screen boxes) ----------
export function texts(t) {
  const cam = camAt(t), out = [], g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  const box = (id, text, b) => { const a = E.w2s(cam, b[0], b[1]), c = E.w2s(cam, b[2], b[3]); out.push({ id, text, x0: Math.min(a[0], c[0]), y0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), y1: Math.max(a[1], c[1])}); };
  const h = L.head, hw = seg(t, 7.2, 8.0) * (1 - seg(t, 39.6, 41.2));
  if (t >= T.head[0] && hw < .5 && t < T.widen[0]) {
    const { wA, wB, bx } = headTexts(cam);
    box('head', 'Ngành nhà hàng Đức đã hồi phục chưa?', [h.x, h.y1 - h.size * .85, Math.max(h.x + wA, bx + wB), h.y2 + h.size * .25]);
    if (t >= T.rev[0]) {
      const r = L.rev, txt = 'Chưa. Và mỗi vị khách đều phải giành lấy.';
      const lines = V ? ['Chưa. Và mỗi vị khách', 'đều phải giành lấy.'] : [txt];
      const w = Math.max(...lines.map(l => E.measureHand(g, l, r.size, 400, 'Patrick Hand')));
      box('rev', txt, [r.x, r.y - r.size * .85, r.x + w, r.y + (lines.length - 1) * r.size * 1.05 + r.size * .3]);
    }
  }
  if (t >= 1.0 && t < T.widen[0]) box('unit', '2019 = 100', [L.x0 + 10, yv(112) - 18, L.x0 + 140, yv(112) + 6]);
  for (const nt of notes()) if (t >= nt.t0 && t <= nt.t1) box(nt.id, nt.lines.join(' '), noteBox(nt));
  if (t >= T.cellNote && t < T.widen[0]) {
    const c = cellRect(), sz = V ? 44 : 40, qy = V ? yv(28) : yv(30), w = E.measureHand(g, 'khách chọn quán nào?', sz, 400, 'Patrick Hand');
    box('next', 'tháng tới: khách chọn quán nào?', [c[2] - w, qy - sz * .85, c[2], qy + sz * 1.1 + sz * .3]);
  }
  for (const c of CAPS) if (t >= c.t0 && t <= c.t1) {
    const lay = capLayout(g, c), y = capY(g, c), top = y - (lay.n - 1) * lay.lh;
    out.push({ id: c.id, text: c.text, x0: L.cap.x, y0: top - L.cap.size, x1: L.cap.x + lay.maxLine, y1: y + L.cap.size * .3 });
  }
  if (t >= 8.6 && t < T.widen[0]) { const k = L.src, n = srcLines(g).length; out.push({ id: 'src', text: SRC, x0: k.x, y0: k.y - k.size, x1: k.x + k.maxW, y1: k.y + (n - 1) * k.size * 1.35 + 6 }); }
  if (t >= T.cardText && t < T.navy[0] + .3) {
    const k = cardGeom(), lines = V ? CARD_LINES_V : CARD_LINES_H; g.font = `500 ${k.size}px Newsreader`;
    const w = Math.max(...lines.map(l => g.measureText(l).width));
    box('card', lines.join(' '), [k.x, k.y - k.size, k.x + w, k.y + (lines.length - 1) * k.lh + k.size * .3]);
  }
  if (t >= 71.6 && t < T.navy[0] + .3) {
    const k = cardGeom(), s = V ? 40 : 36;
    for (const [id, s1, x] of [['lab1', 'Google Maps · Ads', k.ic1], ['lab2', 'Website · đặt bàn', k.ic2]]) { const w = E.measureHand(g, s1, s, 400, 'Patrick Hand'); box(id, s1, [x - w / 2, k.lab - s * .85, x + w / 2, k.lab + s * .3]); }
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
  ev.push({ t: T.axis[0], type: 'ruler', d: 1.6 });
  ev.push({ t: T.q[0], type: 'write', d: 1.8 });
  for (const m of M) ev.push({ t: m.t, type: 'dot', v: m.real, series: 'real', i: m.i });
  ev.push({ t: 17.3, type: 'flip' }, { t: 42.2, type: 'flip' }, { t: 54.45, type: 'flip' }, { t: 62.85, type: 'flip' });
  ev.push({ t: T.shock, type: 'punch' });
  ev.push({ t: 19.6, type: 'silence', d: 1.2 });
  for (const nt of notes()) if (nt.id !== 'q') ev.push({ t: nt.t0, type: 'write', d: nt.dur });
  ev.push({ t: T.refLine[0], type: 'ruler', d: .8 }, { t: T.bracket[0], type: 'scratch', d: .8 });
  for (let i = 0; i < M.length; i += 3) ev.push({ t: lerp(T.nom[0], T.nom[1], i / (M.length - 1)), type: 'dot', v: M[i].nom, series: 'nom', i });
  ev.push({ t: T.gap[0], type: 'sweep', d: 1.6 });
  ev.push({ t: T.hush[0], type: 'silence', d: .8 });
  ev.push({ t: T.strike[0], type: 'strike', d: .8 }, { t: T.rev[0], type: 'write', d: 2.0 });
  ev.push({ t: T.cell[0], type: 'tick', d: .8 }, { t: T.cellNote, type: 'write', d: 1.3 });
  ev.push({ t: T.widen[0], type: 'unfold', d: 1.6 }, { t: T.cardText, type: 'type', d: 1.4 });
  ev.push({ t: 70.4, type: 'scratch', d: .5 }, { t: 71.0, type: 'scratch', d: .5 }, { t: T.icons[0], type: 'write', d: 2.0 }, { t: 71.6, type: 'write', d: 1.2 });
  ev.push({ t: T.breath[0], type: 'silence', d: 1.2 });
  ev.push({ t: T.navy[0], type: 'ink', d: .8 }, { t: T.end, type: 'logo' }, { t: T.end + 1.8, type: 'pop' }, { t: T.end + 1.4, type: 'scratch', d: .6 });
  return ev.sort((a, b) => a.t - b.t);
}
