# SAMI Motion Studio — Hướng dẫn sử dụng

> Phiên bản 0.4 (giai đoạn 1: web app chạy trên máy). Mới ở 0.4: **Gói duyệt khách**, **So sánh điểm neo**, **chuẩn âm lượng −14 LUFS**. Ở 0.3: **Lịch sử phiên bản / điểm neo** (mục 11b). Ở 0.2: render chống treo + tiếp tục, sửa GPU NVENC, tab **Ảnh chèn**, **Thư viện mẫu**. Dành cho đội SAMI: chỉnh chữ, thời lượng, tiêu đề, phụ đề, âm thanh và xuất video mà **không cần biết code**. Phần code (vẽ cảnh mới) do Claude Code làm theo tài nguyên bạn đưa vào.

>
> **Làm việc theo nhóm / với Claude:** đọc `docs/QUY_TRINH_LAM_VIEC.md` (quy trình chuẩn, cổng duyệt, câu lệnh mẫu, cách tiết kiệm token).
---

## 1. Studio là gì — khác gì SAMI-Render.bat?

| | SAMI Motion Kit (SAMI-Render.bat) | **SAMI Motion Studio** |
|---|---|---|
| Phạm vi | 1 video duy nhất | **Mọi dự án**, mỗi dự án 1 thư mục |
| Sửa chữ | Mở file `copy.ts` | Ô nhập có **tên tiếng Việt rõ ràng**, thấy kết quả ngay |
| Thời lượng cảnh | Sửa code `timeline.ts` | Nút **− / +** hoặc gõ số giây |
| Tỉ lệ | 16:9 | **16:9 · 9:16 · 1:1** (bố cục riêng cho từng tỉ lệ) |
| Chất lượng | 1080p 30fps | **Full HD / 2K / 4K · 24 / 30 / 60 fps** |
| Tiêu đề, phụ đề | Không | **Có** — chọn font, màu, cỡ, viền, nền, hiệu ứng |
| Render | CPU cố định | Chọn **số luồng CPU**, **GPU NVIDIA**, mức ưu tiên, hàng đợi |

Kit cũ vẫn dùng được bình thường; Studio là bản nâng cấp nằm ở thư mục riêng. Video "Website nhà hàng 66s" đã được chuyển sẵn vào Studio (`projects/sami-website-nha-hang`).

---

## 2. Cài đặt & khởi động

1. Cài **Node.js bản LTS** (nếu máy chưa có): https://nodejs.org → Next liên tục.
2. Chép cả thư mục `SAMI_Motion_Studio` vào ổ đĩa có nhiều dung lượng trống (ví dụ `D:\SAMI_Video\SAMI_Motion_Studio`). Không đặt trong OneDrive/Google Drive đang đồng bộ (render sẽ chậm và dễ lỗi).
3. Nhấp đúp **`Start-Studio.bat`**.
   - Lần đầu: tự cài thư viện (2–5 phút, cần Internet).
   - Sau đó trình duyệt tự mở **http://localhost:5178**.
4. **Giữ cửa sổ đen mở** trong khi dùng. Đóng cửa sổ = tắt Studio (video đang render sẽ dừng).

> Mẹo: tạo shortcut của `Start-Studio.bat` ra Desktop. Nên dùng Chrome hoặc Edge.

---

## 3. Màn hình "Dự án"

**Dự án gần đây** — bấm thẻ để mở.

**Mở thư mục dự án…** — chọn thư mục có file `project.json` (hoặc dán đường dẫn rồi bấm *Mở*).

**Tạo dự án mới**

| Ô | Ý nghĩa |
|---|---|
| Tên dự án | Tên hiển thị + tên thư mục (bỏ dấu tự động) |
| Khách hàng | Để quản lý |
| Mẫu (template) | Khung video có sẵn. Hiện có **Agency promo** (6 cảnh, 29 s, đủ 16:9 / 9:16 / 1:1) |
| Lưu trong thư mục | Nơi tạo thư mục dự án (mặc định `SAMI_Motion_Studio\projects`) |
| Thư mục tài nguyên của khách | *Tuỳ chọn.* Studio tự chép và phân loại: ảnh → `public/img`, video → `public/video`, nhạc → `public/audio`, font → `public/fonts`, PDF/Word/guideline/srt → `brief/` |
| Màu chính / phụ | Màu gradient thương hiệu của khách |

Sau khi tạo, Studio mở ngay màn hình biên tập.

