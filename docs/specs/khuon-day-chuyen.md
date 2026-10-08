# Spec v0.8.3: Khuôn + Dây chuyền ("trả tiền nghĩ một lần")

Ngày 2026-10-08. Tuấn bảo "triển khai các công việc tiếp theo": spec này ghi các quyết định để làm luôn, Tuấn đọc lại và chỉnh nếu cần.

## Mục tiêu
Mỗi video mới không phải nghĩ lại từ đầu. Phần đắt (thiết kế chuyển động, bố cục từng tỉ lệ, nhịp) làm **một lần** thành **khuôn**; video sau chỉ điền chữ, ảnh, màu. Claude chỉ điền JSON, máy dựng.

## A. Khuôn (`lib/hf/khuon/<id>/`)
- Mỗi khuôn là một cảnh Hyperframes có tham số:
  - `khuon.json`: `id`, `name` (VI), `group` (hook, van-de, loi-ich, so-lieu, maps, chat, anh, menu, uu-dai, danh-gia, cta, ket), `beats` (độ dài mặc định theo nhịp 120 BPM), `themes` hỗ trợ, `slots` (tên, nhãn, loại `text` | `image` | `number`, mặc định, gợi ý độ dài), `sfx` (cue gợi ý theo nhịp), `from` (lấy cảm hứng từ cảnh nào: V22 S03…).
  - `scene.html`: không có chữ cứng. Phần tử ghi `data-slot="headline"`, ảnh ghi `data-slot-img="p1_photo"`. Bộ kit gắn `<cảnh>_<slot>` từ `project.json → copy`.
  - `thumb.jpg`: ảnh xem trước (sinh bằng `tools/khuon-thumbs.mjs`).
- **Bộ kit dùng chung** `lib/hf/khuon/kit.{css,js}` (`_sami/khuon/kit.*` trong cảnh): gắn slot, 3 **theme** (`night` navy SAMI, `paper` giấy kraft kiểu V22, `light` sáng kiểu V23), khối dựng sẵn: điện thoại, chữ cắt dán (ransom), ảnh polaroid + băng dính, bong bóng chat, ghim Maps, sao đánh giá, con dấu, bộ đếm số.
- Màu, font lấy từ `project.json → brand` (hoặc `brand.json` của khách, mục C). Theme đặt ở `scene.khuon.theme`, mặc định theo `look.theme` của dự án.
- **Cảnh trong dự án**: `{"id":"S03","engine":"hyperframes","src":"hf/S03.html","khuon":{"id":"maps-search","v":1,"theme":"paper"}}`. File khuôn được **chép** vào `hf/S03.html`: dự án tự đủ, sửa khuôn sau này không làm đổi video cũ, Claude vẫn chỉnh tay được.
- **Đổi khuôn**: chép khuôn mới đè `hf/<ID>.html` (lịch sử phiên bản có điểm neo trước), giữ nguyên chữ của slot trùng tên (headline, sub, label, cta, ảnh…), thêm slot thiếu với giá trị mặc định, **không đụng** giọng đọc, nhạc, SFX, thời lượng.
- Mục tiêu 20 đến 30 khuôn; đợt đầu (bản này) 16 khuôn phủ đủ cho 3 dây chuyền.

## B. Dây chuyền (`lib/pipelines/<tên>.mjs`, chạy bằng `server/cli-pipeline.mjs`)
- Lệnh cố định: `node server/cli-pipeline.mjs <dây chuyền> <brief.json> --out <thư mục> [--brand <khách>] [--ratio 9:16]`. Claude chỉ viết `brief.json` (có mẫu trong `lib/pipelines/examples/`), máy chọn khuôn, xếp thời gian trên lưới 120 BPM, điền chữ / ảnh, đặt SFX ở mỗi lần cắt, chọn nhạc nền từ brand hoặc thư viện, rồi chạy validate + ảnh QA.
- Đợt đầu: `promo` (30 s từ brief: hook, vấn đề, lợi ích, số liệu, ưu đãi, CTA), `maps` (video Google Maps: tìm kiếm, hồ sơ, đánh giá, CTA), `menu` (thực đơn / ưu đãi: món + giá + ảnh). Carousel từ ảnh đã có (`tools/carousel-new.mjs`). Webinar → short chờ v0.9.
- Không render: dây chuyền chỉ dựng dự án + ảnh QA. Xuất vẫn chỉ khi Tuấn yêu cầu.

## C. Bộ nhận diện từng khách `SAMI_Library/brands/<khách>/brand.json`
`{name, colors{navy, mint, purple, text, …}, gradient, fonts{head, ui}, theme, logo ("lib:img/…"), contact{web, phone, whatsapp, address}, cta, voice{provider, voice}, music ("lib:music/…"), lang}`. Dây chuyền áp vào dự án; Studio có `GET /api/brands`. Mẫu: `brands/sami/brand.json`.

## D. Kỷ luật phiên
1 video = 1 phiên; 1 bản Studio = 1 phiên; trạng thái nằm trong file (`brief/`, `project.json`, HANDOFF), không trong trí nhớ phiên. Ghi vào skill.

## E. Chia model
Opus: kịch bản, storyboard, chọn khuôn. Sonnet: dựng / sửa cảnh, trình duyệt (runner Claude). Script / Haiku: việc lặp (điền brief từ bảng, biến thể). Ghi vào skill.

## F. Sổ chi phí theo video
- Mỗi lượt `claude -p` của runner ghi một dòng ledger `provider: "claude-code"`, `claudeUsd` = `total_cost_usd`, `charged: 0` (hạn mức gói Claude, không tính vào trần 2/20 USD), `project`.
- `ledger --project <thư mục>` (CLI) và `ledgerSummary({project})`: tổng USD API + Claude quy đổi của một video.

## G. Tự động trình duyệt
Đã có ở 0.8.2 (kịch bản → Jev → Claude).

## Studio
- Cột Cảnh: **🧩 Khuôn** → bảng khuôn (ảnh xem trước, nhóm, lọc) → **Thêm cảnh** (cuối phim hoặc sau cảnh đang chọn) / **Đổi khuôn cảnh này** (chọn theme).
- Route: `GET /api/khuon`, `POST /api/khuon/apply`, `GET /api/brands`.

## Không làm ở bản này
UI chạy dây chuyền (Claude chạy CLI), khuôn cho TSX, 20 đến 30 khuôn đủ bộ (đợt sau), webinar.
