# Spec: Làm việc nhóm + Biến thể hàng loạt từ CSV — Studio 0.5.0

## Vì sao
- Nhóm 2–5 người dùng chung dự án và mẫu, nhưng hiện chưa có cách biết ai đang mở dự án, bản nào đã được khách duyệt, hay chia mẫu dùng chung.
- Gói tháng cần **nhiều biến thể**: cùng video, khác món, giá, ưu đãi hay ngôn ngữ. Mỗi biến thể hiện phải nhân bản dự án bằng tay.

## 1. Nhãn trạng thái
- Trường mới **`project.json → status`**, nhận `draft | review | approved | published`; mặc định `draft` khi không có. Có trong `types.ts`. `validate` cảnh báo nếu giá trị lạ.
- Trường này không ảnh hưởng tới render.
- **UI:**
  - Ô chọn trên thanh trên cùng. Đổi trạng thái thì ghi vào dự án và Lưu.
  - Chuyển sang `approved` hoặc `published` thì `POST /api/history/snapshot` tạo **mốc ★** "Bản duyệt / Bản đăng — <thời gian>".
  - Trang Dự án hiện badge màu theo trạng thái (lấy từ `/api/state` → `recent[].status`).

## 2. Khoá dự án `<project>/.studio-lock`
- Nội dung: `{user, host, pid, since, beat}`. `user` lấy từ `settings.userName`, nếu trống thì dùng tên người dùng của hệ điều hành.
- **Ghi khoá:**
  - Ghi khi mở dự án, và cập nhật `beat` mỗi 60 s cho các dự án đang mở.
  - Nếu đã có khoá của **Studio khác** và khoá đó còn sống (beat < 3 phút), thì **không ghi đè**. Mở dự án vẫn trả về `lockedBy`, UI hiện cảnh báo, và vẫn cho làm tiếp.
- **Xoá khoá:**
  - `POST /api/project/close` (gửi khi về trang Dự án hoặc `pagehide`) chỉ xoá khoá nếu là khoá của chính Studio này.
  - Khi tắt Studio (`exit`, SIGINT/TERM/HUP/BREAK) thì xoá mọi khoá của mình.
  - Trường hợp bị kill đột ngột: khoá tự hết hạn sau 3 phút.
- `.studio-lock` không nằm trong lịch sử và bị `.gitignore` bỏ qua.

## 3. Thư mục dùng chung
- `settings.sharedTemplates[]` là danh sách thư mục mẫu dùng chung trên NAS hoặc Drive.
- **Định danh mẫu:** mẫu trong thư mục chung có id dạng `sh<hash5>_<folder>`; `tplDir(id)` dịch id về đúng thư mục.
- **Các thao tác dùng `tplDir`:** liệt kê, kiểm tra, tạo ảnh bìa, xuất zip, ảnh `/tpl/…` và tạo dự án mới từ mẫu.
- **Khi thư mục chung lỗi:** NAS mất kết nối hoặc một mẫu hỏng thì bỏ qua, không làm hỏng thư viện.
- **Lưu và nhập mẫu:** `saveAsTemplate({shared})` và `importTemplate(from, {shared})` ghi vào thư mục chung đầu tiên.
- **Trang Dự án → Nhóm:** đặt tên người dùng, thư mục dự án mặc định, thêm hoặc bỏ thư mục mẫu chung.
- **Nguồn điểm neo:** điểm neo ghi rõ người tạo, dạng `Studio · <tên>` hoặc `Claude Code · <user>`.

## 4. Biến thể CSV
- Định dạng `brief/variants.csv`, lưu UTF-8 có BOM:
  - Header là `name;formats;<khoá copy>…`.
  - Dòng bắt đầu bằng `#` là mô tả và bị bỏ qua khi đọc.
  - Bộ đọc nhận cả `;` lẫn `,`, hỗ trợ ngoặc kép với `""` và xuống dòng trong ô.
- Cột không khớp khoá copy nào thì báo và bỏ qua. Ô trống thì giữ chữ gốc. `formats` để trống thì dùng `project.formats`.
- **UI (tab Biến thể):**
  - Tải CSV mẫu gồm 3 dòng: header, mô tả, `ban-goc`.
  - Nhập CSV qua `POST /api/variants/save`; nếu thay bảng cũ thì tạo điểm neo trước.
  - Xem thử một dòng: `previewOpts` dùng `withCopy(project, row)`, không ghi vào dự án.
  - **Xuất N video:** mỗi dòng × mỗi tỉ lệ thành một job `/api/render` có `copyOverride`.
- **Render:** `applyCopy(project, copyOverride)` thay giá trị trong bản sao của project. Khoá các đoạn render tính theo project đã thay. File ra `out/variants/<project>_<name>_<ratio>…mp4`.
- **CLI:** `cli-still … --copy row.json` để AI QA một biến thể.

## Tương thích
- `status` là tuỳ chọn. Dự án cũ không có trường này vẫn chạy như trước (đã thử).
- Không có thư mục chung thì mọi thứ chạy như cũ.

## File
Mới: không có (logic nằm trong các file sẵn có).
Sửa: `server/index.mjs` (khoá, close, recent status, variants API, settings), `server/template.mjs` (nhiều thư mục mẫu, `tplDir`), `server/render.mjs` (`applyCopy`, `out/variants`), `server/cli-still.mjs` (`--copy`), `server/cli-snapshot.mjs`, `server/validate.mjs`, `engine/src/core/types.ts`, `server/selftest.mjs`, `ui/*`, skill, docs.
