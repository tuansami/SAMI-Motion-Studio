# SAMI Motion Studio — Kế hoạch phát triển

## 1. Mục tiêu kinh doanh (đo được)
Studio không phải "phần mềm dựng video". Nó là **dây chuyền sản xuất motion ad** cho ~50 khách hospitality của SAMI.

| KPI | Hiện tại (làm tay + Claude) | Mục tiêu sau GĐ 3 |
|---|---|---|
| Thời gian 1 video 30 s mới (từ tài nguyên → bản nháp) | 1–2 ngày | **≤ 3 giờ** |
| Thời gian 1 biến thể (đổi chữ/giá/ngôn ngữ/tỉ lệ) | 1–2 giờ | **≤ 10 phút, không cần dev** |
| Số bản xuất / 1 brief | 1 | **6–12** (3 tỉ lệ × 2–4 ngôn ngữ/ưu đãi) |
| Token Claude / lần sửa nhỏ | cao (đọc code) | **0** (sửa trong Studio) |

→ Dịch vụ bán được: *"Gói Motion Ads hàng tháng: 4 video × 3 tỉ lệ"* — biên lợi nhuận đến từ **template + biến thể**, không phải từ làm mới mỗi lần.

---

## 2. Kiến trúc hiện tại (GĐ 1 — đã xong)

```
SAMI_Motion_Studio/
├─ Start-Studio.bat        khởi động (cài lần đầu, mở trình duyệt)
├─ server/                 Node.js, chỉ chạy trên máy (127.0.0.1:5178)
│  ├─ index.mjs            API + phục vụ UI + theo dõi file (tự tải lại)
│  ├─ preview.mjs          esbuild đóng gói preview (~0,3 s)
│  ├─ render.mjs           hàng đợi render Remotion (CPU/GPU NVENC, scale 2K/4K, fps)
│  ├─ audio.mjs            phân tích nhịp (BPM, drop, final hit)
│  ├─ validate.mjs         kiểm tra dự án (tiếng Việt)
│  ├─ assets.mjs           nhập & phân loại tài nguyên
│  └─ cli-*.mjs            lệnh cho Claude Code: still (ảnh QA), validate, grid (nhịp nhạc)
├─ claude-code/            skill + workflow, tự chép vào .claude/ của mỗi dự án
├─ engine/                 lõi dùng chung mọi dự án
│  ├─ src/core/            Main (xếp cảnh + crossfade + warp), Titles, Subtitles, AudioTrack,
│  │                       format (16:9·9:16·1:1), timebase (24/30/60 fps), copy, fonts
│  ├─ src/components/      Scene, Text/Words, Devices, Icon, Brand (grain/vignette)
│  └─ preview/entry.tsx    Remotion Player cho UI
├─ ui/                     giao diện web (không cần build)
├─ templates/agency-promo/ mẫu 6 cảnh, responsive 3 tỉ lệ
├─ projects/               dự án (mỗi dự án = 1 thư mục độc lập, có thể để ở bất kỳ đâu)
└─ docs/                   hướng dẫn, kế hoạch, PROJECT_GUIDE cho Claude Code
```

**Nguyên tắc thiết kế then chốt**
1. **Dự án = dữ liệu (`project.json`) + code cảnh (`scenes/`)**. Người dùng chỉ đụng dữ liệu; Claude Code chỉ đụng code.
2. **Thời gian chuẩn 30 fps + warp** → đổi fps/thời lượng không phải làm lại animation.
3. **Một engine, nhiều dự án** → sửa lỗi/nâng cấp engine là mọi dự án hưởng.
4. Preview và render dùng **cùng một code** → thấy gì xuất nấy.

---

## 3. Lộ trình

### GĐ 1 — Web app local ✅ (bản này)
Chữ có tên · thời lượng + warp + khớp nhịp · preview 3 tỉ lệ · tiêu đề/phụ đề đầy đủ kiểu · âm thanh 3 chế độ + phân tích nhịp · xuất FHD/2K/4K, 24/30/60, H.264/H.265/ProRes, CPU threads, NVENC, ưu tiên, hàng đợi, xuất 3 tỉ lệ · tạo dự án từ thư mục tài nguyên · tự tải lại khi Claude Code sửa.

