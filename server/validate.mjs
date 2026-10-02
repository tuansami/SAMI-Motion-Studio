import fs from 'fs';
import path from 'path';
import {readProject} from './project.mjs';
import {duration} from './ffmpeg.mjs';

/** returns {ok:[], warn:[], fail:[]} in Vietnamese */
export const validateProject = (dir) => {
  const ok = [], warn = [], fail = [];
  let p;
  try { p = readProject(dir); } catch (e) { return {ok, warn, fail: ['Không đọc được project.json: ' + e.message]}; }
  const S = p.scenes || [];
  if (p.status && !['draft', 'review', 'approved', 'published'].includes(p.status)) warn.push(`Trạng thái "${p.status}" không hợp lệ (draft / review / approved / published) — coi như Nháp.`);
  if (!S.length) fail.push('Dự án chưa có cảnh nào.');
  S.forEach((s, i) => {
    if (i === 0 && s.start !== 0) fail.push(`Cảnh đầu (${s.id}) phải bắt đầu ở 0.`);
    if (i > 0 && s.start !== S[i - 1].end) fail.push(`Hở/chồng giữa ${S[i - 1].id} và ${s.id}.`);
    if (s.end <= s.start) fail.push(`${s.id} có thời lượng ≤ 0.`);
    if (i > 0 && (s.start - 1) % 15 !== 0) warn.push(`Điểm cắt vào ${s.id} (${(s.start / 30).toFixed(2)}s) lệch nhịp nhạc — nên là 15n+1 khung (bấm "Khớp nhịp").`);
    if (!fs.existsSync(path.join(dir, 'scenes', s.id + '.tsx'))) fail.push(`Thiếu file scenes/${s.id}.tsx`);
  });
  const reg = fs.existsSync(path.join(dir, 'scenes', 'index.ts')) ? fs.readFileSync(path.join(dir, 'scenes', 'index.ts'), 'utf8') : '';
  S.forEach((s) => { if (!reg.includes(s.id)) fail.push(`${s.id} chưa đăng ký trong scenes/index.ts`); });
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
    const f = path.join(dir, 'public', a.premix);
    if (!fs.existsSync(f)) fail.push(`Không thấy file âm thanh ${a.premix}`);
    else { const d = duration(f); const diff = Math.abs(d - total / 30); (diff > 0.1 ? warn : ok).push(diff > 0.1 ? `Âm thanh mix dài ${d.toFixed(2)}s ≠ video ${(total / 30).toFixed(2)}s — chuyển sang chế độ "Ghép lớp (live)" hoặc mix lại.` : `Âm thanh khớp độ dài video (${d.toFixed(2)}s).`); }
  }
  if (a?.mode === 'layers' && a.music?.src && !fs.existsSync(path.join(dir, 'public', a.music.src))) fail.push(`Không thấy nhạc ${a.music.src}`);
  (a?.cues || []).forEach((c) => { if (c.t > total / 30) warn.push(`SFX "${c.label || c.sfx}" ở ${c.t}s nằm sau khi video kết thúc.`); if (c.src && !fs.existsSync(path.join(dir, 'public', c.src))) fail.push(`Không thấy SFX ${c.src}`); });
  (a?.voice || []).forEach((v) => { if (!v.src || !fs.existsSync(path.join(dir, 'public', v.src || ''))) fail.push(`Không thấy file thoại ${v.src}`); if (v.t + (v.len || 0) > total / 30 + 0.1) warn.push(`Thoại "${v.label || v.src}" kéo dài quá cuối video.`); });
  // images chosen in the Chữ tab + overlays
  for (const [k, v] of Object.entries(p.copy || {})) if (/(_image|_logo|_img|_photo)$/i.test(k) && v.value && !fs.existsSync(path.join(dir, 'public', v.value))) fail.push(`Ô ảnh "${v.label || k}": không thấy public/${v.value}`);
  (p.overlays || []).forEach((o) => {
    const nm = o.label || o.src || o.sticker || o.id;
    if (o.kind !== 'sticker' && (!o.src || !fs.existsSync(path.join(dir, 'public', o.src)))) fail.push(`Ảnh chèn "${nm}": chưa chọn file hoặc không thấy public/${o.src || '?'}`);
    if (!o.whole && o.end <= o.start) fail.push(`Ảnh chèn "${nm}": thời gian kết thúc ≤ bắt đầu.`);
    if (!o.whole && o.start > total / 30) warn.push(`Ảnh chèn "${nm}" bắt đầu sau khi video kết thúc.`);
  });
  // titles
  (p.titles || []).forEach((t) => { if (t.end <= t.start) fail.push(`Tiêu đề "${t.text.slice(0, 20)}" có thời gian kết thúc ≤ bắt đầu.`); if (t.end > total / 30 + 0.1) warn.push(`Tiêu đề "${t.text.slice(0, 20)}" kéo dài quá cuối video.`); });
  return {ok, warn, fail};
};
