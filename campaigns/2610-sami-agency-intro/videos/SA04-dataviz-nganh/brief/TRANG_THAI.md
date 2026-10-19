# TRẠNG THÁI · SA04 (phiên session_01RbeftYNso94htdZ74HhiMz)
Cập nhật: 19.10.2026

## Xong
- Cài môi trường (từng bước của cloud-setup.sh; bước `cli-render --enable` bỏ qua vì video này dùng lemo, không render Studio).
- Data thật (Eurostat sts_setu_m/Destatis) → `data/series.json`, `FACTS.md`. TREATMENT, BRIEF, STORYBOARD, VOICE_OVER.
- Trang phim `index.html` + `main.js` + `film.js` + `engine.js` (bản copy size-aware). 9:16 stills + readcheck đạt.

## Đang làm / còn lại
- [x] Nhạc + SFX: `audio_src/score.py` → `out/mix_<size>.wav` (3 khoảng lặng thật 19,6/53,6/76,0)
- [x] 9:16 xuất + đã SendUserFile (89,6 s, -14,0 LUFS, readcheck 25/25, không khung đen)
- [x] 16:9 xuất + đã SendUserFile (readcheck 25/25, -14,0 LUFS)
- [x] Báo phiên điều phối session_01ENDrWfgWowxtPX9WgXNUEt

## Cách chạy lại (máy cloud)
LIB=/home/user/lemo-opuscar (đã chạy setup.sh deps). `cd $LIB && node core/render/still.mjs <dự án> 10 40 --size 1080x1920`.

## Ghi chú
- Caveat (font tay của style) không có dấu tiếng Việt → thay bằng Patrick Hand (OFL), giữ jitter + hạt chì của engine.
- GENESIS 45213 không tải được bằng tài khoản khách → Eurostat sts_setu_m (cùng số Destatis).
- Còn mở (tuỳ Tuấn): end card 16:9 hơi dồn nửa trên; có thể làm v2 nếu cần. File mp4 nằm ở `out/` (không commit), tái tạo bằng `sh build.sh 1080x1920` / `sh build.sh 1920x1080`.
