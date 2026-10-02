# PROJECT_GUIDE — viết cảnh cho SAMI Motion Studio (dành cho Claude Code)

Owner: Tuan (CEO SAMI). Trả lời tiếng Việt, ngắn gọn, phản biện khi yêu cầu hại chuyển đổi hoặc thương hiệu.

> Quy trình phiên làm việc, cổng duyệt, câu lệnh mẫu và mẫu `brief/TRANG_THAI.md`: **`docs/QUY_TRINH_LAM_VIEC.md`** (bắt buộc đọc 1 lần). Tài liệu này chỉ nói *cách viết cảnh*.

## 1. Mô hình dữ liệu
Một dự án = một thư mục:
```
project.json   dữ liệu người dùng chỉnh trong Studio (KHÔNG hard-code chữ/thời gian trong scene)
scenes/        <ID>.tsx + index.ts (export const REG = {S01, S02, …})
public/        img/ video/ audio/ fonts/  (+ _engine/ do Studio sinh — không sửa)
brief/         BRIEF.md + tài liệu khách (đọc trước khi lên kịch bản)
out/           video xuất
```
`.history/` là kho lịch sử phiên bản (điểm neo) do Studio quản lý: **không sửa, không xoá**. Trước một thay đổi lớn (thay media, viết lại nhiều cảnh), đặt mốc bằng `node <app>/server/cli-snapshot.mjs . snapshot --label "Trước khi …"`.

### project.json (các trường chính)
```jsonc
{
  "name": "…", "client": "…",
  "formats": ["16:9", "9:16", "1:1"],        // tỉ lệ có bố cục riêng; tỉ lệ khác → chế độ "vừa khung"
  "brand": {"colors": {"mint": "#08DDA4", "purple": "#7667FE", "navy": "#0C0628"}},
  "look": {"grain": 0.05, "vignette": 0.42},
  "scenes": [ {"id": "S01", "label": "Mở đầu – …", "start": 0, "end": 121,   // base 30 fps, cắt tại 15n+1
               "animLength": 121, "warp": null, "fadeIn": 8} ],
  "copy": { "S01_title": {"label": "Tiêu đề lớn mở đầu", "scene": "S01", "value": "Khách hàng / *đang đói.*",
                           "hint": "dùng *…* để tô màu"} },
  "titles": [], "subtitles": {"enabled": false, "items": []},
  "overlays": [ {"id": "o1", "kind": "image", "src": "img/logo.png", "start": 0, "end": 5, "whole": false,
                 "pos": {"x": 0.88, "y": 0.9}, "width": 0.12, "opacity": 0.35, "anim": "fade", "layer": "top"},
                {"id": "o2", "kind": "sticker", "sticker": "arrow-curve", "color": "#08DDA4", "start": 12, "end": 15} ],
                // kind: image | sticker (arrow, arrow-curve, circle, underline, tap, check, cross, star, heart, swipe-up, sparkle, pin) | lottie (src: lottie/x.json)
                // width = fraction of the frame's SHORT side; pos = centre 0..1
  "audio": {"mode": "layers", "music": {"src": "audio/music.mp3", "gain": -4, "edit": [], "fadeOut": 2.5},
            "cues": [{"t": 4.03, "sfx": "whoosh_a", "gain": -16, "label": "chuyển chương"}]}
}
```
- **Mọi chữ hiển thị** phải là một mục `copy` có `label` tiếng Việt mô tả VỊ TRÍ (người dùng không đọc code). Key dạng `<SceneID>_<tên>`; ảnh: hậu tố `_image`/`_logo` (Studio hiện ô chọn ảnh).
- Scene đọc chữ bằng `COPY.KEY` **bên trong component** (không gán vào const cấp module — sẽ không cập nhật live).

