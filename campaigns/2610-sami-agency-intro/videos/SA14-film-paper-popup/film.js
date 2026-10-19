// SA14 · "Từ một căn bếp nhỏ đến quán kín bàn" — timeline, sách, các trang, máy quay, chữ, sự kiện âm thanh.
// 90 BPM: 1 phách = 0,667 s, 1 ô nhịp = 2,667 s. Mọi thứ là hàm thuần của t.
import { clamp, lerp, seg, eio, eo, ei, back, spring, track, hash, mulberry, TAU } from '/core/lib.js';
import { M, norm, sub } from './gl.js';
import * as A from './art.js';

export const BEAT = 2 / 3, BAR = 8 / 3;
export const DUR = 90.0;
export const TURN = [16.0, 34.667, 61.333, 74.667];  // lật trang
const TD = 1.6;                                      // thời gian lật
const P1 = 40.0, P2 = 46.667, P3 = 52.667;           // ba pull-tab
const WASH = 62.0, LANT = 63.0, CLOSE = 81.333, LOGO = 82.667, CTA = 83.3;
const PB = 0.014, BOARD = 0.003, GY = BOARD + PB + 0.0004, BW = A.BW, BD = A.BD;

// ---------- chữ kể chuyện ----------
export const CAP = [
  [2.5, 9.0, 'Ở một góc phố nước Đức, có một căn bếp nhỏ nấu bằng cả trái tim.'],
  [9.4, 15.6, 'Nước dùng ninh từ sáng sớm. Mỗi bát phở là một chút quê nhà.'],
  [18.0, 24.4, 'Ngoài kia phố rất đông. Nhưng chẳng ai biết sau cánh cửa nhỏ này có gì.'],
  [24.6, 30.9, 'Khách mở điện thoại tìm chỗ ăn, và quán của bạn không có trên bản đồ.'],
  [31.0, 34.6, 'Bếp vẫn nóng. Bàn vẫn trống.'],
  [35.6, 41.0, 'Và đó là lúc SAMI cùng bạn viết trang tiếp theo.'],
  [41.2, 47.0, 'Trước hết là một thương hiệu riêng, để khách nhìn một lần là nhớ.'],
  [47.2, 52.6, 'Rồi một website đặt bàn ngay trên điện thoại, chỉ cần một chạm.'],
  [52.8, 59.6, 'Và quán của bạn có mặt trên Google Maps, đúng lúc khách đang tìm chỗ ăn.'],
  [62.6, 68.2, 'Một tối thứ Ba, đèn lồng sáng lên, và từng bàn dần kín chỗ.'],
  [68.4, 74.0, 'Khách tìm thấy bạn, tin bạn, đặt bàn, rồi quay lại.'],
  [75.6, 81.6, 'Mỗi món ngon đều có một câu chuyện. Hãy để nhiều người được nghe.', 'serif'],
];
// bong bóng trong thế giới giấy (gõ chữ): [t0, t1, neo, dòng chính, dòng phụ[], kiểu]
const BUB = [
  [23.0, 30.4, 'ped', 'Restaurant in der Nähe', ['Pizzeria Sole · 300 m', 'Burger Ecke · 450 m', 'Imbiss Linde · 600 m'], 'search'],
  [55.0, 61.0, 'pin', 'Pho in der Nähe', [], 'search'],
];

let W, H, R, LOGO_IMG, WALNUT, TEA, LAMP, V, cvO, gO, tall;
const C = {};      // canvas tĩnh
const cache = new Map();
const memo = (k, f) => { let v = cache.get(k); if (!v) { v = f(); cache.set(k, v); } return v; };

export function setup(w, h, r, assets, overlay) {
  W = w; H = h; R = r; R.leaf = R.strip(NS); tall = H > W; LOGO_IMG = assets.logo; WALNUT = assets.walnut; TEA = assets.tea; LAMP = assets.lamp; cvO = overlay; gO = overlay.getContext('2d');
  WALNUT._repeat = true;
  C.kb = A.kitchenBack(); C.kg = A.kitchenGround(); C.sb = A.streetBack(false); C.sg = A.streetGround(false);
  C.wb = A.workBack(); C.wg = A.mapGround(); C.nb = A.streetBack(true); C.ng = A.streetGround(true); C.lb = A.lastBack(); C.lg = A.lastGround();
  C.cover = A.coverArt(LOGO_IMG); C.cloth = cloth(); C.edge = pageEdge(); C.wall = wall();
  C.site = (() => { const c = A.cv(740, 1520); A.siteDraw(c.getContext('2d'), 740, 1520, 1.4); return c; })();
  // thẻ tĩnh
  C.stove = A.card(.17, .072, A.stoveDraw); C.pot = A.card(.05, .045, A.potDraw); C.wok = A.card(.06, .028, A.wokDraw);
  C.shelf = A.card(.08, .11, A.shelfDraw); C.table = A.card(.085, .05, (x, w, h) => A.tableDraw(x, w, h, true)); C.herb = A.card(.035, .045, A.herbDraw);
  C.lamp = A.card(.04, .02, A.hangLampDraw);
  const HC = ['#a8a0d6', '#9fb3dd', '#b9a7d9'];
  C.house = [0, 1, 2].map(i => A.card(.12, .15 - i * .01, (x, w, h) => A.houseDraw(x, w, h, HC[i], 10 + i, false)));
  C.houseN = [0, 1, 2].map(i => A.card(.12, .15 - i * .01, (x, w, h) => A.houseDraw(x, w, h, ['#6b4470', '#5a3e74', '#7a4a6a'][i], 10 + i, true)));
  C.shopA = A.card(.085, .085, (x, w, h) => A.otherShopDraw(x, w, h, '#8fc0a4', 'Pizzeria Sole'));
  C.shopB = A.card(.08, .08, (x, w, h) => A.otherShopDraw(x, w, h, '#e3b787', 'Burger Ecke'));
  C.shopAN = A.card(.085, .085, (x, w, h) => A.otherShopDraw(x, w, h, '#5f8a78', 'Pizzeria Sole'));
  C.shopBN = A.card(.08, .08, (x, w, h) => A.otherShopDraw(x, w, h, '#a8805a', 'Burger Ecke'));
  C.tree = A.card(.045, .07, (x, w, h) => A.treeDraw(x, w, h)); C.treeN = A.card(.045, .07, (x, w, h) => A.treeDraw(x, w, h, '#3f6a5a'));
  C.post = A.card(.018, .09, (x, w, h) => A.lampPostDraw(x, w, h, false)); C.postN = A.card(.018, .09, (x, w, h) => A.lampPostDraw(x, w, h, true));
  C.facP = A.card(A.FAC.w, A.FAC.h, (x, w, h) => A.facadeDraw(x, w, h, false), { paper: '#fbf6ea' });
  C.facArt = (() => { const a = A.card(A.FAC.w, A.FAC.h, (x, w, h) => { A.facadeDraw(x, w, h, true); x.save(); x.translate(w * .14, h * .3); A.signDraw(x, w * .72, h * .14, true); x.restore(); }, { raw: true }); return a; })();
  C.facPRaw = A.card(A.FAC.w, A.FAC.h, (x, w, h) => A.facadeDraw(x, w, h, false), { raw: true });
  C.sign = A.card(.16, .052, (x, w, h) => A.signDraw(x, w, h, true));
  C.tabs = ['1 Thương hiệu', '2 Website', '3 Google Maps'].map(s => A.card(.115, .034, (x, w, h) => A.tabDraw(x, w, h, s), { border: 8 }));
  C.sw = [['#2f4a3a', 'Rêu'], ['#d9473a', 'Đỏ'], ['#f4c86a', 'Vàng'], ['#f4e3c1', 'Kem']].map(([c, n]) => A.card(.026, .036, (x, w, h) => A.swatchDraw(x, w, h, c, n), { border: 10 }));
  C.phoneCard = A.card(.05, .095, A.phoneCardDraw);
  C.pin = A.card(.026, .04, A.pinDraw);
  C.lanOff = A.card(.022, .032, (x, w, h) => A.lanternDraw(x, w, h, false), { border: 10 });
  C.lanOn = A.card(.022, .032, (x, w, h) => A.lanternDraw(x, w, h, true), { border: 10 });
  C.terrace = [0, 1].map(i => A.card(.075, .06, (x, w, h) => { x.save(); x.translate(w * .05, -h * .05); x.scale(.42, .55); A.personDraw(x, w * .9, h * 1.4, 3 + i * 2, .25); x.restore();
    x.save(); x.translate(w * .55, -h * .05); x.scale(.42, .55); A.personDraw(x, w * .9, h * 1.4, 4 + i, .75); x.restore(); A.tableDraw(x, w, h, true, i ? '#f4e3c1' : '#e9d3b0'); }));
  C.chair = A.card(.022, .035, A.chairDraw, { border: 10 });
  C.lastLan = A.card(.05, .072, (x, w, h) => A.lanternDraw(x, w, h, true));
  C.ticket = ticketCard();
}
function cloth() { const c = A.cv(512, 512), x = c.getContext('2d'); x.fillStyle = '#1a1533'; x.fillRect(0, 0, 512, 512); const Rr = mulberry(8);
  for (let i = 0; i < 6000; i++) { x.fillStyle = Rr() < .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.15)'; x.fillRect(Rr() * 512, Rr() * 512, 2 + Rr() * 6, 1); x.fillRect(Rr() * 512, Rr() * 512, 1, 2 + Rr() * 6); } return c; }
function pageEdge() { const c = A.cv(256, 64), x = c.getContext('2d'); x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 256, 64); for (let i = 0; i < 64; i += 2) { x.fillStyle = `rgba(120,100,80,${.08 + hash(i) * .1})`; x.fillRect(0, i, 256, 1); } return c; }
function wall() { const c = A.cv(1024, 512), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#2a1d17'); g.addColorStop(1, '#4a3324'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const Rr = mulberry(4); for (let i = 0; i < 26; i++) { const px = Rr() * 1024, py = 80 + Rr() * 300, r = 20 + Rr() * 70, gg = x.createRadialGradient(px, py, 0, px, py, r); gg.addColorStop(0, `rgba(255,${180 + Rr() * 50 | 0},120,${.15 + Rr() * .3})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  // kệ sách mờ phía xa
  for (let i = 0; i < 40; i++) { x.fillStyle = ['#6b3a2a', '#3d4a5a', '#8a6a3a', '#5a2e3a'][i % 4]; x.fillRect(560 + i * 11, 300 - (i * 37 % 40), 9, 80 + (i * 37 % 40)); }
  return c; }
