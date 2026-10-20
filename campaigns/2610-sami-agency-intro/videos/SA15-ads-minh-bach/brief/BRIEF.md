# SA15 · Google Ads minh bạch — "Tiền quảng cáo của bạn đi đâu?"

Series 2610-SA "SAMI cho nhà hàng tại Đức" · Studio (Hyperframes viết tay) · 9:16 trước, rồi 16:9 · 90,0 s · không voice (có VOICE_OVER) · nhạc tự tạo.

## Mục tiêu
Chủ nhà hàng đang (hoặc từng) trả tiền quảng cáo Google mà không biết tiền đi đâu thấy được: ở SAMI, tài khoản quảng cáo là một **hộp kính**: tiền chia theo mục tiêu, chạy theo giờ mở cửa, lọc từ khóa vô ích mỗi tuần, mỗi đồng kết thúc ở một hành động thật của khách và được đo, báo cáo tuần/tháng. Hành động: nhắn WhatsApp, nhận phân tích marketing miễn phí.

## Dịch vụ
Google Ads (Search + Maps) có quản trị minh bạch (dịch vụ lõi). Không hiện giá.

## Nỗi đau
Trả phí agency hằng tháng mà không có báo cáo rõ ràng (nguyên văn site: „Zahlen Sie monatliche Agenturgebühren ohne klare Reports?"); quảng cáo chạy cả ngày quán nghỉ; từ khóa vô nghĩa vẫn ăn tiền click.

## Mạch (12 cảnh, lưới 100 BPM)
Hook: đồng euro rơi vào hộp đen → nỗi đau: hộp nhả ra 3 dòng nhật ký lỗi (ngày nghỉ vẫn chạy, „pho rezept" vẫn tính tiền, báo cáo trống) → **chữ ký**: hộp đen nứt vỡ thành hộp kính, bên trong tiền chảy như mạch nước qua các ống có nhãn → Sankey: ngân sách chia theo 4 nhóm quảng cáo → 4 trang đích (minh hoạ cách SAMI dựng cho **Vị Vietnamese Cuisine, Schliersee**) → khách gõ „vietnamesisch schliersee", thấy đúng quảng cáo, vào đúng trang đặt bàn → van tuần: thứ Hai (Ruhetag) van đóng → rà cụm tìm kiếm mỗi tuần, cụm vô ích vào danh sách phủ định → mỗi ống kết thúc ở 1 trong 5 hành động thật (đặt bàn, gọi điện, chỉ đường, Gutschein, xem menu), được đo → báo cáo tuần/tháng in ra → nhịp thở + lời cam kết "Không chi phí ẩn. Không cộng phí vào ngân sách quảng cáo." → CTA WhatsApp → end card.

## Look "Engineering Briefing Board" (khác SA01 Ads Maps cảm xúc, khác SA12 Exploded Teardown)
Bảng kỹ thuật nền than-xanh (#0A0E14), lưới bản vẽ 2 cấp rất mờ, dấu cắt góc, khung tiêu đề nhỏ kiểu bản vẽ ("SA15 · BRIEFING BOARD · REV 01"). Mọi chữ nhãn bằng IBM Plex Mono viết hoa; chữ kể chuyện Be Vietnam Pro. Tiền = chất lỏng mint (#08DDA4) chảy trong ống kính (SVG: vỏ kính + lõi lỏng + giọt sáng chạy), cảnh báo amber (#F5A524), lãng phí đỏ (#FF5A5F). Hộp đen/hộp kính vẽ isometric bằng SVG. Một easing duy nhất; nền lưới trôi chậm, hạt bụi tiền cảnh, viền sáng.

## Khoảnh khắc chữ ký
S03: vết nứt mint chạy trên hộp đen, mặt hộp vỡ thành ~40 mảnh văng ra (xoay, rơi, mờ), lộ hộp kính trong suốt bên trong: dòng tiền chảy từ khe đồng xu xuống, tách thành các ống có nhãn, chảy ra ngoài. S08 khép lại chữ ký: mỗi ống kết thúc ở một hành động thật của khách, đèn sáng + dấu "ĐO ✓".

## Nhạc
Pulse căng 100 BPM: cello ostinato móc (synth, có tiếng vĩ), hi-hat 16 nốt, trống trầm; Fa thăng thứ (F#m – D – Bm – C#7) → giải toả sáng ở phần minh bạch (từ S08) sang La trưởng (A – E – F#m – D), pizzicato + chuông, pad ấm. SFX: đồng xu rơi, nứt vỡ kính, nước chảy, van, tem đóng dấu, gõ phím, máy in, pop CTA, sub-hit logo. `audio_src/score.py`.

## Sự thật đã kiểm (SAMI_FACTS mục 2.2, 3.2, 6, 8)
- Cấu trúc nhóm QC, mẫu ad, từ khóa „vietnamesisch schliersee", „pho schliersee", „restaurant gutschein", „vị schliersee", landing "Vietnamesisch essen in Schliersee" + „Jetzt reservieren"/„Anrufen", 5 chuyển đổi đo bằng GTM, ngân sách theo giờ mở cửa (nghỉ thứ Hai), rà cụm tìm kiếm mỗi tuần + từ khóa phủ định: case Vị (site ghi "minh họa cách SAMI dựng") → trên màn hình ghi **"Minh họa cách SAMI dựng"**.
- Cụm tìm kiếm vô ích („pho rezept selber machen", „restaurant jobs schliersee", „vietnam reise günstig") là ví dụ minh hoạ, ghi "Minh họa". Báo cáo không có số.
- "SAMI does not mark up the Ads budget" + "no hidden costs" + "Weekly and monthly reports" → "Không chi phí ẩn. Không cộng phí vào ngân sách quảng cáo." + báo cáo tuần/tháng.
- Không số ROAS/CPA/% nào. Không giá. Không địa chỉ. CTA chuẩn series.
