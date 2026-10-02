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

## [0.4.0] — 2026-10-03 — Gói duyệt khách · So sánh điểm neo · Chuẩn −14 LUFS
Spec: `docs/specs/review-compare-loudness.md` · Hướng dẫn: `docs/HUONG_DAN_SU_DUNG.md` mục 11 (Gói duyệt, LUFS) và 11b (So sánh)

### Thêm
- **Gói duyệt khách** (tab Xuất → "📋 Tạo gói duyệt"): tạo ảnh khung giữa của mọi cảnh × mọi tỉ lệ mà không cần render video. Đo thực tế: 16 cảnh × 2 tỉ lệ ≈ 2 phút.
  - `review.html` gồm 1 file khoảng 2 MB, ảnh nhúng sẵn, mở được trên điện thoại. Có ô góp ý cho từng cảnh, tự lưu, và nút **Sao chép góp ý**.
  - `contact_<tỉ lệ>.jpg`: lưới mọi cảnh, gửi thẳng vào nhóm chat được.
  - Nút **＋ Bản xem 540p**: thêm một bản mp4 nhẹ vào hàng đợi để khách xem chuyển động.
  - Ô **"Dán góp ý khách" → Lưu vào `brief/GOP_Y.md`**: mỗi dòng thành một checkbox `- [ ]`, có ngày giờ. Claude Code đọc file này khi được bảo "sửa theo góp ý".
- **So sánh điểm neo ↔ hiện tại** (tab Lịch sử → "So sánh"):
  - Studio dựng lại bản cũ trong thư mục tạm, chụp ảnh từng cảnh của cả 2 bản và đặt cạnh nhau. Chỉ hiện các cảnh khác nhau.
  - Thuật toán so sánh có ngưỡng chịu nhiễu GPU (lưới xám 64×36, Δ ≥ 12/255).
  - Thư mục tạm tự dọn sau 24 h.
- **Chuẩn âm lượng khi xuất**: loudnorm 2 lượt (EBU R128), mặc định **−14 LUFS / −1 dBTP**, có tuỳ chọn −16 hoặc Tắt.
  - Đo thực tế: bản mix −16,3 → file mp4 −14,01 LUFS.
  - Kết quả ghi trên lượt render. Tiếp tục render sẽ dùng lại file đã chuẩn hoá.
- Độ phân giải **Nháp 540p**.
- API: `POST /api/review`, `GET /api/review/list`, `POST /api/review/feedback`, `POST /api/history/compare`, `GET /api/tasks`, `/cmp/…`. Thêm SSE `task`.
- `cli-review.mjs <dir> review | compare <a> [b] [ratio]`.
- Selftest kiểm tra ffmpeg có `loudnorm`.

### Sửa lỗi
- **Thay ảnh/nhạc trùng tên nhưng video xuất ra vẫn dùng file CŨ.**
  - Nguyên nhân: bundle Remotion copy `public/` nhưng cache chỉ tính theo code.
  - Cách sửa: `codeHash` tính thêm stat của `public/` (trừ `_engine`). Lỗi này có từ 0.1.
- Hộp so sánh và hộp khôi phục bị tràn ngang.

### Thay đổi
- Mọi bản xuất có âm thanh giờ được chuẩn về −14 LUFS theo mặc định. Muốn giữ đúng mức đã mix như bản cũ thì chọn "Tắt".
- Sau khi thay media trùng tên, lần render đầu tiên sẽ đóng gói lại, chậm hơn khoảng 20–60 s. Đây là hành vi đúng.
- Skill dặn AI đọc và tick `brief/GOP_Y.md`.

### File chính
Mới: `server/review.mjs`, `server/cli-review.mjs`, `docs/specs/review-compare-loudness.md`.
Sửa: `server/ffmpeg.mjs` (ffAsync, hasFilter, measureLoudness, normalizeLoudness), `server/render.mjs` (540p, loudness), `server/project.mjs` (codeHash + media), `server/preview.mjs`, `server/index.mjs`, `server/selftest.mjs`, `ui/app.js`, `ui/style.css`, skill, docs, `package.json`.

### Roll back
`git checkout v0.3.0`. Các thư mục `out/review/` và `.studio/compare/` vô hại, xoá được. Lưu ý: bản 0.3.0 vẫn còn lỗi media cũ trong bundle.

---

## [0.3.0] — 2026-10-02 — Lịch sử phiên bản (điểm neo)
Spec: `docs/specs/version-history.md` · Hướng dẫn: `docs/HUONG_DAN_SU_DUNG.md` mục 11b

