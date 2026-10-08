# HAND-OFF — Nâng cấp SAMI Motion Studio (v0.6 → v1.0)

Cập nhật: 2026-10-08 (sau v0.8.3) · Người làm: Claude Code · Chủ dự án: Tuấn (CEO SAMI)

Đọc file này đầu tiên khi mở phiên mới. Trả lời Tuấn bằng tiếng Việt, ngắn gọn; viết "SAMI" in hoa; không dùng em-dash trong copy hiển thị.

---

## 1. Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Kế hoạch tổng (đã duyệt 2026-10-08) | `C:\Users\Tuan\.claude\plans\y-desktop-live-carousel-skill-zip-y-des-smooth-haven.md` |
| **v0.6.0 Nền móng** | ✅ commit `e7306a8` |
| **v0.7.0 Carousel động** | ✅ commit `88604e6` |
| **v0.8.0 Cổng AI** | ✅ commit trên cùng nhánh (xem `git log`); còn 2 phép thử cần Tuấn, mục 3 |
| **v0.8.1 Giao diện 0.7/0.8** | ✅ tạo carousel, Dùng ▾ + kéo thả, xoá dự án (Thùng rác), dọn lịch sử, thẻ phần cứng, `cli-render.mjs` (công tắc mặc định TẮT + `--request`), nút "Tạo bằng Claude Code". Xem CHANGELOG 0.8.1 |
| **v0.8.2 Chrome SAMI, mã hoá thật, ChatGPT script, Jev, tách sami-media** | ✅ (xem CHANGELOG 0.8.2, mục 3c). Còn chờ Tuấn: đăng nhập Chrome SAMI + một lượt ChatGPT thật, điền khoá Jev, cho phép xuất 3 s thử NVENC, OK để push gói `MCP-sami-media` |
| **v0.8.3 Khuôn + Dây chuyền** | ✅ 16 khuôn × 3 theme, 🧩 Khuôn trong Studio, dây chuyền promo / maps / menu, brand.json, sổ chi phí theo video (CHANGELOG 0.8.3, mục 3d). Tuấn bảo "triển khai, chưa push" (2026-10-08) |
| **v0.9.0 Footage / PiP / B-roll** | ✅ tracks.video (main / broll / pip / screen), tab Footage, proxy 540p, VFR → CFR, tiếng footage + hạ nhạc, preset xuất, khối vẽ bằng code, 18 khuôn (CHANGELOG 0.9.0, mục 4). **Chờ Tuấn cho phép xuất thử** 60 s (1 chính, 2 B-roll, 1 PiP, vỗ tay kiểm lệch tiếng ≤ 1 khung, RAM < 12 GB) |
| v1.0.0 Hoàn thiện | ⏳ **việc tiếp theo** (mục 5) |

- **Git:**
  - Nhánh `feat/v0.6-nen-mong` (tách từ `main` @ v0.5.0), working tree sạch sau commit 0.8.2.
  - **Chưa push, chưa tag, chưa tạo GitHub Release.** Tuấn chọn "chưa đẩy". Phải hỏi lại trước khi push.
  - `gh` đã đăng nhập tài khoản `tuansami`.
- **Chi tiết từng bản:** `CHANGELOG.md` mục 0.6.0, 0.7.0, 0.8.0. Spec: `docs/specs/v0.6-nen-mong.md`, `docs/specs/v0.8-cong-ai.md`. Lộ trình: `docs/KE_HOACH_PHAT_TRIEN.md`.
- **Skill đã cài** (nguồn: `claude-code/skills/`, cài bằng `node tools/install-skills.mjs --apply`):
  - `~/.claude/skills/sami-motion-studio`: router + 10 references (thêm `providers.md`);
  - `~/.claude/skills/sami-carousel`.
- **Memory:** `motion-studio-upgrade-2026-10.md` và `motion-studio-lives-on-z.md`.

## 2. Những gì đã có (để không làm lại)

