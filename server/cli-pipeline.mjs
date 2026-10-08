#!/usr/bin/env node
// Dây chuyền: brief.json → dự án Studio dựng từ khuôn (Claude chỉ viết brief.json, máy dựng). KHÔNG render video.
//   node server/cli-pipeline.mjs list                                   các dây chuyền + khuôn
//   node server/cli-pipeline.mjs example <dây chuyền> [> brief.json]    brief mẫu
//   node server/cli-pipeline.mjs <dây chuyền> <brief.json> --out <thư mục dự án> [--brand <khách>] [--ratio 9:16[,16:9]] [--overwrite] [--no-qa]
// Brand: SAMI_Library/brands/<khách>/brand.json (màu, font, theme, logo, liên hệ, nhạc). Brief có "brand": "<khách>" cũng được.
// QA: validate + ảnh tĩnh mỗi cảnh (hyperframes snapshot) → <dự án>/out/qa/pipeline_<tỉ lệ>.jpg
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {LIB, LIBRARY} from './paths.mjs';
import {buildProject, listKhuon, FPB, GROUPS} from './khuon.mjs';
import {readBrand, listBrands} from './library.mjs';
import {validateProject} from './validate.mjs';
import {snapshot, ratioTag} from './hf.mjs';
import {FFMPEG} from './ffmpeg.mjs';

const PIPES = path.join(LIB, 'pipelines');
const argv = process.argv.slice(2); const pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(a); }
const names = () => fs.readdirSync(PIPES).filter((f) => f.endsWith('.mjs') && f !== 'common.mjs').map((f) => f.replace(/\.mjs$/, ''));
const load = async (n) => { if (!names().includes(n)) throw new Error(`Không có dây chuyền "${n}". Có: ${names().join(', ')}`); return import('file:///' + path.join(PIPES, n + '.mjs').replace(/\\/g, '/')); };

try {
  const cmd = pos[0];
  if (!cmd || cmd === 'list') {
    for (const n of names()) console.log(`${n.padEnd(8)} ${(await load(n)).describe}`);
    console.log('\nKhuôn:'); for (const k of listKhuon()) console.log(`  ${k.id.padEnd(16)} ${(GROUPS[k.group] || k.group).padEnd(16)} ${k.beats} nhịp · ${k.themes.join('/')} · ${k.name}`);
    console.log('\nBrand: ' + (listBrands().join(', ') || '(chưa có: SAMI_Library/brands/<khách>/brand.json)'));
  } else if (cmd === 'example') {
    console.log(JSON.stringify((await load(pos[1])).example, null, 1));
  } else {
    const P = await load(cmd);
    if (!pos[1] || !o.out) throw new Error('Cần <brief.json> và --out <thư mục dự án>');
    const brief = JSON.parse(fs.readFileSync(pos[1], 'utf8').replace(/^﻿/, ''));
    const brandId = o.brand || brief.brand || null; const brand = brandId ? readBrand(brandId) : null;
    if (brandId && !brand) throw new Error(`Không có brand "${brandId}" (${path.join(LIBRARY, 'brands', brandId, 'brand.json')})`);
    if (o.ratio) brief.formats = String(o.ratio).split(',');
    const spec = P.default(brief, brand);
    const dir = path.resolve(o.out);
    const p = buildProject(dir, {...spec, overwrite: !!o.overwrite});
    fs.mkdirSync(path.join(dir, 'brief'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'brief', `pipeline-${cmd}.json`), JSON.stringify({pipeline: cmd, brand: brandId, brief}, null, 1));
    const T = p.scenes.at(-1).end / 30;
    console.log(`✓ ${p.name}: ${p.scenes.length} cảnh · ${T.toFixed(1)} s · ${p.formats.join(', ')} · theme ${p.look.theme}${brand ? ' · brand ' + brandId : ''}\n  ${dir}`);
    for (const s of p.scenes) console.log(`  ${s.id} ${String(s.khuon.id).padEnd(15)} ${(s.start / 30).toFixed(1).padStart(5)}–${(s.end / 30).toFixed(1).padEnd(5)} ${s.label}`);
    if (!p.audio.music?.src) console.log('  ⚠ chưa có nhạc nền (brand.music hoặc brief.music = "lib:music/…")');
    const v = validateProject(dir); for (const x of v.fail) console.log('  ✗ ' + x); for (const x of v.warn.slice(0, 6)) console.log('  ⚠ ' + x);
    if (!o['no-qa']) {
      const qa = path.join(dir, 'out', 'qa'); fs.mkdirSync(qa, {recursive: true});
      for (const ratio of p.formats) {
        const files = [];
        for (const s of p.scenes) {
          const at = [8 / 30 + Math.max(1, (s.end - s.start) / FPB - 1.5) * FPB / 30];
          try { files.push(...await snapshot(dir, p, s, {ratio, at, outDir: path.join(qa, 'snap', `${s.id}_${ratioTag(ratio)}`)})); } catch (e) { console.log(`  ✗ ảnh ${s.id}: ${e.message.split('\n')[0]}`); }
        }
        if (!files.length) continue;
        const [w, h, cols] = ratio === '9:16' ? [240, 426, Math.min(8, files.length)] : ratio === '16:9' ? [480, 270, Math.min(4, files.length)] : [320, 320 * (ratio === '4:5' ? 1.25 : 1), Math.min(6, files.length)];
        let f = files.map((_, i) => `[${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`).join(';');
        f += ';' + files.map((_, i) => `[v${i}]`).join('') + (files.length > 1 ? `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|')}:fill=0x111111` : 'null');
        const out = path.join(qa, `pipeline_${ratioTag(ratio)}.jpg`);
        spawnSync(FFMPEG, ['-v', 'error', '-y', ...files.flatMap((x) => ['-i', x]), '-filter_complex', f, '-frames:v', '1', '-q:v', '3', out]);
        console.log('  ảnh QA: ' + out);
      }
    }
    console.log('Mở trong Studio để xem trước. Xuất video chỉ khi Tuấn yêu cầu.');
  }
} catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