**Thư viện mẫu** (trên form Tạo dự án mới): lọc theo ngành, xem ảnh bìa 3 tỉ lệ, **Dùng mẫu này** · **Kiểm tra** (theo chuẩn mẫu) · **Xuất .zip** (gửi đồng nghiệp) · **⤓ Nhập mẫu…** (từ thư mục hoặc .zip). Tạo mẫu mới từ một video đã làm: tab **Giao diện → Lưu thành mẫu**. Tiêu chuẩn chi tiết: `docs/TEMPLATE_STANDARD.md` (link *Chuẩn mẫu*).

Dòng cuối trang cho biết cấu hình máy: số luồng CPU, có phát hiện **NVIDIA NVENC** không, ffmpeg.

---

## 4. Màn hình biên tập — bố cục

```
┌─────────────┬────────────────────────────────┬──────────────────────┐
│  CẢNH       │  [16:9][9:16][1:1]  ☑Tiêu đề…  │ Chữ│Tiêu đề│Phụ đề… │
│  S01 …  4s  │                                │                      │
│  S02 …  6s  │        KHUNG XEM TRƯỚC         │   bảng chỉnh sửa     │
│  …          │                                │   của tab đang chọn  │
│ Khớp nhịp   │  ▶ 0:12.3 / 1:06  ▮S01▮S02▮…   │                      │
└─────────────┴────────────────────────────────┴──────────────────────┘
```

### Thanh trên cùng
- **● Chưa lưu** — có thay đổi chưa ghi vào `project.json`.
- **↶ / ↷** — hoàn tác / làm lại (Ctrl+Z / Ctrl+Y), tối đa 80 bước.
- **Lưu** (Ctrl+S) — ghi file, đồng thời tự kiểm tra lỗi. Mỗi lần Lưu (tối đa 2 phút/lần) còn tạo một **điểm neo** trong tab **Lịch sử**.
- **Kiểm tra** — liệt kê ✓ đạt / ⚠ lưu ý / ✗ lỗi (thiếu ảnh, cảnh hở, nhạc ngắn hơn video, chữ sai cú pháp…). Có lỗi ✗ thì không cho render.
- **📁** — mở thư mục dự án trong Explorer.
- **Dự án** — về màn hình dự án.

Nếu lỡ đóng trình duyệt khi chưa lưu, lần mở sau Studio hỏi **khôi phục bản nháp**.

### Cột trái — Cảnh
- Bấm một cảnh → khung xem nhảy tới cảnh đó, tab *Chữ* hiện đúng chữ của cảnh đó.
- **− / +** = bớt / thêm **0,5 giây (1 nhịp nhạc 120 BPM)**. Có thể gõ số giây trực tiếp.
- Khi đổi thời lượng, animation của cảnh được **giãn/nén tự động** (không phải làm lại hiệu ứng), các cảnh sau tự dời theo.
- ☑ **Dời tiêu đề/SFX theo…** — tiêu đề, phụ đề, tiếng động nằm sau điểm cắt cũng dời theo (nên bật).
- **Khớp nhịp** — làm tròn mọi điểm cắt về đúng nhịp nhạc. Bấm sau khi đã chỉnh tay nhiều cảnh.

> ⚠ Nếu dự án đang dùng **file nhạc mix sẵn** (như video 66 s), đổi thời lượng không làm file nhạc dài/ngắn theo → xem mục 9.

### Giữa — Khung xem trước
- **16:9 Ngang / 9:16 Dọc / 1:1 Vuông** — đổi tỉ lệ xem. Nhãn **"Chế độ vừa khung"** = dự án chưa có bố cục riêng cho tỉ lệ này, Studio đặt bản 16:9 vào giữa khung (xem mục 12 để có bố cục riêng).
- Bật/tắt **Tiêu đề · Phụ đề · Âm thanh** để xem riêng từng lớp.
- **Chỉ xem cảnh đang chọn** — lặp lại riêng 1 cảnh khi tinh chỉnh.
- **▶** hoặc **phím cách** = phát/dừng. Kéo/bấm trên thanh tua để nhảy.
- Thanh tua: ô xám = cảnh, vạch **xanh** = tiêu đề, vạch **vàng** = tiếng động (SFX).

Xem trước chạy ngay trong trình duyệt, có thể hơi giật trên máy yếu — **bản xuất luôn mượt**.

---

## 5. Tab **Chữ** — sửa nội dung trên video

- Mỗi ô có **tên tiếng Việt** mô tả vị trí (VD: *"Tiêu đề lớn mở đầu"*, *"Chữ gõ trong ô tìm kiếm (tiếng Đức)"*). Gõ đến đâu, khung xem cập nhật đến đó.
- Cú pháp (ở ô có ghi chú hỗ trợ):
  - `*chữ*` → tô màu gradient/nhấn. VD: `Khách hàng / *đang đói.*`
  - ` / ` (có dấu cách hai bên) → xuống dòng.
