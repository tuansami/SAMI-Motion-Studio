# Dither to Dish

20 giây · 5 cảnh · 16:9 / 9:16 · lưới 120 BPM (1 nhịp = 15 khung) · chữ mẫu tiếng Đức.

**Bán gì:** dịch vụ Google Maps / Local SEO (hồ sơ quán dễ được tìm thấy). Phong cách bản đồ pixel 1-bit (đen / kem) chuyển dần sang ảnh màu thật. Không dùng logo Google hay giao diện thật của Maps.

| Cảnh | Thời gian | Nội dung |
|---|---|---|
| S01 | 0–4 s | Bản đồ thành phố 1-bit tự dựng từng vòng theo nhịp, thanh tìm kiếm tự gõ |
| S02 | 4–8 s | Zoom vào con phố 4 lần trên nhịp, pixel thô dần 8 → 32 px, khung ngắm khoá vị trí |
| S03 | 8–12 s | Ghim rơi, ảnh quán từ dither 48 → 3 px, rồi mở màu thật bằng hiệu ứng mống mắt |
| S04 | 12–16 s | 5 sao điền dần + điểm tăng theo nhịp, câu đánh giá |
| S05 | 16–20 s | Logo SAMI + khẩu hiệu + WhatsApp + website |

- **Ô ảnh:** `S03_image` → `public/img/placeholder_storefront.jpg` (dùng ở cảnh 3 và 4). Ảnh ngang, mặt tiền hoặc không gian quán, có vùng sáng/tối rõ.
- **Đánh giá là chữ MẪU:** điểm `4,8`, câu trích và dòng "— BEISPIEL-BEWERTUNG" phải thay bằng đánh giá thật của quán (có thể xin phép khách để trích). Không để chữ mẫu khi xuất cho khách.
- **Đổi màu 1 chỗ:** `project.json → brand.colors` (night, cream, signal, go). Font: `brand.fonts` (pixel = Silkscreen, sans = Space Grotesk).
- **Kỹ thuật:** dither có thứ tự Bayer 4×4 viết thuần bằng bộ lọc SVG (flood + tile + dilate để pixel hoá, feImage ô Bayer + feComposite + ngưỡng feComponentTransfer). Bản đồ sinh bằng code (rnd có hạt giống), không cần ảnh.
- Âm thanh: không kèm nhạc (giấy phép). Có sẵn vài SFX ở tab Âm thanh.