function ticketCard() {
  // thẻ giấy CTA (2D overlay, nhưng hoàn thiện bằng finishCut như mọi mảnh giấy)
  const w = tall ? 900 : 760, h = tall ? 420 : 400;
  const a = A.cv(w + 60, h + 60), x = a.getContext('2d'); x.translate(30, 30);
  A.wrect(x, 0, 0, w, h, 1301, 2.5, 22); A.sh(x, '#fffaf0', 7);
  A.text(x, 'Phân tích marketing miễn phí,', w / 2, h * .2, `800 ${tall ? 46 : 40}px "Nunito"`, A.INK);
  A.text(x, 'không ràng buộc.', w / 2, h * .2 + (tall ? 56 : 50), `800 ${tall ? 46 : 40}px "Nunito"`, A.INK);
  // bong bóng chat xanh vẽ bằng code (không logo)
  const bx = w * .5, by = h * .62; x.beginPath(); x.roundRect(bx - w * .42, by - 52, w * .84, 104, 52); x.fillStyle = '#25b864'; x.fill(); x.lineWidth = 6; x.strokeStyle = A.INK; x.stroke();
  x.beginPath(); x.moveTo(bx - w * .36, by + 40); x.lineTo(bx - w * .42, by + 74); x.lineTo(bx - w * .26, by + 50); x.closePath(); x.fillStyle = '#25b864'; x.fill(); x.stroke();
  x.beginPath(); x.roundRect(bx - w * .42, by - 52, w * .84, 104, 52); x.fillStyle = '#25b864'; x.fill();
  // biểu tượng tin nhắn đơn giản
  const ix = bx - w * .35; x.beginPath(); x.arc(ix, by, 24, 0, TAU); x.fillStyle = '#fff'; x.fill(); x.beginPath(); x.moveTo(ix - 14, by + 16); x.lineTo(ix - 20, by + 30); x.lineTo(ix - 2, by + 22); x.fill();
  x.beginPath(); x.arc(ix, by, 13, 0, TAU); x.fillStyle = '#25b864'; x.fill();
  A.text(x, 'WhatsApp +49 155 60456888', bx + w * .04, by + 14, `800 ${tall ? 42 : 36}px "Nunito"`, '#fff');
  A.text(x, 'sami-agency.de', w / 2, h * .93, `800 ${tall ? 44 : 38}px "Baloo 2"`, '#5a4fd6');
  return A.finishCut(a, 14);
}

// ---------- tiện ích ----------
const rad = d => d * Math.PI / 180;
function spreadAt(t) { let i = 0; while (i < TURN.length && t >= TURN[i]) i++; return i; }   // 0..4
// góc nâng của tờ đang lật (0 = nằm, π/2 = đứng)
const leafU = (t, k) => eio(seg(t, TURN[k], TURN[k] + TD));
// thời điểm tờ lật quét qua điểm (z, h) — để thẻ bật đúng lúc được "giải phóng"
function clearT(k, z, h) { const a = Math.atan2(h, Math.max(z, .005)) + rad(14), u = clamp(a / (Math.PI / 2)); // u của eio
  let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (eio(m) < u) lo = m; else hi = m; } return TURN[k] + lo * TD; }

