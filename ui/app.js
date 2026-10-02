/* SAMI Motion Studio — UI (vanilla JS, no build step). */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const api = async (url, body) => {
  const r = await fetch(url, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j;
};
const toast = (msg, err = false, ms = 3200) => { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), ms); };
const modal = (content) => { const b = $('#modalBody'); b.innerHTML = ''; b.append(content); $('#modal').hidden = false; };
$('#modalClose').onclick = () => ($('#modal').hidden = true);
const BASE = 30; // base frames per second (all timings in project.json)
const fmtT = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const ANIMS = {rise: 'Từng chữ trồi lên', words: 'Từng chữ hiện dần', fade: 'Mờ dần', pop: 'Bật (pop)', slide: 'Trượt vào', typewriter: 'Đánh máy', karaoke: 'Karaoke (tô từng chữ)', highlight: 'Nền highlight từng chữ', none: 'Không hiệu ứng'};
const SFX = ['whoosh_a', 'whoosh_b', 'whoosh_c', 'pop', 'sub_hit', 'key_single', 'key_enter', 'typing_burst'];
const RATIOS = ['16:9', '9:16', '1:1'];

const S = {state: null, id: null, dir: null, project: null, saved: null, hist: [], fut: [], scene: null, ratio: '16:9', playerApi: null, frame: 0, total: 1, playing: false, tab: 'text', titleSel: null, subSel: null, assets: [], analysis: null, jobs: [], fps: 30};

// ─────────────────────────── HOME ───────────────────────────
async function loadHome() {
  S.state = await api('/api/state');
  $('#ver').textContent = 'v' + S.state.version;
  const rc = $('#recent'); rc.innerHTML = '';
  if (!S.state.recent.length) rc.append(h('div', {class: 'muted'}, 'Chưa có dự án. Tạo mới bên dưới hoặc mở một thư mục có project.json.'));
  for (const r of S.state.recent) rc.append(h('div', {class: 'card', onclick: () => openProject({id: r.id})}, h('b', {}, r.name || 'Dự án'), h('small', {}, r.dir), h('div', {class: 'muted', style: 'font-size:12px;margin-top:6px'}, r.opened ? 'Mở lần cuối: ' + new Date(r.opened).toLocaleString('vi-VN') : 'Dự án mẫu')));
  const sel = $('#npTemplate'); sel.innerHTML = '';
  for (const t of S.state.templates) sel.append(h('option', {value: t.id}, `${t.name} — ${t.scenes} cảnh, ${t.seconds}s, ${t.formats.join(' / ')}`));
  renderGallery();
  $('#npLocation').value = S.state.projectsRoot;
  const g = S.state.gpu;
  $('#sysInfo').textContent = `Máy: ${S.state.cpuModel} · ${S.state.cpus} luồng CPU · GPU mã hoá: ${g.nvenc ? 'NVIDIA NVENC ✓' : g.qsv ? 'Intel QSV' : g.amf ? 'AMD AMF' : 'không phát hiện (render bằng CPU)'} · ffmpeg ${S.state.ffmpeg ? '✓' : '✗'}`;
}
S.tplCat = 'all';
function renderGallery() {
  const T = S.state.templates, C = S.state.categories || {};
  const F = $('#tplFilters'); F.innerHTML = '';
  const cats = ['all', ...Object.keys(C).filter((c) => T.some((t) => t.category === c))];
  for (const c of cats) F.append(h('button', {class: S.tplCat === c ? 'on' : '', onclick: () => { S.tplCat = c; renderGallery(); }}, c === 'all' ? `Tất cả (${T.length})` : `${C[c]} (${T.filter((t) => t.category === c).length})`));
  const G = $('#tplGrid'); G.innerHTML = '';
  for (const t of T.filter((x) => S.tplCat === 'all' || x.category === S.tplCat)) {
    const th = t.thumbs || {};
    G.append(h('div', {class: 'tpl' + ($('#npTemplate').value === t.id ? ' sel' : '')},
      h('div', {class: 'thumbs'}, ...(Object.keys(th).length ? ['16:9', '9:16', '1:1'].filter((r) => th[r]).map((r) => h('img', {src: th[r] + '?v=' + t.version, alt: r, title: r})) : [h('div', {class: 'ph'}, 'Chưa có ảnh bìa')])),
      h('div', {class: 'body'}, h('b', {}, t.name), h('p', {}, t.description || '—'),
        h('div', {class: 'badges'}, h('span', {}, (C[t.category] || t.category)), h('span', {}, t.seconds + 's'), h('span', {}, t.scenes + ' cảnh'), ...t.formats.map((f) => h('span', {}, f)), h('span', {}, 'v' + t.version), !t.hasManifest ? h('span', {style: 'color:var(--amber)'}, 'thiếu template.json') : null)),
      h('div', {class: 'acts'},
        h('button', {class: 'small primary', onclick: () => { $('#npTemplate').value = t.id; renderGallery(); $('#newProj').scrollIntoView({behavior: 'smooth'}); $('#npName').focus(); }}, 'Dùng mẫu này'),
        h('button', {class: 'small', onclick: () => checkTpl(t.id)}, 'Kiểm tra'),
        h('button', {class: 'small', title: 'Nén thành .zip để gửi đồng nghiệp / văn phòng khác', onclick: async () => { try { const r = await api('/api/template/export', {tpl: t.id}); toast('Đã xuất: ' + r.out, false, 6000); } catch (e) { toast(e.message, true); } }}, 'Xuất .zip'))));
  }
}
$('#npTemplate').onchange = () => renderGallery();
function showCheck(title, r, extra) {
  modal(h('div', {}, h('h3', {}, title), extra || null,
    r.fail.length ? h('p', {class: 'v-fail'}, h('b', {}, `${r.fail.length} lỗi phải sửa trước khi đưa vào thư viện:`)) : h('p', {class: 'v-ok'}, h('b', {}, 'Đạt chuẩn mẫu v1 ✓')),
    ...r.fail.map((x) => h('div', {class: 'v-fail'}, '✗ ' + x)), ...r.warn.map((x) => h('div', {class: 'v-warn'}, '⚠ ' + x)), ...r.ok.map((x) => h('div', {class: 'v-ok'}, '✓ ' + x)),
    r.stats ? h('p', {class: 'muted'}, `${r.stats.scenes} cảnh · ${r.stats.duration}s · ô chữ ${r.stats.slots.text} · ô ảnh ${r.stats.slots.image} · logo ${r.stats.slots.logo}`) : null,
    h('p', {class: 'muted', style: 'font-size:12.5px'}, 'Chi tiết tiêu chí: ', h('a', {class: 'help', href: '/docs/TEMPLATE_STANDARD.html', target: '_blank'}, 'Chuẩn mẫu'), '. Nhờ Claude Code sửa: "sửa mẫu <tên> cho đạt docs/TEMPLATE_STANDARD.md".')));
}
async function checkTpl(id) { try { showCheck('Kiểm tra mẫu: ' + id, await api('/api/template/check', {tpl: id}), h('div', {class: 'row', style: 'margin-bottom:8px'}, h('button', {class: 'small', onclick: async () => { await api('/api/template/thumbs', {tpl: id}); toast('Đang tạo ảnh bìa (≈ 1 phút)… tải lại trang sau đó.', false, 6000); }}, 'Tạo lại ảnh bìa'))); } catch (e) { toast(e.message, true); } }
$('#btnImportTpl').onclick = async () => {
  const mode = confirm('Nhập từ file .zip? (OK = file .zip · Huỷ = chọn thư mục)');
  const r = mode ? await api('/api/pick-file?filter=' + encodeURIComponent('Mẫu SAMI (*.zip)|*.zip')) : await api('/api/pick-folder');
  let from = mode ? r.file : r.dir;
  if (!r.supported) from = prompt('Dán đường dẫn thư mục mẫu hoặc file .zip:');
  if (!from) return;
  try { const x = await api('/api/template/import', {from}); await loadHome(); showCheck('Đã nhập mẫu: ' + x.id, x.check); } catch (e) { toast(e.message, true, 6000); }
};

$('#btnOpenFolder').onclick = async () => { const r = await api('/api/pick-folder'); if (!r.supported) return toast('Hộp chọn thư mục chỉ có trên Windows — hãy dán đường dẫn.', true); if (r.dir) openProject({dir: r.dir}); };
$('#btnOpenPath').onclick = () => { const d = $('#openPath').value.trim(); if (d) openProject({dir: d}); };
$('#npPickLoc').onclick = async () => { const r = await api('/api/pick-folder'); if (r.dir) $('#npLocation').value = r.dir; };
$('#npPickAssets').onclick = async () => { const r = await api('/api/pick-folder'); if (r.dir) $('#npAssets').value = r.dir; };
$('#btnCreate').onclick = async () => {
  const name = $('#npName').value.trim(); if (!name) return toast('Nhập tên dự án', true);
  $('#npMsg').textContent = 'Đang tạo…';
  try {
    const r = await api('/api/project/new', {name, client: $('#npClient').value.trim(), template: $('#npTemplate').value, location: $('#npLocation').value.trim(), assetsDir: $('#npAssets').value.trim() || null, brand: {mint: $('#npC1').value, purple: $('#npC2').value}});
    $('#npMsg').textContent = r.report ? `Đã nhập ${r.report.files.length} tệp (${r.report.img} ảnh, ${r.report.video} video, ${r.report.audio} âm thanh, ${r.report.docs} tài liệu).` : '';
    openProject({id: r.id});
  } catch (e) { $('#npMsg').textContent = ''; toast(e.message, true); }
};

// ─────────────────────────── OPEN PROJECT ───────────────────────────
async function openProject(q) {
  try {
    const r = await api('/api/project/open', q);
    location.hash = 'p=' + r.id;
    S.id = r.id; S.dir = r.dir; S.assets = r.assets;
    const draft = localStorage.getItem('draft_' + r.id);
    S.project = r.project; S.saved = JSON.stringify(r.project);
    if (draft && draft !== S.saved && confirm('Có bản chỉnh sửa chưa lưu từ lần trước. Khôi phục?')) S.project = JSON.parse(draft);
    S.hist = []; S.fut = [];
    try { const u = JSON.parse(sessionStorage.getItem('undo_' + r.id) || 'null'); sessionStorage.removeItem('undo_' + r.id); if (u) { S.hist = u.hist || []; S.fut = u.fut || []; } } catch {} // survive the auto-reload after scene code changes
    S.ratio = S.project.formats[0]; S.scene = S.project.scenes[0]?.id;
    S.render = {...S.state.render, ratio: S.ratio};
    $('#home').hidden = true; $('#editor').hidden = false; $('#topActions').hidden = false;
    $('#projTitle').textContent = S.project.name;
    await mountPreview();
    renderAll();
    connectEvents();
  } catch (e) { toast(e.message, true, 6000); }
}
$('#btnHome').onclick = () => { if (isDirty() && !confirm('Có thay đổi chưa lưu. Vẫn thoát?')) return; location.hash = ''; location.reload(); };
$('#btnFolder').onclick = () => api('/api/open', {path: S.dir});

