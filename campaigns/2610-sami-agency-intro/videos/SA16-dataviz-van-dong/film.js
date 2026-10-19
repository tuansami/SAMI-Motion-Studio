// SA16 · "Khó khăn không chừa ai, nhưng có quán vẫn đông" — lemo-opuscar dataviz style.
// One sheet of paper, one take. A single record column (Q1/2026) pierces the chart frame; the camera rewinds to 2019 and
// the real quarterly bankruptcy index of German hospitality (Eurostat sts_rb_q, NACE I) is rebuilt column by column while
// the frame ratchets up to contain it. The columns sweep into a ranked bar of 8 sectors (all rose vs 2019). Silence. Below,
// on blank paper, the pencil writes the question and four answers in words (no invented chart) → SAMI → a navy column → end card.
import * as E from './engine.js';
import { clamp, lerp, seg, eio, eo, back, hash, monotone } from '/core/lib.js';
const { P } = E;

export const BEAT = .6;                       // 100 BPM; an 8th = 9 frames at 30 fps
const b = n => Math.round(n * BEAT * 30) / 30;
export const DUR = b(145);                    // 87.0 s
const ACC = '#08DDA4';                        // the one accent (SAMI mint), never data
const NAVY = '#0C0628', LAV = '#E3E4F7';

// ---------- timeline (beats → seconds) ----------
const T = {
  hookBar: [0, b(2)], pierce: b(1.7), h1: b(3), h1off: b(12),
  axis: [b(8), b(13)], head: [b(12), b(14.5)], yaxis: [b(13), b(15)],
  n1: b(21), n2: b(26), nOff: b(47),
  r1: b(42.5), hush1: [b(47), b(48.5)], rec: b(49), r2: b(49.5), n3: b(50), refs: [b(55), b(57)], bracket: [b(57), b(58)], refOff: b(63.5),
  morph: [b(64), b(68)], rows: b(68), head2: [b(66), b(68)], n5: b(76.5), n6: b(74.5), chart2Off: b(84),
  hush2: [b(84), b(86)], q1: [b(86), b(88)], q2: [b(88), b(90.5)],
  item0: b(92), itemGap: b(4.5), tags: b(110), ticks: b(116.5),
  breath: [b(126), b(128)], rise: [b(128), b(130)], end: b(130),
};
const R1 = { t0: T.r1, from: 180, to: 200, steps: 4, dt: b(.5) };
const R2 = { t0: T.r2, from: 200, to: 240, steps: 8, dt: b(.5) };

let D, L, V, logo, Q;                         // data, layout, vertical?, logo, quarters [{i, label, v, t, x}]
let SECT;                                     // sorted sectors [{vi, pct, code, y}]
export function setup(data, w, h, logoImg) {
  D = data; V = h > w; logo = logoImg; E.setSize(w, h);
  HEAD = V ? ['Số vụ phá sản ngành nhà hàng,', 'khách sạn ở Đức, theo quý'] : ['Số vụ phá sản ngành nhà hàng, khách sạn ở Đức, theo quý'];
  L = V ? {
    X0: -470, X1: 370, HP: 900, hd: { x: -470, y: -1150, size: 42 },
    cap: { x: 90, y: 1560, size: 40, maxW: 900 }, src: { x: 90, y: 1650, size: 19, maxW: 900 },
    full: { x: 0, y: -300 }, c2: { y: 560, row: 94, rh: 56, nameX: -100, barX: -80, k: 9.2, size: 34 }, c2cam: { x: 0, y: 1300 },
    F: { x: -450, y: 2130, qs: 66, is: 48, pitch: 270, maxW: 900 }, Fcam: { x: 0, y: 2870 }, note: 32, s: 1,
  } : {
    X0: -560, X1: 440, HP: 640, hd: { x: -560, y: -790, size: 40 },
    cap: { x: 1180, y: 390, size: 37, maxW: 650, col: true }, src: { x: 1180, y: 905, size: 18, maxW: 650 },
    full: { x: 280, y: 90 }, c2: { y: 1000, row: 58, rh: 36, nameX: -150, barX: -130, k: 9.4, size: 28 }, c2cam: { x: 280, y: 1395 },
    F: { x: -560, y: 2230, qs: 52, is: 36, pitch: 142, maxW: 1000, one: true }, Fcam: { x: 280, y: 2640 }, note: 30, s: .92,
  };
  const pitch = (L.X1 - L.X0) / D.quarters.length;
  Q = D.quarters.map((lab, i) => ({ i, lab, v: D.values[i], t: barTime(i), x: L.X0 + (i + .5) * pitch, w: pitch * .66 }));
  const SCALE = r => Math.round((r.y2025 / r.y2019 - 1) * 100);
  SECT = D.dumbbell.map(r => ({ ...r, pct: SCALE(r) })).sort((a, c) => c.pct - a.pct);
  SECT.forEach((s, k) => { s.y = L.c2.y + 150 + k * L.c2.row; });
  camKeys();
}
function barTime(i) {
  if (i <= 15) return b(17 + i);               // 2019–2022: one beat per quarter
  if (i <= 23) return b(33 + i - 16);          // 2023–2024
  return [b(41), b(42), b(45), b(46), T.rec, b(53.5)][i - 24];
}
const HOOK = 28;                              // 2026-Q1, the record
// ---------- the ratcheting frame ----------
function ratchet(t, R) {
  if (t <= R.t0) return R.from;
  const k = (t - R.t0) / R.dt, n = Math.floor(k), f = eio(clamp((k - n) / .6));
  if (n >= R.steps) return R.to;
  return R.from + (R.to - R.from) * (n + f) / R.steps;
}
const ceilAt = t => t < R2.t0 ? ratchet(t, R1) : ratchet(t, R2);
const yOf = (v, t) => -v * L.HP / ceilAt(t);
const pctColor = p => E.rgb(E.rampRGB(clamp(p / 55, 0, 1.3) * .95));
const barColor = v => E.valueColor(v, { center: 156.3, half: 75 });   // reference = 2019 mean; blue below, red above
const avg19 = () => D.avgI['2019'];
const avg26 = () => (D.values[28] + D.values[29]) / 2;

