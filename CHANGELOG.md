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

## [1.1.0] — 2026-10-08 — Carousel ảnh tách lớp (OpenCV); xuất thuần đã thử thật, sửa lệch 1 khung
Tuấn đồng ý 3 việc (2026-10-08): xuất thử chế độ thuần, cài `opencv-python-headless`, push.

### Thêm
- **Carousel từ ảnh, bản đầy đủ** (`lib/py/sami_layers.py`, OpenCV 5.0 trên `Y:\Python`):
  - tìm **khối chữ** (gradient hình thái + Otsu, nhận cả chữ đậm trên dải màu phẳng), cắt sát nét chữ theo màu nền viền;
  - tìm **chủ thể** bằng GrabCut từ khung giữa (chữ đánh dấu là nền), bỏ khi không đáng tin: độ đặc < 0,72, ít chi tiết hơn nền (mảng tường, trời), < 6 % hoặc > 65 % khung;
  - slide (`lib/hf/photo-slide.html`): chủ thể phóng thêm theo nhịp thở (`photo.depth`, 0,025), từng khối chữ bật lần lượt đúng nhịp (`photo.pop`, 0,05). Lớp chỉ phóng to quanh chính nó nên luôn che pixel gốc: không cần vá nền, khung 0 và cuối vòng = ảnh gốc;
  - `tools/carousel-new.mjs` (và nút ＋ Tạo carousel) tự tách lớp khi có OpenCV; `--no-layers` để tắt; không có OpenCV thì chạy chế độ gọn như cũ.

### Sửa lỗi
- **Xuất thuần trễ 1 khung** ở mọi cảnh sau cảnh đầu (native[n] = remotion[n−1]): thời điểm bắt đầu cảnh `a/30` không chẵn trong số nhị phân và Hyperframes làm tròn cả điểm bắt đầu lẫn thời điểm trong clip. Sửa: bắt đầu sớm nửa khung + lấy nguồn muộn nửa khung (`START_EPS`, `MEDIA_EPS` trong `server/hf-native.mjs`; footage cũng vậy). Đo bằng lượt xuất thật, không chỉ ảnh tĩnh (ảnh tĩnh và lượt xuất làm tròn khác nhau).

### Đã kiểm
- Xuất thật `hf-nha-hang` 9:16 FHD 30 fps bằng cả hai bộ dựng (GPU NVENC, lần đầu chạy NVENC thật):
  - thuần 7 phút 29 giây (gồm dựng 7 clip cảnh), Remotion 8 phút 52 giây (dùng lại clip đã có); cả hai 961 khung, 32,03 s, −14,4 LUFS;
  - trước khi sửa: PSNR trung bình 36,0 dB, 33 khung dưới 30 dB ở các đoạn chuyển động nhanh (lệch 1 khung); **sau khi sửa: trung bình 37,3 dB, thấp nhất 32,7 dB, 0 khung dưới 30 dB** (mức khác biệt do hai lần mã hoá NVENC); lượt xuất thuần khi clip cảnh đã có: 3 phút 41 giây;
  - âm thanh: độ to từng đoạn 4 s khớp tới 0,2 dB; toàn bộ lệch 16 ms (dưới nửa khung, chưa xử lý).
- Tách lớp: ảnh thử "bàn tiệc + tiêu đề" ra 3 khối chữ, không chủ thể (đúng); ảnh "đĩa sushi trên nền phẳng" ra 1 khối chữ + chủ thể; khung đầu slide so với ảnh gốc 45 đến 48 dB. Selftest thêm phép thử tách lớp.

## [1.0.0] — 2026-10-08 — Quản lý dự án, sửa lỗi Khuôn / Footage, khuôn ngay từ storyboard, xuất Hyperframes thuần
HANDOFF mục 5 + lỗi Tuấn gặp khi thử 0.9. Tuấn bảo làm v1.0, chưa push.

### Sửa lỗi (Tuấn báo khi thử 0.9)
- **Hộp 🧩 Khuôn không có nút đóng**: hộp rộng 1100 px nằm trong khung 720 px nên nút "Đóng" ở cuối bị trôi khỏi màn hình. Mọi hộp thoại giờ có **nút ✕ dính ở góc**, đóng bằng **Esc** hoặc **bấm ra nền tối**; hộp Khuôn dùng khung rộng (tối đa 1240 px, 90 % chiều cao).
- **Tab Footage trống, không thêm được video**: Studio đang chạy bản server cũ (mở trước khi cập nhật) nên `/api/media` trả "Not Found" (chữ đỏ nhỏ, trông như trống). Giờ:
  - server ghi phiên bản lúc khởi động (`bootVersion`); giao diện thấy server cũ thì hiện **dải cam "Studio đang chạy bản cũ… mở lại Start-Studio.bat"**;
  - tab nào lỗi cũng hiện lý do (trước đây lỗi trong tab async làm khung trống);
  - tab Footage thêm **📂 Chọn video trên máy…** (hộp chọn nhiều file của Windows, server tạo liên kết cứng nếu cùng ổ, không thì chép bất đồng bộ: không tải qua trình duyệt, hợp file vài GB), **📚 Thư viện / Stock / B-roll** (thư viện SAMI, stock, video đã có trong dự án), ô **kéo thả** nét đứt luôn hiện.
  - Route `/api/media/import-path`, `/api/pick-file?multi=1`; `footage.importPath()`.

### Thêm
- **Quản lý dự án ở trang chủ** (31 dự án nhìn bừa):
  - ô **tìm** (tên, khách, tag, đường dẫn; không cần dấu), **gom** theo tháng / ngày / khách / trạng thái / loại / không gom, nhóm **gập được** (nhớ theo máy), nút **Chọn nhóm**;
  - **sắp xếp** theo ngày dự án (mới / cũ trước), mở gần nhất, sửa gần nhất, tên; **lọc** trạng thái, loại, khách, **tag**; xem **thẻ** hoặc **danh sách** một dòng;
  - ngày dự án đọc từ tiền tố tên theo quy tắc đặt tên (`YYMMDD-…`, `YYMM-…` + ngày tạo), không có thì ngày tạo `project.json`;
  - **tag** lưu trong `project.json → tags` (đi theo dự án), gắn / bỏ cho nhiều dự án một lần; **🙈 Ẩn** khỏi trang chủ theo máy (`settings.listHidden`), "Hiện dự án đã ẩn" để lấy lại;
  - danh sách không còn cắt ở 20 dự án gần nhất (giữ tới 500); `/api/state` trả thêm khách, tag, số cảnh, độ dài, tỉ lệ, ngày tạo / sửa, ẩn. Route `/api/project/meta`.
- **Ô tìm trong 🧩 Khuôn** (tên, mã, mô tả, nhóm, tên ô chữ; không cần dấu), đếm số khuôn khớp, mã khuôn hiện trên thẻ.
- **Khuôn ngay từ lúc lên kịch bản** (trả lời câu hỏi của Tuấn):
  - `lib/hf/khuon/CATALOG.md`: danh mục một trang (≈ 2k token) mọi khuôn + ô chữ, sinh bằng `cli-pipeline.mjs catalog --write` (`--json` cho máy); selftest báo khi danh mục cũ;
  - dây chuyền mới **`storyboard`**: brief là danh sách cảnh `{khuon, label, values, beats?, theme?}` (+ `closing: true` để thêm CTA và thẻ kết từ brand) → dự án dựng sẵn, cho mọi video không khớp promo / maps / menu;
  - `cli-pipeline.mjs add <dự án> <khuôn> [--after S02 | --replace S03] [--values …]`: thêm / đổi một cảnh từ dòng lệnh;
  - mọi dây chuyền **cảnh báo chữ đặt vào ô không có** trong khuôn (trước đây bị bỏ qua lặng lẽ);
  - skill: storyboard có cột "khuôn", dòng có khuôn không cần viết code cảnh.
