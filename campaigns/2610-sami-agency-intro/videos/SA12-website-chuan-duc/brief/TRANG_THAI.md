# SA12 · TRẠNG THÁI

**Giai đoạn:** 3/5 — dựng xong 15 cảnh (9:16 + 16:9, QA ảnh tĩnh sạch), nhạc xong, `cli-validate` 0 ✗. **BỊ CHẶN ở bước xuất MP4.**

## Chặn
- Công tắc Studio "Cho phép Claude Code xuất video" đang TẮT (`cli-render --status`). Lệnh bật `node server/cli-render.mjs --enable --request "<câu của Tuấn>"` (bước trong cloud-setup.sh) bị bộ lọc quyền auto mode từ chối ("Real-World Transactions"). Không lách. Cần Tuấn cho phép (duyệt lệnh / thêm rule Bash cho `node server/cli-render.mjs`) rồi nhắn "Tiếp tục".
- Đã gửi Tuấn contact sheet QA: `brief/SA12_contact_9x16.jpg`, `brief/SA12_contact_16x9.jpg`.

## Đã chốt
- Brief, storyboard (15 cảnh, 90,0 s), VO: `brief/`. Quán tưởng tượng "Quán Mây · Leipzig"; website cũ "asia-restaurant-leipzig.de" (ghi Minh họa).
- Look "Exploded Teardown": `hf/parts/kit.css|kit.js` — trang Quán Mây 8 lớp (L0 SEO … L7 cookie), rig CSS 3D (`K.rig`), nhãn bản vẽ (`K.leads`), khung đếm ngược (`K.item`, S04–S10). Chữ ký: S03 nổ lớp, S11 sập lại.
- Lưới nhạc 126 BPM (`K.b(n)` = nhịp cắt + n × 60/126 s). Cảnh cắt đúng phách 126 → cảnh báo "lệch nhịp 15n+1" của validate là do lưới 120 mặc định, CỐ Ý, bỏ qua (không bấm "Khớp nhịp").
- Nhạc: `audio_src/score.py` (IDM Đô thứ, 126 BPM, stutter phách 13 mỗi điểm, SFX gộp) → `public/audio/music.mp3` (−14,1 LUFS). Tái tạo: `/home/user/lemo-opuscar/.venv/bin/python audio_src/score.py` (cần numpy, scipy, soundfile, ffmpeg).
- Dữ kiện: 1,5/1,6/1,8 s (+84/Mizuki/An), DE·EN, Gutschein 25–200 € 3 năm, Allergene + PDF, đặt bàn ~30 giây (An), 1 chạm tới form (Vị), đặt món online (Mizuki, +84) — đều trong SAMI_FACTS.

## Tiếp theo (khi được phép xuất)
1. `node server/cli-render.mjs --enable --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây"`
2. Xuất 9:16 FHD 30 fps (nền): `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA12-website-chuan-duc --request "<câu trên>" --ratio 9:16 --res FHD --fps 30` → xem 6–8 khung MP4 → đổi tên `SAMI_SA12_website-chuan-duc_v1_9x16.mp4` → SendUserFile.
3. 16:9 (`--ratio 16:9`) → kiểm → SendUserFile. Commit, cập nhật file này, báo phiên điều phối `session_01ENDrWfgWowxtPX9WgXNUEt`.

## Ghi chú kỹ thuật
- QA: `node server/cli-still.mjs <dir> out/qa/X.jpg <frames> 9:16|16:9` (chạy từ thư mục app).
- `K.tick` chạy cả trong onUpdate của timeline (sau mọi tween) để nhãn/rig đọc đúng trạng thái khi tua thẳng tới khung.
- wav không commit (`.git/info/exclude`); mp3 2,1 MB có commit.
