# TRẠNG THÁI · SA14 (phiên session_01VAnbc7r8nwdmwFf8omFNir)
Cập nhật: 19.10.2026

## Xong
- lemo-opuscar clone ở /home/user/lemo-opuscar. `setup.sh deps` BỊ BỘ LỌC QUYỀN CHẶN → không lách: bộ máy tự viết **WebGL2 thuần** (gl.js: thẻ giấy hai mặt, shadow map theo hình cắt, sách + trang lật cong 40 đoạn, DOF), Canvas2D cho mọi hình giấy (art.js). playwright-core symlink /opt/node-tools. Nhạc numpy (audio_src/score.py).
- BRIEF, TREATMENT (3 cấu trúc, chọn "cuốn truyện tự viết tiếp trang của nó"; so demo 6/6 khác), VOICE_OVER, CREDITS, build.sh.
- Readcheck đạt 9:16 (16/16) và 16:9 (16/16) với `--q rc=1`.
- Nhạc + foley: out/mix.wav (tạo lại bằng build.sh).

## Còn lại
- [x] 9:16: đã render (90 s, 30 fps, −13,9 LUFS, không khung đen), kiểm 18 khung từ MP4, đã gửi (out/SAMI_SA14_paper-popup_v1_9x16.mp4 + _contact.jpg)
- [ ] 16:9: khung cuối đã chỉnh (bìa trái, thẻ CTA phải), readcheck đạt → render (~60 phút) → kiểm → gửi
- [ ] Báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Cách chạy lại
`sh build.sh 1080x1920` (hoặc 1920x1080). Ảnh tĩnh: `cd /home/user/lemo-opuscar && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`.
Máy mới: clone lemo-opuscar vào /home/user/lemo-opuscar; build.sh tự tạo symlink playwright-core.
Trang nhận `?ss=` (siêu lấy mẫu, mặc định 1), `?dof=` (số mẫu DOF, mặc định 24), `?rc=1` (chỉ kiểm chữ).
