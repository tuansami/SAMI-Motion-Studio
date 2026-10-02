// node <app>/server/cli-review.mjs <projectDir> review                 → gói duyệt in out/review/<stamp>/
// node <app>/server/cli-review.mjs <projectDir> compare <snapA> [snapB|current] [ratio]
// Progress lines: "@@{json}" on stdout (the Studio server parses them); last line @@{"done":…} or @@{"error":…}
import {buildReview, compareSnapshots} from './review.mjs';
const [dir, cmd = 'review', a, b = 'current', ratio] = process.argv.slice(2);
const say = (o) => process.stdout.write('@@' + JSON.stringify(o) + '\n');
const onLog = (msg, p) => say({msg, p});
try {
  const r = cmd === 'compare' ? await compareSnapshots(dir, a, b, {ratio, onLog}) : await buildReview(dir, {onLog});
  say({done: r});
  process.exit(0);
} catch (e) { say({error: String(e?.message || e)}); process.exit(1); }
