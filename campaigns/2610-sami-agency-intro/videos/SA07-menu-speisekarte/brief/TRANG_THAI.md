# TRẠNG THÁI · SA07 Thiết kế menu "Speisekarte bán hàng thay bạn"

Phiên: session_01CGZSmJDyVUorpjLZ8XNWni · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Cài môi trường từng bước (sami-media + Studio npm, lib-seed, brand sami). `cloud-setup.sh` chạy một lần bị bộ lọc quyền chặn; `cli-render --enable` bị chặn (không lách). lemo `setup.sh deps` không chạy (không cần: nhạc numpy/scipy trong venv scratch).
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 12 cảnh Hyperframes viết tay (`hf/S01–S12.html`, chung `hf/parts/riso.css|riso.js`), look "Risograph Print"
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (indie-pop shuffle 110, ukulele Karplus-Strong + glockenspiel + vỗ tay, Sol trưởng, -13,6 LUFS, TP -1,2) + SFX khớp hình
- [x] QA ảnh tĩnh 9:16 + 16:9 (contact sheet `brief/qa/`), cli-validate 0 ✗ (⚠ "15n+1" bỏ qua: nhạc 110 BPM, SFX đặt theo mốc hình)
- [ ] Xuất 9:16 → SendUserFile; 16:9 → SendUserFile — **BỊ CHẶN**: Studio tắt `allowCliRender`, lệnh `--enable` bị bộ lọc quyền từ chối
- [ ] (tuỳ chọn) carousel 5 slide "Trước / sau một Speisekarte"

## Đã chốt
89,5 s · 12 cảnh · xưng "bạn" · quán hư cấu "Bếp Sen · Dresden" (nhãn "Nhà hàng minh họa") · chữ ký: máy ép nghiền menu cũ → mưa chữ → lưới nam châm 6 nhóm · công cụ thiết kế vẽ code (không nhãn hiệu), đồng hồ ×16, nhãn "Tái hiện quy trình" · chú giải dị ứng A–N do quán tự đặt (14 chất EU) · thẻ bản đồ vẽ chung, không logo Google · không giá dịch vụ, không địa chỉ, không số kết quả.

## Tiếp theo (khi Tuấn cho phép xuất)
1. `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA07-menu-speisekarte --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" --ratio 9:16` (chạy nền)
2. Xem 6–8 khung MP4 thật → SendUserFile `SAMI_SA07_menu-speisekarte_v1_9x16.mp4`; lặp `--ratio 16:9`.
3. Nhạc tái tạo: `python audio_src/score.py` (numpy + scipy) rồi lệnh ffmpeg loudnorm trong đầu file.
