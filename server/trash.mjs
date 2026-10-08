// Move a folder to the Windows Recycle Bin (restorable). Uses SHFileOperation with FOF_ALLOWUNDO + FOF_WANTNUKEWARNING:
// if Windows cannot recycle it (too big for the bin, network drive) it ASKS before deleting permanently instead of
// silently destroying it. The path travels over stdin (Unicode-safe, no quoting issues).
import fs from 'fs';
import path from 'path';
import {spawn} from 'child_process';

const PS = `
[Console]::InputEncoding=[Text.Encoding]::UTF8; [Console]::OutputEncoding=[Text.Encoding]::UTF8
$p = [Console]::In.ReadToEnd().Trim()
$drive = New-Object System.IO.DriveInfo($p)
if ($drive.DriveType -ne 'Fixed') { Write-Output 'NOTFIXED'; exit 0 }
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class SamiBin {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct OP { public IntPtr hwnd; public uint wFunc; public string pFrom; public string pTo; public ushort fFlags; [MarshalAs(UnmanagedType.Bool)] public bool aborted; public IntPtr maps; public string title; }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern int SHFileOperation(ref OP op);
  public static string Recycle(string p) { var o = new OP(); o.wFunc = 3; o.pFrom = p + "\\0\\0"; o.fFlags = 0x40 | 0x10 | 0x4000 | 0x4; int r = SHFileOperation(ref o); return o.aborted ? "ABORTED" : r == 0 ? "OK" : "ERR" + r; }
}
'@
Write-Output ([SamiBin]::Recycle($p))
`;
export const recycle = (dir) => new Promise((ok, bad) => {
  if (process.platform !== 'win32') return bad(new Error('Thùng rác chỉ hỗ trợ Windows'));
  const abs = path.resolve(dir); if (!fs.existsSync(abs)) return ok({ok: true, missing: true});
  const c = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PS], {windowsHide: true});
  let out = '', err = ''; c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (err += d));
  c.on('error', bad);
  c.on('exit', () => {
    const r = out.trim().split('\n').pop()?.trim();
    if (r === 'OK') return ok({ok: !fs.existsSync(abs)});
    if (r === 'NOTFIXED') return bad(new Error('Ổ này không có Thùng rác (ổ mạng / ổ rời): không xoá. Dùng "Gỡ khỏi danh sách".'));
    if (r === 'ABORTED') return bad(new Error('Đã huỷ (Windows hỏi xoá vĩnh viễn và bạn chọn Không).'));
    bad(new Error('Không chuyển được vào Thùng rác: ' + (r || err.trim().split('\n')[0] || 'không rõ')));
  });
  c.stdin.end(abs, 'utf8');
});
