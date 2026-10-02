# Sauce & Plates – website nhà hàng, phong cách vector phẳng

26 giây · 6 cảnh · 16:9 / 9:16 · lưới 120 BPM · chữ mẫu tiếng Đức · quán mẫu hư cấu "Pho & Co.".

**Bán gì:** dịch vụ thiết kế website nhà hàng. Phong cách vui, phẳng, viền mực đậm; đĩa giả 3D bằng co giãn hình elip, sốt chảy dẻo bằng bộ lọc SVG (blur + ngưỡng alpha).

| Cảnh | Thời gian | Nội dung |
|---|---|---|
| S01 | 0–4 s | Đĩa rơi xuống, xoay giả 3D (elip co/giãn theo nhịp, vệt sáng chạy quanh vành), tiêu đề bật ra |
| S02 | 4–8 s | Sốt hồng chảy phủ kín màn hình, tiêu đề trên nền sốt, khung trình duyệt rơi xuống |
| S03 | 8–12 s | Đĩa bay theo đường cong, từ nghiêng thành phẳng, đáp vào phần đầu website (nảy 1,06 → 1) |
| S04 | 12–18 s | 3 thẻ bật ra theo nhịp: thực đơn, đặt bàn (nút được bấm → "Reserviert!"), bản đồ có ghim rơi |
| S05 | 18–22 s | Cùng website trên điện thoại: cuộn xuống thực đơn, ngón tay bấm nút đặt bàn |
| S06 | 22–26 s | Nền mực, các giọt sốt dẻo dính nhau quanh mép, logo SAMI + khẩu hiệu + WhatsApp + website |

## Thay nội dung
- **Ô ảnh:** `S01_image` → `img/placeholder_plate.jpg`: ảnh món chụp thẳng từ trên xuống, món nằm giữa khung (ảnh được cắt tròn). Một ảnh dùng cho mọi đĩa trong video.
- **Chữ:** tên quán, câu giới thiệu, nút, menu, món, ô đặt bàn, địa chỉ đều nằm trong tab Chữ. Địa chỉ "Musterstraße 12" và tên miền chỉ là mẫu.
- **Màu:** sửa một chỗ ở `project.json → brand.colors` (cream, pink, green, ink). Logo SAMI giữ màu gốc.
- **Font:** Fredoka (tiêu đề) + Inter (chữ giao diện). Fredoka không có dấu tiếng Việt, chỉ dùng chữ Đức/Anh.

## Lưu ý
- Thẻ thực đơn không ghi giá: nếu thêm giá phải là giá thật của khách.
- Không có nhạc trong mẫu (bản quyền); chỉ vài SFX có sẵn trong `audio.cues`.
