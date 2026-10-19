# SAMI Agency Intro – bản tiếng Việt kể chuyện (75 giây)

> **Sinh tự động** từ `templates/sami-agency-intro` + `lang/vi-story.json` (`node templates/sami-agency-intro/tools/build-lang.mjs vi-story`). Đừng sửa tay thư mục này: sửa cảnh ở mẫu gốc, sửa chữ ở `lang/vi-story.json`, rồi dựng lại.

Bản tiếng Việt kể chuyện của SAMI Agency Intro (~75 giây, 12 cảnh, 9:16) cho chủ nhà hàng người Việt tại Đức: tiêu đề dài, truyền cảm, có dòng dẫn chuyện; cảnh giữ lâu hơn cho người xem đọc hết. Mạch: khách đói tìm trên Google Maps mà không thấy quán → SAMI → logo, menu, web tua nhanh (nhà hàng mẫu hư cấu) → đặt bàn, đặt món không mất hoa hồng → Maps/Ads → social → số đo thật → kiểm tra miễn phí qua WhatsApp → "Để món ngon của anh chị được cả phố tìm thấy". Nhạc riêng khớp mốc cảnh. Sinh tự động từ sami-agency-intro + lang/vi-story.json.

- Cùng 12 cảnh, cùng ảnh thật (SAMI_Library, xem README mẫu gốc mục "Ảnh thật nằm ở thư viện"). 74,5 giây · khung 9:16.
- 46 ô chữ đã đổi; các ô còn lại là chữ trong giao diện khách người Đức thấy (Google Maps, website, đặt bàn, đặt món, menu) nên giữ tiếng Đức.
- 7 ô chữ thêm riêng cho bản này: S01_story, S04_story, S06_story, S07_story, S08_story, S10_story, S12_story (dòng dẫn chuyện `.story`, để trống = ẩn).
- Giữ nhịp cho kịp đọc (`holds`): S01 +4 · S02 +2 · S03 +2 · S04 +3 · S05 +2 · S06 +2 · S07 +3 · S08 +1 · S09 +2 · S10 +2 · S11 +5 · S12 +1 nhịp. Cue âm thanh và khung bìa đã dời theo.
- Nhạc riêng `public/audio/sami-intro-story.mp3` khớp mốc cảnh mới. Đổi `holds` thì dựng lại nhạc:
  `python templates/sami-agency-intro/tools/make_music.py out.wav --mp3 templates/sami-agency-intro/lang/audio/sami-intro-story.mp3 --beats 149 --marks 13,21,30,65,92,114,124,139`
- Cảnh đặt `<html lang="vi">` → `intro.css` giãn dòng tiêu đề để dấu tiếng Việt không chồng.
- Nhà hàng trong cảnh Branding / Menu là **hư cấu** ("Saigon Atelier"), luôn có nhãn "VÍ DỤ MINH HOẠ".
