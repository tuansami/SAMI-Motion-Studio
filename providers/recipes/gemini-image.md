# Gemini nano banana trên web (`gemini-web`)

Đọc `README.md` cùng thư mục trước (luật chung).

- Mỗi tin nhắn thường ra 1 ảnh. Cần nhiều ảnh thì gửi lần lượt, chờ xong mới gửi tiếp.
- Gemini làm tốt việc **sửa ảnh có sẵn** (đổi nền, đổi ánh sáng, ghép món): tải ảnh lên bằng `browser_upload_file` rồi mô tả thay đổi.

## Các bước (browser-harness)
1. Mở tab mới `https://gemini.google.com/app`. Thấy nút "Sign in" thì dừng, nhờ Tuấn đăng nhập.
2. Chọn công cụ tạo ảnh nếu có ("Create image" / biểu tượng banana). Không chắc thì hỏi Tuấn.
3. Prompt mẫu: `Generate an image: <mô tả>, <phong cách>, aspect ratio 9:16. No text, no letters, no logos.`
4. **Cho Tuấn xem prompt, chờ OK**, rồi gửi.
5. Ảnh hiện xong: rê chuột lên ảnh → "Download full size image" → file vào Tải xuống.
6. `ingest` kèm provider `gemini-web`, prompt đã gửi. Lặp lại cho ảnh tiếp theo.
7. Báo Tuấn các đường dẫn, đóng tab.

Ghi chú: ảnh Gemini có watermark SynthID ẩn (không thấy bằng mắt); bản miễn phí có thể có biểu tượng sao ở góc, khi đó cắt khung hoặc dùng bản gói trả phí.
