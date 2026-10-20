# SA15 · TRẠNG THÁI

**Giai đoạn:** 3/5 — dựng xong 12 cảnh (9:16 + 16:9, QA ảnh tĩnh sạch), nhạc xong, `cli-validate` 0 ✗. **BỊ CHẶN ở bước xuất MP4.**

## Chặn
- Lệnh bật công tắc xuất `node server/cli-render.mjs --enable --request "<câu của Tuấn>"` (bước trong cloud-setup.sh) bị bộ lọc quyền auto mode từ chối ("Production Deploy"). Không lách. Cần Tuấn cho phép (duyệt lệnh / thêm rule Bash cho `node server/cli-render.mjs`) rồi nhắn "Tiếp tục".
- Đã gửi Tuấn contact sheet QA: `brief/SA15_contact_9x16.jpg`, `brief/SA15_contact_16x9.jpg`.

## Đã chốt
- Brief, storyboard (12 cảnh, 90,0 s = 150 phách 100 BPM), VO: `brief/`.
- Look "Engineering Briefing Board": `hf/parts/kit.css|kit.js` — bảng lưới bản vẽ, ống kính dòng tiền (`K.pipe`, đổ đầy/rút cạn theo thời gian), hộp đen/kính isometric vỡ mảnh (`K.box`), thẻ nút Sankey, biểu tượng nét. Chữ ký: S03 hộp đen nứt → vỡ → hộp kính; S08 mỗi ống kết thúc ở 1 hành động thật, "ĐO ✓".
- Cắt cảnh đúng phách 100 BPM (18 khung) → cảnh báo "lệch nhịp 15n+1" của validate là do lưới 120 mặc định, CỐ Ý, bỏ qua.
- Nhạc: `audio_src/score.py` (cello ostinato + hi-hat + trống trầm, Fa# thứ → La trưởng từ S08, SFX xu/nứt/vỡ/nước/van/tem/máy in/pop/sub-hit) → `public/audio/music.mp3` (−14,8 LUFS). Tái tạo: `/home/user/lemo-opuscar/.venv/bin/python audio_src/score.py`.
- Dữ kiện: cấu trúc nhóm QC, mẫu ad, từ khóa, landing, 5 chuyển đổi GTM, nghỉ thứ Hai, rà cụm hằng tuần = case Vị Schliersee, ghi "Minh họa cách SAMI dựng". Cụm vô ích + báo cáo ghi "Minh họa", không số. "Không cộng phí vào ngân sách quảng cáo" = FAQ "SAMI does not mark up the Ads budget".

## Tiếp theo (khi được phép xuất)
1. `node server/cli-render.mjs --enable --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây"`
2. Xuất 9:16 FHD 30 fps (nền): `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA15-ads-minh-bach --request "<câu trên>" --ratio 9:16 --res FHD --fps 30` → xem 6–8 khung MP4 → đổi tên `SAMI_SA15_ads-minh-bach_v1_9x16.mp4` → SendUserFile.
3. 16:9 (`--ratio 16:9`) → kiểm → SendUserFile. Commit, cập nhật file này, báo phiên điều phối `session_01ENDrWfgWowxtPX9WgXNUEt`.

## Ghi chú kỹ thuật
- QA: `node server/cli-still.mjs <dir> out/qa/X.jpg <frames> 9:16|16:9` (chạy từ thư mục app).
- 16:9: câu phụ đặt bằng `K.below(sub, head, gap, tl)` (đo lại mỗi khung, tránh chồng chữ khi font nạp muộn).
- wav không commit (`.git/info/exclude`); mp3 2,1 MB có commit.
