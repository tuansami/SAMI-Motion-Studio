// Version history ("điểm neo") — content-addressed snapshots of a whole project folder.
//   <project>/.history/objects/ab/cdef…   one copy per unique file content (dedup → an unchanged 200 MB project costs a few KB per snapshot)
//   <project>/.history/snapshots/<id>.json manifest {id, time, kind, label, starred, source, files: {rel: {h, size}}}
//   <project>/.history/index.json         stat cache rel → {size, mtimeMs, h} so big media is hashed only when it changes
// Everything is async (never blocks the server). Several processes may snapshot at once (server + Claude hook) → .history/lock.
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const SKIP_DIRS = new Set(['out', '.history', '.claude', 'node_modules', '.git']);
const SKIP_REL = new Set(['public/_engine']);
const SKIP_FILES = new Set(['.project.backup.json', '.studio-lock', 'Thumbs.db', '.DS_Store']);
const AUTO = new Set(['ai', 'save', 'open', 'before-upload', 'before-restore']);
const KEEP_AUTO = 60, KEEP_DAYS = 30;

const H = (dir) => path.join(dir, '.history');
const objPath = (dir, h) => path.join(H(dir), 'objects', h.slice(0, 2), h.slice(2));
const snapDir = (dir) => path.join(H(dir), 'snapshots');
const pad = (n, w = 2) => String(n).padStart(w, '0');
const stamp = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${pad(d.getMilliseconds(), 3)}`;
const who = () => { try { return os.userInfo().username; } catch { return 'unknown'; } };

const writeAtomic = async (f, data) => { await fsp.mkdir(path.dirname(f), {recursive: true}); const t = f + '.' + process.pid + '.tmp'; await fsp.writeFile(t, data); await fsp.rename(t, f); };
const readJson = async (f, def) => { try { return JSON.parse(await fsp.readFile(f, 'utf8')); } catch { return def; } };
const hashFile = (f) => new Promise((ok, bad) => { const h = crypto.createHash('sha1'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', bad); });

/** files tracked by history: rel (forward slashes) → absolute */
export const trackedFiles = async (dir) => {
  const out = new Map();
  const walk = async (d, rel) => {
    let ents; try { ents = await fsp.readdir(d, {withFileTypes: true}); } catch { return; }
    for (const e of ents) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { if ((!rel && SKIP_DIRS.has(e.name)) || SKIP_REL.has(r)) continue; await walk(path.join(d, e.name), r); }
      else if (e.isFile() && !SKIP_FILES.has(e.name) && !e.name.endsWith('.tmp')) out.set(r, path.join(d, e.name));
    }
  };
  await walk(dir, '');
  return out;
};

// cross-process lock (server + CLI hook can run together)
const withLock = async (dir, fn) => {
  const lk = path.join(H(dir), 'lock'); await fsp.mkdir(H(dir), {recursive: true});
  for (let i = 0; ; i++) {
    try { const fh = await fsp.open(lk, 'wx'); await fh.writeFile(String(process.pid)); await fh.close(); break; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - (await fsp.stat(lk)).mtimeMs > 120000) { await fsp.rm(lk, {force: true}); continue; } } catch {}
      if (i > 300) throw new Error('Lịch sử đang bận (lock) — thử lại sau');
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  try { return await fn(); } finally { await fsp.rm(lk, {force: true}).catch(() => {}); }
};

const listManifests = async (dir) => {
  let names; try { names = (await fsp.readdir(snapDir(dir))).filter((n) => n.endsWith('.json')); } catch { return []; }
  const all = await Promise.all(names.sort().map((n) => readJson(path.join(snapDir(dir), n), null)));
  return all.filter(Boolean); // oldest → newest
};
const sameFiles = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (const k of ka) if (!b[k] || b[k].h !== a[k].h) return false; return true; };

/** take a snapshot. Returns {skipped:true} when nothing changed since the last one (unless force). */
export const snapshot = (dir, {kind = 'manual', label = '', source = '', starred = false, force = false} = {}) => withLock(dir, async () => {
  const t0 = Date.now();
  const idxF = path.join(H(dir), 'index.json');
  const idx = await readJson(idxF, {});
  const files = {}; let stored = 0, storedBytes = 0, total = 0;
  for (const [rel, abs] of await trackedFiles(dir)) {
    let st; try { st = await fsp.stat(abs); } catch { continue; }
    const c = idx[rel];
    const h = c && c.size === st.size && c.mtimeMs === st.mtimeMs ? c.h : await hashFile(abs);
    idx[rel] = {size: st.size, mtimeMs: st.mtimeMs, h};
    const o = objPath(dir, h);
    if (!fs.existsSync(o)) { await fsp.mkdir(path.dirname(o), {recursive: true}); const t = o + '.' + process.pid + '.tmp'; await fsp.copyFile(abs, t); await fsp.rename(t, o).catch(() => fsp.rm(t, {force: true})); stored++; storedBytes += st.size; }
    files[rel] = {h, size: st.size}; total += st.size;
  }
  for (const k of Object.keys(idx)) if (!files[k]) delete idx[k];
  await writeAtomic(idxF, JSON.stringify(idx));
  const all = await listManifests(dir);
  const last = all.at(-1);
  if (!force && last && sameFiles(last.files, files)) return {skipped: true, id: last.id};
  const id = stamp() + '-' + kind;
  const m = {id, time: new Date().toISOString(), kind, label: String(label || '').slice(0, 200), starred: !!starred, source: source || who(), files, stats: {files: Object.keys(files).length, bytes: total, newObjects: stored, newBytes: storedBytes, ms: Date.now() - t0}};
  await writeAtomic(path.join(snapDir(dir), id + '.json'), JSON.stringify(m));
  if (all.length + 1 > KEEP_AUTO + 10) await pruneLocked(dir);
  return {id, ...m.stats};
});

const SCENE_RE = /^scenes\/([^/]+)\.tsx?$/;
/** what changed from a → b: {added, removed, changed} + human summary */
export const diffFiles = (a = {}, b = {}) => {
  const added = [], removed = [], changed = [];
  for (const k of Object.keys(b)) if (!a[k]) added.push(k); else if (a[k].h !== b[k].h) changed.push(k);
  for (const k of Object.keys(a)) if (!b[k]) removed.push(k);
  const all = [...added, ...removed, ...changed];
  const scenes = [...new Set(all.map((f) => f.match(SCENE_RE)?.[1]).filter(Boolean))].filter((s) => s !== 'index');
  const media = all.filter((f) => f.startsWith('public/'));
  const parts = [];
  if (all.includes('project.json')) parts.push('project.json');
  if (scenes.length) parts.push('cảnh ' + scenes.join(', '));
  if (media.length) parts.push(media.length + ' media');
  const other = all.length - (all.includes('project.json') ? 1 : 0) - all.filter((f) => SCENE_RE.test(f)).length - media.length;
  if (other > 0) parts.push(other + ' tệp khác');
  return {added, removed, changed, scenes, summary: parts.join(' · ') || 'không đổi'};
};

/** newest first, each with a diff vs the snapshot before it (and vs the current folder for the newest) */
export const list = async (dir) => {
  const all = await listManifests(dir);
  return all.map((m, i) => { const d = diffFiles(i ? all[i - 1].files : {}, m.files); return {id: m.id, time: m.time, kind: m.kind, label: m.label, starred: m.starred, source: m.source, stats: m.stats, first: i === 0, diff: {summary: i ? d.summary : 'điểm neo đầu tiên', added: d.added, removed: d.removed, changed: d.changed}}; }).reverse();
};
export const get = async (dir, id) => { const m = await readJson(path.join(snapDir(dir), path.basename(id) + '.json'), null); if (!m) throw new Error('Không tìm thấy điểm neo ' + id); return m; };

/** what restoring `id` would change in the current folder */
export const preview = async (dir, id) => {
  const m = await get(dir, id); const cur = {};
  const idx = await readJson(path.join(H(dir), 'index.json'), {});
  for (const [rel, abs] of await trackedFiles(dir)) { const st = await fsp.stat(abs); const c = idx[rel]; cur[rel] = {h: c && c.size === st.size && c.mtimeMs === st.mtimeMs ? c.h : await hashFile(abs), size: st.size}; }
  return diffFiles(cur, m.files); // added = will come back, removed = will be deleted, changed = will be overwritten
};

/** restore a snapshot (whole project, or only `paths` — files or folder prefixes). Always snapshots the current state first. */
export const restore = async (dir, id, {paths = null} = {}) => {
  const m = await get(dir, id);
  const before = await snapshot(dir, {kind: 'before-restore', label: 'Trước khi khôi phục ' + (m.label || m.id), force: false});
  return withLock(dir, async () => {
    const inScope = (rel) => !paths || paths.some((p) => rel === p || rel.startsWith(p.replace(/\/$/, '') + '/'));
    const cur = await trackedFiles(dir);
    const idx = await readJson(path.join(H(dir), 'index.json'), {});
    let written = 0, deleted = 0;
    for (const [rel, f] of Object.entries(m.files)) {
      if (!inScope(rel)) continue;
      const abs = path.join(dir, ...rel.split('/'));
      if (cur.has(rel) && idx[rel]?.h === f.h) { try { const st = await fsp.stat(abs); if (st.size === idx[rel].size && st.mtimeMs === idx[rel].mtimeMs) continue; } catch {} }
      const o = objPath(dir, f.h); if (!fs.existsSync(o)) throw new Error('Thiếu dữ liệu cho ' + rel + ' (kho lịch sử bị hỏng?)');
      await fsp.mkdir(path.dirname(abs), {recursive: true}); const t = abs + '.' + process.pid + '.tmp';
      await fsp.copyFile(o, t); await fsp.rename(t, abs); written++;
    }
    for (const rel of cur.keys()) if (inScope(rel) && !m.files[rel]) { await fsp.rm(cur.get(rel), {force: true}); deleted++; }
    return {ok: true, restored: m.id, before: before.id, written, deleted};
  });
};

export const star = async (dir, id, {label, starred} = {}) => withLock(dir, async () => {
  const f = path.join(snapDir(dir), path.basename(id) + '.json'); const m = await readJson(f, null); if (!m) throw new Error('Không tìm thấy điểm neo');
  if (label !== undefined) m.label = String(label).slice(0, 200);
  if (starred !== undefined) m.starred = !!starred;
  await writeAtomic(f, JSON.stringify(m)); return {ok: true};
});

/** keep: starred, labelled manual anchors, newest KEEP_AUTO, newest per day for KEEP_DAYS. Then GC unreferenced objects. */
const pruneLocked = async (dir) => {
  const all = (await listManifests(dir)).reverse(); // newest first
  const keep = new Set(); const days = new Set(); const cutoff = Date.now() - KEEP_DAYS * 864e5;
  all.forEach((m, i) => {
    if (m.starred || !AUTO.has(m.kind) || i < KEEP_AUTO) return keep.add(m.id);
    const t = Date.parse(m.time), day = m.time.slice(0, 10);
    if (t > cutoff && !days.has(day)) { days.add(day); keep.add(m.id); }
  });
  let removed = 0;
  for (const m of all) if (!keep.has(m.id)) { await fsp.rm(path.join(snapDir(dir), m.id + '.json'), {force: true}); removed++; }
  const used = new Set(); for (const m of all) if (keep.has(m.id)) for (const f of Object.values(m.files)) used.add(f.h);
  let freed = 0; const od = path.join(H(dir), 'objects');
  for (const a of await fsp.readdir(od).catch(() => [])) for (const b of await fsp.readdir(path.join(od, a)).catch(() => [])) {
    if (!used.has(a + b)) { const p = path.join(od, a, b); try { freed += (await fsp.stat(p)).size; await fsp.rm(p, {force: true}); } catch {} }
  }
  return {removed, freed};
};
export const prune = (dir) => withLock(dir, () => pruneLocked(dir));

/** disk used by .history */
export const usage = async (dir) => {
  let bytes = 0; const walk = async (d) => { for (const e of await fsp.readdir(d, {withFileTypes: true}).catch(() => [])) { const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else bytes += (await fsp.stat(p).catch(() => ({size: 0}))).size; } };
  await walk(H(dir)); return bytes;
};

/** copy a snapshot into a separate folder (for compare stills). Objects are hard-linked when possible. */
export const materialize = async (dir, id, dest) => {
  const m = await get(dir, id);
  for (const [rel, f] of Object.entries(m.files)) {
    const abs = path.join(dest, ...rel.split('/')); await fsp.mkdir(path.dirname(abs), {recursive: true});
    if (fs.existsSync(abs)) continue;
    try { await fsp.link(objPath(dir, f.h), abs); } catch { await fsp.copyFile(objPath(dir, f.h), abs); }
  }
  return m;
};
