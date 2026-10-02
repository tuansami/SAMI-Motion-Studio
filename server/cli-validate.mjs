// node <app>/server/cli-validate.mjs <projectDir>   → exit 1 if any ✗
import {validateProject} from './validate.mjs';
const v = validateProject(process.argv[2] || '.');
for (const x of v.fail) console.log('✗ ' + x);
for (const x of v.warn) console.log('⚠ ' + x);
for (const x of v.ok) console.log('✓ ' + x);
process.exit(v.fail.length ? 1 : 0);
