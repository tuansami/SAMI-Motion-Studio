# TRẠNG THÁI · SA10 (phiên session_01KpzfcsQEKggGHtcU7Wr8ja)
Cập nhật: 19.10.2026

## Xong
- Môi trường: lemo-opuscar clone ở /home/user/lemo-opuscar, `setup.sh deps` chạy xong.
- Data thật: Google Trends DE „in der Nähe" 2004–2026 + Eurostat isoc_ci_dev_i 2025 → `data/`, `FACTS.md`.
- TREATMENT, BRIEF, STORYBOARD, VOICE_OVER. Trang phim `index.html` + `main.js` + `film.js` + `engine.js` (copy size-aware từ SA04).
- 9:16 stills + readcheck đạt. Nhạc `audio_src/score.py` (3 khoảng lặng thật, low/rest −2,2 dB).

## Đang làm / còn lại
- [ ] 9:16 xuất (`sh build.sh 1080x1920`) + SendUserFile
- [ ] 16:9 stills + readcheck + xuất (`sh build.sh 1920x1080`) + SendUserFile
- [ ] Báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Cách chạy lại (máy cloud)
LIB=/home/user/lemo-opuscar. `cd $LIB && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`. Data in lại: `python3 data/make_series.py`.

## Ghi chú
- Patrick Hand thay Caveat (dấu tiếng Việt). Google Trends API cần cookie từ trang chủ trends.google.com và hay trả 429 → chờ 25 s rồi thử lại.
- Cùng 90 BPM với demo style, nhưng cấu trúc/mở/kết/cú máy/nhạc khác (xem TREATMENT).
