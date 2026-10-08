# SAMI Motion Studio

Web app chạy trên máy (Windows) để làm video motion graphics cho SAMI Marketing Agency và khách hàng: cảnh HTML (Hyperframes) hoặc Remotion, khuôn cảnh có tham số, phong cách, footage, carousel động, cổng AI có trần chi phí, xuất NVENC.

## Hai repo đi cùng nhau

| Repo | Vai trò |
|---|---|
| **SAMI-Motion-Studio** (repo này) | app Studio: server, giao diện, engine, khuôn, phong cách, template, skill cho Claude Code |
| **[MCP-sami-media](https://github.com/tuansami/MCP-sami-media)** (private) | cổng media: stock, tạo ảnh / giọng / nhạc bằng AI, sổ chi phí, MCP server `sami-media` cho Claude Code. Studio dùng qua `"sami-media": "file:../MCP-sami-media"` |

Hai thư mục phải nằm **cạnh nhau**:

```bash
cd Z:/SAMI_Video
git clone https://github.com/tuansami/MCP-sami-media.git
git clone https://github.com/tuansami/SAMI-Motion-Studio.git SAMI_Motion_Studio
cd MCP-sami-media && npm install
cd ../SAMI_Motion_Studio && npm install
node tools/get-ffmpeg.mjs          # ffmpeg đầy đủ (NVENC) vào vendor/
npm run check                      # selftest
Start-Studio.bat                   # mở http://localhost:5178
```

Tuỳ chọn: Python có `numpy` (âm thanh carousel) và `opencv-python-headless` (tách lớp slide ảnh carousel). Đăng ký MCP cho Claude Code: xem README của MCP-sami-media.
Thư viện tài sản dùng chung (nhạc, SFX, ảnh) ở `../SAMI_Library` (không nằm trong git).

## Tài liệu
- `docs/HUONG_DAN_SU_DUNG.md`: hướng dẫn sử dụng (cho đội SAMI)
- `docs/TEMPLATE_STANDARD.md`: chuẩn khuôn, phong cách, template
- `docs/QUY_TRINH_LAM_VIEC.md`: quy trình làm video với Claude Code
- `docs/HANDOFF.md`: trạng thái phát triển (đọc đầu tiên khi mở phiên Claude Code mới)
- `CHANGELOG.md`: mọi phiên bản