- Ô ảnh/logo (VD *"Ảnh trong điện thoại"*) có danh sách chọn ảnh + nút **Tải ảnh…**.
- **Tên cảnh** chỉ để quản lý, không hiện trên video.
- **Tất cả chữ trong video** — xem toàn bộ để soát chính tả; bấm 1 dòng để nhảy tới cảnh.

> Quy tắc thời gian đọc: 6–10 chữ cần ≥ 1,5 s; con số ≥ 2 s; thông điệp chính ≥ 3 s. Chữ dài hơn → tăng thời lượng cảnh.

---

## 6. Tab **Tiêu đề** — chữ phủ lên video

Dùng cho: tiêu đề chương, chú thích, giá khuyến mãi, CTA, tên món…

1. Tua tới thời điểm muốn hiện → **＋ Thêm tiêu đề tại vị trí đang xem** (mặc định dài 2,5 s).
2. Sửa **Nội dung** (hỗ trợ `*nhấn*` và ` / `).
3. **Bắt đầu / Kết thúc** (giây) — nút **⌖** lấy thời điểm đang xem.
4. **Hiệu ứng vào**: Từng chữ trồi lên · Từng chữ hiện dần · Mờ dần · Bật (pop) · Trượt vào · Đánh máy · Karaoke · Nền highlight từng chữ · Không. **Hiệu ứng ra**: Mờ dần · Bay lên · Cắt.
5. **Kiểu chữ**: Font (Be Vietnam Pro, Inter, Montserrat, Roboto, Oswald, Nunito, Lora, Playfair Display, Cormorant, JetBrains Mono — đều hỗ trợ tiếng Việt), Độ đậm, Cỡ chữ (px, tính trên khung Full HD), Màu chữ, Màu nhấn, Căn lề, Giãn chữ, Giãn dòng, IN HOA, Nghiêng, Đổ bóng, Viền chữ (màu + độ dày), Nền hộp (màu, độ đậm, bo góc).
6. **Vị trí**: nút nhanh *Trên / Giữa / Dưới / Sát đáy* hoặc kéo X/Y (%). Vị trí tính theo % nên tự vừa cả 3 tỉ lệ.
7. **Chiều rộng tối đa** — chữ tự xuống dòng khi vượt.
8. **Chỉ hiện ở** 16:9 / 9:16 / 1:1 — VD tiêu đề chỉ cho bản dọc.
9. **Xoá** — góc phải khung sửa.

> Lưu ý Reels/TikTok (9:16): tránh 15 % dưới cùng và 10 % trên cùng (nút, caption của app che mất). Nút *Dưới* (82 %) là an toàn; *Sát đáy* chỉ dùng cho YouTube/16:9.

---

## 7. Tab **Ảnh chèn** — ảnh, logo, watermark, chỉ dẫn, Lottie

| Nút | Dùng cho |
|---|---|
| **＋ Ảnh / logo** | Ảnh bất kỳ, logo khách, ảnh món, QR code… hiện trong một khoảng thời gian |
| **＋ Watermark** | Logo mờ ở góc, **hiện suốt video** (mặc định góc dưới phải, độ đậm 35 %, nằm trên cùng) |
| **＋ Chỉ dẫn** | Hình vẽ vector đổi màu được, có hiệu ứng **vẽ nét**: mũi tên thẳng/cong, vòng khoanh, gạch chân, chạm/bấm, tick, X, sao, tim, vuốt lên, lấp lánh, ghim vị trí |
| **＋ Lottie** | Animation `.json` tải từ LottieFiles.com (biểu tượng động, confetti, sticker…) |

**Chỉnh một lớp ảnh**
1. Chọn file (danh sách ảnh trong dự án) hoặc **Tải lên…** — logo/watermark nên dùng **PNG hoặc SVG nền trong suốt**.
2. **Thời gian**: bắt đầu / kết thúc (nút ⌖ lấy thời điểm đang xem) hoặc ☑ *Hiện suốt video*.
3. **Vị trí**: **kéo chấm xanh trên khung xem**, hoặc nháy đúp vào khung xem để đặt nhanh, hoặc bấm lưới 9 ô (↖ ↑ ↗ …), hoặc kéo X/Y.
4. **Kích thước** (px trên khung Full HD, tính theo cạnh ngắn → logo giữ đúng cỡ ở cả 16:9, 9:16, 1:1), **Độ đậm**, **Xoay**, **Bo góc**, **Đổ bóng**, **Lật ngang**, **Nhịp đập** (phập phồng theo nhịp nhạc).
5. **Hiệu ứng vào**: Mờ dần · Bật · Trồi lên · Trượt · Thu nhỏ vào · Vẽ nét (chỉ dẫn) · Không. **Ra**: Mờ dần / Cắt.
6. **Lớp**: *Dưới tiêu đề* (mặc định) hoặc *Trên cùng* (watermark). **Chỉ hiện ở** 16:9 / 9:16 / 1:1.
7. **Nhân bản** để làm nhiều mũi tên giống nhau; **Xoá**.

