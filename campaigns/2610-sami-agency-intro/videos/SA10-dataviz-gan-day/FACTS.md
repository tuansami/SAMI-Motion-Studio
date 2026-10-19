# FACTS — mọi con số trên màn hình (SA10)

In lại: `python3 data/make_series.py` (đọc các file gốc trong `data/`).

## 1. Google Trends (chuỗi chính: lịch nhiệt + 273 cột)
- Truy vấn: cụm „in der Nähe", geo = DE, mọi danh mục, Web Search, `time=all`, độ phân giải tháng. Lấy 19.10.2026 qua API web của trends.google.com (explore → widgetdata/multiline). Bản lưu: `data/google_trends_DE_in-der-naehe_2004-2026.json`.
- Bỏ tháng 10/2026 (isPartial). Dùng 273 tháng 1/2004 → 9/2026.
- Ý nghĩa: chỉ số 0–100 = tỷ trọng các lượt tìm có cụm này trên tổng lượt tìm ở Đức, chuẩn hoá theo tháng cao nhất (= 100). Không phải số lượt. Ghi rõ trên màn hình.
- Giấy phép: dữ liệu Google Trends, dùng kèm ghi nguồn "Google Trends" theo hướng dẫn trích dẫn của Google (không phải CC). Tuấn đã chỉ định nguồn này trong giao việc.

| Trên màn hình | Giá trị | Tính từ |
|---|---|---|
| "2004–2010: gần như chưa ai gõ" | TB năm 0,9 – 1,2 | trung bình 12 tháng |
| "mùa hè luôn đậm nhất" (vòng quanh tháng 6–8, 2021–2024) | tháng cao nhất mỗi năm 2021–2026: 8, 8, 6, 8, 8, 7 | max từng năm |
| "8/2025: kỷ lục, 100" | 100 | tháng cao nhất toàn chuỗi |
| "Năm 2026 vẫn sát đỉnh" | 7/2026 = 91, 8/2026 = 89; TB 1–9/2026 = 80,8 > TB 1–9/2025 = 78,4 | |
| "TB 2019: 23" · "TB 2025: 77" · "× 3,3" · "tăng hơn ba lần" | 23,1 · 77,3 · 77,3 ÷ 23,1 = 3,35 | trung bình 12 tháng |
| "273 tháng" | 1/2004 → 9/2026 | |

Đối chiếu thêm (không lên màn hình): „Restaurant in der Nähe" (lưu `data/google_trends_DE_restaurant-in-der-naehe_2004-2026.json`) cũng tăng mạnh 2019 → 2023 (TB 20,9 → 76,8) nhưng thấp hơn sau 2023; phim chỉ dùng chuỗi „in der Nähe".

## 2. Eurostat `isoc_ci_dev_i` (waffle)
- "Individuals - devices used to access the internet", geo = DE, ind_type = IND_TOTAL (người 16–74 tuổi), unit = PC_IND (% tổng số người), năm 2025. Cập nhật 17.04.2026, lấy 19.10.2026. Bản lưu: `data/eurostat_isoc_ci_dev_i_DE_2025.json`. CC BY 4.0.
- I_IUG_MP (điện thoại / smartphone) = 87,40 → "87 / 100". I_IUG_DKPC (máy tính để bàn) = 32,71 → "33 / 100".
- "cứ 100 người Đức thì 87 người lên mạng bằng điện thoại" = 87,4 % người 16–74 tuổi (trong 3 tháng trước khảo sát).

## 3. Câu diễn giải (không phải số)
- "điện thoại thông minh nằm trong mọi túi áo": diễn đạt văn học, đỡ bằng số Eurostat 87 %.
- "Người đói không tìm quán ngon nhất nước Đức. Họ tìm quán gần đây…": đọc dữ liệu (cụm tìm kiếm là „in der Nähe"), không phải số.
- Bản đồ, tên quán (Phở Nhà, Quán Mây, Bếp Sen), sao đánh giá, nhãn "Gesponsert": **minh họa**, ghi trên màn hình.
- Dịch vụ: Google Ads (Maps) + Local SEO (Google Business Profile: ảnh, giờ mở cửa, đánh giá) — theo SAMI_FACTS mục 2.1–2.2. Không có số kết quả nào của SAMI.