### Đường dẫn
| Cái gì | Ở đâu |
|---|---|
| App | `Z:\SAMI_Video\SAMI_Motion_Studio`. Không dùng bản D:. Không tự bật server ở cổng 5178 (đó là của Tuấn). |
| Thư viện tài sản (ngoài git) | `Z:\SAMI_Video\SAMI_Library` (68 SFX, `index.json`). URI `lib:<kind>/<file>`. |
| Cache (xoá được) | `Z:\SAMI_Video\.sami-cache` |
| ffmpeg đầy đủ | `vendor/ffmpeg` = BtbN 8.1 (gitignore). Bản gyan ≥ 8.1 cần driver ≥ 610, GTX 1070 không lên được. |
| Gói ghim phiên bản | `hyperframes@0.8.140`, `gsap@3.15.0`. Python: `Y:\Python` có numpy 2.0.1, **không có** cv2/scipy. |

### Module đã viết
- **server:**
  - `hf.mjs`: stage cảnh HTML, clip cache `public/_hf`, snapshot, lint.
  - `library.mjs`: `lib:`, hardlink vào `public/_lib`, search, index.
  - `fslink.mjs`: hardlink, junction.
  - `env.mjs`: env cho tiến trình con (PATH có ffmpeg của vendor, TEMP trỏ về Z:, tắt telemetry của Hyperframes).
  - `still.mjs`: ảnh tĩnh cho cả hai engine.
  - `carousel.mjs` và `cli-carousel.mjs`.
  - `ffmpeg.mjs`: dò khả năng bất đồng bộ → `.studio/caps.json`. Phép thử NVENC = mã hoá một PNG thật.
- **engine:** `engine/src/core/HfScene.tsx` (iframe khi preview, OffthreadVideo khi xuất), `media.ts`, `emptyScenes.ts`, `Main.tsx` (chế độ carousel).
- **lib:** `lib/hf/{sami-hf.js, sami.css, shim.js, carousel.js, carousel.css, photo-slide.html}`, `lib/py/sami_audio.py`. Thư mục `lib/remotion/` hiện **trống**.
- **tools:** `get-ffmpeg`, `cleanup`, `migrate`, `lib-seed`, `install-skills`, `carousel-new`. Tất cả chạy thử trước, `--apply` mới làm thật.
- **templates:** `hf-starter` (3 cảnh HTML), `carousel-sami` (5 slide, tiếng Đức).
- **Đã chạy `migrate --apply` và `cleanup --apply`:** giải phóng 13,9 GB; 269 file media trùng thành hardlink; mọi dự án có điểm neo "Trước khi chuyển sang Studio 0.6".

### Lệch so với kế hoạch gốc (cố ý, có thể làm sau)
- **`engine/` chưa dời sang `engines/remotion/`.** Dời sẽ làm hỏng đường dẫn trong 29 dự án và template; lợi ích nhỏ.
- **`server/index.mjs` chưa tách thành router dạng bảng.** Route mới được thêm thẳng vào chuỗi `if`.
- **Hàng đợi render vẫn chạy tuần tự** (chưa có semaphore Chrome / ffmpeg / NVENC).
- **Còn chạy đồng bộ, chặn server:** `/api/audio/analyze` (analyzeMusic, spawnSync) và ffprobe trong `validate`.
- **Hook snapshot** vẫn để theo từng dự án (đường dẫn tuyệt đối tới app), không chuyển lên cấp user.
- **Dự án Hyperframes thuần** vẫn ghép bằng Remotion. Bản xuất không cần Remotion để dành cho v1.0.
- **Chế độ ảnh carousel là bản gọn.** Chưa tách lớp chữ / bầu trời bằng OpenCV, chưa cắt chủ thể.
- **17 nhóm helper `.tsx` chép trùng giữa các dự án** (liệt kê bằng `node tools/migrate.mjs`) chưa gom vào `lib/remotion`.

## 3. v0.8.0 Cổng AI (đã làm 2026-10-08)

