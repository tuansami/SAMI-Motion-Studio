# Painted Signature – bán dịch vụ Branding

30 giây · 6 cảnh · 16:9 / 9:16 · lưới 120 BPM · chữ mẫu tiếng Đức.

| Cảnh | Thời lượng | Nội dung |
|---|---|---|
| S01 | 2 s | Giấy trắng, nét chì dựng hình, câu mở đầu "Jede Marke beginnt mit einem *Strich.*" |
| S02 | 6 s | Logo nhà hàng mẫu "Mai Lan · Küche" được vẽ bằng cọ: vòng enso, cánh sen, bát, chữ, chi tiết nhỏ |
| S03 | 6 s | 3 vệt cọ màu + tên màu + mã màu |
| S04 | 8 s | Logo lên túi giấy, ly cà phê, biển hiệu treo (minh hoạ phẳng) + chữ viết tay |
| S05 | 4 s | Khẩu hiệu: serif Fraunces + chữ viết tay Caveat trong cùng một câu |
| S06 | 4 s | Thẻ kết SAMI trên mảng mực quét cọ + khẩu hiệu, WhatsApp, website |

- **Khi nào dùng:** quảng cáo dịch vụ thiết kế thương hiệu (logo, bảng màu, ấn phẩm) cho nhà hàng; bản 9:16 cho Reels/TikTok.
- **Đổi màu 1 chỗ:** Thương hiệu → `paper` (nền giấy), `terracotta`, `olive`, `ink`. Mã màu ở cảnh 3 tự cập nhật nếu để trống ô "Mã màu".
- **Đổi font:** `brand.fonts.display` (mặc định Fraunces) và `brand.fonts.script` (mặc định Caveat). Hai font này không có dấu tiếng Việt → chỉ dùng cho chữ Đức/Anh.
- **Đổi chữ:** tab Chữ. Tên quán (`S02_brand`) ngắn ≤ 10 ký tự trông đẹp nhất, tự in lên túi và biển hiệu ở cảnh 4. Dùng `*…*` để chuyển 1 từ sang chữ viết tay màu đất nung, `/` để xuống dòng.
- **Ô ảnh:** `S04_image` = `img/placeholder_interior.jpg` (ảnh nội thất mờ phía sau cảnh 4; để trống = chỉ nền giấy). Ảnh hiện tại là ảnh giữ chỗ, sẽ được thay bằng ảnh AI.
- **Lưu ý:** "Mai Lan · Küche" là thương hiệu mẫu, không phải khách thật. Logo mẫu (bát + sen) là hình vẽ cố định trong code; khi làm cho khách thật nên thay bằng logo của khách (nhờ Claude Code thay `scenes/_logo.tsx`).
- **Âm thanh:** chỉ có vài SFX (cọ, pop, whoosh); thêm nhạc có giấy phép trong tab Âm thanh.
