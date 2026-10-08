import fs from 'fs';
import path from 'path';
import {readProject} from './project.mjs';
import {duration} from './ffmpeg.mjs';
import {isHf} from './hf.mjs';
import {isLib, resolveLib} from './library.mjs';
import {proxyPath} from './footage.mjs';

/** returns {ok:[], warn:[], fail:[]} in Vietnamese */
export const validateProject = (dir) => {
  const ok = [], warn = [], fail = [];
  let p;
  try { p = readProject(dir); } catch (e) { return {ok, warn, fail: ['Không đọc được project.json: ' + e.message]}; }
  const S = p.scenes || [];
  // media path → file on disk ('lib:…' = shared SAMI_Library)
  const has = (rel) => (isLib(rel) ? !!resolveLib(rel) && fs.existsSync(resolveLib(rel)) : fs.existsSync(path.join(dir, 'public', rel || '')));
  if (p.status && !['draft', 'review', 'approved', 'published'].includes(p.status)) warn.push(`Trạng thái "${p.status}" không hợp lệ (draft / review / approved / published) — coi như Nháp.`);
  if (!S.length) fail.push('Dự án chưa có cảnh nào.');
  S.forEach((s, i) => {
    if (i === 0 && s.start !== 0) fail.push(`Cảnh đầu (${s.id}) phải bắt đầu ở 0.`);
    if (i > 0 && s.start !== S[i - 1].end) fail.push(`Hở/chồng giữa ${S[i - 1].id} và ${s.id}.`);
    if (s.end <= s.start) fail.push(`${s.id} có thời lượng ≤ 0.`);
    if (i > 0 && p.type !== 'carousel' && (s.start - 1) % 15 !== 0) warn.push(`Điểm cắt vào ${s.id} (${(s.start / 30).toFixed(2)}s) lệch nhịp nhạc — nên là 15n+1 khung (bấm "Khớp nhịp").`);
    if (s.engine === 'blank') return; // footage-only span (0.9)
    if (isHf(s)) {
      const f = path.join(dir, s.src || `hf/${s.id}.html`);
      if (!fs.existsSync(f)) { fail.push(`Thiếu file cảnh HTML ${s.src || `hf/${s.id}.html`}`); return; }
      const t = fs.readFileSync(f, 'utf8');
      if (!/data-composition-id\s*=/.test(t)) fail.push(`${s.src}: thiếu phần tử gốc có data-composition-id (Hyperframes).`);
      if (/Math\.random\(|Date\.now\(|new Date\(|requestAnimationFrame\(|setInterval\(/.test(t)) fail.push(`${s.src} dùng Math.random/Date/requestAnimationFrame/setInterval → không tua được, video không ổn định (dùng SAMI.rnd() và timeline GSAP).`);
      if (!/__timelines|\.timeline\(|\.loop\(/.test(t)) warn.push(`${s.src}: chưa đăng ký timeline (SAMI.timeline() hoặc window.__timelines) — cảnh sẽ đứng yên.`);
      if (/cdn\.jsdelivr|unpkg\.com|cdnjs|fonts\.googleapis/.test(t)) warn.push(`${s.src} tải thư viện/font từ Internet — dùng _gsap/gsap.min.js và _fonts/<family>/<weight>.css để render offline ổn định.`);
      if (s.warp?.length) warn.push(`${s.id}: cảnh HTML chưa hỗ trợ kéo giãn (warp) — đổi thời lượng trong timeline của cảnh.`);
      for (const m of t.matchAll(/(?:src|href)\s*=\s*["']((?:public|hf)\/[^"'?#]+)["']/g)) if (!fs.existsSync(path.join(dir, m[1]))) fail.push(`${s.src}: thiếu ${m[1]}`);
      return;
    }
    if (!fs.existsSync(path.join(dir, 'scenes', s.id + '.tsx'))) fail.push(`Thiếu file scenes/${s.id}.tsx`);
  });
  const reg = fs.existsSync(path.join(dir, 'scenes', 'index.ts')) ? fs.readFileSync(path.join(dir, 'scenes', 'index.ts'), 'utf8') : '';
  S.forEach((s) => { if (!isHf(s) && s.engine !== 'blank' && !reg.includes(s.id)) fail.push(`${s.id} chưa đăng ký trong scenes/index.ts`); });
  // footage (0.9): files exist, ranges sane, inside the film, proxy ready
  const T = S.length ? S[S.length - 1].end / 30 : 0;
  for (const c of p.tracks?.video || []) {
    const tag = `Footage ${c.id} (${c.label || c.src})`;
    if (!c.src || !fs.existsSync(path.join(dir, c.src))) { fail.push(`${tag}: thiếu file ${c.src}`); continue; }
    if (!/^(media|public)\//.test(c.src)) warn.push(`${tag}: nên nằm trong media/ (file trong public/ bị chép vào mỗi lần đóng gói).`);
    if (!(c.out > c.in) || c.in < 0) fail.push(`${tag}: đoạn cắt vào/ra không hợp lệ (${c.in} → ${c.out} s).`);
    if (!(c.speed > 0)) fail.push(`${tag}: tốc độ phải > 0.`);
    const end = (+c.at || 0) + ((c.out - c.in) / (c.speed || 1));
    if (end > T + 0.05) warn.push(`${tag}: kết thúc ở ${end.toFixed(1)} s, sau cuối phim (${T.toFixed(1)} s): phần thừa bị cắt.`);
    if (!fs.existsSync(proxyPath(dir, c.src))) warn.push(`${tag}: chưa có bản xem trước 540p (tab Footage → Chuẩn bị).`);
  }
  if (p.type === 'carousel') {
    if (!(p.formats || []).includes('4:5')) fail.push('Carousel phải có tỉ lệ 4:5 (1080×1350) trong formats.');
    S.forEach((s) => {
      if (!isHf(s)) fail.push(`Slide ${s.id} phải là cảnh HTML (engine "hyperframes", src "slides/${s.id}.html").`);
      const len = s.end - s.start;
      if (len % 60) warn.push(`Slide ${s.id} dài ${(len / 30).toFixed(2)}s — nên là số ô nhịp chẵn (4 / 6 / 8 s = 120 / 180 / 240 khung) để nhạc nối vòng liền.`);
      if (len > 60 * 30) fail.push(`Slide ${s.id} dài quá 60 s (giới hạn video trong carousel Instagram).`);
      (s.cues || []).forEach((c) => { if (c.t < 0 || c.t > len / 30) warn.push(`Slide ${s.id}: SFX ở ${c.t}s nằm ngoài slide.`); if (c.src && !has(c.src)) fail.push(`Slide ${s.id}: không thấy SFX ${c.src}`); if (c.t > len / 30 - 0.8 && c.t <= len / 30) warn.push(`Slide ${s.id}: SFX ở ${c.t}s quá sát cuối — tiếng dội sẽ vòng về đầu slide.`); });
    });
    if (S.length > 20) fail.push(`Carousel có ${S.length} slide — Instagram cho tối đa 20.`);
    const m = p.carousel?.audio?.music; if (p.carousel?.audio?.mode === 'music' && (!m?.src || !has(m.src))) fail.push('Carousel chọn nhạc nhưng không thấy file ' + (m?.src || '(chưa chọn)'));
  }
  const total = S.length ? S[S.length - 1].end : 0;
  if (S.length && !fail.length) ok.push(`Timeline: ${S.length} cảnh, ${(total / 30).toFixed(2)}s, liền mạch.`);
  // assets referenced in scenes
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : [];
  const miss = new Set();
  for (const f of walk(path.join(dir, 'scenes')).filter((f) => /\.tsx?$/.test(f))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/staticFile\(\s*[`'"]([^`'"$]+)[`'"]\s*\)/g)) if (!m[1].startsWith('_engine') && !fs.existsSync(path.join(dir, 'public', m[1]))) miss.add(m[1]);
    for (const m of t.matchAll(/(?:src|img)\s*[:=]\s*['"]([\w\-./]+\.(?:jpe?g|png|webp|avif|svg|mp4|webm))['"]/g)) { const q = m[1].includes('/') ? m[1] : 'img/' + m[1]; if (!fs.existsSync(path.join(dir, 'public', q))) miss.add(q); }
    if (/<Audio\b/.test(t) || (/<(Offthread)?Video\b/.test(t) && !/muted/.test(t))) warn.push(`${path.basename(f)} có âm thanh riêng trong code cảnh — khi xuất, âm thanh chỉ lấy từ tab Âm thanh (project.json → audio). Thêm "muted" hoặc chuyển âm thanh sang tab Âm thanh.`);
    if (/Math\.random\(|Date\.now\(/.test(t)) fail.push(`${path.basename(f)} dùng Math.random/Date → video không ổn định (dùng rnd()).`);
  }
  miss.forEach((m) => fail.push(`Thiếu tài nguyên: public/${m}`));
  if (!miss.size) ok.push('Tài nguyên: đủ.');
  // copy markup
  for (const [k, v] of Object.entries(p.copy || {})) if (typeof v.value === 'string' && (v.value.match(/\*/g) || []).length % 2) fail.push(`Chữ "${v.label || k}" thiếu dấu * đóng tô màu.`);
  // audio
  const a = p.audio;
  if (a?.mode === 'premix' && a.premix) {
    const f = isLib(a.premix) ? resolveLib(a.premix) || '' : path.join(dir, 'public', a.premix);
    if (!fs.existsSync(f)) fail.push(`Không thấy file âm thanh ${a.premix}`);
    else { const d = duration(f); const diff = Math.abs(d - total / 30); (diff > 0.1 ? warn : ok).push(diff > 0.1 ? `Âm thanh mix dài ${d.toFixed(2)}s ≠ video ${(total / 30).toFixed(2)}s — chuyển sang chế độ "Ghép lớp (live)" hoặc mix lại.` : `Âm thanh khớp độ dài video (${d.toFixed(2)}s).`); }
  }
  if (a?.mode === 'layers' && a.music?.src && !has(a.music.src)) fail.push(`Không thấy nhạc ${a.music.src}`);
  (a?.cues || []).forEach((c) => { if (c.t > total / 30) warn.push(`SFX "${c.label || c.sfx}" ở ${c.t}s nằm sau khi video kết thúc.`); if (c.src && !has(c.src)) fail.push(`Không thấy SFX ${c.src}`); });
  (a?.voice || []).forEach((v) => { if (!v.src || !has(v.src)) fail.push(`Không thấy file thoại ${v.src}`); if (v.t + (v.len || 0) > total / 30 + 0.1) warn.push(`Thoại "${v.label || v.src}" kéo dài quá cuối video.`); });
  // images chosen in the Chữ tab + overlays
  for (const [k, v] of Object.entries(p.copy || {})) if (/(_image|_logo|_img|_photo)$/i.test(k) && v.value && !has(v.value)) fail.push(`Ô ảnh "${v.label || k}": không thấy public/${v.value}`);
  (p.overlays || []).forEach((o) => {
    const nm = o.label || o.src || o.sticker || o.id;
    if (o.kind !== 'sticker' && (!o.src || !has(o.src))) fail.push(`Ảnh chèn "${nm}": chưa chọn file hoặc không thấy public/${o.src || '?'}`);
    if (!o.whole && o.end <= o.start) fail.push(`Ảnh chèn "${nm}": thời gian kết thúc ≤ bắt đầu.`);
    if (!o.whole && o.start > total / 30) warn.push(`Ảnh chèn "${nm}" bắt đầu sau khi video kết thúc.`);
  });
  // titles
  (p.titles || []).forEach((t) => { if (t.end <= t.start) fail.push(`Tiêu đề "${t.text.slice(0, 20)}" có thời gian kết thúc ≤ bắt đầu.`); if (t.end > total / 30 + 0.1) warn.push(`Tiêu đề "${t.text.slice(0, 20)}" kéo dài quá cuối video.`); });
  return {ok, warn, fail};
};
