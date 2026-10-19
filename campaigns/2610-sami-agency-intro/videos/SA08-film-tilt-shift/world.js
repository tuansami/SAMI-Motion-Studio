// SA08 · thế giới thu nhỏ vẽ bằng Canvas 2D: camera phối cảnh, khối nhà, phố, người tí hon, dải nét tilt-shift.
// Không dùng three.js (máy không cài được): chiếu phối cảnh + near-plane clip + painter's sort tự viết.
import { clamp, lerp, hash } from '/core/lib.js';

// ---------- màu ----------
const RGB = {};
export function rgb(hex) {
  if (RGB[hex]) return RGB[hex];
  const n = parseInt(hex.slice(1), 16);
  return (RGB[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
export const css = (c, a = 1) => a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------- ánh sáng ----------
// L.sun: hướng tới mặt trời (đã chuẩn hoá), L.sc: màu nắng, L.amb: màu trời (fill), L.night 0..1
export const L = { sun: [-0.35, 0.62, 0.7], sc: [1, .8, .6], amb: [.5, .56, .78], night: 0 };
export function setLight(night, azim = -0.35) {
  const s = [azim, 0.55 + 0.1 * (1 - night), 0.75]; const m = Math.hypot(...s);
  L.sun = s.map(v => v / m); L.night = night;
  const k = 1 - night;
  L.sc = [1.05 * k, 0.8 * k, 0.58 * k];                       // nắng chiều ấm, tắt dần khi đêm
  L.amb = mix([.56, .6, .8], [.2, .23, .4], night);           // fill xanh trời → xanh đêm
}
export function shade(hex, n, k = 1) {
  const c = rgb(hex), d = Math.max(0, n[0] * L.sun[0] + n[1] * L.sun[1] + n[2] * L.sun[2]);
  const up = 0.75 + 0.25 * n[1];                                // trời sáng hơn ở mặt ngửa
  return [0, 1, 2].map(i => Math.min(255, c[i] * k * (L.amb[i] * up + L.sc[i] * d * 0.85)));
}

// ---------- camera ----------
export const C = { eye: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, -1], F: 1000, W: 1920, H: 1080, near: 0.15 };
export function setCam(W, H, t3, dist, pitch, yaw, fov) {
  const p = pitch * Math.PI / 180, y = yaw * Math.PI / 180;
  const dir = [Math.cos(p) * Math.sin(y), Math.sin(p), Math.cos(p) * Math.cos(y)];
  C.eye = [t3[0] + dir[0] * dist, t3[1] + dir[1] * dist, t3[2] + dir[2] * dist];
  C.f = [-dir[0], -dir[1], -dir[2]];
  C.r = [Math.cos(y), 0, -Math.sin(y)];
  C.u = [C.r[1] * C.f[2] - C.r[2] * C.f[1], C.r[2] * C.f[0] - C.r[0] * C.f[2], C.r[0] * C.f[1] - C.r[1] * C.f[0]];
  C.W = W; C.H = H; C.F = (H / 2) / Math.tan(fov * Math.PI / 360);
}
export function cam(p) {           // → camera space [x, y, z(depth)]
  const v = [p[0] - C.eye[0], p[1] - C.eye[1], p[2] - C.eye[2]];
  return [v[0] * C.r[0] + v[1] * C.r[1] + v[2] * C.r[2], v[0] * C.u[0] + v[1] * C.u[1] + v[2] * C.u[2], v[0] * C.f[0] + v[1] * C.f[1] + v[2] * C.f[2]];
}
const scr = c => [C.W / 2 + c[0] * C.F / c[2], C.H / 2 - c[1] * C.F / c[2], c[2]];
export function proj(p) { const c = cam(p); return c[2] > C.near ? scr(c) : null; }
export const ppm = depth => C.F / depth;   // pixel trên 1 mét ở độ sâu đó

function clipNear(cs) {
  const out = [], n = cs.length, N = C.near;
  for (let i = 0; i < n; i++) {
    const a = cs[i], b = cs[(i + 1) % n], ia = a[2] > N, ib = b[2] > N;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (N - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), N]); }
  }
  return out;
}
export function path(g, pts) {
  const cs = clipNear(pts.map(cam)); if (cs.length < 3) return false;
  g.beginPath(); cs.forEach((c, i) => { const s = scr(c); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath();
  return true;
}
export function poly(g, pts, fill, stroke, lw = 1) {
  if (!path(g, pts)) return;
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function line3(g, a, b, col, w) {
  let ca = cam(a), cb = cam(b);
  if (ca[2] < C.near && cb[2] < C.near) return;
  if (ca[2] < C.near) { const t = (C.near - ca[2]) / (cb[2] - ca[2]); ca = [lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), C.near]; }
  if (cb[2] < C.near) { const t = (C.near - cb[2]) / (ca[2] - cb[2]); cb = [lerp(cb[0], ca[0], t), lerp(cb[1], ca[1], t), C.near]; }
  const sa = scr(ca), sb = scr(cb);
  g.strokeStyle = col; g.lineWidth = Math.max(0.6, w * C.F / ((ca[2] + cb[2]) / 2)); g.lineCap = 'round';
  g.beginPath(); g.moveTo(sa[0], sa[1]); g.lineTo(sb[0], sb[1]); g.stroke();
}
// ellipse nằm trên mặt phẳng ngang (y = h)
export function disc(g, x, h, z, r, fill, n = 14) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([x + Math.cos(a) * r, h, z + Math.sin(a) * r]); }
  poly(g, pts, fill);
}
// gắn hệ toạ độ phẳng (0..w, 0..h) vào 3 góc của một tứ giác thế giới (affine, đủ dùng cho biển hiệu nhỏ)
export function quadXform(g, P00, P10, P01, w, h) {
  const a = proj(P00), b = proj(P10), c = proj(P01); if (!a || !b || !c) return false;
  g.setTransform((b[0] - a[0]) / w, (b[1] - a[1]) / w, (c[0] - a[0]) / h, (c[1] - a[1]) / h, a[0], a[1]);
  return true;
}

