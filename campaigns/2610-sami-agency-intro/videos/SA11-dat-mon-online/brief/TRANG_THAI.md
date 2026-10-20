# TRẠNG THÁI · SA11 Đặt món online "Đơn hàng về thẳng bếp của bạn"

Phiên: session_01CDiJmZDXHWWAWGtZdbfG2j · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Cài môi trường (add_repo mcp-sami-media + lemo-opuscar, `cloud-setup.sh` chạy trọn, `cli-render --enable` thành công)
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 12 cảnh Hyperframes (`hf/S01–S12.html`); engine isometric `hf/parts/iso.js` (chép từ lemo iso-infographic, đổi sang script thường), thế giới chung `hf/parts/world.js` (bàn diorama, quán Bếp Gió cắt lớp, điện thoại, ống + máy trung gian, băng chuyền SAMI, đơn hàng, tiền), `ik.css`, `phone.css`
- [x] Nhạc `audio_src/score.py` → `public/audio/music.mp3` (bouncy funk 112 BPM, Rê trưởng, clav + horn stab, −14,1 LUFS, TP −1,6) + SFX khớp hình
- [x] QA ảnh tĩnh 9:16 + 16:9 (`brief/qa/`), cli-validate 0 ✗ (⚠ "15n+1" bỏ qua: lưới cắt 112 BPM = round(ô × 450/7))
- [x] Gửi Tuấn contact sheet QA 9:16 + 16:9 (SendUserFile)
- [ ] Xuất 9:16 → SendUserFile; 16:9 → SendUserFile — **BỊ CHẶN**: lệnh `cli-render.mjs … --request` bị bộ lọc quyền auto mode từ chối (không lách)
- [x] Báo phiên điều phối (chờ "Tiếp tục")

## Đã chốt
90,0 s · 12 cảnh (42 ô nhịp 112 BPM) · xưng "bạn" · quán tưởng tượng "Bếp Gió · Hannover" (ghi "Quán minh họa"/"Minh họa") · không tên/logo app giao hàng, không % hoa hồng, không giá dịch vụ, không địa chỉ · case thật chỉ Mizuki + +84 Kitchen (đặt món online) · bong bóng WhatsApp vẽ code.

## Tiếp theo
Khi được phép chạy lệnh xuất:
1. `node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA11-dat-mon-online --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" --ratio 9:16 --name SAMI_SA11_dat-mon-online_v1_9x16` (chạy nền, ~30 phút)
2. Xem 6–8 khung từ MP4 thật → SendUserFile `SAMI_SA11_dat-mon-online_v1_9x16.mp4`
3. Lặp với `--ratio 16:9` → SendUserFile `_16x9.mp4` → báo phiên điều phối.
