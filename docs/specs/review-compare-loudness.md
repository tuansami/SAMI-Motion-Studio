# Spec: Gói duyệt khách + So sánh điểm neo + Chuẩn −14 LUFS — Studio 0.4.0

## Vì sao
- **Duyệt chậm:** muốn khách góp ý theo từng cảnh thì phải render video đầy đủ, khách nhắn "phút 0:37 chữ hơi nhỏ", rồi phải tự dò lại cảnh.
- **Khó chọn bản:** sau nhiều lượt AI sửa, không biết bản cũ trông thế nào nếu không khôi phục thử.
- **Âm lượng không đều:** mỗi video một mức. Reels/TikTok/YouTube tự hạ những video quá to, còn video quá nhỏ thì nghe yếu.

## 1. Gói duyệt (`server/review.mjs` → `buildReview`, chạy trong `cli-review.mjs`)
- Mỗi cảnh render 1 ảnh ở khung giữa `round((start+end)/2)`, cho từng tỉ lệ của `project.formats`, scale 0.5, có tiêu đề và phụ đề.
- Đầu ra nằm ở `out/review/<YYYY-MM-DD_HHMM>/`:
  - `review.html`: tự chứa, ảnh nhúng base64 (khoảng 2 MB cho 16 cảnh × 2 tỉ lệ). Gồm ô góp ý chung, ô góp ý cho từng cảnh (tự lưu bằng localStorage), và nút **Sao chép góp ý** xuất văn bản dạng `Sxx (m:ss): …`.
  - `contact_<ratio>.jpg`: lưới mọi cảnh. Dựng bằng HTML, chụp bằng Chrome headless của Remotion qua CDP, vì ffmpeg đi kèm không có `tile`/`overlay`.
  - `stills/<ratio>/<scene>.jpg`.
- Server: `POST /api/review {id}` chạy một task con. Tiến độ gửi qua SSE `task`; `GET /api/tasks` trả danh sách task; `GET /api/review/list?id=` trả 10 gói gần nhất.
- `POST /api/review/feedback {id, text}` ghi thêm vào `brief/GOP_Y.md`: mỗi lần là một mục `## <thời gian>`, mỗi dòng góp ý thành `- [ ] …`.
- UI (tab Xuất → nhóm "Gói duyệt khách"): nút Tạo gói duyệt, nút **＋ Bản xem 540p** (đưa vào hàng đợi render với `res: '540p'`, CRF 28), link mở trang duyệt và contact sheet, ô dán góp ý.

## 2. So sánh 2 phiên bản (`compareSnapshots(dir, a, b='current')`)
- Mỗi điểm neo được dựng lại thành thư mục `.studio/compare/<proj>/v_<id>/` bằng `materialize` (hardlink object, nếu không được thì copy). Tự dọn sau 24 h.
- Chụp ảnh mọi cảnh của cả 2 bản ở tỉ lệ đang xem, scale 0.3.
- **"Giống nhau"** khi sha bằng nhau, hoặc khi ảnh xám 64×36 (ffmpeg `scale` → `image2pipe` rawvideo) lệch dưới 12/255 ở mọi ô.
  - Lý do: render GPU không cho ra ảnh giống hệt từng bit; nhiễu đo được tối đa Δ≈5 ở độ phân giải gốc, và về 0 sau khi thu nhỏ.
  - Thay chữ cho Δ≈170.
- Route `POST /api/history/compare {id, a, b, ratio}` chạy task. Ảnh phục vụ qua `/cmp/…` (chặn thoát ra ngoài thư mục).
- UI: nút **So sánh** ở mỗi điểm neo mở hộp hiện cặp ảnh cũ | hiện tại, chỉ cho các cảnh khác nhau, kèm nút "Khôi phục điểm neo này…".

## 3. Chuẩn âm lượng (`server/ffmpeg.mjs` → `normalizeLoudness`)
- Dùng loudnorm 2 lượt (EBU R128): lượt 1 đo, lượt 2 áp với `linear=true`, xuất 48 kHz s16. Chạy bằng `spawn` async, không khoá server.
- Áp lên `audio.wav` của lượt render trước khi mux. Kết quả lưu `audio_norm_<n>.wav` + `.ok`, nên Tiếp tục render không phải làm lại.
- Thiết lập `render.loudness` nhận `-14` (mặc định), `-16` hoặc `'off'`. Nếu ffmpeg thiếu `loudnorm` hoặc âm thanh gần như im lặng thì bỏ qua và ghi chú.
- Ghi chú trên job, ví dụ "Âm lượng −16.3 → −14.0 LUFS".
- Đo lại file mp4 xuất ra được −14,01 LUFS.
- Thêm độ phân giải **540p** (scale 0.5, GPU 4 Mbps) cho bản xem nhanh.

## 4. Sửa lỗi phát hiện khi làm
- **Render dùng media cũ:** `bundle()` của Remotion copy `public/` vào bundle, nhưng cache bundle chỉ tính theo code (`codeHash`). Vì vậy thay ảnh hoặc nhạc **cùng tên** thì video xuất ra vẫn dùng file cũ.
- **Cách sửa:** `codeHash` (dùng cho bundle render và khoá các đoạn) tính thêm stat của `public/`, trừ `_engine`. Preview esbuild vẫn chỉ tính code, vì preview đọc `public/` trực tiếp.

## Tương thích
- Không đổi schema `project.json`.
- `render.loudness` thiếu thì mặc định −14. Vì vậy bản xuất mới sẽ có âm lượng khác bản cũ một chút; muốn giữ như cũ thì chọn Tắt.

## File
Mới: `server/review.mjs`, `server/cli-review.mjs`.
Sửa: `server/ffmpeg.mjs`, `server/render.mjs`, `server/project.mjs`, `server/preview.mjs`, `server/index.mjs`, `server/selftest.mjs`, `ui/*`, skill, docs.