// ---------- bố cục từng trang ----------
// mỗi thẻ: {c (canvas | fn(t)), x, z, y?, yaw?, dir(-1 nằm ngửa ra sau, +1 úp về trước), rise?, fold?, sway?}
const STREET = night => [
  { id: 'h0', c: night ? C.houseN[0] : C.house[0], x: -.135, z: .02, dir: -1 },
  { id: 'h1', c: night ? C.houseN[1] : C.house[1], x: 0, z: .015, dir: -1 },
  { id: 'h2', c: night ? C.houseN[2] : C.house[2], x: .14, z: .02, dir: -1 },
  { id: 'sa', c: night ? C.shopAN : C.shopA, x: -.11, z: .07, dir: -1 },
  { id: 'sb', c: night ? C.shopBN : C.shopB, x: -.01, z: .072, dir: -1 },
  { id: 't1', c: night ? C.treeN : C.tree, x: -.175, z: .1, dir: 1, sway: .03 },
  { id: 'p1', c: night ? C.postN : C.post, x: .055, z: .095, dir: 1 },
  { id: 't2', c: night ? C.treeN : C.tree, x: .19, z: .105, dir: 1, sway: .03 },
];
function layout(sp) {
  if (sp === 0) return [
    { id: 'shelf', c: C.shelf, x: -.15, z: .03, dir: -1 },
    { id: 'stove', c: C.stove, x: -.03, z: .07, dir: -1 },
    { id: 'pot', c: C.pot, x: -.075, z: .074, y: .058, dir: -1 },
    { id: 'wok', c: C.wok, x: .012, z: .078, y: .066, dir: -1 },
    { id: 'mai', c: t => mai(t), x: .07, z: .12, dir: 1, h: A.MAI_H },
    { id: 'table', c: C.table, x: .15, z: .21, dir: 1 },
    { id: 'herb', c: C.herb, x: -.155, z: .215, dir: 1, sway: .04 },
  ];
  if (sp === 1) return [...STREET(false),
    { id: 'fac', c: C.facP, x: .125, z: .072, dir: -1 },
    { id: 'mai2', c: t => mai(t), x: .125, z: .082, dir: -1, h: A.MAI_H, scale: .78 },
  ];
  if (sp === 2) return [
    { id: 'phc', c: C.phoneCard, x: -.125, z: .16, dir: 1, rise: P2 + .1 },
    ...C.sw.map((c, i) => ({ id: 'sw' + i, c, x: .09 + i * .034, z: .19, dir: 1, rise: P1 + .9 + i * BEAT * .5 })),
  ];
  if (sp === 3) return [...STREET(true),
    { id: 'facN', c: t => facWash(t), x: .125, z: .072, dir: -1 },
    { id: 'mai4', c: t => mai(t), x: .1, z: .085, dir: -1, h: A.MAI_H, scale: .78 },
    { id: 'ter0', c: C.terrace[0], x: .19, z: .2, dir: 1, rise: 65.0 },
    { id: 'ter1', c: C.terrace[1], x: .035, z: .215, dir: 1, rise: 65.67 },
  ];
  if (sp === 4) return [{ id: 'last', c: C.lastLan, x: 0, z: .13, dir: -1, fold: CLOSE - .35, foldD: .45 }];
  return [];
}
// nhân vật theo thời gian
function maiPose(t) {
  if (t < TURN[0]) { const st = Math.sin(t * TAU * .75); return { arm: Math.round(st * 4) / 4, mood: t < 9 ? 'calm' : 'smile', eyes: (t % 3.7) < .12 ? 'closed' : 'open', ladle: 1 }; }
  if (t < TURN[1]) { return { arm: -.4, mood: t > 29 ? 'sad' : 'calm', eyes: t > 30.6 ? 'down' : ((t % 3.7) < .12 ? 'closed' : 'open') }; }
  if (t < TURN[3]) { const w = t > 64 && t < 72 ? Math.floor(((t - 64) * 2) % 2 * 4) / 4 : 0; return { arm: .2, mood: t > 63 ? 'happy' : 'smile', eyes: 'open', wave: w ? w + .001 : 0 }; }
  return { arm: 0, mood: 'smile', eyes: 'open' };
}
function mai(t) { const p = maiPose(t), k = JSON.stringify(p);
  return memo('mai' + k, () => A.card(A.MAI_H * .62, A.MAI_H, (x, w, h) => A.maiDraw(x, w, h, p), { ppm: 9000, border: 22 })); }
function facWash(t) {
  const u = clamp((t - WASH) / 2.4), q = Math.round(u * 24) / 24;
  if (q <= 0) return C.facP;
  return memo('wash' + q, () => {
    const a = A.cv(C.facPRaw.width, C.facPRaw.height), x = a.getContext('2d'), w = a.width, h = a.height;
    x.drawImage(C.facPRaw, 0, 0);
    if (q < 1) { x.save(); x.beginPath(); const r = eo(q) * h * 1.35, cx = w * .5, cy = -h * .05, n = 48;
      for (let i = 0; i <= n; i++) { const an = i / n * TAU, rr = r * (1 + .06 * Math.sin(an * 7 + q * 9) + .04 * Math.sin(an * 13)); i ? x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr) : x.moveTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); }
      x.closePath(); x.clip(); x.drawImage(C.facArt, 0, 0); x.restore(); }
    else x.drawImage(C.facArt, 0, 0);
    const c = A.finishCut(a, 14); c.wm = C.facP.wm; c.hm = C.facP.hm; c.pad = C.facP.pad; return c;
  });
}
// người đi đường trên dải trượt (trang 2) và khách (trang 4)
const PEDS = [
  { k: 0, z: .15, x0: -.30, v: .026, t0: 17.0 }, { k: 1, z: .19, x0: .25, v: -.022, t0: 17.0 }, { k: 2, z: .165, x0: -.05, v: .02, t0: 17.0, phone: true, id: 'ped' },
  { k: 3, z: .205, x0: .05, v: -.03, t0: 17.0, id: 'ped2' }, { k: 5, z: .14, x0: .4, v: -.024, t0: 17.0 }, { k: 4, z: .215, x0: -.5, v: .028, t0: 17.0 },
];
const GUESTS = [{ k: 1, z: .12, t0: 63.2 }, { k: 2, z: .135, t0: 64.6 }, { k: 4, z: .115, t0: 66.0 }, { k: 0, z: .14, t0: 67.6 }, { k: 5, z: .125, t0: 69.4 }];
function pedWalkT(p, t) { if (!p.phone) return t - p.t0; const a = 22.3, b = 30.7; return t < a ? t - p.t0 : t < b ? a - p.t0 : t - p.t0 - (b - a); }
function pedState(p, t) {
  const L = .40, wt = pedWalkT(p, t); let x = p.x0 + p.v * wt; x = ((x + L / 2) % L + L) % L - L / 2;   // vòng trên dải trượt
  const edge = Math.min(x + .19, .19 - x); const show = clamp(edge / .025);           // gập vào khe ở hai đầu dải
  return { x, ph: ((Math.abs(p.v) * wt) / .012) % 1, show, dir: Math.sign(p.v) };
}
function person(kind, ph, dir, phone) { const q = Math.floor(ph * 8) / 8, k = `p${kind}_${q}_${dir}_${phone ? 1 : 0}`;
  return memo(k, () => { const c = A.card(A.PERSON_H * .55, A.PERSON_H, (x, w, h) => A.personDraw(x, w, h, kind, q, { phone }), { ppm: 8000, border: 18 }); return dir < 0 ? A.mirror(c) : c; }); }

// ---------- tờ lật: khung tại khoảng cách s từ gáy ----------
const NS = 40;
function leafAlpha(s, u) { const th = Math.PI / 2 * u, L = .55 * Math.sin(Math.PI * u); return th * (1 - L * (s / BD - .5)); }
function leafPoints(u) { const pts = [[GY + .0007, 0]]; let y = GY + .0007, z = 0; const ds = BD / NS;
  for (let i = 0; i < NS; i++) { const a = leafAlpha((i + .5) * ds, u); y += Math.sin(a) * ds; z += Math.cos(a) * ds; pts.push([y, z]); } return pts; }
function leafFrame(u, s) { const ds = BD / NS, i = clamp(Math.floor(s / ds), 0, NS - 1), pts = leafPoints(u), f = s / ds - i;
  const y = lerp(pts[i][0], pts[i + 1][0], f), z = lerp(pts[i][1], pts[i + 1][1], f), a = leafAlpha(s, u);
  return { y, z, t: [0, Math.sin(a), Math.cos(a)], n: [0, Math.cos(a), -Math.sin(a)] }; }

// ---------- dựng một thẻ ----------
const T = M.T, Ry = M.Ry, Rx = M.Rx, Sc = M.S;
function cardM(c, x, y, z, th, yaw = 0, sc = 1) { return M.chain(T(x, y, z), Ry(yaw), Rx(th), T(0, -c.pad * sc, 0), Sc(c.wm * sc, c.hm * sc, 1)); }
// thẻ nằm phẳng trên tờ đang lật
function cardOnLeaf(c, x, z, dir, u, sc = 1) {
  const f = leafFrame(u, z), up = dir < 0 ? [0, -f.t[1], -f.t[2]] : f.t, nn = dir < 0 ? f.n : [0, -f.n[1], -f.n[2]];
  const w = c.wm * sc, h = c.hm * sc, lift = .0009, py = f.y + f.n[1] * lift - up[1] * c.pad * sc, pz = f.z + f.n[2] * lift - up[2] * c.pad * sc;
  return [w, 0, 0, 0, up[0] * h, up[1] * h, up[2] * h, 0, nn[0], nn[1], nn[2], 0, x, py, pz, 1];
}