- **Xuất Hyperframes thuần, không cần Remotion** (thử nghiệm) `server/hf-native.mjs` + `lib/hf/native/film.js`:
  - cảnh HTML → clip (cache cũ); bố cục **FILM** (một `<video>` mỗi cảnh, chuyển cảnh mờ + nhoè như engine, footage có khung / cắt / tốc độ, tiêu đề 9 kiểu chạy chữ, phụ đề, ảnh chèn + 12 sticker tự vẽ, grain + vignette) do Hyperframes xuất; âm thanh trộn bằng **ffmpeg** (đoạn cắt nhạc + crossfade, tắt dần, hạ nhạc theo thoại / footage có tiếng, SFX, giọng, tiếng footage có atempo) → −14 LUFS → ghép (chép luồng hình);
  - tab Xuất → ô **Bộ dựng** (Remotion / Hyperframes thuần) kèm kiểm tra trực tiếp dự án có xuất thuần được không và vì sao; `GET /api/render/native-check`; `cli-render --engine native`;
  - từ chối rõ lý do: cảnh `.tsx`, Lottie, chế độ vừa khung, H.265, 540p / 2K, xuất từng cảnh;
  - `filmStills()`: ảnh kiểm bố cục FILM bằng clip đã có trong cache (cảnh chưa có clip hiện ô sọc), không dựng video.
- **3 template Hyperframes theo ngành** dựng toàn bằng khuôn (xuất thuần được): `hf-nha-hang` (7 cảnh, 32 s), `hf-nail-spa` (9 cảnh, 43 s), `hf-google-maps` (8 cảnh, 38 s); chữ tiếng Đức, quán hư cấu, có ảnh bìa. Dựng lại: `node tools/khuon-templates.mjs --apply`.

### Thay đổi
- `/api/audio/analyze` (phân tích nhịp nhạc) chạy trong **worker thread**, có cache theo file: không còn chặn server vài giây.
- `validate`: ffprobe độ dài nhạc mix sẵn chỉ chạy một lần mỗi phiên bản file.
- Nhãn ô "Năm" của khuôn `calendar-date` → "Năm (vd 2026)" (chuẩn mẫu đòi nhãn ≥ 4 ký tự).
- "Bộ dựng" không lưu vào cài đặt xuất mặc định; "＋ Bản xem 540p" luôn dùng Remotion.

### Đã kiểm
- `npm run check`: tất cả đạt, thêm 2 phép thử (danh mục khuôn khớp; xuất thuần: từ chối đúng, bố cục FILM đủ cảnh / tiêu đề, trộn âm thanh ffmpeg ra đúng độ dài phim) và dây chuyền storyboard.
- Trên Studio thử (cổng 5179): trang chủ gom theo tháng / ngày, tìm "maps" ra 3 dự án, tag + ẩn qua API; hộp Khuôn: tìm "uu dai" ra 1 khuôn, ✕ nằm trong khung, Esc và bấm nền đều đóng; tab Footage: nhập clip thử 3 s bằng đường dẫn → bản xem trước 540p → ＋B-roll lên timeline; tab Xuất: Bộ dựng báo ✓ với dự án khuôn, ✗ H.265.
- Bố cục FILM: 8 ảnh tĩnh (tiêu đề rise + highlight gradient, karaoke có nền, đánh máy, phụ đề, sticker khoanh tròn tự vẽ, sticker chạm, PiP lấy khung thật từ video).
- **Chưa thử**: một lượt xuất thuần thật (cần Tuấn cho phép xuất), so với bản Remotion cùng dự án.

### Chưa làm (cố ý)
- Tách router `index.mjs`, hàng đợi semaphore (xuất vẫn tuần tự: an toàn với giới hạn phiên NVENC của card dân dụng), gom 17 helper TSX (đụng 29 dự án cũ).
- Carousel ảnh bản đầy đủ bằng OpenCV: cần cài `opencv-python-headless`, chờ Tuấn đồng ý.
- Đổi ffmpeg sang bản LGPL: chỉ khi phân phối cho khách (`node tools/get-ffmpeg.mjs --lgpl --force`).

### File chính
`ui/{app.js,index.html,style.css}`, `server/{index,footage,hf-native,render,cli-render,cli-pipeline,audio,validate,selftest}.mjs`, `lib/hf/native/film.js`, `lib/hf/khuon/CATALOG.md`, `lib/pipelines/storyboard.mjs`, `tools/khuon-templates.mjs`, `templates/hf-{nha-hang,nail-spa,google-maps}/`, skill `sami-motion-studio` (SKILL.md, khuon.md, render-ffmpeg.md), `docs/HUONG_DAN_SU_DUNG.md`.

### Roll back
`git checkout v0.9.0` (khi đã gắn tag) hoặc commit trước đó. `project.json → tags` và `settings.listHidden` bị bản cũ bỏ qua, không hại.

## [0.9.0] — 2026-10-08 — Footage: video quay thật, B-roll, PiP, bản ghi màn hình; preset xuất; khối vẽ bằng code
HANDOFF mục 4. Tuấn bảo làm v0.9 (2026-10-08), chưa push.

### Thêm
- **Lớp footage** `project.json → tracks.video[]` (giây): `at`, `in`/`out`, `speed`, `role` main / broll / pip / screen, `fit`, `mask` (bo góc, tròn, điện thoại, laptop), `pip{x,y,w,r}`, `aspect`, `volume` (dB, null = tắt tiếng), `duck`, `fadeIn`/`fadeOut`, `z`, `formats`. Vẽ phía trên cảnh, dưới ảnh chèn / tiêu đề / phụ đề, theo tỉ lệ xuất thật (cả chế độ vừa khung).
  - Engine: `engine/src/core/VideoTrack.tsx` (`OffthreadVideo` có cắt và tốc độ, khung điện thoại / laptop vẽ bằng CSS), `MediaCtx`; props `mediaBase`, `mediaProxy`.
  - **Tiếng footage** vào `AudioTrack` (cả lượt âm thanh khi xuất); clip có tiếng làm nhạc tự hạ như giọng đọc.
  - Cảnh `engine: "blank"`: đoạn trống để footage hiện qua; Studio tự thêm đoạn "Footage" khi clip dài quá phim (vẫn cắt đúng 15n+1).
- **Nhập footage** `server/footage.mjs`: tải lên dạng luồng vào `media/` (không đệm cả file trong RAM), dò VFR theo khoảng cách khung → bản CFR 30 `.cfr30.mp4`, **bản xem trước 540p** (NVENC nếu có, GOP 15, AAC) + ảnh đại diện vào `media/.cache/`, hàng đợi một lần mã hoá một lúc.
  - Xem trước đọc `/pm/<dự án>/proxy/…`; **xuất và ảnh tĩnh đọc file gốc** qua máy chủ HTTP cục bộ tạm (`serveMedia`, có Range), không chép footage vào bundle.
  - Route: `/api/media`, `/api/media/upload`, `/api/media/prepare`, `/api/media/adopt` (stock / thư viện → `media/broll/`), `/api/media/thumb/…`, `/pm/…`.
- **Tab Footage**: kho video của dự án (ảnh, độ dài, cỡ, có tiếng), ＋Chính / ＋B-roll / ＋PiP / ＋Màn hình tại vị trí đang xem, danh sách clip, sửa clip (bắt đầu, cắt vào / ra, kết thúc tại đây, tách đôi, tốc độ, hiện / tắt dần, khung, vị trí PiP + 5 nút góc, âm lượng, hạ nhạc). **Kéo video thả lên khung xem** → chọn vai trò (PiP đặt đúng chỗ thả). Vạch footage trên thanh thời gian. "Dùng ▾" của video stock / thư viện → B-roll / PiP / Chính.
- **Preset xuất** `lib/presets.json` (8 preset: Reels, Feed 4:5, Vuông, YouTube, YouTube 4K, Ads nhẹ, ProRes, bản xem 540p): ô Preset ở tab Xuất, `cli-render --preset`.
- **Khối vẽ bằng code** `lib/hf/blocks/blocks.js` (`SAMI.B.bars`, `line`, `cursor`, `route`, `wipe`) + 2 khuôn mới: **chart-bars** (biểu đồ cột tăng trưởng), **map-route** (đường tới quán trên bản đồ vẽ bằng SVG). Tổng 18 khuôn.
- Cảnh HTML nhúng được footage (`media/…`): staging tạo junction `media/`; ô ảnh / video của khuôn nhận đường dẫn `media/`.
- `cli-validate`: thiếu file footage, cắt vào / ra sai, tốc độ ≤ 0, clip quá cuối phim, chưa có bản xem trước. `cli-still`: khung có footage đi qua Remotion.
- Skill `sami-motion-studio`: `references/footage.md`, `schema.md` (tracks.video, cảnh blank), dòng mới trong bảng "Decide the job".