// ─────────────────────────── PREVIEW (Remotion Player) ───────────────────────────
function loadScript(src) { return new Promise((ok, bad) => { const s = h('script', {src}); s.onload = ok; s.onerror = bad; document.body.append(s); }); }
async function mountPreview() {
  window.remotion_staticBase = `/proj/${S.id}/public`;
  document.head.append(h('link', {rel: 'stylesheet', href: `/bundle/${S.id}/entry.css?${Date.now()}`}));
  await loadScript(`/bundle/${S.id}/entry.js?${Date.now()}`);
  if (window.__bundleError) return showBundleError(window.__bundleError);
  sizePlayer();
  S.playerApi = await window.StudioPreview.mount($('#playerBox'), previewOpts(), (f, total, playing) => { S.frame = f; S.total = total; S.playing = playing; updateTransport(); });
}
function showBundleError(msg) { const e = $('#bundleErr'); e.hidden = false; e.textContent = 'Lỗi code cảnh (sửa file rồi lưu, Studio sẽ tự tải lại):\n\n' + msg; }
const previewOpts = () => ({project: S.project, ratio: S.ratio, fps: S.fps, titles: $('#tgTitles').checked, subtitles: $('#tgSubs').checked, audio: $('#tgAudio').checked, sceneId: $('#tgScene').checked ? S.scene : null});
let upT;
function pushPreview() { clearTimeout(upT); upT = setTimeout(() => S.playerApi?.update(previewOpts()), 120); }
function sizePlayer() {
  const vp = $('#viewport'); const [a, b] = S.ratio.split(':').map(Number);
  const W = vp.clientWidth - 32, H = vp.clientHeight - 32; let w = W, hh = (W * b) / a; if (hh > H) { hh = H; w = (H * a) / b; }
  Object.assign($('#stageWrap').style, {width: w + 'px', height: hh + 'px'});
  renderHandles();
}
window.addEventListener('resize', sizePlayer);
['tgTitles', 'tgSubs', 'tgAudio', 'tgScene'].forEach((i) => ($('#' + i).onchange = () => { pushPreview(); renderScrub(); }));
$('#btnPlay').onclick = () => S.playerApi?.toggle();
const secNow = () => (S.frame / S.fps) + ($('#tgScene').checked ? Math.max(0, sceneById(S.scene).start - 8) / BASE : 0);
function updateTransport() {
  $('#btnPlay').textContent = S.playing ? '❚❚' : '▶';
  $('#tc').textContent = `${fmtT(S.frame / S.fps)} / ${fmtT(S.total / S.fps)}`;
  $('#scrubHead').style.left = (100 * S.frame / Math.max(1, S.total - 1)) + '%';
  if (!$('#tgScene').checked && S.playing) { // follow playhead in the scene list
    const t = (S.frame / S.fps) * BASE; const sc = S.project.scenes.find((s) => t >= s.start && t < s.end);
    if (sc && sc.id !== S.scene) { S.scene = sc.id; renderScenes(); if (S.tab === 'text') renderTab(); renderScrub(); }
  }
}
$('#scrub').onmousedown = (e) => {
  const r = $('#scrub').getBoundingClientRect();
  const go = (ev) => { const x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); S.playerApi?.seek(Math.round(x * (S.total - 1))); };
  go(e); const mv = (ev) => go(ev); const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
  addEventListener('mousemove', mv); addEventListener('mouseup', up);
};

// ─────────────────────────── EDIT STATE ───────────────────────────
const isDirty = () => JSON.stringify(S.project) !== S.saved;
function commit(mut, {preview = true, rerender = true} = {}) {
  S.hist.push(JSON.stringify(S.project)); if (S.hist.length > 80) S.hist.shift(); S.fut = [];
  mut(S.project);
  afterChange(preview, rerender);
}
function afterChange(preview = true, rerender = true) {
  $('#dirty').hidden = !isDirty();
  try { localStorage.setItem('draft_' + S.id, JSON.stringify(S.project)); } catch {}
  if (preview) pushPreview();
  if (rerender) { renderScenes(); renderScrub(); }
}
$('#btnUndo').onclick = () => { if (!S.hist.length) return; S.fut.push(JSON.stringify(S.project)); S.project = JSON.parse(S.hist.pop()); afterChange(); renderTab(); };
$('#btnRedo').onclick = () => { if (!S.fut.length) return; S.hist.push(JSON.stringify(S.project)); S.project = JSON.parse(S.fut.pop()); afterChange(); renderTab(); };
async function save() {
  try {
    const r = await api('/api/project/save', {id: S.id, project: S.project});
    S.saved = JSON.stringify(S.project); localStorage.removeItem('draft_' + S.id); $('#dirty').hidden = true;
    const v = r.validation; toast(v.fail.length ? `Đã lưu — còn ${v.fail.length} lỗi (bấm Kiểm tra)` : v.warn.length ? `Đã lưu · ${v.warn.length} lưu ý` : 'Đã lưu ✓', !!v.fail.length);
  } catch (e) { toast(e.message, true); }
}
$('#btnSave').onclick = save;
$('#btnCheck').onclick = async () => {
  if (isDirty()) await save();
  const v = await api('/api/project/validate?id=' + S.id);
  modal(h('div', {}, h('h3', {}, 'Kiểm tra dự án'), ...v.fail.map((x) => h('div', {class: 'v-fail'}, '✗ ' + x)), ...v.warn.map((x) => h('div', {class: 'v-warn'}, '⚠ ' + x)), ...v.ok.map((x) => h('div', {class: 'v-ok'}, '✓ ' + x)), !v.fail.length ? h('p', {}, h('b', {}, 'Sẵn sàng render.')) : null));
};
addEventListener('keydown', (e) => {
  const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !inField) { e.preventDefault(); $('#btnUndo').click(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !inField) { e.preventDefault(); $('#btnRedo').click(); }
  else if (e.code === 'Space' && !inField && S.playerApi) { e.preventDefault(); S.playerApi.toggle(); }
});
addEventListener('beforeunload', (e) => { if (S.project && isDirty()) { e.preventDefault(); e.returnValue = ''; } });

// ─────────────────────────── SCENES (left) ───────────────────────────
const sceneById = (id) => S.project.scenes.find((s) => s.id === id);
const totalSec = () => (S.project.scenes.at(-1)?.end || 0) / BASE;
function setSceneLength(id, newLen) {
  newLen = Math.max(15, Math.round(newLen));
  commit((p) => {
    const i = p.scenes.findIndex((s) => s.id === id); const s = p.scenes[i];
    const oldLen = s.end - s.start, delta = newLen - oldLen; if (!delta) return;
    const A = s.animLength || oldLen;
    if (s.warp && s.warp.length > 1) s.warp = s.warp.map(([n, o]) => [Math.round(n * newLen / oldLen), o]);
    else s.warp = newLen === A ? null : [[0, 0], [newLen, A]];
    if (s.warp) s.warp[s.warp.length - 1][0] = newLen;
    const cut = s.end; s.end = s.start + newLen;
    for (let k = i + 1; k < p.scenes.length; k++) { p.scenes[k].start += delta; p.scenes[k].end += delta; }
    if ($('#rippleAll').checked) {
      const cutS = cut / BASE, d = delta / BASE;
      for (const t of p.titles || []) { if (t.start >= cutS - 0.01) { t.start = +(t.start + d).toFixed(3); t.end = +(t.end + d).toFixed(3); } }
      for (const c of p.audio?.cues || []) if (c.t >= cutS - 0.3) c.t = +(c.t + d).toFixed(3);
      for (const c of p.audio?.voice || []) if (c.t >= cutS - 0.3) c.t = +(c.t + d).toFixed(3);
      for (const c of p.subtitles?.items || []) if (c.start >= cutS - 0.01) { c.start = +(c.start + d).toFixed(3); c.end = +(c.end + d).toFixed(3); }
    }
    if (p.audio?.mode === 'premix') toast('Lưu ý: file nhạc mix sẵn không tự dài/ngắn theo. Vào tab Âm thanh → chọn "Ghép lớp" hoặc mix lại.', false, 6000);
  });
}
function renderScenes() {
  const L = $('#sceneList'); L.innerHTML = '';
  S.project.scenes.forEach((s, i) => {
    const len = (s.end - s.start) / BASE;
    const inp = h('input', {type: 'number', step: '0.5', min: '0.5', value: len.toFixed(2), title: 'Thời lượng (giây)', onclick: (e) => e.stopPropagation(), onchange: (e) => setSceneLength(s.id, parseFloat(e.target.value) * BASE)});
    L.append(h('div', {class: 'sc' + (s.id === S.scene ? ' on' : ''), onclick: () => selectScene(s.id)},
      h('div', {class: 'l1'}, h('span', {class: 'id'}, s.id), h('span', {class: 'nm'}, s.label || '')),
      h('div', {class: 'l2'}, h('span', {}, fmtT(s.start / BASE)), h('span', {style: 'flex:1'}), h('button', {class: 'small', title: '−0,5 giây', onclick: (e) => { e.stopPropagation(); setSceneLength(s.id, s.end - s.start - 15); }}, '−'), inp, h('span', {}, 's'), h('button', {class: 'small', title: '+0,5 giây', onclick: (e) => { e.stopPropagation(); setSceneLength(s.id, s.end - s.start + 15); }}, '+'))));
  });
  $('#totalDur').textContent = 'Tổng ' + fmtT(totalSec());
}
function selectScene(id) {
  S.scene = id; renderScenes(); renderScrub();
  if ($('#tgScene').checked) pushPreview(); else S.playerApi?.seek(Math.round(((sceneById(id).start + 12) / BASE) * S.fps));
  if (S.tab === 'text') renderTab();
}
$('#btnSnap').onclick = () => commit((p) => {
  // round every cut to the nearest beat (15 base frames + 1); first scene starts at 0
  for (let i = 0; i < p.scenes.length; i++) {
    const s = p.scenes[i]; if (i > 0) s.start = p.scenes[i - 1].end;
    const want = Math.max(s.start + 15, Math.round((s.end - 1) / 15) * 15 + 1);
    if (s.end !== want) { const oldLen = s.end - s.start; s.end = want; const newLen = s.end - s.start; if (s.warp) { s.warp = s.warp.map(([n, o]) => [Math.round(n * newLen / oldLen), o]); s.warp.at(-1)[0] = newLen; } else if (s.animLength && s.animLength !== newLen) s.warp = [[0, 0], [newLen, s.animLength]]; }
  }
});
function renderScrub() {
  const T = S.project.scenes.at(-1)?.end || 1;
  const only = $('#tgScene').checked;
  const segs = $('#scrubSegs'); segs.innerHTML = '';
  const marks = $('#scrubMarks'); marks.innerHTML = '';
  if (only) { const s = sceneById(S.scene); segs.append(h('div', {class: 'on', style: 'width:100%'}, `${s.id} · ${s.label}`)); return; }
  for (const s of S.project.scenes) segs.append(h('div', {class: s.id === S.scene ? 'on' : '', style: `width:${100 * (s.end - s.start) / T}%`, title: s.label}, s.id));
  for (const t of S.project.titles || []) marks.append(h('i', {style: `left:${100 * t.start * BASE / T}%;width:${Math.max(0.3, 100 * (t.end - t.start) * BASE / T)}%`, title: t.text}));
  for (const o of S.project.overlays || []) if (!o.whole) marks.append(h('i', {class: 'ovm', style: `left:${100 * o.start * BASE / T}%;width:${Math.max(0.3, 100 * (o.end - o.start) * BASE / T)}%`, title: 'Ảnh: ' + (o.label || o.src || o.sticker)}));
  if (S.project.audio?.mode === 'layers') for (const c of S.project.audio.cues || []) marks.append(h('i', {class: 'sfx', style: `left:${100 * c.t * BASE / T}%`, title: c.label || c.sfx}));
  if (S.project.audio?.mode === 'layers') for (const c of S.project.audio.voice || []) marks.append(h('i', {class: 'sfx', style: `left:${100 * c.t * BASE / T}%;background:#7667FE`, title: 'Thoại: ' + (c.label || c.src)}));
}
function renderRatios() {
  const seg = $('#ratioSeg'); seg.innerHTML = '';
  for (const r of RATIOS) seg.append(h('button', {class: r === S.ratio ? 'on' : '', onclick: () => { S.ratio = r; if (S.render) S.render.ratio = r; renderRatios(); sizePlayer(); pushPreview(); if (S.tab === 'render') renderTab(); }}, r === '16:9' ? '16:9 Ngang' : r === '9:16' ? '9:16 Dọc' : '1:1 Vuông'));
  $('#fitBadge').hidden = S.project.formats.includes(S.ratio);
}

// ─────────────────────────── INSPECTOR TABS ───────────────────────────
$$('#tabs button').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); renderTab(); }));
function renderAll() { renderRatios(); renderScenes(); renderScrub(); renderTab(); $('#dirty').hidden = !isDirty(); }
function renderTab() { setTimeout(renderHandles, 0); const B = $('#tabBody'); B.innerHTML = ''; ({text: tabText, titles: tabTitles, overlays: tabOverlays, subs: tabSubs, audio: tabAudio, look: tabLook, render: tabRender, history: tabHistory})[S.tab](B); }