### Thêm
- **Kho lịch sử cho mỗi dự án** tại `<dự án>/.history/`. Mỗi điểm neo chụp **toàn bộ dự án**: `project.json`, `scenes/`, `brief/`, ảnh, video, âm thanh, Lottie, font. Không chụp `out/`, `public/_engine/`, `.claude/`.
  - File lưu theo nội dung (sha1), mỗi nội dung chỉ lưu một lần. Một điểm neo mà media không đổi chỉ tốn vài KB.
  - Đo thực tế trên dự án 40 MB: lần đầu khoảng 0,6 s; các lần sau dưới 0,1 s nhờ cache stat.
  - Điểm neo nào giống hệt điểm gần nhất thì tự bỏ qua.
- **Điểm neo tự động**:
  - Trước **mỗi lượt chat với Claude Code** trong thư mục dự án. Đây là hook `UserPromptSubmit` mà Studio tự gộp vào `<dự án>/.claude/settings.json` khi mở dự án. Nhãn là đầu câu chat.
  - Khi mở dự án.
  - Khi Lưu (tối đa 2 phút/lần).
  - Trước khi upload hoặc nhập file trùng tên.
  - Trước mỗi lần khôi phục, nên khôi phục cũng hoàn tác được.
- **Tab / nút 🕘 Lịch sử**:
  - Đặt mốc có tên (★, giữ vĩnh viễn) và đổi tên điểm neo.
  - Danh sách theo ngày, kèm tóm tắt thay đổi (cảnh nào, bao nhiêu media).
  - **Khôi phục toàn bộ** hoặc **chỉ khôi phục mục đã chọn**: từng cảnh, từng file nhạc hay ảnh. Trước khi khôi phục có xem danh sách file sẽ ghi đè, lấy lại hoặc xoá.
- Dọn dẹp tự động: giữ mốc ★ và mốc tay, 60 điểm tự động gần nhất, cộng 1 điểm mỗi ngày trong 30 ngày, rồi xoá dữ liệu không còn dùng.
- CLI `server/cli-snapshot.mjs`: `snapshot | list | restore <id> [file…] | star | prune | --hook`.
- API: `GET /api/history`, `GET /api/history/preview`, `POST /api/history/{snapshot,star,restore,prune}`. Thêm SSE `restored`.
- `server/selftest.mjs` cho `npm run check`: kiểm tra deps, parse toàn bộ server và UI, chạy validate trên 8 mẫu, và test khôi phục lịch sử trên bản sao tạm.
- File lịch sử phiên bản app: `CHANGELOG.md`, `.gitignore`, `.gitattributes`. Repo GitHub có tag và Release cho từng bản.

### Thay đổi
- Bỏ hướng dẫn "đổi tên `.project.backup.json`" trong tài liệu, thay bằng tab Lịch sử. File backup đơn vẫn được ghi như cũ để tương thích.
- Skill `sami-motion-studio` dặn AI đặt mốc trước thay đổi lớn và không đụng `.history/`.
- `CLAUDE.md` và `docs/KE_HOACH_PHAT_TRIEN.md` thêm quy trình phát hành: bump version, CHANGELOG, tag, Release.
- Thanh tab bên phải tự xuống dòng khi chật.

### Sửa lỗi
- Lịch sử Ctrl+Z bị xoá mỗi lần Claude sửa code cảnh, vì trang tự tải lại. Nay Ctrl+Z được giữ qua lần tải lại, tối đa 40 bước.
- Gõ ô phụ đề không xoá chồng "Làm lại", gây redo sai.
- "Dự án gần đây" hiện trùng một dự án khi đường dẫn khác chữ hoa/thường. Nay so sánh không phân biệt hoa/thường và tự dọn mục trùng.
- `npm run check` trỏ tới `server/selftest.mjs` vốn không tồn tại.

### File chính
Mới: `server/history.mjs`, `server/cli-snapshot.mjs`, `server/selftest.mjs`, `docs/specs/version-history.md`, `CHANGELOG.md`.
Sửa: `server/index.mjs`, `ui/app.js`, `ui/index.html`, `ui/style.css`, `claude-code/skills/sami-motion-studio/SKILL.md`, `docs/*`, `CLAUDE.md`, `package.json`.

### Tương thích / Roll back
- Không đổi schema `project.json`.
- Quay về 0.2.2 bằng `git checkout v0.2.2`. Thư mục `.history/` sẽ bị bỏ qua và vô hại. Hook trong `.claude/settings.json` sẽ báo lỗi nhẹ vì không còn `cli-snapshot.mjs`, nhưng không chặn chat. Nếu dùng bản cũ lâu dài thì nên xoá mục `UserPromptSubmit` đó.

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
