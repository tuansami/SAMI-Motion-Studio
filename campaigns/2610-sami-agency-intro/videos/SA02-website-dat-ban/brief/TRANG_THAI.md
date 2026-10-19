# SA02 · TRẠNG THÁI

**Giai đoạn:** 3/5 — dựng xong 12 cảnh (9:16 + 16:9, QA ảnh tĩnh sạch), nhạc xong. **BỊ CHẶN ở bước xuất MP4.**

## Chặn
- `node server/cli-render.mjs … --request "<câu của Tuấn>" --ratio 9:16 --res FHD --fps 30` bị bộ phân loại quyền của Claude Code (auto mode) từ chối 2 lần ("Production Deploy"), dù Studio switch đã BẬT (cloud-setup). Không lách. Cần Tuấn cho phép (thêm rule Bash cho `node server/cli-render.mjs`, hoặc duyệt lệnh) rồi nhắn "Tiếp tục".

## Đã chốt
- Brief, storyboard (12 cảnh, 89,5 s), VO: `brief/`. Quán tưởng tượng "Bếp Sen · Dresden", đối thủ "Lokal Nebenan", khách "Weber".
- Cảnh Hyperframes viết tay `hf/S01–S12.html` + `hf/parts/kit.css|kit.js` (website Bếp Sen, món vẽ code, cửa sổ công cụ, con trỏ). Chữ ký S05: dựng ×16 → phanh ×1 → chạm „Jetzt reservieren".
- Nhạc: `audio_src/score.py` (future-funk F trưởng, 120 BPM, Rhodes FM, slap bass, click chuột, tape-stop 34,6 s, SFX gộp) → `public/audio/music.mp3` (−14 LUFS). Tái tạo: `../../../../../lemo-opuscar/.venv/bin/python audio_src/score.py`.
- Case thật S09: Mizuki 1,6 s · An Vegan ~30 giây · +84 Kitchen 1,5 s · Vị 1 chạm tới form (nguồn sami-agency.de).

## Tiếp theo (khi được phép xuất)
1. Xuất 9:16 FHD 30 fps (nền, ~30 phút) → xem 6–8 khung từ MP4 → đổi tên `SAMI_SA02_website-dat-ban_v1_9x16.mp4` + contact sheet → SendUserFile.
2. Xuất 16:9 (`--ratio 16:9`) → kiểm → SendUserFile.
3. Commit, cập nhật file này, send_message phiên điều phối `session_01ENDrWfgWowxtPX9WgXNUEt`.

## Ghi chú kỹ thuật
- Setup: `sh campaigns/2610-sami-agency-intro/cloud-setup.sh` (sau add_repo mcp-sami-media + lemo-opuscar, clone vào /home/user).
- QA: `node server/cli-still.mjs <dir> out/qa/X.jpg <frames> 9:16|16:9`. `cli-validate` sạch.
- wav không commit (đã thêm vào .git/info/exclude cục bộ); mp3 2,9 MB có commit.
