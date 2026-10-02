# CHANGELOG — SAMI Motion Studio

Ghi lại mọi phiên bản của app Studio (không phải video dự án). Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), số phiên bản theo [SemVer](https://semver.org/lang/vi/):
`MAJOR.MINOR.PATCH`. MINOR là tính năng mới; PATCH là sửa lỗi hoặc chỉnh nhỏ. Mọi bản đều **tương thích ngược** với `project.json` cũ, trừ khi ghi rõ.

**Quy ước mỗi lần sửa app**
1. Bump `version` trong `package.json`.
2. Thêm một mục mới ở đầu file này, gồm Thêm / Thay đổi / Sửa lỗi / File chính / Roll back.
3. Commit, sau đó `git tag vX.Y.Z`, `git push --tags`, rồi tạo GitHub Release với nội dung lấy từ đúng mục ở file này.

**Cách roll back app về một bản cũ**
```bash
git fetch --tags
git checkout v0.2.2          # xem / chạy thử bản cũ (detached)
git checkout main            # quay lại bản mới nhất
# hoặc tải zip ở trang Releases: https://github.com/tuansami/SAMI-Motion-Studio/releases
```
Sau khi đổi bản, chạy `npm install` nếu `package-lock.json` khác. Dữ liệu dự án (`projects/`, `.studio/`) không nằm trong git nên không bị ảnh hưởng.

---

## [0.2.2] — 2026-10-02 — Thoại (voice-over) + SFX riêng
Spec: `docs/specs/audio-voice.md`

### Thêm
- `audio.voice: [{t, src, len, gain?, label?}]`. Mỗi câu thoại là một file trong `public/` (ví dụ `audio/vo/S01.mp3`). `t` là giây bắt đầu, `len` là độ dài file.
- `audio.duck` (dB, mặc định −9). Nhạc tự hạ trong lúc có thoại, dốc lên/xuống 0,25 s.
- `audio.cues[].src` (+ `len`) cho SFX tự tạo trong `public/`. Có `src` thì dùng `src` thay cho `sfx` có sẵn.
- Timeline có vạch tím đánh dấu thoại.
- Tab Âm thanh có nhóm "Thoại" (giờ, âm lượng, ghi chú, nghe thử) và thanh "Nhạc hạ khi có thoại".
- `validate` báo thiếu file thoại hoặc file SFX riêng, và cảnh báo thoại kéo quá cuối video.

### Thay đổi
- Kéo thời lượng cảnh (ripple) sẽ dời luôn các câu thoại phía sau.
- SFX có `src` hiện tên file thay vì danh sách chọn.

### File chính
`engine/src/core/types.ts`, `engine/src/core/AudioTrack.tsx`, `ui/app.js`, `server/validate.mjs`, `package.json`

### Roll back
`git checkout v0.2.2` (bản đầu tiên được đưa lên GitHub, làm mốc gốc)

---

## [0.2.1] — 2026-09-30/10-01
Không có ghi chép chi tiết, vì lúc đó dự án chưa dùng git. Đây là các chỉnh nhỏ sau khi dùng thử 0.2.0 trên dự án thật. Không có tag riêng.

---

## [0.2.0] — 2026-09-30 — Giai đoạn 1.5 (sau phản hồi dùng thật đầu tiên)

### Thêm
- **Render chống treo**:
  - Chia video thành các đoạn khoảng 15 s, mỗi đoạn chạy trong một tiến trình riêng.
  - Watchdog tự phát hiện treo, giết cả cây tiến trình (Chrome + ffmpeg) rồi thử lại với ít luồng hơn.
  - Âm thanh render một lần, sau đó ghép các đoạn mà không encode lại.
  - Nút **Tiếp tục** khi render lỗi hoặc tắt máy giữa chừng. **Huỷ** và **Dừng tất cả** tắt hẳn tiến trình.
- Nút **Chẩn đoán GPU**, ước tính dung lượng file xuất.
- Tab **Ảnh chèn** (overlays): ảnh, logo, watermark, 12 sticker chỉ dẫn, Lottie; kéo thả trên khung xem (`engine/src/core/Overlays.tsx`, `Stickers.tsx`).
- **Thư viện mẫu** + chuẩn mẫu v1 (`docs/TEMPLATE_STANDARD.md`), kèm các thao tác Lưu thành mẫu, Kiểm tra (`node server/cli-template.mjs check`) và Nhập / Xuất `.zip`.
- 8 mẫu: agency-promo, collage-search-ad, dither-to-dish, painted-signature, sauce-and-plates, slot-grid-booking, vhs-family-tape, xerox-menu-press.

### Sửa lỗi
- Bản 0.1 luôn báo nhầm "không có NVENC" vì bài kiểm tra bị lỗi, nên GPU không bao giờ được dùng. Bài kiểm tra GPU giờ dùng `nullsrc`, vì ffmpeg đi kèm không có `color`/`testsrc`.
- Phân tích nhịp nhạc: ffmpeg của Remotion không có encoder `f32le`, nên chuyển sang đọc WAV 16-bit.
- Render đứng ở một mức % và không huỷ được.

### File chính
`server/render.mjs`, `server/render-worker.mjs`, `server/bundle-worker.mjs`, `server/ffmpeg.mjs`, `server/template.mjs`, `server/cli-template.mjs`, `engine/src/core/Overlays.tsx`, `engine/src/core/Stickers.tsx`, `ui/*`

---

## [0.1.0] — 2026-09-30 — Giai đoạn 1: web app chạy trên máy
Thay thế bộ `SAMI_Motion_Kit` v2.0.0 cũ (Remotion + các file `.bat`).

### Thêm
- Server Node local (`127.0.0.1:5178`) và UI vanilla JS, không cần bước build. Khởi động bằng `Start-Studio.bat`.
- Một engine dùng chung cho mọi dự án. Dự án gồm dữ liệu `project.json` và code cảnh `scenes/`.
- Chỉnh chữ theo ô có tên (`copy`), thời lượng cảnh + warp, khớp nhịp nhạc.
- Preview 16:9 / 9:16 / 1:1, dùng cùng code với khi render.
- Tiêu đề và phụ đề đủ kiểu; âm thanh 3 chế độ + phân tích nhịp.
- Xuất FHD / 2K / 4K, 24 / 30 / 60 fps, H.264 / H.265 / ProRes, chọn số luồng CPU, NVENC, mức ưu tiên, hàng đợi render, xuất cả 3 tỉ lệ.
- Tạo dự án từ một thư mục tài nguyên; tự tải lại khi Claude Code sửa cảnh.
- Undo / Redo (Ctrl+Z / Ctrl+Y) trong bộ nhớ, tối đa 80 bước; bản nháp chưa lưu được giữ trong trình duyệt.
- Mỗi dự án có `CLAUDE.md` + skill / workflow riêng cho Claude Code.