Tuấn đã trả lời: làm cả 4 nhóm (stock + cục bộ → ElevenLabs → API ảnh → trình duyệt); khoá tự nhập trong UI; trần **2 USD/ngày, 20 USD/tháng**; đã cài `@modelcontextprotocol/sdk@1.32.1` và đăng ký MCP `sami-media` cấp user (`claude mcp get sami-media`).

- Code: `providers/` (gateway, config DPAPI, ledger, tokens, adapters, recipes, cli, mcp, selftest). Tab UI "Nguồn & AI". Chi tiết: CHANGELOG 0.8.0, spec `docs/specs/v0.8-cong-ai.md`, skill `references/providers.md`.
- Dữ liệu người dùng: `%APPDATA%\SAMI\{providers.json, ledger.jsonl, tokens.json, run.lock}`. Lúc bàn giao chưa có khoá nào, sổ trống.
- **Còn 2 phép thử chờ Tuấn:**
  1. Lệnh trả tiền thật đầu tiên: Tuấn nhập khoá (vd ElevenLabs) trong tab "Nguồn & AI", Claude `estimate`, Tuấn OK trong chat, rồi `generate`. Kiểm số `character-cost` ElevenLabs trả về khớp ước tính; model mặc định `eleven_v4` (nếu API báo sai model thì đổi mặc định ở `providers/adapters/elevenlabs.mjs`).
  2. Một lượt ChatGPT web 5 ảnh theo `providers/recipes/chatgpt-image.md` (Tuấn có mặt, đã đăng nhập Chrome).
- Giá trong `providers/pricing.mjs` là ước tính (2026-10); sửa không cần release qua `providers.json → opts.pricing`.
- Không có adapter Veo API (trần 2 USD/ngày không đủ); video AI đi qua Flow web.
- **Luật Tuấn (2026-10-08): tuyệt đối không tự render khi Tuấn chưa yêu cầu.** Kể cả khi kiểm thử tính năng: chỉ kiểm đường từ chối.
- Cài đặt xuất đã lưu của Tuấn đang là `gpu: "off"` (CPU) + H.265: đã báo Tuấn, không tự đổi.

## 3d. v0.8.3 ĐÃ LÀM (2026-10-08): khuôn + dây chuyền
- Đọc `claude-code/skills/sami-motion-studio/references/khuon.md` (cách dùng + cách viết khuôn mới) và spec `docs/specs/khuon-day-chuyen.md`.
- Khuôn: `lib/hf/khuon/<id>/`, kit `lib/hf/khuon/kit.{css,js}`, logic `server/khuon.mjs`, QA `node tools/khuon-thumbs.mjs --only <id> --theme paper` (bảng ảnh ở `.sami-cache/khuon-test/`). Dây chuyền: `lib/pipelines/*.mjs` + `server/cli-pipeline.mjs`.
- Bài học khi viết khuôn: `.k-layer` có `inset:0` nên phần tử định vị bằng right/width phải đặt `left:auto` hoặc bỏ class; góc nghiêng dùng thuộc tính CSS `rotate` (GSAP dùng `transform`); không dựng lại DOM trong callback `document.fonts.ready` (tween mất đích); một easing `S.EASE` cho mọi thứ.
- Còn có thể làm (Tuấn chưa yêu cầu): thêm khuôn tới 20 đến 30 (gợi ý: so sánh trước / sau, bản đồ có ghim nhiều điểm, đồng hồ đếm ngược, timeline các bước, bảng giá 3 gói, video nền + chữ khi có v0.9), dây chuyền webinar → short (cần v0.9), UI chạy dây chuyền trong Studio, nhạc nền mặc định trong `brands/sami/brand.json` (thư viện chưa có nhạc).

## 3c. v0.8.2 ĐÃ LÀM (2026-10-08): đọc trước khi đụng cổng AI

