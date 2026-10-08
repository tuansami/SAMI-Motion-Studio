# Chuẩn Template SAMI Motion Studio — v2 (Studio 1.2)

> Ba tầng, từ nhỏ đến lớn. Hiểu đúng tầng thì thêm mẫu mới rất nhanh:
>
> | Tầng | Là gì | Ở đâu | Ví dụ |
> |---|---|---|---|
> | **Khuôn** | Một cảnh dựng sẵn có chuyển động, không có chữ cứng | `lib/hf/khuon/<id>/` | Con số đếm lên, Tìm trên Google Maps, Polaroid |
> | **Phong cách** | Bộ nhận diện hình ảnh: màu, font, thẻ, kết cấu, cách chuyển động, âm thanh. Mặc lên **mọi** khuôn | `lib/hf/styles/<id>/` | Tư liệu cắt dán giấy, Bản tin dọc |
> | **Template** | Một dự án mẫu: chuỗi cảnh (thường là khuôn) + một phong cách + chữ / ảnh / nhạc mẫu | `templates/<id>/` | Nhà hàng: món mới + ưu đãi |
>
> Một phong cách mới = mọi khuôn (18 cái) tự có thêm một bộ áo mới, mọi template đổi sang được bằng một cú bấm (tab **Giao diện → Phong cách**).
> Mọi mẫu vào thư viện phải qua `node server/cli-template.mjs check templates/<id>` (hoặc nút **Kiểm tra** trong thư viện).

---

## 1. Engine: chỉ Hyperframes cho mẫu mới

- **Mẫu mới: Hyperframes** (HTML + CSS + JavaScript/GSAP). Đây chính là "javascript": không cần một loại thứ ba.
  Lợi: xuất được **không cần Remotion** (đóng gói cho khách, không vướng giấy phép), Claude viết nhanh, dùng chung khuôn và phong cách.
- **Remotion (.tsx)**: chỉ giữ cho dự án / mẫu cũ. Không làm mẫu Remotion mới. Mẫu cũ chạy bình thường, chuyển dần khi cần.
- Không cần chia thư viện mẫu theo engine: `template.json → engine` ghi `hyperframes` hoặc `remotion`, Studio tự biết.

## 2. Phong cách (style pack): chuẩn chung gồm gì

Mỗi phong cách phải trả lời đủ 8 câu hỏi. Ghi vào `style.json` + `style.css` (+ `style.js` nếu chuyển động khác mặc định).

| # | Thành phần | Quyết định | Ghi ở |
|---|---|---|---|
| 1 | **Màu** | nền, chữ, chữ phụ, màu nhấn 1–2, màu thẻ; tương phản đủ đọc trên điện thoại | `style.css` token `--k-bg --k-ink --k-sub --k-accent --k-accent2 --k-card` |
| 2 | **Chữ (typography)** | font tiêu đề, font chữ thường, font tay / phụ; độ đậm, chữ hoa hay thường, khoảng cách dòng (≥ 1,15 với font hẹp để dấu tiếng Việt không chồng) | `style.json → fonts` (tên họ font có trong `@fontsource`), `--k-head --k-ui --k-hand --k-weight --k-track` |
| 3 | **Thành phần** | thẻ, nút, nhãn, khung ảnh, con dấu, cách **nhấn chữ** (`*từ*`) | `style.css`: `.k-card .k-btn .k-chip .k-polaroid .k-stamp em.hl …` |
| 4 | **Kết cấu** | hạt phim, giấy, vạch quét, lưới; luôn **tĩnh** (không phụ thuộc thời gian) | `.k-stage::after`, ảnh trong `assets/` |
| 5 | **Chuyển động** | một easing cho cả phim, tốc độ (trang trọng = chậm, tin nóng = nhanh), cách chữ / thẻ vào và ra | `style.json → motion`, `style.js → SAMI.styleFx` |
| 6 | **Chuyển cảnh** | mặc định engine (mờ + nhoè chồng 16 khung); phong cách có thể gợi ý khác (cắt cứng, quét màu) | `style.json → motion.transition` |
| 7 | **Âm thanh** | bộ SFX gợi ý (3 đến 5 tiếng), kiểu nhạc | `style.json → sfx, music` |
| 8 | **Ảnh** | cách xử lý ảnh: polaroid, cắt xé, đen trắng, khung điện thoại; ảnh mẫu có giấy phép | `style.css` + `assets/` |