// ---------- texts ----------
let HEAD;
const HEADSUB = 'chỉ số · trung bình năm 2021 = 100';
const HEAD2 = ['Năm 2025 so với 2019:', 'số vụ phá sản theo nhóm ngành'];
const HEAD2SUB = 'mỗi nhóm ngành so với chính nó';
const CAPS = [
  { id: 'c1', t0: b(1), t1: b(15.4), kicker: 'quý I/2026', text: 'Đầu năm 2026, ngành nhà hàng, khách sạn ở Đức lập một kỷ lục không ai muốn: số vụ phá sản cao nhất trong cả chuỗi số từ 2015.' },
  { id: 'c2', t0: b(16), t1: b(32.8), kicker: '2019 → 2022', text: 'Hãy quay lại năm 2019, một năm bình thường. Rồi đại dịch đến: tiền hỗ trợ và luật tạm hoãn nộp đơn khiến con số lặng xuống.' },
  { id: 'c3', t0: b(33.2), t1: b(46.6), kicker: '2023 → 2025', text: 'Nhưng từ 2023, các cột chỉ còn một hướng là đi lên. Đến năm 2025, khung biểu đồ cũ không còn đủ chỗ.' },
  { id: 'c4', t0: b(52.5), t1: b(64.4), kicker: '2019 → 6/2026', text: 'Nửa đầu 2026 cao hơn năm 2019 tới 36 %. Sau mỗi cột là những cánh cửa quán đóng lại thật.' },
  { id: 'c5', t0: b(65), t1: b(83.4), kicker: '2025 so với 2019 · 8 nhóm ngành', text: 'Và không riêng ngành nhà hàng. Năm 2025, cả tám nhóm ngành ở Đức đều có nhiều vụ phá sản hơn năm 2019.' },
  { id: 'c6', t0: b(87), t1: b(108.6), kicker: 'cùng con phố', text: 'Cùng con phố, cùng giá thuê, cùng hóa đơn điện, vậy mà có quán vẫn kín bàn. Không biểu đồ nào đo được, nhưng những quán ấy thường giống nhau ở bốn điều.' },
  { id: 'c7', t0: b(109.6), t1: b(125.6), kicker: 'SAMI', text: 'SAMI làm cả bốn điều đó cho nhà hàng tại Đức, để quán của bạn là quán vẫn đông, dù năm nay khó đến đâu.' },
];
const SRC1 = 'Nguồn: Eurostat sts_rb_q (số liệu Destatis), Đức, ngành lưu trú và ăn uống (NACE I), số tuyên bố phá sản theo quý, chưa hiệu chỉnh mùa vụ, chỉ số TB 2021 = 100 · cập nhật 16.10.2026 · CC BY 4.0';
const SRC2 = 'Nguồn: Eurostat sts_rb_q, Đức, chỉ số phá sản theo nhóm ngành NACE, TB 2025 ÷ TB 2019 · CC BY 4.0';
const QL = ['Khó khăn không chừa ai.', 'Vậy vì sao có quán vẫn đông?'];
const ITEMS = [
  { lines: ['Được tìm thấy khi khách gõ', '„Restaurant in der Nähe“'], tag: 'Google Ads Maps · Local SEO', icon: 'pin' },
  { lines: ['Được tin: ảnh món thật,', 'đánh giá được trả lời'], tag: 'Ảnh món · Website', icon: 'star' },
  { lines: ['Dễ đặt: một chạm là', 'giữ được bàn, gọi được món'], tag: 'Đặt bàn · Đặt món online', icon: 'cal' },
  { lines: ['Có lý do quay lại: ưu đãi,', 'Gutschein, mạng xã hội'], tag: 'Social media · Branding', icon: 'heart' },
];

// ---------- camera ----------
let zK, xK, yK;
function camKeys() {
  const hb = Q[HOOK], hy = -hb.v * L.HP / 180, f = L.full, c2 = L.c2cam, F = L.Fcam;
  const zH = V ? 2.3 : 2.0, zT = V ? 1.3 : 1.15;
  const yT = V ? -270 : -120;                 // tracking height while building (baseline low in frame)
  zK = monotone([[0, zH], [b(7), zH * .96], [b(10.5), 1.5], [b(13), 1.45], [b(16.5), zT], [b(31), zT], [b(35), 1.0], [b(63.5), 1.0], [b(66), .86], [b(68.5), 1.0],
    [b(84), 1.0], [b(86), 1.0], [b(91), V ? 1.06 : 1.0], [b(108), V ? 1.06 : 1.0], [b(110), 1.0], [b(200), 1.0]]);
  xK = monotone([[0, hb.x - 30], [b(7), hb.x - 30], [b(10.5), hb.x - 120], [b(13), L.X0 + 260], [b(16.5), L.X0 + 260], [b(35), f.x], [b(64), f.x], [b(68), c2.x],
    [b(84), c2.x], [b(86), F.x], [b(200), F.x]]);
  yK = monotone([[0, hy + 70], [b(7), hy + 70], [b(10.5), -330], [b(13), yT], [b(31), yT], [b(35), f.y], [b(64), f.y], [b(68), c2.y],
    [b(84), c2.y], [b(86.5), F.y], [b(200), F.y]]);
}
function newestX(t) {                          // continuous x of the newest column (for the track)
  let x = Q[0].x;
  for (let i = 0; i < 28; i++) if (t >= Q[i].t) x = Q[i].x + (i < 27 ? (Q[i + 1].x - Q[i].x) * eio(seg(t, Q[i].t, Q[i + 1].t)) : 0);
  return x;
}
export function camAt(t) {
  let zoom = zK(t), x = xK(t), y = yK(t);
  // track: newest column at ~60 % of the frame width while the chart is being built
  const w = seg(t, b(15.5), b(17)) * (1 - seg(t, b(30.5), b(35)));
  if (w > 0) {
    const viewW = E.W / zoom, xt = clamp(newestX(t) - .1 * viewW, L.X0 + viewW / 2 - 100, L.X1 - viewW / 2 + 90);
    x = lerp(x, xt, w);
  }
  // pedestal up with the ratchets (the frame grows, the camera rises a touch)
  y -= 40 * seg(t, T.r1, T.r1 + 1.2) * (1 - seg(t, b(63.5), b(66)));
  // jolts: small on each ratchet click, a punch-in on the record
  let sx = 0, sy = 0;
  const jolt = (t0, a) => { const d = t - t0; if (d > 0 && d < .5) { const k = Math.exp(-d * 9); sx += Math.sin(d * 70) * a * k; sy += Math.cos(d * 55) * a * .7 * k; } };
  for (let k = 0; k < R1.steps; k++) jolt(R1.t0 + k * R1.dt, 4);
  for (let k = 0; k < R2.steps; k++) jolt(R2.t0 + k * R2.dt, 3 + k * .6);
  jolt(T.pierce, 8);
  const pk = t - T.rec;
  if (pk > 0 && pk < 1.3) { const d = Math.exp(-pk * 4.2); zoom *= 1 + .14 * clamp(pk / .066) * d; sx += Math.sin(pk * 61) * 12 * d; sy += Math.cos(pk * 47) * 9 * d; }
  return { x, y, zoom, roll: 0, sx, sy };
}