// ---------- máy quay ----------
// mỗi cảnh: [t0, t1, keys [[t, [px,py,pz], [tx,ty,tz], fov, ap, focus?]]] — vertical (9:16) và wide (16:9)
const g = GY;
const SHOTS_V = [
  [0, 15.3, [[0, [.07, g + .072, .19], [.02, g + .062, .078], 46, 9], [1.3, [.075, g + .078, .21], [.015, g + .06, .08], 44, 9], [4.4, [.05, g + .40, .98], [0, g + .07, .12], 50, 5],
    [6.4, [.02, g + .2, .62], [.03, g + .06, .12], 46, 5], [10.5, [-.01, g + .085, .40], [.065, g + .045, .12], 40, 7], [15.3, [.01, g + .078, .34], [.07, g + .042, .12], 40, 7]]],
  [15.3, 34.667, [[15.3, [.01, g + .078, .34], [.07, g + .042, .12], 40, 7], [16.4, [0, g + .42, .86], [0, g + .1, .1], 50, 4], [17.6, [0, g + .41, .85], [0, g + .1, .1], 50, 4],
    [21.0, [-.03, g + .08, .78], [0, g + .06, .1], 48, 5], [27.5, [.05, g + .065, .56], [.04, g + .055, .12], 46, 6],
    [30.6, [.15, g + .055, .30], [.125, g + .05, .08], 40, 7], [34.667, [.135, g + .048, .23], [.125, g + .047, .08], 38, 7]]],
  [34.667, 46.667, [[34.667, [.135, g + .048, .23], [.125, g + .047, .08], 38, 7], [35.7, [0, g + .42, .86], [0, g + .1, .1], 50, 4], [37.2, [0, g + .36, .84], [0, g + .09, .12], 48, 4],
    [40.0, [0, g + .27, .80], [0, g + .08, .13], 46, 5], [46.667, [.02, g + .25, .74], [0, g + .08, .13], 46, 5]]],
  [46.667, 52.667, [[46.667, [-.2, g + .09, .52], [-.125, g + .05, .16], 40, 8, .37], [48.0, [-.19, g + .095, .53], [-.06, g + .04, .14], 40, 8, .37],
    [49.3, [.04, g + .11, .44], [.31, g - .01, .055], 40, 8, .48], [52.667, [.16, g + .1, .32], [.33, g - .01, .05], 40, 8, .36]]],
  [52.667, 61.333, [[52.667, [.04, g + .56, .50], [.04, g, .13], 46, 4], [58.0, [.05, g + .50, .44], [.05, g + .01, .12], 46, 4], [61.333, [0, g + .42, .86], [0, g + .1, .1], 50, 4]]],
  [61.333, 74.667, [[61.333, [0, g + .42, .86], [0, g + .1, .1], 50, 4], [62.6, [.07, g + .065, .62], [.12, g + .06, .08], 44, 6], [68.0, [.12, g + .058, .40], [.125, g + .06, .08], 42, 7],
    [74.0, [-.02, g + .55, 1.0], [0, g + .07, .1], 50, 4], [74.667, [-.02, g + .56, 1.0], [0, g + .07, .1], 50, 4]]],
  [74.667, DUR + 1, [[74.667, [-.02, g + .56, 1.0], [0, g + .07, .1], 50, 4], [76.6, [0, g + .62, .52], [0, g, .14], 46, 3], [81.333, [0, g + .64, .50], [0, g, .145], 46, 3],
    [83.0, [0, .70, .2500001], [0, 0, .25], 60, 2], [DUR + 1, [0, .67, .2500001], [0, 0, .25], 60, 2]]],
];
// 16:9: góc dọc ≈ góc ngang của bản dọc (chủ thể chiếm khung tương đương), khung cuối: bìa trái, thẻ CTA phải
const hf = v => 2 * Math.atan(Math.tan(v * Math.PI / 360) * .5625) * 180 / Math.PI;
const SHOTS_W = SHOTS_V.map(([a, b, keys]) => [a, b, keys.map(([t, p, q, fov, ap, f]) => {
  if (t >= 83) return [t, [.15, .60, .1400001 + .0], [.15, 0, .14], 46, ap, f];
  return [t, p, q, hf(fov) * 1.12, ap, f]; })]);
let TRK = null;
function camAt(t) {
  const S = tall ? SHOTS_V : SHOTS_W;
  if (!TRK) TRK = S.map(([a, b, keys]) => ({ a, b, f: track(keys.map(k => [k[0], [...k[1], ...k[2], k[3], k[4], k[5] ?? -1]])) }));
  const s = TRK.find(s => t >= s.a && t < s.b) || TRK[TRK.length - 1], v = s.f(t);
  const pos = [v[0], v[1], v[2]], tgt = [v[3], v[4], v[5]];
  const focus = v[8] > 0 ? v[8] : Math.hypot(...sub(pos, tgt));
  const up = t >= 82.2 ? [0, 0, -1] : [0, 1, 0];
  // rung tay rất nhẹ (macro cầm máy), tất định
  const sh = .0009 * (t < 81 ? 1 : 0);
  pos[0] += sh * Math.sin(t * 1.3 + 1); pos[1] += sh * Math.sin(t * 1.7 + 2);
  return { pos, tgt, fov: v[6], ap: v[7], focus, up };
}

// ---------- dựng khung hình ----------
const items = [];
function add(it) { items.push(it); return it; }

