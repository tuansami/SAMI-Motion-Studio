# TRẠNG THÁI · SA04 (phiên session_01RbeftYNso94htdZ74HhiMz)
Cập nhật: 19.10.2026

## Xong
- Cài môi trường (từng bước của cloud-setup.sh; bước `cli-render --enable` bỏ qua vì video này dùng lemo, không render Studio).
- Data thật (Eurostat sts_setu_m/Destatis) → `data/series.json`, `FACTS.md`. TREATMENT, BRIEF, STORYBOARD, VOICE_OVER.
- Trang phim `index.html` + `main.js` + `film.js` + `engine.js` (bản copy size-aware). 9:16 stills + readcheck đạt.

## Đang làm / còn lại
- [ ] Nhạc + SFX: `audio_src/score.py` → `out/mix_<size>.wav`
- [ ] Render 9:16: `sh build.sh 1080x1920` → `out/SAMI_SA04_dataviz-nganh_v1_9x16.mp4` → SendUserFile
- [ ] 16:9: kiểm stills `--size 1920x1080`, readcheck, render, gửi
- [ ] Báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Cách chạy lại (máy cloud)
LIB=/home/user/lemo-opuscar (đã chạy setup.sh deps). `cd $LIB && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`.