> Mẹo chỉ dẫn: mũi tên + vòng khoanh màu mint vào nút "Đặt bàn", "Chỉ đường" trên ảnh chụp website/Maps → người xem biết bấm vào đâu. Lottie: chỉ dùng file có giấy phép thương mại (LottieFiles ghi rõ "Free for commercial use" hay không).

## 8. Tab **Phụ đề**

- ☑ **Bật phụ đề**.
- **Nhập .srt…** — file phụ đề từ CapCut, Premiere, Whisper, ElevenLabs Scribe…
- **＋ Thêm dòng tại vị trí đang xem** để gõ tay. Mỗi dòng: bắt đầu, kết thúc (giây), nội dung, ▶ xem, ✕ xoá.
- **Hiệu ứng**: Karaoke (tô từng chữ theo thời gian) · Nền highlight từng chữ · Từng chữ hiện dần · Mờ dần · Bật · Không.
- **Kiểu chữ & vị trí**: giống tab Tiêu đề.

Phụ đề nằm trên cùng mọi lớp, có thể tắt khi xuất (tab Xuất video → *Kèm phụ đề*).

---

## 9. Tab **Âm thanh**

### Ba chế độ
| Chế độ | Khi nào dùng |
|---|---|
| **File mix sẵn** | Đã có 1 file hoàn chỉnh (nhạc + SFX), VD `audio/mix.wav` của video 66 s. Đổi thời lượng cảnh → phải mix lại. |
| **Ghép lớp (live)** | **Khuyên dùng cho dự án mới.** Studio tự ghép nhạc nền + tiếng động theo thời gian, đổi cảnh là âm thanh đi theo. |
| **Tắt tiếng** | Xuất bản không tiếng (để dựng tiếp ở app khác). |

### Nhạc nền (chế độ Ghép lớp)
- **File nhạc**: chọn hoặc **Tải lên…** (mp3/wav/m4a).
- **Âm lượng** (dB) và **Nhỏ dần cuối video** (giây).
- **Cắt/ghép nhạc**: mỗi dòng `bắt_đầu, kết_thúc, crossfade` (giây trong file gốc). VD nhạc dài 88 s mà video 66 s:
  ```
  0, 52.03, 0.02
  68.03, 77.03, 0.02
  ```
  = phát 0→52 s, rồi nhảy tới đoạn 68→77 s. Luôn cắt ở **đầu ô nhịp** (xem phân tích bên dưới) để không bị giật.

### ♫ Phân tích nhịp (thay cho mục 6 của SAMI-Render.bat — đã sửa lỗi)
Bấm để Studio đo file nhạc: **BPM**, phách đầu, **DROP** (điểm bùng nổ), **Break**, **FINAL HIT** (nốt kết), và biểu đồ năng lượng từng ô nhịp (cột xanh = có trống kick).
- Đặt cảnh "logo / thông điệp chính" bắt đầu đúng **DROP**, cảnh kết đúng **FINAL HIT**.
- "khung" = số khung hình ở 30 fps (chia 30 ra giây).

> Lỗi cũ của mục 6: bản ffmpeg đi kèm Remotion không có bộ ghi `f32le`. Studio đã đổi sang đọc WAV 16-bit nên chạy được trên mọi máy.

### Tiếng động (SFX)
- **＋ Thêm tại vị trí đang xem** → chọn âm (whoosh_a/b/c, pop, sub_hit, key_single, key_enter, typing_burst), âm lượng (dB), ghi chú, 🔊 nghe thử, ✕ xoá.
- Nguyên tắc SAMI: **whoosh chỉ ở chuyển chương**, typing ở đoạn mở, pop ở CTA, sub_hit ở logo cuối. Ít mà đắt.

---

## 10. Tab **Giao diện**

