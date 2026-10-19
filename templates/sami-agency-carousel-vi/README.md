# Carousel SAMI Agency – tiếng Việt 8 slide (kể chuyện)

4:5 (1080×1350) · 8 slide × 6 s · mỗi slide là một MP4 lặp liền mạch, có tiếng riêng (groove 120 BPM + SFX tự tổng hợp) · engine Hyperframes · chữ tiếng Việt cho chủ quán người Việt tại Đức, giao diện khách thấy (Google Maps, đặt bàn, đặt món, menu) giữ tiếng Đức.

Cùng mạch chuyện với video `sami-agency-intro-vi-story`:

| Slide | CHỮ LỚN | Ý chính | Chuyển động (nhịp chính) |
|---|---|---|---|
| C01 | TÌM KHÔNG RA? | Món ngon, khách đói không thấy quán trên Google Maps | Ghim đỏ quán khác nảy, ghim mờ "?" + "Không có trong kết quả" rung (2,0 s), ghim SAMI rơi vào chỗ trống (3,0 s) |
| C02 | 8 VIỆC. | Từ logo tới lúc khách đặt bàn: một đầu mối, nói tiếng Việt | 8 thẻ dịch vụ sáng lần lượt, ghim nhảy thẻ 01 → 08 |
| C03 | GƯƠNG MẶT. | Logo, màu, chữ, menu (nhà hàng hư cấu Saigon Atelier, nhãn VÍ DỤ MINH HOẠ) | Phối 3 bảng màu tua nhanh rồi chốt (2,5 s), menu 3 món ảnh thật |
| C04 | MỞ 24/7. | Quán đóng cửa, web vẫn nhận khách; đặt món không mất hoa hồng | Điện thoại web thật; bấm "Reservieren" → Reserviert (1,5 s), "Bestellen" → Bestellt (3,0 s) |
| C05 | HIỆN RA. | Khách đói tìm quanh đây, quán anh chị hiện ra | Quán tụt hạng 4 rồi leo lại hạng 1 (2,0 s), Anzeige + Local SEO, nút Route |
| C06 | ĐĂNG ĐỀU. | Anh chị lo nấu, SAMI lo đăng bài | 6 bài ảnh món thật, tim bật theo nửa nhịp, thông báo "Bài mới đã lên" |
| C07 | SỐ THẬT. | Số đo thật từ 4 quán SAMI làm web (không ghi tên quán) | 4 thẻ Kempten 1,5 s · Baden-Baden 1,55 s · Karlsruhe 1,8 s · Schliersee 100 % |
| C08 | MIỄN PHÍ. | Kiểm tra miễn phí Google Maps + website (250 € → 0 €), WhatsApp, tiếng Việt | Ghim đáp lên "0 €" (impact), nút WhatsApp nảy |

- **Ảnh thật** trỏ `lib:img/sami-cases/…` (cùng bộ ảnh với mẫu `sami-agency-intro`; máy mới chạy `templates/sami-agency-intro/tools/import-images.mjs` một lần là đủ). Đổi ảnh: tab Chữ → ô `…_photo`.
- **Chữ:** tab Chữ (nhãn ghi rõ slide + vị trí). `*…*` tô màu (không ngắt dòng giữa cụm tô màu). Số liệu C07 lấy từ `sami-marketing-os/knowledge/proof-points.md`, không thêm số khác.
- **Code:** `slides/C0x.html`; dùng chung `slides/_shared.css` (bố cục), `_vi.js` (`window.V`: ô ảnh, `V.flow()` đặt câu nhỏ + vùng minh hoạ theo chữ lớn, đẩy chữ lớn xuống khi có dấu chồng Ễ/Ậ), `_pin.js` (ghim xuyên slide, chữ lớn tối đa 200 px), `_concept.js` (logo đèn lồng Saigon Atelier).
- **Xuất:** tab Xuất hoặc `node <app>/server/cli-carousel.mjs . render` → `out/carousel/<thời điểm>/` (MP4 từng slide, ảnh bìa, đường nối vòng, contact sheet, `preview.html` vuốt thử). Đăng 8 MP4 theo thứ tự trong một bài, tắt nhạc của nền tảng. Caption soạn sẵn: `project.json → carousel.caption` (có câu "Saigon Atelier là nhà hàng ví dụ minh hoạ").
