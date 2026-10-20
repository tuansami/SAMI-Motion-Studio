# TRẠNG THÁI · SA18 Social media → đặt bàn "Nghìn lượt xem, không một bàn đặt?"

Phiên: session_01WXiyJR1mMCdfsks5RaG5J1 · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 13 cảnh Hyperframes viết tay 9:16 + 16:9 (`hf/S01–S13.html`, kit chung `hf/parts/pg.css|pg.js`)
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (−14 LUFS) + SFX khớp hình
- [x] QA ảnh tĩnh 9:16 + 16:9 (2 vòng), `cli-validate` 0 ✗
- [x] Xuất 9:16 → SendUserFile (20.10, 12 phút 26 giây CPU, −14,0 LUFS) + contact sheet `brief/SA18_contact_9x16.jpg`
- [x] Xuất 16:9 → SendUserFile (11 phút 22 giây CPU, −14,0 LUFS) + `brief/SA18_contact_16x9.jpg`
- [x] Báo phiên điều phối

## Tiếp theo
XONG v1 cả 2 tỉ lệ. Chờ góp ý của Tuấn. Tuỳ chọn: thu VO theo VOICE_OVER.md.

## Đã chốt
89,7 s · 13 cảnh · xưng "bạn" · look "Pictogram Motion" (người que có khớp, mảng màu đặc navy/tím/mint/lavender, chuyển cảnh bằng khối màu: đẩy xuyên màn hình, tim phình, nút „Jetzt reservieren" phình…) · chữ Nunito 900 + vệt bút dạ quét (em.hl) · Space Grotesk cho UI.
Chữ ký: S06 feed cuộn bị uốn thành phễu (canvas `PG.funnel`), S11 tim rơi qua phễu thành ghế được kéo ra, người que ngồi xuống, bộ đếm "Bàn đặt" bắt đầu quay.
Quán tưởng tượng "Quán Mây · Leipzig". Không giá, không số kết quả; bộ đếm là trống số quay + nhãn "Minh họa" (S01, S10, S11). Không logo nền tảng nào (feed, nút chat tự vẽ); chỉ chữ "Google Maps".

## Ghi chú kỹ thuật
- Cài: cloud-setup.sh chạy trọn được trong phiên này (kể cả `cli-render --enable`).
- QA: `node server/cli-still.mjs <dir> out/qX/a.jpg <frames> 9:16|16:9`, tờ ghép `hf/parts/qa_sheet.py` (python của lemo .venv).
- 16:9: `PG.head` bỏ ngắt dòng " / " (thay bằng dấu cách) để chữ tự cân dòng trong cột trái.
- Cắt cảnh không theo lưới 120 → cảnh báo "lệch nhịp" của validate là cố ý (nhạc 140 BPM, drop đặt đúng lúc phễu uốn 34,43 s).
- Nhạc: `/home/user/lemo-opuscar/.venv/bin/python audio_src/score.py` → loudnorm bằng ffmpeg của Remotion (`node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg`, cần LD_LIBRARY_PATH=thư mục đó). mix.wav không commit.
- Lỗi đã gặp: GSAP `arrive` + transform viết tay trên cùng phần tử ghi đè nhau khi tua → phần tử nào có transform theo clock thì tự làm hiệu ứng vào cảnh trong clock.

## Phản hồi khách
(trống)