const field = (label, input, hint) => h('label', {}, label, input, hint ? h('div', {class: 'hint'}, hint) : null);
const assetSelect = (value, type, onchange) => {
  const sel = h('select', {onchange: (e) => onchange(e.target.value)}, h('option', {value: ''}, '— không —'), ...S.assets.filter((a) => !type || a.type === type).map((a) => h('option', {value: a.path, selected: a.path === value}, a.path)));
  if (value && !S.assets.some((a) => a.path === value)) sel.append(h('option', {value, selected: true}, value + ' (không thấy)'));
  return sel;
};
async function uploadTo(sub, accept) {
  return new Promise((ok) => {
    const fp = $('#filePick'); fp.accept = accept || ''; fp.value = '';
    fp.onchange = async () => {
      const f = fp.files[0]; if (!f) return ok(null);
      toast('Đang tải lên ' + f.name + '…');
      const r = await fetch(`/api/upload?id=${S.id}&sub=${sub}&name=${encodeURIComponent(f.name)}`, {method: 'POST', body: f}).then((x) => x.json());
      S.assets = await api('/api/project/assets?id=' + S.id); toast('Đã thêm ' + r.path); ok(r.path);
    };
    fp.click();
  });
}

// — Chữ —
function tabText(B) {
  const all = Object.entries(S.project.copy || {});
  const cur = all.filter(([, v]) => v.scene === S.scene);
  const sc = sceneById(S.scene);
  B.append(h('div', {class: 'hint'}, 'Sửa chữ hiện trên video. Ở ô có ghi chú hỗ trợ: ', h('code', {}, '*chữ*'), ' = tô màu gradient, ', h('code', {}, ' / '), ' = xuống dòng. Xem thay đổi ngay trên khung preview.'));
  const g = h('div', {class: 'group'}, h('h4', {}, `${sc?.id || ''} · ${sc?.label || ''}`));
  g.append(field('Tên cảnh (chỉ để quản lý)', h('input', {value: sc?.label || '', onchange: (e) => commit((p) => { p.scenes.find((s) => s.id === S.scene).label = e.target.value; })})));
  if (!cur.length) g.append(h('div', {class: 'muted'}, 'Cảnh này không có chữ chỉnh được.'));
  for (const [k, v] of cur) {
    const isImg = /(_image|_logo|_img|_photo)$/i.test(k);
    if (isImg) { g.append(field(v.label || k, h('div', {class: 'row'}, assetSelect(v.value, 'img', (val) => commit((p) => { p.copy[k].value = val; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('img', 'image/*'); if (pth) commit((p) => { p.copy[k].value = 'img/' + pth.split('/').pop(); }); renderTab(); }}, 'Tải ảnh…')), v.hint)); continue; }
    const long = String(v.value).length > 38 || v.multiline;
    const inp = h(long ? 'textarea' : 'input', {value: v.value ?? '', rows: 2});
    if (long) inp.value = v.value ?? '';
    let first = true;
    inp.oninput = () => { if (first) { S.hist.push(JSON.stringify(S.project)); S.fut = []; first = false; } S.project.copy[k].value = inp.value; afterChange(true, false); };
    inp.onblur = () => (first = true);
    g.append(field(v.label || k, inp, v.hint));
  }
  B.append(g);
  const others = all.filter(([, v]) => v.scene !== S.scene);
  if (others.length) B.append(h('details', {}, h('summary', {class: 'muted', style: 'cursor:pointer;margin-bottom:8px'}, `Tất cả chữ trong video (${all.length})`),
    ...all.map(([k, v]) => h('div', {class: 'item', onclick: () => selectScene(v.scene)}, h('span', {class: 't'}, v.scene), h('span', {class: 'x'}, `${v.label}: ${v.value}`)))));
}

// — shared text-style editor (titles & subtitles) —
function styleEditor(st, onChange, {showBg = true} = {}) {
  const fonts = window.StudioPreview?.fonts || [{family: 'Be Vietnam Pro', weights: [400, 700, 800]}];
  const set = (k, v) => onChange((s) => { s[k] = v; });
  const fam = fonts.find((f) => f.family === (st.font || 'Be Vietnam Pro')) || fonts[0];
  const wrap = h('div', {});
  wrap.append(h('div', {class: 'cols2'},
    field('Font', h('select', {onchange: (e) => set('font', e.target.value)}, ...fonts.map((f) => h('option', {value: f.family, selected: f.family === (st.font || 'Be Vietnam Pro')}, f.family)))),
    field('Độ đậm', h('select', {onchange: (e) => set('weight', +e.target.value)}, ...fam.weights.map((w) => h('option', {value: w, selected: w === (st.weight || 800)}, w))))));
  wrap.append(h('div', {class: 'cols3'},
    field('Cỡ chữ (px)', h('input', {type: 'number', value: st.size || 64, min: 12, max: 400, onchange: (e) => set('size', +e.target.value)})),
    field('Màu chữ', h('input', {type: 'color', value: st.color || '#ffffff', onchange: (e) => set('color', e.target.value)})),
    field('Màu nhấn *…*', h('input', {type: 'color', value: st.highlight || '#08dda4', onchange: (e) => set('highlight', e.target.value)}))));
  wrap.append(h('div', {class: 'cols3'},
    field('Căn lề', h('select', {onchange: (e) => set('align', e.target.value)}, ...[['center', 'Giữa'], ['left', 'Trái'], ['right', 'Phải']].map(([v, l]) => h('option', {value: v, selected: (st.align || 'center') === v}, l)))),
    field('Giãn chữ', h('input', {type: 'number', step: '0.01', value: st.letterSpacing ?? -0.02, onchange: (e) => set('letterSpacing', +e.target.value)})),
    field('Giãn dòng', h('input', {type: 'number', step: '0.05', value: st.lineHeight ?? 1.15, onchange: (e) => set('lineHeight', +e.target.value)}))));
  wrap.append(h('div', {class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px'},
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!st.uppercase, onchange: (e) => set('uppercase', e.target.checked)}), 'IN HOA'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!st.italic, onchange: (e) => set('italic', e.target.checked)}), 'Nghiêng'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!st.shadow, onchange: (e) => set('shadow', e.target.checked)}), 'Đổ bóng'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!st.stroke, onchange: (e) => set('stroke', e.target.checked ? {color: '#000000', width: 3} : null)}), 'Viền chữ'),
    showBg ? h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!st.bg, onchange: (e) => set('bg', e.target.checked ? {color: '#0C0628', opacity: 0.75, radius: 14, padX: 24, padY: 12} : null)}), 'Nền hộp') : null));
  if (st.stroke) wrap.append(h('div', {class: 'cols2'}, field('Màu viền', h('input', {type: 'color', value: st.stroke.color, onchange: (e) => onChange((s) => { s.stroke.color = e.target.value; })})), field('Độ dày viền', h('input', {type: 'number', value: st.stroke.width, min: 1, max: 20, onchange: (e) => onChange((s) => { s.stroke.width = +e.target.value; })}))));
  if (st.bg) wrap.append(h('div', {class: 'cols3'}, field('Màu nền', h('input', {type: 'color', value: st.bg.color, onchange: (e) => onChange((s) => { s.bg.color = e.target.value; })})), field('Độ đậm nền', h('input', {type: 'range', min: 0, max: 1, step: 0.05, value: st.bg.opacity ?? 0.75, oninput: (e) => onChange((s) => { s.bg.opacity = +e.target.value; })})), field('Bo góc', h('input', {type: 'number', value: st.bg.radius ?? 14, onchange: (e) => onChange((s) => { s.bg.radius = +e.target.value; })}))));
  return wrap;
}
const posEditor = (pos, onChange) => h('div', {},
  h('div', {class: 'row', style: 'margin-bottom:8px;flex-wrap:wrap'}, ...[['Trên', 0.14], ['Giữa', 0.5], ['Dưới', 0.82], ['Sát đáy', 0.9]].map(([l, y]) => h('button', {class: 'small', onclick: () => onChange((p) => { p.y = y; p.x = 0.5; })}, l))),
  h('div', {class: 'cols2'},
    field(`Ngang X: ${Math.round((pos.x ?? 0.5) * 100)}%`, h('input', {type: 'range', min: 0, max: 1, step: 0.01, value: pos.x ?? 0.5, oninput: (e) => onChange((p) => { p.x = +e.target.value; }, false)})),
    field(`Dọc Y: ${Math.round((pos.y ?? 0.82) * 100)}%`, h('input', {type: 'range', min: 0, max: 1, step: 0.01, value: pos.y ?? 0.82, oninput: (e) => onChange((p) => { p.y = +e.target.value; }, false)}))));

// — Tiêu đề —
function tabTitles(B) {
  const T = S.project.titles || (S.project.titles = []);
  B.append(h('div', {class: 'hint'}, 'Chữ phủ lên video (tiêu đề, chú thích, CTA…). Hiện trên mọi tỉ lệ; vị trí tính theo % khung nên tự vừa 16:9 / 9:16 / 1:1.'));
  B.append(h('div', {class: 'row', style: 'margin-bottom:10px'}, h('button', {class: 'primary', onclick: () => {
    const t0 = +secNow().toFixed(2);
    const id = 't' + Math.random().toString(36).slice(2, 7);
    commit((p) => { (p.titles ||= []).push({id, text: 'Tiêu đề *mới*', start: t0, end: +(t0 + 2.5).toFixed(2), anim: 'rise', out: 'fade', style: {font: 'Be Vietnam Pro', weight: 800, size: S.ratio === '16:9' ? 72 : 80, color: '#FFFFFF', highlight: '#08DDA4', shadow: true}, pos: {x: 0.5, y: 0.82}, maxWidth: 0.86}); });
    S.titleSel = id; renderTab();
  }}, '＋ Thêm tiêu đề tại vị trí đang xem')));
  for (const t of [...T].sort((a, b) => a.start - b.start)) B.append(h('div', {class: 'item' + (t.id === S.titleSel ? ' on' : ''), onclick: () => { S.titleSel = t.id; S.playerApi?.seek(Math.round((t.start + 0.4) * S.fps)); renderTab(); }}, h('span', {class: 't'}, `${fmtT(t.start)}–${fmtT(t.end)}`), h('span', {class: 'x'}, t.text)));
  const t = T.find((x) => x.id === S.titleSel); if (!t) return;
  const upd = (fn, rerender = true) => { commit((p) => fn(p.titles.find((x) => x.id === t.id)), {rerender}); if (rerender) renderTab(); };
  const g = h('div', {class: 'group'}, h('h4', {}, 'Sửa tiêu đề', h('button', {class: 'small danger', onclick: () => { commit((p) => { p.titles = p.titles.filter((x) => x.id !== t.id); }); S.titleSel = null; renderTab(); }}, 'Xoá')));
  const ta = h('textarea', {rows: 2}); ta.value = t.text;
  let first = true; ta.oninput = () => { if (first) { S.hist.push(JSON.stringify(S.project)); S.fut = []; first = false; } t.text = ta.value; afterChange(true, false); }; ta.onblur = () => { first = true; renderScrub(); };
  g.append(field('Nội dung', ta, 'Dùng *chữ* để tô màu nhấn, / để xuống dòng.'));
  g.append(h('div', {class: 'cols2'},
    field('Bắt đầu (giây)', h('div', {class: 'row'}, h('input', {type: 'number', step: '0.1', value: t.start, onchange: (e) => upd((x) => { x.start = +e.target.value; })}), h('button', {class: 'small', title: 'Lấy thời điểm đang xem', onclick: () => upd((x) => { x.start = +secNow().toFixed(2); })}, '⌖'))),
    field('Kết thúc (giây)', h('div', {class: 'row'}, h('input', {type: 'number', step: '0.1', value: t.end, onchange: (e) => upd((x) => { x.end = +e.target.value; })}), h('button', {class: 'small', title: 'Lấy thời điểm đang xem', onclick: () => upd((x) => { x.end = +secNow().toFixed(2); })}, '⌖')))));
  g.append(h('div', {class: 'cols2'},
    field('Hiệu ứng vào', h('select', {onchange: (e) => upd((x) => { x.anim = e.target.value; })}, ...Object.entries(ANIMS).map(([k, l]) => h('option', {value: k, selected: (t.anim || 'rise') === k}, l)))),
    field('Hiệu ứng ra', h('select', {onchange: (e) => upd((x) => { x.out = e.target.value; })}, ...[['fade', 'Mờ dần'], ['rise', 'Bay lên'], ['none', 'Cắt']].map(([k, l]) => h('option', {value: k, selected: (t.out || 'fade') === k}, l))))));
  g.append(styleEditor(t.style || {}, (fn) => upd((x) => { x.style ||= {}; fn(x.style); })));
  g.append(posEditor(t.pos || {}, (fn, rr = true) => upd((x) => { x.pos ||= {x: 0.5, y: 0.82}; fn(x.pos); }, rr)));
  g.append(field(`Chiều rộng tối đa: ${Math.round((t.maxWidth ?? 0.86) * 100)}%`, h('input', {type: 'range', min: 0.3, max: 1, step: 0.02, value: t.maxWidth ?? 0.86, oninput: (e) => upd((x) => { x.maxWidth = +e.target.value; }, false)})));
  g.append(h('div', {class: 'row'}, h('span', {class: 'muted', style: 'font-size:12.5px'}, 'Chỉ hiện ở:'), ...RATIOS.map((r) => h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !t.formats?.length || t.formats.includes(r), onchange: (e) => upd((x) => { const cur = x.formats?.length ? x.formats : [...RATIOS]; x.formats = e.target.checked ? [...new Set([...cur, r])] : cur.filter((q) => q !== r); if (x.formats.length === 3) x.formats = []; })}), r))));
  B.append(g);
}

