# Workflow ComfyUI cho cổng cục bộ

Adapter `comfyui` gửi workflow ở thư mục này tới ComfyUI đang chạy trên máy (mặc định `http://127.0.0.1:8188`, đổi trong Studio → "Nguồn & AI" → Cổng AI cục bộ). Studio **không** cài ComfyUI hay tải model.

| Loại | File | Model gợi ý | Giấy phép |
|---|---|---|---|
| Nhạc | `ace-step-music.json` | ACE-Step (ComfyUI có node sẵn) | mở, cho thương mại (kiểm lại khi cài) |
| SFX | `stable-audio-sfx.json` | Stable Audio Open 1.0 | Stability AI Community License: miễn phí thương mại khi doanh thu < 1 triệu USD/năm |

Tránh MusicGen và F5-TTS: trọng số cấm dùng thương mại. GTX 1070 có 8 GB VRAM: chọn bản model vừa VRAM.

## Cách tạo file
1. Mở workflow chạy được trong ComfyUI.
2. Ở ô prompt gõ đúng `{{prompt}}`; ô độ dài (giây) gõ `{{seconds}}`; ô seed gõ `{{seed}}`; ô lời bài (ACE-Step) gõ `{{lyrics}}`.
3. Menu Workflow → **Export (API)** → lưu đúng tên ở bảng trên vào thư mục này.
4. Studio → "Nguồn & AI": dòng ComfyUI báo "✓ đang chạy" là dùng được.

File `.json` ở đây là cấu hình của máy, không bắt buộc commit.
