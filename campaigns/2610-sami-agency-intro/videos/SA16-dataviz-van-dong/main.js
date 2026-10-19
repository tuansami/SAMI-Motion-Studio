import { setup, renderFilm, texts, buildEvents, DUR } from './film.js';
const w = innerWidth, h = innerHeight, cv = document.getElementById('c');
cv.width = w; cv.height = h;
const g = cv.getContext('2d');
await Promise.all(['400 40px Newsreader', '500 40px Newsreader', '600 40px Newsreader', '400 40px "Patrick Hand"', '400 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"',
  '400 40px "Be Vietnam Pro"', '600 40px "Be Vietnam Pro"', '700 40px "Be Vietnam Pro"', '800 40px "Be Vietnam Pro"'].map(f => document.fonts.load(f, 'Ặữ')));
const data = await (await fetch('data/series.json')).json();
const logo = new Image(); logo.src = 'logo-white.svg'; await logo.decode();
setup(data, w, h, logo);
window.DUR = DUR;
window.EV = buildEvents();
window.TEXTS = texts;
window.render = t => renderFilm(g, t);
window.READY = true;
