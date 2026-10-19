// SA14 · toàn bộ hình vẽ giấy (Canvas2D): trang sách, thẻ bật lên, nhân vật, giao diện minh hoạ, bìa sách.
// Kỹ thuật cắt giấy theo STYLE.md: nét mực nâu đậm, viền giấy trắng ngà nở từ hình bóng, mép bìa xám lệch xuống, vân giấy.
import { mulberry, TAU, clamp, lerp } from '/core/lib.js';

export const INK = '#3b2a22', PPM = 5000, LW = 8, LW2 = 4;
export const BW = 0.40, BD = 0.28;                       // trang sách (m)
const PG = 4000;                                         // px/m cho mặt trang

export function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); return c; }
function grain(n, seed) {
  const c = cv(n, n), x = c.getContext('2d'), R = mulberry(seed), im = x.createImageData(n, n), d = im.data;
  for (let i = 0; i < n * n; i++) { const v = R(); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < .5 ? 0 : 255; d[i * 4 + 3] = Math.abs(v - .5) * 30; }
  x.putImageData(im, 0, 0); x.lineCap = 'round';
  for (let i = 0; i < n * 1.3; i++) { const px = R() * n, py = R() * n, a = R() * TAU, l = 4 + R() * 16;
    x.strokeStyle = R() < .5 ? 'rgba(90,70,50,.10)' : 'rgba(255,255,255,.2)'; x.lineWidth = .6 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  return c;
}
export const GRAIN = grain(512, 11);
export function paperFill(x, w, h, col, seed = 1, mott = .06) {
  x.fillStyle = col; x.fillRect(0, 0, w, h);
  const R = mulberry(seed);
  for (let i = 0; i < 60; i++) { const px = R() * w, py = R() * h, r = 40 + R() * 240, g = x.createRadialGradient(px, py, 0, px, py, r), dk = R() < .5;
    g.addColorStop(0, dk ? `rgba(120,90,60,${mott * R()})` : `rgba(255,255,255,${mott * 1.3 * R()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  grainOver(x, w, h, .85);
}
function grainOver(x, w, h, a) { x.save(); x.globalAlpha = a; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, w, h); x.restore(); }
export function finishCut(art, border = 14, o = {}) {
  const w = art.width, h = art.height, out = cv(w, h), x = out.getContext('2d');
  const dil = (r, col) => { const c = cv(w, h), y = c.getContext('2d'), n = Math.max(16, Math.round(r * 1.2));
    for (const rr of [r, r * .66, r * .33]) for (let i = 0; i < n; i++) { const a = i / n * TAU; y.drawImage(art, Math.cos(a) * rr, Math.sin(a) * rr); }
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, w, h); return c; };
  if (border > 0) { x.drawImage(dil(border + 2.5, o.edge || '#b5a998'), 0, 1.8); x.drawImage(dil(border, o.paper || '#fffaf0'), 0, 0); }
  x.drawImage(art, 0, 0);
  if (o.grain !== false) { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = o.grainA ?? .8; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, w, h); x.restore(); }
  return out;
}
export function sh(x, fill, lw = LW, stroke = INK) {
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw > 0) { x.lineWidth = lw; x.strokeStyle = stroke; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
}
export function smoothClosed(x, p) { const n = p.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let m = mid(p[n - 1], p[0]); x.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const a = p[i], mm = mid(a, p[(i + 1) % n]); x.quadraticCurveTo(a[0], a[1], mm[0], mm[1]); } x.closePath(); }
export function blob(x, cx, cy, rx, ry, wob = .04, seed = 1, n = 28) {
  const R = mulberry(seed), ph = [R() * TAU, R() * TAU, R() * TAU], p = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + wob * (Math.sin(a * 3 + ph[0]) * .5 + Math.sin(a * 5 + ph[1]) * .3 + Math.sin(a * 2 + ph[2]) * .4); p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  x.beginPath(); smoothClosed(x, p);
}
// hình chữ nhật hơi run tay (giấy cắt bằng kéo)
export function wrect(x, px, py, w, h, seed = 1, wob = 2.2, r = 6) {
  const R = mulberry(seed), j = () => (R() - .5) * 2 * wob;
  x.beginPath(); x.moveTo(px + r + j(), py + j());
  x.lineTo(px + w / 2 + j(), py + j()); x.lineTo(px + w - r + j(), py + j()); x.quadraticCurveTo(px + w, py, px + w + j(), py + r);
  x.lineTo(px + w + j(), py + h / 2); x.lineTo(px + w + j(), py + h - r); x.quadraticCurveTo(px + w, py + h, px + w - r, py + h + j());
  x.lineTo(px + w / 2 + j(), py + h + j()); x.lineTo(px + r, py + h + j()); x.quadraticCurveTo(px, py + h, px + j(), py + h - r);
  x.lineTo(px + j(), py + h / 2); x.lineTo(px + j(), py + r); x.quadraticCurveTo(px, py, px + r, py); x.closePath();
}
export function crescent(x, pathFn, shade, dx, dy, base) {
  x.save(); pathFn(); x.clip(); x.fillStyle = shade; x.fillRect(-9999, -9999, 30000, 30000);
  x.translate(-dx, -dy); pathFn(); x.fillStyle = base; x.fill(); x.restore();
}
export function text(x, s, px, py, font, fill, o = {}) {
  x.save(); x.font = font; x.textAlign = o.align || 'center'; x.textBaseline = o.base || 'alphabetic';
  if (o.stroke) { x.lineJoin = 'round'; x.lineWidth = o.lw || 8; x.strokeStyle = o.stroke; x.strokeText(s, px, py); }
  x.fillStyle = fill; x.fillText(s, px, py); x.restore();
}
// thẻ cắt giấy kích thước theo mét; hinge (mép dưới) nằm ở đáy vùng vẽ
export function card(wm, hm, draw, o = {}) {
  const ppm = o.ppm || PPM, border = o.border ?? 14, pad = border + 6, W = wm * ppm, H = hm * ppm;
  const a = cv(W + 2 * pad, H + 2 * pad), x = a.getContext('2d'); x.translate(pad, pad); draw(x, W, H);
  const c = o.raw ? a : finishCut(a, border, o);
  c.wm = (W + 2 * pad) / ppm; c.hm = (H + 2 * pad) / ppm; c.pad = pad / ppm; c.ppm = ppm;
  return c;
}
// bản vẽ chì (graphite trên giấy kem) từ một hàm vẽ: dùng cho "chưa ai nhìn thấy"
export const PENCIL = 'rgba(72,74,84,.75)';

// ======================= TRANG SÁCH =======================
function page(draw, seed, base) { const W = BW * PG, H = BD * PG, c = cv(W, H), x = c.getContext('2d'); paperFill(x, W, H, base, seed, .07); draw(x, W, H); grainOver(x, W, H, .35);
  // mép giấy hơi tối
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,40,20,.10)'); g.addColorStop(.05, 'rgba(0,0,0,0)'); g.addColorStop(.95, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,40,20,.12)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c; }

// --- 1. căn bếp (hổ phách / cam) ---
export function kitchenBack() {
  return page((x, W, H) => {
    // tường gạch men
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f2b45f'); g.addColorStop(1, '#e89a45'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const R = mulberry(3);
    for (let yy = H * .42; yy < H; yy += 72) for (let xx = ((yy / 72) % 2) * 36 - 36; xx < W; xx += 72) { wrect(x, xx + 3, yy + 3, 66, 66, (xx * 7 + yy) | 0, 1.5, 6); sh(x, R() < .12 ? '#f7c77e' : '#f0ad5c', 2.5, 'rgba(120,60,20,.35)'); }
    // cửa sổ: phố Đức chiều tối
    const wx = W * .52, wy = H * .08, ww = W * .36, wh = H * .36;
    wrect(x, wx, wy, ww, wh, 4, 2, 10); const sk = x.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, '#5d6fb3'); sk.addColorStop(1, '#f2a46b'); sh(x, sk, LW);
    x.save(); wrect(x, wx, wy, ww, wh, 4, 2, 10); x.clip();
    const roofs = [[0, .55, .22, .25], [.2, .45, .2, .35], [.38, .6, .18, .2], [.55, .4, .22, .4], [.75, .52, .26, .3]];
    for (const [rx, ry, rw] of roofs) { const X = wx + rx * ww, Y = wy + ry * wh, Wd = rw * ww; x.beginPath(); x.moveTo(X, wy + wh); x.lineTo(X, Y); x.lineTo(X + Wd / 2, Y - Wd * .45); x.lineTo(X + Wd, Y); x.lineTo(X + Wd, wy + wh); x.closePath(); sh(x, '#7b5a8c', 3, 'rgba(59,42,34,.6)');
      for (let k = 0; k < 2; k++) { x.beginPath(); x.rect(X + Wd * (.22 + k * .36), Y + 14, Wd * .18, 22); sh(x, '#ffd77a', 0); } }
    x.restore();
    wrect(x, wx, wy, ww, wh, 4, 2, 10); sh(x, null, LW + 4);
    x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.moveTo(wx, wy + wh / 2); x.lineTo(wx + ww, wy + wh / 2); sh(x, null, LW);
    // kệ + chum + bát
    const sy = H * .30; wrect(x, W * .05, sy, W * .4, 26, 5, 1.5, 4); sh(x, '#9a5b2e', LW2 + 2);
    const jars = [['#c8553d', 70, 90], ['#f4e3c1', 60, 110], ['#6b8e4e', 64, 80], ['#3d6f8e', 56, 96]];
    let jx = W * .07; jars.forEach(([c, w, h], i) => { blob(x, jx + w / 2, sy - h / 2, w / 2, h / 2, .05, 20 + i); sh(x, c, LW2 + 2); x.beginPath(); x.rect(jx + w * .2, sy - h - 10, w * .6, 14); sh(x, '#7a4a2a', LW2); jx += w + 26; });
    // muôi, vá treo
    for (let i = 0; i < 3; i++) { const X = W * .1 + i * 70, Y = H * .05; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y + 120); sh(x, null, LW2 + 2, '#5a3a24'); blob(x, X, Y + 140, 22, 18, .05, 40 + i); sh(x, '#c9c2b4', LW2 + 1); }
    // lịch nhỏ chữ Việt mờ
    wrect(x, W * .42, H * .06, 110, 140, 8, 1.5, 6); sh(x, '#fff3d6', LW2 + 1); x.fillStyle = '#c8553d'; x.fillRect(W * .42 + 6, H * .06 + 6, 98, 30);
  }, 31, '#f0b05c');
}
export function kitchenGround() {
  return page((x, W, H) => {
    // sàn gỗ
    const R = mulberry(9);
    for (let yy = 0; yy < H; yy += 92) { x.fillStyle = yy % 184 ? '#b9733d' : '#c27e45'; x.fillRect(0, yy, W, 92); x.strokeStyle = 'rgba(80,40,15,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke();
      for (let xx = R() * 300; xx < W; xx += 260 + R() * 220) { x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 92); x.stroke(); } }
    // thảm nhỏ hoa văn
    wrect(x, W * .56, H * .52, W * .34, H * .34, 12, 3, 20); sh(x, '#d9473a', LW2 + 2); wrect(x, W * .58, H * .55, W * .30, H * .28, 13, 3, 16); sh(x, null, LW2, '#f4c86a');
  }, 33, '#c07a43');
}
// --- 2. con phố (xanh lam / tím nhạt) — night=true: bản đêm ấm (trang 4) ---
export function streetBack(night) {
  return page((x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, '#2b2257'); g.addColorStop(.7, '#6a3f6e'); g.addColorStop(1, '#b45e5a'); } else { g.addColorStop(0, '#8fa6e0'); g.addColorStop(.7, '#c9b8e6'); g.addColorStop(1, '#efc9d6'); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const R = mulberry(night ? 71 : 70);
    if (night) for (let i = 0; i < 60; i++) { x.beginPath(); x.arc(R() * W, R() * H * .5, 2 + R() * 3, 0, TAU); x.fillStyle = 'rgba(255,240,200,.8)'; x.fill(); }
    // mây giấy / trăng
    if (night) { blob(x, W * .82, H * .16, 60, 60, .03, 5); sh(x, '#fff1c4', LW2 + 1); }
    else for (let i = 0; i < 4; i++) { blob(x, W * (.12 + i * .26), H * (.12 + (i % 2) * .08), 110, 40, .08, 50 + i); sh(x, 'rgba(255,255,255,.75)', LW2, 'rgba(59,42,34,.5)'); }
    // dãy nhà xa
    let X = -20; let k = 0;
    while (X < W) { const w = 150 + R() * 90, h = H * (.42 + R() * .25), Y = H - h;
      x.beginPath(); x.moveTo(X, H); x.lineTo(X, Y); x.lineTo(X + w * .5, Y - w * .35); x.lineTo(X + w, Y); x.lineTo(X + w, H); x.closePath();
      const cols = night ? ['#5a3e74', '#4e3a6a', '#6b4470'] : ['#a8a0d6', '#9fb3dd', '#b9a7d9'];
      sh(x, cols[k % 3], LW2 + 1, night ? 'rgba(20,10,30,.8)' : 'rgba(59,42,34,.55)');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { x.beginPath(); x.rect(X + w * (.14 + c * .28), Y + 26 + r * 58, w * .16, 30); const lit = night ? R() < .55 : R() < .1; sh(x, lit ? '#ffd27a' : (night ? '#3a2a50' : '#e9e6f7'), 2, 'rgba(59,42,34,.4)'); }
      X += w - 4; k++; }
  }, night ? 41 : 40, night ? '#3b2b5c' : '#b8c4ea');
}
export function streetGround(night) {
  return page((x, W, H) => {
    // vỉa hè sau, đường lát đá giữa, vỉa hè trước
    x.fillStyle = night ? '#6e5a6e' : '#c9c6dc'; x.fillRect(0, 0, W, H * .3);
    x.fillStyle = night ? '#4a3d55' : '#8f93b4'; x.fillRect(0, H * .3, W, H * .45);
    x.fillStyle = night ? '#6e5a6e' : '#c9c6dc'; x.fillRect(0, H * .75, W, H * .25);
    const R = mulberry(night ? 61 : 60);
    for (let yy = H * .3; yy < H * .75; yy += 34) for (let xx = (yy / 34 % 2) * 20; xx < W; xx += 40) { blob(x, xx, yy + 17, 17, 13, .12, (xx * 3 + yy) | 0, 10); sh(x, R() < .5 ? (night ? '#54465f' : '#9da1c0') : (night ? '#433750' : '#878ba9'), 1.5, 'rgba(40,30,50,.35)'); }
    for (const yy of [H * .3, H * .75]) { x.strokeStyle = 'rgba(59,42,34,.6)'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
    for (let xx = 0; xx < W; xx += 90) { x.strokeStyle = 'rgba(59,42,34,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H * .3); x.moveTo(xx + 45, H * .75); x.lineTo(xx + 45, H); x.stroke(); }
    if (night) { const gl = x.createRadialGradient(W * .74, H * .2, 10, W * .74, H * .2, W * .3); gl.addColorStop(0, 'rgba(255,190,90,.55)'); gl.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = gl; x.fillRect(0, 0, W, H); }
  }, night ? 43 : 42, night ? '#4a3d55' : '#8f93b4');
}
// --- 3. xưởng SAMI: bảng vẽ + bản đồ thành phố trên tấm cắt có lưới ---
export function workBack() {
  return page((x, W, H) => {
    x.fillStyle = '#d9d6f5'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(118,103,254,.25)'; x.lineWidth = 2; for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let i = 0; i < H; i += 40) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    // phác thảo logo mây (chì) + vòng tròn dựng hình
    x.save(); x.strokeStyle = 'rgba(60,50,110,.55)'; x.lineWidth = 3;
    x.beginPath(); x.arc(W * .2, H * .3, 120, 0, TAU); x.stroke(); x.beginPath(); x.arc(W * .2, H * .3, 80, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(W * .2 - 160, H * .3); x.lineTo(W * .2 + 160, H * .3); x.moveTo(W * .2, H * .3 - 160); x.lineTo(W * .2, H * .3 + 160); x.stroke();
    cloudPath(x, W * .2, H * .32, 1.3); x.stroke(); x.restore();
    // giấy ghim: bảng phông chữ
    wrect(x, W * .62, H * .1, W * .3, H * .32, 7, 2, 8); sh(x, '#fffaf0', LW2 + 1);
    text(x, 'Aa', W * .70, H * .3, '800 120px "Baloo 2"', '#3b2a22'); text(x, 'Aa', W * .84, H * .3, '600 100px "Lora"', '#3b2a22');
    x.fillStyle = 'rgba(59,42,34,.3)'; for (let i = 0; i < 3; i++) x.fillRect(W * .65, H * .34 + i * 14, W * .24 - i * 40, 6);
    for (const [px, py] of [[W * .77, H * .11]]) { x.beginPath(); x.arc(px, py, 12, 0, TAU); sh(x, '#d9473a', 3); }
    // thước
    wrect(x, W * .05, H * .78, W * .9, 46, 9, 1, 4); sh(x, '#f4d27a', LW2 + 1); x.strokeStyle = INK; x.lineWidth = 2; for (let i = 0; i < 80; i++) { const xx = W * .06 + i * W * .011; x.beginPath(); x.moveTo(xx, H * .78); x.lineTo(xx, H * .78 + (i % 5 ? 12 : 24)); x.stroke(); }
  }, 51, '#d9d6f5');
}
export const MAPPIN = [0.62, 0.42];               // vị trí Quán Mây trên trang bản đồ (u,v của trang đất)
export function mapGround() {
  return page((x, W, H) => {
    x.fillStyle = '#bfe8d6'; x.fillRect(0, 0, W, H);
    // khối nhà trên bản đồ
    const R = mulberry(77);
    for (let by = 0; by < 6; by++) for (let bx = 0; bx < 8; bx++) { const px = bx * W / 8 + 14, py = by * H / 6 + 14, w = W / 8 - 28, h = H / 6 - 28;
      wrect(x, px, py, w, h, bx * 13 + by, 2, 10); sh(x, R() < .25 ? '#a6dcc4' : '#e9e4f7', 2.5, 'rgba(59,42,34,.35)'); }
    // đường chính + sông
    x.strokeStyle = '#fffaf0'; x.lineCap = 'round';
    x.lineWidth = 34; x.beginPath(); x.moveTo(0, H * .5); x.bezierCurveTo(W * .3, H * .38, W * .6, H * .62, W, H * .46); x.stroke();
    x.lineWidth = 26; x.beginPath(); x.moveTo(W * .35, 0); x.bezierCurveTo(W * .42, H * .4, W * .3, H * .7, W * .38, H); x.stroke();
    x.strokeStyle = '#8ec5ea'; x.lineWidth = 40; x.beginPath(); x.moveTo(W * .7, 0); x.bezierCurveTo(W * .8, H * .3, W * .9, H * .2, W, H * .35); x.stroke();
    // lưới tấm cắt + vạch đo
    x.strokeStyle = 'rgba(118,103,254,.35)'; x.lineWidth = 2; x.lineCap = 'butt';
    for (let i = 0; i < W; i += 80) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let i = 0; i < H; i += 80) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    // các ghim xám của quán khác
    const others = [[.18, .3], [.44, .72], [.82, .66], [.27, .64]];
    for (const [u, v] of others) pinIcon(x, u * W, v * H, 26, '#9aa0b5');
    text(x, 'Leipzig', W * .12, H * .93, '700 46px "Baloo 2"', 'rgba(59,42,34,.6)', { align: 'left' });
  }, 52, '#bfe8d6');
}
function pinIcon(x, px, py, r, col) { x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px - r * 1.2, py - r * 1.2, px - r, py - r * 2.4, px, py - r * 2.4); x.bezierCurveTo(px + r, py - r * 2.4, px + r * 1.2, py - r * 1.2, px, py); sh(x, col, 3);
  x.beginPath(); x.arc(px, py - r * 1.6, r * .38, 0, TAU); sh(x, '#fffaf0', 0); }
// --- 5. trang cuối (kem + chì) ---
export function lastBack() {
  return page((x, W, H) => {
    x.save(); x.strokeStyle = 'rgba(72,74,84,.35)'; x.lineWidth = 3;
    // phác chì lại mặt tiền quán, mờ
    facadeLines(x, W * .32, H * .25, W * .36, H * .62); x.restore();
  }, 61, '#f5eedc');
}
export function lastGround() { return page(() => {}, 62, '#f3ead6'); }

// ======================= BÌA SÁCH =======================
export function coverArt(logo) {
  const W = BW * PG, H = BD * PG, c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#16122e'; x.fillRect(0, 0, W, H);
  const R = mulberry(5);
  for (let i = 0; i < 9000; i++) { x.fillStyle = R() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.12)'; x.fillRect(R() * W, R() * H, 2 + R() * 8, 1.2); x.fillRect(R() * W, R() * H, 1.2, 2 + R() * 8); }
  const v = x.createRadialGradient(W / 2, H * .45, 50, W / 2, H / 2, W * .7); v.addColorStop(0, 'rgba(118,103,254,.10)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  // khung nhũ
  x.strokeStyle = 'rgba(224,190,110,.85)'; x.lineWidth = 6; x.strokeRect(60, 60, W - 120, H - 120); x.lineWidth = 2; x.strokeRect(80, 80, W - 160, H - 160);
  const lw = W * .62, lh = lw * 1024 / 3120; x.drawImage(logo, (W - lw) / 2, H * .30, lw, lh);
  text(x, 'Strategy • Automation • Marketing • Intelligence', W / 2, H * .30 + lh + 110, '700 54px "Nunito"', '#e3c98a');
  text(x, 'Innovation in everything we do', W / 2, H * .30 + lh + 190, 'italic 500 50px "Lora"', 'rgba(227,228,247,.75)');
  return c;
}

// ======================= CÁC THẺ =======================
// mây (logo Quán Mây)
export function cloudPath(x, cx, cy, s) { x.beginPath(); x.moveTo(cx - 70 * s, cy + 22 * s); x.bezierCurveTo(cx - 95 * s, cy + 22 * s, cx - 95 * s, cy - 20 * s, cx - 62 * s, cy - 18 * s);
  x.bezierCurveTo(cx - 58 * s, cy - 55 * s, cx - 8 * s, cy - 60 * s, cx, cy - 30 * s); x.bezierCurveTo(cx + 15 * s, cy - 58 * s, cx + 64 * s, cy - 48 * s, cx + 60 * s, cy - 14 * s);
  x.bezierCurveTo(cx + 95 * s, cy - 14 * s, cx + 95 * s, cy + 22 * s, cx + 66 * s, cy + 22 * s); x.closePath(); }
function facadeLines(x, X, Y, W, H) {
  // khung mặt tiền: mái hiên, cửa, cửa sổ
  x.beginPath(); x.rect(X, Y + H * .18, W, H * .82); x.stroke();
  x.beginPath(); x.moveTo(X - 10, Y + H * .18); x.lineTo(X + W * .5, Y); x.lineTo(X + W + 10, Y + H * .18); x.stroke();
  x.beginPath(); x.rect(X + W * .38, Y + H * .55, W * .24, H * .45); x.stroke();
  x.beginPath(); x.rect(X + W * .08, Y + H * .55, W * .24, H * .25); x.rect(X + W * .68, Y + H * .55, W * .24, H * .25); x.stroke();
  x.beginPath(); x.rect(X + W * .15, Y + H * .3, W * .7, H * .14); x.stroke();
}
// mặt tiền Quán Mây: bản chì (pencil) và bản màu (cùng khung)
export const FAC = { w: 0.10, h: 0.10 };
export function facadeDraw(x, W, H, colour) {
  const P = colour;
  const lw = P ? LW : 4, ink = P ? INK : 'rgba(70,72,82,.85)';
  const fill = c => P ? c : null;
  const st = (f, w = lw) => sh(x, P ? f : 'rgba(250,246,236,1)', w, ink);
  // thân nhà
  wrect(x, W * .04, H * .2, W * .92, H * .8, 101, 2, 6); st('#e8c98e');
  // mái ngói đỏ
  x.beginPath(); x.moveTo(-2, H * .24); x.lineTo(W * .5, H * .02); x.lineTo(W + 2, H * .24); x.closePath(); st('#c8463a');
  if (P) { x.save(); x.beginPath(); x.moveTo(-2, H * .24); x.lineTo(W * .5, H * .02); x.lineTo(W + 2, H * .24); x.closePath(); x.clip(); x.strokeStyle = 'rgba(80,20,15,.35)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, H * (.06 + i * .03)); x.lineTo(W, H * (.06 + i * .03)); x.stroke(); } x.restore(); }
  else { x.save(); x.strokeStyle = 'rgba(72,74,84,.4)'; x.lineWidth = 2; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(W * .15 + i * 30, H * .2); x.lineTo(W * .3 + i * 30, H * .06); x.stroke(); } x.restore(); }
  // ô biển hiệu (trống ở bản chì)
  wrect(x, W * .14, H * .3, W * .72, H * .14, 103, 1.5, 6); st('#2f4a3a', lw);
  // cửa sổ + cửa
  for (const ux of [.08, .66]) { wrect(x, W * ux, H * .55, W * .26, H * .24, 104 + ux * 10, 1.5, 6); st('#ffd98a'); x.beginPath(); x.moveTo(W * (ux + .13), H * .55); x.lineTo(W * (ux + .13), H * .79); x.moveTo(W * ux, H * .67); x.lineTo(W * (ux + .26), H * .67); sh(x, null, lw * .6, ink); }
  wrect(x, W * .38, H * .52, W * .24, H * .48, 106, 1.5, 8); st('#7a3b26');
  x.beginPath(); x.arc(W * .57, H * .78, 6, 0, TAU); sh(x, P ? '#f4c86a' : null, 2, ink);
  // mái hiên vải sọc
  x.beginPath(); x.moveTo(W * .02, H * .47); x.lineTo(W * .98, H * .47); x.lineTo(W * .94, H * .53); x.lineTo(W * .06, H * .53); x.closePath(); st('#f4e3c1');
  if (P) { x.save(); x.beginPath(); x.moveTo(W * .02, H * .47); x.lineTo(W * .98, H * .47); x.lineTo(W * .94, H * .53); x.lineTo(W * .06, H * .53); x.closePath(); x.clip(); for (let i = 0; i < 10; i++) { x.fillStyle = '#c8463a'; x.fillRect(W * (.02 + i * .1), H * .47, W * .05, H * .06); } x.restore(); x.beginPath(); x.moveTo(W * .02, H * .47); x.lineTo(W * .98, H * .47); x.lineTo(W * .94, H * .53); x.lineTo(W * .06, H * .53); x.closePath(); sh(x, null, lw, ink); }
  // chậu cây
  for (const ux of [.06, .84]) { x.beginPath(); x.rect(W * ux, H * .88, W * .1, H * .1); st('#b5653a', lw * .7); blob(x, W * (ux + .05), H * .84, W * .07, H * .06, .2, 200 + ux * 10, 14); st('#5f9a4a', lw * .7); }
}
export function signDraw(x, W, H, colour = true) {
  // biển hiệu Quán Mây: nền xanh rêu, logo mây vàng, chữ kem
  wrect(x, 0, 0, W, H, 301, 2, 14); sh(x, colour ? '#2f4a3a' : '#f5efe0', LW, colour ? INK : 'rgba(70,72,82,.8)');
  if (!colour) return;
  wrect(x, 10, 10, W - 20, H - 20, 302, 1.5, 10); sh(x, null, 3, '#e3c98a');
  cloudPath(x, H * .62, H * .52, H / 150); sh(x, '#f4c86a', 5, INK);
  text(x, 'QUÁN MÂY', H * 1.14 + (W - H * 1.14) / 2, H * .55, `800 ${Math.round(H * .44)}px "Baloo 2"`, '#fff3d6', { stroke: INK, lw: 10 });
  text(x, 'Vietnamesische Küche', H * 1.14 + (W - H * 1.14) / 2, H * .82, `700 ${Math.round(H * .17)}px "Nunito"`, '#e3c98a');
}
// đèn lồng giấy (đỏ, tua vàng); lit = phát sáng
export function lanternDraw(x, W, H, lit, col = '#d9473a') {
  if (lit) { const g = x.createRadialGradient(W / 2, H * .5, 4, W / 2, H * .5, W * .55); g.addColorStop(0, 'rgba(255,220,140,.95)'); g.addColorStop(1, 'rgba(255,200,120,0)'); }
  x.beginPath(); x.rect(W * .38, 0, W * .24, H * .1); sh(x, '#e3b04a', LW2);
  blob(x, W / 2, H * .45, W * .46, H * .34, .02, 401, 30); sh(x, lit ? '#ff6a4a' : col, LW);
  if (lit) { blob(x, W / 2, H * .45, W * .28, H * .24, .02, 402, 24); sh(x, 'rgba(255,214,120,.85)', 0); }
  x.strokeStyle = 'rgba(80,20,15,.5)'; x.lineWidth = 3; for (const k of [-.25, 0, .25]) { x.beginPath(); x.ellipse(W / 2, H * .45, W * .46 * Math.abs(k * 2.4 + .0001), H * .34, 0, 0, TAU); x.stroke(); }
  x.beginPath(); x.rect(W * .38, H * .78, W * .24, H * .07); sh(x, '#e3b04a', LW2);
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(W * (.42 + i * .05), H * .85); x.lineTo(W * (.42 + i * .05), H * .99); sh(x, null, 4, '#e3b04a'); }
}
export function pinDraw(x, W, H) {
  const r = W * .42, px = W / 2, py = H * .98;
  x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px - r * 1.25, py - H * .45, px - r, py - H * .98, px, py - H * .98); x.bezierCurveTo(px + r, py - H * .98, px + r * 1.25, py - H * .45, px, py); sh(x, '#e5413a', LW);
  crescent(x, () => { x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px - r * 1.25, py - H * .45, px - r, py - H * .98, px, py - H * .98); x.bezierCurveTo(px + r, py - H * .98, px + r * 1.25, py - H * .45, px, py); }, '#b42e2a', -10, 0, '#e5413a');
  x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px - r * 1.25, py - H * .45, px - r, py - H * .98, px, py - H * .98); x.bezierCurveTo(px + r, py - H * .98, px + r * 1.25, py - H * .45, px, py); sh(x, null, LW);
  x.beginPath(); x.arc(px, py - H * .66, r * .42, 0, TAU); sh(x, '#fffaf0', LW2);
}
// giao diện website Quán Mây (dùng cho thẻ điện thoại giấy và màn hình điện thoại thật)
export function siteDraw(x, W, H, k = 1) {
  x.fillStyle = '#fbf5ea'; x.fillRect(0, 0, W, H);
  // thanh trên
  x.fillStyle = '#2f4a3a'; x.fillRect(0, 0, W, H * .1);
  cloudPath(x, W * .12, H * .055, W / 1300); sh(x, '#f4c86a', 2 * k, '#1e2e24');
  text(x, 'QUÁN MÂY', W * .24, H * .07, `800 ${Math.round(W * .085)}px "Baloo 2"`, '#fff3d6', { align: 'left' });
  for (let i = 0; i < 3; i++) { x.fillStyle = '#fff3d6'; x.fillRect(W * .82, H * (.03 + i * .022), W * .1, H * .009); }
  // ảnh lớn: bát phở minh hoạ
  const hg = x.createLinearGradient(0, H * .1, 0, H * .42); hg.addColorStop(0, '#e8b26a'); hg.addColorStop(1, '#b8653a'); x.fillStyle = hg; x.fillRect(0, H * .1, W, H * .32);
  bowl(x, W * .5, H * .3, W * .32, k);
  text(x, 'Phở wie bei Mama', W * .5, H * .49, `800 ${Math.round(W * .075)}px "Baloo 2"`, '#3b2a22');
  text(x, 'Vietnamesische Küche · Leipzig', W * .5, H * .535, `600 ${Math.round(W * .045)}px "Nunito"`, '#7a5e4c');
  // nút
  const btn = (y, label, bg, fg) => { x.beginPath(); x.roundRect(W * .1, y, W * .8, H * .07, H * .035); x.fillStyle = bg; x.fill(); text(x, label, W * .5, y + H * .047, `800 ${Math.round(W * .062)}px "Nunito"`, fg); };
  btn(H * .58, 'Jetzt reservieren', '#d9473a', '#fff');
  btn(H * .67, 'Speisekarte', '#2f4a3a', '#fff3d6');
  // ô giờ
  const sl = ['18:00', '18:30', '19:00', '19:30'];
  sl.forEach((s, i) => { const px = W * (.1 + i * .205); x.beginPath(); x.roundRect(px, H * .78, W * .18, H * .05, 10); x.fillStyle = i === 2 ? '#08b884' : '#efe6d6'; x.fill(); text(x, s, px + W * .09, H * .813, `700 ${Math.round(W * .045)}px "Nunito"`, i === 2 ? '#fff' : '#3b2a22'); });
  text(x, 'Allergene · DE / EN', W * .5, H * .9, `600 ${Math.round(W * .042)}px "Nunito"`, '#7a5e4c');
}
function bowl(x, cx, cy, w, k = 1) {
  x.beginPath(); x.ellipse(cx, cy - w * .05, w * .5, w * .16, 0, 0, TAU); sh(x, '#f3d39a', 3 * k);
  for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(cx - w * .25 + i * w * .12, cy - w * .07, w * .07, w * .03, .3, 0, TAU); sh(x, i % 2 ? '#7aa84e' : '#c96b4a', 1.5 * k); }
  x.beginPath(); x.moveTo(cx - w * .5, cy - w * .05); x.bezierCurveTo(cx - w * .45, cy + w * .35, cx + w * .45, cy + w * .35, cx + w * .5, cy - w * .05); sh(x, '#f7f1e6', 3 * k);
  x.beginPath(); x.moveTo(cx - w * .38, cy + w * .08); x.lineTo(cx + w * .38, cy + w * .08); sh(x, null, 5 * k, '#3d6f8e');
}

// ======================= NHÂN VẬT =======================
// chị Mai: áo đỏ, tạp dề kem, tóc búi. pose: {arm:-1..1, mood:'smile'|'sad'|'happy'|'calm', eyes:'open'|'closed'|'down', wave:0..1}
export const MAI_H = 0.052;
export function maiDraw(x, W, H, p) {
  const cx = W / 2, sk = '#f6d2b0', skS = '#e6b48d';
  // chân
  x.beginPath(); x.rect(cx - W * .14, H * .82, W * .1, H * .16); sh(x, '#3b3a4a', LW2 + 2); x.beginPath(); x.rect(cx + W * .04, H * .82, W * .1, H * .16); sh(x, '#3b3a4a', LW2 + 2);
  // thân áo đỏ
  const body = () => { x.beginPath(); x.moveTo(cx - W * .24, H * .86); x.bezierCurveTo(cx - W * .26, H * .6, cx - W * .2, H * .42, cx, H * .41); x.bezierCurveTo(cx + W * .2, H * .42, cx + W * .26, H * .6, cx + W * .24, H * .86); x.closePath(); };
  crescent(x, body, '#a8322c', -12, 0, '#d9473a'); body(); sh(x, null, LW);
  // tạp dề
  x.beginPath(); x.moveTo(cx - W * .15, H * .55); x.lineTo(cx + W * .15, H * .55); x.lineTo(cx + W * .18, H * .84); x.lineTo(cx - W * .18, H * .84); x.closePath(); sh(x, '#f6ecd6', LW2 + 1);
  // tay
  const arm = (side, ang) => { const sx = cx + side * W * .2, sy = H * .47, L = H * .26; const ex = sx + Math.sin(ang) * L * side, ey = sy + Math.cos(ang) * L;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); sh(x, null, W * .1 + 2 * LW, INK); x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); sh(x, null, W * .1, '#d9473a');
    x.beginPath(); x.arc(ex, ey, W * .06, 0, TAU); sh(x, sk, LW2 + 1); return [ex, ey]; };
  arm(-1, .25 - (p.wave || 0) * 0);
  const ra = p.wave ? Math.PI * (.62 + .18 * Math.sin(p.wave * TAU * 2)) : .35 + p.arm * .45;
  const [hx, hy] = arm(1, ra);
  if (p.ladle) { x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx - W * .05, hy + H * .2); sh(x, null, 6, '#6b4a2e'); }
  // đầu
  const hy0 = H * .25, hr = W * .2;
  x.beginPath(); x.arc(cx + W * .05, hy0 - hr * 1.05, hr * .45, 0, TAU); sh(x, '#2e2422', LW2 + 2);    // búi tóc
  const head = () => { blob(x, cx, hy0, hr, hr * 1.05, .02, 501, 30); };
  crescent(x, head, skS, -9, 0, sk); head(); sh(x, null, LW);
  x.beginPath(); x.moveTo(cx - hr * 1.02, hy0 - hr * .05); x.bezierCurveTo(cx - hr * .9, hy0 - hr * 1.15, cx + hr * .9, hy0 - hr * 1.15, cx + hr * 1.02, hy0 - hr * .05); x.bezierCurveTo(cx + hr * .5, hy0 - hr * .55, cx - hr * .3, hy0 - hr * .62, cx - hr * 1.02, hy0 - hr * .05); sh(x, '#2e2422', LW2 + 1);
  // mặt
  const ey = hy0 + hr * .1, ex = hr * .38;
  if (p.eyes === 'closed' || p.mood === 'happy') { for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * ex, ey + 4, 9, Math.PI * 1.1, Math.PI * 1.9); sh(x, null, 5); } }
  else if (p.eyes === 'down') { for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * ex, ey + 6, 7, 5, 0, 0, TAU); sh(x, INK, 0); } }
  else for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * ex, ey, 8, 11, 0, 0, TAU); sh(x, INK, 0); x.beginPath(); x.arc(cx + s * ex + 2.5, ey - 4, 3, 0, TAU); sh(x, '#fff', 0); }
  // lông mày
  for (const s of [-1, 1]) { x.beginPath(); const by = ey - hr * .38; if (p.mood === 'sad') { x.moveTo(cx + s * ex - s * 12, by - 2); x.lineTo(cx + s * ex + s * 12, by + 6); } else { x.moveTo(cx + s * ex - 12, by + 2); x.quadraticCurveTo(cx + s * ex, by - 5, cx + s * ex + 12, by + 2); } sh(x, null, 4); }
  // má hồng
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * hr * .6, ey + hr * .35, 13, 8, 0, 0, TAU); x.fillStyle = 'rgba(232,110,100,.45)'; x.fill(); }
  // miệng
  x.beginPath(); const my = hy0 + hr * .55;
  if (p.mood === 'sad') { x.moveTo(cx - 12, my + 6); x.quadraticCurveTo(cx, my - 4, cx + 12, my + 6); sh(x, null, 5); }
  else if (p.mood === 'happy') { x.moveTo(cx - 18, my - 3); x.quadraticCurveTo(cx, my + 22, cx + 18, my - 3); x.closePath(); sh(x, '#a8322c', 4); }
  else if (p.mood === 'calm') { x.moveTo(cx - 10, my); x.quadraticCurveTo(cx, my + 5, cx + 10, my); sh(x, null, 5); }
  else { x.moveTo(cx - 15, my - 2); x.quadraticCurveTo(cx, my + 14, cx + 15, my - 2); sh(x, null, 5); }
}
// người đi đường (nhìn nghiêng 3/4, hướng phải); ph = pha bước 0..1
export const PERSON_H = 0.046;
const PCOL = [['#4e6fae', '#2e3550', '#e9c3a0', '#3a2a22'], ['#6aa38a', '#3b3a4a', '#f2d1b3', '#8a5530'], ['#9b6bb0', '#2e3550', '#d8a985', '#2a2220'], ['#e0a03a', '#4a3d55', '#f6d2b0', '#5a3a24'], ['#c8553d', '#2e3550', '#e9c3a0', '#3a2a22'], ['#3d8e8a', '#5a4a3a', '#f2d1b3', '#b07a3a']];
export function personDraw(x, W, H, kind, ph, o = {}) {
  const [shirt, pants, skin, hair] = PCOL[kind % PCOL.length], cx = W / 2, sw = Math.sin(ph * TAU);
  const leg = (side, a) => { const hx = cx + side * W * .05, hy = H * .58, L = H * .38; const fx = hx + Math.sin(a) * L, fy = hy + Math.cos(a) * L;
    x.beginPath(); x.moveTo(hx, hy); x.lineTo(fx, fy); sh(x, null, W * .13 + 2 * LW2 + 2, INK); x.beginPath(); x.moveTo(hx, hy); x.lineTo(fx, fy); sh(x, null, W * .13, pants);
    x.beginPath(); x.ellipse(fx + W * .04, fy - 2, W * .09, W * .05, 0, 0, TAU); sh(x, '#3b2a22', 0); };
  leg(-1, -sw * .45); leg(1, sw * .45);
  const body = () => { x.beginPath(); x.roundRect(cx - W * .2, H * .28, W * .4, H * .34, W * .14); };
  crescent(x, body, 'rgba(0,0,0,.18)', -10, 0, shirt); body(); sh(x, null, LW2 + 2);
  // tay đưa ngược pha
  const arm = (side, a, front) => { const sx = cx + side * W * .12, sy = H * .33, L = H * .26, ex = sx + Math.sin(a) * L, ey = sy + Math.cos(a) * L;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); sh(x, null, W * .1 + 2 * LW2 + 2, INK); x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); sh(x, null, W * .1, shirt);
    x.beginPath(); x.arc(ex, ey, W * .055, 0, TAU); sh(x, skin, LW2); return [ex, ey]; };
  if (o.phone) { const [ex, ey] = arm(1, Math.PI * .72, true); x.beginPath(); x.roundRect(ex - 6, ey - 26, 20, 32, 4); sh(x, '#2a2a33', 3); x.fillStyle = '#9fe0ff'; x.fillRect(ex - 3, ey - 22, 14, 22); }
  else arm(1, sw * .5);
  arm(-1, -sw * .5);
  const hr = W * .17, hy = H * .17;
  blob(x, cx, hy, hr, hr * 1.05, .02, 600 + kind, 24); sh(x, skin, LW2 + 2);
  x.beginPath(); x.arc(cx - hr * .1, hy - hr * .2, hr * 1.02, Math.PI * .95, Math.PI * 2.05); x.closePath(); sh(x, hair, LW2 + 1);
  x.beginPath(); x.ellipse(cx + hr * .4, hy + 2, 5, 7, 0, 0, TAU); sh(x, INK, 0);
  x.beginPath(); x.arc(cx + hr * .35, hy + hr * .45, 7, .1, Math.PI * .9); sh(x, null, 3.5);
}
export function mirror(c) { const m = cv(c.width, c.height), x = m.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); m.wm = c.wm; m.hm = c.hm; m.pad = c.pad; return m; }

// ======================= ĐỒ BẾP =======================
export function stoveDraw(x, W, H) {
  wrect(x, 0, H * .3, W, H * .7, 701, 2, 8); crescent(x, () => wrect(x, 0, H * .3, W, H * .7, 701, 2, 8), '#6b6f7a', -14, 0, '#8d93a0'); wrect(x, 0, H * .3, W, H * .7, 701, 2, 8); sh(x, null, LW);
  wrect(x, -6, H * .22, W + 12, H * .12, 702, 1.5, 6); sh(x, '#c9cdd6', LW2 + 2);
  for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(W * (.2 + i * .3), H * .62, H * .1, 0, TAU); sh(x, '#3b3a4a', LW2); x.beginPath(); x.rect(W * (.12 + i * .3), H * .8, W * .16, H * .08); sh(x, '#f4c86a', 3); }
}
export function potDraw(x, W, H) {
  const p = () => { x.beginPath(); x.moveTo(W * .08, H * .2); x.lineTo(W * .92, H * .2); x.lineTo(W * .88, H * .96); x.quadraticCurveTo(W * .5, H * 1.02, W * .12, H * .96); x.closePath(); };
  crescent(x, p, '#8a8f9a', -12, 0, '#b8bec9'); p(); sh(x, null, LW);
  x.beginPath(); x.ellipse(W * .5, H * .2, W * .44, H * .08, 0, 0, TAU); sh(x, '#d9a35a', LW2 + 2);
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(W * (.5 + s * .5), H * .36, W * .07, H * .05, 0, 0, TAU); sh(x, null, LW2 + 2); }
}
export function steamDraw(x, W, H, k) {
  x.beginPath(); for (let i = 0; i <= 20; i++) { const v = i / 20, px = W / 2 + Math.sin(v * 6 + k) * W * .25 * (1 - v * .3), py = H * (1 - v); i ? x.lineTo(px, py) : x.moveTo(px, py); }
  sh(x, null, W * .32, 'rgba(255,255,255,.95)'); x.lineWidth = 3; x.strokeStyle = 'rgba(160,150,140,.6)'; x.stroke();
}
export function wokDraw(x, W, H) {
  x.beginPath(); x.moveTo(0, H * .25); x.quadraticCurveTo(W * .5, H * 1.1, W, H * .25); x.closePath(); crescent(x, () => { x.beginPath(); x.moveTo(0, H * .25); x.quadraticCurveTo(W * .5, H * 1.1, W, H * .25); x.closePath(); }, '#2a2a33', -10, 0, '#3e3f4a');
  x.beginPath(); x.moveTo(0, H * .25); x.quadraticCurveTo(W * .5, H * 1.1, W, H * .25); x.closePath(); sh(x, null, LW);
  x.beginPath(); x.ellipse(W * .5, H * .25, W * .5, H * .1, 0, 0, TAU); sh(x, '#c9864a', LW2 + 1);
  for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(W * (.25 + i * .1), H * .24, 14, 7, i, 0, TAU); sh(x, ['#7aa84e', '#e5a23a', '#d9473a'][i % 3], 2); }
}
export function flameDraw(x, W, H, v) {
  const f = (s, col) => { x.beginPath(); x.moveTo(W * .5 - W * .45 * s, H); x.bezierCurveTo(W * .1 * s + W * (.5 - .5 * s), H * .5, W * (.45 + v * .1), H * (.35 + .1 * s), W * (.5 + (v - .5) * .3), H * (1 - s)); x.bezierCurveTo(W * (.6 + v * .05), H * .45, W * (.95 - .1 * (1 - s)), H * .7, W * .5 + W * .45 * s, H); x.closePath(); sh(x, col, s > .9 ? LW : 0); };
  f(1, '#f0603a'); f(.7, '#f6a33a'); f(.4, '#ffe17a');
}
export function tableDraw(x, W, H, withBowl = true, cloth = '#f4e3c1') {
  x.beginPath(); x.rect(W * .12, H * .45, W * .08, H * .55); sh(x, '#8a5530', LW2 + 1); x.beginPath(); x.rect(W * .8, H * .45, W * .08, H * .55); sh(x, '#8a5530', LW2 + 1);
  wrect(x, 0, H * .32, W, H * .16, 801, 1.5, 6); sh(x, cloth, LW2 + 2);
  if (withBowl) { bowl(x, W * .5, H * .2, W * .4); x.beginPath(); x.moveTo(W * .75, H * .05); x.lineTo(W * .92, H * .3); x.moveTo(W * .8, H * .03); x.lineTo(W * .95, H * .28); sh(x, null, 4, '#8a5530'); }
}
export function chairDraw(x, W, H) {
  x.beginPath(); x.rect(W * .1, 0, W * .1, H); sh(x, '#8a5530', LW2); x.beginPath(); x.rect(W * .1, H * .5, W * .8, H * .1); sh(x, '#b06d3a', LW2); x.beginPath(); x.rect(W * .8, H * .5, W * .1, H * .5); sh(x, '#8a5530', LW2);
  for (let i = 0; i < 3; i++) { x.beginPath(); x.rect(W * .1, H * (.08 + i * .13), W * .3, H * .05); sh(x, '#b06d3a', 3); }
}
export function shelfDraw(x, W, H) {
  wrect(x, 0, 0, W, H, 901, 2, 6); sh(x, '#9a5b2e', LW);
  for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(0, H * i / 3); x.lineTo(W, H * i / 3); sh(x, null, LW2 + 2); }
  const R = mulberry(902);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const px = W * (.08 + i * .23), py = H * (r + 1) / 3 - 6, h = H * (.12 + R() * .12); blob(x, px + W * .08, py - h / 2, W * .08, h / 2, .05, 903 + r * 4 + i, 16); sh(x, ['#f4e3c1', '#3d6f8e', '#c8553d', '#6b8e4e', '#e3b04a'][(r + i) % 5], LW2); }
}
export function herbDraw(x, W, H) { x.beginPath(); x.moveTo(W * .2, H * .6); x.lineTo(W * .8, H * .6); x.lineTo(W * .72, H); x.lineTo(W * .28, H); x.closePath(); sh(x, '#c8653a', LW2 + 1);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32; x.beginPath(); x.ellipse(W / 2 + Math.cos(a) * W * .25, H * .45 + Math.sin(a) * H * .25, W * .1, H * .17, a + Math.PI / 2, 0, TAU); sh(x, i % 2 ? '#5f9a4a' : '#7cb85a', LW2); } }
export function hangLampDraw(x, W, H) { x.beginPath(); x.moveTo(W * .1, H); x.quadraticCurveTo(W * .5, -H * .2, W * .9, H); x.closePath(); sh(x, '#e3b04a', LW); x.beginPath(); x.arc(W * .5, H, W * .14, 0, Math.PI); sh(x, '#fff1c4', LW2); }
// --- phố ---
export function houseDraw(x, W, H, col, seed, night) {
  const R = mulberry(seed);
  wrect(x, 0, H * .18, W, H * .82, seed, 2, 6); sh(x, col, LW);
  x.beginPath(); x.moveTo(-4, H * .2); x.lineTo(W * .5, 0); x.lineTo(W + 4, H * .2); x.closePath(); sh(x, night ? '#5a2f3e' : '#7a5a8c', LW);
  const rows = 3, cols = 3;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const px = W * (.1 + c * .3), py = H * (.28 + r * .2); wrect(x, px, py, W * .2, H * .13, seed * 7 + r * 3 + c, 1.2, 4); sh(x, night ? (R() < .6 ? '#ffd27a' : '#3a2a50') : '#e9eefa', LW2); }
  wrect(x, W * .38, H * .8, W * .24, H * .2, seed + 99, 1.2, 4); sh(x, night ? '#4a2a3a' : '#5a4a7a', LW2);
}
export function treeDraw(x, W, H, col = '#6aa38a') { x.beginPath(); x.rect(W * .44, H * .55, W * .12, H * .45); sh(x, '#7a5236', LW2 + 1); blob(x, W / 2, H * .35, W * .45, H * .33, .12, 31, 20); crescent(x, () => blob(x, W / 2, H * .35, W * .45, H * .33, .12, 31, 20), 'rgba(0,0,0,.18)', -14, 0, col); blob(x, W / 2, H * .35, W * .45, H * .33, .12, 31, 20); sh(x, null, LW); }
export function lampPostDraw(x, W, H, lit) { x.beginPath(); x.rect(W * .42, H * .15, W * .16, H * .85); sh(x, '#3b3a4a', LW2); x.beginPath(); x.moveTo(W * .15, H * .16); x.lineTo(W * .85, H * .16); x.lineTo(W * .7, 0); x.lineTo(W * .3, 0); x.closePath(); sh(x, lit ? '#ffe39a' : '#c9cdd6', LW2); }
export function otherShopDraw(x, W, H, col, label) {
  wrect(x, 0, H * .12, W, H * .88, label.length * 13, 2, 6); sh(x, col, LW);
  wrect(x, W * .08, H * .2, W * .84, H * .18, label.length * 7, 1.5, 6); sh(x, '#fffaf0', LW2);
  text(x, label, W / 2, H * .335, `800 ${Math.round(H * .12)}px "Baloo 2"`, INK);
  wrect(x, W * .1, H * .5, W * .45, H * .3, 77, 1.5, 4); sh(x, '#ffe39a', LW2); wrect(x, W * .62, H * .5, W * .28, H * .5, 78, 1.5, 4); sh(x, '#6b4a2e', LW2);
}
export function tabDraw(x, W, H, label) { wrect(x, 0, 0, W, H, 990 + label.length, 1.5, 12); sh(x, '#fffaf0', LW2 + 1); x.beginPath(); x.arc(W * .1, H * .5, H * .16, 0, TAU); sh(x, '#7667fe', 0);
  text(x, label, W * .55, H * .64, `800 ${Math.round(H * .42)}px "Baloo 2"`, INK); }
export function swatchDraw(x, W, H, col, name) { wrect(x, 0, 0, W, H, 970 + col.length, 1.2, 6); sh(x, '#fffaf0', LW2); x.beginPath(); x.rect(W * .1, W * .1, W * .8, H * .62); sh(x, col, 3); text(x, name, W / 2, H * .9, `700 ${Math.round(W * .2)}px "Nunito"`, INK); }
export function phoneCardDraw(x, W, H) { x.beginPath(); x.roundRect(0, 0, W, H, W * .14); sh(x, '#2a2a33', LW); const s = cv(W * .86, H * .84); siteDraw(s.getContext('2d'), s.width, s.height, .6); x.drawImage(s, W * .07, H * .08); x.beginPath(); x.roundRect(W * .07, H * .08, W * .86, H * .84, 10); sh(x, null, 3); }
export function resultDraw(x, W, H) {
  wrect(x, 0, 0, W, H, 1201, 1.5, 18); sh(x, '#ffffff', LW);
  pinIcon(x, W * .1, H * .62, H * .14, '#e5413a');
  text(x, 'Quán Mây', W * .2, H * .32, `800 ${Math.round(H * .2)}px "Baloo 2"`, INK, { align: 'left' });
  text(x, 'Vietnamesisch · Leipzig · geöffnet', W * .2, H * .5, `600 ${Math.round(H * .11)}px "Nunito"`, '#5a6a72', { align: 'left' });
  const b = (px, label, bg, fg) => { x.beginPath(); x.roundRect(px, H * .64, W * .24, H * .22, H * .11); x.fillStyle = bg; x.fill(); text(x, label, px + W * .12, H * .79, `800 ${Math.round(H * .11)}px "Nunito"`, fg); };
  b(W * .2, 'Route', '#1a73e8', '#fff'); b(W * .46, 'Anrufen', '#e8f0fe', '#1a5fc8'); b(W * .72, 'Reservieren', '#d9473a', '#fff');
}
