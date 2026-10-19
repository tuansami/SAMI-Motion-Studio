# SA01 · Google Ads Maps — "Đói, và đang ở rất gần"

Series 2610-SA "SAMI cho nhà hàng tại Đức" · bộ máy: SAMI Motion Studio (Hyperframes viết tay toàn bộ) · 9:16 trước, rồi 16:9 · ~89,5 s · không voice (có `VOICE_OVER.md`).

## Một câu
Một vị khách đang đói, cách quán 400 m, gõ „Pho in der Nähe" và quán hiện lên đầu tiên là quán khác. SAMI dựng quảng cáo Google Maps để đúng khoảnh khắc đó, quán bạn hiện lên trước.

## Khán giả
Chủ nhà hàng (chủ yếu người Việt) ở Đức. Nấu ngon, bận 12 tiếng/ngày, sợ trả tiền quảng cáo mà không biết tiền đi đâu.

## Dịch vụ
Chỉ Google Ads trên Maps (quảng cáo vị trí): bán kính quanh quán, chạy theo giờ mở cửa (Ruhetag nghỉ), từ khóa tiếng Đức theo món, nút Anrufen / Route / Reservieren, đo chuyển đổi, báo cáo hàng tuần.

## Mạch kể (BIBLE §2)
19:12, khoảnh khắc thật → quán hiện đầu là quán khác (nỗi đau) → khách đi sang quán khác, mỗi tối bao nhiêu người như vậy (cái giá) → "Bếp vẫn nóng. Bàn vẫn trống." (đáy cảm xúc) → SAMI dựng quảng cáo Maps (quy trình nhìn thấy được: 4 module HUD) → **khoảnh khắc chữ ký**: radar quét, chấm người sáng lên, mọi đường đi bẻ cong về ghim quán bạn, ghim nổi lên đầu „Gesponsert" → 3 lợi ích → báo cáo tuần minh bạch → nhịp thở → CTA WhatsApp → end card SAMI.

## Look "Night Radar"
Bản đồ đêm vẽ bằng code (đường phố, sông, khối nhà, nhãn phố tiếng Đức tưởng tượng), sóng radar mint #08DDA4, ghim neon, HUD mảnh IBM Plex Mono (toạ độ, giờ, khung góc), 3 lớp: lưới/bản đồ chậm · nội dung · hạt sáng/tia quét. Chữ chính Be Vietnam Pro 800. Một easing SAMI.

## Sự thật (đã kiểm theo SAMI_FACTS §8)
- Không có số kết quả. Biểu đồ báo cáo = ghi "Minh họa". Danh sách kết quả tìm kiếm = quán tưởng tượng ("Phở Mây" = quán của bạn; đối thủ "Pho Haus", "Saigon Kitchen 88", "Little Hanoi Imbiss" — tên chung, minh hoạ, ghi "Minh họa").
- "Không chi phí ẩn" ← "There are no hidden costs or unseen work". "Phản hồi trong 24 giờ", "Phân tích marketing miễn phí, không ràng buộc" ← ưu đãi công bố.
- Ruhetag / ngân sách theo giờ mở cửa ← nguyên tắc trong case Vị Schliersee. Đo cuộc gọi, chỉ đường, đặt bàn ← 5 chuyển đổi GTM trong case Vị.
- Không hiện giá, không địa chỉ, không logo nền tảng khác Google (chỉ vẽ UI kiểu Maps, không dùng logo WhatsApp: bong bóng chat vẽ bằng code).

## CTA
Nhắn WhatsApp **+49 155 60456888** · sami-agency.de · "Phân tích marketing miễn phí, không ràng buộc" · phản hồi trong 24 giờ.

## Nhạc
Dark minimal tech-house, dựng ở 120 BPM (khớp lưới cắt), Rê thứ, pluck + sub bass, ping sonar làm nhịp, tự tạo bằng numpy (`audio_src/score.py`).