### Đã kiểm
- `npm run check` đạt, thêm: nhập + bản xem trước + VFR → CFR + clip trên timeline + máy chủ media (Range, không lộ file ngoài `media/`), preset hợp lệ, 18 khuôn đúng luật.
- Thật trên máy với clip tổng hợp nhỏ (testsrc, CPU): proxy 540p, VFR → CFR 30, ảnh tĩnh Remotion 9:16 + 16:9 có PiP bo góc, B-roll phủ khung, bản ghi trong khung điện thoại; Studio thử (cổng 5179): tab Footage, khung xem phát proxy 540p, đổi khung tròn + góc trên trái, tách đôi clip, preset Reels điền đúng ô.
- **Chưa thử (cần Tuấn cho phép xuất)**: video 60 s gồm 1 clip chính, 2 B-roll, 1 PiP; lệch tiếng / hình ≤ 1 khung (vỗ tay); RAM < 12 GB; NVENC thật. **Không render video nào.**

### Roll back
`git checkout v0.8.3` (hoặc commit 0.8.3). `tracks.video` bị bỏ qua ở bản cũ; cảnh `blank` sẽ báo "Thiếu scene". Thư mục `media/` không bị đụng.

---

## [0.8.3] — 2026-10-08 — Khuôn + Dây chuyền ("trả tiền nghĩ một lần")
Spec: `docs/specs/khuon-day-chuyen.md` (Tuấn bảo triển khai 2026-10-08). Phần đắt của một video (chuyển động, bố cục từng tỉ lệ, nhịp) làm một lần thành khuôn; video sau Claude chỉ điền JSON.

### Thêm
- **16 khuôn** Hyperframes có tham số ở `lib/hf/khuon/<id>/` (`khuon.json` + `scene.html` + ảnh xem trước), mỗi khuôn chạy được 16:9, 9:16, 1:1, 4:5 và 3 theme:
  - hook-words, hook-ransom (chữ cắt dán), problem-stamp (lý do + con dấu), benefits-3, stat-counter (vòng + số đếm);
  - maps-search, maps-profile (màn hình Google Maps dựng bằng HTML), chat-whatsapp, phone-scroll (ảnh chụp dài tự cuộn);
  - photo-collage (polaroid + băng dính), menu-dish, offer-badge, review-quote, calendar-date (lịch tháng thật, khoanh ngày), cta-contact, endcard-logo.
  - Lấy cảm hứng từ V22 (giấy kraft, chữ cắt dán, polaroid, lịch), V23 (điện thoại, chat, Maps, thẻ kết) và hf-starter.
- **Bộ kit khuôn** `lib/hf/khuon/kit.{css,js}`: gắn slot (`data-slot`, `data-slot-img`, ô trống tự ẩn), 3 theme `night` / `paper` / `light` (màu brand thắng), khối điện thoại / thẻ / nhãn / nút / polaroid / con dấu / bong bóng chat / sao, helper chữ cắt dán, bật vào, đóng dấu, đếm số, gõ chữ, nét vẽ, icon SVG.
- **`server/khuon.mjs`**: liệt kê, **thêm cảnh** (chèn sau một cảnh, dời cảnh + SFX sau đó, cắt đúng lưới 15n+1), **Đổi khuôn** (giữ chữ của ô cùng tên, cất ô thừa vào `scene.khuon.stash` để đổi lại thì khôi phục, không đụng giọng / nhạc / SFX / thời lượng), `buildProject()` cho dây chuyền.
- **Dây chuyền** `lib/pipelines/{promo, maps, menu}.mjs` + `server/cli-pipeline.mjs` (`list`, `example`, chạy): brief.json → dự án đủ cảnh, chữ, SFX theo nhịp, brand; validate + bảng ảnh QA `out/qa/pipeline_<tỉ lệ>.jpg`. **Không render.**
- **Bộ nhận diện khách** `SAMI_Library/brands/<khách>/brand.json` (màu, gradient, font, theme, logo, khẩu hiệu, liên hệ, CTA, giọng, nhạc); mẫu `brands/sami`. Route `/api/brands`.
- Studio: nút **🧩 Khuôn** ở cột Cảnh (chọn theme, lọc nhóm, ảnh mẫu, **＋ Thêm sau S0x** / **Đổi S0x**, có điểm neo Lịch sử trước khi áp). Route `/api/khuon`, `/api/khuon/thumb/…`, `/api/khuon/apply`.
- `tools/khuon-thumbs.mjs`: dựng dự án thử chứa mọi khuôn với chữ / ảnh mẫu, chụp ảnh tĩnh (không render) → bảng kiểm theo theme; `--apply` ghi ảnh xem trước. Ảnh mẫu (nội bộ) ở `SAMI_Library/assets/img/khuon-mau/` (hardlink từ V22).
- Cảnh Hyperframes nhận `SAMI.khuon`, `SAMI.theme`; **font brand** (`brand.fonts.head|ui|script`, tên họ font fontsource) tự nạp trong cảnh; ảnh `lib:` trong ô chữ dùng được khi render.
- **Sổ chi phí theo video** (gói sami-media 1.1.0): mỗi lượt Claude Code của người chạy gói web ghi `claudeUsd` (hạn mức gói Claude, không vào trần 2/20 USD); `ledger --project <thư mục>` (CLI) / `ledger {project_dir}` (MCP) = API + Claude quy đổi của một video.
- Skill `sami-motion-studio`: `references/khuon.md` (khuôn, dây chuyền, brand.json, kỷ luật phiên, chia model, chi phí theo video) + 2 dòng trong bảng "Decide the job".

### Sửa lỗi
- sami-media: thoát tiến trình ngay sau khi đóng kết nối CDP làm Node trên Windows báo `UV_HANDLE_CLOSING`: `close()` giờ chờ socket đóng hẳn.

### Đã kiểm
- `npm run check` đạt, thêm 3 mục: mọi khuôn đúng luật (slot khai báo đủ, ô ảnh đúng hậu tố, không ngẫu nhiên / thời gian thật / CDN, có kit + K.bind); thêm cảnh / đổi khuôn / đổi lại; 3 dây chuyền dựng từ brief mẫu không lỗi validate. sami-media `npm test` 21 mục.
- Ảnh kiểm 16 khuôn × 3 theme × 9:16 + 16:9 (snapshot, đã xem); dây chuyền `maps` với brief mẫu → 8 cảnh, 40 s, bảng ảnh QA đã xem.
- **Không render video nào.**

### Roll back
`git checkout v0.8.2` (hoặc commit 0.8.2). Dự án dựng từ khuôn vẫn mở được ở bản cũ (cảnh là HTML thường trong `hf/`; trường `khuon` bị bỏ qua, theme rơi về night).

---

## [0.8.2] — 2026-10-08 — Chrome SAMI, kịch bản ChatGPT cố định, bộ mã hoá thật, cổng AI tách thành gói `sami-media`
Quyết định của Tuấn 2026-10-08 (HANDOFF mục 3b). Lần thử 2026-10-08 trong Chrome chính bị hộp "Lưu ở đâu" và hỏi Allow mỗi lần nối: 0.8.2 chuyển mọi tự động hoá sang một Chrome riêng.

### Thêm
- **Chrome SAMI**: hồ sơ Chrome riêng cho tự động hoá `Z:\SAMI_Video\.chrome-sami` (ngoài git), mở với `--remote-debugging-port=9333`.
  - Hồ sơ không mặc định nên Chrome **không hỏi Allow** khi nối CDP.
  - Trước lần mở đầu ghi `Default/Preferences`: thư mục tải `Z:\SAMI_Video\.sami-cache\downloads`, `prompt_for_download: false`, `savefile` cùng chỗ; mỗi lần nối còn gọi CDP `Browser.setDownloadBehavior`. Không ai chọn thư mục tải.
  - Tab **Nguồn & AI** (nguồn gói web): khung Chrome SAMI có nút **Mở Chrome SAMI**, trạng thái **đã đăng nhập** ChatGPT / Google (Gemini, Flow) / Suno (chỉ đọc tên cookie), nút **Mở trang đăng nhập**, ↻, và dòng "Chạy lần lượt" cho biết người chạy nào dùng được.
  - Route `/api/providers/chrome`, `/api/providers/chrome/open`.
