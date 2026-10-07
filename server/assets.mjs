import fs from 'fs';
import path from 'path';
const TYPES = {
  img: /\.(jpe?g|png|webp|avif|gif|svg)$/i, video: /\.(mp4|mov|webm|mkv|m4v)$/i, audio: /\.(mp3|wav|m4a|aac|ogg|flac)$/i,
  docs: /\.(pdf|docx?|pptx?|xlsx?|txt|md|srt|vtt|csv|json)$/i, fonts: /\.(ttf|otf|woff2?)$/i,
};
const isLottie = (f) => { if (!/\.json$/i.test(f)) return false; try { const h = fs.readFileSync(f, 'utf8').slice(0, 4000); return /"layers"\s*:/.test(h) && /"fr"\s*:/.test(h) || /"v"\s*:\s*"\d/.test(h) && /"ip"\s*:/.test(h); } catch { return false; } };
export const typeOf = (f) => (isLottie(f) ? 'lottie' : Object.entries(TYPES).find(([, r]) => r.test(f))?.[0] || 'other');
/** copy a folder of raw client material into a project: images/video/audio → public/*, docs → brief/ */
export const importAssets = (srcDir, projDir) => {
  const report = {img: 0, video: 0, audio: 0, docs: 0, fonts: 0, other: 0, files: []};
  const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(srcDir)) {
    const t = typeOf(f);
    const sub = t === 'docs' ? 'brief' : t === 'other' ? 'brief/other' : `public/${t}`; // lottie → public/lottie
    const dst = path.join(projDir, sub, path.basename(f).replace(/[^\p{L}\p{N}._-]+/gu, '_'));
    fs.mkdirSync(path.dirname(dst), {recursive: true});
    fs.copyFileSync(f, dst);
    report[t]++; report.files.push(path.relative(projDir, dst).replace(/\\/g, '/'));
  }
  return report;
};
export const listAssets = (projDir) => {
  const pub = path.join(projDir, 'public');
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? (e.name === '_engine' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)])) : [];
  return walk(pub).filter((f) => !f.endsWith('.meta.json')).map((f) => ({path: path.relative(pub, f).replace(/\\/g, '/'), type: typeOf(f), size: fs.statSync(f).size}));
};
