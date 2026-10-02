// exit 1 if any dependency in package.json is missing from node_modules (→ Start-Studio.bat runs npm install)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const miss = Object.keys(pkg.dependencies || {}).filter((d) => !fs.existsSync(path.join(root, 'node_modules', d, 'package.json')));
if (miss.length) { console.log('  Can cai them: ' + miss.join(', ')); process.exit(1); }
