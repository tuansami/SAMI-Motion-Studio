// node <app>/server/cli-grid.mjs <music file>   → BPM, DROP, BREAKS, FINAL HIT (frames at 30 fps)
import {analyzeMusic} from './audio.mjs';
const a = analyzeMusic(process.argv[2]);
console.log(`${a.bpm} BPM · offset ${a.offset}s · duration ${a.duration}s · beat = ${a.beatFrames} f`);
a.drops.forEach((d, i) => console.log(`DROP ${i + 1}: ${d.t}s  frame ${d.frame}`));
a.breaks.forEach((b) => console.log(`BREAK: ${b.from.t}s → ${b.to.t}s  (frames ${b.from.frame}–${b.to.frame})`));
console.log(`FINAL HIT: ${a.finalHit.t}s  frame ${a.finalHit.frame} · quiet at ${a.quietAt}s`);
console.log('bars: ' + a.bars.map((b) => (b.kick > 0.6 ? '█' : b.energy > 0.3 ? '▆' : '▂')).join(''));
