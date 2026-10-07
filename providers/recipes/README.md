# Kịch bản trình duyệt (gói web, không tính phí API)

Dùng khi cần nhiều ảnh, video Veo hay nhạc Suno mà không muốn tốn tiền API. Claude điều khiển **Chrome thật của Tuấn** qua skill `browser-harness` (thứ tự ưu tiên: browser-harness → Jev → Claude in Chrome).

## Luật chung (mọi kịch bản)
1. **Tuấn phải có mặt.** Hỏi trước khi mở tab. Nếu trang hiện màn hình đăng nhập: dừng, nhờ Tuấn tự đăng nhập. Không bao giờ gõ mật khẩu.
2. **Gặp CAPTCHA hay "xác minh bạn là người": dừng ngay**, báo Tuấn. Không vượt.
3. **Trước khi bấm gửi / Generate:** cho Tuấn xem nguyên prompt và số credit (Flow, Suno) rồi chờ OK. Mỗi lần gửi là một lần xin phép.
4. Một yêu cầu một lúc, chờ xong mới gửi tiếp. Không mở nhiều tab song song.
5. Prompt không xin chữ trên ảnh (chữ nằm ở `project.json → copy`). Nhà hàng hư cấu thì ghi rõ là ví dụ.
6. **Tải về:** dùng nút Download của chính trang (file vào thư mục Tải xuống của Chrome, thường `C:\Users\Tuan\Downloads`). Báo Tuấn tên file trước khi tải.
7. **Ghi meta cho từng file** (bắt buộc), giữ nguyên prompt đã gửi:
   ```bash
   node Z:/SAMI_Video/SAMI_Motion_Studio/providers/cli.mjs ingest "<file>" --provider chatgpt-web --kind img --prompt "<prompt>" [--to <thư mục dự án>]
   ```
   Hoặc tool MCP `ingest_file` của `sami-media`. File gốc trong Downloads giữ nguyên; xoá hay không là việc của Tuấn.
8. Trang web đổi giao diện thường xuyên: tìm nút theo chữ hiển thị (`browser_page_info`, ảnh chụp màn hình) thay vì nhớ selector.

## Danh sách
| Kịch bản | Provider id | Ra | Ghi chú |
|---|---|---|---|
| `chatgpt-image.md` | `chatgpt-web` | 5 ảnh / lệnh | ưu tiên khi cần nhiều ảnh |
| `gemini-image.md` | `gemini-web` | 1 ảnh / tin nhắn | nhanh, rẻ |
| `flow-veo.md` | `flow-web` | video 8 s | tốn credit Google AI |
| `suno.md` | `suno-web` | 2 bài / lượt | chỉ dùng thương mại bài tạo khi đang ở gói trả phí |