- **Kịch bản ChatGPT cố định** (0 token, CDP thẳng vào Chrome SAMI): mở tab → dừng nếu chưa đăng nhập / CAPTCHA → dán prompt, so **nguyên văn** (không khớp thì không gửi) → gửi **một lần** → chờ đủ ảnh → đọc `img.currentSrc`, `fetch` trong trang (có cookie) → ingest kèm prompt + giấy phép → đóng tab.
- **Chuỗi người chạy gói web**: kịch bản cố định → Jev → Claude Code (`claude -p`, Sonnet). Prompt gửi **tối đa một lần** cho cả chuỗi: đã gửi rồi thì Claude chạy chế độ **chỉ lấy kết quả**. Gặp trang đăng nhập / CAPTCHA thì dừng cả chuỗi.
  - **Jev** (`C:\Users\Tuan\tools\jev-ultrafast`): chỉ gõ + gửi khi kịch bản hỏng **trước** lúc gửi; ảnh vẫn do kịch bản lấy. **Tắt** cho tới khi Tuấn thử và bật (`providers.json → opts["chatgpt-web"].jev = true`); `.env` của Jev hiện thiếu `TEXT_MODEL_API_KEY`.
  - Claude Code dùng browser-harness **trỏ sang Chrome SAMI** (`BU_CDP_URL=http://127.0.0.1:9333`, `BU_NAME=sami-agent`); MCP browser-harness cấp user vẫn giữ Chrome chính cho việc khác.
- **Bộ mã hoá thật** của mỗi lượt xuất: trước khi ghép, ffprobe đoạn đầu (tag `encoder` của stream, nếu không có thì dấu x264 / x265 trong bitstream) → `j.encoder` = "GPU · h264_nvenc" / "CPU · libx264", `j.encoderReal`; cảnh báo nếu đã chọn NVENC mà file do CPU mã hoá. Carousel đọc slide đầu. Lượt xuất xong ghi một dòng vào `.studio/renders.jsonl`.

### Thay đổi
- **Cổng AI tách khỏi Studio** thành gói độc lập **`sami-media`** ở `Z:\SAMI_Video\MCP-sami-media` (repo private `tuansami/MCP-sami-media`, chưa push).
  - Studio phụ thuộc `"sami-media": "file:../MCP-sami-media"`; thư mục `providers/` bị xoá, một bản mã duy nhất. Studio bỏ phụ thuộc trực tiếp `@modelcontextprotocol/sdk` (nằm trong gói).
  - Gói tự có `paths` (đường dẫn qua biến môi trường), phần index thư viện, `childEnv` tối giản; `synth-sfx` tìm `sami_audio.py` qua `SAMI_STUDIO`.
  - `server/paths.mjs` đặt `SAMI_LIBRARY`, `SAMI_CACHE`, `SAMI_USERDATA`, `SAMI_STUDIO` cho gói; `server/library.mjs` re-export index / search / meta của gói (Studio giữ phần dự án: `materialize`, `libRefs`, brands).
  - MCP `sami-media` đăng ký lại (cấp user): `node Z:/SAMI_Video/MCP-sami-media/bin/mcp.mjs`, env `SAMI_STUDIO`. Thêm tool `chrome_status`. CLI mới: `bin/cli.mjs` (`chrome`, `web --request`, `downloads` đọc thư mục cố định).
- Nút gói web: "✨ Tạo (kịch bản cố định)" khi có kịch bản, "✨ Tạo bằng Claude Code" khi không; bị mờ khi Chrome SAMI chưa mở.
- Skill `sami-motion-studio` (`references/providers.md`), `CLAUDE.md`, `docs/HUONG_DAN_SU_DUNG.{md,html}` (mục 11f, tab Xuất, xử lý sự cố).

### Đã kiểm
- `npm run check` đạt, gồm 20 phép thử của gói (`npm test` trong `MCP-sami-media`): Chrome SAMI ghi đúng thư mục tải; Chrome đóng thì chuỗi web dừng **trước khi gửi**, không gọi Claude, không ghi sổ; Jev tắt khi thiếu khoá hoặc chưa bật; người chạy Claude chỉ được browser-harness (nối Chrome SAMI) + 2 lệnh CLI; `probeEncoder` đọc đúng `libx264` từ một file thật (clip 0,2 s từ ảnh tĩnh, CPU).
- Thật trên máy: bấm **Mở Chrome SAMI** trong Studio thử (cổng 5179) → Chrome mở 3 trang đăng nhập, CDP nối được ngay không hỏi Allow, Preferences giữ thư mục tải; kịch bản ChatGPT nhận ra **chưa đăng nhập** và dừng (không gửi); gõ prompt nhiều dòng vào ô nhập ChatGPT rồi xoá (không gửi). Phát hiện ChatGPT 2026-10 không còn `#prompt-textarea`: kịch bản dò ô nhập theo nhiều cách (ProseMirror hoặc textarea đang hiện).
- `claude mcp get sami-media`: ✔ Connected với gói mới.
- **Chưa thử**: một lượt ChatGPT thật (cần Tuấn đăng nhập trong Chrome SAMI và đồng ý gửi), Jev, NVENC thật trong một lượt xuất (cần Tuấn cho phép xuất 3 s). **Không chạy render nào.**

### File chính
- **Gói mới** `Z:\SAMI_Video\MCP-sami-media`: `src/{paths, env, library, cdp, chrome}.mjs`, `src/runners/{index, chatgpt, jev}.mjs`, `bin/{cli, mcp}.mjs`, `test/{run, selftest}.mjs`, `README.md`; chuyển từ `providers/`: gateway, config, ledger, tokens, pricing, net, agent, adapters, recipes, workflows.
- **Studio:** `server/{paths, library, index, render, ffmpeg, selftest}.mjs`, `ui/app.js`, `package.json`, `.gitignore`, `CLAUDE.md`, skill `sami-motion-studio/references/providers.md`, `docs/HUONG_DAN_SU_DUNG.{md,html}`. **Xoá:** `providers/`.

### Roll back
`git checkout v0.8.1` (hoặc commit 0.8.1), `npm install`, rồi đăng ký lại MCP cũ: `claude mcp remove sami-media -s user` và `claude mcp add -s user sami-media -- node "Z:/SAMI_Video/SAMI_Motion_Studio/providers/mcp.mjs"`. Dữ liệu (`%APPDATA%\SAMI`, SAMI_Library) không đổi định dạng. Hồ sơ Chrome SAMI và thư mục tải nằm ngoài git, xoá được.

---

## [0.8.1] — 2026-10-08 — Giao diện cho 0.7 / 0.8: tạo carousel, dùng media trong lúc sửa, xoá dự án, dọn lịch sử, phần cứng xuất, Claude Code xuất video (có công tắc)
Phản hồi của Tuấn sau khi mở Studio 0.8.0: không thấy chỗ tạo carousel, có ô prompt mà không có nút tạo, ảnh lấy về không dùng được trong lúc sửa, thiếu xoá dự án và dọn lịch sử, tab Xuất không cho thấy ffmpeg / GPU.

### Thêm
- **Trang Dự án:**
  - nút **＋ Tạo carousel** (hộp tạo: chế độ chủ đề hoặc từ thư mục ảnh, màu, tài khoản, độ dài slide) và **＋ Tạo video**; thẻ carousel có nhãn;
  - **chọn nhiều dự án** (ô tick trên thẻ, Chọn tất cả) → **Gỡ khỏi danh sách** hoặc **🗑 Chuyển vào Thùng rác** Windows (SHFileOperation có FOF_WANTNUKEWARNING: quá lớn cho Thùng rác thì Windows hỏi trước khi xoá hẳn; từ chối ổ mạng, dự án đang render, dự án người khác đang mở, thư mục app/mẫu).
