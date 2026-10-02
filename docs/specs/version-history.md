# Spec: Lịch sử phiên bản (điểm neo) — Studio 0.3.0

## Vì sao
- Ctrl+Z chỉ nằm trong bộ nhớ, chỉ phủ `project.json`, và mất khi tải lại trang.
- `.project.backup.json` chỉ là 1 file, bị ghi đè mỗi lần lưu.
- AI (Claude Code) sửa thẳng `scenes/`, `project.json` và media, không qua backup nào.
- Upload trùng tên ghi đè file cũ mà không báo.
- Hệ quả: sau vài lượt chat thì không quay lại được bản đã ưng, nhất là sau khi tắt tool.

## Mô hình
Kho snapshot lưu theo nội dung, mỗi dự án một kho tại `<project>/.history/` (giống version history của Figma / Google Docs; giống git nhưng không cần git và lưu được media lớn):
- `objects/ab/cdef…`: nội dung file theo sha1, mỗi nội dung chỉ lưu 1 lần.
- `snapshots/<YYYYMMDD-HHMMSS-mmm>-<kind>.json` có dạng `{id, time, kind, label, starred, source, files: {rel: {h, size}}, stats}`.
- `index.json` là cache stat (size + mtime → hash), để không phải băm lại media không đổi.
- `lock`: khoá dùng chung giữa các tiến trình (server và hook CLI).

**Phạm vi:** toàn bộ thư mục dự án, trừ `out/`, `public/_engine/`, `.history/`, `.claude/`, `node_modules/`, `.git/`, `.project.backup.json`, `.studio-lock` và `*.tmp`.

### Loại điểm neo

| kind | Khi nào |
|---|---|
| `ai` | hook `UserPromptSubmit` của Claude Code, chạy trước mỗi lượt chat; label lấy 80 ký tự đầu của prompt |
| `open` | khi mở dự án trong Studio |
| `save` | khi Lưu, tối đa 1 lần mỗi 2 phút cho mỗi dự án |
| `before-upload` | trước khi upload hoặc nhập tài nguyên |
| `before-restore` | trước mỗi lần khôi phục |
| `manual` | bấm "Đặt mốc" (mặc định có ★) |

Nếu nội dung giống hệt điểm neo gần nhất thì bỏ qua. Riêng `manual` vẫn luôn được tạo.

### Dọn dẹp
- Giữ các điểm có ★, điểm `manual`, 60 điểm gần nhất, và điểm cuối cùng của mỗi ngày trong 30 ngày gần đây.
- Sau đó xoá các object không còn điểm nào tham chiếu (GC).
- Tự chạy khi tổng số điểm neo vượt 70.

### Khôi phục
- `restore(id, paths?)` luôn tạo điểm `before-restore` trước.
- Ghi file theo cách atomic: ghi ra `.tmp`, rồi `rename`.
- Khôi phục toàn bộ sẽ xoá các file được theo dõi mà không có trong điểm neo. `out/` không bao giờ bị đụng tới.
- `paths` nhận file hoặc tiền tố thư mục, ví dụ `scenes/S03.tsx` hay `public/audio`.

## Hook
- `ensureClaude` gộp hook vào `<project>/.claude/settings.json`: `hooks.UserPromptSubmit[] = {type: 'command', command: 'node "<app>/server/cli-snapshot.mjs" --hook', timeout: 60}`.
- Chỉ thêm hoặc cập nhật mục của Studio, giữ nguyên các thiết lập khác. Nếu file JSON hỏng thì để nguyên, không ghi.
- Chế độ `--hook`:
  - đọc JSON hook từ stdin;
  - xác định dự án theo `CLAUDE_PROJECT_DIR`, rồi `cwd`, đi ngược lên đến khi gặp `project.json`;
  - **không in gì ra stdout**, vì stdout của hook này được đưa vào context của AI;
  - luôn `exit 0`.

## API
| Route | Việc |
|---|---|
| `GET /api/history?id=` | danh sách điểm neo, kèm diff so với điểm trước và `bytes` của kho |
| `GET /api/history/preview?id=&snap=` | khôi phục điểm này sẽ đổi những gì: `{changed, added, removed}` |
| `POST /api/history/snapshot` | `{id, label, starred}` tạo điểm `manual` |
| `POST /api/history/star` | `{id, snap, label?, starred?}` |
| `POST /api/history/restore` | `{id, snap, paths?}`, sau đó phát SSE `restored` |
| `POST /api/history/prune` | dọn dẹp thủ công |

CLI: `node server/cli-snapshot.mjs <dir> snapshot|list|restore|star|prune`.

## UI
- Nút **🕘 Lịch sử** trên thanh trên cùng và tab **Lịch sử**.
- Tab gồm: ô Đặt mốc; danh sách điểm neo theo ngày, mỗi điểm có giờ, nhãn loại, label, tóm tắt thay đổi, nút ★, "Khôi phục…" và "Đặt tên".
- Hộp Khôi phục liệt kê từng file sẽ đổi, có checkbox, và 2 nút: Khôi phục toàn bộ / Chỉ khôi phục mục đã chọn.

## Sửa kèm
- Danh sách "Dự án gần đây" bị trùng do khác hoa/thường: so sánh theo `idOf` (đã lowercase) và tự dọn mục trùng khi khởi động.
- Ctrl+Z bị mất khi code cảnh đổi và trang tự tải lại: lưu `hist`/`fut` vào `sessionStorage` trước khi tải lại.
- Gõ ô phụ đề không xoá chồng redo.
- `npm run check` trỏ tới `server/selftest.mjs` vốn không tồn tại: viết selftest mới (deps, parse, validate mẫu, test khôi phục lịch sử).

## Tương thích
Không đổi schema `project.json`. `.history/` tự sinh khi cần. Dự án cũ có thêm hook khi được mở lần đầu bằng 0.3.0.

## File
Mới: `server/history.mjs`, `server/cli-snapshot.mjs`, `server/selftest.mjs`.
Sửa: `server/index.mjs`, `ui/index.html`, `ui/app.js`, `ui/style.css`, `claude-code/skills/sami-motion-studio/SKILL.md`, docs.
