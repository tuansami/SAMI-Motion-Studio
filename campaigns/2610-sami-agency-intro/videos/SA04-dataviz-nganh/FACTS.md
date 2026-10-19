# FACTS — mọi con số trên màn hình

Nguồn: Eurostat, bộ `sts_setu_m` (Turnover in services – monthly data), lọc `geo=DE, nace_r2=I56, s_adj=SCA, unit=I21`, chỉ số `VOL_SLS` (Volume of sales = lượng bán thực, đã trừ giá) và `NETTUR` (Net turnover = doanh thu danh nghĩa). Số của Đức do Destatis (Statistisches Bundesamt) cung cấp (cùng thống kê GENESIS 45213). Mọi giá trị mang cờ `p` (tạm thời). Eurostat cập nhật 17.10.2026; lấy ngày 19.10.2026.
API: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_setu_m?geo=DE&nace_r2=I56&format=JSON&lang=EN&sinceTimePeriod=2018-01` → bản lưu `data/eurostat_sts_setu_m_DE_I56.json`; chuỗi dùng trong phim `data/series.json` (giữ cả giá trị gốc I21).
Giấy phép: Eurostat reuse policy, CC BY 4.0 (ghi nguồn trên màn hình).
Thử GENESIS 45213 trực tiếp: tài khoản khách (GAST) chỉ được `find`, `data/tablefile` trả lỗi 15 (cần đăng ký) → dùng bản Eurostat.

Khung (không đổi số): mỗi chuỗi chia cho trung bình 12 tháng 2019 (thực 162,333 · danh nghĩa 145,958 theo I21) rồi × 100. Trục y bắt đầu từ 0.

| Trên màn hình | Giá trị | Tính từ |
|---|---|---|
| "4/2020: còn 31" | 31,3 | VOL_SLS SCA 2020-04 = 50,8 ÷ 162,333 × 100 |
| "hai mùa đông đóng cửa" | đáy 11/2020–5/2021 | dữ liệu (đợt đóng cửa 11/2020–5/2021 là sự kiện công khai) |
| "dừng ở khoảng 80 … suốt bốn năm" | TB năm thực 2022 80,0 · 2023 81,3 · 2024 80,3 · 2025 79,1 | trung bình 12 tháng |
| "−21 % TB 2025 so với 2019" | 79,1 − 100 = −20,9 % | VOL_SLS SCA |
| "doanh thu +7,7 % (TB 2025)" | 107,7 | NETTUR SCA |
| Điểm cuối | 7/2026: thực 74,9 · danh nghĩa 110,7 | tạm thời |

Đối chiếu: Destatis công bố 2024 "Restaurants, Gaststätten…" thực −15,8 % so với 2019 (phạm vi hẹp hơn WZ 56 và bản số cũ hơn); chuỗi Eurostat WZ 56 hiện tại cho −19,7 % (2024). Phim chỉ dùng số của chuỗi đã vẽ.
Câu diễn giải ("giá tăng, khách cân nhắc từng bữa", "thị trường không lớn thêm") là đọc dữ liệu (doanh thu danh nghĩa tăng trong khi lượng bán thực giảm), không phải số.
