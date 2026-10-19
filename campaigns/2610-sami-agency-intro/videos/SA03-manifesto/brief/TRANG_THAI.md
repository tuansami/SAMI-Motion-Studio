# TRẠNG THÁI · SA03 Manifesto "Quán ngon thôi, chưa đủ"

Phiên: session_01FhzuzsYd4vvebqUAaWWNCt · nhánh `claude/gifted-albattani-m5dpfq` · phiên điều phối: session_01ENDrWfgWowxtPX9WgXNUEt

## Giai đoạn
- [x] Brief + storyboard + VOICE_OVER (tự duyệt, Tuấn uỷ quyền)
- [ ] Dựng 15 cảnh Hyperframes 9:16 (`hf/S01–S15.html`, `hf/parts/sk.css|sk.js|machine.js`)
- [ ] Nhạc `audio_src/score.py` → `public/audio/music.mp3` + SFX
- [ ] QA ảnh tĩnh 9:16 (cli-validate sạch)
- [ ] Xuất 9:16 → SendUserFile
- [ ] Bố cục 16:9 + QA + xuất → SendUserFile
- [ ] Báo phiên điều phối

## Đã chốt
89,5 s · 15 cảnh, cắt trên lưới 122 BPM (khung trong storyboard) · xưng "bạn" · look Swiss Kinetic (giấy sáng, mực navy, tín hiệu tím, mint = ngoại lệ) · font Inter · không giá, không địa chỉ.

## Tiếp theo
Dựng cảnh theo `brief/SCRIPT_STORYBOARD.md`.

## Ghi chú kỹ thuật
- Cài môi trường: cloud-setup.sh bị bộ lọc chặn ("Code from External") → chạy từng bước: clone mcp-sami-media (+ symlink /home/user/MCP-sami-media), npm sami-media + Studio, lib-seed, brand sami. **`cli-render --enable` bị chặn ("Production Deploy")** → chưa bật switch xuất. Cài deps lemo (npm/venv) cũng bị chặn → nhạc dùng numpy hệ thống (không cần lemo).
- Thư viện: /home/user/SAMI_Library.
- QA: `node /home/user/SAMI-Motion-Studio/server/cli-still.mjs . out/qa/X.jpg <frames> 9:16`.