// — Ảnh chèn (overlays) —
const OV_ANIMS = {fade: 'Mờ dần', pop: 'Bật (pop)', rise: 'Trồi lên', 'slide-left': 'Trượt từ phải', 'slide-right': 'Trượt từ trái', zoom: 'Thu nhỏ vào', draw: 'Vẽ nét (chỉ dẫn)', none: 'Không'};
const KIND = {image: '🖼', sticker: '➜', lottie: '✦'};
const GRID9 = [[0.12, 0.1], [0.5, 0.1], [0.88, 0.1], [0.12, 0.5], [0.5, 0.5], [0.88, 0.5], [0.12, 0.88], [0.5, 0.88], [0.88, 0.88]];
const GRID9_L = ['↖', '↑', '↗', '←', '•', '→', '↙', '↓', '↘'];
function newOverlay(kind, preset) {
  const t0 = +secNow().toFixed(2); const id = 'o' + Math.random().toString(36).slice(2, 7);
  const base = {id, kind, start: t0, end: +(t0 + 3).toFixed(2), pos: {x: 0.5, y: 0.5}, width: 0.25, opacity: 1, anim: 'fade', out: 'fade', layer: 'under'};
  const o = kind === 'sticker' ? {...base, sticker: 'arrow', color: '#08DDA4', stroke: 6, width: 0.14, anim: 'draw', label: 'Chỉ dẫn'}
    : kind === 'lottie' ? {...base, src: '', loop: true, speed: 1, width: 0.3, anim: 'pop', label: 'Lottie'}
    : preset === 'watermark' ? {...base, src: '', whole: true, pos: {x: 0.88, y: 0.9}, width: 0.12, opacity: 0.35, anim: 'none', out: 'none', layer: 'top', label: 'Watermark'}
    : {...base, src: '', anim: 'pop', shadow: true, label: 'Ảnh / logo'};
  commit((p) => { (p.overlays ||= []).push(o); });
  S.ovSel = id; renderTab();
}
function tabOverlays(B) {
  const L = S.project.overlays || [];
  B.append(h('div', {class: 'hint'}, 'Chèn ảnh, logo, watermark, mũi tên/vòng khoanh chỉ dẫn hoặc animation Lottie lên video. ', h('b', {}, 'Kéo chấm xanh trên khung xem'), ' để đặt vị trí (hoặc nháy đúp vào khung xem).'));
  B.append(h('div', {class: 'row', style: 'flex-wrap:wrap;margin-bottom:10px'},
    h('button', {class: 'primary', onclick: () => newOverlay('image')}, '＋ Ảnh / logo'),
    h('button', {onclick: () => newOverlay('image', 'watermark'), title: 'Logo mờ ở góc, hiện suốt video'}, '＋ Watermark'),
    h('button', {onclick: () => newOverlay('sticker'), title: 'Mũi tên, vòng khoanh, tick, chạm, vuốt lên… đổi được màu'}, '＋ Chỉ dẫn'),
    h('button', {onclick: () => newOverlay('lottie'), title: 'File animation .json (LottieFiles.com)'}, '＋ Lottie')));
  for (const o of [...L].sort((a, b) => (a.whole ? -1 : a.start) - (b.whole ? -1 : b.start))) B.append(h('div', {class: 'item' + (o.id === S.ovSel ? ' on' : ''), onclick: () => { S.ovSel = o.id; if (!o.whole) S.playerApi?.seek(Math.round((o.start + 0.6) * S.fps)); renderTab(); }},
    h('span', {class: 't'}, o.whole ? 'suốt video' : `${fmtT(o.start)}–${fmtT(o.end)}`), h('span', {}, KIND[o.kind]), h('span', {class: 'x'}, o.label || o.src || o.sticker)));
  const o = L.find((x) => x.id === S.ovSel); if (!o) return;
  const upd = (fn, rerender = true) => { commit((p) => fn(p.overlays.find((x) => x.id === o.id)), {rerender}); if (rerender) renderTab(); else renderHandles(); };
  const g = h('div', {class: 'group'}, h('h4', {}, `${KIND[o.kind]} Sửa ${o.kind === 'sticker' ? 'chỉ dẫn' : o.kind === 'lottie' ? 'Lottie' : 'ảnh'}`, h('span', {},
    h('button', {class: 'small', onclick: () => { const c = {...clone(o), id: 'o' + Math.random().toString(36).slice(2, 7), pos: {x: Math.min(0.95, (o.pos?.x ?? 0.5) + 0.05), y: Math.min(0.95, (o.pos?.y ?? 0.5) + 0.05)}}; commit((p) => { p.overlays.push(c); }); S.ovSel = c.id; renderTab(); }}, 'Nhân bản'), ' ',
    h('button', {class: 'small danger', onclick: () => { commit((p) => { p.overlays = p.overlays.filter((x) => x.id !== o.id); }); S.ovSel = null; renderTab(); }}, 'Xoá'))));
  g.append(field('Tên (để quản lý)', h('input', {value: o.label || '', onchange: (e) => upd((x) => { x.label = e.target.value; })})));
  if (o.kind === 'image') g.append(field('File ảnh (PNG nền trong suốt, JPG, SVG, WebP, GIF)', h('div', {class: 'row'}, assetSelect(o.src, 'img', (v) => upd((x) => { x.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('img', 'image/*'); if (pth) upd((x) => { x.src = pth; }); }}, 'Tải lên…')), 'Logo/watermark nên dùng PNG hoặc SVG nền trong suốt.'));
  if (o.kind === 'lottie') {
    g.append(field('File Lottie (.json)', h('div', {class: 'row'}, assetSelect(o.src, 'lottie', (v) => upd((x) => { x.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('lottie', '.json,application/json'); if (pth) upd((x) => { x.src = pth; }); }}, 'Tải lên…')), 'Tải file "Lottie JSON" miễn phí ở LottieFiles.com (không dùng .lottie nén). Kiểm tra giấy phép trước khi dùng cho khách.'));
    g.append(h('div', {class: 'row', style: 'margin-bottom:8px'}, h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: o.loop !== false, onchange: (e) => upd((x) => { x.loop = e.target.checked; })}), 'Lặp lại'),
      h('span', {class: 'muted', style: 'font-size:12.5px'}, 'Tốc độ'), h('input', {type: 'number', step: '0.1', min: '0.1', max: '4', value: o.speed ?? 1, style: 'width:70px', onchange: (e) => upd((x) => { x.speed = +e.target.value; })})));
  }
  if (o.kind === 'sticker') {
    const list = window.StudioPreview?.stickers || [{id: 'arrow', label: 'Mũi tên'}];
    g.append(h('div', {class: 'cols3'},
      field('Kiểu chỉ dẫn', h('select', {onchange: (e) => upd((x) => { x.sticker = e.target.value; })}, ...list.map((k) => h('option', {value: k.id, selected: k.id === o.sticker}, k.label)))),
      field('Màu', h('input', {type: 'color', value: o.color || '#08DDA4', onchange: (e) => upd((x) => { x.color = e.target.value; })})),
      field('Độ dày nét', h('input', {type: 'number', min: 1, max: 20, value: o.stroke ?? 6, onchange: (e) => upd((x) => { x.stroke = +e.target.value; })}))));
    g.append(h('div', {class: 'row', style: 'margin:-4px 0 8px'}, ...['#08DDA4', '#7667FE', '#FFFFFF', '#FFB547', '#FF5A5F', '#0C0628'].map((c) => h('button', {class: 'small', title: c, style: `width:26px;height:22px;background:${c};border:1px solid #fff3`, onclick: () => upd((x) => { x.color = c; })}))));
  }
  // time
  g.append(h('label', {class: 'chk', style: 'margin-bottom:8px'}, h('input', {type: 'checkbox', checked: !!o.whole, onchange: (e) => upd((x) => { x.whole = e.target.checked; })}), 'Hiện suốt video (watermark / logo góc)'));
  if (!o.whole) g.append(h('div', {class: 'cols2'},
    field('Bắt đầu (giây)', h('div', {class: 'row'}, h('input', {type: 'number', step: '0.1', value: o.start, onchange: (e) => upd((x) => { x.start = +e.target.value; })}), h('button', {class: 'small', title: 'Lấy thời điểm đang xem', onclick: () => upd((x) => { x.start = +secNow().toFixed(2); })}, '⌖'))),
    field('Kết thúc (giây)', h('div', {class: 'row'}, h('input', {type: 'number', step: '0.1', value: o.end, onchange: (e) => upd((x) => { x.end = +e.target.value; })}), h('button', {class: 'small', title: 'Lấy thời điểm đang xem', onclick: () => upd((x) => { x.end = +secNow().toFixed(2); })}, '⌖')))));
  // position & size
  g.append(h('div', {class: 'row', style: 'align-items:flex-start;gap:14px'},
    h('div', {}, h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Vị trí nhanh'), h('div', {class: 'grid9'}, ...GRID9.map(([x, y], i) => h('button', {onclick: () => upd((q) => { q.pos = {x, y}; })}, GRID9_L[i])))),
    h('div', {style: 'flex:1'},
      field(`Ngang X: ${Math.round((o.pos?.x ?? 0.5) * 100)}%`, h('input', {type: 'range', min: 0, max: 1, step: 0.005, value: o.pos?.x ?? 0.5, oninput: (e) => upd((q) => { q.pos = {...(q.pos || {y: 0.5}), x: +e.target.value}; }, false)})),
      field(`Dọc Y: ${Math.round((o.pos?.y ?? 0.5) * 100)}%`, h('input', {type: 'range', min: 0, max: 1, step: 0.005, value: o.pos?.y ?? 0.5, oninput: (e) => upd((q) => { q.pos = {...(q.pos || {x: 0.5}), y: +e.target.value}; }, false)})))));
  g.append(h('div', {class: 'cols2'},
    field(`Kích thước: ${Math.round((o.width ?? 0.2) * 1080)} px (khung Full HD)`, h('input', {type: 'range', min: 0.02, max: 1.8, step: 0.005, value: o.width ?? 0.2, oninput: (e) => upd((q) => { q.width = +e.target.value; }, false)})),
    field(`Độ đậm: ${Math.round((o.opacity ?? 1) * 100)}%`, h('input', {type: 'range', min: 0.05, max: 1, step: 0.05, value: o.opacity ?? 1, oninput: (e) => upd((q) => { q.opacity = +e.target.value; }, false)}))));
  g.append(h('div', {class: 'cols2'},
    field(`Xoay: ${o.rotate || 0}°`, h('input', {type: 'range', min: -180, max: 180, step: 1, value: o.rotate || 0, oninput: (e) => upd((q) => { q.rotate = +e.target.value; }, false)})),
    o.kind === 'image' ? field(`Bo góc: ${o.radius || 0}px`, h('input', {type: 'range', min: 0, max: 200, step: 2, value: o.radius || 0, oninput: (e) => upd((q) => { q.radius = +e.target.value; }, false)})) : h('div')));
  g.append(h('div', {class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px'},
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!o.shadow, onchange: (e) => upd((q) => { q.shadow = e.target.checked; })}), 'Đổ bóng'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !!o.flip, onchange: (e) => upd((q) => { q.flip = e.target.checked; })}), 'Lật ngang'),
    h('label', {class: 'chk', title: 'Phập phồng nhẹ theo nhịp nhạc'}, h('input', {type: 'checkbox', checked: !!o.pulse, onchange: (e) => upd((q) => { q.pulse = e.target.checked; })}), 'Nhịp đập')));
  g.append(h('div', {class: 'cols3'},
    field('Hiệu ứng vào', h('select', {onchange: (e) => upd((q) => { q.anim = e.target.value; })}, ...Object.entries(OV_ANIMS).filter(([k]) => k !== 'draw' || o.kind === 'sticker').map(([k, l]) => h('option', {value: k, selected: (o.anim || 'fade') === k}, l)))),
    field('Hiệu ứng ra', h('select', {onchange: (e) => upd((q) => { q.out = e.target.value; })}, ...[['fade', 'Mờ dần'], ['none', 'Cắt']].map(([k, l]) => h('option', {value: k, selected: (o.out || 'fade') === k}, l)))),
    field('Lớp', h('select', {onchange: (e) => upd((q) => { q.layer = e.target.value; })}, h('option', {value: 'under', selected: (o.layer || 'under') === 'under'}, 'Dưới tiêu đề'), h('option', {value: 'top', selected: o.layer === 'top'}, 'Trên cùng')))));
  g.append(h('div', {class: 'row'}, h('span', {class: 'muted', style: 'font-size:12.5px'}, 'Chỉ hiện ở:'), ...RATIOS.map((r) => h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: !o.formats?.length || o.formats.includes(r), onchange: (e) => upd((x) => { const cur = x.formats?.length ? x.formats : [...RATIOS]; x.formats = e.target.checked ? [...new Set([...cur, r])] : cur.filter((q) => q !== r); if (x.formats.length === 3) x.formats = []; })}), r))));
  B.append(g);
}

