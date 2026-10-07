// Cài skill của Studio (nguồn duy nhất: claude-code/skills/) vào ~/.claude/skills — một bản chung cho mọi dự án.
//   node tools/install-skills.mjs          → chạy thử (so sánh)
//   node tools/install-skills.mjs --apply  → cài; bản cũ được sao lưu vào .studio/skill-backups/<tên>-<thời điểm>/
// Không để bản sao lưu trong ~/.claude/skills (Claude Code sẽ nạp nó thành skill thứ hai).
import fs from 'fs';
import os from 'os';
import path from 'path';
import {ROOT, DATA} from '../server/paths.mjs';

const APPLY = process.argv.includes('--apply');
const SRC = path.join(ROOT, 'claude-code', 'skills');
const DST = path.join(os.homedir(), '.claude', 'skills');
const files = (d) => { const o = []; const w = (q, r = '') => { if (!fs.existsSync(q)) return; for (const e of fs.readdirSync(q, {withFileTypes: true})) { const p = path.join(q, e.name), rr = r ? r + '/' + e.name : e.name; e.isDirectory() ? w(p, rr) : o.push(rr); } }; w(d); return o; };
const same = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));

for (const name of fs.readdirSync(SRC)) {
  const s = path.join(SRC, name), d = path.join(DST, name);
  if (!fs.existsSync(path.join(s, 'SKILL.md'))) continue;
  const fs1 = files(s), fs2 = files(d);
  const changed = fs1.filter((f) => !same(path.join(s, f), path.join(d, f)));
  const extra = fs2.filter((f) => !fs1.includes(f));
  console.log(`${name}: ${changed.length} file mới/đổi${extra.length ? `, ${extra.length} file cũ sẽ bỏ (${extra.join(', ')})` : ''}`);
  if (!APPLY || (!changed.length && !extra.length)) continue;
  if (fs.existsSync(d)) {
    const bak = path.join(DATA, 'skill-backups', `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    fs.mkdirSync(path.dirname(bak), {recursive: true}); fs.cpSync(d, bak, {recursive: true});
    console.log(`  sao lưu → ${bak}`);
    fs.rmSync(d, {recursive: true, force: true});
  }
  fs.cpSync(s, d, {recursive: true});
  console.log(`  đã cài → ${d}`);
}
if (!APPLY) console.log('\nChạy thử — thêm --apply để cài.');
