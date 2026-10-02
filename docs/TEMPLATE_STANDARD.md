# Chuẩn Template SAMI Motion Studio — v1

> Một template = **một thư mục dự án mẫu** mà người không biết code chỉ cần thay chữ, ảnh, màu, nhạc là ra video đạt chuẩn cả 3 tỉ lệ. Mọi mẫu vào thư viện phải qua bộ kiểm tra `node server/cli-template.mjs check templates/<id>` (hoặc nút **Kiểm tra mẫu** trong Studio).

---

## 1. Cấu trúc thư mục (bắt buộc)

```
templates/<id>/                 id: chữ thường-không-dấu, vd  restaurant-khai-truong
├─ template.json                ← "hồ sơ" của mẫu (mục 2)
├─ project.json                 ← dữ liệu mặc định: cảnh, chữ, tiêu đề, âm thanh, màu
├─ scenes/                      ← code cảnh (Remotion + engine Studio)
│  ├─ index.ts                  ← export const REG = {S01, S02, …}
│  └─ S01.tsx …
├─ public/
│  ├─ img/placeholder_*.jpg     ← CHỈ ảnh minh hoạ trung tính / ảnh có bản quyền dùng lại được
│  ├─ audio/                    ← (tuỳ chọn) nhạc có giấy phép dùng lại
│  └─ lottie/                   ← (tuỳ chọn) Lottie JSON có giấy phép
├─ preview/
│  ├─ thumb_16x9.jpg            ← ảnh bìa (tự tạo bằng lệnh thumbs)
│  ├─ thumb_9x16.jpg
│  └─ thumb_1x1.jpg
└─ README.md                    ← khi nào dùng, lưu ý, ví dụ nội dung
```

Không được có: `out/`, `brief/`, `node_modules/`, `.claude/`, `public/_engine/`, ảnh/logo/số liệu **thật của khách**.

## 2. template.json

```jsonc
{
  "id": "restaurant-khai-truong",
  "name": "Nhà hàng – Khai trương",
  "version": "1.0.0",                      // tăng khi sửa mẫu
  "studio": ">=0.2.0",                     // phiên bản Studio tối thiểu
  "category": "restaurant",                // restaurant | nail | spa | hotel | agency | generic
  "goal": ["khai-truong", "uu-dai"],       // khai-truong | menu-moi | uu-dai | tuyen-dung | review | gioi-thieu | su-kien
  "description": "30 giây, 6 cảnh: hook → món đặc trưng → không gian → ưu đãi khai trương → địa chỉ → CTA.",
  "formats": ["16:9", "9:16", "1:1"],      // PHẢI có bố cục riêng cho từng tỉ lệ ghi ở đây
  "duration": 30,                          // giây (tự đo khi kiểm tra)
  "bpm": 120,                              // lưới nhịp: 1 nhịp = 15 khung (30 fps)
  "languages": ["vi"],                     // ngôn ngữ chữ mẫu
  "slots": {"text": 18, "image": 4, "logo": 1},  // tự đếm khi kiểm tra
  "thumbFrame": 150,                       // khung (30 fps) dùng làm ảnh bìa
  "author": "SAMI Marketing Agency",
  "license": "internal",                   // internal | CC-BY-4.0 | MIT | …
  "tags": ["food", "warm", "premium"]
}
```

## 3. Tiêu chuẩn nội dung (✗ = không đạt, ⚠ = nên sửa)

