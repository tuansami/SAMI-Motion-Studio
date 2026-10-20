# TRẠNG THÁI · SA09 Ads Maps + Local SEO "Hai động cơ của một quán luôn kín bàn"

Phiên: session_01W1XM5hiVJLghEYUwVCKZDG · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Cài môi trường từng bước (sami-media + Studio npm, lib-seed, brand sami). `cloud-setup.sh` chạy cả file và `cli-render --enable` bị bộ lọc quyền chặn (không lách). Không cần lemo cho video Studio.
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 10 cảnh Hyperframes (`hf/S01–S10.html`, `hf/parts/dk.css` + `dk.js`: sân khấu, khối 3D CSS, bánh răng SVG, dòng khách)
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (synthwave 100 BPM, Mi thứ, −13,7 LUFS, TP −1,4) + SFX khớp hình
- [x] QA ảnh tĩnh 9:16 + 16:9 (`brief/qa/`), cli-validate 0 ✗ (⚠ "15n+1" bỏ qua: lưới cắt 72k+1 của nhạc 100 BPM)
- [x] Gửi Tuấn contact sheet QA 9:16 + 16:9 (SendUserFile)
- [ ] Xuất 9:16 → SendUserFile; 16:9 → SendUserFile — **BỊ CHẶN**: Studio tắt `allowCliRender`, lệnh `cli-render --enable` bị bộ lọc quyền từ chối (không lách)
- [x] Báo phiên điều phối (chờ "Tiếp tục")

## Đã chốt
88,8 s · 10 cảnh (khung trong storyboard, cắt ở 72k+1) · xưng "bạn" · đồ thị, kim Umsatz, lịch tuần, Wochenbericht đều ghi "Minh họa", không số · "2 đến 3 tháng" theo trang Google Ads SAMI (ghi "thường") · không giá, không địa chỉ, không logo WhatsApp/Meta.

## Tiếp theo
Khi Tuấn cho phép (bật công tắc tab Xuất hoặc duyệt lệnh `--enable`):
1. `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA09-hai-dong-co --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" --ratio 9:16 --name SAMI_SA09_hai-dong-co_v1_9x16` (chạy nền, ~30 phút)
2. Xem 6–8 khung từ MP4 thật → SendUserFile `SAMI_SA09_hai-dong-co_v1_9x16.mp4`
3. Lặp với `--ratio 16:9` → SendUserFile `_16x9.mp4` → báo phiên điều phối.