// ---------- notes (pinned in data space: x in world, y follows the ratchet) ----------
function notes(t) {
  const ns = L.note, hb = Q[HOOK];
  const i7 = Q[7], i0 = Q[0];
  return [
    { id: 'h1', lines: ['216', 'cao nhất từ 2015'], sizes: [ns + 26, ns], x: hb.x - hb.w / 2 - 18, y: yOf(hb.v, t) + 46, col: P.red, t0: T.h1, dur: 1.2, t1: T.h1off, align: 'right' },
    { id: 'n1', lines: ['2019: một năm', 'bình thường'], x: i0.x - i0.w / 2, y: -L.HP - (V ? 70 : 64), size: ns, col: P.blue, t0: T.n1, dur: 1.2, t1: T.nOff, lead: [Q[1].x, yOf(Q[1].v, t) - 8] },
    { id: 'n2', lines: ['2020–2021:', 'hỗ trợ COVID,', 'tạm hoãn nghĩa vụ', 'nộp đơn phá sản'], x: i7.x - i7.w / 2 + 6, y: -L.HP * (V ? .80 : .82), size: ns - 4, col: P.blue, t0: T.n2, dur: 2.0, t1: T.nOff, maxW: Q[15].x - i7.x + (V ? 40 : 30) },
    { id: 'n3', lines: ['quý I/2026: 216', 'kỷ lục từ 2015'], sizes: [ns + 6, ns], x: hb.x + hb.w / 2 + 8, y: -L.HP - (V ? 92 : 84), col: P.red, t0: T.n3, dur: 1.2, t1: T.refOff, align: 'right', lead: [hb.x, yOf(hb.v, t) - 10] },
  ];
}
function noteBox(nt) {
  const g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  const sz = nt.sizes || nt.lines.map(() => nt.size);
  let w = 0, h = 0;
  nt.lines.forEach((ln, i) => { w = Math.max(w, E.measureHand(g, ln, sz[i], 400, 'Patrick Hand')); h += (i ? sz[i - 1] * .3 + sz[i] * .82 : 0); });
  const x0 = nt.align === 'right' ? nt.x - w : nt.x, top = nt.y - sz[0] * .85;
  return [x0, top, x0 + w, nt.y + h + sz[sz.length - 1] * .25];
}
function fitNote(nt) {
  if (!nt.maxW) return nt;
  const g = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d'));
  const w = Math.max(...nt.lines.map(ln => E.measureHand(g, ln, nt.size, 400, 'Patrick Hand')));
  if (w > nt.maxW) nt.size *= nt.maxW / w;
  return nt;
}
function drawNote(g, nt, t, cam) {
  if (t < nt.t0 || t > nt.t1 + .3) return null;
  const a = 1 - seg(t, nt.t1, nt.t1 + .3);
  const pr = seg(t, nt.t0, nt.t0 + nt.dur), n = nt.lines.length, sz = nt.sizes || nt.lines.map(() => nt.size);
  let tip = null, yy = nt.y;
  g.save(); g.globalAlpha *= a;
  nt.lines.forEach((ln, i) => {
    const p = clamp(pr * n - i);
    if (i > 0) yy += sz[i - 1] * .3 + sz[i] * .82;
    const r = E.handText(g, ln, nt.x, yy, { size: sz[i], color: nt.col, progress: p, align: nt.align || 'left', zoom: cam.zoom, weight: 400 });
    if (p > 0 && p < 1) tip = r.tip;
  });
  if (nt.lead && pr >= 1) {
    const bx = noteBox(nt), lp = seg(t, nt.t0 + nt.dur, nt.t0 + nt.dur + .35);
    const from = [clamp(nt.lead[0], bx[0] + 10, bx[2] - 10), nt.lead[1] > bx[3] ? bx[3] + 2 : bx[1] - 4];
    const tp = E.leader(g, from, nt.lead, { color: nt.col, progress: lp, seed: hash(nt.t0) * 9 });
    if (lp > 0 && lp < 1) tip = tp;
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
  if (t < T.chart2Off + 2) drawChart1(g, t, cam, tips);
  if (t >= T.morph[0] - .1 && t < T.breath[1]) drawChart2(g, t, cam, tips);
  if (t >= T.q1[0] - .1) drawList(g, t, cam, tips);
  for (const nt of notes(t)) { const tp = drawNote(g, fitNote(nt), t, cam); if (tp) tips.push(tp); }

  // ---------- screen space ----------
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawThePencil(g, t, cam, tips);
  drawRise(g, t);
  if (t < T.breath[0]) {
    for (const c of CAPS) drawCaption(g, c, t);
    const s1 = seg(t, b(14), b(14.6)) * (1 - seg(t, b(64.4), b(64.8)));
    const s2 = seg(t, b(68), b(68.6)) * (1 - seg(t, b(83.4), b(83.8)));
    if (s1 > 0) drawSource(g, SRC1, s1); if (s2 > 0) drawSource(g, SRC2, s2);
  }
  if (t >= T.end - .05) drawEndCard(g, t);
}

// ---------- chart 1: quarterly columns in a ratcheting frame ----------
function morphU(i, t) { return clamp((t - (T.morph[0] + i / 30 * (T.morph[1] - T.morph[0] - .8))) / .8); }
function drawChart1(g, t, cam, tips) {
  const { X0, X1, HP } = L, ceil = ceilAt(t), hb = Q[HOOK];
  const gone = seg(t, T.morph[0], T.morph[1]);            // frame elements leave with the morph
  const fa = 1 - gone;
  // frame top (the ceiling): a short stretch exists from the first frame (the hook), the rest is ruled with the axis
  const ap = seg(t, ...T.axis);
  if (fa > 0) {
    g.save(); g.globalAlpha *= fa;
    const topY = -HP;
    // dashed ceiling, ruled right→left with the axis; near the hook bar from t = 0
    const segs = Math.floor((X1 - X0 + 40) / 14);
    for (let k = 0; k < segs; k++) {
      const x = X1 + 20 - k * 14, near = Math.abs(x - hb.x) < (V ? 150 : 140);
      if (!near && k / segs > ap) continue;
      if (Math.abs(x - hb.x) < hb.w * .62) continue;       // the torn gap
      E.pencilStroke(g, [[x - 7, topY], [x, topY]], { color: P.inkSoft, width: 1.5, passes: 1, wobble: .1, seed: k });
    }
    // the scar where the record column tore through
    if (t >= T.pierce) {
      const sc = clamp((t - T.pierce) / .15), x0 = hb.x - hb.w * .62, x1 = hb.x + hb.w * .62, path = [];
      for (let k = 0; k <= 9; k++) path.push([lerp(x0, x1, k / 9), topY - (k % 2 ? 9 : -3) * sc - (k === 0 || k === 9 ? 0 : 4)]);
      E.pencilStroke(g, path, { color: P.ink, width: 1.4, passes: 1, wobble: .2, seed: 77 });
      for (let k = 0; k < 4; k++) { const a = -2.4 + k * .5, l = (10 + 8 * hash(k)) * sc; E.pencilStroke(g, [[hb.x, topY], [hb.x + Math.cos(a) * l * 2.2, topY + Math.sin(a) * l]], { color: P.inkSoft, width: 1, passes: 1, seed: 90 + k }); }
    }
    // baseline (x axis), ruled right → left during the pan
    if (ap > 0) {
      const tp = E.pencilStroke(g, [[X1 + 20, 0], [X0 - 20, 0]], { color: P.ink, width: 2, progress: ap, passes: 1, wobble: .2, seed: 3 });
      if (ap < 1) tips.push(tp);
    } else E.pencilStroke(g, [[hb.x - 60, 0], [hb.x + 60, 0]], { color: P.ink, width: 2, passes: 1, wobble: .2, seed: 4 });
    // y axis + ticks follow the ratchet
    const yp = seg(t, ...T.yaxis);
    if (yp > 0) {
      const tp = E.pencilStroke(g, [[X0 - 20, 0], [X0 - 20, -HP]], { color: P.ink, width: 2, progress: yp, passes: 1, wobble: .2, seed: 2 });
      if (yp < 1) tips.push(tp);
      for (let v = 0; v <= ceil + .01; v += 50) {
        const y = yOf(v, t); if (-y > HP * yp + 2) continue;
        E.pencilStroke(g, [[X0 - 30, y], [X0 - 20, y]], { color: P.ink, width: 1.5, passes: 1 });
        E.setType(g, String(v), X0 - 36, y + 7, { size: V ? 21 : 19, align: 'right', color: v === 100 ? P.ink : P.inkSoft, weight: v === 100 ? 500 : 400 });
      }
      // the 100 reference (2021 average), faint dashes
      const y100 = yOf(100, t), m = Math.floor((X1 - X0) / 16 * clamp(yp * 1.3 - .3));
      g.save(); g.globalAlpha *= .45;
      for (let k = 0; k < m; k++) E.pencilStroke(g, [[X0 - 16 + k * 16, y100], [X0 - 8 + k * 16, y100]], { color: P.inkSoft, width: 1.2, passes: 1, wobble: .1, seed: 200 + k });
      g.restore();
      // ceiling label: the value the frame currently holds
      const cl = Math.round(ceil);
      E.setType(g, String(cl), X0 - 36, -HP + 7, { size: V ? 21 : 19, align: 'right', color: t > T.r1 && t < R2.t0 + R2.steps * R2.dt + .3 ? P.red : P.inkSoft, weight: 500, alpha: yp });
    }
    // year labels + quarter ticks
    for (const q of Q) {
      if (t < q.t - .05 && q.i !== HOOK) continue;
      if (ap <= 0 && q.i !== HOOK) continue;
      E.pencilStroke(g, [[q.x, 0], [q.x, 7]], { color: P.inkSoft, width: 1.1, passes: 1, seed: q.i });
      if (q.lab.endsWith('Q1') && (t >= q.t - .05)) {
        const yr = q.lab.slice(0, 4), xm = q.x + (Q[1].x - Q[0].x) * 1.5;
        E.setType(g, yr, Math.min(xm, X1 - 10), V ? 34 : 30, { size: V ? 20 : 18, align: 'center', color: yr === '2026' ? P.red : P.inkSoft, weight: yr === '2026' ? 500 : 400 });
      }
    }
    g.restore();
  }
  // columns
  for (const q of Q) {
    const isHook = q.i === HOOK;
    const t0 = isHook ? T.hookBar[0] : q.t;
    if (t < t0) continue;
    const u = morphU(q.i, t);
    if (u >= 1) continue;
    let h = q.v * HP / ceil;
    const grow = isHook ? eo(seg(t, ...T.hookBar)) : clamp(E1(t - q.t));
    h *= grow;
    const col = barColor(q.v);
    const x = q.x - q.w / 2;
    if (u <= 0) {
      g.save(); g.fillStyle = col; g.fillRect(x, -h, q.w, h);
      g.globalAlpha *= .9; g.strokeStyle = P.ink; g.lineWidth = 1.2; g.strokeRect(x, -h, q.w, h); g.restore();
      // hatching for depth, light
      if (grow < 1 && !isHook) tips.push([q.x, -h]);
      if (isHook && t < T.hookBar[1]) tips.push([q.x, -h]);
      // the record column is re-inked when the build reaches it
      if (isHook && t >= T.rec && t < T.rec + .6) { const k = (t - T.rec) / .6; g.save(); g.globalAlpha *= (1 - k) * .6; g.strokeStyle = P.red; g.lineWidth = 2; g.strokeRect(x - k * 18, -h - k * 18, q.w + k * 36, h + k * 18); g.restore(); }
    } else {
      // morph: the column flies down into the hospitality row and becomes a slice of its bar
      const e = eio(u), row = SECT.find(s => s.code === 'I'), len = row.pct * L.c2.k, sw = len / 30;
      const tx = L.c2.barX + q.i * sw, ty = row.y - L.c2.rh / 2;
      const X = lerp(x, tx, e), Y = lerp(-h, ty, e) - Math.sin(e * Math.PI) * 160, W2 = lerp(q.w, sw + .6, e), H2 = lerp(h, L.c2.rh, e);
      const c2 = E.rampRGB(clamp(row.pct / 55, 0, 1.3) * .95), c1 = hexRGB(col);
      g.fillStyle = E.rgb(c1.map((c, j) => lerp(c, c2[j], e))); g.fillRect(X, Y, W2, H2);
    }
  }
  // reference levels and the bracket (2019 average vs the first half of 2026)
  const rp = seg(t, ...T.refs);
  if (rp > 0 && t < T.refOff + .3) {
    const a = 1 - seg(t, T.refOff, T.refOff + .3);
    g.save(); g.globalAlpha *= a;
    const y19 = yOf(avg19(), t), y26 = yOf(avg26(), t);
    drawDashed(g, Q[0].x - Q[0].w / 2, Q[3].x + Q[0].w / 2 + (Q[29].x - Q[0].x) * rp, y19, 1, P.ink);
    drawDashed(g, Q[28].x - Q[0].w / 2 - 40, Q[29].x + Q[0].w / 2, y26, rp, P.red);
    E.setType(g, `TB 2019: ${Math.round(avg19())}`, Q[16].x, y19 - 12, { size: V ? 21 : 19, color: P.ink, progress: rp, weight: 500 });
    E.setType(g, `TB nửa đầu 2026: ${Math.round(avg26())}`, Q[27].x - 30, y26 - 14, { size: V ? 21 : 19, color: P.red, progress: rp, weight: 500, align: 'right' });
    const bp = seg(t, ...T.bracket);
    if (bp > 0) {
      const x = Q[29].x + Q[0].w / 2 + (V ? 22 : 26), ya = y26, yb = y19, m = (ya + yb) / 2;
      const path = [[x - 9, yb], ...E.quadPath([x - 9, yb], [x, yb], [x, yb - 9], 4).slice(1), [x, m + 8], [x + 9, m], [x, m - 8], [x, ya + 9], ...E.quadPath([x, ya + 9], [x, ya], [x - 9, ya], 4).slice(1)];
      const tp = E.pencilStroke(g, path, { color: P.red, width: 2.4, progress: bp, passes: 1 });
      if (bp < 1) tips.push(tp);
      const pct = Math.round((avg26() / avg19() - 1) * 100);
      E.handText(g, `+${pct} %`, Q[23].x + Q[0].w / 2, m + 16, { size: L.note + 16, color: P.red, progress: seg(t, T.bracket[1], T.bracket[1] + .6), zoom: cam.zoom, weight: 400, align: 'right' });
      E.pencilStroke(g, [[Q[23].x + Q[0].w / 2 + 8, m + 4], [Q[24].x - Q[0].w / 2 - 6, m + 4]], { color: P.red, width: 1.4, passes: 1, progress: seg(t, T.bracket[1] + .4, T.bracket[1] + .8) });
    }
    g.restore();
  }
  // headline (world space, above the frame)
  drawHeadline(g, t, gone);
}
const E1 = d => d <= 0 ? 0 : back(clamp(d / .3), 1.4);   // quick rise with a small settle
function hexRGB(s) { const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; }
function drawDashed(g, x0, x1, y, p, col) {
  const n = Math.floor((x1 - x0) / 12), m = Math.ceil(n * p);
  for (let i = 0; i < m; i++) E.pencilStroke(g, [[x0 + i * 12, y], [x0 + i * 12 + 7, y]], { color: col, width: 1.6, passes: 1, wobble: .1, seed: i });
}
function drawHeadline(g, t, gone) {
  const h = L.hd, p = seg(t, ...T.head);
  if (p <= 0 || gone >= 1) return;
  g.save(); g.globalAlpha *= 1 - gone;
  HEAD.forEach((s, i) => E.setType(g, s, h.x, h.y + i * h.size * 1.2, { size: h.size, font: 'Newsreader', weight: 600, color: P.ink, progress: clamp(p * 1.6 - i * .3), rise: 8 }));
  E.setType(g, HEADSUB, h.x, h.y + HEAD.length * h.size * 1.2 - 4, { size: V ? 22 : 20, color: P.inkSoft, progress: clamp(p * 1.6 - .6) });
  g.restore();
}

// ---------- chart 2: eight sectors, change 2019 → 2025 ----------
function drawChart2(g, t, cam, tips) {
  const c = L.c2, hp = seg(t, ...T.head2), a = 1;
  // headline
  HEAD2.forEach((s, i) => E.setType(g, s, V ? L.X0 : L.X0, c.y + i * (V ? 54 : 42), { size: V ? 44 : 36, font: 'Newsreader', weight: 600, color: P.ink, progress: clamp(hp * 1.6 - i * .3), rise: 8 }));
  E.setType(g, HEAD2SUB, L.X0, c.y + (V ? 54 : 42) * 2 - 6, { size: V ? 22 : 20, color: P.inkSoft, progress: clamp(hp * 1.6 - .6) });
  // zero line
  const zp = seg(t, T.rows - .6, T.rows + .4), y0 = SECT[0].y - c.rh, y1 = SECT[SECT.length - 1].y + c.rh * .6;
  if (zp > 0) E.pencilStroke(g, [[c.barX, y0], [c.barX, lerp(y0, y1, zp)]], { color: P.ink, width: 2, passes: 1, wobble: .2, seed: 5 });
  let k2 = 0;
  SECT.forEach((s, k) => {
    const isI = s.code === 'I', len = s.pct * c.k;
    const t0 = isI ? T.morph[1] - .2 : T.rows + (k2++) * b(.75);
    // name
    const na = isI ? seg(t, T.morph[0] + 1, T.morph[1]) : seg(t, t0 - .2, t0 + .2);
    E.setType(g, s.vi, c.nameX, s.y + 9, { size: c.size, font: 'Be Vietnam Pro', weight: isI ? 700 : 400, color: isI ? P.ink : P.inkSoft, align: 'right', alpha: na });
    if (!isI) {
      const gr = eo(seg(t, t0, t0 + .45));
      if (gr > 0) {
        g.fillStyle = pctColor(s.pct); g.fillRect(c.barX, s.y - c.rh / 2, len * gr, c.rh);
        g.save(); g.strokeStyle = P.ink; g.lineWidth = 1; g.globalAlpha *= .8; g.strokeRect(c.barX, s.y - c.rh / 2, len * gr, c.rh); g.restore();
        if (gr < 1) tips.push([c.barX + len * gr, s.y - c.rh / 2]);
      }
    } else if (t >= T.morph[1]) {
      g.fillStyle = pctColor(s.pct); g.fillRect(c.barX, s.y - c.rh / 2, len, c.rh);
      g.save(); g.strokeStyle = P.ink; g.lineWidth = 1.4; g.strokeRect(c.barX, s.y - c.rh / 2, len, c.rh); g.restore();
    }
    const la = isI ? seg(t, T.morph[1], T.morph[1] + .4) : seg(t, t0 + .35, t0 + .6);
    E.setType(g, `+${s.pct} %`, c.barX + len + 12, s.y + 9, { size: c.size - 2, color: isI ? P.red : P.ink, weight: 500, alpha: la });
  });
  // notes: "your industry" ring, "8 / 8"
  const I = SECT.find(s => s.code === 'I');
  const rp = seg(t, T.n6, T.n6 + .6);
  if (rp > 0) {
    const g2 = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d')); g2.font = `700 ${c.size}px "Be Vietnam Pro"`;
    const w = g2.measureText(I.vi).width, cx = c.nameX - w / 2, path = [];
    for (let i = 0; i <= 48; i++) { const an = -2.3 + i / 48 * Math.PI * 2.1; path.push([cx + Math.cos(an) * (w / 2 + 16), I.y + Math.sin(an) * (c.rh * .75)]); }
    const tp = E.pencilStroke(g, path, { color: P.blue, width: 2, progress: rp, passes: 1, seed: 8 });
    if (rp < 1) tips.push(tp);
  }
  const np = seg(t, T.n5, T.n5 + 1.0);
  if (np > 0) {
    const x = V ? c.barX + 120 : c.barX + 260, y = SECT[SECT.length - 1].y + (V ? 110 : 96);
    const r = E.handText(g, '8 / 8 nhóm ngành đều tăng', x, y, { size: L.note + 8, color: P.red, progress: np, zoom: cam.zoom, weight: 400, align: 'center' });
    if (np < 1) tips.push(r.tip);
  }
}

// ---------- the turn: a question and four answers, in words ----------
function itemT(k) { return T.item0 + k * T.itemGap; }
function listGeom() {
  const F = L.F, q1y = F.y, q2y = F.y + F.qs * 1.25, top = q2y + F.qs * (V ? 1.25 : 1.05);
  return { q1y, q2y, items: ITEMS.map((it, k) => ({ y: top + k * F.pitch, ix: F.x + 28, tx: F.x + 80 })) };
}
function iconPath(kind, x, y, s) {
  if (kind === 'pin') { const out = [], R = s * .45, hy = y - s * .45; for (let i = 0; i <= 40; i++) { const a = Math.PI * (0.78 + i / 40 * 1.44); out.push([x + Math.cos(a) * R, hy + Math.sin(a) * R]); } out.push([x, y + s * .5]); out.push(out[0]); return out; }
  if (kind === 'star') { const out = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .25 : s * .55; out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return out; }
  if (kind === 'cal') { const w = s * .5; return [[x - w, y - w * .8], [x + w, y - w * .8], [x + w, y + w], [x - w, y + w], [x - w, y - w * .8], [x - w, y - w * .3], [x + w, y - w * .3]]; }
  return E.heartPath(x, y + s * .1, s / 34);
}
function drawList(g, t, cam, tips) {
  const F = L.F, G = listGeom();
  const off = seg(t, T.rise[0], T.rise[1]);
  // the question
  const p1 = seg(t, ...T.q1), p2 = seg(t, ...T.q2);
  if (p1 > 0) { const r = E.handText(g, QL[0], F.x, G.q1y, { size: F.qs, color: P.ink, progress: p1, zoom: cam.zoom, weight: 400 }); if (p1 < 1) tips.push(r.tip); }
  if (p2 > 0) {
    const r = E.handText(g, QL[1], F.x, G.q2y, { size: F.qs, color: P.red, progress: p2, zoom: cam.zoom, weight: 400 }); if (p2 < 1) tips.push(r.tip);
    const ul = seg(t, T.q2[1], T.q2[1] + .5);
    if (ul > 0) { const tp = E.pencilStroke(g, E.quadPath([F.x, G.q2y + 16], [F.x + r.w / 2, G.q2y + 24], [F.x + r.w, G.q2y + 12]), { color: P.red, width: 3, progress: ul, passes: 2, seed: 12 }); if (ul < 1) tips.push(tp); }
  }
  ITEMS.forEach((it, k) => {
    const gi = G.items[k], t0 = itemT(k);
    if (t < t0) return;
    const ip = seg(t, t0, t0 + b(1)), wp = seg(t, t0 + b(1), t0 + b(4));
    const isz = F.is;
    const tp0 = E.pencilStroke(g, iconPath(it.icon, gi.ix, gi.y - isz * .32, isz * 1.05), { color: P.blue, width: 2.2, progress: ip, passes: 1, seed: 30 + k });
    if (ip < 1) tips.push(tp0);
    const lines = F.one ? [it.lines.join(' ')] : it.lines;
    lines.forEach((ln, j) => {
      const p = clamp(wp * lines.length - j);
      if (p <= 0) return;
      const r = E.handText(g, ln, gi.tx, gi.y + j * isz * 1.18, { size: isz, color: P.blue, progress: p, zoom: cam.zoom, weight: 400 });
      if (p < 1) tips.push(r.tip);
    });
    // SAMI tag: stamped under the line
    const ts = T.tags + k * b(1.5);
    if (t >= ts) {
      const fr = t - ts, s = fr < .25 ? 1 + .25 * Math.sin(fr / .25 * Math.PI) : 1, a = clamp(fr / .15);
      const ty = gi.y + (lines.length - 1) * isz * 1.18 + (V ? 58 : 50), tsz = V ? 27 : 24;
      const g2 = noteBox.g || (noteBox.g = new OffscreenCanvas(8, 8).getContext('2d')); g2.font = `600 ${tsz}px "Be Vietnam Pro"`;
      const tw = g2.measureText(it.tag).width + 36, th = tsz * 1.6;
      g.save(); g.globalAlpha *= a; g.translate(gi.tx + tw / 2, ty - th * .32); g.rotate(-.012 + .024 * hash(k)); g.scale(s, s);
      g.fillStyle = ACC; g.beginPath(); g.roundRect(-tw / 2, -th / 2, tw, th, th / 2); g.fill();
      g.font = g2.font; g.fillStyle = NAVY; g.textAlign = 'center'; g.fillText(it.tag, 0, tsz * .36); g.restore();
    }
    // red tick
    const tk = seg(t, T.ticks + k * b(.75), T.ticks + k * b(.75) + .3);
    if (tk > 0) { const x = gi.ix, y = gi.y - isz * .32, sz = isz * .5; const tp = E.pencilStroke(g, [[x - sz * 1.1, y - sz * .1], [x - sz * .4, y + sz * .7], [x + sz * 1.2, y - sz * 1.3]], { color: P.red, width: 4, progress: tk, passes: 2, seed: 60 + k }); if (tk < 1) tips.push(tp); }
  });
}
// the last column: navy, from the bottom of the frame to the top (screen space)
function drawRise(g, t) {
  const p = seg(t, ...T.rise);
  if (p <= 0 || t > T.end + .1) return;
  const W = E.W, H = E.H, e = eio(p), top = H * (1 - e) - 40 * (1 - e);
  g.save(); g.fillStyle = NAVY; g.beginPath(); g.moveTo(0, H);
  for (let i = 0; i <= 24; i++) { const x = W * i / 24; g.lineTo(x, top + Math.sin(i * 1.7 + p * 6) * 6 * (1 - e)); }
  g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = ACC; g.lineWidth = 3; g.globalAlpha = 1 - e; g.beginPath(); g.moveTo(0, top); g.lineTo(W, top); g.stroke(); g.restore();
}

// ---------- the pencil ----------
function drawThePencil(g, t, cam, tips) {
  if (t > T.breath[0] + 1.5) return;
  let tip = tips.length ? tips[tips.length - 1] : null, lift;
  if (!tip) { tip = hoverPoint(t); lift = .5 + .08 * Math.sin(t * 1.7); }
  else lift = .05 + .04 * Math.abs(Math.sin(t * 9));
  // tapping each new column; hesitation before the record
  if (t >= T.hush1[0] && t < T.rec) { const hb = Q[HOOK]; tip = [hb.x - 40 + Math.sin(t * 40) * 1.5, yOf(Q[27].v, t) - 70]; lift = .35 + .05 * Math.sin(t * 13); }
  let S = E.w2s(cam, tip[0], tip[1]);
  const ex = seg(t, T.breath[0], T.breath[0] + 1.2);
  if (ex > 0) { S = [lerp(S[0], E.W + 400, eio(ex)), lerp(S[1], E.H + 300, eio(ex))]; lift = lerp(lift, 1.0, ex); }
  E.drawPencil(g, { tip: S, s: (V ? .56 : .6) * Math.min(1.3, Math.max(.85, cam.zoom * .8)), lift, flip: pencilFlip(t), ang: V ? .9 : .62 });
}
function hoverPoint(t) {
  const hb = Q[HOOK];
  if (t < T.axis[0]) return [hb.x + 40, yOf(hb.v, t) + 60];
  if (t < Q[0].t) return [Q[0].x + 20, -L.HP * .5];
  if (t < T.morph[0]) { let q = Q[0]; for (const qq of Q) if (qq.i !== HOOK && t >= qq.t) q = qq; return [q.x + 26, yOf(q.v, t) - 50]; }
  if (t < T.hush2[0]) return [L.c2.barX + 300, SECT[SECT.length - 1].y + 60];
  const G = listGeom();
  if (t < T.item0) return [L.F.x + 200, G.items[0].y - 40];
  return [L.F.x + 500, G.items[3].y + 80];
}
function pencilFlip(t) {                      // 0 = blue end, 1 = red end; a lead change marks a turn
  const k = [[0, 1], [b(11), 1], [b(11.5), 0], [b(47.2), 0], [b(47.7), 1], [b(63.5), 1], [b(64), 0], [b(75.6), 0], [b(76.1), 1], [b(85.5), 1], [b(86), 0],
    [b(87.6), 0], [b(88), 1], [b(91), 1], [b(91.5), 0], [b(116), 0], [b(116.4), 1], [500, 1]];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], eio(seg(t, k[i][0], k[i + 1][0])));
  return 1;
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

