# BRIEF · SA14 · Phim (lemo / paper-popup) — "Từ một căn bếp nhỏ đến quán kín bàn"

Series 2610-SA "SAMI cho nhà hàng tại Đức" · phiên session_01VAnbc7r8nwdmwFf8omFNir · 19.10.2026
Tuấn đã uỷ quyền tự brainstorm / tự quyết, không chờ duyệt storyboard.

## Từ LINEUP
- Style lemo-opuscar `paper-popup` (Paper Pop-up Book). Giữ mọi bất biến của `STYLE.md`.
- Một cuốn sách giấy mở ra từng trang: (1) căn bếp nhỏ của người Việt ở Đức, (2) phố đông nhưng không ai thấy quán, (3) SAMI dựng: thương hiệu (biển hiệu bật lên), website (màn hình giấy), bản đồ với ghim, (4) khách kéo đến, đèn lồng sáng, (5) trang cuối: "Mỗi món ngon đều có một câu chuyện. Hãy để nhiều người được nghe." → end card SAMI.
- Nhạc: nylon guitar + strings ấm + đàn bầu tổng hợp nhẹ (gợi Việt), 90 BPM, Rê trưởng.
- 9:16 (1080×1920) trước, rồi 16:9 (1920×1080), 30 fps.

## Khán giả & thông điệp
Chủ nhà hàng người Việt tại Đức: nấu ngon, làm 12 tiếng/ngày, quán vô hình trên điện thoại của khách. Thông điệp lõi: khách tìm thấy bạn → tin bạn → đặt bàn → quay lại. Dịch vụ xuất hiện: branding, website đặt bàn, Google Maps (lõi: website + Maps).

## Sự thật dùng trên màn hình (chỉ từ SAMI_FACTS mục 8 "An toàn")
- "Strategy • Automation • Marketing • Intelligence", logo `assets/logo-white.svg`.
- "Phân tích marketing miễn phí, không ràng buộc" (= *Kostenfreie Marketing-Analyse – unverbindlich und ohne Druck*).
- WhatsApp +49 155 60456888 · sami-agency.de.
- Không số liệu, không thứ hạng, không review. Quán trong phim là **quán tưởng tượng "Quán Mây · Leipzig"** (tên mẫu do SERIES_BIBLE gợi ý). Mọi giao diện điện thoại / bản đồ / kết quả tìm kiếm là minh hoạ, ghi "Minh họa".
- Tiếng Đức chỉ trong giao diện: „Restaurant in der Nähe", „Pho in der Nähe", „Jetzt reservieren", „Speisekarte", „Route", „Anrufen".
- Không logo nền tảng (không Google logo, không WhatsApp logo); bong bóng chat xanh vẽ bằng code.

## Bộ máy (máy cloud)
`setup.sh deps` bị bộ lọc quyền chặn → như SA08: trang phim tự viết, **WebGL2 thuần (không three.js)**: thẻ giấy bật lên quanh mép dưới, bóng đổ shadow-map theo hình cắt (alpha), sách có bìa vải + khối trang + trang lật cong nhiều đoạn, DOF tự viết (CoC theo độ sâu, gom xoắn ốc). Bàn gỗ walnut + bộ ấm chén Poly Haven (CC0, có sẵn trong `core/assets/polyhaven`). playwright-core symlink từ /opt/node-tools. Nhạc numpy (Karplus-Strong nylon, strings cộng hưởng, đàn bầu = âm bồi + vibrato + uốn cần).

## Giao
`out/SAMI_SA14_paper-popup_v1_9x16.mp4`, `..._16x9.mp4` + contact sheet, gửi qua SendUserFile. Không voice trong video; kịch bản VO ở `brief/VOICE_OVER.md`.
