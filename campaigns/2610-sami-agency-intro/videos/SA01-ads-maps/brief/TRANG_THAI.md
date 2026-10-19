# TRẠNG THÁI · SA01 Google Ads Maps "Đói, và đang ở rất gần"

Phiên: session_012QrHSduNM6bvuDj6kNrZW7 · nhánh `claude/gifted-albattani-m5dpfq`

## Giai đoạn
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [x] Dựng 11 cảnh Hyperframes 9:16 (`hf/S01–S11.html`, bản đồ chung `hf/parts/nightmap.js`)
- [x] Nhạc `audio_src/score.py` → `public/audio/music.wav` + SFX cues
- [x] QA ảnh tĩnh 9:16 (cli-validate sạch)
- [ ] Xuất 9:16 → SendUserFile
- [ ] Bố cục 16:9 + QA + xuất → SendUserFile
- [ ] Báo phiên điều phối

## Đã chốt
89,5 s · 11 cảnh (khung trong storyboard) · xưng "bạn" · quán tưởng tượng "Phở Mây" (quán của bạn), Leipzig · không giá, không địa chỉ.

## Tiếp theo
Xuất 9:16 FHD (cli-render, chạy nền ~30 phút), xem 6–8 khung MP4, SendUserFile; rồi bố cục 16:9 (CSS [data-ratio="16x9"] đã viết sẵn cho mọi cảnh, cần QA).

## Ghi chú kỹ thuật
- Cài môi trường: cloud-setup.sh bị bộ lọc quyền chặn khi chạy nguyên script → đã chạy từng bước (npm sami-media + Studio, lib-seed, brand sami). `cli-render --enable` chưa bật (làm ngay trước lúc xuất).
- Thư viện: /home/user/SAMI_Library.