- **Mã cổng AI giờ ở gói riêng `Z:\SAMI_Video\MCP-sami-media`** (git riêng, nhánh `main`, đã commit cục bộ, **chưa push** lên `tuansami/MCP-sami-media`: chờ Tuấn xem thư mục và OK). Studio dùng qua `node_modules/sami-media` (junction tới thư mục đó). Sửa gateway / adapter / runner ở gói, chạy `npm test` ở gói, rồi `npm run check` ở Studio. **Không tạo lại `providers/` trong Studio** (selftest sẽ báo lỗi).
- MCP `sami-media` cấp user đã đăng ký lại: `node Z:/SAMI_Video/MCP-sami-media/bin/mcp.mjs`, env `SAMI_STUDIO`.
- **Chrome SAMI**: hồ sơ `Z:\SAMI_Video\.chrome-sami` đã tạo (lần mở thử 2026-10-08, cửa sổ để mở cho Tuấn đăng nhập ChatGPT / Google / Suno). CDP `127.0.0.1:9333`. Thư mục tải `Z:\SAMI_Video\.sami-cache\downloads`.
- **ChatGPT 2026-10 đã đổi DOM**: không còn `#prompt-textarea`; khi chưa đăng nhập ô nhập là `textarea` "Ask ChatGPT". Kịch bản dò ô nhập theo nhiều cách. **Phần chờ ảnh / lấy ảnh (`REPLY_STATE` trong `src/runners/chatgpt.mjs`) chưa chạy trên trang đã đăng nhập**: lượt thật đầu tiên có thể phải sửa selector (`data-message-author-role`, nút stop). Thử khi Tuấn có mặt, đã đăng nhập, đồng ý gửi.
- **Jev**: `.env` còn thiếu `TEXT_MODEL_API_KEY` (đã kiểm chỉ tên biến, không đọc giá trị). Jev tắt mặc định; bật bằng `providers.json → opts["chatgpt-web"].jev = true` sau khi thử.
- **Claude runner**: model Sonnet. Không bỏ được CLAUDE.md: `claude --bare` bỏ CLAUDE.md nhưng chỉ nhận `ANTHROPIC_API_KEY` (Tuấn dùng đăng nhập gói, không có khoá API) nên chưa dùng.
- **Bộ mã hoá thật**: `server/ffmpeg.mjs → probeEncoder()`; render ghi `j.encoderReal` + `.studio/renders.jsonl`. NVENC thật chưa thử (cần Tuấn cho phép xuất 3 s; cài đặt của Tuấn vẫn `gpu: off`, chưa đổi).

## 3b. Kế hoạch v0.8.2 (đã làm, giữ để tra), sau đó Khuôn + Dây chuyền, rồi v0.9

### v0.8.2: việc cụ thể (✅ xong, chi tiết ở 3c và CHANGELOG 0.8.2)
1. **Chrome SAMI riêng cho tự động hoá** (Tuấn chọn):
   - Hồ sơ `Z:\SAMI_Video\.chrome-sami` (ngoài git), mở bằng `chrome.exe --remote-debugging-port=<cổng cố định, vd 9333> --user-data-dir=Z:\SAMI_Video\.chrome-sami`. Hồ sơ không phải mặc định nên Chrome **không hỏi Allow** mỗi lần kết nối.
   - Trước lần mở đầu, ghi `Default/Preferences`: `download.default_directory = Z:\SAMI_Video\.sami-cache\downloads`, `download.prompt_for_download = false`, `savefile.default_directory` cùng chỗ. Mỗi phiên còn gọi CDP `Browser.setDownloadBehavior {behavior: 'allow', downloadPath}` cho chắc.
   - browser-harness nối vào bằng biến `BU_CDP_URL=http://127.0.0.1:<cổng>` (đã kiểm: `browser_harness/daemon.py` đọc `BU_CDP_URL`/`BU_CDP_WS`). `providers/agent.mjs` đặt biến này trong `mcp.json` (`env`). MCP browser-harness cấp user (Chrome chính) giữ nguyên cho việc khác.
   - Studio: nút "Mở Chrome SAMI" (tab Nguồn & AI) + trạng thái đã đăng nhập ChatGPT / Gemini / Flow / Suno chưa. Tuấn đăng nhập một lần.
   - `cli.mjs downloads` đọc thư mục tải cố định; Claude/agent **không bao giờ** chọn thư mục tải (nguyên nhân hộp "Lưu ở đâu" ở lần thử 2026-10-08).