| # | Tiêu chí | Mức |
|---|---|---|
| 1 | `cli-validate` không còn ✗ (timeline liền mạch, đủ tài nguyên, không Math.random/Date) | ✗ |
| 2 | **Mọi chữ hiện trên video** nằm trong `project.json → copy`, có `label` tiếng Việt mô tả VỊ TRÍ ("Tiêu đề lớn cảnh 1", không phải "S01_title") | ✗ |
| 3 | Mọi ảnh thay được là **ô ảnh** (`copy.<ID>_image` / `_logo`) — không hard-code đường dẫn ảnh trong code cảnh | ✗ |
| 4 | Bố cục riêng cho mỗi tỉ lệ khai trong `formats` (dùng `useFormat` / `usePick`), chữ không tràn / không bị che ở 9:16 (vùng an toàn: trên 10 %, dưới 15 %) | ✗ |
| 5 | Thời gian qua `useT()` / `useBaseFrame()` — **không** `useCurrentFrame()` trong cảnh (sai ở 24/60 fps) | ✗ |
| 6 | Một easing duy nhất (`tw` / `keys` / `arrive`), không spring, không CSS transition | ✗ |
| 7 | Màu lấy từ theme (`C.*`, `GRAD`) để đổi màu thương hiệu 1 chỗ là đổi cả video — hạn chế mã màu cứng | ⚠ |
| 8 | Điểm cắt cảnh trên lưới nhịp (15n+1); cảnh có `label` tiếng Việt | ⚠ |
| 9 | Thời gian đọc: 6–10 chữ ≥ 1,5 s · con số ≥ 2 s · thông điệp chính ≥ 3 s | ⚠ |
| 10 | Âm thanh chỉ qua `project.json → audio` (không `<Audio>` trong code cảnh); nhạc mẫu phải có giấy phép dùng lại | ✗ nếu nhạc không rõ nguồn |
| 11 | Không số liệu / giá / review bịa đặt trình bày như thật — chữ mẫu phải rõ là mẫu (vd "−20 %" + ghi chú "thay bằng ưu đãi thật") | ✗ |
| 12 | Không logo nền tảng (Google, Meta…), không tác phẩm của agency khác | ✗ |
| 13 | Có ảnh bìa 3 tỉ lệ trong `preview/` + README | ⚠ |
| 14 | Render thử 24 / 30 / 60 fps không lỗi; chữ tiếng Việt không mất dấu | ✗ |

## 4. Quy trình đưa mẫu vào thư viện

1. Làm video cho khách như bình thường (Studio + Claude Code).
2. Video đạt → **Giao diện → Lưu thành mẫu** (hoặc nhờ Claude Code: *"chuyển dự án này thành template theo docs/TEMPLATE_STANDARD.md"*).
3. **Thay ảnh/logo/số liệu thật của khách bằng ảnh minh hoạ** (Studio cảnh báo nếu phát hiện ảnh trong mẫu).
4. `node server/cli-template.mjs check templates/<id>` → sửa đến khi không còn ✗.
5. `node server/cli-template.mjs thumbs templates/<id>` → tạo ảnh bìa.
6. 1 người (motion lead) duyệt → mẫu xuất hiện trong thư viện "Tạo dự án mới".

## 5. Chia sẻ & nhập mẫu

- **Xuất mẫu** (nút *Xuất .zip* trong thư viện) → gửi file `.zip` cho đồng nghiệp / văn phòng khác.
- **Nhập mẫu**: *Trang Dự án → Nhập mẫu…* chọn thư mục hoặc file `.zip` → Studio kiểm tra chuẩn rồi thêm vào thư viện.
- Mẫu từ cộng đồng:
  | Nguồn | Dùng thế nào |
  |---|---|
  | **Lottie JSON** (LottieFiles…) | Dùng trực tiếp: tab **Ảnh chèn → + Lottie** |
  | **Dự án Remotion** (React/TSX trên GitHub, do Claude/Opus tạo) | Nhờ Claude Code chuyển sang chuẩn này: đổi `useCurrentFrame` → `useT`, chữ → `copy`, màu → theme, thêm bố cục 9:16/1:1 |
  | **HyperFrames** (HTML + GSAP, HeyGen) | Không chạy trực tiếp — dùng làm tham khảo, nhờ Claude Code viết lại thành cảnh Remotion |
  | **Skill / prompt** (SKILL.md) | Đọc để học cách làm; đưa quy tắc hay vào `docs/PROJECT_GUIDE.md` |
- Luôn kiểm tra **giấy phép** (license) của mẫu cộng đồng trước khi dùng cho khách trả tiền.
