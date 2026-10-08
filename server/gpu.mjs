// Graphics card name + driver for the "Xuất" tab (async, once per server start). nvidia-smi first, then Windows WMI.
import {spawn} from 'child_process';

const run = (cmd, args) => new Promise((ok) => { let out = ''; try { const c = spawn(cmd, args, {windowsHide: true}); c.stdout.on('data', (d) => (out += d)); c.on('error', () => ok('')); c.on('exit', () => ok(out.trim())); } catch { ok(''); } });
let info = null;
export const gpuInfo = () => info;
export const probeGpu = async () => {
  const nv = await run('nvidia-smi', ['--query-gpu=name,driver_version,memory.total', '--format=csv,noheader,nounits']);
  const cards = nv ? nv.split('\n').filter(Boolean).map((l) => { const [name, driver, mem] = l.split(',').map((x) => x.trim()); return {name, driver, vramGB: mem ? Math.round(+mem / 1024) : null, vendor: 'nvidia'}; }) : [];
  if (process.platform === 'win32') {
    const w = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name + "|" + $_.DriverVersion }']);
    for (const l of w.split('\n').map((x) => x.trim()).filter(Boolean)) {
      const [name, driver] = l.split('|'); if (/basic display|remote|virtual|parsec|meta/i.test(name) || cards.some((c) => c.name && name.includes(c.name.replace(/^NVIDIA\s+/, '')))) continue;
      cards.push({name, driver, vramGB: null, vendor: /nvidia/i.test(name) ? 'nvidia' : /intel/i.test(name) ? 'intel' : /amd|radeon/i.test(name) ? 'amd' : 'other'});
    }
  }
  info = {cards, probed: new Date().toISOString()};
  return info;
};
