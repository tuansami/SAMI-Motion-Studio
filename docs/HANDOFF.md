# HAND-OFF — Nâng cấp SAMI Motion Studio (v0.6 → v1.0)

Cập nhật: 2026-10-08 · Người làm: Claude Code (phiên trước) · Chủ dự án: Tuấn (CEO SAMI)

Đọc file này đầu tiên khi mở phiên mới. Trả lời Tuấn bằng tiếng Việt, ngắn gọn; viết "SAMI" in hoa; không dùng em-dash trong copy hiển thị.

---

## 1. Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Kế hoạch tổng (đã duyệt 2026-10-08) | `C:\Users\Tuan\.claude\plans\y-desktop-live-carousel-skill-zip-y-des-smooth-haven.md` |
| **v0.6.0 Nền móng** | ✅ commit `e7306a8` |
| **v0.7.0 Carousel động** | ✅ commit `88604e6` |
| v0.8.0 Cổng AI | ⏳ **việc tiếp theo** (cần Tuấn trả lời mục 3) |
| v0.9.0 Footage / PiP / B-roll | chưa làm |
| v1.0.0 Hoàn thiện | chưa làm |

- **Git:**
  - Nhánh `feat/v0.6-nen-mong` (tách từ `main` @ v0.5.0), working tree sạch.
  - **Chưa push, chưa tag, chưa tạo GitHub Release.** Tuấn chọn "chưa đẩy". Phải hỏi lại trước khi push.
  - `gh` đã đăng nhập tài khoản `tuansami`.
- **Chi tiết từng bản:** `CHANGELOG.md` mục 0.6.0 và 0.7.0. Spec v0.6: `docs/specs/v0.6-nen-mong.md`. Lộ trình: `docs/KE_HOACH_PHAT_TRIEN.md`.
- **Skill đã cài** (nguồn: `claude-code/skills/`, cài bằng `node tools/install-skills.mjs --apply`):
  - `~/.claude/skills/sami-motion-studio`: router + 9 references;
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

## 3. Việc tiếp theo: v0.8.0 Cổng AI

### Cần Tuấn trả lời trước khi code (hỏi bằng AskUserQuestion, tối đa 4 câu)
1. **Ưu tiên đấu nối dịch vụ nào trước?** Tuấn có cả gói web lẫn khoá API trả tiền.
   - Ảnh: OpenAI gpt-image, Gemini nano banana, Flux (BFL), fal, Replicate.
   - Video: Veo / Flow, fal.
   - Nhạc: Suno (web), ElevenLabs music, ACE-Step (chạy cục bộ).
   - Giọng: ElevenLabs, edge-tts, Kokoro.
   - Stock: Pexels, Pixabay, Unsplash, Wikimedia.
2. **Khoá API:** Tuấn tự nhập trong UI Studio (lưu `%APPDATA%\SAMI\providers.json`, mã hoá DPAPI), hay muốn được hướng dẫn từng bước?
3. **Trần chi phí:** bao nhiêu USD/ngày và USD/tháng?
4. **Cài thêm:** cho phép cài `@modelcontextprotocol/sdk` (npm) và đăng ký MCP server `sami-media` vào Claude Code không?

### Luật cứng (từ memory và kế hoạch)
- **KHÔNG** tạo ảnh bằng connector ElevenLabs trừ khi Tuấn yêu cầu bằng chữ.
- Ưu tiên stock trước. Tạo ảnh hàng loạt thì dùng ChatGPT (5 ảnh một lệnh) hoặc Gemini nano banana qua trình duyệt, Tuấn tự đăng nhập.
- Mọi lệnh tốn tiền:
  - ước tính → mã xác nhận (dùng một lần, hết hạn 10 phút) → mới chạy;
  - **không** tự chạy lại khi lỗi;
  - **không** gửi nhiều yêu cầu cùng lúc.
- Tự động hoá trình duyệt (ChatGPT / Gemini / Flow / Suno) chỉ chạy khi Tuấn có mặt và đã đăng nhập. Không vượt CAPTCHA. Ưu tiên skill browser-harness (Chrome thật của Tuấn), rồi tới Jev, rồi Claude in Chrome.
- Mọi file sinh ra phải có `.meta.json` ghi prompt, model, chi phí và giấy phép.

### Thiết kế (theo kế hoạch đã duyệt)
```
providers/
  gateway.mjs      estimate → confirm token → run; trần ngày/tháng; ledger; ingest(file, meta) → SAMI_Library hoặc <project>/public
  config.mjs       %APPDATA%\SAMI\providers.json (DPAPI qua PowerShell ConvertTo/From-SecureString), env fallback; UI chỉ thấy set/unset
  ledger.mjs       %APPDATA%\SAMI\ledger.jsonl {ts, provider, model, est, actual, project, file, confirmedBy}
  adapters/<id>.mjs  {id, kind, caps, local?, web?, estimate(req), run(req,{signal,onProgress}) → {files, meta}}
  recipes/{chatgpt-image,gemini-image,flow-veo,suno}.md   kịch bản browser-harness → tải về → gateway.ingest
  cli.mjs          node providers/cli.mjs gen image --provider … --prompt … --n 4 [--confirm <token>]
  mcp.mjs          MCP stdio: list_providers, estimate, generate(confirm_token), search_stock, library_search, ledger
```
- Server: route `/api/providers/*`. UI: tab mới **"Nguồn & AI"**: tìm stock, sinh ảnh/nhạc/giọng, bảng chi phí từ ledger.
- **Thứ tự làm:**
  1. stock (Pexels, Pixabay: cần khoá miễn phí; Wikimedia: không cần khoá);
  2. edge-tts và synth (`lib/py/sami_audio.py`) cục bộ;
  3. ElevenLabs TTS / music (Tuấn đã lên gói Pro, model eleven_v4; giọng Anh Thu `FRYq6nepIbR0lbu7Lus4`, Ái Hạnh `pGapy9MNHCukzJtjavF0`);
  4. OpenAI / Gemini / Flux / fal / Replicate;
  5. kịch bản trình duyệt;
  6. cổng cục bộ: ACE-Step (HTTP API, MIT), Stable Audio Open qua ComfyUI, Kokoro-FastAPI. **Chỉ dựng cổng, không tải model.** Ghi chú: GTX 1070 có 8 GB VRAM. Tránh MusicGen và F5-TTS vì trọng số không cho dùng thương mại.
- **Kiểm tra:**
  - `generate` không kèm token thì bị từ chối;
  - adapter giả lập chạy trong selftest;
  - lấy một ảnh stock thật có đủ meta giấy phép;
  - một lệnh trả tiền chỉ chạy sau khi Tuấn OK trong chat;
  - một lượt ChatGPT web sinh 5 ảnh.
- **Release:** bump 0.8.0, viết CHANGELOG, `npm run check`, commit. Push / tag / Release **chỉ khi Tuấn đồng ý**.

## 4. v0.9.0 Footage / B-roll / PiP / trim
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