function buildScene(t) {
  items.length = 0;
  const sp = spreadAt(t);
  // bàn gỗ + tường
  add({ mesh: R.quad, m: M.chain(T(0, 0, -.6), Rx(-Math.PI / 2), Sc(3.2, 3.2, 1), T(0, -.5, 0)), tf: WALNUT, uv: [0, 0, 3.4, 3.4], spec: .25, tint: [.92, .86, .8], at: 0 });
  add({ mesh: R.quad, m: M.chain(T(0, -.2, -1.8), Sc(5, 2.6, 1)), tf: C.wall, emi: .75, recv: 0, cast: false, at: 0 });
  // bộ ấm chén + đèn bàn (Poly Haven CC0)
  const prop = (part, x, z, yaw = 0, s = 1) => { if (!part) return; const L = part.local.slice(); L[12] = L[13] = L[14] = 0; add({ mesh: part.mesh, m: M.chain(T(x, 0, z), Ry(yaw), Sc(s, s, s), L), tf: part.tex, spec: .6, at: 0 }); };
  if (TEA) { prop(TEA.tea_set_01_saucer_circular_03, -.24, .40); prop(TEA.tea_set_01_cup_small_01, -.24, .40, .6); prop(TEA.tea_set_01_teapot_01, -.30, -.1, 2.2); prop(TEA.tea_set_01_teapot_01_lid, -.30, -.1, 2.2); prop(TEA.tea_set_01_sugar_cup_01, -.42, .2); prop(TEA.tea_set_01_sugar_cup_01_lid, -.42, .2); }
  if (LAMP) for (const k in LAMP) prop(LAMP[k], -.62, -.42, .7);
  // điện thoại thật trên bàn (trang 3: sáng lên)
  const ph = [.33, .05], pyaw = -.22, lit = clamp((t - (P2 + 1.3)) / .4) * (t < TURN[2] + .5 ? 1 : 1 - clamp((t - TURN[2] - .5) / .8));
  add({ mesh: R.box, m: M.chain(T(ph[0], .0045, ph[1]), Ry(pyaw), Sc(.074, .009, .152)), back: [.08, .08, .1], spec: .9 });
  add({ mesh: R.quad, m: M.chain(T(ph[0], .0091, ph[1]), Ry(pyaw), Rx(-Math.PI / 2), Sc(.068, .146, 1), T(0, -.5, 0)), tf: C.site, emi: .25 + .7 * lit, tint: [lerp(.06, 1, lit), lerp(.06, 1, lit), lerp(.08, 1, lit)], spec: .8, at: 0 });

  // ---- sách ----
  const close = eio(seg(t, CLOSE, CLOSE + 1.0)), gam = rad(90 + 90 * Math.pow(close, 1.6)) - rad(2.2) * Math.sin(seg(t, CLOSE + 1, CLOSE + 1.35) * Math.PI);
  const thB = gam - Math.PI / 2;
  // bìa dưới + khối trang dưới
  add({ mesh: R.box, m: M.chain(T(0, BOARD / 2, BD / 2 + .002), Sc(BW + .014, BOARD, BD + .01)), tf: C.cloth, uv: [0, 0, 2, 2] });
  add({ mesh: R.box, m: M.chain(T(0, BOARD + PB / 2, BD / 2), Sc(BW, PB, BD)), tf: C.edge });
  // nửa trên (bảng nền) quay quanh gáy
  const BM = M.chain(T(0, GY - .0004, 0), Rx(thB));
  add({ mesh: R.box, m: M.chain(BM, T(0, BD / 2, -PB / 2 - .0004), Sc(BW, BD, PB)), tf: C.edge });
  add({ mesh: R.box, m: M.chain(BM, T(0, BD / 2 + .002, -PB - BOARD / 2 - .0004), Sc(BW + .014, BD + .01, BOARD)), tf: C.cloth, uv: [0, 0, 2, 2] });
  add({ mesh: R.quad, m: M.chain(BM, T(0, .002, -PB - BOARD - .0006), Ry(Math.PI), Sc(BW + .012, BD + .008, 1)), tf: C.cover, uv: [1, 1, -1, -1], spec: .35 });
  // gáy sách (vải)
  add({ mesh: R.box, m: M.chain(T(0, (GY) / 2, -PB * .5), Sc(BW + .014, GY, .006)), tf: C.cloth });

  // trang theo trang hiện tại
  const BACKS = [C.kb, C.sb, C.wb, C.nb, C.lb], GROUNDS = [C.kg, C.sg, C.wg, C.ng, C.lg];
  const k = sp - 1, turning = k >= 0 && t < TURN[k] + TD;
  const backTex = turning ? BACKS[k] : BACKS[sp];
  add({ mesh: R.quad, m: M.chain(BM, T(0, 0, .0003), Sc(BW, BD, 1)), tf: backTex, at: 0 });
  add({ mesh: R.quad, m: M.chain(T(0, GY, BD), Rx(-Math.PI / 2), Sc(BW, BD, 1)), tf: GROUNDS[sp], at: 0 });
  let u = 0;
  if (turning) { u = leafU(t, k); leafMesh(u); add({ mesh: R.leaf, m: M.chain(T(0, 0, 0), Sc(BW, 1, 1)), tf: BACKS[sp], tb: GROUNDS[k], at: 0 }); }

  // thẻ của trang cũ (gập, đi theo tờ lật) và trang mới
  if (turning) cards(k, t, u, true);
  cards(sp, t, u, false);
  extras(sp, t, u, turning);
  return sp;
}
function leafMesh(u) {
  const pts = leafPoints(u), P = R.leaf.P, N = R.leaf.N;
  for (let i = 0; i <= NS; i++) { const [y, z] = pts[i], a = leafAlpha(Math.min(i, NS - .5) * BD / NS, u), n = [0, -Math.cos(a), Math.sin(a)];
    P.set([-.5, y, z, .5, y, z], i * 6); N.set([...n, ...n], i * 6); }
  R.leaf.update(P, N);
}
function cardTheta(cd, sp, t, onLeaf) {
  const h = cd.h || cd.c.hm || .06;
  const rise = cd.rise ?? (sp === 0 ? -9 : clearT(sp - 1, cd.z, h * (cd.scale || 1)) + .05);
  const fold = cd.fold ?? (TURN[sp] !== undefined ? TURN[sp] - .7 + (BD - cd.z) * .9 : 999);
  const r = back(seg(t, rise, rise + .55), 1.7), f = ei(seg(t, fold, fold + (cd.foldD || .4)));
  return { up: r * (1 - f), rise, fold };
}
function cards(sp, t, u, old) {
  for (const cd of layout(sp)) {
    const { up } = cardTheta(cd, sp, t);
    const c = typeof cd.c === 'function' ? cd.c(t) : cd.c, sc = cd.scale || 1;
    if (old) { if (u > 0) { add({ mesh: R.quad, m: cardOnLeaf(c, cd.x, cd.z, cd.dir, u, sc), tf: c }); continue; } }
    if (up <= 0 && !old && t < (cd.rise ?? 0)) { /* nằm phẳng chờ bật */ }
    const sway = cd.sway ? Math.sin(t * 1.6 + cd.x * 40) * cd.sway * up : 0;
    const th = (1 - up) * (cd.dir < 0 ? -Math.PI / 2 : Math.PI / 2) + sway;
    const lift = .0006 + hash(cd.x * 91 + cd.z * 17) * .0005;
    add({ mesh: R.quad, m: cardM(c, cd.x, GY + (cd.y || 0) + lift * (1 - up), cd.z, th, cd.yaw || 0, sc), tf: c });
  }
}

// ---------- các mảnh riêng của từng trang ----------
function hangM(c, x, yTop, z, sw = 0) { return M.chain(T(x, yTop, z), M.Rz(sw), T(0, -c.hm + c.pad, 0), Sc(c.wm, c.hm, 1)); }
function string(x0, y0, z0, x1, y1, z1, w = .0007) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), a = Math.atan2(dx, dy);
  add({ mesh: R.quad, m: M.chain(T(x0, y0, z0), M.Rz(-a), Sc(w, L, 1)), back: [.32, .26, .22], tint: [.35, .28, .24], cast: true, at: 0 }); }
