# TRẠNG THÁI · SA08 (phiên session_01JR29rVe3J9LQTVve5qQNpn)
Cập nhật: 19.10.2026

## Xong
- lemo-opuscar clone ở /home/user/lemo-opuscar. `setup.sh deps` và `npm install` BỊ BỘ LỌC QUYỀN CHẶN → không three.js/scipy/soundfile. Không lách: phim dựng bằng Canvas 2D tự viết; `node_modules/playwright-core` của lemo là symlink tới /opt/node-tools/node_modules/playwright-core (có sẵn trên máy); nhạc numpy + wave.
- BRIEF, TREATMENT (3 cấu trúc, chọn "trước / quyết định / sau"), VOICE_OVER.
- Trang phim: index.html, main.js, film.js (timeline/shots/chữ/sự kiện), world.js (phối cảnh + tilt-shift). readcheck 9:16 đạt 29/29.
- Nhạc: audio_src/score.py → out/mix.wav.

## Còn lại
- [x] 9:16 đã render, kiểm khung MP4, đã gửi (out/SAMI_SA08_pho-tilt-shift_v1_9x16.mp4 + contact sheet)
- [x] 16:9: readcheck đạt, đã render + gửi (out/SAMI_SA08_pho-tilt-shift_v1_16x9.mp4 + contact sheet)
- [x] Đã báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Ghi chú
- Cả 2 bản: 87,5 s, 30 fps, -13,9 LUFS, không khung đen. Chờ Tuấn góp ý.

## Cách chạy lại
`sh build.sh 1080x1920` (hoặc 1920x1080). Ảnh tĩnh: `cd /home/user/lemo-opuscar && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`.
Nếu máy mới: clone lemo-opuscar, `mkdir -p node_modules && ln -s /opt/node-tools/node_modules/playwright-core node_modules/playwright-core`.