### GĐ 1.5 — v0.2 ✅ (sau phản hồi dùng thật đầu tiên)
Render chống treo (chia đoạn ~15 s, mỗi đoạn 1 tiến trình, watchdog tự thử lại, Huỷ/Dừng tất cả tắt hẳn, **Tiếp tục** sau lỗi/tắt máy) · sửa phát hiện NVENC + nút Chẩn đoán GPU · ước tính dung lượng · tab **Ảnh chèn** (ảnh/logo/watermark/12 sticker chỉ dẫn/Lottie, kéo thả trên khung xem) · **Thư viện mẫu** + chuẩn mẫu v1 + Lưu thành mẫu / Kiểm tra / Nhập–Xuất .zip.

### Nâng cấp toàn diện 2026-10 (Tuấn duyệt 2026-10-08) — v0.6 → v1.0
| Bản | Nội dung | Trạng thái |
|---|---|---|
| **0.6 Nền móng** | Engine kép (Hyperframes HTML/GSAP mặc định cho cảnh mới + Remotion), thư viện `SAMI_Library` + `lib:` hardlink, ffmpeg đầy đủ (vendor), cache chung `.sami-cache`, dọn bộ nhớ, chuyển dự án cũ, skill viết lại, sửa NVENC | ✅ 2026-10-08 |
| **0.7 Carousel động** | Dự án `type: "carousel"` 1080×1350, mỗi slide 1 MP4 lặp 4/6/8 s trên lưới 120 BPM; port live-carousel (LC/PH toolkit, prep_photo, lc_audio, QA seam/frame0/contact sheet), trang vuốt kiểu Instagram, skill `sami-carousel` | ✅ 2026-10-08 (tự viết lại, không chép mã mẫu; chế độ ảnh bản gọn) |
| **0.8 Cổng AI** | `providers/`: adapter chung (ảnh, video, nhạc, SFX, giọng, stock), ước tính → mã xác nhận → tạo, trần chi phí, sổ chi phí, khoá DPAPI, MCP server, kịch bản browser-harness cho ChatGPT/Gemini/Flow/Suno; cổng AI cục bộ (ACE-Step, Stable Audio qua ComfyUI, Kokoro) | |
| **0.9 Footage** | Nhập video + proxy NVENC, cắt/tốc độ/B-roll/PiP/mask (`tracks.video`), bản ghi màn hình VFR→CFR, SFX Python, khối "vẽ bằng code" | |
| **1.0** | Xuất Hyperframes thuần (không Remotion) cho đóng gói khách, preset nền tảng, tài liệu | |

### GĐ 2 — Dùng thật 2–3 tuần, rồi củng cố (ưu tiên cao)
| # | Tính năng | Giá trị | Công |
|---|---|---|---|
| 2.1 | **Brand Kit** theo khách (logo, màu, font, CTA, WhatsApp, địa chỉ) lưu 1 lần, áp cho mọi video của khách | Nhất quán, giảm nhập lại | S |
| 2.2 | ✅ (v0.5.0: tab Biến thể, CSV → hàng đợi, out/variants/) **Biến thể hàng loạt**: bảng (CSV/Sheet) → mỗi dòng 1 video (ngôn ngữ VI/DE/EN, món, giá, ưu đãi) × 3 tỉ lệ | **Nhân sản lượng** — lõi của gói tháng | M |
| 2.3 | ✅ (v0.4.0: chuẩn −14 LUFS / −1 dBTP khi xuất) **Mix âm thanh tự động khi xuất** (ghép lớp → chuẩn −14 LUFS, −1 dBTP) | Không phải mix tay, âm lượng đều trên mọi nền tảng | S |
| 2.4 | **Preset nền tảng**: Reels/TikTok (9:16, vùng an toàn), YouTube, Meta Ads 1:1/4:5, Google Ads 16:9 | Không nhầm thông số | S |
| 2.5 | ✅ (v0.4.0: review.html + contact sheet + bản 540p + so sánh điểm neo) **Contact sheet & link duyệt**: xuất ảnh lưới 1 khung/cảnh + bản nháp nhẹ để gửi khách | Duyệt nhanh, ít vòng sửa | S |
| 2.7 | ✅ **Làm việc nhóm** (v0.5.0): trạng thái Nháp/Chờ duyệt/Đã duyệt/Đã đăng (+ mốc ★ tự động), khoá dự án `.studio-lock`, thư mục mẫu dùng chung | Cả nhóm dùng chung không giẫm chân | S |
| 2.6 | ✅ **Lịch sử phiên bản** (v0.3.0): điểm neo trước mỗi lượt chat AI, khi mở và khi Lưu; khôi phục toàn bộ hoặc từng file, kể cả media | An toàn khi nhiều người và AI cùng sửa | S |