2. **Ghi bộ mã hoá thật** vào kết quả mỗi lượt xuất: ffprobe một đoạn (part) trước khi ghép (`stream=codec_name` + encoder), ghi "h264_nvenc" / "libx264" vào `j.encoder`. Cài đặt đã lưu của Tuấn là `gpu: off`: chỉ báo, không tự đổi. Chưa chạy được thử NVENC thật (cần Tuấn cho phép một lượt xuất 3 s).
3. **Kịch bản cố định cho ChatGPT** (0 token): `providers/runners/chatgpt.mjs` dùng CDP (browser-harness hoặc nối thẳng cổng Chrome SAMI): mở tab, dán prompt, gửi, chờ đủ ảnh, lấy ảnh (ưu tiên đọc `src` ảnh rồi tải bằng fetch trong trang có cookie, ghi file; nút Download là phương án 2), ingest kèm meta. Thất bại thì chuyển sang người chạy kế tiếp.
4. **Thử Jev** (`C:\Users\Tuan\tools\jev-ultrafast`, gói Python, cần `TYPESAFE_API_KEY` + `TEXT_MODEL_API_KEY` trong `.env` của nó, Tuấn kiểm đã điền chưa) với lượt ChatGPT. Tốt thì thứ tự chạy: **kịch bản cố định → Jev → Claude (`agent.mjs`, đổi sang Haiku/Sonnet, bỏ nạp CLAUDE.md nếu được)**. Jev không hỗ trợ tải lên, tab bật ra, iframe, canvas.
5. **Tách sami-media thành gói độc lập** (Tuấn chọn): `Z:\SAMI_Video\MCP-sami-media` → repo **private** `https://github.com/tuansami/MCP-sami-media` (đã tạo, đang trống).
   - Bỏ phụ thuộc vào Studio: tự có `paths` (USERDATA, LIBRARY, cache qua biến môi trường), phần index thư viện (`rebuildIndex`, `writeMeta`, `search`), `childEnv` tối giản; `synth-sfx` tìm `sami_audio.py` qua biến `SAMI_STUDIO` (không có thì báo không dùng được).
   - Studio dùng lại gói (`"sami-media": "file:../MCP-sami-media"` hoặc submodule), xoá bản trong `providers/`, một bản mã duy nhất. Đăng ký MCP trỏ sang gói mới.
   - README giải thích tường tận: sơ đồ luồng (Claude → MCP stdio → gateway → adapter → file + meta + sổ), từng file, dữ liệu ở đâu, luật chi phí/mã xác nhận, DPAPI, thêm adapter mới thế nào.
   - **Cho Tuấn xem thư mục trước, Tuấn OK mới push.**
6. Release 0.8.2: bump, CHANGELOG, `npm run check`, commit. Push / Release Studio vẫn chờ Tuấn.

