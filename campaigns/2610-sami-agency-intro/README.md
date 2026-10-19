# Campaign 2610-SA — Series motion graphic giới thiệu SAMI cho nhà hàng tại Đức

Phiên điều phối: chat gốc của Tuấn (19.10.2026). Mỗi video = 1 phiên con trong nhóm "Motion Graphic Video" (tag `motion-graphic-video`), tối đa 2 phiên chạy song song.

## Đọc theo thứ tự (phiên con)
1. `SERIES_BIBLE.md` — luật chung, giọng văn, sự thật, quy trình, giao file.
2. `SAMI_FACTS.md` — dữ kiện đã kiểm chứng từ sami-agency.de (mục 8: an toàn / không được dùng).
3. `LINEUP.md` — CHỈ mục của video mình.
4. Bộ máy: Studio → `CLAUDE.md` của app + skill `claude-code/skills/sami-motion-studio/SKILL.md` (+ references cần thiết, `lib/hf/khuon/CATALOG.md`). lemo → `../lemo-opuscar/AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md`, `styles/<style>/STYLE.md`.

## Cài đặt (máy cloud)
Gọi `add_repo` cho `tuansami/mcp-sami-media` và `tuansami/lemo-opuscar`, rồi `sh campaigns/2610-sami-agency-intro/cloud-setup.sh`.
Đã thử 19.10: Studio chạy trên Linux; render 9:16 FHD CPU ≈ 12 phút cho 32 s (Hyperframes clip + Remotion ghép) → video 75 s ≈ 25–30 phút mỗi tỉ lệ. Chạy render ở chế độ nền (run_in_background), không poll.
`npm run check` còn 2 ✗ đã biết, không chặn việc làm video (placeholder ảnh khuôn thiếu trong thư viện; trộn âm "xuất thuần").

## Bài học từ các phiên trước (đọc kỹ)
- SA01: chạy cả `cloud-setup.sh` một lần có thể bị bộ lọc quyền chặn → chạy từng bước trong script bằng tay.
- SA01: `project.json → audio.music.fadeOut` phải > 0 (0 làm Remotion lỗi inputRange).
- SA02: lệnh `cli-render.mjs … --request` có lúc bị bộ lọc quyền auto mode từ chối. KHÔNG lách: báo phiên điều phối, làm tiếp phần không cần render, chờ.
- Tham khảo chất lượng/cấu trúc: `videos/SA01-ads-maps/` (11 cảnh Hyperframes viết tay, nhạc numpy) — chỉ học kỹ thuật, không lặp look/mạch kể.

## Nơi lưu
- Dự án mỗi video: `campaigns/2610-sami-agency-intro/videos/<ID>-<ten-ngan>/` (Studio project hoặc lemo film folder). Commit nguồn, KHÔNG commit `out/`, `public/_hf|_engine|_lib`, `node_modules`, `.venv`, mp4.
- MP4 giao Tuấn bằng **SendUserFile** trong phiên của video đó (+ contact sheet JPG).
- Nhánh git: `claude/gifted-albattani-m5dpfq` của SAMI-Motion-Studio (`git pull --rebase` trước khi push; mỗi phiên chỉ sửa thư mục video của mình — không sửa LINEUP/BIBLE, phiên điều phối sửa).

## Yêu cầu gốc của Tuấn (nguyên văn, dùng cho `cli-render --request`)
> Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây. Tất cả sử dụng tiếng Việt (từ khóa có thể dùng tiếng Đức khi tìm kiếm). Tạo video motion graphic giới thiệu SAMI Marketing Agency … Chủ yếu tới đối tượng nhà hàng. Các dịch vụ: Thiết kế website, đặt bàn, đặt món, google ads Maps, Local SEO, THIẾT KẾ MENU, SOCIAL MEDIA, BRANDING … style năng động, chuyên nghiệp … hoạt cảnh, hiệu ứng sống động, bất ngờ, đậm chất agency sáng tạo hàng đầu. Video định dạng 9:16 và 16:9. Làm phiên bản dọc trước. Nhạc tự tạo, khác biệt giữa các video. CTA nhắn tin qua WhatsApp … phần thiết kế menu, website, branding phải show ra quy trình dựng brandkit bằng các công cụ chuyên nghiệp, sử dụng hiệu ứng tua nhanh khi thiết kế, phối mẫu (có thể sử dụng từ An hoặc Mizuki, hoặc tạo các mẫu nhà hàng tưởng tượng). Video intro nhưng cũng cần có sự chuyển đổi tốt … lợi ích cốt lõi mà chúng tôi giúp cho các nhà hàng tại Đức … Các dịch vụ cốt lõi là Google Ads Maps và Thiết kế website. Text trên màn hình cần có văn phong mượt mà, không được ngắn gọn, cần có storytelling, liền mạch, có sức hút … chạm vào cảm xúc nỗi đau của chủ nhà hàng … Thử nghiệm 3 video dùng style Data Storytelling … 2 video dạng phim cũng ở trong repo lemo-opuscar … Tất cả video đều cần có điểm dừng hợp lý để khán giả có thể đọc hết nội dung. Tất cả video đều không có voice, nhưng cứ làm sẵn kịch bản voice over, giọng nữ chuyên TVC quảng cáo miền bắc.

## Quyết định còn mở (Tuấn chốt sau, mặc định đang dùng)
- Hiện giá (website ab 1.000 €, online bestellen ab 700 €)? Mặc định: **không**.
- Dùng "50+ khách hàng toàn cầu"? Mặc định: chỉ dùng khi cần, ghi đúng "trên toàn cầu".
- Địa chỉ văn phòng (mâu thuẫn mã bưu chính 07980/07570): **không hiện**.
