# Hyperframes starter – cảnh HTML/GSAP

14 giây · 3 cảnh · 16:9 / 9:16 / 1:1 · lưới 120 BPM · engine **Hyperframes** (mặc định cho cảnh mới từ Studio 0.6).

- **Khi nào dùng:** điểm xuất phát cho video mới viết bằng web-core (HTML + CSS + GSAP), cũng là ví dụ chuẩn cho Claude Code khi viết cảnh HF.
- **Thay nội dung:** tab Chữ (nhãn, câu hook, 3 lợi ích, câu kêu gọi, liên hệ). Màu lấy từ tab Màu/brand → biến CSS `--c-*`.
- **Cấu trúc cảnh:** `hf/<ID>.html`, khai trong `project.json → scenes[i] = {engine: "hyperframes", src: "hf/<ID>.html"}`. Đường dẫn trong cảnh tính từ gốc dự án (`public/…`, `lib/…`, `_fonts/…`, `_sami/…`).
- **Quy tắc:** một easing (`SAMI.EASE`), thời điểm theo nhịp (`SAMI.beat(n)`), chữ qua `data-copy="KEY"`, bố cục theo tỉ lệ bằng `[data-ratio="9x16"] …`. Không `Math.random`/`Date`/`requestAnimationFrame`.
- **Lưu ý:** cảnh HTML được render thành clip một lần (cache theo nội dung) rồi Studio ghép tiêu đề, phụ đề, âm thanh như cảnh thường.
