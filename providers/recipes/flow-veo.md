# Google Flow / Veo (`flow-web`)

Đọc `README.md` cùng thư mục trước (luật chung). **Mỗi lần Generate tốn credit Google AI**: báo số credit Flow hiển thị và chờ Tuấn OK từng lần.

## Khi nào dùng
B-roll ngắn (8 s) không tìm được trên stock: hơi nóng bốc lên tô phở, cảnh bếp, khách nâng ly. Không dùng cho cảnh có chữ, logo, người thật nhận diện được.

## Các bước (browser-harness)
1. Mở tab mới `https://labs.google/fx/tools/flow`. Chưa đăng nhập thì dừng, nhờ Tuấn.
2. Mở dự án có sẵn hoặc "New project" (hỏi Tuấn đặt tên theo mã video, vd `261008-V24-…`).
3. Chọn chế độ "Text to Video" (hoặc "Frames to Video" khi có ảnh đầu cảnh: tải ảnh lên bằng `browser_upload_file`).
4. Cài đặt: model Veo theo gói của Tuấn, tỉ lệ 9:16 hoặc 16:9 đúng dự án, số kết quả **1** (đỡ tốn credit).
5. Prompt mẫu: `<chủ thể>, <hành động chậm>, <ánh sáng>, cinematic, shallow depth of field, slow camera push-in, no text, no logos, no people facing camera.`
6. **Cho Tuấn xem prompt + số credit, chờ OK**, rồi bấm Generate. Chờ 1 đến 5 phút (chụp màn hình mỗi 30 s).
7. Tải MP4 (chọn bản upscale 1080p nếu gói cho phép) → Tải xuống.
8. `ingest` kèm `--provider flow-web --kind video`, prompt đã gửi, `--to <dự án>` nếu dùng ngay trong dự án.
9. Báo Tuấn đường dẫn, đóng tab.

Ghi chú giấy phép: kiểm watermark hiển thị theo gói; Veo luôn có SynthID ẩn.
