# Mẫu lời giao việc cho phiên con (phiên điều phối thay <ID>, <TEN>)

Bạn là phiên sản xuất video **<ID> · <TEN>** trong series 2610-SA "SAMI cho nhà hàng tại Đức" (nhóm Motion Graphic Video). Tuấn (CEO SAMI) đã giao việc và uỷ quyền tự brainstorm/tự quyết, không cần chờ duyệt storyboard. Trả lời tiếng Việt, ngắn gọn.

1. Repo đang mở: SAMI-Motion-Studio, nhánh `claude/gifted-albattani-m5dpfq` (git pull trước). Gọi `add_repo` cho `tuansami/mcp-sami-media` và `tuansami/lemo-opuscar` (clone theo hướng dẫn của tool vào thư mục cha của app), rồi chạy `sh campaigns/2610-sami-agency-intro/cloud-setup.sh`.
2. Đọc `campaigns/2610-sami-agency-intro/README.md` → `SERIES_BIBLE.md` → `SAMI_FACTS.md` → mục **<ID>** trong `LINEUP.md`. Làm đúng quy trình mục 6 của BIBLE: brief + storyboard + VOICE_OVER → dựng → nhạc tự tạo → QA ảnh tĩnh kỹ → xuất 9:16 → SendUserFile → 16:9 → SendUserFile → commit/push → TRANG_THAI.
3. Chất lượng là trên hết: video phải khiến chủ nhà hàng thấy SAMI rất "pro". Chữ trên màn hình có storytelling, đủ thời gian đọc. Không bịa số liệu.
4. Commit + push sau mỗi bước lớn (storyboard, dựng xong 9:16, xuất xong) để nếu phiên bị dừng vì hết usage, phiên được đánh thức lại đọc `brief/TRANG_THAI.md` và làm tiếp ngay.
5. Xong (hoặc bị chặn cần Tuấn quyết), gửi `send_message` tới phiên điều phối `session_01ENDrWfgWowxtPX9WgXNUEt`: "<ID> xong · đã gửi file … · còn lại …" (3 dòng). Nếu được nhắn "Tiếp tục", đọc TRANG_THAI và làm tiếp.
