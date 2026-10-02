# Quy trình làm video chuẩn — SAMI Motion Studio

> Tài liệu chung cho **người mới** và **agent** (Claude Code, Cowork). Đọc hết trong 10 phút. Mục tiêu: làm video đúng chất lượng SAMI, ít vòng sửa, **không tốn token vì nạp dự án cũ**.
> Tài liệu liên quan: `HUONG_DAN_SU_DUNG` (cách dùng Studio) · `PROJECT_GUIDE` (luật viết cảnh cho agent) · `TEMPLATE_STANDARD` (chuẩn mẫu) · `KE_HOACH_PHAT_TRIEN` (lộ trình).

---

## 0. Tóm tắt 30 giây

1. **1 video = 1 thư mục dự án = 1 phiên làm việc mới.** Không làm tiếp video mới trong chat cũ, không sao chép thư mục dự án cũ.
2. **Mọi quyết định ghi vào file trong thư mục dự án** (`brief/`), không để trong lịch sử chat. Phiên sau đọc file là đủ ngữ cảnh.
3. **Chữ, thời lượng, tiêu đề, phụ đề, ảnh chèn, âm thanh, màu, xuất video → người làm trong Studio (0 token).** Claude chỉ viết/sửa **code cảnh**.
4. **Duyệt kịch bản trước khi code.** Sửa trên giấy rẻ gấp 10 lần sửa trên code.
5. **Agent chỉ đọc đúng file được nêu tên.** Kiểm tra bằng ảnh tĩnh, không xem video.

---

## 1. Vai trò & công cụ

| Việc | Ai / công cụ | Ghi chú |
|---|---|---|
| Nhận yêu cầu, thu tài nguyên, điền brief | **Account / người phụ trách** | Brief chưa đủ thì chưa bắt đầu |
| Chiến lược thông điệp, nghiên cứu khách, tạo nhạc (ElevenLabs), viết lời | **Cowork** (claude.ai, 1 phiên / chiến dịch) | Nhạc tạo xong lưu vào `public/audio/` của dự án |
| Kịch bản + storyboard, viết code cảnh, bố cục 16:9 / 9:16 / 1:1, QA ảnh tĩnh | **Claude Code** mở **tại thư mục dự án** trên máy có Studio | Tự nạp `CLAUDE.md` + skill của dự án |
| Sửa chữ, thời lượng, tiêu đề, phụ đề, ảnh/logo/watermark/mũi tên/Lottie, âm thanh, màu | **Người dùng Studio** | Không gọi Claude cho các việc này |
| Xuất bản nháp / bản cuối, ba tỉ lệ | **Studio → tab Xuất** | Render chạy trên máy văn phòng, không trên cloud |
| Duyệt kịch bản, duyệt bản nháp, duyệt giao khách | **Motion lead / CEO** | 3 cổng duyệt ⛔ ở mục 3 |
| Đưa video tốt vào thư viện mẫu | **Motion lead** | Theo `TEMPLATE_STANDARD` |

---

## 2. Bản đồ file — "nguồn sự thật" của từng thứ

```
SAMI_Motion_Studio/            ← APP (dùng chung, KHÔNG làm video ở đây)
├─ Start-Studio.bat
├─ docs/                       ← tài liệu này + hướng dẫn + chuẩn
├─ templates/                  ← thư viện mẫu
└─ projects/                   ← nơi chứa các dự án (mặc định)

<dự-án>/                       ← 1 VIDEO (mở Claude Code tại đây)
├─ CLAUDE.md                   ← luật cho agent (Studio tự tạo)
├─ .claude/                    ← skill + workflow SAMI (Studio tự đồng bộ)
├─ brief/
│  ├─ BRIEF.md                 ← yêu cầu của khách (người điền)
│  ├─ TRANG_THAI.md            ← trạng thái + quyết định đã chốt (cập nhật cuối MỖI phiên)
│  ├─ SCRIPT_STORYBOARD.md     ← kịch bản đã duyệt
│  └─ (guideline, logo gốc, tài liệu khách…)
├─ project.json                ← chữ, thời lượng, tiêu đề, phụ đề, ảnh chèn, âm thanh, màu
├─ scenes/                     ← code cảnh (chỉ agent sửa)
├─ public/img|video|audio|lottie|fonts   ← tài nguyên dùng trong video
└─ out/                        ← video đã xuất (agent không đọc)
```

| Muốn biết… | Xem file |
|---|---|
| Khách cần gì | `brief/BRIEF.md` |
| Đang ở bước nào, đã chốt gì, việc tiếp theo | `brief/TRANG_THAI.md` |
| Nội dung, nhịp từng cảnh | `brief/SCRIPT_STORYBOARD.md` |
| Chữ, thời gian thực tế trên video | `project.json` (sửa qua Studio) |
| Hình ảnh, chuyển động của cảnh | `scenes/<ID>.tsx` |

