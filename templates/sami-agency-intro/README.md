# SAMI Agency Intro – 8 dịch vụ cho nhà hàng tại Đức

60 giây · 12 cảnh · **9:16** và 16:9 · lưới 120 BPM (1 nhịp = 15 khung, cắt tại 15n+1) · chữ trên màn hình tiếng Đức (xưng `Sie`) · engine Hyperframes (xuất thuần được) · nhạc tự tổng hợp (`tools/make_music.py`, không bản quyền) · **toàn ảnh thật**.

**Bán gì:** giới thiệu SAMI như agency trọn gói cho nhà hàng: Branding, Speisekarte, Website, Online-Reservierung, Online-Bestellung, Local SEO, Google Ads Maps, Social Media. Trọng tâm: cho chủ quán **thấy tay nghề** (dựng brandkit, menu, website trong app thiết kế, tua nhanh, phối mẫu) rồi chốt bằng **lợi ích + số đo thật + offer miễn phí + WhatsApp**.

## ⚠️ Ảnh thật nằm ở thư viện, không nằm trong mẫu
Repo app là public nên ảnh khách **không** commit vào đây. Mọi ô ảnh trỏ `lib:img/sami-cases/<case>/<file>` (SAMI_Library). Trước khi mở mẫu lần đầu trên máy mới:
```bash
# 3 file zip trang case study (Google Drive → draft-tuan/<case>-case/sami-case-<case>.zip)
node templates/sami-agency-intro/tools/import-images.mjs sami-case-84kitchen.zip sami-case-mizuki.zip sami-case-vi.zip
#   → SAMI_Library/assets/img/sami-cases/{84kitchen,mizuki,vi}/… (54 ảnh, ~5 MB). Thêm --library "<đường dẫn>" nếu thư viện ở chỗ khác.
```
Thiếu ảnh thì Studio → **Kiểm tra** báo ✗ "Tài nguyên". Đổi ảnh bất kỳ: tab Chữ → ô ảnh (`…_photo`, `S04_logo`).

## Storyboard

| # | Cảnh | Khung | Giây | Chữ (DE) | Chuyển động | Ảnh thật |
|---|---|---|---|---|---|---|
| S01 | Hook: tìm kiếm | 0–106 | 0:00–3,5 | `Freitag, 19:12` · gõ `vietnamesisch essen in der Nähe` · **Ihr Essen ist gut. / Warum findet Sie *niemand?*** | Thanh tìm kiếm đập vào, gõ chữ, danh sách kết quả cuộn qua (không có quán mình), chữ dập theo nhịp, "niemand?" đỏ + rung, ảnh món mất màu | món vịt +84 Kitchen |
| S02 | SAMI xuất hiện | 106–196 | 3,5–6,5 | **Wir ändern das.** → logo SAMI · *Marketing für Restaurants in Deutschland* | Ghim rơi, nổ sáng + vòng sóng + hạt, logo S quét vào, 6 vạch trượt vào, tia sáng xoay | |
| S03 | 8 dịch vụ | 196–331 | 6,5–11 | **8 Leistungen. / *Ein* Ansprechpartner.** + 8 ô dịch vụ | 8 ô bay vào mỗi nửa nhịp, vệt sáng quét, nhịp cuối lao vào ô Branding | 8 ảnh (brandkit, menu, web, nội thất, món) |
| S04 | 01 Branding | 331–616 | 11–20,5 | **Logo, Farben, Schrift. / Ihr *Brandkit.*** · HUD `ZEITRAFFER ×16` + đồng hồ chạy | App thiết kế tự vẽ, tua nhanh (giữ hình 12 fps): lưới dựng hình → **Pen vẽ nét logo vector thật** (điểm neo, tay nắm bezier, số điểm neo đếm) → tô màu → phối 8 bảng màu trên nền khác nhau rồi chốt → đổi 7 font rồi chốt Playfair Display → ráp brandkit thật → dấu "Brandkit fertig" + 3 brandkit dự án khác trượt lên | logo SVG + 7 bảng brandkit thật |
| S05 | 02 Speisekarte | 616–781 | 20,5–26 | **Eine Speisekarte, / die *verkauft.*** · *Druck + Online · Allergene korrekt* | Trang A4 dàn tua nhanh: lề, tiêu đề, 5 món ảnh thật, mã dị ứng, thử 4 bố cục (phối mẫu) rồi chốt bản tối/vàng → menu in thật + điện thoại menu online | 5 món + bìa menu thật |
| S06 | 03 Website | 781–976 | 26–32,5 | **Schnell. / Auch auf dem *Handy.*** · *Mobiloptimiert* | Khung dây → 6 khối web thật ghép vào (tua nhanh, trang tự cuộn, khung code chạy) → co Desktop → Tablet → Smartphone | 6 khối + 3 ảnh chụp web thật |
| S07 | 04 + 05 | 976–1111 | 32,5–37 | **Reservieren rund um die Uhr. / Bestellen *ohne Provision.*** | 2 điện thoại thao tác theo nhịp: chọn ngày, +1 người, 19:30 → "Reserviert"; + 3 món, giỏ đếm, giờ lấy → "Bestellt" | phòng ăn + 3 món |
| S08 | 06 + 07 | 1111–1291 | 37–43 | **Ganz oben, / wenn Gäste *suchen.*** · `Sushi in der Nähe` · *Anzeige* · *Local SEO* · *Route* | Bản đồ tự vẽ, gõ tìm, ghim rơi, thẻ "Ihr Restaurant" leo hạng 4 → 1, ghim mình nảy + sóng, đường đi tự vẽ tới quán | nội thất quán (thẻ mình); quán khác là ô xám |
| S09 | 08 Social Media | 1291–1396 | 43–46,5 | **Sie kochen. / Wir *posten.*** · *Neuer Beitrag ist online* | 9 bài đăng lật vào theo đường chéo, reel giữa nảy theo nhịp, tim bật + bay, thông báo | 9 ảnh món / bếp |
| S10 | Dự án thật | 1396–1516 | 46,5–50,5 | **Echte Projekte. / *Gemessen.*** · Kempten 1,5 s · Baden-Baden 1,55 s · Karlsruhe 1,8 s · Schliersee 100 % mobiloptimiert · *Ladezeit der Startseite (LCP), gemessen* | Tường ảnh dự án trôi chậm, 4 thẻ vào theo nhịp, số đếm lên | 9 ảnh dự án + 4 ảnh quán (không tên quán) |
| S11 | Offer + WhatsApp | 1516–1666 | 50,5–55,5 | **Kostenloser Check: / *Google Maps + Website*** · ~~250 €~~ **0 €** · chat *Hallo SAMI, ich möchte den kostenlosen Check.* → *Gerne! Wann passt es Ihnen?* · **Schreiben Sie SAMI / auf *WhatsApp.*** | Gạch đỏ giá, con dấu 0 € đập + rung, khung chat tự vẽ: gõ, gửi, ✓✓ xanh, "…", trả lời | nền món ăn mờ |
| S12 | Thẻ kết | 1666–1801 | 55,5–60 | logo SAMI · *Strategy • Automation • Marketing • Intelligence* · WhatsApp **+49 155 60456888** · **sami-agency.de** | FINAL HIT: chớp, logo tự dựng, khẩu hiệu, nút WhatsApp nhịp nhẹ, giữ ≥ 3 s | |

