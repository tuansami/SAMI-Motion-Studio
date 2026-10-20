# TRẠNG THÁI · SA17 "Hồ sơ Google là mặt tiền thứ hai"

Phiên: session_01GSepNUm9CXrffQWtRsLGzy · nhánh `claude/gifted-albattani-m5dpfq` · cập nhật 20.10.2026

## Giai đoạn
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 10 cảnh Hyperframes viết tay, bố cục riêng 9:16 và 16:9 (`hf/S01–S10.html`, phần chung `hf/parts/dr.css` + `dr.js`)
- [x] Nhạc chill R&B 95 BPM Si giáng trưởng + SFX `audio_src/score.py` → `public/audio/music.mp3` (-14,3 LUFS)
- [x] QA ảnh tĩnh 9:16 + 16:9 (`brief/QA_9x16.jpg`, `brief/QA_16x9.jpg`), cli-validate 0 ✗
- [ ] Xuất 9:16 → SendUserFile · **BỊ CHẶN**: `cli-render --enable` bị bộ lọc quyền auto mode từ chối ("Production Deploy"). Không lách.
- [ ] Xuất 16:9 → SendUserFile
- [x] Báo phiên điều phối (chờ "Tiếp tục")

## Đã chốt
89,0 s · 10 cảnh · quán hư cấu "Hiên Nhà · Nürnberg" (+ nhãn "Minh họa" ở S02, S07, S08); đối thủ trong danh sách Maps đều tên tưởng tượng. Ảnh món: mẫu thật SAMI AI Photography (`before.webp` → `after-1.webp`, nhãn "Mẫu thật · ảnh trước và sau"). Không giá, không địa chỉ, không số kết quả. Xưng "bạn".
Chữ ký: S05 khay tráng (ảnh chìm → hiện hình → kẹp nhấc, nhỏ giọt → bay vào ảnh bìa hồ sơ trên điện thoại).

## Tiếp theo (khi Tuấn cho phép xuất)
```
node server/cli-render.mjs --enable --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây"
node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA17-ho-so-google --request "<câu của Tuấn>" --ratio 9:16 --res FHD --name SAMI_SA17_ho-so-google_v1_9x16   # chạy nền
# rồi 16:9 (--ratio 16:9 --name SAMI_SA17_ho-so-google_v1_16x9)
```
Xem 6–8 khung từ MP4 thật → SendUserFile mp4 + contact sheet → báo phiên điều phối.

## Ghi chú kỹ thuật
- cloud-setup.sh chạy nguyên script bị chặn → chạy tay: sami-media symlink `/home/user/MCP-sami-media` + npm, Studio npm, lib-seed, brand sami. `setup.sh deps` của lemo bị chặn (không cần cho Studio).
- cli-validate cảnh báo "lệch nhịp 15n+1" (lưới 120 BPM mặc định): nhạc 95 BPM viết theo đúng mốc cắt trong project.json nên bỏ qua.
- Cảnh dùng `S.bindCopy()` đầu script trước `S.words()` (runtime gắn chữ lúc DOMContentLoaded).
- Logo end card: dòng "LEADING DIGITAL TECHNOLOGY" cắt bằng clip-path (như SA13).