// — drag handles on the preview (overlays / titles / subtitles) —
function dragTarget() {
  if (!S.project) return null;
  if (S.tab === 'overlays') { const o = (S.project.overlays || []).find((x) => x.id === S.ovSel); return o && {get: () => o.pos || {x: 0.5, y: 0.5}, set: (p, pos) => { p.overlays.find((x) => x.id === o.id).pos = pos; }, label: o.label || 'Ảnh', w: (o.width ?? 0.2) * (S.ratio === '16:9' ? 1080 / 1920 : 1)}; }
  if (S.tab === 'titles') { const t = (S.project.titles || []).find((x) => x.id === S.titleSel); return t && {get: () => t.pos || {x: 0.5, y: 0.82}, set: (p, pos) => { p.titles.find((x) => x.id === t.id).pos = pos; }, label: 'Tiêu đề'}; }
  if (S.tab === 'subs' && S.project.subtitles?.enabled) return {get: () => S.project.subtitles.pos || {x: 0.5, y: 0.88}, set: (p, pos) => { p.subtitles.pos = pos; }, label: 'Phụ đề'};
  return null;
}
function renderHandles() {
  const L = $('#dragLayer'); if (!L) return; L.innerHTML = '';
  const T = dragTarget(); L.classList.toggle('on', !!T); if (!T) return;
  const pos = T.get();
  if (T.w) L.append(h('div', {class: 'hbox', style: `left:${(pos.x - T.w / 2) * 100}%;width:${T.w * 100}%;top:${pos.y * 100}%;height:0`}));
  const hd = h('div', {class: 'handle', style: `left:${pos.x * 100}%;top:${pos.y * 100}%`, title: 'Kéo để di chuyển'}, h('b', {}, T.label));
  L.append(hd);
  const toPos = (ev) => { const r = L.getBoundingClientRect(); return {x: +Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)).toFixed(3), y: +Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)).toFixed(3)}; };
  hd.onpointerdown = (ev) => {
    ev.preventDefault(); hd.setPointerCapture(ev.pointerId);
    S.hist.push(JSON.stringify(S.project)); S.fut = [];
    const mv = (e2) => { const p = toPos(e2); T.set(S.project, p); hd.style.left = p.x * 100 + '%'; hd.style.top = p.y * 100 + '%'; const b = $('.hbox', L); if (b) { b.style.left = (p.x - T.w / 2) * 100 + '%'; b.style.top = p.y * 100 + '%'; } afterChange(true, false); };
    const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); renderTab(); };
    hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up);
  };
  L.ondblclick = (ev) => { if (ev.target !== L) return; commit((p) => T.set(p, toPos(ev)), {rerender: false}); renderTab(); };
}

// — Phụ đề —
const parseSRT = (srt) => { const toS = (x) => { const [a, b, c] = x.trim().replace(',', '.').split(':'); return +a * 3600 + +b * 60 + parseFloat(c); }; return srt.replace(/\r/g, '').split(/\n\n+/).map((b) => b.split('\n')).filter((l) => l.length >= 2 && l.some((x) => x.includes('-->'))).map((l) => { const i = l.findIndex((x) => x.includes('-->')); const [a, b] = l[i].split('-->'); return {start: +toS(a).toFixed(3), end: +toS(b).toFixed(3), text: l.slice(i + 1).join(' / ').trim()}; }); };
function tabSubs(B) {
  const sub = S.project.subtitles || (S.project.subtitles = {enabled: false, items: [], anim: 'karaoke', style: {font: 'Be Vietnam Pro', weight: 700, color: '#FFFFFF', highlight: '#08DDA4', shadow: true}});
  const upd = (fn, rr = true) => { commit((p) => fn(p.subtitles), {rerender: rr}); if (rr) renderTab(); };
  B.append(h('div', {class: 'hint'}, 'Phụ đề chạy theo thời gian (nhập file .srt từ CapCut/Premiere/Whisper, hoặc gõ tay). Hiệu ứng karaoke tô từng chữ.'));
  B.append(h('div', {class: 'group'}, h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: sub.enabled, onchange: (e) => upd((s) => { s.enabled = e.target.checked; })}), h('b', {}, 'Bật phụ đề')),
    h('div', {class: 'row', style: 'margin-top:10px'},
      h('button', {onclick: () => { const fp = $('#filePick'); fp.accept = '.srt,.txt'; fp.value = ''; fp.onchange = async () => { const txt = await fp.files[0].text(); const items = parseSRT(txt); if (!items.length) return toast('File không đúng định dạng SRT', true); upd((s) => { s.items = items; s.enabled = true; }); toast(`Đã nhập ${items.length} dòng phụ đề`); }; fp.click(); }}, 'Nhập .srt…'),
      h('button', {onclick: () => { const t0 = +secNow().toFixed(2); upd((s) => { s.items.push({start: t0, end: +(t0 + 2).toFixed(2), text: 'Phụ đề mới'}); s.items.sort((a, b) => a.start - b.start); s.enabled = true; }); }}, '＋ Thêm dòng tại vị trí đang xem'),
      h('button', {class: 'danger', onclick: () => confirm('Xoá hết phụ đề?') && upd((s) => { s.items = []; })}, 'Xoá hết'))));
  const list = h('div', {class: 'group'}, h('h4', {}, `Các dòng (${sub.items.length})`));
  sub.items.forEach((c, i) => {
    const ta = h('input', {value: c.text, onchange: (e) => upd((s) => { s.items[i].text = e.target.value; }, false)});
    list.append(h('div', {class: 'row', style: 'margin-bottom:6px'},
      h('input', {type: 'number', step: '0.1', value: c.start, style: 'width:70px', onchange: (e) => upd((s) => { s.items[i].start = +e.target.value; }, false)}),
      h('input', {type: 'number', step: '0.1', value: c.end, style: 'width:70px', onchange: (e) => upd((s) => { s.items[i].end = +e.target.value; }, false)}),
      ta, h('button', {class: 'small', title: 'Xem', onclick: () => S.playerApi?.seek(Math.round((c.start + 0.2) * S.fps))}, '▶'), h('button', {class: 'small danger', onclick: () => upd((s) => { s.items.splice(i, 1); })}, '✕')));
  });
  B.append(list);
  const g = h('div', {class: 'group'}, h('h4', {}, 'Kiểu chữ phụ đề'));
  g.append(field('Hiệu ứng', h('select', {onchange: (e) => upd((s) => { s.anim = e.target.value; })}, ...[['karaoke', 'Karaoke (tô từng chữ)'], ['highlight', 'Nền highlight từng chữ'], ['words', 'Từng chữ hiện dần'], ['fade', 'Mờ dần'], ['pop', 'Bật (pop)'], ['none', 'Không']].map(([k, l]) => h('option', {value: k, selected: (sub.anim || 'karaoke') === k}, l)))));
  g.append(styleEditor(sub.style || {}, (fn) => upd((s) => { s.style ||= {}; fn(s.style); })));
  g.append(posEditor(sub.pos || {x: 0.5, y: S.ratio === '9:16' ? 0.72 : 0.88}, (fn, rr = true) => upd((s) => { s.pos ||= {x: 0.5, y: 0.88}; fn(s.pos); }, rr)));
  B.append(g);
}

