# SAMI Agency Intro – bản tiếng Việt cho chủ quán

> **Sinh tự động** từ `templates/sami-agency-intro` + `lang/vi.json` (`node templates/sami-agency-intro/tools/build-lang.mjs vi`). Đừng sửa tay thư mục này: sửa cảnh ở mẫu gốc, sửa chữ ở `lang/vi.json`, rồi dựng lại.

Bản tiếng Việt của SAMI Agency Intro (60 giây, 12 cảnh) cho chủ nhà hàng người Việt tại Đức: hook Google Maps → logo SAMI → 8 dịch vụ → dựng brandkit, menu, website tua nhanh (nhà hàng mẫu hư cấu) → đặt bàn + đặt món → Maps/Ads → social → số đo thật → kiểm tra miễn phí + WhatsApp. Giao diện khách (Maps, web, menu) giữ tiếng Đức. Sinh tự động từ sami-agency-intro + lang/vi.json.

- Cùng 12 cảnh, cùng nhạc, cùng ảnh thật (SAMI_Library, xem README mẫu gốc mục "Ảnh thật nằm ở thư viện").
- 46 ô chữ đã đổi sang tiếng Việt; các ô còn lại là chữ trong giao diện khách người Đức thấy (Google Maps, website, đặt bàn, đặt món, menu) nên giữ tiếng Đức.
- Cảnh đặt `<html lang="vi">` → `intro.css` giãn dòng tiêu đề để dấu tiếng Việt không chồng.
- Nhà hàng trong cảnh Branding / Menu là **hư cấu** ("Saigon Atelier"), luôn có nhãn "VÍ DỤ MINH HOẠ".
