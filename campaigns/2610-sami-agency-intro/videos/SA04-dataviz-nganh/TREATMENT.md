# TREATMENT · SA04 · "Ngành nhà hàng Đức: mỗi vị khách đều phải giành lấy"

Style: lemo-opuscar `dataviz` (Data Storytelling) — giữ mọi bất biến của STYLE.md: giấy kem, bút chì đỏ–xanh là "diễn viên", dấu chấm = 1 con số thật, ghi chú viết tay ghim vào dữ liệu, caption kiểu chú thích hình (Newsreader), sonification là nhạc, không fade/dissolve, chuyển cảnh = thao tác biểu đồ.
Không voice trong phim (VO soạn sẵn ở `brief/VOICE_OVER.md`), chữ tiếng Việt. 1080×1920 trước, rồi 1920×1080 (bố cục lại plot box). 30 fps, 75 BPM (1/16 = 6 khung → hình và tiếng không trôi).

## Data (thật, có nguồn trên màn hình)
Eurostat `sts_setu_m` (Turnover in services, monthly) · DE · NACE I56 = Gastronomie (WZ 56) · hiệu chỉnh mùa vụ + lịch (SCA) · chỉ số 2021=100 · số gốc của Destatis · tất cả cờ `p` (tạm thời) · cập nhật 17.10.2026, lấy 19.10.2026 · CC BY 4.0.
(GENESIS 45213 chỉ cho tài khoản khách tìm bảng, không cho tải số → dùng bản Eurostat của cùng thống kê Destatis.)
Khung: tính lại mỗi chuỗi về **2019 = 100** (chia cho trung bình 12 tháng 2019). Không đổi số, trục y bắt đầu từ 0.
Sự kiện màn hình dùng (in từ `data/series.json`, xem `FACTS.md`): 4/2020 thực = 31 · TB 2025 thực = 79,1 (−21 %) · TB 2025 danh nghĩa = 107,7 (+7,7 %) · 7/2026 thực = 74,9 (tạm thời).

## Ba cấu trúc ứng viên
1. **Câu hỏi trước** — một khung trống chỉ có đơn vị "2019 = 100" và câu hỏi viết tay; bút chì lơ lửng → vẽ từng tháng 2019→2026 → hai đường (thực / danh nghĩa) tách nhau → tiêu đề bị gạch, viết lại sự thật → khung lùi, thành tấm thiệp giấy dẫn sang SAMI.
2. **Biểu đồ đã xong, kể ngược** — mở bằng cả đường 2019–2026, lặn vào tháng 4/2020, rồi kéo ra.
3. **Slope 2019 → 2025** — hai cột năm đối diện nhau, đường danh nghĩa đi lên, đường thực đi xuống.
**Chọn 1**: khán giả là chủ quán đang nghĩ "ngành đã ổn rồi" — câu hỏi mở đầu đánh vào chính niềm tin đó, và cái kết "sửa tiêu đề" là điểm lật cảm xúc tự nhiên. Slope (3) được dùng *bên trong* cảnh 5 như một khoảnh khắc so sánh.

## Logline & arc
Một đường bút chì kể 7 năm của ngành nhà hàng Đức: rơi, hồi lại, rồi dừng ở khoảng 80 — tiền vào két nhiều hơn chỉ vì giá tăng; trong một thị trường không lớn thêm, quán thắng là quán được tìm thấy trước và được tin trước.
Setup (ngành bình thường, 2019 = 100) → Turn (đường thực dừng ở ~80 trong khi danh nghĩa vượt 100: khoảng cách là giá) → Ending (tiêu đề "đã hồi phục?" bị gạch, viết lại; khung giấy dẫn sang SAMI, end card).

## Benchmark (chỉ học ngữ pháp)
- Học: nhịp "một ý một lúc" + ghim chú thích của scrollytelling báo chí; cách để một chấm làm nhân vật; im lặng trước con số.
- Không lấy: bố cục, biểu đồ, kiểu chữ, màu của bất kỳ tác phẩm nào; không lấy câu chuyện/cấu trúc demo của style.

## Shot list (một tờ giấy, một cú máy, camera 2D)
| # | giây | khung | máy | vì sao |
|---|---|---|---|---|
| 1 | 0–9,6 | trung cảnh khung trống + tiêu đề | locked-off, bút chì lơ lửng, đẩy nhẹ vào ô câu hỏi | câu hỏi là hook, khung trống gây tò mò |
| 2 | 9,6–19,2 | cận 2019, chấm mới ở ~60 % bề ngang | track theo bút | "bình thường" phải được cảm nhận bằng nhịp đều |
| 3 | 19,2–28,8 | cận → punch-in khi 3/2020 rơi, rung tắt dần | punch-in + jolt | cú sốc; im lặng trước tháng 4/2020 |
| 4 | 28,8–41,6 | kéo ra dần khi 2022–2026 hiện | pull-back + trục x mọc | hồi lại nhưng dừng; cần thấy toàn cảnh để thấy "không về 100" |
| 5 | 41,6–52,8 | toàn cảnh, đường danh nghĩa vẽ đè | locked-off (sự biến đổi là chuyển động) | khoảng cách giữa 2 đường = giá |
| 6 | 52,8–62,4 | đẩy vào tiêu đề | push-in lên tiêu đề | "headline revised": bút gạch và viết lại |
| 7 | 62,4–72,0 | ô "tháng tới" nét đứt → nở thành tấm thiệp giấy | cell widening (pull + pan) | chuyển ý sang hành động: quán nào được tìm thấy trước |
| 8 | 72,0–84,8 | end card SAMI (navy) mọc lên từ một khối mực trong ô | locked-off | CTA đọc được, đứng yên ≥ 6 s |