`base` = `paper | night | light`: phong cách mới mượn bố cục của một trong 3 base có sẵn (khuôn "giấy" xếp ảnh kiểu polaroid, "night" kiểu kính tối, "light" kiểu thẻ trắng) rồi chỉ ghi đè phần khác.

### Luật CSS của phong cách (kiểm tự động)
- Token đặt trong `[data-theme="<id>"] { … }`; luật thành phần bắt đầu bằng `html[data-theme="<id>"]` (để thắng luật base).
- Nhấn chữ có nền: đặt nền cho `em.hl, em.hl .w` kèm `em.hl:has(.w) { background: none }`, kẻo khối màu hiện trước khi chữ vào.
- **Không** `@keyframes`, `animation`, `transition` (video được tua từng khung, CSS animation không tua được). Chuyển động chỉ qua timeline GSAP.
- Không tải gì từ Internet (font, ảnh): font qua `@fontsource`, ảnh trong `assets/`.

### Tạo phong cách mới
```bash
node tools/style-new.mjs giay-cat-dan --name "Tư liệu cắt dán giấy" --base paper --head "Archivo Black" --accent "#D62828"
#   → lib/hf/styles/giay-cat-dan/{style.json, style.css, style.js, README.md (checklist 8 mục), assets/}
#   sửa style.css (và style.js nếu cần), rồi:
node tools/style-new.mjs giay-cat-dan --demo
#   → templates/style-giay-cat-dan/ : 8 khuôn tiêu biểu mặc phong cách này + ảnh bìa (chỉ chụp ảnh, không xuất video)
node tools/khuon-thumbs.mjs --theme giay-cat-dan --ratio 9:16
#   → bảng ảnh mọi khuôn trong phong cách mới (.sami-cache/khuon-test/<id>/sheet_9x16.jpg) để soát lỗi
```
Hoặc nói với Claude Code: *"tạo phong cách Phim tư liệu: nền đen, chữ serif, ảnh đen trắng, chuyển cảnh chậm"*. Claude làm đúng các bước trên.

### Khi phong cách cần cảnh mà khuôn chưa có
Ví dụ **3Blue1Brown** (công thức, đồ thị vẽ dần), **Bất động sản** (bản đồ khu vực, mặt bằng căn hộ), **Bài giảng hoạt hình** (nhân vật). Làm **khuôn mới** (chuẩn trong `claude-code/skills/sami-motion-studio/references/khuon.md`), không viết cảnh lẻ trong template: khuôn mới dùng lại được cho mọi phong cách.

## 3. Cấu trúc thư mục template (bắt buộc)

```
templates/<id>/                 id: chữ thường-không-dấu, vd  bds-vi-tri-du-an
├─ template.json                ← hồ sơ của mẫu (mục 4)
├─ project.json                 ← cảnh, chữ, tiêu đề, âm thanh, look.theme = phong cách
├─ hf/S01.html …                ← cảnh HTML (thường chép từ khuôn khi dựng)
├─ scenes/index.ts              ← để trống nếu không có cảnh Remotion
├─ public/img/placeholder_*.jpg ← CHỈ ảnh minh hoạ trung tính / có giấy phép (hoặc lib:img/… của thư viện)
├─ preview/thumb_9x16.jpg …     ← ảnh bìa (tự tạo)
└─ README.md                    ← khi nào dùng, lưu ý
```
Không được có: `out/`, `brief/`, `node_modules/`, `.claude/`, `public/_engine|_hf|_lib/`, ảnh / logo / số liệu **thật của khách**.

Cách nhanh nhất: dựng bằng dây chuyền `storyboard` (`server/cli-pipeline.mjs`) hoặc một công cụ như `tools/khuon-templates.mjs`, rồi thêm `template.json`.

## 4. template.json

```jsonc
{
  "id": "bds-vi-tri-du-an",
  "name": "Bất động sản: vị trí dự án",
  "version": "1.0.0",
  "studio": ">=1.2.0",
  "engine": "hyperframes",                  // hyperframes | remotion (mẫu cũ)
  "style": "ban-do-sang",                   // phong cách mặc định (lib/hf/styles/<id> hoặc night | paper | light)
  "category": "real-estate",                // restaurant | nail | spa | hotel | real-estate | education | news | science | agency | style | generic
  "goal": ["gioi-thieu"],                   // khai-truong | menu-moi | uu-dai | tuyen-dung | review | gioi-thieu | su-kien
  "description": "40 giây, 8 cảnh: hook → bản đồ khu vực → tiện ích quanh → mặt bằng → giá → CTA.",
  "formats": ["9:16", "16:9"],
  "duration": 40, "bpm": 120,
  "languages": ["de"],
  "khuon": ["hook-words", "map-route", "benefits-3", "stat-counter", "cta-contact", "endcard-logo"],
  "thumbFrame": 150,
  "author": "SAMI Marketing Agency", "license": "internal",
  "tags": ["real-estate", "map", "clean"]
}
```