- **Màu thương hiệu**: màu chính/phụ (gradient), nền, nền sâu, chữ, chữ phụ, màu cảnh báo. *Về màu mặc định SAMI* để reset.
- **Hạt phim (grain)** và **Tối viền (vignette)** — lớp "chất điện ảnh" phủ toàn video. Khuyên dùng: grain 4–6 %, vignette 35–45 %.
- **Lưu thành mẫu (template)**: biến video đã làm thành mẫu dùng lại cho khách khác (tên, ngành, mục đích, mô tả) → Studio sao chép vào thư viện, tạo ảnh bìa, kiểm tra theo chuẩn và liệt kê việc cần sửa. ⚠ Thay ảnh/logo/số liệu thật của khách bằng ảnh minh hoạ trước khi chia sẻ.
- **Thông tin dự án**: tên, khách hàng, các tỉ lệ đã có bố cục riêng, đường dẫn thư mục.

---

## 11. Tab **Xuất video**

| Cài đặt | Lựa chọn | Gợi ý |
|---|---|---|
| **Tỉ lệ khung** | 16:9 Ngang · 9:16 Dọc · 1:1 Vuông | YouTube/web: 16:9 · Reels/TikTok/Shorts: 9:16 · Feed FB/IG: 1:1 |
| **Độ phân giải** | Full HD · 2K · 4K (hiện số px) | Mạng xã hội: Full HD là đủ. 4K cho màn hình lớn/khách yêu cầu. |
| **FPS** | 24 · 30 · 60 | 30 = chuẩn. 24 = cảm giác điện ảnh. 60 = siêu mượt nhưng render ≈ ×2 thời gian |
| **Định dạng** | MP4 H.264 · MP4 H.265 · ProRes .mov | H.264 để đăng/gửi khách. H.265 nhẹ hơn ~40 %. ProRes để dựng tiếp trong Premiere/DaVinci |
| **Chất lượng (CRF)** | 12–28 | 18 = rất đẹp (mặc định). 23–26 = bản nháp. Khi dùng GPU, Studio tự đặt bitrate |
| **Số luồng CPU** | 1 → tối đa của máy | Mặc định **8**. Máy 16 luồng muốn vừa render vừa làm việc: 8. Render qua đêm: tối đa |
| **Tăng tốc GPU** | Tự động · Tắt | Tự động: dùng NVIDIA NVENC để mã hoá + GPU vẽ hiệu ứng |
| **Mức ưu tiên** | Thấp · Bình thường · Cao | *Thấp* = máy vẫn mượt khi render |
| Kèm tiêu đề / phụ đề / âm thanh | bật/tắt | VD xuất bản không phụ đề cho khách tự thêm |
| **Tên file** | tuỳ ý | File lưu ở `<dự án>\out\Ten_9x16_FHD_30fps_<ngày_giờ>.mp4` |

**Các nút**
- **▶ Xuất video** — thêm vào hàng đợi.
- **Xuất cả 3 tỉ lệ** — 3 bản 16:9 + 9:16 + 1:1 cùng cài đặt, chạy lần lượt.
- **Chỉ cảnh Sxx** — xuất riêng cảnh đang chọn (duyệt nhanh 1 cảnh).
- **Preset: bản nháp nhanh** — Full HD, 30 fps, CRF 26.

**Dung lượng ước tính** hiện ngay dưới tên file (vàng = cảnh báo). Ví dụ ProRes 2K 60 fps ≈ 780 Mbps → 66 s ≈ 6,4 GB.

**Hàng đợi render**: thanh tiến độ, số khung đã vẽ / đã mã hoá, thời gian còn lại, bộ mã hoá đang dùng (GPU NVENC hay CPU), nút **Huỷ**, **Mở video**, **Mở thư mục out**, **Dọn xong**. Có thể tiếp tục chỉnh dự án khác khi đang render (mỗi bản render dùng dữ liệu **đã Lưu** tại lúc nó bắt đầu chạy — Studio tự lưu khi bấm Xuất).

### Gói duyệt khách (mới ở 0.4)
Dùng để khách hoặc sếp góp ý theo từng cảnh **mà không cần render video**.
1. Vào tab Xuất → **📋 Tạo gói duyệt**. Mất khoảng 2–4 phút, chạy nền.
2. Studio tạo `out/review/<ngày_giờ>/`, gồm:
   - **review.html**: chỉ 1 file, ảnh đã nhúng sẵn. Gửi qua Lark/Zalo/Email, mở được trên điện thoại.
   - **contact_16x9.jpg**, **contact_9x16.jpg**…: lưới ảnh mọi cảnh, đăng được vào nhóm chat.