function extras(sp, t, u, turning) {
  const k = sp - 1;
  // trang 1: lửa giấy lật như lá chớp, hơi nước, đèn treo
  const kitchen = sp === 0 || (sp === 1 && turning);
  if (kitchen) {
    const vis = sp === 0 ? 1 - ei(seg(t, TURN[0] - .8, TURN[0] - .3)) : 0;
    if (vis > 0) {
      for (let i = 0; i < 3; i++) { const ph = Math.floor(t * 12 + i * 4) % 4, v = (ph % 2) * .6 + .2; const c = memo('fl' + i + v, () => A.card(.018, .022, (x, w, h) => A.flameDraw(x, w, h, v), { border: 8 }));
        const rock = Math.sin(t * 18 + i * 2) * .25; add({ mesh: R.quad, m: cardM(c, .0 + i * .013, GY + .056, .074, rock * vis - (1 - vis) * 1.5, 0, .9 + .15 * ((ph + i) % 2)), tf: c, emi: .55 }); }
      for (let i = 0; i < 2; i++) { const q = Math.floor(t * 8 + i * 3) % 6; const c = memo('st' + q, () => A.card(.022, .05, (x, w, h) => A.steamDraw(x, w, h, q), { border: 6 }));
        add({ mesh: R.quad, m: cardM(c, -.085 + i * .02, GY + .1, .076 + i * .004, Math.sin(t * 2 + i) * .1, 0, vis), tf: c, at: .4, cast: false }); }
      const sw = Math.sin(t * 1.4) * .05; add({ mesh: R.quad, m: hangM(C.lamp, -.035, GY + .2 + (1 - vis) * .2, .1, sw), tf: C.lamp, emi: .2 }); string(-.035, GY + .2 + (1 - vis) * .2, .1, -.035, GY + .5, .1);
    }
  }
  // trang 3: pull-tab, biển hiệu thả dây, ghim rơi
  if (sp === 2 || (sp === 3 && turning)) {
    const vis = sp === 2 ? clamp((t - TURN[1] - .6) / .5) * (1 - seg(t, TURN[2] - .9, TURN[2] - .4)) : 0;
    [P1, P2, P3].forEach((p, i) => { const c = C.tabs[i], pull = eo(seg(t, p - .35, p)) * .028 - eo(seg(t, p + .2, p + .7)) * .018;
      if (vis > 0) add({ mesh: R.quad, m: M.chain(T(-.13 + i * .13, GY + .0006 + i * .0002, BD - .012 + pull), Rx(-Math.PI / 2), T(0, -c.pad, 0), Sc(c.wm, c.hm, 1)), tf: c }); });
    // biển hiệu rơi trên hai sợi dây, lò xo
    const sd = spring(t - (P1 + .15), 6, .3), lift = (1 - sd) * .25 + (1 - vis) * .3, yTop = GY + .19 + lift, sw = Math.sin((t - P1) * 3.2) * .06 * Math.exp(-(t - P1) * .7) * (t > P1 ? 1 : 0);
    if (t > P1 - .2 && vis > 0) { add({ mesh: R.quad, m: hangM(C.sign, 0, yTop, .06, sw), tf: C.sign }); string(-.06, yTop, .06, -.06, GY + .6, .06); string(.06, yTop, .06, .06, GY + .6, .06); }
    // ghim đỏ rơi xuống bản đồ, nảy
    const [mu, mv] = A.MAPPIN, px = (mu - .5) * BW, pz = mv * BD, dp = P3 + .6;
    if (t > dp - .5 && vis > 0) { const fall = t < dp ? Math.pow(1 - seg(t, dp - .5, dp), 2) * .2 : 0, bo = t >= dp ? Math.abs(Math.sin((t - dp) * 9)) * .012 * Math.exp(-(t - dp) * 4) : 0;
      const sq = t >= dp ? 1 - .25 * Math.exp(-(t - dp) * 10) : 1;
      add({ mesh: R.quad, m: M.chain(T(px, GY + fall + bo, pz), Sc(1, sq, 1), T(0, -C.pin.pad, 0), Sc(C.pin.wm, C.pin.hm, 1)), tf: C.pin });
      // vòng sóng toả từ ghim (tem giấy mỏng nằm trên bản đồ)
      const ring = seg(t, dp, dp + 1.2); if (ring > 0 && ring < 1) { const c = memo('ring', () => { const a = A.cv(256, 256), x = a.getContext('2d'); x.beginPath(); x.arc(128, 128, 110, 0, TAU); x.lineWidth = 14; x.strokeStyle = '#e5413a'; x.stroke(); return a; });
        add({ mesh: R.quad, m: M.chain(T(px, GY + .0008, pz), Rx(-Math.PI / 2), Sc(.02 + ring * .09, .02 + ring * .09, 1), T(0, -.5, 0)), tf: c, at: .5, emi: .3, fade: 1, cast: false, tint: [1, 1 - ring * .2, 1 - ring * .2] }); }
    }
  }
  // trang 2 & 4: người trên dải trượt / khách; trang 4: đèn lồng, ghim treo
  if (sp === 1 || (sp === 2 && turning)) {
    const vis = sp === 1 ? 1 : 0, fold = sp === 1 ? 1 - ei(seg(t, TURN[1] - .9, TURN[1] - .4)) : 0;
    if (vis) for (const p of PEDS) { const s = pedState(p, t), rise = back(seg(t, clearT(0, p.z, .05), clearT(0, p.z, .05) + .5), 1.6) * fold * s.show; if (rise <= 0) continue;
      const c = person(p.k, s.ph, s.dir, p.phone && t > 22 && t < 31); add({ mesh: R.quad, m: cardM(c, s.x, GY + Math.abs(Math.sin(s.ph * TAU)) * .001, p.z, (1 - rise) * Math.PI / 2), tf: c }); }
  }
  if (sp === 3 || (sp === 4 && turning)) {
    const vis = sp === 3 ? 1 - ei(seg(t, TURN[3] - .9, TURN[3] - .3)) : 0;
    if (vis > 0) {
      // dây đèn lồng giữa cột đèn và mái quán
      const xs = [.065, .095, .125, .155, .185], y0 = GY + .13, z = .1;
      const t0d = TURN[2] + 1.4, drop = t < t0d ? 0 : spring(t - t0d, 6, .35), yOff = (1 - drop) * .35 + (1 - vis) * .2;
      for (let i = 0; i < xs.length; i++) { const on = t > LANT + i * BEAT, c = on ? C.lanOn : C.lanOff, sw = Math.sin(t * 1.8 + i) * .04;
        const yT = y0 + yOff - Math.sin((i + .5) / xs.length * Math.PI) * .008;
        add({ mesh: R.quad, m: hangM(c, xs[i], yT, z, sw), tf: c, emi: on ? .75 : 0 }); string(xs[i], yT, z, xs[i], yT + .006, z); }
      string(.06, y0 + yOff + .002, z, .19, y0 + yOff + .002, z, .0006);
      // ghim đỏ treo trên mái quán
      const by = Math.sin(t * 2.2) * .003, yP = GY + .175 + by + (1 - (t < TURN[2] + 1.1 ? 0 : spring(t - (TURN[2] + 1.1), 5, .3))) * .4 + (1 - vis) * .2;
      add({ mesh: R.quad, m: hangM(C.pin, .125, yP, .07, Math.sin(t * 1.5) * .05), tf: C.pin }); string(.125, yP, .07, .125, GY + .6, .07);
      // khách đi vào cửa quán
      for (const gu of GUESTS) { const s0 = gu.t0, door = .125, x0 = -.2, sp_ = .032, tt = t - s0, dist = door - x0 - .012, x = x0 + Math.min(tt * sp_, dist);
        if (tt < 0) continue; const arrive = (tt * sp_ - dist) / .02; const show = clamp((x + .19) / .02) * (1 - clamp(arrive)) * vis; if (show <= 0) continue;
        const zz = lerp(gu.z, .08, clamp((x - .05) / (door - .05))); const c = person(gu.k, ((tt * sp_) / .012) % 1, 1, false);
        add({ mesh: R.quad, m: cardM(c, x, GY, zz, (1 - show) * Math.PI / 2, 0, .92), tf: c }); }
    }
  }
}

// ---------- đèn ----------
function lightAt(t) {
  const night = seg(t, TURN[2] + .5, TURN[2] + 1.5) * (1 - seg(t, TURN[3] + .5, TURN[3] + 1.5));
  return { dir: [-.42, .78, .5], col: [1.3 * (1 - .12 * night), 1.08 * (1 - .15 * night), .84], amb: [.36 - .05 * night, .32 - .05 * night, .35], sky: [.2, .2, .26], center: [0, .08, .1], half: .62,
    spot: [0, 0, .12], spotR: 1.05, spotK: .7 };
}

