// "Tạo bằng Claude Code": the Studio starts a headless Claude Code run (claude -p) that drives Tuấn's real Chrome with
// the browser-harness MCP, follows providers/recipes/<recipe>.md, downloads the results and ingests them with meta.
// Tuấn pressing "Tạo" in the Studio is the approval to submit that exact prompt ONCE. The agent may only use the
// browser-harness tools and two read/ingest CLI commands; it stops on login pages, CAPTCHAs and limits.
import fs from 'fs';
import os from 'os';
import path from 'path';
import {spawn} from 'child_process';
import {ROOT, cacheDir} from '../server/paths.mjs';
import {get} from './gateway.mjs';

const CLI = path.join(ROOT, 'providers', 'cli.mjs').replace(/\\/g, '/');
const KIND_VI = {img: 'ảnh', video: 'video', music: 'bài nhạc', sfx: 'hiệu ứng âm thanh', voice: 'giọng đọc'};

export const claudeBin = () => {
  const cands = [process.env.CLAUDE_BIN, path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe'), path.join(os.homedir(), '.local', 'bin', 'claude.exe'), path.join(os.homedir(), '.claude', 'local', 'claude.exe')].filter(Boolean);
  return cands.find((f) => fs.existsSync(f)) || null;
};
/** browser-harness entry from ~/.claude.json, so the run loads ONLY that MCP server (fast start, nothing else reachable) */
const harnessConfig = () => {
  try { const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')); const s = j.mcpServers?.['browser-harness']; return s ? {mcpServers: {'browser-harness': s}} : null; } catch { return null; }
};
export const agentReady = () => { const bin = claudeBin(); if (!bin) return {ok: false, reason: 'Không thấy Claude Code (claude.exe) trên máy'}; if (!harnessConfig()) return {ok: false, reason: 'Chưa đăng ký MCP browser-harness trong Claude Code'}; return {ok: true, bin}; };

const instructions = ({a, req, destDir, since, promptFile, recipe}) => `Bạn là trợ lý sản xuất của SAMI Motion Studio, chạy ngầm vì Tuấn vừa bấm "Tạo bằng Claude Code" trong Studio.
Lần bấm đó là Tuấn ĐÃ DUYỆT gửi đúng prompt bên dưới, ĐÚNG MỘT LẦN. Không cần hỏi lại, nhưng không được gửi thêm lần nào.

## Việc cần làm
Tạo ${req.n || 1} ${KIND_VI[req.kind] || req.kind} bằng ${a.label}${req.ratio ? `, tỉ lệ ${req.ratio}` : ''}${req.seconds ? `, dài khoảng ${req.seconds} s` : ''}.
Prompt của Tuấn (nguyên văn, nằm trong file ${promptFile}):
<<<
${req.prompt}
>>>

## Công cụ được phép
- Chỉ các tool mcp__browser-harness__* để điều khiển Chrome thật của Tuấn (mở TAB MỚI, không đụng tab Tuấn đang dùng, đóng tab khi xong).
- Xem file vừa tải về: node ${CLI} downloads --since ${since}
- Ghi file vào ${destDir ? 'dự án' : 'thư viện SAMI'} kèm meta (mỗi file một lệnh):
  node ${CLI} ingest "<đường dẫn file>" --provider ${a.id} --kind ${req.kind} --prompt-file "${promptFile}"${destDir ? ` --to "${destDir}"` : ''}

## Luật cứng
1. Trang đòi đăng nhập, CAPTCHA, "xác minh bạn là người", hết lượt / hết credit, hay lỗi chính sách: DỪNG NGAY, không thử cách khác, trả lời "DỪNG: <lý do ngắn>".
2. Không gõ mật khẩu, không đổi cài đặt tài khoản, không mua gói, không bấm gì ngoài các bước của kịch bản.
3. Chỉ gửi prompt một lần. Thiếu kết quả thì báo, không tự gửi lại.
4. Tải bằng nút Download của chính trang. Sau đó chạy lệnh downloads để lấy đường dẫn, rồi ingest từng file.
5. Câu trả lời cuối cùng đúng một dòng: "XONG: <số file> file" hoặc "DỪNG: <lý do>".

## Kịch bản
${recipe}
`;

/** start → {child, done: Promise<{ok, text, costUsd, turns}>}; onEvent({msg}) for progress */
export const startWebAgent = ({req, destDir = null, onEvent = () => {}, model = 'sonnet', timeoutMin = 20}) => {
  const a = get(req.provider); if (!a.web) throw new Error(a.label + ' không phải nguồn gói web');
  if (!String(req.prompt || '').trim()) throw new Error('Chưa có prompt');
  const ready = agentReady(); if (!ready.ok) throw new Error(ready.reason);
  const work = fs.mkdtempSync(path.join(cacheDir('agent'), 'run-'));
  const promptFile = path.join(work, 'prompt.txt').replace(/\\/g, '/'); fs.writeFileSync(promptFile, req.prompt, 'utf8');
  const recipeDir = path.join(ROOT, 'providers', 'recipes');
  const recipe = ['README.md', path.basename(a.recipe)].map((f) => fs.readFileSync(path.join(recipeDir, f), 'utf8')).join('\n\n---\n\n');
  const mcp = path.join(work, 'mcp.json'); fs.writeFileSync(mcp, JSON.stringify(harnessConfig()));
  const since = new Date(Date.now() - 5000).toISOString();
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--model', model, '--max-turns', '80', '--strict-mcp-config', '--mcp-config', mcp,
    '--allowedTools', 'mcp__browser-harness', `Bash(node ${CLI} downloads:*)`, `Bash(node ${CLI} ingest:*)`];
  const child = spawn(ready.bin, args, {cwd: work, windowsHide: true, env: {...process.env, CLAUDE_CODE_ENTRYPOINT: 'sami-studio'}});
  child.stdin.end(instructions({a, req, destDir, since, promptFile, recipe}), 'utf8');
  const done = new Promise((ok) => {
    let buf = '', last = '', result = null, err = '';
    const timer = setTimeout(() => { onEvent({msg: 'Quá thời gian, dừng Claude Code'}); child.kill(); }, timeoutMin * 60000);
    child.stdout.on('data', (d) => {
      buf += d; let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.type === 'assistant') for (const c of m.message?.content || []) {
          if (c.type === 'text' && c.text.trim()) { last = c.text.trim(); onEvent({msg: last.slice(-180)}); }
          if (c.type === 'tool_use') onEvent({msg: '⚙ ' + c.name.replace('mcp__browser-harness__', 'trình duyệt: ').replace(/^Bash$/, 'lệnh: ' + String(c.input?.command || '').replace(/^node \S+cli\.mjs /, ''))});
        }
        if (m.type === 'result') result = m;
      }
    });
    child.stderr.on('data', (d) => { err = (err + d).slice(-1500); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      const text = String(result?.result || last || err || `Claude Code dừng (mã ${code})`).trim();
      ok({ok: code === 0 && /^XONG/m.test(text) && !/^DỪNG/m.test(text), text, costUsd: result?.total_cost_usd ?? null, turns: result?.num_turns ?? null, since});
      setTimeout(() => fs.rmSync(work, {recursive: true, force: true}), 5000);
    });
  });
  return {child, done, since};
};