- **Tab Lịch sử:** **🧹 Dọn lịch sử** với 3 mức (Chuẩn, Gọn, Tối thiểu); mốc ★ và mốc tự đặt luôn giữ; báo dung lượng giải phóng.
- **Dùng media trong lúc sửa:**
  - nút **"Dùng ▾"** trên mọi ảnh / âm thanh lấy về hay vừa tạo: thay ảnh ô Chữ, thêm Ảnh chèn, thêm Watermark, đặt nhạc nền, thêm giọng đọc (đo độ dài), thêm SFX tại vị trí đang xem; với carousel: nhạc chạy qua slide hoặc SFX vào slide đang chọn;
  - nút **📚 Chọn…** cạnh ô ảnh (tab Chữ, Ảnh chèn), Lottie, nhạc nền, file mix: chọn từ dự án, thư viện SAMI hoặc stock;
  - **kéo thả lên khung xem**: file từ Explorer, ảnh stock, ảnh thư viện → Ảnh chèn đúng chỗ thả; âm thanh → hỏi đặt vào đâu;
  - danh sách "Vừa lấy / vừa tạo" trong tab Nguồn & AI; ô chọn file hiện `lib:` là "thư viện SAMI" thay vì "(không thấy)".
- **Tab Nguồn & AI:** nút **✨ Tạo** luôn hiện; nguồn chưa có khoá có ô **Dán khoá** ngay tại chỗ; nguồn gói web có **✨ Tạo bằng Claude Code**: Studio chạy `claude -p` (Sonnet) ngầm, chỉ được dùng browser-harness (Chrome thật của Tuấn) và 2 lệnh `providers/cli.mjs downloads|ingest`; một lượt một lúc, có nút Dừng, dừng hẳn khi gặp trang đăng nhập / CAPTCHA / hết lượt. Khoá API, trần chi phí, cổng cục bộ gập lại cho gọn.
- **Tab Xuất:**
  - **thẻ phần cứng**: tên card, VRAM, driver (nvidia-smi / WMI), NVENC H.264 / H.265, ffmpeg đầy đủ (bản, vai trò) và ffmpeg của Remotion, CPU;
  - ô **Bộ mã hoá video**: "GPU · NVIDIA NVENC (GTX 1070)" / "CPU · x264 / x265";
  - công tắc **Cho phép Claude Code xuất video** (mặc định TẮT); lượt xuất do Claude ghi "do Claude Code" trong hàng đợi.
- **`server/cli-render.mjs`**: Claude Code xuất video bằng đúng bộ máy của Studio. Bắt buộc `--request "<nguyên văn lời Tuấn>"` và công tắc đang bật. Studio mở → vào hàng đợi Studio; Studio tắt → render trong tiến trình CLI. `--status`, `--enable --request …`, `--disable`, `--draft`, `--scene`, `--no-wait`. Mọi lần bật / tắt / xuất ghi `.studio/cli-render.log`.
- `providers/cli.mjs downloads [--since]` (file mới trong thư mục Tải xuống) và `ingest --prompt-file`.
- Route mới: `/api/project/remove`, `/api/carousel/new`, `/api/render/cli`, `/api/providers/agent[/cancel]`; `/api/history/prune` nhận `level`.

### Thay đổi
- `cli-carousel.mjs render` cũng cần công tắc + `--request` (QA vẫn dùng `stills` / `audio` tự do). Skill `sami-motion-studio` và `sami-carousel`: Claude **không bao giờ tự xuất video**, chỉ khi Tuấn yêu cầu.
- Mẫu mẫu (thư mục `projects/` đi kèm) bị gỡ khỏi danh sách thì không tự hiện lại khi khởi động.
- `docs/HUONG_DAN_SU_DUNG.md`: mục 0 (Claude Code và Studio: ai làm gì), 3, 11, 11b, 11e (carousel), 11f (Nguồn & AI), 13.

### Sửa lỗi
- **Tab Xuất bị hỏng với dự án carousel** (0.7): bảng kích thước thiếu 4:5 → lỗi `dims` khi mở tab.

### Đã kiểm
- Studio thử ở cổng 5179 với dự án thử trong scratchpad: chọn và chuyển 1 dự án vào Thùng rác (thư mục có trong Recycle Bin, lấy lại được); tạo carousel từ hộp thoại; tab Xuất hiện đúng GTX 1070 · 8 GB · driver 582.28 · NVENC H.264/H.265 · ffmpeg n8.1.3; tìm ảnh Wikimedia → Dùng ▾ → Ảnh chèn hiện trên preview; kéo thả ảnh lên khung xem → Ảnh chèn đúng vị trí (25 %, 25 %); SFX tổng hợp → Dùng ▾ → cue; dọn lịch sử chạy.
- Claude Code chạy ngầm: nạp đúng browser-harness (23 tool), chỉ MCP đó. **Chưa chạy lượt tạo ảnh thật qua ChatGPT** (cần Tuấn mở Chrome, đăng nhập).
- **Không chạy render nào** khi kiểm (luật: chỉ xuất khi Tuấn yêu cầu); chỉ kiểm các trường hợp từ chối.
- `npm run check` đạt (thêm 2 mục: CLI xuất từ chối khi thiếu `--request`; agent chỉ được dùng browser-harness).

### File chính
- **Mới:** `server/{cli-render, trash, gpu}.mjs`, `providers/agent.mjs`.
- **Sửa:** `server/{index, history, cli-carousel, selftest}.mjs`, `providers/{gateway, cli}.mjs`, `ui/{app.js, index.html, style.css}`, `tools/carousel-new.mjs`, skill `sami-motion-studio` (+ `references/providers.md`), skill `sami-carousel`, `docs/HUONG_DAN_SU_DUNG.{md,html}`, `CLAUDE.md`.

### Roll back
`git checkout v0.8.0` (hoặc commit 0.8.0). Công tắc `allowCliRender` trong `.studio/settings.json` bị bỏ qua ở bản cũ. Dự án đã chuyển vào Thùng rác: khôi phục từ Recycle Bin của Windows.

---

## [0.8.0] — 2026-10-08 — Cổng AI: stock, tạo ảnh / giọng / nhạc, chi phí có trần
Lộ trình: v0.6 Nền móng ✅ → v0.7 Carousel ✅ → **v0.8 Cổng AI** → v0.9 Footage → v1.0. Spec: `docs/specs/v0.8-cong-ai.md`.

### Thêm
- **Cổng `providers/`**: mọi việc tìm, tạo, tải media đi qua một chỗ (`gateway.mjs`), dùng chung cho UI, CLI và MCP.
  - **Stock miễn phí:** Pexels, Pixabay, Unsplash (cần khoá miễn phí), Wikimedia Commons (không cần khoá, chỉ lấy CC0 / PD / CC BY / CC BY-SA). Ảnh và video.
  - **Miễn phí:** edge-tts (giọng nháp), SFX tổng hợp (`sami_audio.py`), cổng cục bộ Kokoro-FastAPI và ComfyUI (ACE-Step nhạc, Stable Audio SFX). Chỉ dựng cổng, không tải model.
  - **Trả tiền:** ElevenLabs giọng / nhạc / hiệu ứng (có sẵn giọng Anh Thu, Ái Hạnh), OpenAI gpt-image, Gemini nano banana, Flux (BFL), fal, Replicate. fal và Replicate chỉ chạy model có trong bảng giá.
  - **Gói web:** ChatGPT (5 ảnh một lệnh), Gemini, Google Flow / Veo, Suno. Claude chạy theo kịch bản `providers/recipes/*.md` bằng browser-harness, file tải về được ghi meta qua `ingest`.
  - Không có adapter tạo ảnh ElevenLabs (luật cứng).
- **Luật chi phí do gateway tự áp, không phụ thuộc người gọi:**
  - lệnh trả tiền cần **mã xác nhận**: gắn với đúng yêu cầu, dùng 1 lần, hết hạn 10 phút, bị huỷ ngay khi chạy;
  - **trần 2 USD/ngày, 20 USD/tháng** (Tuấn chốt; sửa trong UI); vượt trần thì không cấp mã;
  - chỉ một lệnh trả tiền chạy một lúc (khoá dùng chung giữa UI, CLI, MCP); lỗi thì không tự chạy lại;
  - lệnh lỗi sau khi đã gửi vẫn tính tiền ước tính vào sổ (phòng nhà cung cấp vẫn trừ).