### GĐ 3 — Đóng gói .exe (Electron) + thư viện
| # | Tính năng | Ghi chú |
|---|---|---|
| 3.1 | **Ứng dụng Windows .exe** (Electron): cài 1 click, kèm sẵn Node + Chromium, icon, tự cập nhật | Giữ nguyên server + UI hiện tại → rủi ro thấp |
| 3.2 | **Nội dung thư viện mẫu** theo ngành: nhà hàng, nail, spa, khách sạn — mỗi ngành 3–5 mẫu (khai trương, menu mới, ưu đãi, tuyển dụng, review). Khung thư viện + chuẩn đã có ở v0.2 | Tài sản tăng giá trị theo thời gian |
| 3.3 | Kéo-thả **đổi kích thước/xoay** trên khung xem (di chuyển đã có ở v0.2) | Dễ dùng hơn thanh trượt |
| 3.4 | **Timeline nhiều lớp** (kéo mép tiêu đề/SFX/cảnh) | Tốc độ chỉnh |
| 3.5 | **Auto-reframe** 16:9 → 9:16 bằng điểm nhấn (focal point) cho ảnh/video thật | Bớt công bố cục dọc |

### GĐ 4 — AI trong dây chuyền (khi GĐ 2–3 ổn định)
| # | Tính năng | Ghi chú |
|---|---|---|
| 4.1 | **Phụ đề tự động** (ElevenLabs Scribe / Whisper) cho video có lời | Tốn phí API — bật theo dự án |
| 4.2 | **Voice-over AI** tiếng Việt/Đức từ kịch bản | Cân nhắc brand: nhiều khách thích không lời |
| 4.3 | **Nhạc AI** 120 BPM theo độ dài + tự tìm drop | Đã có quy trình tay; tự động hoá |
| 4.4 | **Ảnh món AI / nâng cấp ảnh** (khớp dịch vụ Food Photography AI) | Chỉ dùng ảnh khách duyệt; ghi rõ ảnh AI |
| 4.5 | **"Brief → storyboard"** trong Studio (gọi Claude, đưa bảng cảnh để duyệt) | Rút ngắn bước 1–2 |

### Không nên làm (ít nhất đến GĐ 4)
- Trình dựng tự do kiểu After Effects — đốt thời gian, cạnh tranh sai sân. Lợi thế SAMI là **template chuẩn ngành + tốc độ biến thể**.
- Render trên cloud — máy RTX tại văn phòng rẻ và nhanh hơn ở quy mô 50 khách.
- Nhiều người dùng / đăng nhập — chưa cần khi chỉ 1–3 người vận hành.

---

## 4. Rủi ro & quyết định cần CEO chốt

| Vấn đề | Đề xuất |
|---|---|
| **Giấy phép Remotion**: miễn phí cho cá nhân/công ty ≤ 3 nhân sự; công ty lớn hơn cần *Company License* | Kiểm tra số nhân sự SAMI và điều khoản mới nhất tại remotion.pro trước khi dùng thương mại rộng |
| Ai là "chủ" template? | 1 người (designer/motion lead) duyệt mọi template mới trước khi vào thư viện |
| Phạm vi GĐ 2 | Chọn tối đa **3 tính năng** sau 2 tuần dùng thật — đề xuất 2.1 Brand Kit, 2.2 Biến thể hàng loạt, 2.3 Mix tự động |
| Định giá gói Motion Ads | Tính theo **số biến thể**, không theo giờ — Studio làm biến thể gần như miễn phí |
| Khoá GPU "80 %" | Không khả thi kỹ thuật ở mọi công cụ render; dùng NVENC + số luồng + ưu tiên (đã có) |

---

## 5. Cách phát triển tiếp (cho Claude Code)
- Mở thư mục `SAMI_Motion_Studio` bằng Claude Code → đọc `CLAUDE.md`.
- Mỗi tính năng: viết spec ngắn trong `docs/specs/<ten>.md` → duyệt → code → test bằng `node server/cli-still.mjs` và mở Studio.
- Không phá tương thích `project.json`: thêm trường mới phải có mặc định; tăng `version` trong `package.json`.
- **Phát hành**: mỗi bản thêm một mục vào `CHANGELOG.md`, commit, `git tag vX.Y.Z`, push lên GitHub `tuansami/SAMI-Motion-Studio`, rồi `gh release create vX.Y.Z` với nội dung lấy từ mục CHANGELOG. Muốn roll back thì `git checkout vX.Y.Z`.
- `npm run check` (selftest) phải đạt trước khi phát hành.