---

## 3. Luồng chuẩn: video mới

| Bước | Ai | Làm gì | Đầu ra | Cổng |
|---|---|---|---|---|
| 1. Khởi tạo | Người | Studio → **Tạo dự án mới từ mẫu** gần nhất + thư mục tài nguyên của khách. Đặt tên theo mục 9 | Thư mục dự án | |
| 2. Brief | Người | Điền `brief/BRIEF.md`: mục tiêu, khán giả, ngôn ngữ, thông điệp chính, CTA + liên hệ, độ dài, tỉ lệ, **ảnh nào là thật**, hạn giao | BRIEF.md đủ 9 mục | |
| 3. Kịch bản | Claude Code | Đọc CLAUDE.md + brief → viết `brief/SCRIPT_STORYBOARD.md` (bảng: cảnh · giây · chữ · chuyển động · SFX), **chưa code** | Storyboard | ⛔ **Duyệt 1**: nội dung, thông điệp, độ dài |
| 4. Nhạc (nếu cần) | Cowork / người | Tạo hoặc chọn nhạc 120 BPM → lưu `public/audio/` → Studio *Phân tích nhịp* → báo DROP / FINAL HIT cho agent | File nhạc + mốc nhịp | |
| 5. Dựng cảnh | Claude Code | Viết `scenes/`, cập nhật `project.json` (cảnh, ô chữ có tên tiếng Việt), đủ bố cục các tỉ lệ; `cli-validate` phải đạt; tự soát ảnh tĩnh | Video xem được trong Studio | |
| 6. Tinh chỉnh | Người | Studio: chữ, thời lượng, tiêu đề, phụ đề, logo/watermark/mũi tên, âm thanh | project.json | |
| 7. Bản nháp | Người | Xuất *Preset: bản nháp nhanh* (hoặc chỉ 1 cảnh) → xem trên điện thoại | MP4 nháp | ⛔ **Duyệt 2**: nội bộ theo checklist mục 8 |
| 8. Bản cuối | Người | Xuất đủ tỉ lệ (MP4 H.264 + GPU; ProRes chỉ khi cần dựng tiếp) → gửi khách | MP4 cuối | ⛔ **Duyệt 3**: khách |
| 9. Đóng dự án | Người + agent | Cập nhật `TRANG_THAI.md` = *Xong*; video tốt → **Lưu thành mẫu** | Lưu trữ / mẫu | |

**Không được bỏ cổng ⛔.** Agent phải dừng và chờ "OK" ở bước 3 trước khi code.

---

## 4. Luồng chuẩn: sửa video (phản hồi khách)

1. **Gom hết phản hồi của một vòng** vào `brief/TRANG_THAI.md` → mục *Phản hồi khách (vòng N)*, mỗi ý một dòng, ghi rõ cảnh + thời điểm (VD: `S04 · 0:15 — đổi ảnh điện thoại sang ảnh món phở`).
2. **Phân loại từng dòng:**

| Loại yêu cầu | Làm ở đâu |
|---|---|
| Đổi chữ, lỗi chính tả, giá, số điện thoại | Studio → tab **Chữ** |
| Nhanh/chậm hơn, cắt ngắn | Studio → cột **Cảnh** (− / +) |
| Thêm tiêu đề, phụ đề | Studio → tab **Tiêu đề / Phụ đề** |
| Thêm logo, watermark, mũi tên chỉ dẫn, sticker | Studio → tab **Ảnh chèn** |
| Đổi ảnh trong cảnh | Studio → tab **Chữ** (ô ảnh) |
| Nhạc, tiếng động | Studio → tab **Âm thanh** |
| Đổi bố cục, hiệu ứng, thêm/bớt cảnh, cảnh mới | **Claude Code**, nêu đúng tên cảnh |

3. Chỉ các dòng ở hàng cuối mới gửi Claude Code, **gom vào 1 phiên**, câu lệnh ở mục 6.
4. Xuất lại → gửi khách → ghi kết quả vào `TRANG_THAI.md`.

> Đề xuất chính sách: báo giá gồm **2 vòng sửa**. Từ vòng 3 tính phí. Gom phản hồi theo vòng giúp giữ đúng phạm vi.

---

## 5. Quy tắc phiên làm việc & tiết kiệm token

