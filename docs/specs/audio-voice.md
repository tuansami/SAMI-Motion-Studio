# Spec: Thoại (voice-over) + SFX riêng — Studio 0.2.2

## Vì sao
Video SAMI bắt đầu có thoại. Trước đây `audio.cues` chỉ phát 8 SFX trong `_engine/sfx`, không có chỗ cho thoại và nhạc không tự hạ khi có người nói.

## Thay đổi (tương thích ngược, mọi trường mới là tuỳ chọn)
- `audio.voice: [{t, src, len, gain?, label?}]`: mỗi câu thoại một file trong `public/` (vd `audio/vo/S01.mp3`). `t` giây bắt đầu, `len` độ dài file (giây).
- `audio.duck` (dB, mặc định −9): nhạc hạ trong lúc có thoại, dốc lên/xuống 0,25 s (từ `t − 0,15` đến `t + len + 0,25`).
- `audio.cues[].src` (+ `len`): SFX tự tạo trong `public/` (vd `audio/sfx/phone_ring.mp3`), ưu tiên hơn `sfx`.
- Studio: kéo thời lượng cảnh (ripple) dời luôn thoại; timeline có vạch tím cho thoại; tab Âm thanh có nhóm "Thoại" (giờ, âm lượng, ghi chú, nghe thử) và thanh "Nhạc hạ khi có thoại"; SFX có `src` hiện tên file thay vì danh sách.
- `validate`: báo thiếu file thoại / SFX riêng, cảnh báo thoại quá cuối video.

## File sửa
`engine/src/core/types.ts`, `engine/src/core/AudioTrack.tsx`, `ui/app.js`, `server/validate.mjs`, `package.json` (0.2.2).