## 5. Tiêu chuẩn nội dung (✗ = không đạt, ⚠ = nên sửa)

| # | Tiêu chí | Mức |
|---|---|---|
| 1 | `cli-validate` không còn ✗ (timeline liền mạch, đủ tài nguyên, không `Math.random` / `Date` / `requestAnimationFrame`) | ✗ |
| 2 | **Mọi chữ hiện trên video** nằm trong `project.json → copy`, có `label` tiếng Việt ≥ 4 ký tự mô tả vị trí | ✗ |
| 3 | Mọi ảnh thay được là **ô ảnh** (`<cảnh>_..._photo` / `_logo`), không hard-code đường dẫn ảnh trong cảnh | ✗ |
| 4 | Bố cục riêng cho mỗi tỉ lệ trong `formats` (`[data-ratio="9x16"] …`), chữ không tràn / không bị che ở 9:16 (vùng an toàn) | ✗ |
| 5 | Mọi chuyển động là hàm của timeline (GSAP, `SAMI.timeline()`); không CSS animation / transition | ✗ |
| 6 | Một easing cho cả phim (`SAMI.EASE` hoặc easing của phong cách) | ✗ |
| 7 | Màu / font lấy từ token (phong cách + `brand`), không mã màu cứng trong cảnh | ⚠ |
| 8 | Điểm cắt cảnh trên lưới nhịp (15n+1); cảnh có `label` tiếng Việt | ⚠ |
| 9 | Thời gian đọc: 6–10 chữ ≥ 1,5 s · con số ≥ 2 s · thông điệp chính ≥ 3 s | ⚠ |
| 10 | Âm thanh chỉ qua `project.json → audio`; nhạc mẫu có giấy phép | ✗ nếu nhạc không rõ nguồn |
| 11 | Không số liệu / giá / review bịa trình bày như thật: chữ mẫu ghi rõ là mẫu | ✗ |
| 12 | Không logo nền tảng (trừ video về dịch vụ Google), không tác phẩm của agency khác | ✗ |
| 13 | Có ảnh bìa + README | ⚠ |
| 14 | Chữ tiếng Việt và tiếng Đức không mất dấu, không chồng dòng | ✗ |
| 15 | Mẫu Hyperframes: Bộ dựng "Hyperframes thuần" ở tab Xuất báo ✓ | ⚠ |

## 6. Quy trình đưa mẫu vào thư viện

1. Làm video cho khách như bình thường, hoặc dựng từ storyboard khuôn.
2. Đạt → **Giao diện → Lưu thành mẫu** (hoặc nhờ Claude Code: *"chuyển dự án này thành template theo docs/TEMPLATE_STANDARD.md"*).
3. Thay ảnh / logo / số liệu thật của khách bằng ảnh minh hoạ.
4. `node server/cli-template.mjs check templates/<id>` → sửa đến khi không còn ✗.
5. Ảnh bìa: nút **Tạo lại ảnh bìa** trong hộp Kiểm tra (chụp ảnh tĩnh, không xuất video).
6. Motion lead duyệt → mẫu hiện trong thư viện, lọc được theo nhóm và **phong cách**.

## 7. Chia sẻ & nhập mẫu

- **Xuất .zip** / **⤓ Nhập mẫu…** trong thư viện. Mẫu dùng phong cách riêng: gửi kèm thư mục `lib/hf/styles/<id>/` (hoặc đặt phong cách trong thư mục mẫu dùng chung của nhóm).
- Mẫu cộng đồng: **Lottie** dùng trực tiếp (tab Ảnh chèn); **Hyperframes / HTML + GSAP** chuyển thành khuôn theo chuẩn khuôn; **Remotion** chỉ dùng tham khảo, viết lại bằng HTML.
- Luôn kiểm giấy phép trước khi dùng cho khách trả tiền.