### Cho người dùng
- **Phiên mới cho mỗi video và mỗi vòng sửa.** Trong Claude Code: `/clear` giữa các việc không liên quan. Chat càng dài, mỗi câu càng đắt.
- **Mở Claude Code tại thư mục dự án**, không ở thư mục app hay thư mục cha chứa nhiều dự án.
- **Nêu tên cảnh cụ thể** ("S04"), không mô tả chung chung ("cảnh điện thoại").
- **Kết thúc phiên luôn bằng câu:** *"Cập nhật brief/TRANG_THAI.md."*
- **Chọn model theo việc:** Opus cho kịch bản, thiết kế cảnh mới, bố cục khó. Sonnet cho sửa nhỏ, lặp lại, chuyển đổi mẫu.
- **Workflow nhiều agent** (`sami-motion-video`) chỉ dùng khi dựng mới từ 6 cảnh trở lên và cần nhanh; tổng token cao hơn làm tuần tự.
- **Không:** "đọc toàn bộ dự án cho hiểu" · gửi hàng loạt ảnh chụp màn hình · nhờ Claude sửa chữ/thời gian (Studio làm được) · nhờ Claude render video · dùng lại một chat dài của video khác.

### Cho agent (bắt buộc)
- **Thứ tự đọc khi bắt đầu phiên:** `CLAUDE.md` → `brief/TRANG_THAI.md` → chỉ những file mà việc hiện tại cần (`BRIEF.md` / `SCRIPT_STORYBOARD.md` / `project.json` / `scenes/<ID>.tsx` được nêu tên).
- **Không đọc:** `node_modules/`, `out/`, `public/_engine/`, dự án khác, file render/log lớn, code engine của app (trừ khi thông báo lỗi chỉ vào đó).
- **Ảnh:** chỉ xem ảnh cần cho việc hiện tại; QA bằng `cli-still` (vài khung / 1 tờ ảnh ghép), không trích cả video.
- **Không tự:** render video đầy đủ · dùng API tốn phí (ElevenLabs…) khi chưa hỏi · sửa file ngoài thư mục dự án · bịa số liệu, giá, review.
- **Dừng và hỏi** khi: brief thiếu thông tin quyết định (CTA, ngôn ngữ, tỉ lệ, ảnh thật hay không) · yêu cầu mâu thuẫn brief đã chốt · cần tài nguyên chưa có.
- **Trước khi báo "xong":** `cli-validate` không còn ✗ **và** đã tự xem ảnh tĩnh của phần vừa sửa ở các tỉ lệ liên quan.
- **Cuối phiên:** cập nhật `brief/TRANG_THAI.md` theo mẫu mục 7 (ngắn, chỉ điều phiên sau cần biết).

---

## 6. Bộ câu lệnh mẫu

**Bắt đầu video mới (bước 3):**
```
Đọc CLAUDE.md và brief/. Chỉ lên kịch bản + storyboard, ghi vào brief/SCRIPT_STORYBOARD.md,
chưa code. Hỏi tôi tối đa 3 câu nếu brief thiếu. Cập nhật brief/TRANG_THAI.md.
```

**Sau khi duyệt kịch bản (bước 5):**
```
Kịch bản đã duyệt. Dựng các cảnh theo storyboard, đủ bố cục cho các tỉ lệ trong project.json.
Mọi chữ vào project.json → copy (label tiếng Việt ghi rõ vị trí). Kiểm tra bằng cli-validate + ảnh tĩnh.
Không đọc file ngoài thư mục này. Xong thì cập nhật brief/TRANG_THAI.md.
```

**Có nhạc mới:**
```
Nhạc mới ở public/audio/<file>. Chạy cli-grid, đặt cảnh logo/thông điệp chính đúng DROP
và cảnh kết đúng FINAL HIT, chuyển âm thanh sang chế độ layers. Chỉ sửa project.json.
```

**Sửa theo phản hồi (bước 4 của mục 4):**
```
Đọc brief/TRANG_THAI.md → mục "Phản hồi khách vòng N", làm các dòng gắn nhãn Claude.
Chỉ đọc/sửa các cảnh được nêu. Xuất ảnh tĩnh các cảnh đã sửa để tôi xem. Cập nhật TRANG_THAI.md.
```

**Sửa một cảnh cụ thể:**
```
Chỉ sửa S04: <mô tả thay đổi>. Không đọc cảnh khác. Xuất 3 ảnh tĩnh S04 ở <tỉ lệ> để kiểm tra.
```

**Tiếp tục hôm sau:**
```
Đọc brief/TRANG_THAI.md rồi làm tiếp mục "Việc tiếp theo".
```

**Biến video thành mẫu:**
```
Chuyển dự án này thành template theo docs/TEMPLATE_STANDARD.md của Studio.
Thay ảnh/số liệu thật của khách bằng placeholder. Chạy cli-template check đến khi không còn ✗.
```

---

## 7. Mẫu `brief/TRANG_THAI.md`