// — Âm thanh —
function tabAudio(B) {
  const a = S.project.audio || (S.project.audio = {mode: 'layers', music: {src: '', gain: -4, edit: [], fadeOut: 2.5}, cues: []});
  a.music ||= {src: '', gain: -4, edit: [], fadeOut: 2.5}; a.cues ||= [];
  const upd = (fn, rr = true) => { commit((p) => fn(p.audio), {rerender: rr}); if (rr) renderTab(); };
  const g = h('div', {class: 'group'}, h('h4', {}, 'Chế độ âm thanh'));
  g.append(h('div', {class: 'seg', style: 'margin-bottom:10px'}, ...[['premix', 'File mix sẵn'], ['layers', 'Ghép lớp (live)'], ['none', 'Tắt tiếng']].map(([k, l]) => h('button', {class: a.mode === k ? 'on' : '', onclick: () => upd((x) => { x.mode = k; })}, l))));
  g.append(h('div', {class: 'hint'}, a.mode === 'premix' ? 'Phát 1 file đã mix hoàn chỉnh (nhạc + SFX). Nếu đổi thời lượng cảnh, file không tự thay đổi → dùng "Ghép lớp".' : a.mode === 'layers' ? 'Studio tự ghép nhạc nền + hiệu ứng âm thanh (SFX) theo thời gian — đổi thời lượng cảnh là âm thanh đi theo.' : 'Video không có tiếng.'));
  if (a.mode === 'premix') g.append(field('File mix', h('div', {class: 'row'}, assetSelect(a.premix, 'audio', (v) => upd((x) => { x.premix = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('audio', 'audio/*'); if (pth) upd((x) => { x.premix = pth; }); }}, 'Tải lên…'))));
  B.append(g);
  if (a.mode === 'layers') {
    const m = h('div', {class: 'group'}, h('h4', {}, 'Nhạc nền'));
    m.append(field('File nhạc', h('div', {class: 'row'}, assetSelect(a.music.src, 'audio', (v) => upd((x) => { x.music.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('audio', 'audio/*'); if (pth) upd((x) => { x.music.src = pth; }); }}, 'Tải lên…'))));
    m.append(h('div', {class: 'cols2'},
      field(`Âm lượng nhạc: ${a.music.gain ?? -4} dB`, h('input', {type: 'range', min: -30, max: 6, step: 1, value: a.music.gain ?? -4, onchange: (e) => upd((x) => { x.music.gain = +e.target.value; })})),
      field('Nhỏ dần cuối video (giây)', h('input', {type: 'number', step: '0.5', value: a.music.fadeOut ?? 2.5, onchange: (e) => upd((x) => { x.music.fadeOut = +e.target.value; })}))));
    m.append(field('Cắt/ghép nhạc (giây gốc) — mỗi dòng: bắt_đầu, kết_thúc, crossfade', (() => { const ta = h('textarea', {rows: 3, placeholder: '0, 52.03, 0.02\n68.03, 77.03, 0.02'}); ta.value = (a.music.edit || []).map((e) => e.join(', ')).join('\n'); ta.onchange = () => upd((x) => { x.music.edit = ta.value.split('\n').map((l) => l.split(/[,;\s]+/).filter(Boolean).map(Number)).filter((r) => r.length >= 2 && r.every((n) => !isNaN(n))); }); return ta; })(), 'Để trống = phát nhạc từ đầu. Cắt đúng đầu ô nhịp để không bị giật (xem "Phân tích nhịp").'));
    m.append(h('button', {onclick: async () => {
      if (!a.music.src) return toast('Chọn file nhạc trước', true);
      toast('Đang phân tích nhạc…'); try { S.analysis = await api(`/api/audio/analyze?id=${S.id}&file=${encodeURIComponent(a.music.src)}`); renderTab(); } catch (e) { toast(e.message, true); }
    }}, '♫ Phân tích nhịp (BPM, drop, final hit)'));
    if (S.analysis) {
      const an = S.analysis;
      m.append(h('div', {style: 'margin-top:10px;font-size:12.5px'},
        h('div', {}, h('b', {}, `${an.bpm} BPM`), ` · phách đầu ${an.offset}s · dài ${an.duration}s`),
        h('div', {class: 'energy', title: 'Năng lượng từng ô nhịp (xanh = có trống kick)'}, ...an.bars.map((b) => h('i', {class: b.kick > 0.6 ? 'k' : '', style: `height:${Math.max(4, b.energy * 100)}%`, title: `ô ${b.bar} · ${b.t}s`}))),
        ...an.drops.map((d, i) => h('div', {}, `DROP ${i + 1}: ${d.t}s (khung ${d.frame})`)),
        ...an.breaks.map((b) => h('div', {class: 'muted'}, `Break: ${(b.from.frame / 30).toFixed(2)}s → ${(b.to.frame / 30).toFixed(2)}s`)),
        h('div', {}, `FINAL HIT: ${an.finalHit.t}s (khung ${an.finalHit.frame}) · lặng sau ~${an.quietAt}s`),
        h('div', {class: 'hint', style: 'margin-top:6px'}, 'Mẹo: đặt điểm cắt cảnh "logo/thông điệp chính" đúng DROP, cảnh kết đúng FINAL HIT.')));
    }
    B.append(m);
    const c = h('div', {class: 'group'}, h('h4', {}, `Hiệu ứng âm thanh (${a.cues.length})`, h('button', {class: 'small', onclick: () => upd((x) => { x.cues.push({t: +secNow().toFixed(2), sfx: 'whoosh_a', gain: -16, label: 'chuyển cảnh'}); x.cues.sort((p, q) => p.t - q.t); })}, '＋ Thêm tại vị trí đang xem')));
    c.append(h('div', {class: 'hint'}, 'Tiết chế: whoosh chỉ ở chuyển chương, typing ở đoạn mở, pop ở CTA.'));
    a.cues.forEach((q, i) => c.append(h('div', {class: 'row', style: 'margin-bottom:6px'},
      h('input', {type: 'number', step: '0.05', value: q.t, style: 'width:78px', title: 'giây', onchange: (e) => upd((x) => { x.cues[i].t = +e.target.value; }, false)}),
      q.src ? h('span', {style: 'width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', title: q.src}, q.src.split('/').pop()) : h('select', {style: 'width:120px', onchange: (e) => upd((x) => { x.cues[i].sfx = e.target.value; }, false)}, ...SFX.map((s) => h('option', {value: s, selected: s === q.sfx}, s))),
      h('input', {type: 'number', step: '1', value: q.gain ?? -10, style: 'width:62px', title: 'dB', onchange: (e) => upd((x) => { x.cues[i].gain = +e.target.value; }, false)}),
      h('input', {value: q.label || '', placeholder: 'ghi chú', onchange: (e) => upd((x) => { x.cues[i].label = e.target.value; }, false)}),
      h('button', {class: 'small', title: 'Nghe thử', onclick: () => new Audio(q.src ? `/proj/${S.id}/public/${q.src}` : `/proj/${S.id}/public/_engine/sfx/${q.sfx}.wav`).play()}, '🔊'),
      h('button', {class: 'small danger', onclick: () => upd((x) => { x.cues.splice(i, 1); })}, '✕'))));
    B.append(c);
    if ((a.voice || []).length) {
      const v = h('div', {class: 'group'}, h('h4', {}, `Thoại (${a.voice.length})`));
      v.append(field(`Nhạc hạ khi có thoại: ${a.duck ?? -9} dB`, h('input', {type: 'range', min: -24, max: 0, step: 1, value: a.duck ?? -9, onchange: (e) => upd((x) => { x.duck = +e.target.value; })})));
      a.voice.forEach((q, i) => v.append(h('div', {class: 'row', style: 'margin-bottom:6px'},
        h('input', {type: 'number', step: '0.05', value: q.t, style: 'width:78px', title: 'giây bắt đầu', onchange: (e) => upd((x) => { x.voice[i].t = +e.target.value; }, false)}),
        h('span', {style: 'width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', title: q.src}, `${q.src.split('/').pop()} · ${(q.len || 0).toFixed(1)}s`),
        h('input', {type: 'number', step: '1', value: q.gain ?? 0, style: 'width:62px', title: 'dB', onchange: (e) => upd((x) => { x.voice[i].gain = +e.target.value; }, false)}),
        h('input', {value: q.label || '', placeholder: 'ghi chú', onchange: (e) => upd((x) => { x.voice[i].label = e.target.value; }, false)}),
        h('button', {class: 'small', title: 'Nghe thử', onclick: () => new Audio(`/proj/${S.id}/public/${q.src}`).play()}, '🔊'))));
      B.append(v);
    }
  }
}