### Sau 0.8.2: Khuôn + Dây chuyền (bài học Tuấn gửi 2026-10-08: "trả tiền nghĩ một lần")
- A. Thư viện **khuôn Hyperframes có tham số** (mọi chữ/ảnh/màu từ `project.json`), lấy từ cảnh đẹp nhất của V22, V23, case study; mục tiêu 20 đến 30 khuôn; nút **"Đổi khuôn"** giữ chữ, giọng, nhạc.
- B. **Dây chuyền dạng lệnh cố định** (Claude chỉ điền JSON): carousel từ ảnh (có), promo 30 s từ brief, video Google Maps, video thực đơn / ưu đãi, webinar → 5 short (cần v0.9).
- C. **Bộ nhận diện từng khách** `SAMI_Library/brands/<khách>/brand.json` (màu, font, logo, giọng, nhạc).
- D. **Kỷ luật phiên:** 1 video = 1 phiên; 1 bản Studio = 1 phiên; trạng thái trong file.
- E. **Chia model:** Opus cho kịch bản/storyboard; Sonnet cho dựng cảnh + trình duyệt; script/Haiku cho việc lặp.
- F. **Sổ chi phí theo video:** ghi cả phần Claude quy đổi (`total_cost_usd` của mỗi `claude -p`) vào ledger theo dự án.
- G. Tự động trình duyệt: kịch bản cố định → Jev → Claude.
Viết spec `docs/specs/khuon-day-chuyen.md`, Tuấn duyệt rồi mới làm. Sau đó v0.9 Footage.

## 4. v0.9.0 Footage / B-roll / PiP / trim (✅ ĐÃ LÀM 2026-10-08; kế hoạch gốc bên dưới để tra)
- Đọc `claude-code/skills/sami-motion-studio/references/footage.md` trước khi sửa. Code: `server/footage.mjs`, `engine/src/core/VideoTrack.tsx`, `AudioTrack.tsx` (FootageAudio + ducking), `Main.tsx` (MediaCtx, VideoTrack sau SceneStack, cảnh `blank`), `render.mjs` / `still.mjs` (`serveMedia` cho cả job), tab Footage trong `ui/app.js` (`tabVideo`).
- Khác kế hoạch: footage nằm trên một **lớp riêng phía trên cảnh** (không trộn vào cảnh); chữ trên footage = Titles. Không làm `libserve` riêng: `render.mjs` / `still.mjs` tự mở máy chủ cục bộ cổng ngẫu nhiên trong lúc chạy, nên Studio mở hay tắt đều xuất được. Preset chỉ gồm các định dạng đã có (h264, h265, ProRes); WebM VP9, GIF, chuỗi PNG, ProRes 4444 alpha để sau (cần xuất thử).
- Chưa thử thật (cần Tuấn cho phép xuất): phép thử 60 s + vỗ tay, RAM, NVENC; lượt xuất có footage dài (OffthreadVideo tải file gốc qua HTTP).

- **Nhập footage:** `media/` của dự án. Route `/api/media/import` → ffprobe → proxy NVENC 540p (`-g 15`) vào `media/.cache/proxy`.
  - Bản ghi màn hình VFR chuyển sang CFR 30.
  - Preview dùng proxy, xuất dùng file gốc.
- **Schema:** `tracks.video[] {id, src, in, out, at, speed, role: main|broll|pip|screen, fit, pip{x,y,w,r}, mask, volume, z}`.
- **Remotion:** `engine/src/core/VideoTrack.tsx` dùng `<OffthreadVideo startFrom endAt playbackRate>`, mask bằng SVG clipPath, gắn vào `Main.tsx` khi có `tracks.video`.
  - Footage **phục vụ qua HTTP**, không để trong `public/`, vì `renderBundle` chép cả `public/` vào bundle.
  - Studio server có sẵn khi xuất. CLI thì cần một `libserve` ở cổng ngẫu nhiên.
- **Hyperframes:** `<video data-start data-duration data-media-start>`, PiP và mask bằng CSS.
- **Âm thanh footage** đi vào mix của `AudioTrack` (ducking với nhạc).
- **Thêm:**
  - tìm B-roll bằng adapter stock video (v0.8);
  - khối "vẽ bằng code" trong `lib/hf/blocks/` (đường kẻ tự vẽ, biểu đồ, bản đồ, con trỏ, chuyển cảnh);
  - preset xuất `media/presets.mjs`: reels-9x16, yt-16x9, feed-4x5, square, webm-vp9, mov-prores, prores4444-alpha, gif, png-seq.