## Beat sheet (75 BPM, 1 nhịp = 0,8 s, 1 ô nhịp = 3,2 s)
- 0,0 bút chì lơ lửng trên khung trống; trục y vẽ ra (ruler hiss), nhãn "2019 = 100".
- 0,8 tiêu đề in: "Ngành nhà hàng Đức đã hồi phục chưa?"
- 2,4 câu hỏi viết tay (xanh): "Nếu 2019 là 100, hôm nay còn bao nhiêu?"
- 9,6–19,2 12 chấm 2019, mỗi nhịp 1 chấm (plonk gỗ). Ghi chú xanh "2019: bếp nóng, bàn kín. Mức 100."
- 19,2 bút đổi đầu đỏ (click gỗ). 2020-01, 02 bình thường → 2020-03 rơi (punch-in) → im lặng 1 nhịp → 2020-04 = 31 (tiếng đầu tiên sau im lặng). Ghi chú đỏ "4/2020: còn 31. Cả nước đóng cửa."
- 2020–2021 chấm 1/8 nhịp, lên xuống theo các đợt đóng cửa.
- 28,8 2022–2026 chấm 1/16 nhịp (bút vội), đường lên rồi nằm ngang ~80; camera kéo ra, trục x mọc (năm).
- 38,4 đường gạch nối mức 100 "mức 2019"; ngoặc khoảng cách "−21 % (TB 2025)".
- 41,6 bút đổi về xanh; đường danh nghĩa vẽ đè (gỗ → kim loại vì giá trị cao hơn) → vượt 100, "+7,7 %".
- 46,4 tô khoảng giữa 2 đường; ghi chú tay "giá tăng, khách cân nhắc từng bữa".
- 52,8 im lặng 1 nhịp; đẩy lên tiêu đề, bút gạch "đã hồi phục chưa?", viết "không lớn thêm. Mỗi vị khách phải giành lấy."
- 62,4 ô nét đứt sau tháng 7/2026 "tháng tới: khách chọn quán nào?" → ô nở thành tấm thiệp: "quán thắng là quán được tìm thấy trước và được tin trước" + 2 hình bút chì: ghim bản đồ, khung website.
- 72,0 nhịp thở 1,2 s → khối mực navy mọc từ đáy ô → end card SAMI.
- 84,8 hết.

## Cue map
| phần | giây | ô nhịp | nhạc |
|---|---|---|---|
| A câu hỏi | 0–9,6 | 1–3 | drone ấm Fa trưởng, celesta lơ lửng 2 nốt |
| B 2019 | 9,6–19,2 | 4–6 | plonk mỗi nhịp (pentatonic quanh Fa4), pad mềm, kick rất nhẹ |
| C sốc | 19,2–28,8 | 7–9 | hòa âm tối xuống Rê thứ, nốt rơi không lượng tử (giá trị cực), im lặng 1 nhịp trước 4/2020 |
| D hồi | 28,8–41,6 | 10–13 | 1/16 plonk, shaker, sub; ổn định Si giáng trưởng nhưng không về chủ âm |
| E hai đường | 41,6–52,8 | 14–16,5 | đường danh nghĩa: plonk sáng kim loại; pad mở rộng |
| F sửa tiêu đề | 52,8–62,4 | 16,5–19,5 | im lặng hoàn toàn 0,8 s → celesta + piano nốt dài |
| G thiệp | 62,4–72,0 | 19,5–22,5 | nhịp lại lên, kick ấm, hướng về Fa trưởng |
| H end card | 72,0–84,8 | 22,5–26,5 | 1,2 s thở → sub-hit + celesta chủ âm, pop ở WhatsApp, ngân dài |

## Âm thanh
| phần | nền | foley | nhạc |
|---|---|---|---|
| A | phòng yên, tiếng giấy rất nhẹ | thước kẻ (ruler hiss) khi trục mọc, sột soạt viết tay | drone |
| B | tiếng bếp xa rất nhỏ (noise lọc) | tap bút + giấy mỗi chấm | plonk + pad |
| C | nền tắt dần | click gỗ đổi đầu bút, giấy "thủng" ở punch-in | tối, im lặng trước 4/2020 |
| D | — | tap dày, ratchet khi trục mở rộng | 1/16 |
| E | — | quét giấy khi tô vùng | sáng dần |
| F | im lặng | gạch bút (scratch dài) | celesta |
| G | — | ô nét đứt "tick", giấy lật mở | build |
| H | — | sub-hit logo, pop bong bóng WhatsApp | kết |

## Thiết kế chữ
- Tiêu đề biểu đồ: Newsreader 600, đặt trong không gian thế giới trên plot box.
- Caption = chú thích hình: Newsreader, mực, canh trái theo biểu đồ, ≤ 2–3 dòng, kicker mono (IBM Plex Mono) "2019 → 2020…".
- Ghi chú: Caveat viết tay, xanh = ký ức/con người, đỏ = cảnh báo/kỷ lục.
- Dòng nguồn cố định cuối khung (mono nhỏ): nguồn + giấy phép + "2019 = 100, số tạm thời".
- Thời gian đọc: luật BIBLE (số chữ ÷ 3 + 1 s, tối thiểu 2,5 s; số liệu ≥ 2,5 s; CTA ≥ 3,5 s) + `readcheck.mjs`.
- End card: màu SAMI (navy #0C0628, mint #08DDA4, tím #7667FE), Be Vietnam Pro, logo `assets/logo-white.svg`, bong bóng chat xanh vẽ bằng code (không logo WhatsApp).
