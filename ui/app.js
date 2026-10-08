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
const RATIO_LABEL = {'16:9': '16:9 Ngang', '9:16': '9:16 Dọc', '1:1': '1:1 Vuông', '4:5': '4:5 Feed'};
// carousel projects are 4:5 only; 4:5 is offered whenever a project has a 4:5 layout
const ratioList = () => (S.project?.type === 'carousel' ? ['4:5'] : [...RATIOS, ...((S.project?.formats || []).includes('4:5') ? ['4:5'] : [])]);

const S = {state: null, id: null, dir: null, project: null, saved: null, hist: [], fut: [], scene: null, ratio: '16:9', playerApi: null, frame: 0, total: 1, playing: false, tab: 'text', titleSel: null, subSel: null, assets: [], analysis: null, jobs: [], fps: 30};

// ─────────────────────────── HOME ───────────────────────────
async function loadHome() {
  S.state = await api('/api/state');
  $('#ver').textContent = 'v' + S.state.version;
  const rc = $('#recent'); rc.innerHTML = '';
  if (!S.state.recent.length) rc.append(h('div', {class: 'muted'}, 'Chưa có dự án. Tạo mới bên dưới hoặc mở một thư mục có project.json.'));
  S.sel = new Set([...(S.sel || [])].filter((id) => S.state.recent.some((r) => r.id === id))); renderSelBar();
  for (const r of S.state.recent) rc.append(h('div', {class: 'card' + (S.sel.has(r.id) ? ' picked' : ''), onclick: () => (S.sel.size ? toggleSel(r.id) : openProject({id: r.id}))},
    h('input', {type: 'checkbox', class: 'cardChk', title: 'Chọn (để xoá / gỡ nhiều dự án)', checked: S.sel.has(r.id), onclick: (e) => { e.stopPropagation(); toggleSel(r.id); }}),
    h('div', {class: 'row', style: 'justify-content:space-between'}, h('b', {}, r.name || 'Dự án'), r.type === 'carousel' ? h('span', {class: 'badge'}, 'Carousel') : null, statusBadge(r.status)), r.lockedBy ? h('div', {class: 'v-warn', style: 'font-size:12px'}, `🔒 ${r.lockedBy.user} đang mở (${r.lockedBy.host})`) : null, h('small', {}, r.dir), h('div', {class: 'muted', style: 'font-size:12px;margin-top:6px'}, r.opened ? 'Mở lần cuối: ' + new Date(r.opened).toLocaleString('vi-VN') : 'Dự án mẫu')));
  const sel = $('#npTemplate'); sel.innerHTML = '';
  for (const t of S.state.templates) sel.append(h('option', {value: t.id}, `${t.name} — ${t.scenes} cảnh, ${t.seconds}s, ${t.formats.join(' / ')}`));
  renderGallery(); renderTeam();
  $('#npLocation').value = S.state.projectsRoot;
  const g = S.state.gpu;
  $('#sysInfo').textContent = `Máy: ${S.state.cpuModel} · ${S.state.cpus} luồng CPU · GPU mã hoá: ${g.nvenc ? 'NVIDIA NVENC ✓' : g.qsv ? 'Intel QSV' : g.amf ? 'AMD AMF' : 'không phát hiện (render bằng CPU)'} · ffmpeg ${S.state.ffmpeg ? '✓' : '✗'}`;
}
// — chọn nhiều dự án: gỡ khỏi danh sách / chuyển vào Thùng rác Windows —
S.sel = new Set();
const toggleSel = (id) => { S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); loadHome(); };
function renderSelBar() {
  const b = $('#selBar'); b.innerHTML = ''; b.hidden = !S.sel.size; if (!S.sel.size) return;
  const names = S.state.recent.filter((r) => S.sel.has(r.id)).map((r) => r.name || r.dir);
  const run = async (trash) => {
    const msg = trash ? `Chuyển ${names.length} dự án vào Thùng rác Windows?\n\n• ${names.join('\n• ')}\n\nCả thư mục (kể cả lịch sử .history và out/) được chuyển đi. Lấy lại được từ Thùng rác. Nếu dự án quá lớn cho Thùng rác, Windows sẽ hỏi trước khi xoá hẳn (cửa sổ đó có thể nằm dưới trình duyệt).`
      : `Gỡ ${names.length} dự án khỏi danh sách? Thư mục trên ổ đĩa giữ nguyên, mở lại được bằng "Mở thư mục dự án".`;
    if (!confirm(msg)) return;
    toast(trash ? 'Đang chuyển vào Thùng rác…' : 'Đang gỡ…', false, 20000);
    try {
      const r = await api('/api/project/remove', {ids: [...S.sel], trash});
      const bad = r.results.filter((x) => x.error);
      S.sel.clear(); await loadHome();
      if (bad.length) modal(h('div', {}, h('h3', {}, 'Một số dự án chưa xử lý được'), ...bad.map((x) => h('p', {class: 'v-fail'}, `${x.name || x.id}: ${x.error}`))));
      else toast(trash ? `Đã chuyển ${r.results.length} dự án vào Thùng rác` : `Đã gỡ ${r.results.length} dự án khỏi danh sách`);
    } catch (e) { toast(e.message, true, 8000); }
  };
  b.append(h('b', {}, `Đã chọn ${S.sel.size}`), h('button', {class: 'small', onclick: () => { S.state.recent.forEach((r) => S.sel.add(r.id)); loadHome(); }}, 'Chọn tất cả'),
    h('button', {class: 'small', onclick: () => run(false)}, 'Gỡ khỏi danh sách'), h('button', {class: 'small danger', onclick: () => run(true)}, '🗑 Chuyển vào Thùng rác'),
    h('button', {class: 'small', onclick: () => { S.sel.clear(); loadHome(); }}, 'Bỏ chọn'));
}
$('#btnNewVideo').onclick = () => { $('#newProj').scrollIntoView({behavior: 'smooth'}); $('#npName').focus(); };
$('#btnNewCarousel').onclick = () => {
  const name = h('input', {placeholder: 'VD: 261008-V30-maps-3-hebel-v.1'}), client = h('input', {placeholder: 'Khách hàng (tuỳ chọn)'});
  const theme = h('select', {}, ...[['sami', 'SAMI (tím, xanh)'], ['cream', 'Kem'], ['tomato', 'Cà chua'], ['forest', 'Rừng'], ['noir', 'Đen']].map(([v, l]) => h('option', {value: v}, l)));
  const handle = h('input', {value: 'sami.agency'}), dur = h('select', {}, ...[4, 6, 8].map((d) => h('option', {value: d, selected: d === 6}, d + ' giây / slide')));
  const imgs = h('input', {placeholder: 'Để trống = 5 slide motion mẫu để Claude Code dựng theo chủ đề'});
  let mode = 'motion';
  const imgRow = field('Thư mục ảnh carousel đã thiết kế (JPG/PNG, xếp theo tên file)', h('div', {class: 'row'}, imgs, h('button', {onclick: async () => { const r = await api('/api/pick-folder'); if (r.dir) imgs.value = r.dir; }}, '…')), 'Mỗi ảnh thành 1 slide động; khung đầu giữ nguyên ảnh gốc (làm ảnh bìa). Ảnh không phải 4:5 được cắt giữa.');
  imgRow.hidden = true;
  const seg = h('div', {class: 'seg', style: 'margin-bottom:12px'}, ...[['motion', 'Từ chủ đề (motion)'], ['photo', 'Từ ảnh có sẵn']].map(([v, l]) => h('button', {class: v === mode ? 'on' : '', onclick: (e) => { mode = v; [...seg.children].forEach((x) => x.classList.toggle('on', x === e.target)); imgRow.hidden = v !== 'photo'; }}, l)));
  const msg = h('div', {class: 'muted', style: 'margin-top:8px'});
  modal(h('div', {style: 'min-width:min(560px,90vw)'}, h('h3', {}, 'Tạo carousel động'),
    h('p', {class: 'muted', style: 'margin-top:0'}, 'Mỗi slide là 1 video MP4 lặp liền mạch 1080×1350 có tiếng riêng. Xuất ra cả bộ slide + ảnh bìa + trang xem thử vuốt như Instagram.'),
    seg, field('Tên dự án', name), h('div', {class: 'cols2'}, field('Khách hàng', client), field('Tài khoản hiện trên slide', handle)), h('div', {class: 'cols2'}, field('Màu', theme), field('Độ dài mỗi slide', dur)), imgRow,
    h('div', {class: 'row'}, h('button', {class: 'primary', onclick: async (e) => {
      if (!name.value.trim()) return toast('Đặt tên dự án trước', true);
      if (mode === 'photo' && !imgs.value.trim()) return toast('Chọn thư mục ảnh', true);
      e.target.disabled = true; msg.textContent = 'Đang tạo…';
      try { const r = await api('/api/carousel/new', {name: name.value.trim(), client: client.value.trim(), theme: theme.value, handle: handle.value.trim(), dur: +dur.value, imagesDir: mode === 'photo' ? imgs.value.trim() : null, location: $('#npLocation').value.trim()}); $('#modal').hidden = true; openProject({id: r.id}); }
      catch (err) { e.target.disabled = false; msg.textContent = ''; toast(err.message, true, 8000); }
    }}, '＋ Tạo carousel')), msg,
    h('div', {class: 'hint', style: 'margin-top:10px'}, 'Chế độ chủ đề: sau khi tạo, nhờ Claude Code (skill sami-carousel) viết nội dung từng slide. Xuất: tab Xuất → ▶ Xuất video.')));
  name.focus();
};
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
        h('div', {class: 'badges'}, h('span', {}, (C[t.category] || t.category)), h('span', {}, t.seconds + 's'), h('span', {}, t.scenes + ' cảnh'), ...t.formats.map((f) => h('span', {}, f)), h('span', {}, 'v' + t.version), t.shared ? h('span', {style: 'color:var(--mint)', title: t.root}, 'dùng chung') : null, !t.hasManifest ? h('span', {style: 'color:var(--amber)'}, 'thiếu template.json') : null)),
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
  const shared = (S.state.sharedTemplates || []).length && confirm('Nhập vào THƯ MỤC MẪU CHUNG để cả nhóm dùng? (OK = thư mục chung · Huỷ = chỉ máy này)');
  try { const x = await api('/api/template/import', {from, shared}); await loadHome(); showCheck('Đã nhập mẫu: ' + x.id, x.check); } catch (e) { toast(e.message, true, 6000); }
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
    $('#projTitle').textContent = S.project.name; $('#projStatus').value = S.project.status || 'draft'; S.varCsv = undefined; S.varPreview = null;
    await mountPreview();
    renderAll();
    connectEvents(); showLockWarn(r.lockedBy);
  } catch (e) { toast(e.message, true, 6000); }
}
$('#btnHome').onclick = () => { if (isDirty() && !confirm('Có thay đổi chưa lưu. Vẫn thoát?')) return; closeProject(); location.hash = ''; location.reload(); };
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
const previewOpts = () => ({project: S.varPreview != null && S.varCsv ? withCopy(S.project, readVariants(S.varCsv).variants[S.varPreview]?.copy) : S.project, ratio: S.ratio, fps: S.fps, titles: $('#tgTitles').checked, subtitles: $('#tgSubs').checked, audio: $('#tgAudio').checked, sceneId: $('#tgScene').checked ? S.scene : null, hfBase: `/hfp/${S.id}/`, hfRev: S.hfRev || 0, mediaBase: `/pm/${S.id}/`, mediaProxy: true});
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
      h('div', {class: 'l1'}, h('span', {class: 'id'}, s.id), h('span', {class: 'nm'}, s.label || ''), (s.engine === 'hyperframes' || /\.html?$/i.test(s.src || '')) ? h('span', {class: 'eng', title: 'Cảnh HTML + CSS + GSAP (Hyperframes) — ' + (s.src || '')}, 'HTML') : null),
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
// ── Khuôn: thêm cảnh từ khuôn / đổi khuôn cảnh đang chọn (server/khuon.mjs; chữ cùng tên slot được giữ) ──
S.kh = {group: '', theme: null};
$('#btnKhuon').onclick = async () => {
  let D; try { D = await api('/api/khuon'); } catch (e) { return toast(e.message, true); }
  const K = S.kh; K.theme = K.theme || S.project.look?.theme || 'night';
  const cur = S.project.scenes.find((s) => s.id === S.scene);
  const tag = String(S.ratio || S.project.formats[0]).replace(':', 'x');
  const THEME_VI = {night: 'Đêm (navy SAMI)', paper: 'Giấy kraft', light: 'Sáng'};
  const apply = async (k, mode) => {
    if (mode === 'replace' && !confirm(`Đổi cảnh ${cur.id} sang khuôn "${k.name}"?\nChữ của các ô cùng tên được giữ; giọng, nhạc, SFX, thời lượng không đổi. Có điểm neo trong Lịch sử để quay lại.`)) return;
    try {
      const r = await api('/api/khuon/apply', {id: S.id, project: S.project, khuon: k.id, theme: K.theme, ...(mode === 'replace' ? {scene: cur.id} : {after: cur?.id || null})});
      S.project = r.project; S.saved = JSON.stringify(r.project); S.hfRev = Date.now(); $('#modal').hidden = true;
      S.scene = r.scene.id; pushPreview(); renderAll();
      toast(mode === 'replace' ? `Đã đổi ${r.scene.id} sang khuôn ${k.name}` : `Đã thêm cảnh ${r.scene.id} (${k.name}) · sửa chữ ở tab Chữ`, false, 6000);
    } catch (e) { toast(e.message, true, 8000); }
  };
  const draw = () => {
    const list = D.khuon.filter((k) => !K.group || k.group === K.group);
    modal(h('div', {style: 'width:min(1100px,92vw)'},
      h('h3', {}, '🧩 Khuôn cảnh'),
      h('p', {class: 'muted', style: 'font-size:13px;margin-top:-6px'}, 'Khuôn là cảnh HTML dựng sẵn có tham số: chữ, ảnh, màu lấy từ dự án. ', cur ? `"Đổi khuôn" thay cảnh ${cur.id}, giữ chữ của ô cùng tên. ` : '', '"Thêm" chèn cảnh mới sau cảnh đang chọn.'),
      h('div', {class: 'row', style: 'flex-wrap:wrap;gap:8px;margin-bottom:10px'},
        h('div', {class: 'seg'}, ...D.themes.map((t) => h('button', {class: K.theme === t ? 'on' : '', onclick: () => { K.theme = t; draw(); }}, THEME_VI[t] || t))),
        h('select', {onchange: (e) => { K.group = e.target.value; draw(); }}, h('option', {value: ''}, 'Mọi nhóm'), ...Object.entries(D.groups).filter(([g]) => D.khuon.some((k) => k.group === g)).map(([g, t]) => h('option', {value: g, selected: K.group === g}, t)))),
      h('div', {style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-height:62vh;overflow:auto;padding-right:4px'},
        ...list.map((k) => {
          const th = k.thumbs.includes(`thumb_${tag}.jpg`) ? `thumb_${tag}.jpg` : k.thumbs[0];
          return h('div', {class: 'group', style: 'margin:0;padding:8px;display:flex;flex-direction:column;gap:6px'},
            th ? h('img', {src: `/api/khuon/thumb/${k.id}/${th}`, loading: 'lazy', style: 'width:100%;aspect-ratio:16/10;object-fit:contain;background:#0A0722;border-radius:8px'}) : h('div', {class: 'muted', style: 'aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;background:#0A0722;border-radius:8px'}, k.id),
            h('b', {style: 'font-size:13.5px'}, k.name),
            h('div', {class: 'muted', style: 'font-size:12px;flex:1'}, `${D.groups[k.group] || k.group} · ${(k.beats / 2).toFixed(1)} s · ${k.slots.length} ô`, h('br'), k.description || ''),
            h('div', {class: 'row', style: 'gap:6px'},
              h('button', {class: 'small primary', onclick: () => apply(k, 'add')}, cur ? `＋ Thêm sau ${cur.id}` : '＋ Thêm cảnh'),
              cur ? h('button', {class: 'small', onclick: () => apply(k, 'replace')}, `Đổi ${cur.id}`) : null));
        }))));
  };
  draw();
};
function renderScrub() {
  const T = S.project.scenes.at(-1)?.end || 1;
  const only = $('#tgScene').checked;
  const segs = $('#scrubSegs'); segs.innerHTML = '';
  const marks = $('#scrubMarks'); marks.innerHTML = '';
  if (only) { const s = sceneById(S.scene); segs.append(h('div', {class: 'on', style: 'width:100%'}, `${s.id} · ${s.label}`)); return; }
  for (const s of S.project.scenes) segs.append(h('div', {class: s.id === S.scene ? 'on' : '', style: `width:${100 * (s.end - s.start) / T}%`, title: s.label}, s.id));
  for (const t of S.project.titles || []) marks.append(h('i', {style: `left:${100 * t.start * BASE / T}%;width:${Math.max(0.3, 100 * (t.end - t.start) * BASE / T)}%`, title: t.text}));
  for (const c of S.project.tracks?.video || []) marks.append(h('i', {class: 'ftm ' + c.role, style: `left:${100 * c.at * BASE / T}%;width:${Math.max(0.3, 100 * ((c.out - c.in) / (c.speed || 1)) * BASE / T)}%`, title: `Footage ${c.id} · ${c.role} · ${c.label || c.src}`, onclick: (e) => { e.stopPropagation(); S.ft.sel = c.id; goTab('video'); }}));
  for (const o of S.project.overlays || []) if (!o.whole) marks.append(h('i', {class: 'ovm', style: `left:${100 * o.start * BASE / T}%;width:${Math.max(0.3, 100 * (o.end - o.start) * BASE / T)}%`, title: 'Ảnh: ' + (o.label || o.src || o.sticker)}));
  if (S.project.audio?.mode === 'layers') for (const c of S.project.audio.cues || []) marks.append(h('i', {class: 'sfx', style: `left:${100 * c.t * BASE / T}%`, title: c.label || c.sfx}));
  if (S.project.audio?.mode === 'layers') for (const c of S.project.audio.voice || []) marks.append(h('i', {class: 'sfx', style: `left:${100 * c.t * BASE / T}%;background:#7667FE`, title: 'Thoại: ' + (c.label || c.src)}));
}
function renderRatios() {
  const seg = $('#ratioSeg'); seg.innerHTML = '';
  for (const r of ratioList()) seg.append(h('button', {class: r === S.ratio ? 'on' : '', onclick: () => { S.ratio = r; if (S.render) S.render.ratio = r; renderRatios(); sizePlayer(); pushPreview(); if (S.tab === 'render') renderTab(); }}, RATIO_LABEL[r] || r));
  $('#fitBadge').hidden = S.project.formats.includes(S.ratio);
}

// ─────────────────────────── INSPECTOR TABS ───────────────────────────
$$('#tabs button').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); renderTab(); }));
function renderAll() { renderRatios(); renderScenes(); renderScrub(); renderTab(); $('#dirty').hidden = !isDirty(); $('#projStatus').value = S.project.status || 'draft'; }
function renderTab() { setTimeout(renderHandles, 0); const B = $('#tabBody'); B.innerHTML = ''; ({text: tabText, titles: tabTitles, overlays: tabOverlays, subs: tabSubs, audio: tabAudio, look: tabLook, render: tabRender, history: tabHistory, variants: tabVariants, ai: tabAI, video: tabVideo})[S.tab](B); }

