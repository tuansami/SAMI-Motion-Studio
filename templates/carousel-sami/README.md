# Carousel động SAMI – 5 slide

4:5 (1080×1350) · 5 slide × 6 s · mỗi slide là một MP4 lặp liền mạch, có tiếng riêng (groove 120 BPM + SFX tự tổng hợp) · engine Hyperframes.

- **Khi nào dùng:** bài carousel Instagram/Facebook/LinkedIn cần "động" để giữ người xem vuốt: mẹo, quy trình 3 bước, checklist, CTA bình luận từ khoá.
- **Thay nội dung:** tab Chữ (nhãn, CHỮ LỚN, câu nhỏ, dòng dưới cùng của từng slide; từ khoá CTA). Màu: `carousel.theme` (sami · cream · tomato · forest · noir) hoặc brand.
- **Chuyển động:** `slides/C0x.html` (ghim Google Maps xuyên suốt: `slides/_pin.js`; bố cục chung `slides/_shared.css`). Tiếng: `project.json → scenes[].cues`.
- **Xuất:** tab Xuất hoặc `node <app>/server/cli-carousel.mjs . render` → `out/carousel/<thời điểm>/` (MP4 từng slide, ảnh bìa, đường nối vòng, contact sheet, `preview.html` vuốt thử).
- **Lưu ý:** khung 0 của mỗi slide là ảnh bìa (chữ phải hiện đủ); slide dài 4/6/8 s; không bịa số liệu; đăng các MP4 theo thứ tự trong một bài, tắt nhạc của nền tảng.