// ---------- overlay 2D: chữ, bong bóng, thẻ CTA ----------
let VP = null;
function proj(p) { const v = M.xf(VP, p); return [(v[0] * .5 + .5) * W, (1 - (v[1] * .5 + .5)) * H, v[3]]; }
const capFont = s => s === 'serif' ? `600 ${tall ? 62 : 52}px "Lora"` : `800 ${tall ? 60 : 50}px "Nunito"`;
function wrap(x, s, maxW) { const ws = s.split(' '), out = []; let cur = ''; for (const w of ws) { const tst = cur ? cur + ' ' + w : w; if (x.measureText(tst).width > maxW && cur) { out.push(cur); cur = w; } else cur = tst; } if (cur) out.push(cur); return out; }
function capLayout(c) { const x = gO; x.font = capFont(c[3]); let maxW = tall ? W * .84 : W * .62, lines = wrap(x, c[2], maxW); const n = lines.length; while (n > 1 && maxW > 200) { const l2 = wrap(x, c[2], maxW - 10); if (l2.length > n) break; maxW -= 10; lines = l2; } const lh = (tall ? 60 : 50) * 1.32;
  const yb = tall ? H * .815 : H * .87, y0 = yb - (lines.length - 1) * lh; let w = 0; for (const l of lines) w = Math.max(w, x.measureText(l).width);
  return { lines, lh, y0, box: [W / 2 - w / 2 - 10, y0 - lh * .85, W / 2 + w / 2 + 10, yb + lh * .3] }; }