```markdown
# TRẠNG THÁI — <tên dự án>
Cập nhật: 2026-10-02 · bởi: <tên người / Claude Code (Opus)>

## Giai đoạn
Brief ▢ · Kịch bản ⛔ ▢ · Dựng cảnh ▢ · Tinh chỉnh ▢ · Nháp ⛔ ▢ · Khách duyệt ⛔ ▢ · Xong ▢

## Đã chốt (không bàn lại nếu khách không yêu cầu)
- Khán giả / ngôn ngữ / CTA: …
- Độ dài, tỉ lệ: …
- Nhạc: <file>, DROP 20.0s, FINAL HIT 60.0s

## Việc tiếp theo
- [ ] …

## Phản hồi khách
### Vòng 1 (ngày …)
- [ ] S04 · 0:15 — … → [Studio] / [Claude]

## Ghi chú kỹ thuật
- (lỗi đã gặp + cách xử lý, để phiên sau không lặp lại)
```

Quy tắc: tối đa khoảng 1 trang. Xoá việc đã xong khỏi "Việc tiếp theo", giữ lại quyết định đã chốt.

---

## 8. Checklist trước khi giao khách

- [ ] Chữ tiếng Việt đúng chính tả, **không mất dấu**, không bị cắt ở 9:16.
- [ ] Số điện thoại, WhatsApp, địa chỉ, URL, giá, ưu đãi **đúng với brief** (đọc to từng số).
- [ ] Không số liệu, review bịa; không logo Google/Meta; không tác phẩm agency khác.
- [ ] Mỗi câu đủ thời gian đọc (6–10 chữ ≥ 1,5 s; con số ≥ 2 s; thông điệp chính ≥ 3 s).
- [ ] 9:16: nội dung quan trọng không nằm ở 10 % trên và 15 % dưới (nút của app che).
- [ ] Âm lượng đều, không bị rè; nhạc có giấy phép.
- [ ] Kết thúc có logo + CTA rõ ràng.
- [ ] Studio → **Kiểm tra** không còn ✗; xem bản xuất trên **điện thoại thật**.
- [ ] Đúng các tỉ lệ khách cần; đặt tên file theo mục 9.

---

## 9. Đặt tên & lưu trữ

| Thứ | Quy ước | Ví dụ |
|---|---|---|
| Thư mục dự án | `<khach>-<noi-dung>-<yyyymm>` (không dấu) | `lotus-nails-uu-dai-202610` |
| Tên dự án trong Studio | Có dấu, dễ đọc | `Lotus Nails – Ưu đãi tháng 10` |
| File giao khách | `<Khach>_<NoiDung>_v<vòng>_<tỉ lệ>.mp4` (đổi tên từ file Studio xuất) | `LotusNails_UuDai_v2_9x16.mp4` |
| Tài nguyên | Tên có nghĩa, không dấu | `pho-bo.jpg`, `logo-trang.png` |
| Mẫu | `<nganh>-<muc-dich>` | `restaurant-khai-truong` |

- Dự án đã xong quá 30 ngày: xoá `out/` bản nháp, giữ bản cuối + `brief/`, rồi lưu trữ.
- Không để thư mục dự án trong OneDrive/Google Drive đang đồng bộ khi render.

---

## 10. Người mới — ngày đầu tiên

1. Đọc tài liệu này + `HUONG_DAN_SU_DUNG` (mục 3–11).
2. Mở Studio → dự án mẫu *SAMI – Website nhà hàng*: đổi 3 ô chữ, kéo dài 1 cảnh, thêm 1 tiêu đề, 1 watermark, 1 mũi tên → **Hoàn tác** hết.
3. Tạo dự án thử từ mẫu *Agency promo* → điền brief giả → xuất bản nháp 9:16.
4. Mở Claude Code tại dự án thử → dùng câu lệnh "Sửa một cảnh cụ thể" → xem ảnh tĩnh.
5. Ghi `TRANG_THAI.md` cho dự án thử theo mẫu mục 7 → motion lead xem.

---

## 11. Khi gặp sự cố

| Sự cố | Làm gì |
|---|---|
| Render đứng im / không huỷ được | Tab Xuất → **⛔ Dừng tất cả**; nếu vẫn kẹt, đóng cửa sổ đen → mở lại → **↻ Tiếp tục** |
| GPU không chạy | Tab Xuất → **🩺 Chẩn đoán GPU** → làm theo hướng dẫn (ProRes luôn dùng CPU) |
| Khung xem báo lỗi code (khung đỏ) | Chép lỗi → Claude Code: *"Sửa lỗi này, chỉ trong file được nêu trong lỗi"* |
| Agent đọc lan man, tốn token | Dừng lại → `/clear` → dùng câu lệnh mẫu có nêu tên file cụ thể |
| Agent quên quyết định cũ | Quyết định chưa được ghi vào `TRANG_THAI.md` → ghi vào, mở phiên mới |

Chi tiết: `HUONG_DAN_SU_DUNG` mục 13.
