// node server/cli-template.mjs check  <templateDir>   → report against docs/TEMPLATE_STANDARD.md (exit 1 on ✗)
// node server/cli-template.mjs thumbs <templateDir>   → preview/thumb_<ratio>.jpg
// node server/cli-template.mjs save   <projectDir> "<Tên mẫu>" [category]  → copy a project into templates/
import path from 'path';
import {checkTemplate, makeThumbs, saveAsTemplate} from './template.mjs';
const [cmd, dir, a, b] = process.argv.slice(2);
if (cmd === 'check') {
  const r = checkTemplate(path.resolve(dir));
  for (const x of r.fail) console.log('✗ ' + x);
  for (const x of r.warn) console.log('⚠ ' + x);
  for (const x of r.ok) console.log('✓ ' + x);
  if (r.stats) console.log(`\n${r.stats.scenes} cảnh · ${r.stats.duration}s · ô chữ ${r.stats.slots.text} · ô ảnh ${r.stats.slots.image} · logo ${r.stats.slots.logo}`);
  process.exit(r.fail.length ? 1 : 0);
} else if (cmd === 'thumbs') {
  await makeThumbs(path.resolve(dir), (m) => console.log(m));
  process.exit(0);
} else if (cmd === 'save') {
  const r = saveAsTemplate(path.resolve(dir), {name: a, category: b});
  console.log('saved', r.dir);
} else {
  console.log('usage: check|thumbs <templateDir>  ·  save <projectDir> "<name>" [category]');
}