function drawCaps(t) {
  const x = gO;
  for (const c of CAP) { if (t < c[0] || t > c[1]) continue; const a = Math.min(seg(t, c[0], c[0] + .35), 1 - seg(t, c[1] - .3, c[1])); if (a <= 0) continue;
    const L = capLayout(c), rise = (1 - eo(seg(t, c[0], c[0] + .5))) * 14;
    x.save(); x.globalAlpha = a; x.font = capFont(c[3]); x.textAlign = 'center'; x.lineJoin = 'round';
    L.lines.forEach((l, i) => { const y = L.y0 + i * L.lh + rise;
      x.shadowColor = 'rgba(20,10,5,.55)'; x.shadowBlur = 18; x.shadowOffsetY = 4; x.strokeStyle = '#3b2416'; x.lineWidth = tall ? 13 : 11; x.strokeText(l, W / 2, y);
      x.shadowColor = 'transparent'; x.fillStyle = c[3] === 'serif' ? '#fff3dc' : '#fff6e6'; x.fillText(l, W / 2, y); });
    x.restore(); }
}
function anchorOf(id, t) {
  if (id === 'ped') { const p = PEDS.find(p => p.id === id), s = pedState(p, t); return [s.x, GY + .05, p.z]; }
  if (id === 'pin') { const [mu, mv] = A.MAPPIN; return [(mu - .5) * BW, GY + .04, mv * BD]; }
  return [0, GY, .1];
}
function bubbleGeom(b, t) {
  const [t0, t1, id, main, list, kind] = b, [ax, ay] = proj(anchorOf(id, t)), x = gO, s = tall ? 1 : .85;
  x.font = `700 ${Math.round(40 * s)}px "Nunito"`; const lines = [main, ...list];
  let w = 0; for (const l of lines) w = Math.max(w, x.measureText(l).width + (kind === 'search' ? 70 * s : 50 * s));
  const lh = 54 * s, h = lines.length * lh + 30 * s, bw = w + 40 * s;
  let bx = clamp(ax - bw / 2, 40, W - bw - 40), by = ay - h - 70 * s;
  if (id === 'pin') { bx = clamp(ax - bw / 2, 40, W - bw - 40); by = ay - h - 90 * s; }
  by = clamp(by, H * .1, H * .6);
  return { ax, ay, bx, by, bw, h, lh, lines, s, kind };
}
function drawBubbles(t) {
  const x = gO;
  for (const b of BUB) { const [t0, t1, id, main, , kind] = b; if (t < t0 || t > t1) continue;
    const G = bubbleGeom(b, t), pop = back(seg(t, t0, t0 + .35), 2.2), out = 1 - seg(t, t1 - .25, t1); if (pop * out <= 0) continue;
    x.save(); const cx = G.bx + G.bw / 2, cy = G.by + G.h / 2; x.translate(cx, cy); x.scale(pop * out, pop * out); x.translate(-cx, -cy);
    // thẻ giấy trắng + đuôi chỉ về người/ghim
    x.shadowColor = 'rgba(30,15,5,.35)'; x.shadowBlur = 16; x.shadowOffsetY = 6;
    x.beginPath(); x.roundRect(G.bx, G.by, G.bw, G.h, 26 * G.s); x.moveTo(cx - 18, G.by + G.h - 2); x.lineTo(G.ax, G.ay - 20); x.lineTo(cx + 18, G.by + G.h - 2);
    x.fillStyle = '#fffdf6'; x.fill(); x.shadowColor = 'transparent'; x.lineWidth = 6; x.strokeStyle = A.INK; x.lineJoin = 'round'; x.stroke();
    x.beginPath(); x.roundRect(G.bx + 3, G.by + 3, G.bw - 6, G.h - 6, 24 * G.s); x.fillStyle = '#fffdf6'; x.fill();
    x.font = `700 ${Math.round(40 * G.s)}px "Nunito"`; x.textBaseline = 'middle'; x.textAlign = 'left';
    if (kind === 'search') { const n = Math.floor(clamp((t - t0 - .3) * 22, 0, main.length)); const tx = G.bx + 66 * G.s, ty = G.by + 15 * G.s + G.lh * .5;
      x.beginPath(); x.arc(G.bx + 36 * G.s, ty - 3, 12 * G.s, 0, TAU); x.lineWidth = 5; x.strokeStyle = '#5a6a72'; x.stroke(); x.beginPath(); x.moveTo(G.bx + 45 * G.s, ty + 6); x.lineTo(G.bx + 54 * G.s, ty + 15); x.stroke();
      x.fillStyle = '#2b2b33'; x.fillText(main.slice(0, n), tx, ty); if (n < main.length && Math.floor(t * 4) % 2 === 0) x.fillRect(tx + x.measureText(main.slice(0, n)).width + 3, ty - 20, 3, 40);
      if (G.lines.length > 1) { x.strokeStyle = 'rgba(59,42,34,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(G.bx + 20, G.by + 15 * G.s + G.lh); x.lineTo(G.bx + G.bw - 20, G.by + 15 * G.s + G.lh); x.stroke(); } }
    G.lines.slice(1).forEach((l, j) => { const i = j + 1, ap = seg(t, t0 + 2.0 + j * .35, t0 + 2.2 + j * .35); x.globalAlpha = ap; const ty = G.by + 15 * G.s + G.lh * (i + .5);
      x.beginPath(); x.arc(G.bx + 30 * G.s, ty, 9 * G.s, 0, TAU); x.fillStyle = '#9aa0b5'; x.fill(); x.fillStyle = '#2b2b33'; x.fillText(l, G.bx + 50 * G.s, ty); x.globalAlpha = 1; });
    x.restore();
    if (id !== 'pin') minhHoa(G.bx + G.bw - 10, G.by - 10, out);
  }
  // thẻ kết quả "Quán Mây" (trang 3) — minh hoạ
  if (t > 56.6 && t < 61.0) { const a = back(seg(t, 56.6, 57.0), 1.8) * (1 - seg(t, 60.7, 61.0)); const [ax, ay] = proj(anchorOf('pin', t)), s = tall ? 1 : .8;
    const w = 720 * s, h = 300 * s, bx = clamp(ax - w / 2, 40, W - w - 40), by = clamp(ay + 50 * s, H * .1, H * .6);
    const c = memo('res' + s, () => { const cc = A.card(w / 5000 * 1, h / 5000, (x, ww, hh) => A.resultDraw(x, ww, hh), { ppm: 5000, border: 14 }); return cc; });
    gO.save(); gO.translate(bx + w / 2, by + h / 2); gO.scale(a, a); gO.shadowColor = 'rgba(30,15,5,.35)'; gO.shadowBlur = 18; gO.shadowOffsetY = 8; gO.drawImage(c, -c.width / 2, -c.height / 2); gO.restore();
    minhHoa(bx + w, by - 6, a); }
}
function minhHoa(xr, y, a) { const x = gO; x.save(); x.globalAlpha = clamp(a); x.font = `700 ${tall ? 30 : 26}px "Nunito"`; x.textAlign = 'right'; x.lineJoin = 'round'; x.lineWidth = 6; x.strokeStyle = 'rgba(40,25,15,.8)'; x.strokeText('Minh họa', xr, y); x.fillStyle = '#fff6e6'; x.fillText('Minh họa', xr, y); x.restore(); }
function ctaGeom() { const c = C.ticket, s = tall ? 1 : .9, w = c.width * s, h = c.height * s;
  const cx = tall ? W / 2 : W * .73, cy = tall ? H * .8 : H * .52; return { c, w, h, x: cx - w / 2, y: cy - h / 2 }; }
function drawCTA(t) {
  if (t < CTA) return; const G = ctaGeom(), a = back(seg(t, CTA, CTA + .5), 1.5), x = gO;
  x.save(); x.translate(0, (1 - a) * 420); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 30; x.shadowOffsetY = 12; x.drawImage(G.c, G.x, G.y, G.w, G.h); x.restore();
}
function drawOverlay(t) { gO.clearRect(0, 0, W, H); drawBubbles(t); drawCaps(t); drawCTA(t);
  // fade đen nhẹ ở khung cuối
  const f = seg(t, DUR - .5, DUR); if (f > 0) { gO.fillStyle = `rgba(0,0,0,${f})`; gO.fillRect(0, 0, W, H); } }

// ---------- vẽ ----------
export function renderFilm(t) {
  const T0 = performance.now(); const cam = camAt(t);
  buildScene(t); const T1 = performance.now();
  const asp = W / H; VP = M.mul(M.persp(cam.fov * Math.PI / 180, asp, .004, 12), M.look(cam.pos, cam.tgt, cam.up));
  const fadeIn = seg(t, 0, .35);
  R.draw({ items, cam: { ...cam, near: .004, far: 12 }, light: lightAt(t), bg: [.12, .08, .06], post: { max: 18, vig: .6, warm: .55, expo: lerp(.2, 1, fadeIn) * (1 - .0 * seg(t, DUR - .5, DUR)), lift: 0 } });
  const T2 = performance.now(); R.g.finish(); const T3 = performance.now(); drawOverlay(t); const T4 = performance.now();
  window.__T = [T1 - T0, T2 - T1, T3 - T2, T4 - T3].map(Math.round);
}

// ---------- TEXTS (readcheck) ----------
export function texts(t) {
  const out = [];
  { const cam = camAt(t); VP = M.mul(M.persp(cam.fov * Math.PI / 180, W / H, .004, 12), M.look(cam.pos, cam.tgt, cam.up)); }
  CAP.forEach((c, i) => { if (t >= c[0] && t <= c[1]) { const L = capLayout(c); out.push({ id: 'cap' + i, text: c[2], x0: L.box[0], y0: L.box[1] - 16, x1: L.box[2], y1: L.box[3] }); } });
  BUB.forEach((b, i) => { if (t >= b[0] && t <= b[1]) { const G = bubbleGeom(b, t); out.push({ id: 'bub' + i, text: b[3] + (b[4].length ? ' / ' + b[4].join(' / ') : ''), x0: G.bx - 20, y0: G.by - 20, x1: G.bx + G.bw + 20, y1: G.by + G.h + 20 }); } });
  if (t >= CTA) { const G = ctaGeom(); out.push({ id: 'cta', text: 'Phân tích marketing miễn phí, không ràng buộc. WhatsApp +49 155 60456888 sami-agency.de', x0: G.x, y0: G.y, x1: G.x + G.w, y1: G.y + G.h }); }
  if (t >= LOGO) out.push({ id: 'cover', text: 'SAMI Strategy • Automation • Marketing • Intelligence', x0: W * .1, y0: H * .2, x1: W * .9, y1: H * .6 });
  return out;
}

// ---------- sự kiện âm thanh ----------
export function buildEvents() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  ev(0, 'sizzle_on'); ev(TURN[0] - .6, 'sizzle_off');
  for (let tt = 0; tt < TURN[0] - .8; tt += 1 / 6) if (hash(tt * 7) < .55) ev(tt, 'flame', { g: .5 + hash(tt) * .5 });
  ev(1.3, 'whoosh_up');
  for (let i = 0; i < 4; i++) ev(6 + i * 2.67, 'ladle');
  TURN.forEach((T0, k) => { ev(T0 - .7, 'fold_set'); ev(T0, 'page_turn'); ev(T0 + TD - .1, 'page_land'); });
  // thẻ bật (từng thẻ theo lúc được giải phóng)
  for (let sp = 1; sp <= 4; sp++) for (const cd of layout(sp)) { const { rise } = cardTheta(cd, sp, 0); if (rise > 0) ev(rise + .12, 'pop', { pan: clamp(cd.x / .2, -1, 1), g: .7 }); }
  for (const p of PEDS) ev(clearT(0, p.z, .05) + .1, 'pop', { pan: 0, g: .4 });
  ev(17.0, 'street_on'); ev(TURN[1] - 4.0, 'street_off');
  for (let tt = 18; tt < 30.5; tt += .34) ev(tt, 'step', { g: .4 + hash(tt) * .3, pan: Math.sin(tt) * .5 });
  BUB.forEach(b => { ev(b[0], 'bubble'); const s = b[3]; for (let i = 0; i < s.length; i += 2) ev(b[0] + .3 + i / 22, 'blip'); b[4].forEach((_, i) => ev(b[0] + 2.0 + i * .35, 'tick')); });
  ev(30.67, 'silence'); for (let tt = 30.9; tt < TURN[1] - .1; tt += 1) ev(tt, 'clock');
  ev(TURN[1] + .02, 'bau_note');
  [P1, P2, P3].forEach(p => { ev(p - .35, 'tab_slide'); ev(p, 'tab_click'); });
  ev(P1 + .15, 'string_drop'); ev(P1 + .45, 'thump', { g: .5 });
  C.sw.forEach((_, i) => ev(P1 + .9 + i * BEAT * .5 + .12, 'pop', { g: .55, pan: .5 }));
  ev(P2 + .2, 'pop', { g: .8, pan: -.5 }); ev(P2 + 1.25, 'phone_tap', { pan: .7 }); ev(P2 + 1.35, 'phone_glow', { pan: .7 });
  ev(P3 + .6, 'pin_drop'); ev(56.6, 'pop', { g: .8 });
  ev(WASH, 'wash'); ev(TURN[2] + 1.1, 'string_drop'); ev(TURN[2] + 1.4, 'string_drop');
  for (let i = 0; i < 5; i++) ev(LANT + i * BEAT, 'lantern', { i, pan: -.3 + i * .15 });
  GUESTS.forEach(gu => ev(gu.t0 + (.125 + .2 - .012) / .032, 'door_bell', { g: .6 }));
  for (let tt = 63; tt < 73.5; tt += .38) ev(tt, 'step', { g: .3 + hash(tt) * .2, pan: -.4 });
  ev(TURN[2] + .8, 'evening_on'); ev(TURN[3] - .5, 'evening_off');
  ev(CLOSE - .35, 'fold_set'); ev(CLOSE, 'creak'); ev(CLOSE + 1.0, 'book_close'); ev(LOGO, 'logo_hit'); ev(CTA + .1, 'cta_pop');
  E.sort((a, b) => a.t - b.t);
  return E;
}