3. Khách ghi góp ý vào ô của từng cảnh → bấm **Sao chép góp ý** → dán gửi lại.
4. Dán góp ý vào ô trong tab Xuất → **Lưu vào brief/GOP_Y.md**. Sau đó bảo Claude Code: *"sửa theo brief/GOP_Y.md"*.
5. Muốn khách xem cả chuyển động: bấm **＋ Bản xem 540p** để có file mp4 nhẹ, gửi nhanh.

Lưu ý: nhãn cảnh trong trang duyệt lấy từ tên cảnh của dự án (đang là tiếng Việt). Gửi khách Đức thì nên đặt tên cảnh dễ hiểu, hoặc chỉ gửi contact sheet.

### Chuẩn âm lượng −14 LUFS (mới ở 0.4)
Mặc định Studio tự đo bản mix và đưa về **−14 LUFS, đỉnh tối đa −1 dBTP**. Đây là mức Reels, TikTok và YouTube phát lại, nên video không bị nền tảng tự hạ nhỏ hay bị bé hơn video khác.
- Chọn −16 LUFS cho web; chọn Tắt nếu đã mix tay.
- Kết quả ghi trên lượt render, ví dụ "Âm lượng −16,3 → −14,0 LUFS".

### Render chống treo (mới ở 0.2)
- Video được chia thành **các đoạn ~15 giây**, mỗi đoạn render ở một tiến trình riêng. Studio (cửa sổ đen + trang web) **không bao giờ bị đơ theo** render.
- **Tự phát hiện treo**: 2,5 phút không có khung hình mới → Studio tự tắt tiến trình đó và **thử lại đoạn đó** với ít luồng hơn (tối đa 3 lần). Dòng vàng trong hàng đợi cho biết đang thử lại.
- **Huỷ** luôn có tác dụng ngay (tắt hẳn Chrome + ffmpeg của lượt đó). **⛔ Dừng tất cả** = huỷ mọi lượt và dọn sạch tiến trình render còn sót.
- **↻ Tiếp tục**: lượt bị lỗi / bị huỷ / bị ngắt (lỡ đóng cửa sổ đen, mất điện) giữ lại các đoạn đã xong → bấm Tiếp tục để làm nốt, không render lại từ đầu. Chỉ tiếp tục được khi **chưa sửa** dự án (sửa rồi thì phải xuất lại).
- Nếu trang web báo *"Mất kết nối với Studio"*: kiểm tra cửa sổ đen còn mở không. Đóng hẳn và mở lại `Start-Studio.bat` → các lượt đang chạy hiện trạng thái *Bị ngắt* → bấm **Tiếp tục**.

### GPU NVIDIA (NVENC)
- Bản 0.1 **luôn báo nhầm "không có NVENC"** do lỗi bài kiểm tra → GPU không bao giờ được dùng. Bản 0.2 đã sửa.
- Bấm **🩺 Chẩn đoán GPU** (tab Xuất) để xem: tên card + phiên bản driver, NVENC chạy được không, lý do và cách sửa (thường là **cập nhật driver NVIDIA** mới nhất rồi khởi động lại máy).
- **ProRes luôn mã hoá bằng CPU** — NVIDIA không có bộ mã hoá ProRes. Muốn GPU làm việc: chọn **MP4 H.264 / H.265**.
- GPU chỉ làm phần *mã hoá* (nén video). Phần *vẽ từng khung hình* vẫn do CPU + Chrome — nên số luồng CPU vẫn quyết định tốc độ chính.

### Về "GPU đến 80 %"
Không có công cụ render nào (Remotion, Premiere, DaVinci) cho phép khoá GPU đúng 80 %. Studio làm cách thực tế hơn:
- **Mã hoá bằng NVENC** — chip mã hoá riêng trên card NVIDIA, gần như không chiếm phần GPU dùng cho việc khác.
- **GPU vẽ hiệu ứng** (Chrome/ANGLE) — phần nặng nhất vẫn là vẽ từng khung; tải phụ thuộc số luồng.
- Điều tiết tải bằng **số luồng CPU** (ít luồng = ít khung vẽ song song = GPU/CPU nhẹ hơn) và **mức ưu tiên Thấp**.

Tham khảo: 8 luồng + Ưu tiên thấp ≈ máy vẫn làm việc được; tối đa luồng + Cao = nhanh nhất.

### Thời gian render tham khảo (video 60 s, Full HD 30 fps — ước tính thô, tuỳ độ nặng cảnh)
| Máy | Ước tính |
|---|---|
| 8 luồng, không NVENC | 8–15 phút |
| 16 luồng + RTX (NVENC) | 4–8 phút |
| 4K hoặc 60 fps | × 2–4 |

Luôn **xuất bản nháp / 1 cảnh trước**, duyệt xong mới xuất 4K.

---

