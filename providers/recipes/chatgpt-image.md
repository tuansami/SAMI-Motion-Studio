# ChatGPT: 5 ảnh một lệnh (`chatgpt-web`)

Đọc `README.md` cùng thư mục trước (luật chung).

## Chuẩn bị
- Gom đủ 5 ảnh cần tạo vào **một** prompt. Mỗi ảnh một dòng đánh số, cùng phong cách, cùng tỉ lệ.
- Tỉ lệ: 9:16 → "tall portrait 2:3", 16:9 → "wide landscape 3:2", 1:1 → "square". ChatGPT không cho 9:16 chính xác; cắt khung sau trong Studio.

## Mẫu prompt
```
Create 5 separate photorealistic images, one image per item, same visual style for all
(warm natural light, shallow depth of field, editorial food photography, tall portrait 2:3).
No text, no letters, no logos, no watermark in any image.
1. <mô tả ảnh 1>
2. <mô tả ảnh 2>
3. <mô tả ảnh 3>
4. <mô tả ảnh 4>
5. <mô tả ảnh 5>
```

## Các bước (browser-harness)
1. `browser_list_tabs` → mở tab mới `https://chatgpt.com/` (`browser_new_tab`). Không dùng lại tab Tuấn đang làm.
2. `browser_page_info` + chụp màn hình: thấy ô nhập "Ask anything" là đã đăng nhập. Thấy nút "Log in" thì dừng, nhờ Tuấn đăng nhập.
3. Bấm "New chat". Gõ prompt vào ô nhập (`browser_type`).
4. **Cho Tuấn xem prompt, chờ OK**, rồi nhấn Enter.
5. Chờ ảnh (thường 1 đến 3 phút): `browser_wait_for_element` hoặc chụp màn hình mỗi 20 s. Đếm đủ 5 ảnh. Thiếu ảnh thì hỏi Tuấn có nhắn "continue with the remaining images" không, đừng tự gửi.
6. Mở từng ảnh (bấm vào ảnh) → nút Download (biểu tượng mũi tên xuống) → file PNG vào thư mục Tải xuống.
7. Với từng file: `ingest` kèm provider `chatgpt-web`, đúng dòng prompt của ảnh đó (ghi cả phần phong cách chung).
8. Báo Tuấn: 5 đường dẫn `lib:img/chatgpt-web/…` (hoặc `img/chatgpt-web/…` nếu lưu vào dự án). Đóng tab đã mở.

## Lỗi hay gặp
- "You've reached the limit": dừng, báo Tuấn giờ mở lại.
- Ảnh bị từ chối vì chính sách: sửa prompt, hỏi Tuấn trước khi gửi lại.
