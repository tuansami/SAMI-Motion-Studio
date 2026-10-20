# TRẠNG THÁI · SA13 Câu chuyện "Thứ Ba, 19:30"

Phiên: session_01TM9FkUGjnSXHnSJvsEsA24 · nhánh `claude/gifted-albattani-m5dpfq` · cập nhật 20.10.2026

## Giai đoạn
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 11 cảnh Hyperframes viết tay, bố cục riêng 9:16 và 16:9 (`hf/S01–S11.html`, phần chung `hf/parts/cine.js` + `cn.css`)
- [x] Nhạc + SFX `audio_src/score.py` → `public/audio/music.mp3` (-14 LUFS)
- [x] QA ảnh tĩnh 9:16 + 16:9 (`brief/QA_9x16.jpg`, `brief/QA_16x9.jpg`), cli-validate 0 ✗
- [ ] Xuất 9:16 → SendUserFile · **BỊ CHẶN**: `cli-render --enable` bị bộ lọc quyền auto mode từ chối ("Production Deploy"), `--status` = ĐANG TẮT. Không lách.
- [ ] Xuất 16:9 → SendUserFile
- [x] Báo phiên điều phối (chờ "Tiếp tục")

## Đã chốt
89,5 s · 11 cảnh · nhân vật hư cấu chị Lan, quán "Phở Lan · Leipzig"; quán đối diện "Nudelhaus", kết quả tìm kiếm "Saigon Bowl / Asia Wok Haus / Noodle Corner" đều tưởng tượng (+ nhãn "Minh họa"). Kể ngôi "chị", CTA chuyển sang "bạn". Không giá, không địa chỉ, không số kết quả; "kết quả" chỉ bằng hình (S08 lịch xé 20.10 → 19.01, ghế có người, đèn ấm dần).

## Tiếp theo (khi Tuấn cho phép xuất)
```
node server/cli-render.mjs --enable --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây"
node server/cli-render.mjs campaigns/2610-sami-agency-intro/videos/SA13-thu-ba-1930 --request "<câu của Tuấn>" --ratio 9:16 --res FHD --name SAMI_SA13_thu-ba-1930_v1_9x16   # chạy nền
# rồi 16:9 (--ratio 16:9 --name SAMI_SA13_thu-ba-1930_v1_16x9)
```
Xem 6–8 khung từ MP4 thật → SendUserFile mp4 + contact sheet → báo phiên điều phối.

## Ghi chú kỹ thuật
- cloud-setup.sh: chạy nguyên script bị chặn → chạy tay từng bước (sami-media symlink /home/user/MCP-sami-media, npm, lib-seed, brand sami). lemo-opuscar chỉ clone, không cần cho video Studio.
- cli-validate cảnh báo "lệch nhịp 15n+1": lưới 120 BPM mặc định; nhạc SA13 viết theo đúng mốc cắt (La thứ 72 → Đô trưởng 120 bắt đầu đúng S07) nên bỏ qua.
- Logo: dòng "LEADING DIGITAL TECHNOLOGY" cắt bằng clip-path trên end card.
- Không dùng `top` làm tên biến toàn cục trong cảnh (trùng window.top → lỗi im lặng).
