# SERIES BIBLE — "SAMI cho nhà hàng tại Đức" (series 2610-SA)

Chung cho MỌI video trong series. Mỗi phiên con đọc file này + `SAMI_FACTS.md` + đúng 1 mục của mình trong `LINEUP.md`. Không bàn lại các mục "Đã chốt" bên dưới.

## 1. Đã chốt (theo yêu cầu của Tuấn, 19.10.2026)
- **Khán giả**: chủ nhà hàng (chủ yếu người Việt) đang kinh doanh tại Đức. Họ nấu ngon, làm việc 12 tiếng/ngày, sợ trả tiền agency mà không thấy kết quả.
- **Ngôn ngữ chữ trên màn hình: tiếng Việt** (ghi đè luật "chữ tiếng Đức cho thị trường DE" của house rules — Tuấn chốt). Tiếng Đức chỉ xuất hiện **bên trong giao diện**: ô tìm kiếm Google Maps („Restaurant in der Nähe", „Pho in der Nähe", „Sushi Berlin"…), website („Jetzt reservieren", „Speisekarte", „Allergene", „Gutschein"), mẫu quảng cáo, thực đơn.
- **Độ dài 60–90 giây.** Làm **9:16 trước**, duyệt ảnh tĩnh, xuất; rồi **16:9** (bố cục riêng, không phải chỉ "vừa khung"). Carousel motion là tuỳ chọn khi LINEUP ghi.
- **Không có giọng đọc trong video**, nhưng mỗi video PHẢI có `brief/VOICE_OVER.md`: kịch bản voice-over **giọng nữ miền Bắc, chuẩn TVC quảng cáo** (ấm, sang, rõ chữ, nhịp vừa ~ 3,2 âm tiết/giây), bảng `mốc thời gian · câu đọc · ghi chú nhấn giọng/ngắt hơi`, khớp đúng cảnh. Câu VO bổ trợ chữ trên màn hình, không đọc lại y hệt. Video phải tự đứng được khi chưa có VO.
- **Nhạc tự tạo bằng code**, mỗi video một chất riêng (thể loại / BPM cảm nhận / giọng / nhạc cụ theo LINEUP). Không dùng nhạc có bản quyền, không ElevenLabs/API trả phí. Công cụ: `lemo-opuscar/core/audio/sampler.py` + `sfx.py` (nhạc cụ sample thật: `sh tools/fetch.sh instruments <lib>`), hoặc numpy tự viết, hoặc `SAMI-Motion-Studio/lib/py/sami_audio.py` cho SFX. Viết script nhạc trong dự án (`audio_src/score.py`) để tái tạo được. Mix -14 LUFS, có SFX khớp hình (whoosh ở cắt chương, click/typing ở UI, pop ở CTA, sub-hit ở logo cuối).
- **CTA chung**: nhắn **WhatsApp +49 155 60456888** (hiện đúng định dạng này) · `sami-agency.de` · lời mời "Phân tích marketing miễn phí, không ràng buộc" (đúng với ưu đãi đang công bố: *Kostenfreie Marketing-Analyse – unverbindlich und ohne Druck*; phản hồi trong 24 giờ). Nút/biểu tượng WhatsApp vẽ bằng code (bong bóng chat xanh), không dùng logo WhatsApp/Meta.
- **End card SAMI**: logo (`assets/logo-white.svg`), "Strategy • Automation • Marketing • Intelligence", WhatsApp + URL. Có thể dùng "Mehr Gäste. Mehr Umsatz. Mehr Zeit." làm câu chốt (bản Việt: "Thêm khách. Thêm doanh thu. Thêm thời gian.").
- **Thông điệp lõi của cả series**: không bán "quảng cáo" hay "website" — bán **doanh thu bền vững**: khách tìm thấy bạn → tin bạn → đặt bàn/đặt món → quay lại. Mỗi video chạm 1 nỗi đau thật rồi dẫn tới lợi ích kinh doanh.
- **Dịch vụ lõi**: Google Ads Maps + Thiết kế website (xuất hiện nhiều nhất). Các dịch vụ khác: Local SEO / SEO Maps, đặt bàn online, đặt món online, thiết kế menu (Speisekarte có Allergene), social media, branding, ảnh món (chụp + AI chỉnh ảnh điện thoại).

## 2. Giọng văn chữ trên màn hình (quan trọng nhất — Tuấn nhấn mạnh)
- **Không viết cụt.** Viết như một người kể chuyện có duyên: câu trọn vẹn, có nhịp, có hình ảnh, nối ý màn trước sang màn sau ("Nhưng…", "Và đó là lúc…", "Vì khách không tìm món ăn. Họ tìm *một chỗ để tin*."). Tiêu đề lớn 6–14 chữ, dòng phụ tới ~25 chữ.
- Mạch kể chuẩn: **Khoảnh khắc thật → nỗi đau gọi tên đúng → cái giá phải trả (bàn trống, tiền ads rơi, khách vào quán đối thủ) → bước ngoặt (SAMI làm gì, cho thấy quy trình chuyên nghiệp) → lợi ích kinh doanh → bằng chứng thật → CTA ấm áp nhưng dứt khoát.**
- Chạm cảm xúc chủ quán: bếp vẫn nóng mà bàn vẫn trống; nấu ngon hơn quán bên cạnh nhưng khách lại sang đó; trả tiền mà không biết tiền đi đâu; không có thời gian học Google; tối thứ Ba vắng hoe; Ruhetag cũng không được nghỉ vì lo.
- Xưng hô: "bạn" / "quán của bạn" / "anh chị" (chọn 1, giữ nhất quán trong video; khuyến nghị "bạn"). SAMI viết hoa.
- Không gạch ngang dài (em dash) trong chữ trên màn hình. Không emoji. Số theo kiểu Việt/Đức: 1.000 €, 1,5 giây.
- **Điểm dừng đọc**: mỗi màn chữ đứng yên đủ lâu: (số chữ ÷ 3) + 1 giây, tối thiểu 2,5 s; số liệu ≥ 2,5 s; thông điệp chính/CTA ≥ 3,5 s. Chữ đã vào thì đứng yên, chuyển động phụ (nền, hạt, UI) vẫn sống. Có ít nhất 1 "nhịp thở" (beat tĩnh 1–1,5 s) trước CTA.

## 3. Sự thật & pháp lý (không thương lượng)
- Chỉ dùng dữ kiện trong `SAMI_FACTS.md` mục 8 "An toàn". **Không bịa** số kết quả, review, thứ hạng, doanh thu. Không gán dịch vụ cho khách không có case (chỉ Vị Schliersee có Google Ads; Mizuki/An/+84 là nhận diện/website/đặt bàn/đặt món).
- Biểu đồ minh hoạ không có số thật → ghi nhỏ "Minh họa" trên màn hình. Mẫu quảng cáo/kết quả tìm kiếm minh hoạ → tên quán tưởng tượng hoặc case thật đúng phạm vi.
- **Nhà hàng tưởng tượng** được phép (đặt tên rõ ràng hư cấu, VD "Quán Mây · Leipzig", "Bếp Sen · Dresden") — kiểm tra nhanh không trùng tên quán có thật nổi tiếng.
- Logo: được dùng giao diện + logo Google trong video về dịch vụ Google (Maps/Ads/Business Profile). Không logo nền tảng khác (Meta, Instagram, WhatsApp, Lieferando, Adobe, Figma…). Công cụ thiết kế vẽ bằng code: thanh công cụ, layers, swatches, lưới, con trỏ — "công cụ chuyên nghiệp" không nhãn hiệu.
- Không tác phẩm agency khác. Không nhắc tên X3 Sales / TNG (chỉ học góc tiếp cận).
- Giá: **mặc định không hiện giá** (để kéo khách nhắn WhatsApp). Ngoại lệ chỉ khi LINEUP ghi.
- Ảnh trong `assets/` (portfolio SAMI, case Mizuki/Vị/An/+84) dùng được cho video giới thiệu SAMI; ảnh khác tải thêm từ các URL trong SAMI_FACTS mục 3.2.

## 4. Chất "agency hàng đầu" (thước đo nghiệm thu)
Mỗi video phải có ít nhất:
1. **Một hook 0–3 s gây bất ngờ** (chuyển động lạ, câu hỏi đánh trúng, một vật thể biến hình) — không mở bằng logo.
2. **Một "khoảnh khắc chữ ký"** không video nào khác trong series có (ghi trong LINEUP).
3. **Chuyển cảnh có ý đồ**: match-cut, mask wipe theo hình khối, camera push xuyên qua UI, chữ biến thành vật thể… Không chỉ crossfade.
4. **Quy trình chuyên nghiệp nhìn thấy được**: giao diện công cụ, lưới dựng hình, bảng màu, con trỏ, đồng hồ "tua nhanh ×16", thanh tiến trình, báo cáo… (đặc biệt video website / menu / branding: dựng brandkit, phối mẫu, tua nhanh).
5. Chiều sâu: 3 lớp (nền chuyển động chậm · nội dung · tiền cảnh/hạt/ánh sáng), bóng đổ mềm, parallax nhẹ.
6. Một easing duy nhất `cubic-bezier(0.22,1,0.36,1)` (Studio). Không Math.random/Date/rAF (dùng seed).

## 5. Định dạng & an toàn khung
- 9:16 = 1080×1920: không đặt chữ quan trọng ở 10 % trên và 15 % dưới; chữ ≥ 34 px; tiêu đề 72–120 px.
- 16:9 = 1920×1080: bố cục lại (chữ trái – hình phải, hoặc chia 3 cột), không phóng to bản dọc.
- Kiểm tra dấu tiếng Việt không bị cắt (line-height ≥ 1.2 với font đậm/condensed).
- Font gợi ý (đã có trong Studio): Be Vietnam Pro (chính), Bricolage Grotesque / Archivo Black / Anton (tiêu đề), Fraunces / Playfair / Cormorant (nhà hàng sang), IBM Plex Mono / JetBrains Mono (UI kỹ thuật), Caveat (viết tay). Bảng màu SAMI: navy #0C0628 · #1A1730 · tím #7667FE · #757AD6 · mint #08DDA4 · lavender #E3E4F7 · amber #F59E0B. Được đổi "look" theo LINEUP nhưng end card luôn về màu SAMI.

## 6. Quy trình cho mỗi phiên con (1 video = 1 phiên)
1. `sh campaigns/2610-sami-agency-intro/cloud-setup.sh` (cài Studio, sami-media, lemo-opuscar, thư viện, brand SAMI). Đọc `README.md` của campaign.
2. Viết `brief/BRIEF.md` (từ LINEUP), `brief/SCRIPT_STORYBOARD.md` (bảng: cảnh · giây · chữ trên màn hình · hình/chuyển động · SFX · điểm dừng đọc), `brief/VOICE_OVER.md`. **Không chờ duyệt** (Tuấn đã uỷ quyền tự brainstorm) — nhưng tự phản biện 1 vòng: đọc to chữ, đếm thời gian đọc, kiểm bảng "Sự thật".
3. Dựng: Studio (Hyperframes viết tay cho cảnh chữ ký, khuôn cho cảnh phụ nếu hợp) hoặc lemo-opuscar (theo LINEUP). Thư mục dự án: `campaigns/2610-sami-agency-intro/videos/<ID>/`.
4. Nhạc + SFX (script trong dự án) → mix.
5. QA: ảnh tĩnh mọi cảnh (cli-still / core/render/still.mjs), tờ ảnh ghép, Read và sửa đến khi sạch; `cli-validate` không ✗; lemo: `readcheck.mjs`.
6. Xuất 9:16 FHD 30 fps (Studio: `cli-render.mjs … --request "<câu yêu cầu của Tuấn trong README>"`; lemo: `core/render/video.mjs --size 1080x1920` + `mux.sh`). Xem lại 6–8 khung từ file MP4 thật. Gửi Tuấn bằng **SendUserFile** (mp4 + contact sheet).
7. 16:9: bố cục lại, QA, xuất, gửi.
8. Commit nguồn (không `out/`, không `public/_hf|_engine|_lib`, không node_modules, không wav > 5 MB) → push nhánh của phiên. Cập nhật `brief/TRANG_THAI.md`. Báo phiên điều phối (send_message) 3 dòng: tên video, file đã gửi, việc còn lại.
9. Hết usage giữa chừng: trạng thái nằm trong `brief/TRANG_THAI.md` + commit thường xuyên (sau mỗi bước lớn) để phiên được đánh thức lại làm tiếp ngay.

Tên file giao: `SAMI_<ID>_<ten-ngan>_v1_9x16.mp4` / `_16x9.mp4`.