- **Khoá API** lưu ở `%APPDATA%\SAMI\providers.json`, mã hoá DPAPI (chỉ tài khoản Windows này giải được). UI và API chỉ trả "đã đặt / chưa". Có thể dùng biến môi trường thay thế.
- **Sổ chi phí** `%APPDATA%\SAMI\ledger.jsonl`: mỗi lệnh một dòng (ước tính, thực tế nếu nhà cung cấp báo, người xác nhận).
- **Meta cho mọi file:** `<file>.meta.json` ghi provider, model, prompt, tham số, chi phí, giấy phép (tên, link, ghi công, dùng thương mại được không), nguồn, tác giả, sha256. Mặc định lưu vào `SAMI_Library/assets/<kind>/<provider>/` (URI `lib:`), hoặc vào `public/<img|video|audio>/<provider>/` của dự án.
- **Tab "Nguồn & AI"** trong trình soạn: tìm stock có ảnh thu nhỏ và nút Lấy, tạo bằng AI (Ước tính → nút Xác nhận chạy), khoá API, trần chi phí, sổ chi phí, địa chỉ cổng cục bộ.
- **CLI** `node providers/cli.mjs list | stock | fetch | estimate | gen | ingest | ledger`.
- **MCP server `sami-media`** (`providers/mcp.mjs`, đã đăng ký cấp user): `list_providers`, `search_stock`, `fetch_stock`, `estimate`, `generate` (cần `confirm_token`), `ingest_file`, `library_search`, `ledger`. Mã xác nhận không bao giờ lộ qua `ledger`.
- Skill `sami-motion-studio`: thêm `references/providers.md`; bảng chọn việc trỏ tới đó.

### Thay đổi
- `server/paths.mjs`: `USERDATA` đổi được qua `SAMI_USERDATA` (dùng cho selftest).
- `server/assets.mjs`: danh sách tài nguyên dự án bỏ qua file `.meta.json`.
- Thêm gói `@modelcontextprotocol/sdk@1.32.1` (ghim phiên bản).

### Đã kiểm
- `npm run check`: 14 mục mới cho gateway (adapter giả lập, thư mục tạm, không mạng): không mã bị từ chối, mã sai yêu cầu bị từ chối, mã dùng lại bị từ chối, vượt trần bị chặn, lỗi vẫn tính tiền và không chạy lại, thiếu khoá thì không cấp mã, meta đủ trường, lọc giấy phép Wikimedia.
- Stock thật: Wikimedia "pho bo" → ảnh CC0 có đủ tác giả, link, giấy phép; lấy trong UI vào dự án thử.
- edge-tts tiếng Việt và SFX tổng hợp chạy thật.
- MCP qua client SDK: đủ 8 tool; `generate` không mã báo lỗi; có mã thì chạy.
- **Chưa kiểm với dịch vụ trả tiền thật** (chờ Tuấn nhập khoá và OK lệnh đầu tiên) và **chưa chạy lượt ChatGPT web 5 ảnh** (chờ Tuấn có mặt).

### File chính
- **Mới:** `providers/{gateway, config, ledger, tokens, net, pricing, cli, mcp, selftest}.mjs`, `providers/adapters/{stock, local, elevenlabs, images, web, mock}.mjs`, `providers/recipes/*.md`, `providers/workflows/README.md`, `docs/specs/v0.8-cong-ai.md`, `claude-code/skills/sami-motion-studio/references/providers.md`.
- **Sửa:** `server/{index, paths, assets, selftest}.mjs`, `ui/{app.js, index.html, style.css}`, `package.json`, `CLAUDE.md`, skill `sami-motion-studio`.

### Roll back
`git checkout v0.7.0`. Gỡ MCP: `claude mcp remove sami-media -s user`. Khoá, sổ chi phí trong `%APPDATA%\SAMI` và file đã tải vào thư viện vẫn giữ nguyên.

---

## [0.7.0] — 2026-10-08 — Carousel động (live carousel)
Lộ trình: v0.6 Nền móng ✅ → **v0.7 Carousel** → v0.8 Cổng AI → v0.9 Footage → v1.0

### Thêm
- **Dự án `type: "carousel"`**: mỗi slide là một MP4 lặp liền mạch, 1080×1350, 30 fps, có tiếng riêng. Slide viết bằng HTML (Hyperframes, `slides/<ID>.html`), dài theo ô nhịp 120 BPM (4, 6 hoặc 8 s).
  - Studio dùng như dự án thường: preview (slide nối tiếp, không crossfade), tab Chữ, nút tỉ lệ **4:5 Feed**.
  - Nút **Xuất** render cả bộ carousel. Mục "Xuất cả 3 tỉ lệ" được ẩn với dự án carousel.
  - Kết quả nằm ở `out/carousel/<thời điểm>/`:
    - `NN-<ID>.mp4`;
    - `covers/`: khung 0, cũng là ảnh bìa;
    - `seams/`: khung cuối và khung đầu đặt cạnh nhau, kèm điểm PSNR để soát đường nối vòng;
    - `contact-sheet.jpg`;
    - `qa.json`;
    - `preview.html`: khung điện thoại vuốt như Instagram, có nút bật tiếng.
- **Âm thanh tự tổng hợp** `lib/py/sami_audio.py` (chỉ cần numpy, không mất phí, không lo giấy phép):
  - 18 SFX: pop, click, tick, whoosh / in / out, riser, impact, chime, ping, notification, boop, sparkle, typing, thump, swoosh_reverse, glitch, cash;
  - groove 120 BPM;
  - phần đuôi tiếng được gấp về đầu slide nên vòng lặp không bị khựng;
  - chuẩn −14 LUFS cho mọi slide, nên vuốt qua lại âm lượng không nhảy.
  - Ba chế độ: `groove`, `music` (một bài hát chạy tiếp qua các slide) và `sfx`. SFX đặt theo từng slide trong `scenes[].cues` (tên hiệu ứng, hoặc file `lib:`/dự án).
  - Dùng trực tiếp được: `python lib/py/sami_audio.py sfx whoosh out.wav`.
- **Bộ công cụ carousel `CX`** (`lib/hf/carousel.js` + `carousel.css`):
  - khung slide chuẩn: topbar series · 0N/0M, thanh tiến độ chạy liền qua cả carousel, nút Swipe tự ẩn ở slide cuối;
  - đường nhảy có nén/giãn (`X.path`), lưới chấm gợn sóng, hạt tất định, lò xo `kick/settle`, `X.wave` lặp an toàn, `X.fit`, `X.ready`;
  - 5 theme: sami, cream, tomato, forest, noir.
- **Mẫu `carousel-sami`**: 5 slide tiếng Đức về Google Maps cho nhà hàng (hook → 3 hebel → CTA bình luận "MAPS"). Chiếc ghim Maps đi xuyên các slide: ra phải ở slide trước, vào trái ở slide sau. Có ảnh bìa và đạt chuẩn mẫu.
- **Chế độ ảnh**: biến ảnh carousel đã thiết kế xong thành slide động.
  - `tools/carousel-new.mjs <dir> --images a.png b.png …` cắt giữa về 4:5 và tạo `slides/photo.html` (`lib/hf/photo-slide.html`).
  - Khung 0 giữ nguyên ảnh gốc. Chuyển động gồm: đẩy nhẹ kiểu thở (tuần hoàn), một vệt sáng quét qua đúng nhịp, hạt bay, rung nhẹ khi chạm nhịp.
  - Chỉnh theo từng slide trong `scenes[].photo`.
  - Bản gọn: chưa tách lớp chữ/bầu trời bằng OpenCV như mẫu tham khảo.
- `server/cli-carousel.mjs <dir> [render|audio|stills] [--only C01,C03] [--cpu]`.
- `tools/carousel-new.mjs`: tạo carousel mới theo chế độ motion (chép mẫu) hoặc chế độ ảnh.
- **Skill mới `sami-carousel`** (SKILL.md, `references/cx-api.md`, `references/design.md`). Skill `sami-motion-studio` chuyển việc carousel sang skill này.
- Mục tiêu mẫu mới: "Mẹo / kiến thức (carousel)".
- Selftest kiểm thêm: dàn dựng slide carousel (loop chính xác, toolkit, tiếng) và bộ tổng hợp âm thanh Python.