## 2. Viết một cảnh
```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NavyBG, Card, Photo} from '@engine/components/Brand';
import {Words, TypeLabel, Chip, Counter} from '@engine/components/Text';
import {Phone, Browser} from '@engine/components/Devices';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';           // thời gian cục bộ của cảnh (đã tính warp, 30 fps chuẩn)
import {tw, keys, arrive, leave} from '@engine/lib/anim'; // MỘT easing duy nhất
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';        // 8 khung crossfade
import {C, F, GRAD} from '@engine/theme';

export const S03: React.FC = () => {
  const t = useT(); const f = useFormat();
  const size = usePick({'16:9': 96, '9:16': 104, '1:1': 88});
  return (
    <AbsoluteFill><NavyBG />
      <Words text={COPY.S03_title} start={0 + OV} style={{fontSize: size}} />
      <div style={arrive(tw(t, 15, 18))}>…</div>
    </AbsoluteFill>
  );
};
```
Đăng ký trong `scenes/index.ts` và thêm mục vào `project.json → scenes` (liền mạch: `start` = `end` cảnh trước).

## 3. Luật cứng
1. Chỉ `tw/keys/arrive/leave` (easing `cubic-bezier(0.22,1,0.36,1)`). Không spring, CSS transition, `Math.random`, `Date` (dùng `rnd(seed)`).
2. Thời gian tính bằng **khung 30 fps** qua `useT()`/`useBaseFrame()` — không dùng `useCurrentFrame()` trực tiếp (sẽ sai ở 24/60 fps).
3. `<Words>/<Counter>/<TypeLabel>` chạy theo khung Sequence → cộng `OV` vào `start`.
4. Cắt cảnh trên nhịp (15n+1 ở 120 BPM). Kéo dài cảnh bằng `warp` (Studio tự làm khi người dùng đổi thời lượng) — không viết lại animation.
5. Bố cục **từng tỉ lệ** bằng `usePick`/`f.portrait|square|landscape`; tôn trọng `SAFE` (vùng an toàn Reels/TikTok).
6. Không bịa số liệu/giá/review; không dùng tác phẩm agency khác làm portfolio; không logo nền tảng.
7. Chữ tiếng Việt: đọc to phải tự nhiên; tiếng Đức bên trong UI website/Maps.
8. Grain + vignette do engine phủ 1 lần — không thêm trong cảnh.
9. **Âm thanh chỉ ở `project.json → audio`** — không `<Audio>` trong cảnh; `<Video>`/`<OffthreadVideo>` phải `muted` (khi xuất, lượt âm thanh chỉ dựng AudioTrack).
10. Logo/watermark/mũi tên chỉ dẫn/Lottie nên đặt bằng `overlays` (người dùng tự chỉnh trong tab Ảnh chèn) thay vì code cứng trong cảnh.
11. Mẫu để dùng lại: theo `docs/TEMPLATE_STANDARD.md`; kiểm tra `node <app>/server/cli-template.mjs check <thư_mục>`.

## 4. Kiểm tra
- Studio tự rebuild preview khi file `scenes/` đổi; lỗi biên dịch hiện khung đỏ.
- Ảnh tĩnh để tự soát (từ thư mục app):
  `node server/cli-still.mjs <thư_mục_dự_án> out/qa.jpg 60,300,900 9:16` (khung ở 30 fps, nhiều khung cách bằng dấu phẩy) → Read ảnh `out/qa_<frame>.jpg`. Không khẳng định "đẹp" khi chưa xem khung hình.
- Nút **Kiểm tra** trong Studio (hoặc `validateProject`) phải không còn ✗.
- Không tự chạy render đầy đủ; đề nghị người dùng xuất bản nháp trong Studio.

## 5. Quy trình video mới (có cổng duyệt ⛔)
1. Đọc `brief/` ⛔ hỏi tối đa 4 câu còn thiếu (khán giả/ngôn ngữ, CTA + liên hệ, độ dài/tỉ lệ, tài nguyên nào là thật).
2. Kịch bản + storyboard (bảng thời gian trên lưới nhịp) ⛔ duyệt.
3. Nhạc (ElevenLabs — có phí, hỏi trước) → Studio *Phân tích nhịp* → đặt DROP/FINAL HIT vào điểm cắt.
4. Viết cảnh (≥ 4 cảnh: chia sub-agent, mỗi agent chỉ sửa file của mình).
5. QA stills 3 tỉ lệ ⛔ → người dùng chỉnh chữ/tiêu đề/âm thanh trong Studio → xuất.