// ---------- end card (SAMI colours inside the navy column) ----------
function endGeom() {
  const W = E.W;
  return V ? { cx: W / 2, logoY: 520, logoW: 640, tagY: 760, h1: [900, 990, 1080], h1s: 78, ctaY: [1210, 1262], ctaS: 38, pillY: 1340, urlY: 1490 }
           : { cx: W / 2, logoY: 150, logoW: 560, tagY: 370, h1: [490], h1s: 70, ctaY: [600], ctaS: 34, pillY: 660, urlY: 820 };
}
const H1 = ['Thêm khách.', 'Thêm doanh thu.', 'Thêm thời gian.'];
const CTA = vv => vv ? ['Nhắn WhatsApp cho SAMI, nhận phân tích', 'marketing miễn phí, không ràng buộc.'] : ['Nhắn WhatsApp cho SAMI, nhận phân tích marketing miễn phí, không ràng buộc.'];
function drawEndCard(g, t) {
  const W = E.W, H = E.H, k = endGeom(), a0 = seg(t, T.end - .05, T.end + .1);
  if (a0 <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = NAVY; g.fillRect(0, 0, W, H);
  const gl = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(12,6,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  gl(W * .8, H * .2, W * .6, 'rgba(118,103,254,.33)'); gl(W * .15, H * .85, W * .55, 'rgba(8,221,164,.16)');
  // faint mint columns breathing along the bottom edge: the chart, turned into a skyline of open restaurants
  const n = V ? 14 : 24, cw = W / n;
  for (let i = 0; i < n; i++) {
    const hh = (V ? 90 : 60) + 70 * hash(i * 3.1) + 18 * Math.sin((t - T.end) * 1.4 + i);
    g.save(); g.globalAlpha = .1; g.fillStyle = ACC; g.fillRect(i * cw + cw * .2, H - hh * clamp((t - T.end - i * .04) / .6), cw * .6, hh); g.restore();
  }
  const e = s => eo(seg(t, T.end + s, T.end + s + .5));
  if (logo) { const lw = k.logoW, lh = lw * 1024 / 3120, a = e(0); g.globalAlpha = a; const lx = k.cx - lw / 2, ly = k.logoY - lh / 2 + (1 - a) * 18; g.save(); g.beginPath(); g.rect(lx - 10, ly - 10, lw * .395 + 10, lh + 20); g.rect(lx + lw * .395, ly - 10, lw * .7, lh * .55 + 10); g.clip(); g.drawImage(logo, lx, ly, lw, lh); g.restore(); g.globalAlpha = 1; }
  txt(g, 'STRATEGY • AUTOMATION • MARKETING • INTELLIGENCE', k.cx, k.tagY, { size: V ? 22 : 20, weight: 600, color: LAV, a: e(.3) * .85, track: V ? 3 : 4 });
  if (V) H1.forEach((s, i) => txt(g, s, k.cx, k.h1[i], { size: k.h1s, weight: 800, color: i === 0 ? ACC : '#FFFFFF', a: e(.5 + i * .25) }));
  else txt(g, H1.join(' '), k.cx, k.h1[0], { size: k.h1s, weight: 800, color: '#FFFFFF', a: e(.5) });
  const ul = seg(t, T.end + 1.4, T.end + 2.0);
  if (ul > 0) { const yU = k.h1[0] + 22, w = V ? 400 : 1100, x0 = k.cx - w / 2; E.pencilStroke(g, E.quadPath([x0, yU + 4], [x0 + w / 2, yU + 12], [x0 + w, yU]), { color: ACC, width: 5, progress: ul, passes: 2, seed: 21 }); }
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
  if (t >= T.head[0] && t < T.morph[0]) {
    const h = L.hd; g.font = `600 ${h.size}px Newsreader`; const w = Math.max(...HEAD.map(s => g.measureText(s).width));
    box('head', HEAD.join(' ') + ' ' + HEADSUB, [h.x, h.y - h.size * .85, h.x + w, h.y + HEAD.length * h.size * 1.2]);
  }
  if (t >= T.head2[0] && t < T.chart2Off) box('head2', HEAD2.join(' ') + ' ' + HEAD2SUB, [L.X0, L.c2.y - 40, L.X0 + 600, L.c2.y + 90]);
  if (t >= T.rows && t < T.chart2Off) for (const s of SECT) box('s' + s.code, `${s.vi} +${s.pct} %`, [L.c2.nameX - 300, s.y - 20, L.c2.barX + s.pct * L.c2.k + 120, s.y + 14]);
  if (t >= T.n5 && t < T.chart2Off) box('n5', '8 / 8 nhóm ngành đều tăng', [L.c2.barX, SECT[7].y + 70, L.c2.barX + 400, SECT[7].y + 120]);
  if (t >= T.bracket[1] && t < T.refOff) { const m = (yOf(avg26(), t) + yOf(avg19(), t)) / 2; box('pct', `+${Math.round((avg26() / avg19() - 1) * 100)} %`, [Q[23].x - 110, m - 30, Q[23].x + 10, m + 20]); }
  for (const nt0 of notes(t)) { const nt = fitNote(nt0); if (t >= nt.t0 && t <= nt.t1) box(nt.id, nt.lines.join(' '), noteBox(nt)); }
  for (const c of CAPS) if (t >= c.t0 && t <= c.t1) {
    const lay = capLayout(g, c), y = capY(g, c), top = y - (lay.n - 1) * lay.lh;
    out.push({ id: c.id, text: c.text, x0: L.cap.x, y0: top - L.cap.size, x1: L.cap.x + lay.maxLine, y1: y + L.cap.size * .3 });
  }
  const src = (id, s, a0, a1) => { if (t >= a0 && t < a1) { const k = L.src, n = srcLines(g, s).length; out.push({ id, text: s, x0: k.x, y0: k.y - k.size, x1: k.x + k.maxW, y1: k.y + (n - 1) * k.size * 1.35 + 6 }); } };
  src('src1', SRC1, b(14.6), b(64.4)); src('src2', SRC2, b(68.6), b(83.4));
  if (t < T.rise[0]) {
    const G = listGeom(), F = L.F;
    if (t >= T.q1[0]) box('q1', QL[0], [F.x, G.q1y - F.qs * .85, F.x + E.measureHand(g, QL[0], F.qs, 400, 'Patrick Hand'), G.q1y + F.qs * .25]);
    if (t >= T.q2[0]) box('q2', QL[1], [F.x, G.q2y - F.qs * .85, F.x + E.measureHand(g, QL[1], F.qs, 400, 'Patrick Hand'), G.q2y + F.qs * .25]);
    ITEMS.forEach((it, k) => {
      const gi = G.items[k], lines = F.one ? [it.lines.join(' ')] : it.lines;
      if (t >= itemT(k) + b(1)) box('it' + k, it.lines.join(' '), [gi.tx, gi.y - F.is * .85, gi.tx + Math.max(...lines.map(l => E.measureHand(g, l, F.is, 400, 'Patrick Hand'))), gi.y + (lines.length - 1) * F.is * 1.18 + F.is * .25]);
      if (t >= T.tags + k * b(1.5)) box('tag' + k, it.tag, [gi.tx, gi.y + (lines.length - 1) * F.is * 1.18 + 20, gi.tx + 420, gi.y + (lines.length - 1) * F.is * 1.18 + 70]);
    });
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
  ev.push({ t: 0, type: 'draw', d: T.hookBar[1] }, { t: T.pierce, type: 'puncture' }, { t: T.h1, type: 'write', d: 1.2 });
  ev.push({ t: T.axis[0], type: 'ruler', d: T.axis[1] - T.axis[0] }, { t: T.yaxis[0], type: 'ruler', d: T.yaxis[1] - T.yaxis[0] }, { t: T.head[0], type: 'type', d: .9 });
  for (const q of Q) if (q.i !== HOOK) ev.push({ t: q.t, type: 'dot', v: q.v, i: q.i });
  ev.push({ t: T.rec, type: 'record', v: Q[HOOK].v });
  for (let k = 0; k < R1.steps; k++) ev.push({ t: R1.t0 + k * R1.dt, type: 'ratchet', k, big: 0 });
  for (let k = 0; k < R2.steps; k++) ev.push({ t: R2.t0 + k * R2.dt, type: 'ratchet', k, big: 1 });
  for (const nt of notes(0)) ev.push({ t: nt.t0, type: 'write', d: nt.dur });
  ev.push({ t: b(11.2), type: 'flip' }, { t: b(47.4), type: 'flip' }, { t: b(63.7), type: 'flip' }, { t: b(75.8), type: 'flip' }, { t: b(85.7), type: 'flip' }, { t: b(87.7), type: 'flip' }, { t: b(91.2), type: 'flip' }, { t: b(116.1), type: 'flip' });
  ev.push({ t: T.hush1[0], type: 'silence', d: T.hush1[1] - T.hush1[0] });
  ev.push({ t: T.refs[0], type: 'ruler', d: T.refs[1] - T.refs[0] }, { t: T.bracket[0], type: 'scratch', d: .6 }, { t: T.bracket[1], type: 'write', d: .6 });
  ev.push({ t: T.morph[0], type: 'sweep', d: T.morph[1] - T.morph[0] }, { t: T.morph[0] + .3, type: 'whoosh', d: 1.2 }, { t: T.head2[0], type: 'type', d: .9 });
  ev.push({ t: T.morph[1] - .2, type: 'bar', v: SECT.find(s => s.code === 'I').pct, k: 0 });
  let k2 = 0; SECT.forEach(s => { if (s.code !== 'I') ev.push({ t: T.rows + (k2++) * b(.75), type: 'bar', v: s.pct, k: k2 }); });
  ev.push({ t: T.rows - .6, type: 'ruler', d: 1.0 }, { t: T.n6, type: 'scratch', d: .6 }, { t: T.n5, type: 'write', d: 1.0 });
  ev.push({ t: T.hush2[0], type: 'silence', d: T.hush2[1] - T.hush2[0] }, { t: T.hush2[0] + .2, type: 'whoosh', d: 1.0 });
  ev.push({ t: T.q1[0], type: 'write', d: T.q1[1] - T.q1[0] }, { t: T.q2[0], type: 'write', d: T.q2[1] - T.q2[0] }, { t: T.q2[1], type: 'scratch', d: .5 });
  ITEMS.forEach((it, k) => { ev.push({ t: itemT(k), type: 'scratch', d: b(1) }, { t: itemT(k) + b(1), type: 'write', d: b(3) }); ev.push({ t: T.tags + k * b(1.5), type: 'stamp', k }); ev.push({ t: T.ticks + k * b(.75), type: 'tick', k }); });
  ev.push({ t: T.breath[0], type: 'silence', d: T.breath[1] - T.breath[0] });
  ev.push({ t: T.rise[0], type: 'rise', d: T.rise[1] - T.rise[0] }, { t: T.end, type: 'logo' }, { t: T.end + 1.8, type: 'pop', v: 1 }, { t: T.end + 1.4, type: 'scratch', d: .6 });
  return ev.sort((a, c) => a.t - c.t);
}