### Thay đổi
- Cảnh trong dự án carousel không có khoảng chồng 8 khung và không crossfade, thời gian slide bắt đầu đúng 0 (`sceneSpan`, `Main.tsx`).
- `window.SAMI` có thêm `slide {index, count, start, total}`, `carousel {series, handle, theme, swipe}` và `photo`.
- Bộ kiểm tra hiểu dự án carousel:
  - bắt buộc có 4:5;
  - slide phải là HTML;
  - nhắc khi độ dài slide không tròn ô nhịp, khi SFX quá sát cuối slide, hoặc thiếu file nhạc/SFX;
  - tối đa 20 slide, mỗi slide tối đa 60 s;
  - nhận diện timeline qua `X.loop`.

### Đã kiểm
- Mẫu `carousel-sami`: 5 slide × 6 s render trong 3 phút 24 giây (GTX 1070, NVENC).
  - Mọi slide 1080×1350, có tiếng.
  - Đường nối vòng 28,8–38,8 dB.
  - Âm lượng sau chuẩn hoá −14,4 LUFS.
- Xuất qua hàng đợi Studio (1 slide): "QA đạt".
- Chế độ ảnh: khung 0 trùng ảnh gốc, khung giữa có chuyển động.
- `npm run check` đạt.

### File chính
- **Mới:** `server/carousel.mjs`, `server/cli-carousel.mjs`, `lib/hf/{carousel.js, carousel.css, photo-slide.html}`, `lib/py/sami_audio.py`, `tools/carousel-new.mjs`, `templates/carousel-sami/`, `claude-code/skills/sami-carousel/`.
- **Sửa:** `server/{hf, render, validate, template, selftest}.mjs`, `engine/src/core/Main.tsx`, `ui/app.js`, skill `sami-motion-studio`, `CLAUDE.md`, docs.

### Ghi chú
Mẫu tham khảo (live-carousel, carousel-studio) không có giấy phép cho phần mã, nên toàn bộ phần carousel được **viết lại** theo cùng ý tưởng, không chép mã. Studio vì vậy giữ được giấy phép sạch khi sau này giao cho khách.

### Roll back
`git checkout v0.6.0`. Dự án carousel sẽ mở như video thường (slide nối nhau có crossfade). `out/carousel/` vẫn giữ nguyên.

---

## [0.6.0] — 2026-10-08 — Nền móng: engine kép Hyperframes + Remotion · thư viện dùng chung · ffmpeg đầy đủ · dọn bộ nhớ
Spec: `docs/specs/v0.6-nen-mong.md` · Lộ trình: v0.6 Nền móng → v0.7 Carousel động → v0.8 Cổng AI → v0.9 Footage → v1.0

### Thêm
- **Engine Hyperframes (HTML + CSS + GSAP) — mặc định cho cảnh mới.** Một cảnh trong `project.json → scenes[]` có thể là:
  - Remotion (`scenes/<ID>.tsx`, như cũ);
  - HTML: `{"engine": "hyperframes", "src": "hf/<ID>.html"}`.

  Hai loại cảnh trộn được trong một video. Crossfade, tiêu đề, phụ đề, ảnh chèn, âm thanh và grain/vignette vẫn do Studio dựng chung cho mọi cảnh.
  - **Preview:** cảnh HTML chạy trực tiếp trong khung xem (iframe được tua theo từng khung).
    - Sửa file trong `hf/` chỉ nạp lại cảnh đó, không phải đóng gói lại.
    - Sửa chữ ở tab Chữ hiện ngay, kể cả khi chưa lưu.
  - **Xuất:** mỗi cảnh HTML render một lần bằng CLI Hyperframes thành clip `public/_hf/<ID>_<tỉ lệ>_<fps>_<scale>x_<hash>.mp4`, rồi Remotion ghép như một cảnh bình thường.
    - Clip lưu theo hash nội dung, nên đổi nhạc, tiêu đề hay chữ của cảnh khác thì không render lại.
    - 4K render 2× cho 16:9, 9:16 và 1:1.
  - **Runtime `window.SAMI`** (`lib/hf/sami-hf.js` + `sami.css`):
    - chữ: `data-copy`, `SAMI.text/html` (`*tô màu*`, ` / ` xuống dòng);
    - thời gian: `SAMI.timeline()`, `SAMI.EASE` (một easing), `SAMI.beat(n)`;
    - hiệu ứng: `SAMI.arrive/leave/words/fit`;
    - bố cục theo tỉ lệ: `[data-ratio="9x16"]`, `SAMI.pick`, vùng an toàn;
    - màu brand qua biến CSS `--c-*`;
    - font và GSAP chạy cục bộ: `_fonts/<family>/<weight>.css`, `_gsap/…`.
  - **Mẫu mới `hf-starter`:** 3 cảnh HTML, 3 tỉ lệ, gồm lưới, icon và vòng tròn vẽ bằng code (SVG stroke).
  - **Ảnh QA:** `cli-still` tự chụp nhanh khung nằm trong cảnh HTML (`hyperframes snapshot`). Thêm `--exact` để render clip rồi ghép đúng như bản xuất.
  - Route mới: `/hfp/<id>/<cảnh>/<tỉ lệ>/…` (preview cảnh HTML) và `POST /api/hf/lint` (bộ kiểm tra của Hyperframes). Thêm sự kiện SSE `hf`.
  - Danh sách cảnh có nhãn **HTML** cho cảnh Hyperframes.
- **Thư viện dùng chung `Z:\SAMI_Video\SAMI_Library`** (đổi được qua `SAMI_LIBRARY` hoặc `.studio/config.json → libraryRoot`).
  - Nội dung: `assets/<sfx|music|voice|img|video|lottie|fonts|luts|masks>/…`, mỗi file kèm `.meta.json` (giấy phép, nguồn, prompt, thời lượng…), cùng `brands/` và `index.json`.
  - Dự án tham chiếu bằng `lib:<kind>/<file>`. Studio **hardlink** file cần dùng vào `public/_lib/`: không tốn thêm dung lượng, và chạy được cả preview lẫn xuất khi không có mạng.
  - Route mới: `/api/library/search`, `/api/library/reindex`, `/api/library/brands`, `/lib/…`.
  - Đã nạp sẵn 68 SFX (8 SFX engine và 60 SFX ElevenLabs của series 2610, có prompt và ghi chú giấy phép) bằng `tools/lib-seed.mjs`.
- **ffmpeg đầy đủ** trong `vendor/ffmpeg` (`tools/get-ffmpeg.mjs`, kiểm SHA-256). Bản mặc định là BtbN 8.1: có NVENC, QSV, AMF, VP9, ProRes, GIF, xfade, loudnorm.
  - Bản gyan 8.1 trở lên đòi driver NVIDIA ≥ 610, mà GTX 10xx dừng ở nhánh 580, nên không dùng được.
  - Bản đầy đủ dùng cho Hyperframes, ghép, chuẩn âm lượng và footage sau này. Remotion vẫn dùng ffmpeg đi kèm của nó.
- **Cache chung `Z:\SAMI_Video\.sami-cache`** gồm `bundles/`, `preview/`, `hf-stage/`, `hf-frames/`, `tmp/`. TEMP của tiến trình con trỏ về đây, nên ổ C không còn phình.
- **Công cụ** (đều mặc định chạy thử, `--apply` mới làm thật):
  - `tools/cleanup.mjs`: lần đầu báo ~13 GB có thể giải phóng.
  - `tools/migrate.mjs`: đổi `_engine` và media trùng thành hardlink (~268 MB trên 31 dự án), xoá bản skill cũ chép trong dự án, liệt kê helper `.tsx` bị chép trùng; chụp điểm neo trước khi động vào dự án.
  - `tools/install-skills.mjs`: cài skill từ `claude-code/skills/` vào `~/.claude/skills`, có sao lưu bản cũ.
- **Skill `sami-motion-studio` viết lại**: bộ điều hướng gồm bảng chọn engine và 9 tài liệu `references/` (hyperframes, remotion, mixing, schema, library, audio-sfx, assets, qa, render-ffmpeg).
- **Selftest**: thêm kiểm tra Hyperframes, dàn dựng cảnh HTML, mẫu `hf-starter`, URI `lib:`, hardlink và dò khả năng mã hoá.