const field = (label, input, hint) => h('label', {}, label, input, hint ? h('div', {class: 'hint'}, hint) : null);
const assetSelect = (value, type, onchange) => {
  const sel = h('select', {onchange: (e) => onchange(e.target.value)}, h('option', {value: ''}, '— không —'), ...S.assets.filter((a) => !type || a.type === type).map((a) => h('option', {value: a.path, selected: a.path === value}, a.path)));
  if (value && !S.assets.some((a) => a.path === value)) sel.append(h('option', {value, selected: true}, value.startsWith('lib:') ? '📚 ' + value.slice(4) + ' (thư viện SAMI)' : value + ' (không thấy)'));
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
    if (isImg) { g.append(field(v.label || k, h('div', {class: 'row'}, assetSelect(v.value, 'img', (val) => commit((p) => { p.copy[k].value = val; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('img', 'image/*'); if (pth) commit((p) => { p.copy[k].value = 'img/' + pth.split('/').pop(); }); renderTab(); }}, 'Tải ảnh…'), pickBtn('img', (ref) => { commit((p) => { p.copy[k].value = ref; }); renderTab(); })), v.hint)); continue; }
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
function newOverlay(kind, preset, extra = null) {
  const t0 = +secNow().toFixed(2); const id = 'o' + Math.random().toString(36).slice(2, 7);
  const base = {id, kind, start: t0, end: +(t0 + 3).toFixed(2), pos: {x: 0.5, y: 0.5}, width: 0.25, opacity: 1, anim: 'fade', out: 'fade', layer: 'under'};
  const o = kind === 'sticker' ? {...base, sticker: 'arrow', color: '#08DDA4', stroke: 6, width: 0.14, anim: 'draw', label: 'Chỉ dẫn'}
    : kind === 'lottie' ? {...base, src: '', loop: true, speed: 1, width: 0.3, anim: 'pop', label: 'Lottie'}
    : preset === 'watermark' ? {...base, src: '', whole: true, pos: {x: 0.88, y: 0.9}, width: 0.12, opacity: 0.35, anim: 'none', out: 'none', layer: 'top', label: 'Watermark'}
    : {...base, src: '', anim: 'pop', shadow: true, label: 'Ảnh / logo'};
  if (extra) Object.assign(o, extra);
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
  if (o.kind === 'image') g.append(field('File ảnh (PNG nền trong suốt, JPG, SVG, WebP, GIF)', h('div', {class: 'row'}, assetSelect(o.src, 'img', (v) => upd((x) => { x.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('img', 'image/*'); if (pth) upd((x) => { x.src = pth; }); }}, 'Tải lên…'), pickBtn('img', (ref) => upd((x) => { x.src = ref; }))), 'Logo/watermark nên dùng PNG hoặc SVG nền trong suốt. Có thể kéo thả ảnh thẳng lên khung xem.'));
  if (o.kind === 'lottie') {
    g.append(field('File Lottie (.json)', h('div', {class: 'row'}, assetSelect(o.src, 'lottie', (v) => upd((x) => { x.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('lottie', '.json,application/json'); if (pth) upd((x) => { x.src = pth; }); }}, 'Tải lên…'), pickBtn('lottie', (ref) => upd((x) => { x.src = ref; }))), 'Tải file "Lottie JSON" miễn phí ở LottieFiles.com (không dùng .lottie nén). Kiểm tra giấy phép trước khi dùng cho khách.'));
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
  if (a.mode === 'premix') g.append(field('File mix', h('div', {class: 'row'}, assetSelect(a.premix, 'audio', (v) => upd((x) => { x.premix = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('audio', 'audio/*'); if (pth) upd((x) => { x.premix = pth; }); }}, 'Tải lên…'), pickBtn('audio', (ref) => upd((x) => { x.premix = ref; })))));
  B.append(g);
  if (a.mode === 'layers') {
    const m = h('div', {class: 'group'}, h('h4', {}, 'Nhạc nền'));
    m.append(field('File nhạc', h('div', {class: 'row'}, assetSelect(a.music.src, 'audio', (v) => upd((x) => { x.music.src = v; })), h('button', {class: 'small', onclick: async () => { const pth = await uploadTo('audio', 'audio/*'); if (pth) upd((x) => { x.music.src = pth; }); }}, 'Tải lên…'), pickBtn('audio', (ref) => upd((x) => { x.music.src = ref; x.music.edit = []; })))));
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
  const tsh = h('input', {type: 'checkbox', checked: !!(S.state.sharedTemplates || []).length, disabled: !(S.state.sharedTemplates || []).length});
  const tg = h('div', {class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px'}, ...Object.entries(GL).map(([k, l]) => h('label', {class: 'chk'}, h('input', {type: 'checkbox', value: k}), l)));
  B.append(h('div', {class: 'group'}, h('h4', {}, 'Lưu thành mẫu (template)'),
    h('div', {class: 'hint'}, 'Biến video này thành mẫu dùng lại cho khách khác. Studio sao chép cảnh + cài đặt vào thư viện, tạo ảnh bìa và kiểm tra theo chuẩn. ⚠ Nhớ thay ảnh/logo/số liệu thật của khách bằng ảnh minh hoạ.'),
    h('div', {class: 'cols2'}, field('Tên mẫu', tn), field('Nhóm ngành', tc)), h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Mục đích'), tg, field('Mô tả ngắn', td),
    h('label', {class: 'chk', style: 'margin-bottom:8px'}, tsh, (S.state.sharedTemplates || []).length ? 'Lưu vào thư mục mẫu chung (cả nhóm thấy)' : 'Lưu vào thư mục mẫu chung — chưa cài (trang Dự án → Nhóm)'),
    h('button', {class: 'primary', onclick: async () => {
      if (isDirty()) await save();
      try {
        const r = await api('/api/template/from-project', {id: S.id, name: tn.value.trim(), category: tc.value, description: td.value.trim(), goal: $$('input:checked', tg).map((x) => x.value), shared: tsh.checked});
        showCheck('Đã tạo mẫu: ' + r.id, r.check, h('p', {class: 'muted'}, 'Ảnh bìa đang được tạo trong nền (≈ 1 phút). Mẫu nằm ở ' + r.dir));
      } catch (e) { toast(e.message, true); }
    }}, '＋ Lưu thành mẫu')));
  B.append(h('div', {class: 'group'}, h('h4', {}, 'Thông tin dự án'),
    field('Tên dự án', h('input', {value: S.project.name, onchange: (e) => { commit((p) => { p.name = e.target.value; }); $('#projTitle').textContent = e.target.value; }})),
    field('Khách hàng', h('input', {value: S.project.client || '', onchange: (e) => commit((p) => { p.client = e.target.value; })})),
    h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Tỉ lệ có bố cục riêng: ' + S.project.formats.join(', ') + '. Tỉ lệ khác sẽ dùng chế độ "vừa khung". Muốn bố cục dọc/vuông riêng: nhờ Claude Code (xem Hướng dẫn mục 12).'),
    h('div', {class: 'muted', style: 'font-size:12.5px;margin-top:6px'}, 'Thư mục: ' + S.dir)));
}

// — Xuất video —
const RES = {'540p': 'Nháp 540p', FHD: 'Full HD', '2K': '2K', '4K': '4K'};
const dims = (ratio, res) => { const st = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350]}[ratio] || [1920, 1080]; const k = {'540p': 0.5, FHD: 1, '2K': 4 / 3, '4K': 2}[res]; return `${Math.round(st[0] * k)}×${Math.round(st[1] * k)}`; };
function tabRender(B) {
  const r = S.render;
  const set = (k, v) => { r[k] = v; renderTab(); };
  const seg = (k, opts) => h('div', {class: 'seg'}, ...opts.map(([v, l]) => h('button', {class: r[k] === v ? 'on' : '', onclick: () => set(k, v)}, l)));
  const cpus = S.state.cpus; const g = S.state.gpu;
  const box = h('div', {class: 'group'}, h('h4', {}, 'Cài đặt xuất'));
  // preset (0.9): one choice fills ratio + resolution + fps + format + quality (lib/presets.json)
  if (!S.presets) api('/api/presets').then((x) => { S.presets = x.presets; if (S.tab === 'render') renderTab(); }).catch(() => { S.presets = []; });
  if (S.presets?.length) {
    const cur = S.presets.find((x) => ['ratio', 'res', 'fps', 'codec'].every((k) => x[k] == null || r[k] === x[k]) && (x.crf == null || x.codec === 'prores' || r.crf === x.crf));
    box.append(field('Preset', h('select', {onchange: (e) => { const x = S.presets.find((y) => y.id === e.target.value); if (!x) return; for (const k of ['ratio', 'res', 'fps', 'codec', 'crf']) if (x[k] != null) r[k] = x[k]; S.ratio = r.ratio; renderRatios(); sizePlayer(); pushPreview(); renderTab(); }},
      h('option', {value: ''}, cur ? '' : '(tự chọn bên dưới)'), ...S.presets.map((x) => h('option', {value: x.id, selected: cur?.id === x.id}, x.name))), cur?.note || 'Chọn nhanh theo nơi đăng; vẫn chỉnh tay được từng ô bên dưới.'));
  }
  box.append(field('Tỉ lệ khung', seg('ratio', ratioList().map((x) => [x, RATIO_LABEL[x]])), S.project.formats.includes(r.ratio) ? null : '⚠ Dự án chưa có bố cục riêng cho tỉ lệ này → xuất ở chế độ "vừa khung".'));
  box.append(field('Độ phân giải', seg('res', Object.entries(RES)), dims(r.ratio, r.res) + ' px'));
  box.append(field('Số khung hình / giây (FPS)', seg('fps', [[24, '24 (điện ảnh)'], [30, '30 (chuẩn)'], [60, '60 (siêu mượt)']]), r.fps === 60 ? 'Thời gian render ≈ gấp đôi 30 fps.' : null));
  box.append(field('Định dạng', seg('codec', [['h264', 'MP4 H.264 (phổ biến)'], ['h265', 'MP4 H.265 (nhẹ hơn)'], ['prores', 'ProRes .mov (dựng tiếp)']])));
  if (r.codec !== 'prores') box.append(field(`Chất lượng (CRF ${r.crf}) — số nhỏ = đẹp hơn, file nặng hơn`, h('input', {type: 'range', min: 12, max: 28, step: 1, value: r.crf, oninput: (e) => { r.crf = +e.target.value; e.target.parentElement.firstChild.textContent = `Chất lượng (CRF ${r.crf}) — số nhỏ = đẹp hơn, file nặng hơn`; }}), r.gpu !== 'off' && g.nvenc ? 'Khi mã hoá bằng GPU, chất lượng tính theo bitrate tự động (FHD 16 Mbps, 2K 28, 4K 55).' : null));
  box.append(field(`Số luồng CPU: ${r.threads} / ${cpus}`, h('input', {type: 'range', min: 1, max: cpus, step: 1, value: Math.min(r.threads, cpus), oninput: (e) => { r.threads = +e.target.value; e.target.parentElement.firstChild.textContent = `Số luồng CPU: ${r.threads} / ${cpus}`; }}), 'Nhiều luồng = nhanh hơn nhưng máy nóng/chậm hơn. Mặc định 8.'));
  const card = (S.state.gpuInfo?.cards || []).find((c) => c.vendor === 'nvidia') || S.state.gpuInfo?.cards?.[0];
  const gname = card ? card.name.replace(/^NVIDIA\s+(GeForce\s+)?/i, '') : 'GPU';
  if (r.gpu !== 'off') r.gpu = 'auto';
  box.append(field('Bộ mã hoá video', h('div', {class: 'row', style: 'flex-wrap:wrap'}, seg('gpu', [['auto', g.nvenc ? `GPU · NVIDIA NVENC (${gname})` : 'GPU (tự dò)'], ['off', 'CPU · x264 / x265']]), h('button', {class: 'small', onclick: diagnoseGpu}, '🩺 Chẩn đoán GPU')),
    r.codec === 'prores' ? 'ProRes luôn mã hoá bằng CPU (NVIDIA không có bộ mã hoá ProRes). Muốn dùng GPU → chọn MP4 H.264/H.265.'
    : r.gpu === 'off' ? 'CPU mã hoá: chậm hơn, chất lượng theo CRF. Dùng khi GPU báo lỗi.'
    : g.nvenc ? `GPU ${gname} mã hoá video (H.264${g.hevc_nvenc ? ' và H.265' : ''}), CPU chỉ lo vẽ khung hình. Cảnh HTML (Hyperframes) cũng mã hoá bằng NVENC.` : 'Chưa chạy được NVENC: bấm "Chẩn đoán GPU" để xem nguyên nhân và cách sửa.'));
  const cp = S.state.caps || {};
  box.append(h('div', {class: 'hwCard'},
    h('div', {}, h('span', {class: 'muted'}, 'Card đồ hoạ: '), card ? `${card.name}${card.vramGB ? ' · ' + card.vramGB + ' GB' : ''}${card.driver ? ' · driver ' + card.driver : ''}` : 'đang dò…'),
    h('div', {}, h('span', {class: 'muted'}, 'Mã hoá GPU: '), [g.nvenc && 'NVENC H.264 ✓', g.hevc_nvenc && 'NVENC H.265 ✓', g.qsv && 'Intel QSV ✓', g.amf && 'AMD AMF ✓'].filter(Boolean).join(' · ') || 'không có (chỉ CPU)'),
    h('div', {}, h('span', {class: 'muted'}, 'ffmpeg đầy đủ: '), cp.full?.full ? `${S.state.ffmpegFull || 'có'} (vendor/ffmpeg): ghép, chuẩn âm lượng, cảnh HTML` : 'chưa cài: chạy node tools/get-ffmpeg.mjs'),
    h('div', {}, h('span', {class: 'muted'}, 'ffmpeg của Remotion: '), cp.remotion?.bin ? 'có: mã hoá khung hình video' : 'không thấy'),
    h('div', {}, h('span', {class: 'muted'}, 'CPU: '), `${S.state.cpuModel} · ${cpus} luồng`)));
  box.append(h('div', {class: 'hwCard', style: 'border-color:' + (S.state.allowCliRender ? 'var(--amber)' : 'var(--line)')},
    h('label', {class: 'chk', style: 'margin:0'}, h('input', {type: 'checkbox', checked: !!S.state.allowCliRender, onchange: async (e) => { try { await api('/api/settings', {allowCliRender: e.target.checked}); S.state.allowCliRender = e.target.checked; toast(e.target.checked ? 'Đã BẬT: Claude Code được xuất video khi bạn yêu cầu trong chat' : 'Đã TẮT: Claude Code không xuất video được'); renderTab(); } catch (err) { toast(err.message, true); } }}), h('b', {style: 'color:var(--text)'}, 'Cho phép Claude Code xuất video')),
    h('div', {class: 'hint', style: 'margin:4px 0 0'}, 'Mặc định TẮT. Khi bật, Claude Code chỉ xuất khi bạn yêu cầu trong chat (lệnh phải kèm nguyên văn yêu cầu, ghi vào .studio/cli-render.log). Lượt xuất của Claude vào chung hàng đợi bên dưới, dừng/huỷ được như thường. Lệnh: node server/cli-render.mjs <dự án> --request "…"')));
  if (r.loudness === undefined) r.loudness = -14;
  box.append(field('Chuẩn âm lượng khi xuất', seg('loudness', [[-14, '−14 LUFS (mạng xã hội)'], [-16, '−16 LUFS (web)'], ['off', 'Tắt']]), r.loudness === 'off' ? 'Giữ nguyên mức âm đã mix.' : 'Tự đo và chỉnh cả bản mix về ' + r.loudness + ' LUFS, đỉnh tối đa −1 dBTP — đều tiếng trên Reels/TikTok/YouTube, không bị nền tảng tự hạ nhỏ.'));
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
    S.project.type === 'carousel' ? null : h('button', {onclick: () => go(RATIOS), title: 'Xuất 16:9 + 9:16 + 1:1 với cùng cài đặt'}, 'Xuất cả 3 tỉ lệ'), // carousel: one export = every slide
    h('button', {onclick: () => go([r.ratio], S.scene), title: 'Chỉ xuất cảnh đang chọn'}, `Chỉ cảnh ${S.scene}`),
    h('button', {onclick: () => { r.res = 'FHD'; r.fps = 30; r.crf = 26; r.threads = Math.min(8, cpus); renderTab(); }, title: 'Cài nhanh để xem thử'}, 'Preset: bản nháp nhanh')));
  B.append(box, reviewGroup());
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
      h('div', {class: 'row'}, h('span', {class: 'st'}, ST), h('span', {style: 'flex:1'}, ` ${j.opts.ratio} · ${j.opts.res} · ${j.opts.fps}fps · ${j.opts.codec}${j.opts.scope && j.opts.scope !== 'all' ? ' · ' + j.opts.scope : ''}${j.opts.by ? ' · do ' + j.opts.by : ''}`),
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
  const st = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350]}[r.ratio] || [1920, 1080]; const k = {'540p': 0.5, FHD: 1, '2K': 4 / 3, '4K': 2}[r.res];
  const px = (st[0] * k * st[1] * k) / (1920 * 1080); const f = +r.fps / 30;
  const gpu = r.gpu !== 'off' && S.state.gpu.nvenc && r.codec !== 'prores';
  let mbps;
  if (r.codec === 'prores') mbps = 220 * px * f;
  else if (gpu) mbps = {'540p': 4, FHD: 16, '2K': 28, '4K': 55}[r.res] * (r.codec === 'h265' ? 1 : 1);
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

// ─────────────────────────── MEDIA: chọn, dùng, kéo thả ───────────────────────────
const mediaKind = (ref) => (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(ref) ? 'img' : /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(ref) ? 'audio' : /\.(mp4|mov|webm|mkv|m4v)$/i.test(ref) ? 'video' : /\.json$/i.test(ref) ? 'lottie' : 'other');
const mediaUrl = (ref) => (ref.startsWith('lib:') ? '/lib/' + ref.slice(4).split('/').map(encodeURIComponent).join('/') : `/proj/${S.id}/public/${ref.split('/').map(encodeURIComponent).join('/')}`);
const dragMedia = (payload) => (e) => { e.dataTransfer.setData('application/x-sami-media', JSON.stringify(payload)); e.dataTransfer.effectAllowed = 'copy'; };
/** small preview tile for a project / library ref (image thumb, audio player, video poster) */
const mediaTile = (ref, {onPick, extra} = {}) => {
  const k = mediaKind(ref); const name = ref.split('/').pop();
  const body = k === 'img' ? h('img', {src: mediaUrl(ref), loading: 'lazy'}) : k === 'video' ? h('video', {src: mediaUrl(ref), muted: true, preload: 'metadata'}) : k === 'audio' ? h('div', {class: 'ph'}, '♫ ' + name) : h('div', {class: 'ph'}, name);
  const t = h('div', {class: 'stk', draggable: 'true', title: ref + '\nKéo thả lên khung xem để chèn', ondragstart: dragMedia({ref})}, body,
    k === 'audio' ? h('audio', {src: mediaUrl(ref), controls: true, preload: 'none', style: 'width:100%;height:28px'}) : null,
    h('div', {class: 'meta'}, name),
    h('div', {class: 'row', style: 'margin:0 5px 5px;gap:4px'}, onPick ? h('button', {class: 'small primary', onclick: () => onPick(ref)}, 'Chọn') : h('button', {class: 'small primary', onclick: () => useMedia(ref)}, 'Dùng ▾'), extra || null));
  return t;
};
function addOverlayFrom(ref, pos) {
  const lottie = mediaKind(ref) === 'lottie';
  newOverlay(lottie ? 'lottie' : 'image', null, {src: ref, ...(pos ? {pos} : {}), label: ref.split('/').pop()});
  goTab('overlays'); toast('Đã thêm Ảnh chèn · kéo chấm xanh để đặt lại vị trí');
}
const goTab = (t) => { S.tab = t; $$('#tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === t)); renderTab(); };
const audioLen = (url) => new Promise((ok) => { const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => ok(a.duration || 0); a.onerror = () => ok(0); a.src = url; });
/** "Dùng ▾": put a media file where it belongs in the edit */
// ─────────────────────────── FOOTAGE (0.9): tracks.video, media/ + proxy 540p ───────────────────────────
S.ft = {items: null, sel: null, meta: null};
const ROLE_VI = {main: 'Chính', broll: 'B-roll', pip: 'PiP', screen: 'Màn hình'};
const MASK_VI = {none: 'Không', rounded: 'Bo góc', circle: 'Tròn', phone: 'Điện thoại', laptop: 'Laptop'};
const clipLenS = (c) => Math.max(0, (c.out - c.in) / (c.speed || 1));
const ftLoad = async () => { const r = await api('/api/media?id=' + S.id); S.ft.items = r.items; S.ft.meta = r; return r; };
/** footage end beyond the film → append a blank "Footage" span so the clip is not cut off (cuts stay on the beat grid) */
const extendForClip = (p, c) => {
  const end = Math.ceil((c.at + clipLenS(c)) * BASE); const last = p.scenes.at(-1)?.end || 0;
  if (end <= last) return false;
  const want = Math.max(last + 15, Math.ceil((end - 1) / 15) * 15 + 1);
  let n = p.scenes.length + 1, id; const ids = new Set(p.scenes.map((s) => s.id)); do { id = 'F' + String(n++).padStart(2, '0'); } while (ids.has(id));
  p.scenes.push({id, label: 'Footage', start: last, end: want, engine: 'blank'}); return true;
};
function addClip(src, role, at, info) {
  const d = S.ft.meta?.defaults?.[role] || {}; const dur = info?.duration || 5;
  commit((p) => {
    p.tracks ||= {}; p.tracks.video ||= [];
    const ids = new Set(p.tracks.video.map((c) => c.id)); let k = 1, id; do { id = 'V' + String(k++).padStart(2, '0'); } while (ids.has(id));
    const c = {id, label: src.split('/').pop().replace(/\.[^.]+$/, ''), src, role, at: +(+at).toFixed(2), in: 0, out: +(role === 'broll' ? Math.min(3, dur) : dur).toFixed(2), speed: 1, ...JSON.parse(JSON.stringify(d)), ...(info?.w ? {aspect: +(info.w / info.h).toFixed(4)} : {})};
    if (role === 'pip' && S.ft.dropPos) { c.pip = {...(c.pip || {}), ...S.ft.dropPos}; S.ft.dropPos = null; }
    p.tracks.video.push(c); S.ft.sel = id;
    if (extendForClip(p, c)) toast('Phim được nối dài thêm một đoạn "Footage" để vừa clip', false, 5000);
  });
  goTab('video');
}
/** wait for a prepare task, then put the clip on the timeline */
const addClipWhenReady = (taskId, src, role, at) => {
  const go = async (t) => { if (t.status === 'error') return toast('Chuẩn bị video lỗi: ' + t.error, true, 8000); await ftLoad(); addClip(t.result?.src || src, role, at, t.result); };
  const t = S.tasks[taskId]; if (t && t.status !== 'running') return go(t);
  taskWaiters[taskId] = (x) => { if (x.status !== 'running') { delete taskWaiters[taskId]; go(x); } };
};
async function ftUpload(files, role, at) {
  for (const f of files) {
    toast(`Đang tải lên ${f.name} (${(f.size / 1e6).toFixed(0)} MB)…`, false, 4000);
    const r = await fetch(`/api/media/upload?id=${S.id}&name=${encodeURIComponent(f.name)}`, {method: 'POST', body: f}).then((x) => x.json());
    if (r.error) { toast(r.error, true, 6000); continue; }
    if (role) addClipWhenReady(r.task, r.src, role, at ?? secNow()); else taskWaiters[r.task] = (x) => { if (x.status !== 'running') { delete taskWaiters[r.task]; ftLoad().then(() => S.tab === 'video' && renderTab()); } };
  }
  await ftLoad(); if (S.tab === 'video') renderTab();
}
async function tabVideo(B) {
  if (S.project.type === 'carousel') return B.append(h('p', {class: 'muted'}, 'Carousel dùng ảnh / cảnh HTML cho từng slide; footage dành cho dự án video.'));
  if (!S.ft.items) { try { await ftLoad(); } catch (e) { return B.append(h('div', {class: 'v-fail'}, e.message)); } if (S.tab !== 'video') return; }
  const clips = S.project.tracks?.video || [];
  const pend = Object.values(S.tasks).filter((t) => t.kind === 'media' && t.project === S.id && t.status === 'running');
  B.append(h('div', {class: 'hint', style: 'margin:0 0 10px'}, 'Footage nằm trên một lớp riêng phía trên cảnh: ', h('b', {}, 'Chính'), ' phủ kín khung, ', h('b', {}, 'B-roll'), ' chèn ngắn (tắt tiếng), ', h('b', {}, 'PiP'), ' khung nhỏ ở góc, ', h('b', {}, 'Màn hình'), ' bản ghi màn hình trong khung điện thoại / laptop. Xem trước dùng bản 540p; khi xuất dùng file gốc. Tiêu đề, phụ đề, ảnh chèn vẫn nằm trên footage.'));
  // — kho footage của dự án —
  const g = h('div', {class: 'group'}, h('h4', {}, `Footage của dự án (${S.ft.items.length})`,
    h('button', {class: 'small primary', onclick: () => { const fp = $('#filePick'); fp.accept = 'video/*,.mts,.mkv'; fp.multiple = true; fp.value = ''; fp.onchange = () => { const L = [...fp.files]; fp.multiple = false; ftUpload(L); }; fp.click(); }}, '＋ Nhập video'),
    h('button', {class: 'small', onclick: () => { goTab('ai'); S.ai.kind = 'video'; renderTab(); }, title: 'Tìm video stock miễn phí (Pexels, Pixabay…) rồi "Dùng ▾ → B-roll"'}, '🔎 Tìm B-roll')));
  for (const t of pend) g.append(h('div', {class: 'hint', style: 'margin:0 0 6px'}, '⏳ ' + t.msg));
  if (!S.ft.items.length) g.append(h('div', {class: 'muted', style: 'font-size:13px'}, 'Chưa có video. Bấm "＋ Nhập video" hoặc kéo file từ Explorer thả vào đây. Bản ghi màn hình (tốc độ khung thay đổi) được chuyển sang 30 khung/giây cố định.'));
  const grid = h('div', {class: 'stockGrid'});
  for (const m of S.ft.items) grid.append(h('div', {class: 'stk', title: `${m.src}\n${m.w}×${m.h} · ${m.fps} khung/s${m.audio ? ' · có tiếng' : ' · không tiếng'}${m.vfrOrig ? '\nĐã chuyển từ bản ghi tốc độ khung thay đổi' : ''}`},
    m.thumb ? h('img', {src: `/api/media/thumb/${S.id}/${m.src}`, loading: 'lazy'}) : h('div', {class: 'ph'}, m.name),
    h('div', {class: 'meta'}, `${m.duration ? fmtT(m.duration) : '?'} · ${m.w || '?'}×${m.h || '?'}${m.audio ? ' · ♫' : ''}`),
    m.ready ? h('div', {class: 'row', style: 'margin:0 5px 5px;gap:3px;flex-wrap:wrap'}, ...['main', 'broll', 'pip', 'screen'].map((r) => h('button', {class: 'small' + (r === 'main' ? ' primary' : ''), title: 'Thêm vào timeline tại vị trí đang xem: ' + (S.ft.meta.roles?.[r] || r), onclick: () => addClip(m.src, r, secNow(), m)}, '＋' + ROLE_VI[r])))
      : h('div', {class: 'row', style: 'margin:0 5px 5px'}, h('button', {class: 'small', onclick: async () => { const r = await api('/api/media/prepare', {id: S.id, src: m.src}); taskWaiters[r.task] = (x) => { if (x.status !== 'running') { delete taskWaiters[r.task]; ftLoad().then(() => S.tab === 'video' && renderTab()); } }; renderTab(); }}, 'Chuẩn bị (540p)'))));
  g.append(grid);
  g.ondragover = (e) => { e.preventDefault(); }; g.ondrop = (e) => { const L = [...(e.dataTransfer?.files || [])].filter((f) => /video|\.mts$|\.mkv$/i.test(f.type || f.name)); if (!L.length) return; e.preventDefault(); e.stopPropagation(); ftUpload(L); };
  B.append(g);
  // — các clip trên timeline —
  const lg = h('div', {class: 'group'}, h('h4', {}, `Trên timeline (${clips.length})`));
  if (!clips.length) lg.append(h('div', {class: 'muted', style: 'font-size:13px'}, 'Chọn vị trí trên thanh thời gian rồi bấm ＋Chính / ＋B-roll / ＋PiP / ＋Màn hình ở video bên trên.'));
  for (const c of [...clips].sort((a, b) => a.at - b.at)) lg.append(h('div', {class: 'item' + (c.id === S.ft.sel ? ' on' : ''), onclick: () => { S.ft.sel = c.id; S.playerApi?.seek(Math.round((c.at + 0.2) * S.fps)); renderTab(); }},
    h('span', {class: 't'}, `${fmtT(c.at)}–${fmtT(c.at + clipLenS(c))}`), h('span', {class: 'x'}, `${ROLE_VI[c.role] || c.role} · ${c.label || c.src}`)));
  B.append(lg);
  const c = clips.find((x) => x.id === S.ft.sel); if (!c) return;
  // — sửa clip đang chọn —
  const set = (k, v) => commit((p) => { const x = p.tracks.video.find((y) => y.id === c.id); if (v === undefined) delete x[k]; else x[k] = v; extendForClip(p, x); });
  const setPip = (k, v) => commit((p) => { const x = p.tracks.video.find((y) => y.id === c.id); x.pip = {...(x.pip || {x: .5, y: .5, w: .4}), [k]: v}; });
  const num = (k, step, min, max, label, hint) => field(label, h('input', {type: 'number', step, min, max, value: c[k] ?? '', onchange: (e) => set(k, e.target.value === '' ? undefined : +e.target.value)}), hint);
  const segOf = (k, opts, cur) => h('div', {class: 'seg'}, ...opts.map(([v, l]) => h('button', {class: (cur ?? c[k]) === v ? 'on' : '', onclick: () => set(k, v)}, l)));
  const src = S.ft.items.find((m) => m.src === c.src);
  const ed = h('div', {class: 'group'}, h('h4', {}, `${c.id} · ${c.label || c.src}`, h('button', {class: 'small danger', onclick: () => { commit((p) => { p.tracks.video = p.tracks.video.filter((x) => x.id !== c.id); }); S.ft.sel = null; }}, 'Xoá')));
  ed.append(field('Vai trò', segOf('role', Object.keys(ROLE_VI).map((r) => [r, ROLE_VI[r]]))));
  ed.append(h('div', {class: 'cols3'}, num('at', 0.05, 0, null, 'Bắt đầu trên phim (s)'), num('in', 0.05, 0, src?.duration, 'Cắt vào (s trong video)'), num('out', 0.05, 0, src?.duration, 'Cắt ra (s)', src?.duration ? `video dài ${src.duration.toFixed(1)} s` : null)));
  ed.append(h('div', {class: 'row', style: 'gap:6px;flex-wrap:wrap;margin:-4px 0 10px'},
    h('button', {class: 'small', onclick: () => set('at', +secNow().toFixed(2))}, '⇥ Bắt đầu tại vị trí đang xem'),
    h('button', {class: 'small', onclick: () => { const t = secNow() - c.at; if (t <= 0.1 || t >= clipLenS(c)) return toast('Đưa vị trí xem vào giữa clip trước', true); set('out', +(c.in + t * (c.speed || 1)).toFixed(2)); }}, '✂ Kết thúc tại vị trí đang xem'),
    h('button', {class: 'small', onclick: () => { const t = secNow() - c.at; if (t <= 0.1 || t >= clipLenS(c)) return toast('Đưa vị trí xem vào giữa clip trước', true); commit((p) => { const x = p.tracks.video.find((y) => y.id === c.id); const ids = new Set(p.tracks.video.map((y) => y.id)); let k = 1, id; do { id = 'V' + String(k++).padStart(2, '0'); } while (ids.has(id)); const cut = +(x.in + t * (x.speed || 1)).toFixed(2); p.tracks.video.push({...JSON.parse(JSON.stringify(x)), id, at: +(x.at + t).toFixed(2), in: cut}); x.out = cut; }); }}, '✂ Tách đôi tại đây')));
  ed.append(h('div', {class: 'cols3'}, field('Tốc độ', h('select', {onchange: (e) => set('speed', +e.target.value)}, ...[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => h('option', {value: v, selected: (c.speed || 1) === v}, v + '×')))),
    num('fadeIn', 0.05, 0, 3, 'Hiện dần (s)'), num('fadeOut', 0.05, 0, 3, 'Tắt dần (s)')));
  ed.append(field('Khung hình', segOf('fit', [['cover', 'Phủ kín (cắt mép)'], ['contain', 'Vừa khung (viền đen)']], c.fit || (c.role === 'screen' ? 'contain' : 'cover'))));
  if (c.role === 'pip' || c.role === 'screen') {
    const P = {x: .5, y: .5, w: .4, r: .08, ...(c.pip || {})};
    ed.append(field('Kiểu khung', segOf('mask', (c.role === 'screen' ? ['phone', 'laptop', 'rounded', 'none'] : ['rounded', 'circle', 'none']).map((m) => [m, MASK_VI[m]]), c.mask || (c.role === 'screen' ? 'phone' : 'rounded'))));
    ed.append(h('div', {class: 'row', style: 'gap:4px;flex-wrap:wrap;margin-bottom:8px'}, ...[['↖', .22, .2], ['↗', .78, .2], ['⊙', .5, .5], ['↙', .22, .78], ['↘', .78, .78]].map(([l, x, y]) => h('button', {class: 'small', title: 'Đặt nhanh vị trí', onclick: () => commit((p) => { const v = p.tracks.video.find((q) => q.id === c.id); v.pip = {...P, x, y}; })}, l))));
    const rng = (k, min, max, step, label) => field(`${label}: ${(+P[k]).toFixed(2)}`, h('input', {type: 'range', min, max, step, value: P[k], onchange: (e) => setPip(k, +e.target.value)}));
    ed.append(h('div', {class: 'cols2'}, rng('x', 0, 1, .01, 'Ngang'), rng('y', 0, 1, .01, 'Dọc'), rng('w', .1, 1, .01, 'Cỡ (theo cạnh ngắn)'), ...(c.mask === 'rounded' || (!c.mask && c.role === 'pip') ? [rng('r', 0, .5, .01, 'Bo góc')] : [])));
  }
  const muted = c.volume == null;
  ed.append(h('div', {class: 'row', style: 'gap:14px;flex-wrap:wrap;align-items:center'},
    h('label', {class: 'chk', style: 'margin:0'}, h('input', {type: 'checkbox', checked: muted, disabled: src && !src.audio, onchange: (e) => set('volume', e.target.checked ? null : 0)}), src && !src.audio ? 'Video không có tiếng' : 'Tắt tiếng'),
    muted ? null : h('label', {style: 'display:flex;gap:6px;align-items:center;margin:0'}, 'Âm lượng', h('input', {type: 'number', step: 1, min: -40, max: 12, value: c.volume ?? 0, style: 'width:70px', onchange: (e) => set('volume', +e.target.value)}), 'dB'),
    muted ? null : h('label', {class: 'chk', style: 'margin:0'}, h('input', {type: 'checkbox', checked: c.duck !== false, onchange: (e) => set('duck', e.target.checked)}), 'Hạ nhạc nền khi clip có tiếng')));
  B.append(ed);
}
function useMedia(ref) {
  const k = mediaKind(ref); const box = h('div', {class: 'useList'}); const done = (m) => { $('#modal').hidden = true; toast(m); };
  const btn = (label, fn, hint) => box.append(h('button', {onclick: fn}, h('b', {}, label), hint ? h('div', {class: 'muted', style: 'font-size:12px'}, hint) : null));
  if (k === 'img') {
    const fields = Object.entries(S.project.copy || {}).filter(([key]) => /(_image|_logo|_img|_photo)$/i.test(key)).sort((a, b) => (a[1].scene === S.scene ? -1 : 0) - (b[1].scene === S.scene ? -1 : 0));
    for (const [key, v] of fields) btn(`Thay ảnh: ${v.label || key}`, () => { commit((p) => { p.copy[key].value = ref; }); if (S.scene !== v.scene) selectScene(v.scene); done('Đã thay ảnh ' + (v.label || key)); }, `cảnh ${v.scene}${v.value ? ' · đang là ' + String(v.value).split('/').pop() : ''}`);
    btn('Thêm làm Ảnh chèn', () => { $('#modal').hidden = true; addOverlayFrom(ref); }, `3 giây từ vị trí đang xem (${fmtT(secNow())}), kéo để đặt vị trí`);
    btn('Thêm làm Watermark / logo góc', () => { $('#modal').hidden = true; newOverlay('image', 'watermark', {src: ref}); goTab('overlays'); }, 'hiện suốt video, mờ 35% ở góc phải dưới');
    if (S.project.type === 'carousel') box.append(h('div', {class: 'hint', style: 'margin-top:6px'}, 'Carousel: ảnh nền từng slide do Claude Code đặt trong slides/*.html; ở đây chỉ chèn ảnh nổi lên trên.'));
  } else if (k === 'audio' && S.project.type === 'carousel') {
    const sc = sceneById(S.scene); const tIn = +Math.max(0, secNow() - sc.start / BASE).toFixed(2);
    btn('Đặt làm nhạc chạy qua các slide', () => { commit((p) => { p.carousel ||= {}; p.carousel.audio = {...(p.carousel.audio || {}), mode: 'music', music: {...(p.carousel.audio?.music || {gain: -4, start: 0}), src: ref}}; }); done('Đã đặt nhạc carousel · xuất lại để nghe'); }, 'bài hát chạy tiếp từ slide này sang slide sau');
    btn(`Thêm SFX vào ${sc.id} tại giây ${tIn}`, () => { commit((p) => { const s = p.scenes.find((x) => x.id === sc.id); (s.cues ||= []).push({t: tIn, src: ref, gain: -10}); s.cues.sort((a, b) => a.t - b.t); }); done(`Đã thêm SFX vào ${sc.id}`); }, 'âm thanh carousel được trộn khi xuất (tab Xuất)');
  } else if (k === 'audio') {
    btn('Đặt làm nhạc nền', () => { commit((p) => { p.audio ||= {}; p.audio.mode = 'layers'; p.audio.music = {...(p.audio.music || {gain: -4, edit: [], fadeOut: 2.5}), src: ref, edit: []}; p.audio.cues ||= []; }); done('Đã đặt nhạc nền · xem tab Âm thanh'); }, 'chế độ Ghép lớp, phát từ đầu bài');
    btn('Thêm làm giọng đọc tại vị trí đang xem', async () => { const len = await audioLen(mediaUrl(ref)); commit((p) => { p.audio ||= {mode: 'layers', cues: []}; if (p.audio.mode !== 'layers') p.audio.mode = 'layers'; (p.audio.voice ||= []).push({t: +secNow().toFixed(2), src: ref, len: +len.toFixed(2), gain: 0, label: ref.split('/').pop()}); p.audio.voice.sort((a, b) => a.t - b.t); }); done(`Đã thêm giọng đọc ${len.toFixed(1)} s tại ${fmtT(secNow())}`); }, 'nhạc tự hạ nhỏ khi có thoại');
    btn('Thêm làm hiệu ứng (SFX) tại vị trí đang xem', () => { commit((p) => { p.audio ||= {mode: 'layers', cues: []}; if (p.audio.mode !== 'layers') p.audio.mode = 'layers'; (p.audio.cues ||= []).push({t: +secNow().toFixed(2), src: ref, gain: -10, label: ref.split('/').pop()}); p.audio.cues.sort((a, b) => a.t - b.t); }); done('Đã thêm SFX tại ' + fmtT(secNow())); });
  } else if (k === 'lottie') btn('Thêm làm Lottie chèn', () => { $('#modal').hidden = true; addOverlayFrom(ref); });
  else if (k === 'video' && S.project.type !== 'carousel') {
    for (const [role, label] of [['broll', 'Thêm làm B-roll tại vị trí đang xem'], ['pip', 'Thêm làm PiP (khung nhỏ)'], ['main', 'Thêm làm footage chính']]) btn(label, async () => {
      $('#modal').hidden = true;
      try { const r = await api('/api/media/adopt', {id: S.id, rel: ref, sub: role === 'broll' ? 'broll' : 'footage'}); toast('Đang chuẩn bị ' + r.src + '…'); addClipWhenReady(r.task, r.src, role, secNow()); }
      catch (e) { toast(e.message, true, 6000); }
    }, role === 'broll' ? '3 giây, phủ khung, tắt tiếng; chuyển vào media/ của dự án' : 'chuyển vào media/ của dự án, tạo bản xem trước 540p');
  }
  else box.append(h('p', {class: 'muted'}, 'Loại file này chưa dùng trực tiếp được trong Studio.'));
  box.append(h('div', {class: 'row', style: 'margin-top:8px'}, h('button', {class: 'small', onclick: () => { navigator.clipboard?.writeText(ref); toast('Đã chép: ' + ref); }}, 'Chép đường dẫn'), h('code', {class: 'muted', style: 'font-size:11px;word-break:break-all'}, ref)));
  modal(h('div', {style: 'min-width:min(460px,90vw)'}, h('h3', {}, 'Dùng file này'), k === 'img' ? h('img', {src: mediaUrl(ref), style: 'max-width:100%;max-height:200px;border-radius:8px;margin-bottom:10px'}) : null, box));
}
/** chọn file: dự án · thư viện SAMI · stock → Promise<ref|null> */
function pickMedia(type) {
  return new Promise((ok) => {
    let tab = 'proj'; const body = h('div', {}); const pick = (ref) => { $('#modal').hidden = true; ok(ref); };
    const libKinds = {img: ['img'], audio: ['music', 'sfx', 'voice'], lottie: ['lottie'], video: ['video']}[type] || [type];
    const draw = async () => {
      body.innerHTML = '';
      if (tab === 'proj') {
        const L = S.assets.filter((a) => a.type === type);
        body.append(L.length ? h('div', {class: 'stockGrid'}, ...L.map((a) => mediaTile(a.path, {onPick: pick}))) : h('p', {class: 'muted'}, 'Dự án chưa có file loại này. Tải lên, hoặc lấy từ thư viện / stock.'));
      } else if (tab === 'lib') {
        const q = h('input', {placeholder: 'Tìm trong thư viện SAMI…', value: S.libQ || ''}); const res = h('div', {});
        const go = async () => { S.libQ = q.value; res.innerHTML = '<div class="muted">Đang tìm…</div>'; const out = []; for (const k of libKinds) { try { const r = await api(`/api/library/search?kind=${k}&q=${encodeURIComponent(q.value)}&limit=60`); out.push(...r.items); } catch {} } res.innerHTML = ''; res.append(out.length ? h('div', {class: 'stockGrid'}, ...out.map((it) => mediaTile(it.uri, {onPick: pick}))) : h('p', {class: 'muted'}, 'Không có kết quả.')); };
        q.onkeydown = (e) => { if (e.key === 'Enter') go(); };
        body.append(h('div', {class: 'row'}, q, h('button', {onclick: go}, 'Tìm')), res); go();
      } else {
        const q = h('input', {placeholder: 'Từ khoá tiếng Anh: pho, restaurant interior…'}); const res = h('div', {});
        const go = async () => { res.innerHTML = '<div class="muted">Đang tìm…</div>'; let r; try { r = await api(`/api/providers/stock?q=${encodeURIComponent(q.value)}&kind=${type === 'video' ? 'video' : 'img'}&provider=auto`); } catch (e) { res.innerHTML = ''; return res.append(h('p', {class: 'v-fail'}, e.message)); }
          res.innerHTML = ''; for (const e of r.errors) res.append(h('div', {class: 'v-warn', style: 'font-size:12px'}, e));
          res.append(h('div', {class: 'stockGrid'}, ...r.items.map((it) => h('div', {class: 'stk', title: `${it.title}\n${it.author || ''} · ${it.provider} · ${it.licence?.name || ''}`}, h('img', {src: it.thumb, loading: 'lazy', referrerpolicy: 'no-referrer'}), h('div', {class: 'meta'}, `${it.provider} · ${it.w}×${it.h}`),
            h('button', {class: 'small primary', style: 'margin:0 5px 5px', onclick: async (ev) => { ev.target.disabled = true; ev.target.textContent = '…'; try { const f = await api('/api/providers/stock/fetch', {item: it, id: S.id, to: 'project'}); S.assets = await api('/api/project/assets?id=' + S.id); pick(f.rel); } catch (err) { ev.target.disabled = false; ev.target.textContent = 'Chọn'; toast(err.message, true); } }}, 'Chọn'))))); };
        q.onkeydown = (e) => { if (e.key === 'Enter') go(); };
        body.append(h('div', {class: 'row'}, q, h('button', {onclick: go}, 'Tìm')), h('div', {class: 'hint', style: 'margin-top:6px'}, 'Pexels, Pixabay, Unsplash (cần khoá miễn phí, nhập ở tab Nguồn & AI), Wikimedia (không cần khoá). Ảnh lấy về kèm tác giả + giấy phép.'), res);
      }
    };
    const seg = h('div', {class: 'seg', style: 'margin-bottom:10px'}, ...[['proj', 'Trong dự án'], ['lib', 'Thư viện SAMI'], ...(['img', 'video'].includes(type) ? [['stock', 'Stock miễn phí']] : [])].map(([v, l]) => h('button', {class: v === tab ? 'on' : '', onclick: (e) => { tab = v; [...seg.children].forEach((x) => x.classList.toggle('on', x === e.target)); draw(); }}, l)));
    modal(h('div', {style: 'width:min(720px,90vw)'}, h('h3', {}, 'Chọn ' + ({img: 'ảnh', audio: 'âm thanh', lottie: 'Lottie', video: 'video'}[type] || 'file')), seg, body));
    const close = $('#modalClose'); const prev = close.onclick; close.onclick = () => { close.onclick = prev; $('#modal').hidden = true; ok(null); };
    draw();
  });
}
const pickBtn = (type, onPick) => h('button', {class: 'small', title: 'Chọn từ dự án, thư viện SAMI hoặc stock miễn phí', onclick: async () => { const r = await pickMedia(type); if (r) onPick(r); }}, '📚 Chọn…');
// kéo thả lên khung xem: file từ máy, ảnh/âm thanh từ tab Nguồn & AI hoặc hộp Chọn
(() => {
  const vp = $('#viewport'); let depth = 0;
  const on = () => vp.classList.add('dropping'), off = () => { depth = 0; vp.classList.remove('dropping'); };
  document.addEventListener('dragenter', (e) => { if (!S.project || $('#home') && !$('#home').hidden) return; if ([...e.dataTransfer.types].some((t) => t === 'Files' || t === 'application/x-sami-media')) { depth++; on(); } });
  document.addEventListener('dragleave', () => { if (--depth <= 0) off(); });
  document.addEventListener('drop', off); document.addEventListener('dragend', off);
  vp.addEventListener('dragover', (e) => { if (S.project) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  vp.addEventListener('drop', async (e) => {
    e.preventDefault(); off(); if (!S.project) return;
    const r = $('#stageWrap').getBoundingClientRect(); const cl = (v) => Math.max(0.03, Math.min(0.97, v));
    const pos = {x: +cl((e.clientX - r.left) / r.width).toFixed(3), y: +cl((e.clientY - r.top) / r.height).toFixed(3)};
    let ref = null;
    try {
      const d = e.dataTransfer.getData('application/x-sami-media');
      if (d) { const x = JSON.parse(d); if (x.stock) { toast('Đang lấy ảnh stock…'); const f = await api('/api/providers/stock/fetch', {item: x.stock, id: S.id, to: 'project'}); S.assets = await api('/api/project/assets?id=' + S.id); ref = f.rel; } else ref = x.ref; }
      else if (e.dataTransfer.files.length) {
        const f = e.dataTransfer.files[0]; const k = mediaKind(f.name); if (!['img', 'audio', 'lottie', 'video'].includes(k)) return toast('Chỉ nhận ảnh, âm thanh, video hoặc Lottie', true);
        if (k === 'video' && S.project.type !== 'carousel') { // footage (0.9): streamed into media/ + 540p proxy, then on the timeline at the playhead
          const at = secNow(); const box = h('div', {class: 'useList'}, h('p', {class: 'muted', style: 'margin-top:0'}, f.name + ' · đặt vào timeline tại ' + fmtT(at) + ' như:'));
          for (const [role, label] of [['main', 'Footage chính (phủ khung)'], ['broll', 'B-roll (chèn ngắn, tắt tiếng)'], ['pip', 'PiP: khung nhỏ tại chỗ thả'], ['screen', 'Màn hình: trong khung điện thoại']]) box.append(h('button', {onclick: () => { $('#modal').hidden = true; S.ft.dropPos = role === 'pip' ? pos : null; ftUpload([f], role, at); }}, h('b', {}, label)));
          return modal(h('div', {style: 'max-width:440px'}, h('h3', {}, '🎬 Thêm footage'), box));
        }
        toast('Đang tải lên ' + f.name + '…');
        const up = await fetch(`/api/upload?id=${S.id}&sub=${k}&name=${encodeURIComponent(f.name)}`, {method: 'POST', body: f}).then((x) => x.json());
        S.assets = await api('/api/project/assets?id=' + S.id); ref = up.path;
      }
    } catch (err) { return toast(err.message, true, 6000); }
    if (!ref) return;
    const k = mediaKind(ref);
    if (k === 'img' || k === 'lottie') addOverlayFrom(ref, pos); else useMedia(ref);
  });
})();

// ─────────────────────────── NGUỒN & AI (sami-media gateway) ───────────────────────────
const KIND_LABEL = {img: 'Ảnh', video: 'Video', music: 'Nhạc', sfx: 'Hiệu ứng âm thanh', voice: 'Giọng đọc'};
const usdT = (x) => (+x || 0).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + ' USD';
S.ai = {q: '', kind: 'img', provider: 'auto', orientation: '', items: null, errors: [], gen: {kind: 'img', provider: '', prompt: '', n: 1, ratio: '9:16', seconds: 30, voice: '', model: ''}, est: null, to: 'project', busy: false, results: [], task: null};
const RUNNER_LABEL = {script: 'kịch bản cố định', jev: 'Jev', claude: 'Claude Code'};
const WEB_SITE = {'chatgpt-web': 'chatgpt', 'gemini-web': 'google', 'flow-web': 'google', 'suno-web': 'suno'};
const onAgentTask = (t) => {
  if (t.kind !== 'agent') return; S.ai.task = t;
  if (t.status === 'done' || t.status === 'error') {
    S.ai.busy = false; if (t.result?.files?.length) { S.ai.results = [...t.result.files, ...S.ai.results].slice(0, 40); if (S.id) api('/api/project/assets?id=' + S.id).then((a) => (S.assets = a)).catch(() => {}); }
    toast(t.status === 'done' ? `Xong (${RUNNER_LABEL[t.result?.runner] || 'trình duyệt'}): ${t.result?.files?.length || 0} file` : 'Dừng: ' + (t.error || '').slice(0, 160), t.status !== 'done', 8000);
    if (S.tab === 'ai') renderTab();
  } else { const el = $('#aiProgress'); if (el) el.textContent = t.msg; }
};
async function tabAI(B) {
  const A = S.ai;
  let P; try { P = await api('/api/providers'); } catch (e) { B.append(h('div', {class: 'v-fail'}, e.message)); return; }
  if (S.tab !== 'ai') return;
  const L = P.ledger;
  B.append(h('div', {class: 'hint', style: 'margin:0 0 10px'}, `Tìm hoặc tạo media rồi bấm "Dùng ▾" (hoặc kéo thả lên khung xem) để đưa vào video. Thứ tự nên dùng: thư viện SAMI → stock miễn phí → gói web trong Chrome SAMI → API trả tiền. Hôm nay đã dùng ${usdT(L.day)} / ${P.caps.dailyUsd} USD · tháng ${usdT(L.month)} / ${P.caps.monthlyUsd} USD.`));
  B.append(h('div', {class: 'seg', style: 'margin-bottom:12px'}, ...[['project', 'Lưu vào dự án'], ['library', 'Lưu vào thư viện SAMI (dùng chung)']].map(([v, t]) => h('button', {class: A.to === v ? 'on' : '', onclick: () => { A.to = v; renderTab(); }}, t))));
  const saved = async (refs) => { if (A.to === 'project') S.assets = await api('/api/project/assets?id=' + S.id); A.results = [...refs, ...A.results.filter((x) => !refs.includes(x))].slice(0, 40); };

  // — kết quả gần đây —
  if (A.results.length) B.append(h('div', {class: 'group'}, h('h4', {}, `Vừa lấy / vừa tạo (${A.results.length})`, h('button', {class: 'small', onclick: () => { A.results = []; renderTab(); }}, 'Ẩn')),
    h('div', {class: 'hint', style: 'margin:0 0 6px'}, 'Bấm "Dùng ▾" để thay ảnh, thêm ảnh chèn, đặt nhạc nền / giọng đọc / SFX. Hoặc kéo thả lên khung xem.'),
    h('div', {class: 'stockGrid'}, ...A.results.map((ref) => mediaTile(ref)))));

  // — stock —
  const stock = P.providers.filter((p) => p.stock);
  const sg = h('div', {class: 'group'}, h('h4', {}, 'Tìm ảnh / video stock (miễn phí)'));
  const q = h('input', {value: A.q, placeholder: 'Từ khoá tiếng Anh: pho bo, restaurant interior, chef cooking…', onkeydown: (e) => { if (e.key === 'Enter') go(); }});
  const go = async () => { A.q = q.value.trim(); if (!A.q) return; A.items = null; A.errors = []; renderTab(); try { const r = await api(`/api/providers/stock?q=${encodeURIComponent(A.q)}&kind=${A.kind}&provider=${A.provider}&orientation=${A.orientation}`); A.items = r.items; A.errors = r.errors; } catch (e) { A.items = []; A.errors = [e.message]; } if (S.tab === 'ai') renderTab(); };
  sg.append(h('div', {class: 'row'}, q, h('button', {class: 'primary', onclick: go}, 'Tìm')),
    h('div', {class: 'cols3', style: 'margin-top:8px'},
      h('select', {onchange: (e) => { A.kind = e.target.value; }}, ...['img', 'video'].map((k) => h('option', {value: k, selected: A.kind === k}, KIND_LABEL[k]))),
      h('select', {onchange: (e) => { A.provider = e.target.value; }}, h('option', {value: 'auto'}, 'Mọi nguồn có khoá'), ...stock.map((p) => h('option', {value: p.id, selected: A.provider === p.id, disabled: !p.available}, p.label + (p.available ? '' : ' (chưa có khoá)')))),
      h('select', {onchange: (e) => { A.orientation = e.target.value; }}, ...[['', 'Mọi hướng'], ['portrait', 'Dọc'], ['landscape', 'Ngang'], ['square', 'Vuông']].map(([v, t]) => h('option', {value: v, selected: A.orientation === v}, t)))));
  if (stock.some((p) => !p.available)) sg.append(h('div', {class: 'hint', style: 'margin:6px 0 0'}, 'Pexels / Pixabay / Unsplash cần khoá miễn phí (mục Khoá API bên dưới). Wikimedia không cần khoá.'));
  if (A.items === null && A.q) sg.append(h('div', {class: 'muted', style: 'margin-top:8px'}, 'Đang tìm…'));
  for (const e of A.errors) sg.append(h('div', {class: 'v-warn', style: 'font-size:12px;margin-top:6px'}, e));
  const fetchIt = async (it, btn) => { btn.disabled = true; const t = btn.textContent; btn.textContent = '…'; try { const r = await api('/api/providers/stock/fetch', {item: it, id: S.id, to: A.to}); it._ref = r.uri || r.rel; await saved([it._ref]); btn.disabled = false; btn.textContent = t; return it._ref; } catch (e) { btn.disabled = false; btn.textContent = t; toast(e.message, true, 6000); return null; } };
  if (A.items?.length) sg.append(h('div', {class: 'stockGrid'}, ...A.items.map((it) => h('div', {class: 'stk', draggable: 'true', ondragstart: dragMedia(it._ref ? {ref: it._ref} : {stock: it}), title: `${it.title}\n${it.author || ''} · ${it.provider}\n${it.licence?.name || ''}\nKéo thả lên khung xem để chèn`},
    it.thumb ? h('img', {src: it.thumb, loading: 'lazy', referrerpolicy: 'no-referrer'}) : h('div', {class: 'ph'}, it.title),
    h('div', {class: 'meta'}, `${it.provider}${it.duration ? ' · ' + it.duration + ' s' : ''} · ${it.w}×${it.h}`),
    h('div', {class: 'row', style: 'margin:0 5px 5px;gap:4px'},
      h('button', {class: 'small primary', onclick: async (ev) => { const ref = it._ref || await fetchIt(it, ev.target); if (ref) useMedia(ref); }}, 'Dùng ▾'),
      h('button', {class: 'small', title: 'Chỉ lưu, chưa dùng', onclick: async (ev) => { if (it._ref) return toast('Đã lưu rồi: ' + it._ref); if (await fetchIt(it, ev.target)) { toast('Đã lưu ' + it._ref); renderTab(); } }}, it._ref ? '✓' : 'Lưu'))))));
  else if (A.items) sg.append(h('div', {class: 'muted', style: 'margin-top:8px'}, 'Không có kết quả.'));
  B.append(sg);

  // — tạo bằng AI —
  const G = A.gen; const gens = P.providers.filter((p) => !p.stock && p.kinds.includes(G.kind));
  if (!gens.some((p) => p.id === G.provider)) G.provider = (gens.find((p) => p.available && !p.paid && !p.web) || gens.find((p) => p.web) || gens.find((p) => p.available) || gens[0])?.id || '';
  const pv = P.providers.find((p) => p.id === G.provider);
  const gg = h('div', {class: 'group'}, h('h4', {}, 'Tạo bằng AI'));
  const setG = (k, v, re = false) => { G[k] = v; A.est = null; if (re) renderTab(); };
  const tag = (p) => (p.web ? 'gói web, Chrome SAMI' : p.paid ? 'trả tiền' : 'miễn phí');
  gg.append(h('div', {class: 'cols2'},
    field('Loại', h('select', {onchange: (e) => setG('kind', e.target.value, true)}, ...['img', 'voice', 'music', 'sfx', 'video'].map((k) => h('option', {value: k, selected: G.kind === k}, KIND_LABEL[k])))),
    field('Nguồn', h('select', {onchange: (e) => { G.model = ''; G.voice = ''; setG('provider', e.target.value, true); }}, ...gens.map((p) => h('option', {value: p.id, selected: p.id === G.provider}, `${p.label} · ${tag(p)}${!p.available && p.keyId ? ' · chưa có khoá' : !p.available ? ' · chưa chạy' : ''}`))))));
  if (pv?.keyId && !pv.keySource) {
    const k = P.keys[pv.keyId]; const inp = h('input', {type: 'password', autocomplete: 'off', placeholder: `Dán khoá ${k.label}…`});
    gg.append(h('div', {class: 'keyInline'}, h('div', {style: 'font-size:12.5px;margin-bottom:4px'}, `${pv.label} cần khoá API `, h('a', {href: k.url, target: '_blank', class: 'help'}, 'lấy khoá ↗'), '. Khoá được mã hoá, chỉ máy này đọc được.'),
      h('div', {class: 'row'}, inp, h('button', {class: 'small primary', onclick: async () => { if (!inp.value.trim()) return; try { await api('/api/providers/key', {keyId: pv.keyId, key: inp.value}); toast('Đã lưu khoá ' + k.label); renderTab(); } catch (e) { toast(e.message, true); } }}, 'Lưu khoá'))));
  } else if (pv && !pv.available && !pv.web) gg.append(h('div', {class: 'v-warn', style: 'font-size:12px;margin:-4px 0 8px'}, pv.reason));
  const prompt = h('textarea', {rows: 4, placeholder: G.kind === 'voice' ? 'Lời thoại…' : G.kind === 'sfx' && G.provider === 'synth-sfx' ? 'Tên hiệu ứng: whoosh, pop, chime, riser, impact, click, sparkle…' : 'Mô tả bằng tiếng Anh cho kết quả tốt nhất. Không cần chữ trên ảnh: chữ nằm ở tab Chữ.', oninput: (e) => setG('prompt', e.target.value)}, G.prompt);
  gg.append(field(G.kind === 'voice' ? 'Lời thoại' : 'Prompt', prompt));
  const row = h('div', {class: 'cols3'});
  if (['img', 'sfx'].includes(G.kind)) row.append(field('Số lượng', h('input', {type: 'number', min: 1, max: G.kind === 'img' ? (pv?.id === 'chatgpt-web' ? 5 : 8) : 4, value: G.n, oninput: (e) => setG('n', +e.target.value)})));
  if (['img', 'video'].includes(G.kind)) row.append(field('Tỉ lệ', h('select', {onchange: (e) => setG('ratio', e.target.value)}, ...['9:16', '4:5', '1:1', '16:9', '3:2', '2:3'].map((r) => h('option', {value: r, selected: G.ratio === r}, r)))));
  if (['music', 'sfx'].includes(G.kind)) row.append(field('Độ dài (s)', h('input', {type: 'number', min: 0.5, max: 300, step: 0.5, value: G.seconds, oninput: (e) => setG('seconds', +e.target.value)})));
  if (pv?.models) row.append(field('Model', h('select', {onchange: (e) => setG('model', e.target.value)}, ...pv.models.map((m) => h('option', {value: m, selected: (G.model || pv.defaults.model) === m}, m)))));
  if (G.kind === 'voice' && pv?.voices) row.append(field('Giọng', h('select', {onchange: (e) => setG('voice', e.target.value)}, ...Object.entries(pv.voices).map(([v, t]) => h('option', {value: v, selected: (G.voice || pv.defaults.voice) === v}, t)))));
  if (row.childNodes.length) gg.append(row);
  const reqNow = () => ({provider: G.provider, kind: G.kind, prompt: G.prompt, n: ['img', 'sfx'].includes(G.kind) ? G.n : 1, ratio: ['img', 'video'].includes(G.kind) ? G.ratio : undefined, seconds: ['music', 'sfx'].includes(G.kind) ? G.seconds : undefined, model: G.model || undefined, voice: G.kind === 'voice' ? G.voice || undefined : undefined});
  const run = async (token) => {
    A.busy = true; A.est = null; renderTab();
    try { const r = await api('/api/providers/generate', {req: reqNow(), token, id: S.id, to: A.to}); await saved(r.files.map((f) => f.uri || f.rel)); toast(`Xong ${r.files.length} file · ${usdT(r.usd)} · bấm "Dùng ▾" để đưa vào video`, false, 6000); }
    catch (e) { modal(h('div', {}, h('h3', {}, 'Tạo không thành công'), h('p', {class: 'v-fail', style: 'white-space:pre-wrap'}, e.message), h('p', {class: 'muted'}, 'Studio không tự chạy lại. Kiểm tra rồi bấm Tạo lại.'))); }
    A.busy = false; if (S.tab === 'ai') renderTab();
  };
  // gói web: Chrome SAMI (hồ sơ riêng cho tự động hoá) + người chạy: kịch bản cố định → Jev → Claude Code
  let C = null, plan = [];
  if (pv?.web) {
    if (!A.chrome) { try { A.chrome = await api('/api/providers/chrome'); } catch (e) { A.chrome = {error: e.message}; } if (S.tab !== 'ai') return; }
    C = A.chrome; plan = C.plans?.[pv.id] || [];
    const site = WEB_SITE[pv.id]; const logged = C.logins?.[site];
    const openChrome = async (siteId) => { try { const r = await api('/api/providers/chrome/open', {site: siteId}); toast(r.started ? 'Đã mở Chrome SAMI' + (r.first ? ': đăng nhập ChatGPT, Google, Suno một lần trong cửa sổ này' : '') : 'Chrome SAMI đang mở', false, 7000); } catch (e) { toast(e.message, true, 8000); } A.chrome = null; renderTab(); };
    gg.append(h('div', {class: 'estBox', style: 'margin:0 0 10px'},
      h('div', {class: 'row', style: 'justify-content:space-between;flex-wrap:wrap'}, h('b', {}, 'Chrome SAMI ', h('span', {class: 'muted', style: 'font-weight:400;font-size:12px'}, '(cửa sổ Chrome riêng cho tự động hoá, không đụng Chrome bạn đang dùng)')),
        h('div', {class: 'row', style: 'gap:6px'}, C.running ? null : h('button', {class: 'small primary', onclick: () => openChrome()}, 'Mở Chrome SAMI'), h('button', {class: 'small', title: 'Kiểm lại', onclick: () => { A.chrome = null; renderTab(); }}, '↻'))),
      C.error ? h('div', {class: 'v-fail', style: 'font-size:12px;margin-top:4px'}, C.error)
        : h('div', {style: 'font-size:12.5px;margin-top:4px'}, C.running ? '● Đang mở' : '○ Chưa mở', C.running && site ? [' · ', logged ? `✓ đã đăng nhập ${C.sites[site].label}` : h('span', {class: 'v-warn'}, `chưa đăng nhập ${C.sites[site].label} `), logged ? null : h('button', {class: 'small', onclick: () => openChrome(site)}, 'Mở trang đăng nhập')] : null),
      h('div', {class: 'muted', style: 'font-size:12px;margin-top:4px'}, 'Chạy lần lượt: ', ...plan.flatMap((s, i) => [i ? ' → ' : '', h('span', {title: s.reason || '', style: s.ok ? '' : 'text-decoration:line-through;opacity:.7'}, s.label)]), '. Prompt chỉ gửi một lần; file tải về ', C.downloads ? h('code', {}, C.downloads) : 'thư mục cố định', '.')));
  }
  const runAgent = () => {
    if (!G.prompt.trim()) return toast('Viết prompt trước', true);
    const credit = {'flow-web': 'Mỗi lần tạo tốn credit Google AI của bạn.', 'suno-web': 'Mỗi lượt tốn credit Suno (thường 10 credit, ra 2 bài).'}[pv.id];
    const script = plan.find((s) => s.id === 'script')?.ok;
    modal(h('div', {style: 'max-width:520px'}, h('h3', {}, `Tạo bằng ${pv.label} trong Chrome SAMI`),
      h('p', {}, 'Studio mở một tab mới trong ', h('b', {}, 'Chrome SAMI'), ', gửi đúng prompt này ', h('b', {}, 'một lần'), ', chờ kết quả, tải về và lưu vào ', A.to === 'project' ? 'dự án' : 'thư viện SAMI', ' kèm prompt + giấy phép.'),
      h('ul', {class: 'muted', style: 'font-size:13px;padding-left:18px'},
        h('li', {}, script ? 'Chạy bằng kịch bản cố định (0 token). Kịch bản không làm được thì mới nhờ Claude Code (tốn hạn mức Claude, khoảng 0,5 đến 2 USD quy đổi).' : 'Nguồn này chưa có kịch bản cố định: Claude Code làm (tốn hạn mức Claude, khoảng 0,5 đến 2 USD quy đổi mỗi lượt).'),
        h('li', {}, 'Gặp trang đăng nhập hay CAPTCHA: dừng và báo lại.'), credit ? h('li', {}, credit) : null, h('li', {}, 'Thường mất 1 đến 6 phút. Studio vẫn dùng được trong lúc chờ.')),
      h('pre', {style: 'white-space:pre-wrap;background:#0A0722;padding:8px;border-radius:8px;font-size:12px;max-height:160px;overflow:auto'}, G.prompt),
      h('div', {class: 'row'}, h('button', {class: 'primary', onclick: async () => { $('#modal').hidden = true; try { const r = await api('/api/providers/agent', {req: reqNow(), id: S.id, to: A.to}); A.busy = true; A.task = {id: r.task, status: 'running', msg: 'Đang nối Chrome SAMI…'}; renderTab(); } catch (e) { toast(e.message, true, 8000); } }}, 'Đồng ý, bắt đầu'))));
  };
  const busyAgent = A.task?.status === 'running';
  const label = pv?.web ? (plan.find((s) => s.id === 'script')?.ok ? '✨ Tạo (kịch bản cố định)' : '✨ Tạo bằng Claude Code') : pv?.paid ? '✨ Tạo… (xem chi phí trước)' : '✨ Tạo';
  const canRun = pv && !A.busy && !busyAgent && (pv.web ? !!C?.running && plan.some((s) => s.ok) : pv.available);
  gg.append(h('div', {class: 'row', style: 'flex-wrap:wrap'}, h('button', {class: 'primary', disabled: !canRun, onclick: async () => {
    if (!G.prompt.trim()) return toast(G.kind === 'voice' ? 'Viết lời thoại trước' : 'Viết prompt trước', true);
    if (pv.web) return runAgent();
    if (!pv.paid) return run(null);
    try { A.est = await api('/api/providers/estimate', {req: reqNow(), id: S.id, to: A.to}); } catch (e) { A.est = {error: e.message}; } renderTab();
  }}, label), pv?.web && C && !C.running ? h('span', {class: 'v-warn', style: 'font-size:12px'}, 'Mở Chrome SAMI trước') : null));
  const E = A.est;
  if (busyAgent || A.busy) gg.append(h('div', {class: 'estBox'}, h('div', {class: 'row', style: 'justify-content:space-between'}, h('b', {}, busyAgent ? `Đang chạy trong Chrome SAMI${A.task.runner ? ' · ' + RUNNER_LABEL[A.task.runner] : ''}…` : 'Đang tạo…'), busyAgent ? h('button', {class: 'small danger', onclick: async () => { await api('/api/providers/agent/cancel', {task: A.task.id}); }}, 'Dừng') : null), h('div', {class: 'muted', style: 'font-size:12.5px;margin-top:4px', id: 'aiProgress'}, A.task?.msg || 'Không đóng Studio trong lúc chờ')));
  else if (A.task && A.task.status !== 'running' && A.task.result) gg.append(h('div', {class: 'hint', style: 'margin:8px 0 0'}, `Lượt gần nhất (${RUNNER_LABEL[A.task.result.runner] || 'trình duyệt'}): ${A.task.result.text?.slice(0, 200) || ''}${A.task.result.costUsd != null ? ` · ≈ ${usdT(A.task.result.costUsd)} hạn mức Claude` : ''}`));
  if (E?.error) gg.append(h('div', {class: 'v-fail', style: 'margin-top:8px;white-space:pre-wrap'}, E.error));
  else if (E) {
    const box = h('div', {class: 'estBox'}, h('div', {}, h('b', {}, E.label), ` · ${E.units}`), h('div', {class: 'big'}, '≈ ' + usdT(E.usd)), E.notes ? h('div', {class: 'hint', style: 'margin:4px 0 0'}, E.notes) : null,
      h('div', {class: 'muted', style: 'font-size:12px;margin-top:4px'}, `Sau lệnh này: hôm nay ${usdT(E.spent.day + E.usd)} / ${E.caps.dailyUsd} USD · tháng ${usdT(E.spent.month + E.usd)} / ${E.caps.monthlyUsd} USD`));
    if (E.blocked) box.append(h('div', {class: 'v-fail', style: 'margin-top:6px'}, E.blocked));
    else box.append(h('div', {class: 'row', style: 'margin-top:8px'}, h('button', {class: 'primary', onclick: () => run(E.token)}, `Xác nhận tạo · ≈ ${usdT(E.usd)}`), h('button', {onclick: () => { A.est = null; renderTab(); }}, 'Huỷ'), h('span', {class: 'muted', style: 'font-size:12px'}, 'Mã dùng 1 lần, hết hạn 10 phút')));
    gg.append(box);
  }
  B.append(gg);

  // — khoá API —
  const kg = h('details', {class: 'group'}, h('summary', {style: 'cursor:pointer;font-weight:600;font-size:13px'}, `Khoá API (${Object.values(P.keys).filter((k) => k.source).length}/${Object.keys(P.keys).length} đã đặt)`), h('div', {class: 'hint', style: 'margin:8px 0'}, 'Khoá được mã hoá bằng DPAPI của Windows trong %APPDATA%\\SAMI\\providers.json: chỉ tài khoản Windows này đọc được. Studio và Claude Code không bao giờ hiện lại khoá.'));
  for (const [id, k] of Object.entries(P.keys)) {
    const inp = h('input', {type: 'password', autocomplete: 'off', placeholder: k.source ? '••••••••  (dán khoá mới để thay)' : 'Dán khoá…'});
    kg.append(h('div', {class: 'keyRow'}, h('div', {class: 'kl'}, h('b', {}, k.label), h('span', {class: k.source ? 'v-ok' : 'muted', style: 'font-size:12px'}, k.source === 'ui' ? ' ✓ đã đặt' : k.source === 'env' ? ' ✓ từ biến môi trường' : ' chưa đặt'), k.free ? h('span', {class: 'muted', style: 'font-size:12px'}, ' · miễn phí') : null, h('a', {href: k.url, target: '_blank', class: 'help', style: 'font-size:12px;margin-left:6px'}, 'lấy khoá ↗')),
      h('div', {class: 'row'}, inp, h('button', {class: 'small', onclick: async () => { if (!inp.value.trim()) return; try { await api('/api/providers/key', {keyId: id, key: inp.value}); inp.value = ''; toast('Đã lưu khoá ' + k.label); renderTab(); } catch (e) { toast(e.message, true); } }}, 'Lưu'),
        k.source === 'ui' ? h('button', {class: 'small danger', onclick: async () => { if (!confirm('Xoá khoá ' + k.label + '?')) return; await api('/api/providers/key', {keyId: id, delete: true}); renderTab(); }}, 'Xoá') : null)));
  }
  B.append(kg);

  // — trần chi phí + sổ + cổng cục bộ —
  const d = h('input', {type: 'number', min: 0, step: 0.5, value: P.caps.dailyUsd}), m = h('input', {type: 'number', min: 0, step: 1, value: P.caps.monthlyUsd});
  const cg = h('details', {class: 'group'}, h('summary', {style: 'cursor:pointer;font-weight:600;font-size:13px'}, `Trần chi phí & sổ chi phí · hôm nay ${usdT(L.day)}`),
    h('div', {class: 'cols3', style: 'margin-top:8px'}, field('USD / ngày', d), field('USD / tháng', m), h('label', {}, ' ', h('button', {onclick: async () => { try { await api('/api/providers/caps', {dailyUsd: d.value, monthlyUsd: m.value}); toast('Đã lưu trần chi phí'); renderTab(); } catch (e) { toast(e.message, true); } }}, 'Lưu trần'))));
  let LG = null; try { LG = await api('/api/providers/ledger?limit=20'); } catch {}
  if (LG?.recent?.length) cg.append(h('table', {class: 'ledger'}, h('tr', {}, h('th', {}, 'Lúc'), h('th', {}, 'Nguồn'), h('th', {}, 'Kết quả'), h('th', {}, 'USD')),
    ...LG.recent.map((r) => h('tr', {title: r.note || ''}, h('td', {}, new Date(r.ts).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})), h('td', {}, r.provider), h('td', {class: r.status === 'ok' ? '' : 'v-fail'}, r.status === 'ok' ? 'ok' : 'lỗi'), h('td', {}, r.charged ? usdT(r.charged) : '0')))));
  else cg.append(h('div', {class: 'muted'}, 'Chưa có lệnh nào.'));
  B.append(cg);
  const lg = h('details', {class: 'group'}, h('summary', {style: 'cursor:pointer;font-weight:600;font-size:13px'}, 'Cổng AI cục bộ (tuỳ chọn)'), h('div', {class: 'hint', style: 'margin:8px 0'}, 'Kokoro-FastAPI (giọng, không có tiếng Việt) và ComfyUI (ACE-Step nhạc, Stable Audio SFX) chạy trên máy này. Studio không tự cài model.'));
  for (const id of ['kokoro', 'comfyui']) {
    const pp = P.providers.find((x) => x.id === id); const inp = h('input', {value: P.opts[id]?.url || '', placeholder: pp.defaults.url});
    lg.append(field(`${pp.label} · ${pp.available ? '✓ đang chạy' : pp.reason}`, h('div', {class: 'row'}, inp, h('button', {class: 'small', onclick: async () => { try { await api('/api/providers/opts', {id, opts: {url: inp.value.trim()}}); renderTab(); } catch (e) { toast(e.message, true); } }}, 'Lưu'))));
  }
  B.append(lg);
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
  const pg = h('div', {class: 'group'}, h('h4', {}, 'Dọn lịch sử'));
  const lv = h('select', {}, h('option', {value: 'standard'}, 'Chuẩn: giữ 60 điểm tự động gần nhất + 1 điểm/ngày trong 30 ngày'), h('option', {value: 'compact'}, 'Gọn: giữ 10 điểm tự động gần nhất + 1 điểm/ngày trong 7 ngày'), h('option', {value: 'minimal'}, 'Tối thiểu: chỉ giữ 3 điểm tự động gần nhất'));
  pg.append(lv, h('div', {class: 'hint', style: 'margin:6px 0 8px'}, 'Mốc ★ và mốc bạn tự đặt KHÔNG bao giờ bị dọn. File ảnh/video không còn điểm neo nào dùng tới sẽ được xoá khỏi kho lịch sử để giải phóng ổ đĩa.'),
    h('button', {onclick: async (e) => {
      if (!confirm('Dọn lịch sử theo mức đã chọn? Điểm neo tự động bị dọn sẽ không khôi phục được nữa (mốc ★ vẫn giữ).')) return;
      e.target.disabled = true; e.target.textContent = 'Đang dọn…';
      try { const r = await api('/api/history/prune', {id: S.id, level: lv.value}); toast(`Đã dọn ${r.removed} điểm neo · giải phóng ${fmtBytes(r.before - r.after)} (còn ${fmtBytes(r.after)})`, false, 6000); renderTab(); }
      catch (err) { toast(err.message, true); e.target.disabled = false; }
    }}, '🧹 Dọn lịch sử'));
  B.append(pg);
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
        h('button', {class: 'small', title: 'Chụp ảnh từng cảnh của điểm neo này và của bản hiện tại, đặt cạnh nhau', onclick: () => compareDlg(it)}, 'So sánh'),
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
  modal(h('div', {}, h('h3', {}, 'Khôi phục điểm neo'),
    h('p', {class: 'muted', style: 'margin-top:0'}, `${new Date(it.time).toLocaleString('vi-VN')} · ${(HKIND[it.kind] || [it.kind])[0]}${it.label ? ' · ' + it.label : ''}`),
    rows.length ? h('div', {}, h('p', {}, h('b', {}, `${rows.length} mục khác với hiện tại.`), ' Tick từng mục nếu chỉ muốn khôi phục một phần (vd chỉ 1 cảnh hoặc chỉ nhạc):'), box) : h('p', {class: 'v-ok'}, 'Dự án hiện tại giống hệt điểm neo này — không có gì để khôi phục.'),
    h('div', {class: 'row', style: 'margin-top:12px;flex-wrap:wrap'},
      h('button', {class: 'primary', disabled: !rows.length, onclick: () => go(null)}, 'Khôi phục toàn bộ'),
      h('button', {disabled: !rows.length, onclick: () => { const p = checks.filter((c) => c.checked).map((c) => c.value); if (!p.length) return toast('Chưa chọn mục nào', true); go(p); }}, 'Chỉ khôi phục mục đã chọn'))));
}

// ─────────────────────────── REVIEW PACK + COMPARE (tasks in child processes) ───────────────────────────
S.tasks = {}; const taskWaiters = {};
const onTask = (t) => { S.tasks[t.id] = t; taskWaiters[t.id]?.(t); onAgentTask(t); if (t.kind === 'review' && t.project === S.id) { const el = $('#reviewMsg'); if (el) el.textContent = t.status === 'running' ? `${t.msg} (${Math.round((t.p || 0) * 100)}%)` : t.status === 'error' ? '✗ ' + t.error : ''; if (t.status === 'done') { toast(`Gói duyệt xong: ${t.result.scenes} cảnh × ${t.result.ratios.length} tỉ lệ`, false, 6000); if (S.tab === 'render') renderTab(); } } };
const projUrl = (rel) => `/proj/${S.id}/${rel.split('/').map(encodeURIComponent).join('/')}`;
function reviewGroup() {
  const g = h('div', {class: 'group'}, h('h4', {}, 'Gói duyệt khách'));
  const running = Object.values(S.tasks).find((t) => t.project === S.id && t.kind === 'review' && t.status === 'running');
  g.append(h('div', {class: 'hint', style: 'margin:0 0 8px'}, 'Ảnh khung giữa của mọi cảnh × mọi tỉ lệ → 1 file review.html (gửi qua Lark/Zalo/Email, mở trên điện thoại, có ô góp ý từng cảnh + nút Sao chép góp ý) + ảnh contact sheet. Không cần render video. ≈ 2–4 phút.'),
    h('div', {class: 'row', style: 'flex-wrap:wrap'},
      h('button', {class: 'primary', disabled: !!running, onclick: async () => { if (isDirty()) await save(); try { await api('/api/review', {id: S.id}); renderTab(); } catch (e) { toast(e.message, true); } }}, running ? 'Đang tạo…' : '📋 Tạo gói duyệt'),
      h('button', {title: 'Thêm bản video nhẹ 540p vào hàng đợi (gửi kèm để khách xem chuyển động)', onclick: async () => { if (isDirty()) await save(); try { await api('/api/render', {...S.render, res: '540p', fps: 30, crf: 28, ratio: S.project.formats[0], id: S.id, name: (S.render.name || S.project.name) + '_duyet', scope: 'all'}); toast('Đã thêm bản xem 540p vào hàng đợi'); } catch (e) { modal(h('pre', {style: 'white-space:pre-wrap'}, e.message)); } }}, '＋ Bản xem 540p')),
    h('div', {id: 'reviewMsg', class: 'muted', style: 'font-size:12.5px;margin-top:6px'}, running ? `${running.msg} (${Math.round((running.p || 0) * 100)}%)` : ''));
  const list = h('div', {style: 'margin-top:8px'}); g.append(list);
  api('/api/review/list?id=' + S.id).then((L) => { for (const r of L.slice(0, 4)) list.append(h('div', {class: 'item', style: 'cursor:default;flex-wrap:wrap'}, h('span', {class: 't'}, r.stamp.replace('_', ' ')), h('a', {class: 'help', href: projUrl(r.html), target: '_blank'}, 'Mở trang duyệt'), ...r.sheets.map((s) => h('a', {class: 'help', href: projUrl(s), target: '_blank'}, s.match(/contact_(.*)\.jpg/)[1].replace('x', ':'))), h('button', {class: 'small', onclick: () => api('/api/open', {path: r.path})}, '📁'))); }).catch(() => {});
  const fb = h('textarea', {placeholder: 'Dán góp ý khách vào đây (vd nội dung "Sao chép góp ý" từ trang duyệt)…', style: 'margin-top:10px;min-height:70px'});
  g.append(fb, h('div', {class: 'row', style: 'margin-top:6px'}, h('button', {onclick: async () => { try { const r = await api('/api/review/feedback', {id: S.id, text: fb.value}); fb.value = ''; toast(`Đã lưu ${r.items} góp ý vào brief/GOP_Y.md — bảo Claude Code: "sửa theo brief/GOP_Y.md"`, false, 7000); } catch (e) { toast(e.message, true); } }}, 'Lưu vào brief/GOP_Y.md')));
  return g;
}
async function compareDlg(it) {
  const body = h('div', {}, h('h3', {}, 'So sánh: điểm neo ↔ hiện tại'), h('p', {class: 'muted', style: 'margin-top:0'}, `${new Date(it.time).toLocaleString('vi-VN')}${it.label ? ' · ' + it.label : ''}`));
  const msg = h('div', {class: 'muted'}, 'Đang dựng lại phiên bản cũ và chụp ảnh từng cảnh (≈ 1–3 phút, chạy nền — có thể đóng hộp này)…'); body.append(msg); modal(body);
  let r; try { r = await api('/api/history/compare', {id: S.id, a: it.id, b: 'current', ratio: S.ratio}); } catch (e) { msg.textContent = '✗ ' + e.message; return; }
  const show = (t) => {
    if (t.status === 'running') { msg.textContent = `${t.msg} (${Math.round((t.p || 0) * 100)}%)`; return; }
    delete taskWaiters[t.id];
    if (t.status === 'error') { msg.className = 'v-fail'; msg.textContent = '✗ ' + t.error; return; }
    const c = t.result; msg.className = c.changed ? 'v-warn' : 'v-ok'; msg.textContent = c.changed ? `${c.changed}/${c.scenes.length} cảnh khác nhau (tỉ lệ ${c.ratio}) — cảnh giống nhau được thu gọn.` : `Mọi cảnh giống nhau ở tỉ lệ ${c.ratio} (khác biệt có thể nằm ở âm thanh / tỉ lệ khác).`;
    const grid = h('div', {class: 'cmpGrid'}, h('b', {}, 'Điểm neo'), h('b', {}, 'Hiện tại'));
    for (const s of c.scenes) {
      if (s.same) continue;
      grid.append(h('div', {class: 'cmpHead'}, h('b', {style: 'color:var(--mint)'}, s.id), ' ', s.label || ''));
      grid.append(s.a ? h('img', {src: s.a}) : h('div', {class: 'ph'}, 'không có'), s.b ? h('img', {src: s.b}) : h('div', {class: 'ph'}, 'không có'));
    }
    const same = c.scenes.filter((s) => s.same).map((s) => s.id);
    body.append(grid, same.length ? h('p', {class: 'muted', style: 'font-size:12.5px'}, 'Giống nhau: ' + same.join(', ')) : null,
      h('div', {class: 'row'}, h('button', {class: 'primary', onclick: () => restoreDlg(it)}, 'Khôi phục điểm neo này…')));
  };
  taskWaiters[r.task] = show; if (S.tasks[r.task]) show(S.tasks[r.task]);
}

// ─────────────────────────── TEAM: status · lock · shared folders ───────────────────────────
const STATUS = {draft: ['Nháp', '#9C97C0'], review: ['Chờ duyệt', '#FFB547'], approved: ['Đã duyệt', '#08DDA4'], published: ['Đã đăng', '#7667FE']};
const statusBadge = (s) => { const [l, c] = STATUS[s] || STATUS.draft; return h('span', {class: 'stb', style: `color:${c};border-color:${c}`}, l); };
$('#projStatus').onchange = async (e) => {
  const v = e.target.value, prev = S.project.status || 'draft';
  commit((p) => { p.status = v; }, {preview: false});
  await save();
  if ((v === 'approved' || v === 'published') && v !== prev) {
    try { await api('/api/history/snapshot', {id: S.id, label: (v === 'approved' ? 'Bản duyệt' : 'Bản đăng') + ' — ' + new Date().toLocaleString('vi-VN'), starred: true}); toast(`Trạng thái: ${STATUS[v][0]} · đã đặt mốc ★ để luôn lấy lại được bản này`, false, 6000); } catch (err) { toast(err.message, true); }
  } else toast('Trạng thái: ' + STATUS[v][0]);
};
const closeProject = () => { if (!S.id) return; try { navigator.sendBeacon('/api/project/close', new Blob([JSON.stringify({id: S.id})], {type: 'application/json'})); } catch {} };
addEventListener('pagehide', closeProject);
function showLockWarn(l) {
  if (!l) return;
  modal(h('div', {}, h('h3', {}, '⚠ Dự án đang được mở ở nơi khác'),
    h('p', {}, h('b', {}, l.user), ' đang mở dự án này trên máy ', h('b', {}, l.host), ' từ ', new Date(l.since).toLocaleString('vi-VN'), ' (hoạt động lần cuối ', new Date(l.beat).toLocaleTimeString('vi-VN'), ').'),
    h('p', {class: 'muted'}, 'Hai người cùng sửa sẽ ghi đè lên nhau ở lần Lưu sau. Nên báo người kia đóng dự án, hoặc chỉ xem. Studio vẫn tự tạo điểm neo ở tab Lịch sử nên luôn khôi phục được.')));
}
function renderTeam() {
  const T = $('#teamBox'); if (!T) return; T.innerHTML = '';
  const st = S.state; const shared = [...(st.sharedTemplates || [])];
  const nameIn = h('input', {value: st.userName || '', placeholder: 'Tên hiển thị'});
  const saveSet = async (patch, msg) => { try { await api('/api/settings', patch); toast(msg || 'Đã lưu cài đặt'); await loadHome(); } catch (e) { toast(e.message, true); } };
  const list = h('div', {});
  for (const d of shared) list.append(h('div', {class: 'item', style: 'cursor:default'}, h('span', {class: 'x', style: 'flex:1'}, d), h('button', {class: 'small danger', onclick: () => saveSet({sharedTemplates: shared.filter((x) => x !== d)}, 'Đã bỏ thư mục mẫu chung')}, 'Bỏ')));
  if (!shared.length) list.append(h('div', {class: 'muted', style: 'font-size:12.5px'}, 'Chưa có. Thêm 1 thư mục trên NAS / Google Drive / OneDrive mà cả nhóm cùng thấy → mẫu trong đó hiện ở Thư viện với nhãn "dùng chung".'));
  T.append(h('h2', {}, 'Nhóm'),
    h('div', {class: 'form grid2'},
      h('label', {}, 'Tên của bạn (hiện trong khoá dự án, lịch sử, góp ý)', h('div', {class: 'row'}, nameIn, h('button', {onclick: () => saveSet({userName: nameIn.value.trim()})}, 'Lưu'))),
      h('label', {}, 'Thư mục dự án mặc định (có thể là thư mục chung)', h('div', {class: 'row'}, h('input', {value: st.projectsRoot || '', readonly: true}), h('button', {onclick: async () => { const r = await api('/api/pick-folder'); if (r.dir) saveSet({projectsRoot: r.dir}); }}, '…'))),
      h('div', {class: 'span2'}, h('div', {class: 'muted', style: 'font-size:12.5px;margin-bottom:6px'}, 'Thư mục mẫu dùng chung'), list,
        h('button', {class: 'small', style: 'margin-top:6px', onclick: async () => { const r = await api('/api/pick-folder'); let d = r.dir; if (!r.supported) d = prompt('Dán đường dẫn thư mục mẫu chung:'); if (d && !shared.includes(d)) saveSet({sharedTemplates: [...shared, d]}, 'Đã thêm thư mục mẫu chung'); }}, '＋ Thêm thư mục mẫu chung'))));
}

// ─────────────────────────── VARIANTS (CSV → many videos) ───────────────────────────
const csvParse = (txt) => {
  txt = txt.replace(/^﻿/, '');
  const first = txt.split(/\r?\n/)[0] || ''; const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return {sep, rows: rows.filter((r) => r.some((x) => x.trim() !== ''))};
};
const csvCell = (v) => { v = String(v ?? ''); return /[;",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const csvMake = (rows) => rows.map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
const fmtList = (s) => String(s || '').split(/[\s,|/]+/).map((x) => x.trim()).filter((x) => RATIOS.includes(x));
/** CSV text → {variants:[{name, formats, copy}], unknown:[cols]} */
function readVariants(txt) {
  const {rows} = csvParse(txt); if (!rows.length) return {variants: [], unknown: [], cols: []};
  const head = rows[0].map((x) => x.trim()); const keys = Object.keys(S.project.copy || {});
  const unknown = head.filter((c) => c && !['name', 'formats'].includes(c) && !keys.includes(c));
  const variants = rows.slice(1).filter((r) => !String(r[0] || '').trim().startsWith('#')).map((r, i) => {
    const o = {name: '', formats: [], copy: {}};
    head.forEach((c, j) => { const v = r[j] ?? ''; if (c === 'name') o.name = v.trim(); else if (c === 'formats') o.formats = fmtList(v); else if (keys.includes(c) && v !== '') o.copy[c] = v; });
    if (!o.name) o.name = 'bien-the-' + (i + 1);
    return o;
  });
  return {variants, unknown, cols: head};
}
const withCopy = (p, over) => { if (!over) return p; const x = clone(p); for (const [k, v] of Object.entries(over)) if (x.copy[k]) x.copy[k].value = v; return x; };
S.varPreview = null;
async function tabVariants(B) {
  if (S.varCsv === undefined) { try { S.varCsv = (await api('/api/variants?id=' + S.id)).csv; } catch { S.varCsv = ''; } if (S.tab !== 'variants') return; }
  const V = readVariants(S.varCsv || '');
  const g = h('div', {class: 'group'}, h('h4', {}, 'Biến thể hàng loạt (CSV)'),
    h('div', {class: 'hint', style: 'margin:0 0 8px'}, 'Mỗi dòng của bảng = 1 video: cùng cảnh + nhạc, khác chữ (tên món, giá, ưu đãi, thành phố, ngôn ngữ…). Mở CSV mẫu bằng Excel / Google Sheets, mỗi cột là 1 ô chữ của dự án (dòng "#" là mô tả, để nguyên). Ô để trống = giữ chữ gốc. Cột formats: vd "9:16 1:1" (trống = mọi tỉ lệ của dự án).'),
    h('div', {class: 'row', style: 'flex-wrap:wrap'},
      h('button', {onclick: () => {
        const keys = Object.keys(S.project.copy || {});
        const rows = [['name', 'formats', ...keys], ['# mô tả (đừng xoá dòng này)', 'vd 9:16 1:1', ...keys.map((k) => S.project.copy[k].label || '')], ['ban-goc', S.project.formats.join(' '), ...keys.map((k) => S.project.copy[k].value ?? '')]];
        const a = h('a', {href: URL.createObjectURL(new Blob(['﻿' + csvMake(rows)], {type: 'text/csv;charset=utf-8'})), download: (S.project.name || 'du-an').replace(/[^\p{L}\p{N}_-]+/gu, '_') + '_bien-the.csv'}); document.body.append(a); a.click(); a.remove();
      }}, '⤓ Tải CSV mẫu'),
      h('button', {class: 'primary', onclick: () => { const fp = h('input', {type: 'file', accept: '.csv,text/csv'}); fp.onchange = async () => { const f = fp.files[0]; if (!f) return; const txt = await f.text(); const r = readVariants(txt); if (!r.variants.length) return toast('CSV không có dòng biến thể nào', true); await api('/api/variants/save', {id: S.id, csv: txt}); S.varCsv = txt; S.varPreview = null; pushPreview(); toast(`Đã nhập ${r.variants.length} biến thể · lưu ở brief/variants.csv`); renderTab(); }; fp.click(); }}, '⤒ Nhập CSV…')));
  B.append(g);
  if (!V.variants.length) { g.append(h('p', {class: 'muted', style: 'font-size:12.5px;margin:10px 0 0'}, 'Chưa có bảng biến thể. Tải CSV mẫu → điền → Nhập CSV.')); return; }
  if (V.unknown.length) g.append(h('div', {class: 'v-warn', style: 'font-size:12.5px;margin-top:8px'}, '⚠ Cột không khớp ô chữ nào (bị bỏ qua): ' + V.unknown.join(', ')));
  if (S.varPreview != null) g.append(h('div', {class: 'v-ok', style: 'margin-top:8px'}, `👁 Khung xem đang hiện biến thể "${V.variants[S.varPreview]?.name}" — không ghi vào dự án. `, h('button', {class: 'small', onclick: () => { S.varPreview = null; pushPreview(); renderTab(); }}, 'Về bản gốc')));
  const L = h('div', {style: 'margin-top:10px'});
  V.variants.forEach((v, i) => L.append(h('div', {class: 'item' + (S.varPreview === i ? ' on' : ''), onclick: () => { S.varPreview = S.varPreview === i ? null : i; pushPreview(); renderTab(); }},
    h('span', {class: 't'}, String(i + 1).padStart(2, '0')), h('b', {style: 'flex:1'}, v.name), h('span', {class: 'muted', style: 'font-size:12px'}, `${Object.keys(v.copy).length} ô chữ · ${(v.formats.length ? v.formats : S.project.formats).join(' ')}`))));
  g.append(L);
  const r = S.render; const jobsN = V.variants.reduce((n, v) => n + (v.formats.length ? v.formats : S.project.formats).length, 0);
  g.append(h('div', {class: 'muted', style: 'font-size:12.5px;margin:8px 0'}, `Dùng cài đặt ở tab Xuất: ${RES[r.res] || r.res} · ${r.fps} fps · ${r.codec.toUpperCase()}${r.loudness === 'off' ? '' : ' · ' + (r.loudness ?? -14) + ' LUFS'}. Video lưu ở out/variants/.`),
    h('button', {class: 'primary', onclick: async () => {
      if (!confirm(`Thêm ${jobsN} lượt render (${V.variants.length} biến thể) vào hàng đợi?`)) return;
      if (isDirty()) await save();
      let n = 0;
      for (const v of V.variants) for (const ratio of (v.formats.length ? v.formats : S.project.formats)) {
        try { await api('/api/render', {...r, ratio, id: S.id, name: `${r.name || S.project.name}_${v.name}`, scope: 'all', copyOverride: v.copy}); n++; } catch (e) { modal(h('pre', {style: 'white-space:pre-wrap'}, e.message)); return; }
      }
      toast(`Đã thêm ${n} video vào hàng đợi — xem tiến độ ở tab Xuất`, false, 6000);
    }}, `▶ Xuất ${jobsN} video`));
}

// ─────────────────────────── LIVE EVENTS ───────────────────────────
let es, lastBeat = Date.now(), pollT = null;
const onJobsData = (list) => { const prev = S.jobs; S.jobs = list; for (const j of S.jobs) { const p = prev.find((x) => x.id === j.id); if (p && p.status !== j.status && j.status === 'done') toast('Render xong: ' + j.out.split(/[\\/]/).pop(), false, 6000); } renderJobs(); };
function connectEvents() {
  es?.close(); es = new EventSource('/api/events'); lastBeat = Date.now();
  const beat = () => { lastBeat = Date.now(); const w = $('#connWarn'); if (w) w.hidden = true; };
  es.addEventListener('ping', beat);
  es.addEventListener('template', (e) => { const d = JSON.parse(e.data); toast(d.thumbs ? `Đã tạo ảnh bìa cho mẫu ${d.tpl}` : `Tạo ảnh bìa mẫu ${d.tpl} lỗi: ${d.error || ''}`, !d.thumbs, 6000); });
  es.addEventListener('task', (e) => onTask(JSON.parse(e.data)));
  es.addEventListener('provider', (e) => { const d = JSON.parse(e.data); const el = $('#aiProgress'); if (el && d.id === S.id) el.textContent = d.msg; });
  es.addEventListener('jobs', (e) => { beat(); onJobsData(JSON.parse(e.data)); });
  es.addEventListener('code', (e) => { const d = JSON.parse(e.data); if (d.id !== S.id) return; if (d.error) showBundleError(d.error); else { toast('Code cảnh vừa thay đổi — đang tải lại preview…'); keepUndo(); setTimeout(() => location.reload(), 600); } });
  es.addEventListener('hf', (e) => { const d = JSON.parse(e.data); if (d.id !== S.id) return; S.hfRev = d.rev; pushPreview(); toast('Cảnh HTML (Hyperframes) vừa thay đổi — đã tải lại khung preview'); });
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
