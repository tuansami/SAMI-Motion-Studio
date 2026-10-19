# TRẠNG THÁI · SA05 Local SEO "Top 3 trên bản đồ không phải may mắn"

Phiên: session_019xTerQVmjKbHDBXh8baQ4H · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Cài môi trường từng bước (sami-media + Studio npm, lib-seed, brand sami). `cli-render --enable` và `lemo setup.sh deps` bị bộ lọc quyền chặn (không lách).
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 9 cảnh Hyperframes (`hf/S01–S09.html`, `hf/parts/lr.css`, `hf/parts/race.js`)
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (afro-house 120, La thứ, -13,9 LUFS, TP -1,3)
- [x] QA ảnh tĩnh 9:16 + cli-validate (0 ✗; ⚠ "15n+1" bỏ qua: nhạc SA05 tự khớp cắt ở bội số 15 khung)
- [x] Bố cục 16:9 + QA · contact sheet `brief/qa/` đã gửi Tuấn (SendUserFile)
- [ ] Xuất 9:16 → SendUserFile; 16:9 → SendUserFile — **BỊ CHẶN**: Studio tắt `allowCliRender`, lệnh `cli-render --enable` bị bộ lọc quyền từ chối (không lách)
- [x] Báo phiên điều phối (chờ "Tiếp tục")

## Đã chốt
87,5 s · 9 cảnh (khung trong storyboard) · xưng "bạn" · quán tưởng tượng "Lúa Non", Berlin · đối thủ tên tưởng tượng · bảng xếp hạng "Minh họa" · không giá, không địa chỉ.

## Tiếp theo
Khi Tuấn cho phép (bật công tắc tab Xuất hoặc duyệt lệnh `--enable`):
1. `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA05-local-seo-top3 --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" --ratio 9:16` (chạy nền, ~30 phút)
2. Xem 6–8 khung từ MP4 thật → SendUserFile `SAMI_SA05_local-seo-top3_v1_9x16.mp4`
3. Lặp với `--ratio 16:9` → SendUserFile `_16x9.mp4` → báo phiên điều phối.