### Thay đổi
- **Dò khả năng ffmpeg bất đồng bộ**, chạy một lần rồi lưu vào `.studio/caps.json`, nên server không còn bị chặn. Từng bộ mã hoá được thử lần lượt, vì card dân dụng giới hạn số phiên NVENC.
- Ghép đoạn và ffprobe khi xuất đổi sang chạy bất đồng bộ.
- Bundle render chuyển từ `%TEMP%` (ổ C) sang `.sami-cache/bundles`.
- Preview chuyển sang `.sami-cache/preview` và chỉ giữ 3 bản mới nhất mỗi dự án (bản 0.5 giữ mãi, ~1,3 GB).
- `public/_engine` dùng hardlink thay vì chép (~5,5 MB × mỗi dự án).
- Alias `@lib` → `lib/remotion` cho code TSX dùng chung, có cả khi preview lẫn khi xuất.
- `media()` (`@engine/core/media`) cho file người dùng chọn, hiểu cả `lib:…`. AudioTrack, Overlays và Photo đã chuyển sang dùng nó.
- Dự án chỉ gồm cảnh HTML không cần `scenes/index.ts` (bundler tự dùng danh sách rỗng).
- Không chép skill vào từng dự án nữa (chỉ một bản chung). Workflow vẫn đồng bộ như cũ.
- Bộ kiểm tra dự án hiểu cảnh HTML (thiếu file, thiếu `data-composition-id`, chưa có timeline, tải CDN, dùng `Math.random`/`Date`/rAF, warp) và URI `lib:`.
- Bộ kiểm tra mẫu chấp nhận bố cục theo tỉ lệ viết trong HTML. Ảnh bìa mẫu chụp được cả cảnh HTML.
- `project.json` có thêm trường tuỳ chọn: `schemaVersion`, `type`, `engine`, `scenes[].engine`, `scenes[].src`.

### Sửa lỗi
- **NVENC chưa bao giờ được dùng khi xuất** (0.2 đến 0.5). Phép thử cũ `-f lavfi nullsrc … -f null -` luôn lỗi với ffmpeg rút gọn của Remotion (thiếu lavfi, rawvideo, wrapped_avframe), nên Studio luôn chọn CPU.
  - Phép thử mới mã hoá một ảnh thật ra mp4, giống cách Remotion làm.
  - Kết quả trên GTX 1070: NVENC H.264/H.265 ✓.
- `/api/variants/save` trả 404 vì lệnh `return` nằm trong dòng comment. Bảng biến thể vẫn được lưu nhưng UI báo lỗi.
- Đường dẫn D:\ trong skill và workflow.

### Đã kiểm
- `npm run check` đạt toàn bộ.
- 12 ảnh tĩnh của 3 dự án v1 (V04, V23, 261001) giống hệt pixel trước và sau nâng cấp (PSNR ∞).
- Xuất trọn đường dự án từ mẫu `hf-starter`: 9:16 FHD, 3 cảnh HTML → clip → ghép → âm thanh −28,1 → −14,1 LUFS → NVENC H.264. Kết quả 421 khung, 14,03 s, đúng crossfade và bố cục dọc.
- Preview cảnh HTML trong Studio: tua đúng cảnh, sửa chữ chưa lưu hiện ngay.
- Tốc độ Hyperframes trên máy này: ~6 khung/giây ở 1080×1920 với 4 worker. Phần chậm là chụp khung bằng Chrome, không phải mã hoá.

### File chính
- **Mới:**
  - server: `server/hf.mjs`, `server/library.mjs`, `server/fslink.mjs`, `server/env.mjs`, `server/still.mjs`;
  - engine: `engine/src/core/HfScene.tsx`, `engine/src/core/media.ts`, `engine/src/core/emptyScenes.ts`;
  - runtime: `lib/hf/{sami-hf.js, sami.css, shim.js}`;
  - công cụ: `tools/{get-ffmpeg, cleanup, migrate, lib-seed, install-skills}.mjs`;
  - mẫu: `templates/hf-starter/`;
  - tài liệu: `docs/specs/v0.6-nen-mong.md`, `claude-code/skills/sami-motion-studio/references/*`.
- **Sửa:**
  - server: `server/{index, render, project, preview, ffmpeg, paths, validate, template, cli-still, selftest}.mjs`;
  - engine: `engine/src/core/{Main.tsx, types.ts, AudioTrack.tsx, Overlays.tsx}`, `engine/src/components/Brand.tsx`;
  - giao diện: `ui/app.js`, `ui/style.css`;
  - skill và workflow; `package.json`, với `hyperframes` 0.8.140 và `gsap` 3.15.0 ghim đúng phiên bản.

### Roll back
`git checkout v0.5.0` rồi `npm install`.
- Cảnh HTML (`engine: "hyperframes"`) sẽ hiện "Thiếu scene" ở bản cũ.
- Các trường mới và `public/_lib`, `public/_hf` vô hại và xoá được.
- Hardlink do `migrate.mjs` tạo vẫn là file bình thường với bản cũ.
- `vendor/` và `.sami-cache/` xoá được.

---

## [0.5.0] — 2026-10-03 — Làm việc nhóm · Biến thể hàng loạt từ CSV
Spec: `docs/specs/team-variants.md` · Hướng dẫn: `docs/HUONG_DAN_SU_DUNG.md` mục 11c (Biến thể), 11d (Nhóm)

### Thêm
- **Tab Biến thể** (CSV → nhiều video):
  - Nút **Tải CSV mẫu**: file `;`, UTF-8 có BOM để Excel đọc đúng dấu, có sẵn dòng mô tả từng ô chữ và dòng bản gốc.
  - Nút **Nhập CSV**: lưu vào `brief/variants.csv`, nên bảng cũng có trong Lịch sử.
  - **Bấm một dòng để xem thử** trên khung xem; không ghi gì vào dự án.
  - **▶ Xuất N video**: mỗi dòng × mỗi tỉ lệ thành một lượt render, lưu ở `out/variants/`.
  - Đã thử: 2 dòng (`;`, dấu VI/DE, `""`, xuống dòng trong ô, `;` trong tên) cho ra đúng 3 lượt render với chữ đúng; cột lạ được báo và bỏ qua.
- **Trạng thái dự án** Nháp / Chờ duyệt / Đã duyệt / Đã đăng: ô chọn trên thanh trên cùng, kèm badge ở trang Dự án. Khi chuyển sang **Đã duyệt / Đã đăng**, Studio tự đặt **mốc ★** trong Lịch sử.
- **Khoá dự án `.studio-lock`**: người thứ hai mở cùng dự án thấy cảnh báo "X đang mở trên máy Y từ …", và trang Dự án hiện 🔒.
  - Khoá không bị máy khác ghi đè.
  - Khoá được xoá khi đóng dự án hoặc tắt Studio, và tự hết hạn sau 3 phút.
- **Trang Dự án → Nhóm**: đặt tên người dùng, thư mục dự án mặc định, **thư mục mẫu dùng chung** (NAS/Drive).
  - Mẫu trong thư mục chung có nhãn "dùng chung".
  - "Lưu thành mẫu" và "Nhập mẫu" có thể ghi thẳng vào thư mục chung.
- `cli-still … --copy row.json` để xem ảnh tĩnh một biến thể.
- Selftest: thêm test `applyCopy` và test `tplDir`, gồm cả chặn đường dẫn thoát ra ngoài.

### Thay đổi
- `project.json` có thêm trường tuỳ chọn `status`, mặc định `draft`.
- Điểm neo ghi rõ người tạo, dạng `Studio · <tên>` hoặc `Claude Code · <user>`.
- Skill: thêm hướng dẫn về biến thể và `status`.

### File chính
Sửa: `server/index.mjs`, `server/template.mjs`, `server/render.mjs`, `server/cli-still.mjs`, `server/cli-snapshot.mjs`, `server/validate.mjs`, `server/selftest.mjs`, `engine/src/core/types.ts`, `ui/index.html`, `ui/app.js`, `ui/style.css`, skill, docs, `package.json`. Mới: `docs/specs/team-variants.md`.

### Roll back
`git checkout v0.4.0`. Trường `status` và file `brief/variants.csv` vô hại với bản cũ, chỉ bị bỏ qua. `.studio-lock` xoá được.

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
