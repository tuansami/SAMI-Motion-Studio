# Family Tape – băng VHS gia đình → Reel hôm nay

40 giây · 6 cảnh · 16:9 / 9:16 · lưới 120 BPM · chữ mẫu tiếng Đức.

**Bán gì:** dịch vụ Social Content / Reels cho nhà hàng gia đình có lịch sử. Điểm "móc" là sự tương phản: hình băng VHS cũ, nhoè, rung → cắt phăng sang reel sắc nét, sạch.

| Cảnh | Thời gian | Nội dung |
|---|---|---|
| S01 | 0–4 s | Màn xanh "PLAY ▶" → nhiễu → năm thành lập gõ ra, REC nhấp nháy, timecode chạy |
| S02 | 4–12 s | 3 khung cắt từ ảnh gia đình, hiệu ứng VHS (lệch màu RGB, vạch quét, rung ngang, dải nhiễu tracking), chú thích kiểu máy quay |
| S03 | 12–16 s | Dừng hình "PAUSE", rồi tua nhanh: hình xé thành dải, năm chạy 1998 → 2026, "Und heute?" |
| S04 | 16–24 s | Nền sáng, 3 khung reel dọc xếp quạt; thả tim, lưu bài (biểu tượng chung, không logo nền tảng) |
| S05 | 24–32 s | 3 ô số chạy (follower, like, lưu) + nhãn **Beispielwerte** |
| S06 | 32–40 s | Màn xanh VHS: logo SAMI, khẩu hiệu, nút "Jetzt Termin sichern", WhatsApp, website |

## Thay nội dung
- **Ô ảnh:** `S02_image` → `img/placeholder_family.jpg` (ảnh gia đình / ngày đầu mở quán; dùng lại 3 khung cắt: toàn cảnh, mặt người góc trên trái, chi tiết góc dưới phải — nên chọn ảnh ngang, nhiều chi tiết). `S04_image` → `img/placeholder_reel.jpg` (ảnh món / bếp hiện đại, sắc nét; 3 khung cắt khác nhau trong 3 reel).
- **Màu:** sửa một chỗ ở `project.json → brand.colors` (tapeBlack, tungsten, cream, sky, vhsBlue). Logo SAMI giữ màu gốc.
- **Font:** VT323 (chữ máy VHS) + Bricolage Grotesque (phần hiện đại). VT323 không có dấu tiếng Việt — chữ mẫu chỉ dùng tiếng Đức.

## Lưu ý
- Số ở cảnh 5 là **số mẫu**: giữ nhãn "Beispielwerte" cho tới khi thay bằng số thật có nguồn của khách.
- Năm ở cảnh 1 và cảnh 3 phải đúng năm thành lập thật.
- Không có nhạc trong mẫu (bản quyền); chỉ vài SFX có sẵn trong `audio.cues`.
