// Share files without copying: hardlinks for files (same volume → 0 extra bytes), junctions for folders.
// Falls back to a normal copy when the target is on another drive (or the FS has no hardlinks).
import fs from 'fs';
import path from 'path';

const same = (a, b) => { try { const x = fs.statSync(a), y = fs.statSync(b); return x.ino === y.ino && x.dev === y.dev && x.ino !== 0; } catch { return false; } };

/** dst becomes the same file as src (hardlink) or an up-to-date copy → 'link' | 'copy' | 'kept' */
export const linkOrCopy = (src, dst) => {
  if (same(src, dst)) return 'kept';
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  if (fs.existsSync(dst)) {
    const a = fs.statSync(src), b = fs.statSync(dst);
    if (a.size === b.size && b.mtimeMs >= a.mtimeMs) { try { const t = dst + '.lnk~'; fs.linkSync(src, t); fs.renameSync(t, dst); return 'link'; } catch { return 'kept'; } }
    fs.rmSync(dst, {force: true});
  }
  try { fs.linkSync(src, dst); return 'link'; } catch { fs.copyFileSync(src, dst); return 'copy'; }
};

/** folder junction (Windows, no admin needed) / symlink elsewhere; replaces a stale link */
export const junction = (target, at) => {
  target = path.resolve(target); // a relative junction target would resolve against the LINK's folder
  try {
    const st = fs.lstatSync(at);
    if (st.isSymbolicLink()) { if (path.resolve(fs.readlinkSync(at)).toLowerCase() === path.resolve(target).toLowerCase()) return; fs.unlinkSync(at); }
    else if (st.isDirectory()) fs.rmSync(at, {recursive: true, force: true});
    else fs.rmSync(at, {force: true});
  } catch {}
  fs.mkdirSync(path.dirname(at), {recursive: true});
  fs.symlinkSync(target, at, process.platform === 'win32' ? 'junction' : 'dir');
};

/** mirror a folder tree as hardlinks (only files that differ are touched) → counts */
export const linkTree = (src, dst) => {
  const n = {link: 0, copy: 0, kept: 0};
  if (!fs.existsSync(src)) return n;
  const walk = (s, d) => {
    for (const e of fs.readdirSync(s, {withFileTypes: true})) {
      const a = path.join(s, e.name), b = path.join(d, e.name);
      if (e.isDirectory()) walk(a, b); else n[linkOrCopy(a, b)]++;
    }
  };
  walk(src, dst);
  return n;
};