// ---------- khối hộp ----------
const NF = [0, 0, 1], NB = [0, 0, -1], NL = [-1, 0, 0], NR = [1, 0, 0], NT = [0, 1, 0];
export function box(g, x0, x1, y0, y1, z0, z1, col, k = 1, topCol) {
  const e = C.eye;
  if (e[0] < x0) poly(g, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], css(shade(col, NL, k * .92)));
  if (e[0] > x1) poly(g, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], css(shade(col, NR, k * .92)));
  if (e[2] < z0) poly(g, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], css(shade(col, NB, k)));
  if (e[2] > z1) poly(g, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], css(shade(col, NF, k)));
  if (e[1] > y1) poly(g, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], css(shade(topCol || col, NT, k)));
}

// ---------- tilt-shift: dải nét + 2 mức mờ + grade ----------
let S, B1, B2, OUT, sg, b1g, b2g, og;
export function initPost(W, H) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  S = mk(); B1 = mk(); B2 = mk(); OUT = mk();
  sg = S.getContext('2d'); b1g = B1.getContext('2d'); b2g = B2.getContext('2d'); og = OUT.getContext('2d');
  return sg;
}
// band: {y (px tâm dải), w (nửa bề rộng, px), r1, r2 (px mờ), sat}
export function post(g, W, H, band) {
  const { y, w, r1, r2 } = band, ramp1 = band.ramp || H * 0.09, ramp2 = H * 0.2;
  b1g.clearRect(0, 0, W, H); b1g.filter = `blur(${r1}px)`; b1g.drawImage(S, 0, 0); b1g.filter = 'none';
  b2g.clearRect(0, 0, W, H); b2g.filter = `blur(${r2}px)`; b2g.drawImage(S, 0, 0); b2g.filter = 'none';
  const mask = (cg, a0, a1) => {                            // alpha 0 trong dải, lên 1 khi |dy| > a1
    const gr = cg.createLinearGradient(0, 0, 0, H), st = (v, a) => { const p = clamp(v / H); gr.addColorStop(p, `rgba(0,0,0,${a})`); };
    const pts = [[0, 1], [y - a1, 1], [y - a0, 0], [y + a0, 0], [y + a1, 1], [H, 1]].map(([v, a]) => [clamp(v, 0, H), a]).sort((p, q) => p[0] - q[0]);
    pts.forEach(([v, a]) => st(v, a));
    cg.globalCompositeOperation = 'destination-in'; cg.fillStyle = gr; cg.fillRect(0, 0, W, H); cg.globalCompositeOperation = 'source-over';
  };
  mask(b1g, w, w + ramp1); mask(b2g, w + ramp1 * 0.7, w + ramp1 + ramp2);
  og.clearRect(0, 0, W, H);
  og.drawImage(S, 0, 0); og.drawImage(B1, 0, 0); og.drawImage(B2, 0, 0);
  g.filter = `saturate(${band.sat || 1.4}) contrast(1.07)`; g.drawImage(OUT, 0, 0); g.filter = 'none';
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  vg.addColorStop(0, 'rgba(10,8,30,0)'); vg.addColorStop(1, `rgba(10,8,30,${band.vig ?? 0.38})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

// ---------- dữ liệu phố ----------
// x dọc phố, z: mặt tiền ở z = 0, nhà lùi về z < 0, vỉa hè 0..6, đường 6..14, vỉa hè đối diện 14..18, công viên > 18
export const YOURS = 6;
export const SHOPS = (() => {
  const d = [
    { name: 'Pizzeria Luna', w: 9, h: 11, col: '#efe0c2', awn: '#2f7d4f', roof: 'gable', rc: '#b4533c', fl: 3 },
    { name: 'Döner Eck', w: 10, h: 10, col: '#f1c56c', awn: '#c33b2c', roof: 'flat', rc: '#8d8a84', fl: 3 },
    { name: 'Café Linde', w: 8, h: 12.5, col: '#cde6d6', awn: '#e9e3d3', roof: 'gable', rc: '#5d6b78', fl: 3 },
    { name: 'Sushi Hana', w: 11, h: 13, col: '#f4efe6', awn: '#24313f', roof: 'flat', rc: '#9a958c', fl: 4 },
    { name: 'Taverna Kreta', w: 9, h: 11, col: '#bcd7ee', awn: '#1f5fa8', roof: 'gable', rc: '#a9483a', fl: 3 },
    { name: 'Burger 21', w: 10, h: 10.5, col: '#e9a07a', awn: '#f2b632', roof: 'flat', rc: '#7c7a76', fl: 3 },
    { name: 'Bếp Sen', w: 10, h: 12, col: '#efe6d6', awn: '#c9506f', roof: 'gable', rc: '#7b4a3a', fl: 3 },
    { name: 'Asia Garden', w: 9, h: 12, col: '#f5d9a8', awn: '#b22a2a', roof: 'gable', rc: '#9c4335', fl: 3 },
    { name: 'Curry Haus', w: 8, h: 11.5, col: '#f2e6a4', awn: '#3f8d6b', roof: 'flat', rc: '#8e8b82', fl: 3 },
    { name: 'Trattoria Sole', w: 10, h: 12, col: '#f0cfc0', awn: '#2a6e3f', roof: 'gable', rc: '#b85c3f', fl: 3 },
  ];
  let x = -47;
  return d.map((s, i) => { const o = { ...s, i, x0: x, x1: x + s.w, cx: x + s.w / 2 }; x += s.w; return o; });
})();
// nhà thường (không phải quán) hai đầu phố + dãy sau
export const FILL = (() => {
  const out = [], cols = ['#e8e1d3', '#d9c7a8', '#cfd8de', '#eadfc8', '#d6b59a', '#e3d7e8', '#cfe0c8'];
  let x = -47; for (let i = 0; i < 4; i++) { const w = 8 + hash(i * 7.1) * 4; out.push({ x0: x - w, x1: x, z0: -14, z1: 0, h: 10 + hash(i * 3.3) * 5, col: cols[i % 7], roof: hash(i * 9.1) > .5 ? 'gable' : 'flat', rc: hash(i) > .5 ? '#a9503b' : '#7f7c78', fl: 3 }); x -= w; }
  x = 47; for (let i = 0; i < 4; i++) { const w = 8 + hash(i * 5.7 + 2) * 4; out.push({ x0: x, x1: x + w, z0: -14, z1: 0, h: 10 + hash(i * 2.9 + 1) * 5, col: cols[(i + 3) % 7], roof: hash(i * 4.3 + 1) > .5 ? 'gable' : 'flat', rc: hash(i + 9) > .5 ? '#a9503b' : '#7f7c78', fl: 3 }); x += w; }
  x = -95; let j = 0; while (x < 95) { const w = 9 + hash(j * 1.7 + 40) * 7; out.push({ x0: x, x1: x + w - 0.4, z0: -34, z1: -17, h: 11 + hash(j * 2.3 + 40) * 7, col: cols[j % 7], roof: hash(j * 6.1 + 40) > .45 ? 'gable' : 'flat', rc: hash(j + 40) > .5 ? '#9e4a36' : '#77746f', fl: 4, back: true }); x += w; j++; }
  return out;
})();
export const TREES = (() => { const t = []; for (let i = 0; i < 26; i++) t.push({ x: -90 + i * 7.3 + hash(i * 3.1) * 2, z: 19.5 + hash(i * 1.3) * 2.5, r: 2.4 + hash(i * 7.7) * 1.0 }); for (let i = 0; i < 30; i++) t.push({ x: -90 + hash(i * 5.3 + 1) * 180, z: 27 + hash(i * 2.2 + 3) * 22, r: 2.6 + hash(i * 4.4) * 1.4 }); return t; })();
export const LAMPS = (() => { const l = []; for (let x = -84; x <= 84; x += 14) l.push({ x, z: 6.4 }), l.push({ x: x + 7, z: 14.6 }); return l; })();

// ---------- người tí hon ----------
const SHIRTS = ['#e63946', '#f1c453', '#2a9d8f', '#457b9d', '#f4a261', '#ffffff', '#8d5bd1', '#1d3557', '#e76f51', '#90be6d', '#ff7aa8'];
export const shirt = i => SHIRTS[Math.floor(hash(i * 13.37) * SHIRTS.length)];
export function person(g, x, z, col, opt = {}) {
  const hgt = opt.h || 1.75, seat = opt.seat || 0;
  const f = proj([x, seat, z]), hd = proj([x, seat + hgt, z]); if (!f || !hd) return null;
  const s = ppm(f[2]), w = Math.max(1.6, s * 0.5);
  g.fillStyle = 'rgba(20,24,48,.28)'; g.beginPath(); g.ellipse(f[0], f[1], w * 0.75, w * 0.3, 0, 0, Math.PI * 2); g.fill();
  const c = shade(col, [0, .3, .95], 1);
  g.strokeStyle = css(c); g.lineCap = 'round'; g.lineWidth = w;
  const bodyTop = [lerp(f[0], hd[0], .72), lerp(f[1], hd[1], .72)];
  g.beginPath(); g.moveTo(f[0], f[1] - w * 0.3); g.lineTo(bodyTop[0], bodyTop[1]); g.stroke();
  g.fillStyle = css(shade(opt.hair || '#3b2a20', [0, .6, .8], 1)); const hr = Math.max(1, s * 0.15);
  g.beginPath(); g.arc(lerp(f[0], hd[0], .93), lerp(f[1], hd[1], .93), hr, 0, Math.PI * 2); g.fill();
  if (opt.phone && s > 6) { g.fillStyle = 'rgba(190,230,255,.95)'; g.fillRect(bodyTop[0] + w * 0.25, bodyTop[1] + w * 0.1, Math.max(1.5, s * .12), Math.max(2, s * .2)); }
  return { foot: f, head: hd, s };
}