## Nhạc + âm thanh
- `public/audio/sami-intro-120.mp3`: tạo lại bằng `python tools/make_music.py out.wav --mp3 public/audio/sami-intro-120.mp3` (numpy; mp3 cần ffmpeg). 120 BPM, La thứ, Am–F–C–G. Phân tích nhịp của Studio: DROP 50,54 s (S11), FINAL HIT 55,54 s (S12).
- Cấu trúc: hook căng (pad lọc, hi-hat, riser) → drop nhỏ 3,5 s (logo) → groove → arpeggio 1/16 + tiếng tick ở chương tua nhanh (11–26 s) → đỉnh 37–46,5 s → breakdown + trống dồn (S10) → drop 50,5 s → final hit 55,5 s, ngân và tắt.
- SFX (tab Âm thanh): typing ở hook, whoosh trước S04/S06/S08, pop khi con dấu 0 €, sub_hit ở logo cuối.

## Khi dùng mẫu
- **Chữ:** tab Chữ, mọi chữ có nhãn tiếng Việt ghi vị trí. `*…*` tô gradient (ở S01 là đỏ), ` / ` xuống dòng. Nhãn giao diện app (S04_ui), dòng code (S06_code), giờ/ ngày (S07) cách nhau bằng `|`.
- **Số liệu S10 là số đo thật** (`sami-marketing-os/knowledge/proof-points.md`), không ghi tên quán theo yêu cầu của Tuấn. Ảnh và logo khách (brandkit +84 Kitchen, MIZUKI, Vị; web Vị) lấy từ case study công khai trên sami-agency.de; dùng cho **quảng cáo trả phí** cần xác nhận quyền với từng khách.
- **Offer S11** "Kostenloser Check: Google Maps + Website, 250 € → 0 €" là offer cố định của SAMI. Đổi offer → đổi 3 ô chữ S11.
- "Bestellen ohne Provision" theo FAQ bán hàng (đặt món qua web riêng của quán, không mất phí mỗi đơn như nền tảng giao đồ ăn).
- Chữ tiếng Đức cần người Đức đọc soát trước khi chạy quảng cáo. Không có logo nền tảng: thanh tìm kiếm, bản đồ, app thiết kế, khung chat đều tự vẽ (nút WhatsApp cuối dùng biểu tượng WhatsApp như các thẻ kết SAMI khác).
- **Code chung:** `hf/parts/intro.css` + `hf/parts/intro.js` (`window.I`: tua nhanh `I.lapse`, HUD, gõ chữ, đếm số, logo SAMI vector, con trỏ, khung app thiết kế). Cảnh tua nhanh dùng timeline con được tua theo bước 1/12 s.