## 11b. Tab **Lịch sử** — điểm neo, khôi phục bản cũ (mới ở 0.3)
Ctrl+Z chỉ nhớ các thao tác trong lúc đang mở Studio, và chỉ nhớ phần chữ/thời lượng. **Lịch sử** thì lưu **toàn bộ dự án** xuống đĩa: project.json, code cảnh, brief, ảnh, video, âm thanh, Lottie (trừ `out/`). Tắt máy, sang ngày hôm sau vẫn khôi phục được.

**Điểm neo tự tạo khi:**
| Lúc | Nhãn |
|---|---|
| Trước **mỗi lượt chat** với Claude Code trong thư mục dự án (nhãn là đầu câu bạn gõ) | AI |
| Mở dự án trong Studio | Mở |
| Bấm Lưu (tối đa 2 phút/lần) | Lưu |
| Tải lên / nhập file **trùng tên** với file đang có | Trước thay media |
| Ngay trước mỗi lần khôi phục, nên khôi phục cũng hoàn tác được | Trước khôi phục |

Nếu không có gì thay đổi so với điểm neo gần nhất thì Studio bỏ qua, không tạo điểm mới.

**Dùng:**
1. Bấm **🕘 Lịch sử** trên thanh trên cùng (hoặc tab Lịch sử).
2. Có bản ưng ý thì gõ tên rồi bấm **★ Đặt mốc ngay**, ví dụ "Bản nháp 1 gửi khách". Mốc ★ được giữ **vĩnh viễn**.
3. Muốn quay lại: chọn điểm neo → **Khôi phục…** → Studio liệt kê các file sẽ đổi →
   - **Khôi phục toàn bộ**, hoặc
   - tick từng mục rồi bấm **Chỉ khôi phục mục đã chọn**, ví dụ chỉ `scenes/S03.tsx` hoặc chỉ `public/audio/music.mp3`.
4. Lỡ khôi phục nhầm: điểm neo **Trước khôi phục** ở trên cùng chính là trạng thái vừa rồi. Khôi phục điểm đó là xong.

**Dung lượng:** file không đổi chỉ lưu một lần, nên một điểm neo thường chỉ tốn vài KB. Media chỉ tốn thêm khi thật sự thay file.
- Điểm tự động giữ 60 cái gần nhất, cộng mỗi ngày 1 cái trong 30 ngày.
- Mốc ★ không bao giờ bị dọn.
- Kho nằm ở `<dự án>/.history/`. **Đừng xoá thư mục này.** Copy cả thư mục dự án là mang theo luôn lịch sử.

**So sánh** (mới ở 0.4): bấm **So sánh** ở một điểm neo. Studio chụp ảnh từng cảnh của bản đó và của bản hiện tại, đặt cạnh nhau, chỉ hiện các cảnh có khác biệt. Mất khoảng 1–3 phút. Nhờ vậy bạn biết bản nào đẹp hơn trước khi khôi phục.

**Dòng lệnh** (Claude Code cũng dùng): `node <app>/server/cli-snapshot.mjs . list` · `… snapshot --label "…"` · `… restore <id> [file …]`

## 12. Làm video mới cùng Claude Code (quy trình chuẩn)

### Cấu trúc 1 thư mục dự án
```
du-an-cua-khach/
├─ project.json      ← MỌI THỨ bạn chỉnh trong Studio (chữ, thời lượng, tiêu đề, phụ đề, âm thanh, màu)
├─ scenes/           ← code từng cảnh (Claude Code viết) — S01.tsx, S02.tsx… + index.ts
├─ public/
│  ├─ img/  video/  audio/  fonts/   ← tài nguyên dùng trong video
│  └─ _engine/       ← Studio tự tạo, đừng sửa
├─ brief/            ← BRIEF.md + guideline, logo gốc, tài liệu khách, file mẫu
├─ out/              ← video đã xuất
└─ CLAUDE.md         ← quy tắc cho Claude Code (tự tạo)
   .claude/          ← skill + workflow SAMI cho Claude Code (tự tạo khi mở dự án)
```

### Các bước
1. **Studio → Tạo dự án mới**, chỉ tới thư mục tài nguyên của khách (ảnh món, video quán, logo SVG/PNG, nhạc, guideline PDF…).
2. Mở `brief/BRIEF.md`, điền: mục tiêu, khán giả, ngôn ngữ, thông điệp, CTA, độ dài, tỉ lệ cần có. **Brief càng rõ, video càng ít sửa.**
3. Mở **Claude Code** tại thư mục dự án, dán yêu cầu, ví dụ:
   > Đọc CLAUDE.md và brief/. Lên kịch bản + storyboard 30 s cho Reels 9:16 và bản 16:9, đưa tôi duyệt trước khi code. Dùng ảnh trong public/img, giữ màu thương hiệu trong brief.
   Video ≥ 4 cảnh: nói *"chạy workflow sami-motion-video, stage plan"* → duyệt → *"stage build"* (mỗi cảnh 1 designer + QA riêng).
