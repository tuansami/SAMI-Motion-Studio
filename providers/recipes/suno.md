# Suno: nhạc nền (`suno-web`)

Đọc `README.md` cùng thư mục trước (luật chung). **Mỗi lượt Create tốn credit Suno (thường 10 credit, ra 2 bài)**: báo và chờ Tuấn OK từng lần.

## Giấy phép
Chỉ bài tạo **khi tài khoản đang ở gói Pro hoặc Premier** mới được dùng thương mại. Không chắc gói hiện tại thì hỏi Tuấn trước khi dùng cho video khách.

## Các bước (browser-harness)
1. Mở tab mới `https://suno.com/create`. Chưa đăng nhập thì dừng, nhờ Tuấn.
2. Bật "Custom". Bật "Instrumental" (video SAMI thường không có lời).
3. Style mẫu (giữ ngắn, theo nhịp 120 BPM của storyboard): `120 bpm, modern deep house, warm, minimal, clean drums, no vocals`. Title: mã video.
4. **Cho Tuấn xem style + credit, chờ OK**, rồi bấm Create. Chờ 1 đến 3 phút cho 2 bài.
5. Nghe thử là việc của Tuấn: gửi tên 2 bài, hỏi chọn bài nào.
6. Bài được chọn: menu "…" → Download → MP3 (hoặc WAV nếu gói cho phép).
7. `ingest` kèm `--provider suno-web --kind music --prompt "<style>"`, `--to <dự án>` nếu dùng ngay.
8. Sau đó đo nhịp: `node <app>/server/cli-grid.mjs <file>` để cắt cảnh đúng phách. Đóng tab.
