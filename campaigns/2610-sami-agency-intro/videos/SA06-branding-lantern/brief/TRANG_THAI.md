# TRẠNG THÁI · SA06 Branding "Một thương hiệu được dựng thế nào"

Phiên: session_014qakdgwugRTztKeCbUtrUU · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Cài môi trường từng bước (sami-media + Studio npm, lib-seed, brand sami). `cloud-setup.sh` chạy một lần và `cli-render --enable` bị bộ lọc quyền chặn (không lách). lemo `setup.sh deps` không chạy (không cần: nhạc numpy/scipy trong venv scratch).
- [x] Tải ảnh case Mizuki (brand-2..6, ui, logo, ảnh không gian/món) → `public/img/mz-*.webp`; logo Mizuki vector hoá (`tools/trace.py` → `hf/parts/mz-logo.js`)
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 12 cảnh Hyperframes viết tay (`hf/S01–S12.html`, chung `hf/parts/bp.css|bp.js`)
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (lo-fi jazzy hip-hop 88, Rhodes + koto, Rê thứ, -14,0 LUFS, TP -1,4)
- [x] QA ảnh tĩnh 9:16 + 16:9 (contact sheet `brief/qa/`), cli-validate 0 ✗ (⚠ "15n+1" bỏ qua: nhạc 88 BPM tự khớp mốc cảnh)
- [ ] Xuất 9:16 → SendUserFile; 16:9 → SendUserFile — **BỊ CHẶN**: Studio tắt `allowCliRender`, lệnh `--enable` bị bộ lọc quyền từ chối
- [ ] (tuỳ chọn) carousel 6 slide "Brand kit Mizuki: từ ý tưởng đến đèn lồng"

## Đã chốt
87 s · 12 cảnh · xưng "bạn" · quán hư cấu "Quán Mây" ở hook · case thật Mizuki (concept, slogan, Cormorant + Inter, 2 palette, ấn phẩm, website) · nhãn "Tái hiện quy trình" ở cảnh dựng logo · không giá, không địa chỉ, không số kết quả · công cụ thiết kế vẽ bằng code, không nhãn hiệu.

## Tiếp theo (khi Tuấn cho phép xuất)
1. `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA06-branding-lantern --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" --ratio 9:16` (chạy nền)
2. Xem 6–8 khung MP4 thật → SendUserFile `SAMI_SA06_branding-lantern_v1_9x16.mp4`; lặp `--ratio 16:9`.
3. Nhạc tái tạo: `python audio_src/score.py` (cần numpy + scipy) rồi lệnh ffmpeg loudnorm trong đầu file.