- **Kiểm tra:** video 60 s gồm 1 clip chính, 2 B-roll và 1 PiP; âm thanh lệch hình ≤ 1 khung (thử bằng tiếng vỗ tay); RAM < 12 GB.

## 5. v1.0.0
- **Xuất Hyperframes thuần, không cần Remotion** (để đóng gói cho khách, tránh giấy phép Remotion khi công ty > 3 người):
  - tiêu đề, phụ đề, ảnh chèn, grain/vignette dựng bằng HTML;
  - âm thanh mix bằng ffmpeg.
- Tách router `index.mjs`; hàng đợi semaphore; chuyển nốt các lệnh đồng bộ sang bất đồng bộ.
- Gom 17 helper TSX vào `lib/remotion`.
- Chế độ ảnh carousel bản đầy đủ: OpenCV tách lớp; cần cài `opencv-python-headless`, phải hỏi trước.
- Cập nhật tài liệu `docs/HUONG_DAN_SU_DUNG.md`; template Hyperframes theo ngành.
- Khi phân phối cho khách: đổi ffmpeg sang bản BtbN **LGPL** (`node tools/get-ffmpeg.mjs --lgpl --force`).

## 6. Mẹo kỹ thuật (đã vấp, đừng vấp lại)
- **Sửa file có dấu `\` hoặc regex:** dùng tool Edit. Heredoc Python hay làm hỏng escape.
  - Nếu buộc phải dùng Python, mở file với `open(p, encoding='utf8', newline='')`. Không có `newline=''` thì Python ghi CRLF, mà repo dùng LF.
  - Trước khi commit, đổi về LF: `sed -i 's/\r$//'` trên các file đã sửa.
- **Thử Studio:** dùng cấu hình `sami-studio` (cổng **5179**) trong `C:\Users\Tuan\.claude\sessions\draft-tuan\.claude\launch.json`.
  - Nếu phiên mới mở trong thư mục app, tạo `.claude/launch.json` (đã gitignore) với `cmd /c "set NO_OPEN=1&& set STUDIO_PORT=5179&& node server/index.mjs"`.
  - Tạo dự án thử ở scratchpad, không ở `projects/`. Xong thì xoá mục đó khỏi `.studio/settings.json → recent`.
- **Khung Browser bị ẩn** thì `requestAnimationFrame` đứng, Player không chạy. Kiểm tra bằng `S.playerApi.seek(f)` rồi chụp màn hình.
- **Hyperframes:**
  - `snapshot` ghi `frame-NN-at-<t>s.png` và `contact-sheet.jpg`;
  - luôn thêm `--describe false` (nếu không nó gọi Gemini, tốn tiền);
  - đích của junction phải là đường dẫn tuyệt đối;
  - CLI tìm ffmpeg trên PATH (do `env.mjs` đặt).
- **NVENC trên card dân dụng** giới hạn số phiên mã hoá: dò từng bộ mã hoá một, không chạy song song.
- **Kiểm tra pixel dự án v1:** ảnh gốc ở `scratchpad/base/` của phiên trước (có thể đã mất). Cách làm: dùng `cli-still` trước và sau, rồi so PSNR bằng ffmpeg.
- **Skill:** sửa trong `claude-code/skills/…` rồi `node tools/install-skills.mjs --apply`. Không sửa trực tiếp `~/.claude/skills`.

## 7. Lệnh hay dùng
```bash
cd /z/SAMI_Video/SAMI_Motion_Studio
npm run check                                              # selftest
node server/cli-validate.mjs <dự án>
node server/cli-still.mjs <dự án> out/qa/x.jpg 30,120 9:16 [--exact]
node server/cli-carousel.mjs <dự án> [render|audio|stills] [--only C01]
node tools/cleanup.mjs            # chạy thử; --apply để xoá
node tools/migrate.mjs            # chạy thử; --apply
node tools/carousel-new.mjs <thư mục> --name "…" [--images a.png b.png]
python lib/py/sami_audio.py list
```
