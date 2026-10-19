# FACTS · SA16 — mọi con số trên màn hình

Nguồn duy nhất: **Eurostat `sts_rb_q`** — *Business registration and bankruptcy index by NACE Rev. 2 activity, quarterly data*. Đức (DE), `indic_bt=BKRT` (Bankruptcy declarations), `s_adj=NSA` (chưa hiệu chỉnh mùa vụ), `unit=I21` (chỉ số, trung bình 2021 = 100). Số gốc do Destatis cung cấp cho Eurostat. Cập nhật 16.10.2026, lấy 19.10.2026. Giấy phép **CC BY 4.0** (Eurostat reuse policy).
API: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_rb_q?geo=DE&indic_bt=BKRT&s_adj=NSA&unit=I21 · bản lưu: `data/eurostat_sts_rb_q_DE_BKRT_I21.json` · in lại: `python3 data/make_series.py`.

| Trên màn hình | Giá trị | Cách tính |
|---|---|---|
| 30 cột quý 2019-Q1 → 2026-Q2 (NACE I = lưu trú và ăn uống, "nhà hàng, khách sạn") | 171,1 … 208,8 | nguyên số Eurostat |
| "216 · cao nhất từ 2015" / "quý I/2026: 216, kỷ lục từ 2015" | 215,8 | max của cả chuỗi 2015-Q1 → 2026-Q2; trước đó cao nhất 194,6 (2025-Q4), 184,5 (2016-Q2) |
| "TB 2019: 156" | 156,3 | trung bình 4 quý 2019 |
| "TB nửa đầu 2026: 212" | 212,3 | (215,8 + 208,8) / 2 |
| "+36 %" / "Nửa đầu 2026 cao hơn năm 2019 tới 36 %" | +35,8 % | 212,3 / 156,3 − 1 |
| Thanh 8 nhóm ngành, "2025 so với 2019" | J +49 · K–N +44 · F +33 · B–E +25 · G +21 · P–S +20 · I +19 · H +4 | TB 4 quý 2025 ÷ TB 4 quý 2019 − 1, làm tròn; mỗi ngành so với chính nó (gốc 2021 riêng từng ngành, không so mức giữa các ngành) |
| "8 / 8 nhóm ngành đều tăng" | 8/8 > 0 | như trên |
| "2020–2021: hỗ trợ COVID, tạm hoãn nghĩa vụ nộp đơn phá sản" | — | bối cảnh pháp lý: COVInsAG tạm hoãn nghĩa vụ nộp đơn (Insolvenzantragspflicht) 3/2020 → 4/2021 (từng phần, tuỳ trường hợp); chỉ số NACE I giảm từ TB 156 (2019) xuống 100 (2021) và 89,6 (2022) |
| Thang trục y | 180 → 200 → 240, luôn từ 0 | khung chỉ nới khi cột vượt khung |

Màu cột: thang phân kỳ quanh TB 2019 (156,3), nửa biên 75 → dưới mức 2019 xanh, trên đỏ; giá trị gần 2019 nhạt (không kéo giãn).
Phần "điều gì khác biệt ở quán vẫn đông" là **chữ**, không có biểu đồ hay số. Dịch vụ SAMI theo SAMI_FACTS mục 8 (Google Ads & Local SEO, website, đặt bàn/đặt món, ảnh món, social media, branding).