4. Duyệt kịch bản → Claude Code viết cảnh trong `scenes/`. **Studio tự tải lại khung xem** mỗi khi file cảnh thay đổi — bạn xem ngay.
5. Tự chỉnh chữ / thời lượng / tiêu đề / phụ đề / âm thanh trong Studio → **Lưu**.
6. **Kiểm tra** → xuất bản nháp → gửi khách → xuất bản cuối (có thể cả 3 tỉ lệ).

### Muốn bố cục riêng cho 9:16 / 1:1 ở dự án cũ
Nhắn Claude Code: *"Thêm bố cục riêng 9:16 và 1:1 cho các cảnh (dùng useFormat/usePick), thêm '9:16','1:1' vào formats trong project.json."* Mẫu *Agency promo* đã làm sẵn kiểu này — dùng làm ví dụ.

### Sửa gì ở đâu (để đỡ tốn token)
| Muốn | Làm ở |
|---|---|
| Đổi chữ, thời lượng, tiêu đề, phụ đề, SFX, màu | **Studio** (không cần Claude) |
| Thêm/đổi hiệu ứng, bố cục, cảnh mới | Claude Code → `scenes/` |
| Ô chữ mới có tên rõ ràng | Claude Code thêm vào `project.json → copy` (có `label` tiếng Việt) |

---

## 13. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Cửa sổ đen báo "Chua cai Node.js" | Cài Node.js LTS, chạy lại |
| Trình duyệt không tự mở | Mở tay http://localhost:5178 |
| "port 5178 đang dùng" / không mở được | Studio đã chạy ở cửa sổ khác — dùng cửa sổ đó, hoặc đóng hết rồi mở lại |
| Khung xem báo **Lỗi code cảnh** (khung đỏ) | Code trong `scenes/` sai. Chép nội dung lỗi gửi Claude Code; sửa xong Studio tự tải lại |
| Khung xem trống / đen | Bấm ▶ hoặc tua; kiểm tra tab Chữ có ô ảnh bị "(không thấy)" |
| Không nghe tiếng khi xem | Bấm vào trang 1 lần (trình duyệt chặn tự phát âm thanh); kiểm tra ☑ Âm thanh |
| Render báo "Dự án còn lỗi" | Bấm **Kiểm tra**, sửa các dòng ✗ |
| Render đứng im ở một % , không huỷ được (bản 0.1) | Đóng hẳn cửa sổ đen → mở lại `Start-Studio.bat` (Studio tự dọn Chrome còn sót). Bản 0.2 không còn bị: có tự phát hiện treo, Huỷ tắt hẳn tiến trình, và nút Tiếp tục |
| Render lỗi "Ổ đĩa đầy" | ProRes/4K rất nặng — giải phóng ổ đĩa rồi bấm **Tiếp tục** |
| Render chậm | Tăng số luồng, chọn MP4 H.264 + GPU Tự động, dùng Full HD 30 fps cho bản nháp |
| Bộ mã hoá hiện "CPU" dù có card NVIDIA | Tab Xuất → **🩺 Chẩn đoán GPU** → làm theo hướng dẫn hiện ra (thường: cập nhật driver NVIDIA, tắt OBS/app ghi màn hình). Nhớ: ProRes luôn dùng CPU |
| Chữ tiếng Việt bị cắt dấu | Tăng *Giãn dòng* hoặc báo Claude Code (cảnh dùng mask) |
| Muốn quay về bản trước | Vài thao tác vừa rồi: Undo (Ctrl+Z). Bản hôm qua / trước khi AI sửa / bản đã ưng: **🕘 Lịch sử** → chọn điểm neo → Khôi phục (toàn bộ hoặc từng file). |

---

## 14. Phím tắt

| Phím | Tác dụng |
|---|---|
| **Phím cách** | Phát / dừng |
| **Ctrl + S** | Lưu |
| **Ctrl + Z / Ctrl + Y** | Hoàn tác / làm lại |

---

*Kế hoạch các phiên bản tiếp theo (ứng dụng .exe, thư viện mẫu, brand kit, xuất hàng loạt theo khách/ngôn ngữ…): xem `docs/KE_HOACH_PHAT_TRIEN.md`.*