// — Giao diện —
function tabLook(B) {
  const b = S.project.brand || (S.project.brand = {}); b.colors ||= {};
  const look = S.project.look || (S.project.look = {grain: 0.05, vignette: 0.42});
  const upd = (fn) => commit((p) => fn(p), {rerender: false});
  const COLORS = [['mint', 'Màu chính (gradient đầu)', '#08DDA4'], ['purple', 'Màu phụ (gradient cuối)', '#7667FE'], ['navy', 'Nền', '#0C0628'], ['navyDeep', 'Nền sâu', '#06031A'], ['text', 'Chữ', '#F4F2FF'], ['muted', 'Chữ phụ', '#A8A3C9'], ['red', 'Màu cảnh báo', '#FF5A5F']];
  const g = h('div', {class: 'group'}, h('h4', {}, 'Màu thương hiệu'), h('div', {class: 'hint'}, 'Áp dụng cho các cảnh dùng màu chung của Studio (nền, chữ, gradient).'));
  g.append(h('div', {class: 'cols2'}, ...COLORS.map(([k, l, d]) => field(l, h('input', {type: 'color', value: b.colors[k] || d, onchange: (e) => upd((p) => { p.brand.colors[k] = e.target.value; })})))));
  g.append(h('button', {class: 'small', onclick: () => { commit((p) => { p.brand.colors = {}; }); renderTab(); }}, 'Về màu mặc định SAMI'));
  B.append(g);
  B.append(h('div', {class: 'group'}, h('h4', {}, 'Hiệu ứng phim'),
    field(`Hạt phim (grain): ${Math.round((look.grain ?? 0.05) * 100)}%`, h('input', {type: 'range', min: 0, max: 0.15, step: 0.005, value: look.grain ?? 0.05, oninput: (e) => upd((p) => { p.look.grain = +e.target.value; })})),
    field(`Tối viền (vignette): ${Math.round((look.vignette ?? 0.42) * 100)}%`, h('input', {type: 'range', min: 0, max: 0.8, step: 0.02, value: look.vignette ?? 0.42, oninput: (e) => upd((p) => { p.look.vignette = +e.target.value; })}))));
  const C = S.state.categories || {}, GL = S.state.goals || {};
  const tn = h('input', {value: S.project.name.replace(/\s*\(.*?\)\s*/g, ' ').trim()}), tc = h('select', {}, ...Object.entries(C).map(([k, l]) => h('option', {value: k}, l))), td = h('textarea', {rows: 2, placeholder: 'VD: 30 giây, 6 cảnh: hook → món đặc trưng → ưu đãi → địa chỉ → CTA.'});
  const tg = h('div', {class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px'}, ...Object.entries(GL).map(([k, l]) => h('label', {class: 'chk'}, h('input', {type: 'checkbox', value: k}), l)));
  B.append(h('div', {class: 'group'}, h('h4', {}, 'Lưu thành mẫu (template)'),
    h('div', {class: 'hint'}, 'Biến video này thành mẫu dùng lại cho khách khác. Studio sao chép cảnh + cài đặt vào thư viện, tạo ảnh bìa và kiểm tra theo chuẩn. ⚠ Nhớ thay ảnh/logo/số liệu thật của khách bằng ảnh minh hoạ.'),
    h('div', {class: 'cols2'}, field('Tên mẫu', tn), field('Nhóm ngành', tc)), h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Mục đích'), tg, field('Mô tả ngắn', td),
    h('button', {class: 'primary', onclick: async () => {
      if (isDirty()) await save();
      try {
        const r = await api('/api/template/from-project', {id: S.id, name: tn.value.trim(), category: tc.value, description: td.value.trim(), goal: $$('input:checked', tg).map((x) => x.value)});
        showCheck('Đã tạo mẫu: ' + r.id, r.check, h('p', {class: 'muted'}, 'Ảnh bìa đang được tạo trong nền (≈ 1 phút). Mẫu nằm ở thư mục templates/' + r.id));
      } catch (e) { toast(e.message, true); }
    }}, '＋ Lưu thành mẫu')));
  B.append(h('div', {class: 'group'}, h('h4', {}, 'Thông tin dự án'),
    field('Tên dự án', h('input', {value: S.project.name, onchange: (e) => { commit((p) => { p.name = e.target.value; }); $('#projTitle').textContent = e.target.value; }})),
    field('Khách hàng', h('input', {value: S.project.client || '', onchange: (e) => commit((p) => { p.client = e.target.value; })})),
    h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Tỉ lệ có bố cục riêng: ' + S.project.formats.join(', ') + '. Tỉ lệ khác sẽ dùng chế độ "vừa khung". Muốn bố cục dọc/vuông riêng: nhờ Claude Code (xem Hướng dẫn mục 12).'),
    h('div', {class: 'muted', style: 'font-size:12.5px;margin-top:6px'}, 'Thư mục: ' + S.dir)));
}

// — Xuất video —
const RES = {FHD: 'Full HD', '2K': '2K', '4K': '4K'};
const dims = (ratio, res) => { const st = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]}[ratio]; const k = {FHD: 1, '2K': 4 / 3, '4K': 2}[res]; return `${Math.round(st[0] * k)}×${Math.round(st[1] * k)}`; };
function tabRender(B) {
  const r = S.render;
  const set = (k, v) => { r[k] = v; renderTab(); };
  const seg = (k, opts) => h('div', {class: 'seg'}, ...opts.map(([v, l]) => h('button', {class: r[k] === v ? 'on' : '', onclick: () => set(k, v)}, l)));
  const cpus = S.state.cpus; const g = S.state.gpu;
  const box = h('div', {class: 'group'}, h('h4', {}, 'Cài đặt xuất'));
  box.append(field('Tỉ lệ khung', seg('ratio', [['16:9', '16:9 Ngang'], ['9:16', '9:16 Dọc'], ['1:1', '1:1 Vuông']]), S.project.formats.includes(r.ratio) ? null : '⚠ Dự án chưa có bố cục riêng cho tỉ lệ này → xuất ở chế độ "vừa khung".'));
  box.append(field('Độ phân giải', seg('res', Object.entries(RES)), dims(r.ratio, r.res) + ' px'));
  box.append(field('Số khung hình / giây (FPS)', seg('fps', [[24, '24 (điện ảnh)'], [30, '30 (chuẩn)'], [60, '60 (siêu mượt)']]), r.fps === 60 ? 'Thời gian render ≈ gấp đôi 30 fps.' : null));
  box.append(field('Định dạng', seg('codec', [['h264', 'MP4 H.264 (phổ biến)'], ['h265', 'MP4 H.265 (nhẹ hơn)'], ['prores', 'ProRes .mov (dựng tiếp)']])));
  if (r.codec !== 'prores') box.append(field(`Chất lượng (CRF ${r.crf}) — số nhỏ = đẹp hơn, file nặng hơn`, h('input', {type: 'range', min: 12, max: 28, step: 1, value: r.crf, oninput: (e) => { r.crf = +e.target.value; e.target.parentElement.firstChild.textContent = `Chất lượng (CRF ${r.crf}) — số nhỏ = đẹp hơn, file nặng hơn`; }}), r.gpu !== 'off' && g.nvenc ? 'Khi mã hoá bằng GPU, chất lượng tính theo bitrate tự động (FHD 16 Mbps, 2K 28, 4K 55).' : null));
  box.append(field(`Số luồng CPU: ${r.threads} / ${cpus}`, h('input', {type: 'range', min: 1, max: cpus, step: 1, value: Math.min(r.threads, cpus), oninput: (e) => { r.threads = +e.target.value; e.target.parentElement.firstChild.textContent = `Số luồng CPU: ${r.threads} / ${cpus}`; }}), 'Nhiều luồng = nhanh hơn nhưng máy nóng/chậm hơn. Mặc định 8.'));
  box.append(field('Tăng tốc GPU', h('div', {class: 'row', style: 'flex-wrap:wrap'}, seg('gpu', [['auto', 'Tự động'], ['off', 'Tắt (chỉ CPU)']]), h('button', {class: 'small', onclick: diagnoseGpu}, '🩺 Chẩn đoán GPU')),
    r.codec === 'prores' ? 'ProRes luôn mã hoá bằng CPU (NVIDIA không có bộ mã hoá ProRes). Muốn dùng GPU → chọn MP4 H.264/H.265.'
    : g.nvenc ? 'NVIDIA NVENC ✓ — GPU mã hoá video, CPU chỉ lo vẽ khung hình.' : 'Chưa chạy được NVENC — bấm "Chẩn đoán GPU" để xem nguyên nhân và cách sửa.'));
  box.append(field('Mức ưu tiên', seg('priority', [['low', 'Thấp (vẫn dùng máy mượt)'], ['normal', 'Bình thường'], ['high', 'Cao']])));
  box.append(h('div', {class: 'row', style: 'flex-wrap:wrap'},
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: r.titles, onchange: (e) => (r.titles = e.target.checked)}), 'Kèm tiêu đề'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: r.subtitles, onchange: (e) => (r.subtitles = e.target.checked)}), 'Kèm phụ đề'),
    h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: r.audio, onchange: (e) => (r.audio = e.target.checked)}), 'Kèm âm thanh')));
  const nameIn = h('input', {value: r.name || S.project.name, onchange: (e) => (r.name = e.target.value)});
  box.append(field('Tên file', nameIn));
  const est = estimateSize(r);
  box.append(h('div', {class: est.warn ? 'v-warn' : 'muted', style: 'font-size:12.5px;margin:-4px 0 8px'}, `Dung lượng ước tính ≈ ${est.label} (${est.mbps} Mbps × ${fmtT(est.sec)})`, est.warn ? h('div', {}, est.warn) : null));
  const go = async (ratios, scope = 'all') => {
    if (isDirty()) await save();
    for (const ratio of ratios) { try { await api('/api/render', {...r, ratio, id: S.id, name: nameIn.value, scope, saveDefaults: true}); } catch (e) { return modal(h('pre', {style: 'white-space:pre-wrap'}, e.message)); } }
    toast(ratios.length > 1 ? `Đã thêm ${ratios.length} bản vào hàng đợi` : 'Đã thêm vào hàng đợi render');
  };
  box.append(h('div', {class: 'row', style: 'flex-wrap:wrap;margin-top:6px'},
    h('button', {class: 'primary', onclick: () => go([r.ratio])}, '▶ Xuất video'),
    h('button', {onclick: () => go(RATIOS), title: 'Xuất 16:9 + 9:16 + 1:1 với cùng cài đặt'}, 'Xuất cả 3 tỉ lệ'),
    h('button', {onclick: () => go([r.ratio], S.scene), title: 'Chỉ xuất cảnh đang chọn'}, `Chỉ cảnh ${S.scene}`),
    h('button', {onclick: () => { r.res = 'FHD'; r.fps = 30; r.crf = 26; r.threads = Math.min(8, cpus); renderTab(); }, title: 'Cài nhanh để xem thử'}, 'Preset: bản nháp nhanh')));
  B.append(box);
  const q = h('div', {class: 'group'}, h('h4', {}, 'Hàng đợi render', h('span', {}, h('button', {class: 'small', onclick: () => api('/api/open', {path: S.dir + (S.state.platform === 'win32' ? '\\out' : '/out')})}, 'Mở thư mục out'), ' ', h('button', {class: 'small', onclick: () => api('/api/render/clear', {})}, 'Dọn xong'), ' ', h('button', {class: 'small danger', title: 'Huỷ mọi lượt đang chạy/đang chờ và tắt hẳn các tiến trình render (kể cả khi bị treo)', onclick: async () => { if (!confirm('Dừng TẤT CẢ lượt render và tắt hẳn các tiến trình render?')) return; try { await api('/api/render/stop-all', {}); toast('Đã dừng tất cả. Các đoạn đã xong được giữ lại — bấm Tiếp tục khi cần.'); } catch (e) { toast('Không gửi được lệnh dừng: ' + e.message + ' — đóng cửa sổ đen của Studio rồi mở lại.', true, 8000); } }}, '⛔ Dừng tất cả'))));
  q.append(h('div', {id: 'connWarn', class: 'v-warn', hidden: true, style: 'font-size:12.5px;margin-bottom:8px'}, '⚠ Mất kết nối với Studio (cửa sổ đen) — trạng thái có thể cũ. Đang thử kết nối lại…'));
  q.id = 'jobBox'; B.append(q); renderJobs();
}
function renderJobs() {
  const q = $('#jobBox'); if (!q) return;
  $$('.job', q).forEach((x) => x.remove());
  if (!S.jobs.length) q.append(h('div', {class: 'job muted'}, 'Chưa có lượt render.'));
  const act = async (url, jobId, okMsg) => { try { await api(url, {jobId}); if (okMsg) toast(okMsg); } catch (e) { toast(e.message + ' — nếu vẫn kẹt: bấm "Dừng tất cả" hoặc đóng cửa sổ đen rồi mở lại Studio.', true, 8000); } };
  for (const j of [...S.jobs].reverse()) {
    const ST = {queued: 'Đang chờ', running: 'Đang render', done: 'Xong ✓', error: 'Lỗi', cancelled: 'Đã huỷ', interrupted: 'Bị ngắt'}[j.status] || j.status;
    q.append(h('div', {class: 'job ' + j.status},
      h('div', {class: 'row'}, h('span', {class: 'st'}, ST), h('span', {style: 'flex:1'}, ` ${j.opts.ratio} · ${j.opts.res} · ${j.opts.fps}fps · ${j.opts.codec}${j.opts.scope && j.opts.scope !== 'all' ? ' · ' + j.opts.scope : ''}`),
        j.status === 'running' || j.status === 'queued' ? h('button', {class: 'small danger', onclick: () => act('/api/render/cancel', j.id)}, 'Huỷ') : null,
        j.canResume ? h('button', {class: 'small', title: 'Làm nốt các đoạn còn lại (không render lại phần đã xong)', onclick: () => act('/api/render/resume', j.id, 'Đã xếp lại vào hàng đợi')}, '↻ Tiếp tục') : null,
        j.status === 'done' ? h('button', {class: 'small', onclick: () => api('/api/open', {path: j.out})}, 'Mở video') : null),
      h('div', {class: 'bar'}, h('i', {style: `width:${Math.round(j.progress * 100)}%`})),
      h('div', {class: 'muted'}, `${Math.round(j.progress * 100)}% · ${j.stage || ''}${j.eta ? ' · còn ~' + fmtT(j.eta) : ''}${j.encoder ? ' · ' + j.encoder : ''}`),
      j.parts > 1 && j.status !== 'done' ? h('div', {class: 'muted'}, `Đã xong ${j.partsDone || 0}/${j.parts} đoạn (mỗi đoạn ~15 giây phim — lỗi/treo chỉ làm lại 1 đoạn)`) : null,
      j.note ? h('div', {class: 'v-warn'}, j.note) : null,
      j.error ? h('div', {class: 'v-fail', style: 'white-space:pre-wrap;max-height:160px;overflow:auto'}, j.error) : null,
      j.out && j.status === 'done' ? h('div', {class: 'muted', style: 'word-break:break-all'}, j.out) : null));
  }
}
// rough output size (label only — real size depends on motion/detail)
function estimateSize(r) {
  const st = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]}[r.ratio]; const k = {FHD: 1, '2K': 4 / 3, '4K': 2}[r.res];
  const px = (st[0] * k * st[1] * k) / (1920 * 1080); const f = +r.fps / 30;
  const gpu = r.gpu !== 'off' && S.state.gpu.nvenc && r.codec !== 'prores';
  let mbps;
  if (r.codec === 'prores') mbps = 220 * px * f;
  else if (gpu) mbps = {FHD: 16, '2K': 28, '4K': 55}[r.res] * (r.codec === 'h265' ? 1 : 1);
  else mbps = 12 * Math.pow(0.87, (+r.crf || 18) - 18) * px * Math.pow(f, 0.6) * (r.codec === 'h265' ? 0.6 : 1);
  const sec = totalSec(); const mb = (mbps * sec) / 8 + (0.32 * sec) / 8;
  const label = mb > 1024 ? (mb / 1024).toFixed(1) + ' GB' : Math.round(mb) + ' MB';
  let warn = null;
  if (r.codec === 'prores' && mb > 2048) warn = 'File rất nặng. ProRes chỉ dùng khi dựng tiếp trong Premiere/DaVinci. Đăng mạng xã hội/gửi khách: chọn MP4 H.264 (+ GPU) — nhanh hơn nhiều, file nhỏ hơn ~20 lần.';
  else if (r.fps === 60 && r.res !== 'FHD') warn = '60 fps + 2K/4K: thời gian render ≈ 4–8 lần bản Full HD 30 fps. Nên duyệt bằng bản nháp trước.';
  return {label, mbps: Math.round(mbps), sec, warn};
}
async function diagnoseGpu() {
  modal(h('div', {}, h('h3', {}, 'Chẩn đoán GPU'), h('p', {class: 'muted'}, 'Đang kiểm tra card đồ hoạ và bộ mã hoá… (≈ 5 giây)')));
  try {
    const d = await api('/api/gpu/diagnose');
    S.state.gpu = {...S.state.gpu, nvenc: d.tests.h264_nvenc.ok, hevc_nvenc: d.tests.hevc_nvenc.ok};
    const row = (k, v) => h('tr', {}, h('td', {style: 'padding:4px 10px 4px 0;color:var(--muted)'}, k), h('td', {}, v));
    modal(h('div', {}, h('h3', {}, 'Chẩn đoán GPU'),
      h('p', {class: d.tests.h264_nvenc.ok ? 'v-ok' : 'v-warn'}, h('b', {}, d.advice)),
      h('table', {style: 'font-size:13px;margin-bottom:10px'},
        row('Card NVIDIA (driver)', d.gpu || 'không tìm thấy nvidia-smi'),
        row('ffmpeg', d.version), row('Có NVENC trong ffmpeg', d.compiled.join(', ') || 'không'),
        row('H.264 NVENC', d.tests.h264_nvenc.ok ? '✓ chạy được' : '✗ lỗi'), row('H.265 NVENC', d.tests.hevc_nvenc.ok ? '✓ chạy được' : '✗ lỗi'), row('CPU x264', d.tests.libx264.ok ? '✓' : '✗')),
      !d.tests.h264_nvenc.ok && d.tests.h264_nvenc.err ? h('details', {}, h('summary', {class: 'muted', style: 'cursor:pointer'}, 'Thông báo lỗi chi tiết (gửi cho Claude nếu cần)'), h('pre', {style: 'white-space:pre-wrap;font-size:11.5px;background:#0A0722;padding:8px;border-radius:8px'}, d.tests.h264_nvenc.err)) : null,
      h('div', {class: 'row', style: 'margin-top:10px'}, h('button', {onclick: diagnoseGpu}, 'Kiểm tra lại'))));
    if (S.tab === 'render') renderTab();
  } catch (e) { modal(h('div', {}, h('h3', {}, 'Chẩn đoán GPU'), h('p', {class: 'v-fail'}, e.message))); }
}

