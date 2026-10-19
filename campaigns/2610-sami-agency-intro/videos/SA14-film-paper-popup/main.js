// SA14 · khởi động trang phim (page contract của lemo-opuscar core)
import { createGL, loadGLTF } from './gl.js';
import { setup, renderFilm, texts, buildEvents, DUR } from './film.js';
const w = innerWidth, h = innerHeight, gc = document.getElementById('g'), oc = document.getElementById('o');
gc.width = oc.width = w; gc.height = oc.height = h;
const q = new URLSearchParams(location.search), ss = +(q.get('ss') || 1);
await Promise.all(['800 60px "Nunito"', '700 40px "Nunito"', '600 40px "Nunito"', '800 60px "Baloo 2"', '700 40px "Baloo 2"', '600 60px "Lora"', 'italic 500 50px "Lora"']
  .map(f => document.fonts.load(f, 'Ặữếờ€•')));
const img = async src => { const i = new Image(); i.src = src; await i.decode(); return i; };
const R = createGL(gc, w, h, ss, +(q.get('dof') || 24));
window.__R = R; window.__DBG = q.get('dbg') || '';
const [logo, walnut, tea, lamp] = await Promise.all([img('assets/logo-white.svg'), img('/core/assets/polyhaven/walnut_diff.jpg'),
  loadGLTF(R, '/core/assets/polyhaven/tea_set_01/tea_set_01.gltf').catch(() => null), loadGLTF(R, '/core/assets/polyhaven/desk_lamp_arm_01/desk_lamp_arm_01.gltf').catch(() => null)]);
setup(w, h, R, { logo, walnut, tea, lamp }, oc);
window.DUR = DUR;
window.EV = buildEvents();
window.TEXTS = texts;
window.render = q.get('rc') ? (() => {}) : (t => renderFilm(t));   // rc=1: chỉ kiểm chữ (readcheck), không vẽ
window.READY = true;
