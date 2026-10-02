# Xerox Menu Press

26 giây · 6 cảnh · 16:9 / 9:16 · lưới 120 BPM (1 nhịp = 15 khung) · chữ mẫu tiếng Đức.

**Bán gì:** dịch vụ thiết kế menu (Menü-Design) cho nhà hàng. Phong cách photocopy / in riso: giấy kem, mực đen, 2 màu in đỏ + xanh.

| Cảnh | Thời gian | Nội dung |
|---|---|---|
| S01 | 0–2 s | Tờ giấy chạy ra khỏi máy in theo 4 nhịp, in sẵn câu hook |
| S02 | 2–8 s | Ảnh món qua 3 lần copy, mỗi lần đúng nhịp: tương phản gắt → chấm halftone → 2 bản màu đỏ/xanh lệch nhau |
| S03 | 8–14 s | 3 chữ lớn dập vào trên nhịp 1·3·5, con dấu tròn "NEU", dòng phụ |
| S04 | 14–18 s | Bảng giá in chồng 2 màu, lệch bản theo từng nhịp rồi khớp ở nhịp 6 |
| S05 | 18–22 s | So sánh menu cũ / menu mới (thanh chia chạy theo nhịp) |
| S06 | 22–26 s | Logo SAMI trên nền mực + khẩu hiệu + WhatsApp + website |

- **Ô ảnh:** `S02_image` → `public/img/placeholder_dish.jpg` (dùng cả ở cảnh 5). Ảnh món chụp gần, sáng, tương phản rõ cho hiệu ứng đẹp nhất.
- **Đổi màu 1 chỗ:** `project.json → brand.colors` (paper, sheet, ink, red, blue). Font: `brand.fonts` (display = Archivo Black, mono = IBM Plex Mono).
- **Lưu ý:** giá ở cảnh 4–5 là **giá mẫu** — thay bằng giá thật của khách, rồi xoá ô "(Beispielpreise)". Tên món dài sẽ tự thu nhỏ chữ.
- **Kỹ thuật:** bộ lọc SVG (feTurbulence + ngưỡng feComponentTransfer, lưới chấm halftone bằng feImage/feTile), các bản màu chồng bằng `mix-blend-mode: multiply`; mọi thay đổi trạng thái đều nhảy theo nhịp, không chuyển mượt.
- Âm thanh: không kèm nhạc (giấy phép). Có sẵn vài SFX ở tab Âm thanh; thêm nhạc 120 BPM là khớp lưới cắt.