// ─────────────────────────── HISTORY (điểm neo) ───────────────────────────
const keepUndo = () => { try { sessionStorage.setItem('undo_' + S.id, JSON.stringify({hist: S.hist.slice(-40), fut: S.fut.slice(-40)})); } catch {} };
const HKIND = {ai: ['AI', 'Trước một lượt chat với Claude Code'], save: ['Lưu', 'Khi bấm Lưu trong Studio'], open: ['Mở', 'Khi mở dự án'], manual: ['Mốc', 'Mốc bạn tự đặt'], 'before-restore': ['Trước khôi phục', 'Tự lưu ngay trước một lần khôi phục — khôi phục điểm này để hoàn tác'], 'before-upload': ['Trước thay media', 'Tự lưu trước khi một file trùng tên bị ghi đè']};
const fmtBytes = (b) => b > 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
$('#btnHistory').onclick = () => { S.tab = 'history'; $$('#tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === 'history')); renderTab(); };
async function tabHistory(B) {
  const g = h('div', {class: 'group'}, h('h4', {}, 'Đặt mốc (bản ưng ý)'));
  const name = h('input', {placeholder: 'VD: Bản nháp 1 gửi khách, Nhạc mới đã duyệt…'});
  g.append(name, h('div', {class: 'row', style: 'margin-top:8px'}, h('button', {class: 'primary', onclick: async () => {
    if (isDirty()) { if (!confirm('Có thay đổi chưa lưu. Lưu rồi đặt mốc?')) return; await save(); }
    try { const r = await api('/api/history/snapshot', {id: S.id, label: name.value.trim() || 'Mốc ' + new Date().toLocaleString('vi-VN'), starred: true}); toast(`★ Đã đặt mốc · ${r.files} tệp${r.newBytes ? ' · lưu thêm ' + fmtBytes(r.newBytes) : ''}`); renderTab(); } catch (e) { toast(e.message, true); }
  }}, '★ Đặt mốc ngay')),
  h('div', {class: 'hint', style: 'margin:8px 0 0'}, 'Studio tự tạo điểm neo trước mỗi lượt chat với Claude Code, khi mở dự án và khi Lưu (tối đa 2 phút/lần). Mỗi điểm neo chứa toàn bộ dự án: project.json, code cảnh, brief, ảnh, video, âm thanh, Lottie — trừ out/. File không đổi chỉ lưu 1 lần nên rất nhẹ. Mốc ★ không bao giờ bị dọn; điểm tự động giữ 60 cái gần nhất + 1 cái/ngày trong 30 ngày.'));
  B.append(g);
  const L = h('div', {}, h('div', {class: 'muted'}, 'Đang tải lịch sử…')); B.append(L);
  let r; try { r = await api('/api/history?id=' + S.id); } catch (e) { L.innerHTML = ''; L.append(h('div', {class: 'v-fail'}, e.message)); return; }
  if (S.tab !== 'history') return;
  L.innerHTML = '';
  L.append(h('div', {class: 'row', style: 'justify-content:space-between;margin-bottom:8px'}, h('span', {class: 'muted'}, `${r.items.length} điểm neo · kho lịch sử ${fmtBytes(r.bytes)}`), h('button', {class: 'small', onclick: () => renderTab()}, '↻ Làm mới')));
  if (!r.items.length) L.append(h('div', {class: 'muted'}, 'Chưa có điểm neo nào.'));
  let day = '';
  for (const it of r.items) {
    const d = new Date(it.time); const dd = d.toLocaleDateString('vi-VN', {weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'});
    if (dd !== day) { day = dd; L.append(h('div', {class: 'hday'}, dd)); }
    const k = HKIND[it.kind] || [it.kind, ''];
    L.append(h('div', {class: 'hitem' + (it.starred ? ' star' : '')},
      h('div', {class: 'l1'}, h('b', {}, d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit', second: '2-digit'})), h('span', {class: 'hk hk-' + it.kind, title: k[1]}, k[0]), h('span', {class: 'lb', title: it.label}, it.label || ''),
        h('button', {class: 'small', title: it.starred ? 'Bỏ ★ (điểm tự động có thể bị dọn)' : 'Giữ vĩnh viễn', onclick: async () => { await api('/api/history/star', {id: S.id, snap: it.id, starred: !it.starred}); renderTab(); }}, it.starred ? '★' : '☆')),
      h('div', {class: 'l2', title: 'Thay đổi so với điểm neo trước đó'}, '△ ' + it.diff.summary, it.source ? ' · ' + it.source : ''),
      h('div', {class: 'row', style: 'margin-top:6px'},
        h('button', {class: 'small', onclick: () => restoreDlg(it)}, 'Khôi phục…'),
        h('button', {class: 'small', onclick: async () => { const v = prompt('Tên cho điểm neo này:', it.label || ''); if (v == null) return; await api('/api/history/star', {id: S.id, snap: it.id, label: v, starred: true}); renderTab(); }}, 'Đặt tên'))));
  }
}
async function restoreDlg(it) {
  let d; try { d = await api(`/api/history/preview?id=${S.id}&snap=${encodeURIComponent(it.id)}`); } catch (e) { return toast(e.message, true); }
  const rows = [...d.changed.map((f) => [f, 'ghi đè về bản cũ']), ...d.added.map((f) => [f, 'lấy lại (đã bị xoá)']), ...d.removed.map((f) => [f, 'xoá (thêm sau mốc này)'])].sort((a, b) => a[0].localeCompare(b[0]));
  const box = h('div', {class: 'hfiles'});
  const checks = rows.map(([f, what]) => { const c = h('input', {type: 'checkbox', value: f}); box.append(h('label', {class: 'chk', style: 'display:flex;margin:0 0 4px'}, c, h('span', {style: 'color:var(--text)'}, f), h('span', {class: 'muted'}, ' — ' + what))); return c; });
  const go = async (paths) => {
    const msg = (paths ? `Khôi phục ${paths.length} mục đã chọn` : 'Khôi phục TOÀN BỘ dự án') + ` về điểm neo ${new Date(it.time).toLocaleString('vi-VN')}?\n\nTrạng thái hiện tại sẽ được tự lưu thành 1 điểm neo trước, nên bạn luôn quay lại được.` + (isDirty() ? '\n\n⚠ Thay đổi CHƯA LƯU trong Studio sẽ bị bỏ.' : '');
    if (!confirm(msg)) return;
    S.restoring = true;
    try { const r = await api('/api/history/restore', {id: S.id, snap: it.id, paths}); localStorage.removeItem('draft_' + S.id); sessionStorage.removeItem('undo_' + S.id); S.project = null; toast(`Đã khôi phục (${r.written} tệp ghi lại, ${r.deleted} tệp xoá) — đang tải lại…`); setTimeout(() => location.reload(), 700); }
    catch (e) { S.restoring = false; toast(e.message, true, 6000); }
  };
  modal(h('div', {style: 'min-width:min(620px,86vw)'}, h('h3', {}, 'Khôi phục điểm neo'),
    h('p', {class: 'muted', style: 'margin-top:0'}, `${new Date(it.time).toLocaleString('vi-VN')} · ${(HKIND[it.kind] || [it.kind])[0]}${it.label ? ' · ' + it.label : ''}`),
    rows.length ? h('div', {}, h('p', {}, h('b', {}, `${rows.length} mục khác với hiện tại.`), ' Tick từng mục nếu chỉ muốn khôi phục một phần (vd chỉ 1 cảnh hoặc chỉ nhạc):'), box) : h('p', {class: 'v-ok'}, 'Dự án hiện tại giống hệt điểm neo này — không có gì để khôi phục.'),
    h('div', {class: 'row', style: 'margin-top:12px;flex-wrap:wrap'},
      h('button', {class: 'primary', disabled: !rows.length, onclick: () => go(null)}, 'Khôi phục toàn bộ'),
      h('button', {disabled: !rows.length, onclick: () => { const p = checks.filter((c) => c.checked).map((c) => c.value); if (!p.length) return toast('Chưa chọn mục nào', true); go(p); }}, 'Chỉ khôi phục mục đã chọn'))));
}

// ─────────────────────────── LIVE EVENTS ───────────────────────────
let es, lastBeat = Date.now(), pollT = null;
const onJobsData = (list) => { const prev = S.jobs; S.jobs = list; for (const j of S.jobs) { const p = prev.find((x) => x.id === j.id); if (p && p.status !== j.status && j.status === 'done') toast('Render xong: ' + j.out.split(/[\\/]/).pop(), false, 6000); } renderJobs(); };
function connectEvents() {
  es?.close(); es = new EventSource('/api/events'); lastBeat = Date.now();
  const beat = () => { lastBeat = Date.now(); const w = $('#connWarn'); if (w) w.hidden = true; };
  es.addEventListener('ping', beat);
  es.addEventListener('template', (e) => { const d = JSON.parse(e.data); toast(d.thumbs ? `Đã tạo ảnh bìa cho mẫu ${d.tpl}` : `Tạo ảnh bìa mẫu ${d.tpl} lỗi: ${d.error || ''}`, !d.thumbs, 6000); });
  es.addEventListener('jobs', (e) => { beat(); onJobsData(JSON.parse(e.data)); });
  es.addEventListener('code', (e) => { const d = JSON.parse(e.data); if (d.id !== S.id) return; if (d.error) showBundleError(d.error); else { toast('Code cảnh vừa thay đổi — đang tải lại preview…'); keepUndo(); setTimeout(() => location.reload(), 600); } });
  es.addEventListener('restored', (e) => { const d = JSON.parse(e.data); if (d.id !== S.id || S.restoring) return; if (!isDirty()) { toast('Dự án vừa được khôi phục về điểm neo cũ — đang tải lại…'); setTimeout(() => location.reload(), 600); } else toast('Dự án vừa được khôi phục ở nơi khác — lưu ý: bạn đang có thay đổi chưa lưu', true, 8000); });
  es.addEventListener('project', async (e) => { const d = JSON.parse(e.data); if (d.id !== S.id || isDirty()) return; const r = await api('/api/project/open', {id: S.id}); if (JSON.stringify(r.project) !== S.saved) { S.project = r.project; S.saved = JSON.stringify(r.project); pushPreview(); renderAll(); toast('project.json được cập nhật từ bên ngoài (Claude Code?) — đã tải lại'); } });
  clearInterval(pollT);
  pollT = setInterval(async () => { // watchdog for the live connection: no heartbeat for 25 s → warn + poll + reconnect
    if (Date.now() - lastBeat < 25000) return;
    const w = $('#connWarn'); if (w) w.hidden = false;
    try { onJobsData(await api('/api/jobs')); lastBeat = Date.now() - 20000; es.close(); connectEvents(); } catch {}
  }, 5000);
}

// ─────────────────────────── BOOT ───────────────────────────
(async () => {
  await loadHome();
  const m = location.hash.match(/p=([0-9a-f]{10})/);
  if (m) openProject({id: m[1]});
})();
