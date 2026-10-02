// Version history (điểm neo) from the command line / Claude Code hook.
//   node <app>/server/cli-snapshot.mjs <projectDir> snapshot [--label "…"] [--kind manual|ai|…] [--star]
//   node <app>/server/cli-snapshot.mjs <projectDir> list
//   node <app>/server/cli-snapshot.mjs <projectDir> restore <id> [path …]     (paths: files or folders, e.g. scenes/S03.tsx public/audio)
//   node <app>/server/cli-snapshot.mjs <projectDir> star <id> [--label "…"]
//   node <app>/server/cli-snapshot.mjs <projectDir> prune
//   node <app>/server/cli-snapshot.mjs --hook     (Claude Code UserPromptSubmit hook: reads the hook JSON on stdin,
//                                                  snapshots BEFORE the AI edits; silent, always exit 0)
import fs from 'fs';
import path from 'path';
import {snapshot, list, restore, star, prune, usage} from './history.mjs';

const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf('--' + n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, v && !v.startsWith('--') ? 2 : 1); return v && !v.startsWith('--') ? v : true; };
const findProject = (d) => { d = path.resolve(d); for (;;) { if (fs.existsSync(path.join(d, 'project.json'))) return d; const up = path.dirname(d); if (up === d) return null; d = up; } };
const fmtB = (b) => b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : (b / 1e3).toFixed(0) + ' KB';

if (argv.includes('--hook')) {
  // never block the chat: swallow every error, print nothing on stdout (stdout of UserPromptSubmit goes into the AI context)
  let input = {};
  try { if (!process.stdin.isTTY) input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}
  try {
    const dir = findProject(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
    if (dir) {
      const prompt = String(input.prompt || '').replace(/\s+/g, ' ').trim();
      await snapshot(dir, {kind: 'ai', label: prompt ? 'Trước lượt chat: “' + prompt.slice(0, 80) + (prompt.length > 80 ? '…' : '') + '”' : 'Trước lượt chat AI', source: 'Claude Code · ' + (process.env.USERNAME || process.env.USER || '')});
    }
  } catch (e) { try { process.stderr.write('snapshot: ' + e.message + '\n'); } catch {} }
  process.exit(0);
}

const label = flag('label'), kind = flag('kind'), starred = flag('star');
const [dir0, cmd = 'list', ...rest] = argv;
const dir = findProject(dir0 || '.');
if (!dir) { console.error('Không tìm thấy project.json'); process.exit(1); }
try {
  if (cmd === 'snapshot') {
    const r = await snapshot(dir, {kind: kind || 'manual', label: label === true ? '' : label, starred: !!starred, force: (kind || 'manual') === 'manual'});
    console.log(r.skipped ? `= Không có gì thay đổi so với điểm neo ${r.id}` : `✓ Điểm neo ${r.id} · ${r.files} tệp · mới lưu ${r.newObjects} tệp (${fmtB(r.newBytes)}) · ${r.ms} ms`);
  } else if (cmd === 'list') {
    const L = await list(dir);
    for (const s of L) console.log(`${s.starred ? '★' : ' '} ${s.id.padEnd(30)} ${s.kind.padEnd(14)} ${new Date(s.time).toLocaleString('vi-VN')}  ${s.label || ''}${s.label ? ' — ' : ''}${s.diff.summary}`);
    console.log(`${L.length} điểm neo · kho lịch sử ${fmtB(await usage(dir))}`);
  } else if (cmd === 'restore') {
    const [id, ...paths] = rest; if (!id) throw new Error('Thiếu <id>');
    const r = await restore(dir, id, {paths: paths.length ? paths.map((p) => p.replace(/\\/g, '/')) : null});
    console.log(`✓ Đã khôi phục ${r.restored} (${r.written} tệp ghi lại, ${r.deleted} tệp xoá). Trạng thái trước đó đã lưu thành điểm neo ${r.before}`);
  } else if (cmd === 'star') {
    const [id] = rest; await star(dir, id, {starred: true, ...(label && label !== true ? {label} : {})}); console.log('★ ' + id);
  } else if (cmd === 'prune') {
    const r = await prune(dir); console.log(`Đã dọn ${r.removed} điểm neo tự động cũ, giải phóng ${fmtB(r.freed)}`);
  } else throw new Error('Lệnh không hợp lệ: ' + cmd);
} catch (e) { console.error('✗ ' + e.message); process.exit(1); }
