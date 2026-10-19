# BRIEF · SA08 · Phim tilt-shift — "Một con phố, mười nhà hàng, một quyết định"

- **Bộ máy**: lemo-opuscar, style `tilt-shift` (Tilt-Shift Miniature). Thư mục phim: thư mục này (`index.html` + `main.js` + `film.js` + `world.js`), thư viện `LIB=/home/user/lemo-opuscar`.
- **Khán giả**: chủ nhà hàng người Việt tại Đức. Nỗi đau: nấu ngon, bếp vẫn nóng, nhưng khách đi ngang và vào quán bên cạnh vì quán mình "không có trên điện thoại".
- **Thông điệp**: khách đã ở rất gần, họ tìm quán bằng điện thoại. SAMI dựng website đặt bàn + hồ sơ Google Maps + quảng cáo Maps + lời khen của khách → dòng người đổi hướng → quán kín bàn.
- **Câu chốt bắt buộc** (LINEUP): "Khách đã ở rất gần. Hãy để họ tìm thấy bạn." → end card SAMI.
- **Độ dài**: 87,5 s (35 nhịp × 2,5 s, 96 BPM). 9:16 1080×1920 trước, 16:9 sau (bố cục camera riêng).
- **Chữ**: tiếng Việt, xưng "bạn"; tiếng Đức chỉ trong bong bóng tìm kiếm, biển hiệu, thẻ Maps, website mini.
- **Nhạc**: music box + pizzicato, nhịp đi bộ 96, Mi giáng trưởng (numpy, `audio_src/score.py`).
- **Sự thật**: không số liệu kết quả, không review có số sao/số lượng, không giá. Quán "Bếp Sen" và 9 quán còn lại là hư cấu. Phố "Lindenstraße" là tên phố phổ biến, không chỉ một địa điểm thật. Ghi "Minh họa" trên thẻ Maps/quảng cáo.
- **CTA**: WhatsApp +49 155 60456888 · sami-agency.de · "Phân tích marketing miễn phí, không ràng buộc" · phản hồi trong 24 giờ.
- **Không giọng đọc**; kịch bản VO sẵn trong `VOICE_OVER.md`.

## Ràng buộc kỹ thuật (máy cloud phiên này)
- `setup.sh deps` và `npm install` bị bộ lọc quyền chặn → không có three.js / scipy / soundfile. Giải pháp không lách: dựng thế giới thu nhỏ bằng **Canvas 2D tự viết** (chiếu phối cảnh, khối nhà, near-plane clip, blur band bằng nhiều lớp mờ có mặt nạ), nhạc bằng **numpy + wave** thuần. `node_modules/playwright-core` trỏ (symlink) tới bản playwright-core đã cài sẵn trên máy (/opt/node-tools), cùng bản Chromium 1194 có sẵn.
