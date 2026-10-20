# SA11 · Đặt món online — "Đơn hàng về thẳng bếp của bạn"

Series 2610-SA "SAMI cho nhà hàng tại Đức" · Studio (Hyperframes viết tay) · 9:16 trước, rồi 16:9 · 90,0 s · không voice (VO soạn sẵn trong `VOICE_OVER.md`).

## Dịch vụ
Shop đặt món / mang về ngay trên website của quán (case thật: Mizuki · Baden-Baden và +84 Kitchen · Kempten, WooCommerce): menu online có giá + Allergene, giỏ hàng, thanh toán, đơn báo về quán; khách đến từ Google Maps (và quảng cáo); Gutschein + ưu đãi đặt trực tiếp để khách quay lại.

## Khán giả & nỗi đau
Chủ nhà hàng người Việt tại Đức đang sống nhờ app giao hàng của bên thứ ba:
- mỗi đơn phải trả phí cho người đứng giữa (KHÔNG nêu tên app, KHÔNG nêu % hoa hồng);
- khách là khách của app, không phải của quán; quán không có tên, không có cách mời khách quay lại;
- thương hiệu của quán lẫn giữa hàng trăm quán khác trong một danh sách.

## Thông điệp
Đơn hàng của quán phải đi đường thẳng: Maps → website của quán → giỏ hàng → bếp → khách → khách quay lại. Lợi ích: giữ biên lợi nhuận, sở hữu khách hàng, thương hiệu riêng.

## Look: "Isometric Kitchen"
Ngữ pháp Isometric Infographic (lemo `styles/iso-infographic`, engine Canvas 2D chép vào `hf/parts/iso.js`, đổi sang script thường + font Be Vietnam Pro): diorama isometric thật (trục 30°), khối phẳng 3 tông, không viền; chỉ đồ hoạ thông tin có nét mực (pin nhãn, đường cắt, vòng theo dõi). Nền kem sáng có lưới chấm isometric (khác hẳn các video nền tối trong series), end card về navy SAMI.
Mã màu (như chú giải, không dùng 1 màu cho 2 nghĩa):
- **Đơn hàng** = khối cam san hô (chủ thể, luôn giữ màu).
- **Tiền** = vàng mù tạt (giọt / đồng xu).
- **Trung gian** = ống xám tím, máy xám không nhãn hiệu.
- **Đường SAMI** = mint #08DDA4 + tím #7667FE.
- Quán "Bếp Gió · Hannover" (tưởng tượng) = tường kem, mái navy, bếp thép.

## Khoảnh khắc chữ ký (S04)
Đường cắt nét đứt chạy dọc ống trung gian → các khúc ống bật ra trượt khỏi bàn → một tia hàn mint chạy thẳng từ điện thoại khách vào bếp, tia lửa bắn → băng chuyền thẳng → các giọt tiền rơi ngược lên, bay vào két (Kasse) của quán.

## Nhạc
Bouncy funk 112 BPM, Rê trưởng (Dmaj9 – G6/9 – Em9 – A13), clavinet tổng hợp + horn stab, bass funk, trống 16 nốt có swing. Phần nỗi đau (S01–S03): groove bị "lọc" mỏng, tiếng giọt nước rỉ; S04 cắt ống → nhạc dừng 1 nhịp → hàn → full groove + horn. Nhịp thở S11 chỉ còn clav + pad. Script `audio_src/score.py` (numpy), mix −14 LUFS.

## Sự thật (đối chiếu SAMI_FACTS mục 8)
- Case đặt món online: chỉ Mizuki + +84 Kitchen (site ghi "Đặt hàng online" / "Đặt món online"). Không nói về Ads/SEO cho hai quán này.
- Không số kết quả, không % hoa hồng, không giá dịch vụ, không địa chỉ.
- "Bếp Gió · Hannover" là quán tưởng tượng (ghi "Quán minh họa"), giá món trong shop minh hoạ.
- Không logo app giao hàng / WhatsApp / Meta. Bong bóng WhatsApp vẽ bằng code. Bản đồ là giao diện Maps vẽ tay, không logo.
