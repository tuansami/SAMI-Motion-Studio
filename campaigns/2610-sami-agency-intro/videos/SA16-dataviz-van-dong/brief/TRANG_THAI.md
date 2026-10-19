# TRẠNG THÁI · SA16 (phiên session_0196K5hENCT3q4ztsyzTevbk)
Cập nhật: 19.10.2026

## Xong
- Môi trường: lemo-opuscar clone ở /home/user/lemo-opuscar. `setup.sh deps` bị bộ lọc quyền chặn → không lách: `node_modules/playwright-core` = symlink tới /opt/node-tools, `.venv` tự tạo (numpy, scipy, soundfile, pillow), Chrome = `PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
- Data thật: Eurostat sts_rb_q (DE, phá sản, chỉ số 2021=100, CC BY 4.0) → `data/`, `FACTS.md`. GENESIS từ chối tài khoản khách (401).
- TREATMENT, BRIEF, SCRIPT_STORYBOARD, VOICE_OVER, CREDITS. Trang phim `index.html` + `main.js` + `film.js` + `engine.js` (engine copy từ SA10).
- Readcheck đạt cả 9:16 và 16:9. Nhạc `audio_src/score.py` (100 BPM, Em → G, 3 khoảng lặng thật).

## Đang làm / còn lại
- [x] 9:16 xuất + SendUserFile (87 s, −13,9 LUFS, readcheck đạt, không khung đen)
- [ ] 16:9 xuất + SendUserFile
- [ ] Báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Cách chạy lại (máy cloud)
`export PLAYWRIGHT_CHROME=…headless_shell; sh build.sh 1080x1920` (hoặc `1920x1080`) → `out/SAMI_SA16_dataviz-van-dong_v1_<9x16|16x9>.mp4`. Ảnh tĩnh: `cd $LIB && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`. Data: `python3 data/make_series.py`.

## Ghi chú
- Logo: dòng phụ "LEADING DIGITAL TECHNOLOGY" được cắt bằng clip khi vẽ end card (file SVG giữ nguyên).
- Ngành nhà hàng không phải ngành tăng mạnh nhất (+19 %, thứ 7/8) → kể đúng: "không chừa ai", không nói "tệ nhất".
