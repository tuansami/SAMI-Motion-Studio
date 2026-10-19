# TREATMENT · SA16 · "Khó khăn không chừa ai, nhưng có quán vẫn đông"

Style: lemo-opuscar `dataviz` (Data Storytelling). Giữ mọi bất biến của STYLE.md: giấy kem, bút chì đỏ–xanh là diễn viên duy nhất, mỗi cột = một con số thật, ghi chú viết tay ghim vào dữ liệu (data space), caption kiểu chú thích hình (Newsreader), sonification là nhạc, không fade/dissolve (chuyển cảnh = thao tác biểu đồ: ratchet, morph, pan thêm data).
Không voice trong phim (VO soạn sẵn `brief/VOICE_OVER.md`). Chữ tiếng Việt; tiếng Đức chỉ trong cụm tìm kiếm („Restaurant in der Nähe") và „Gutschein". 1080×1920 trước, rồi 1920×1080 (bố cục lại). 30 fps, **100 BPM** (1 nhịp = 18 khung, 1/8 = 9 khung → hình và tiếng không trôi). Dài ≈ 87 s.

## Data (thật, nguồn + giấy phép trên màn hình)
**Eurostat `sts_rb_q`** — Business registration and bankruptcy index, theo quý · Đức · *Bankruptcy declarations* · không hiệu chỉnh mùa vụ · **chỉ số, trung bình 2021 = 100** · số gốc của Destatis · cập nhật 16.10.2026, lấy 19.10.2026 · CC BY 4.0. (GENESIS của Destatis không cho tài khoản khách tải số → dùng bản Eurostat của cùng thống kê.)
- Chuỗi chính: NACE I (Gastgewerbe = lưu trú + ăn uống), 2019-Q1 → 2026-Q2 (30 quý; 2026-Q3 chưa công bố).
- So sánh ngành: trung bình 2025 ÷ trung bình 2019 của 8 nhóm ngành (mỗi ngành so với chính nó, vì mỗi chỉ số có gốc 2021 riêng → không so mức giữa các ngành).
- Trục y luôn bắt đầu từ 0. Khung chỉ nới ra khi data vượt khung (ratchet), không bao giờ co lại để phóng đại.
Mọi con số trên màn hình: `FACTS.md` (in lại bằng `python3 data/make_series.py`).

## Khác SA04 và SA10 (cùng style)
| | SA04 | SA10 | **SA16** |
|---|---|---|---|
| biểu đồ | đường doanh thu theo tháng | lịch nhiệt → dãy cột → waffle | **cột theo quý + khung ratchet**, morph thành **thanh ngang xếp hạng 8 ngành** |
| mở | khung trống + câu hỏi | vật thể (ô tìm kiếm điện thoại) | **một dấu duy nhất: cột kỷ lục xuyên thủng khung giấy** (cận cực đại), rồi tua về 2019 |
| chữ ký | gạch sửa tiêu đề | ô 8/2025 punch-in | **khung biểu đồ "lên nấc" (ratchet) từng tiếng tách cho tới khi chứa nổi cột kỷ lục; vết rách ở mép khung còn lại như sẹo** |
| chuyển ý | ô "tháng tới" nở thành thiệp | quay về điện thoại/bản đồ | **lật sang nửa tờ giấy trắng: danh sách viết tay 4 điều, không biểu đồ** |
| kết | thiệp → end card | vòng bán kính nở | **một cột navy mọc từ đáy khung lên lấp kín màn hình** → end card |
| nhạc | 75 BPM Fa trưởng, celesta | 90 BPM Rê thứ → Rê trưởng, pulse | **100 BPM Mi thứ (nhịp tim "lub-dub", bánh cóc gỗ, plonk tối) → Sol trưởng (Rhodes FM, cọ trống, sáng dần)** |

## Ba cấu trúc ứng viên
1. **Một dấu trước, cả chuỗi sau** — mở bằng cận cột quý I/2026 xuyên thủng mép khung; máy lùi, lia trái về 2019; dựng lại từng quý; khung nới từng nấc khi các cột 2025 chạm trần, cuối cùng nuốt được cột kỷ lục; morph sang thanh ngang 8 ngành ("không chừa ai"); im lặng; danh sách viết tay 4 điều của "quán vẫn đông"; SAMI; cột navy → end card.
2. **Đua cột 8 ngành theo năm** (bar race 2019 → 2025) — động nhưng chỉ số mỗi ngành có gốc riêng → xếp hạng mức là sai; chỉ xếp được mức thay đổi.
3. **Slope 2019 ↔ 2026** — hai cột đối diện, gọn nhưng mất cú "đáy giả" 2020–2022 (hỗ trợ + tạm hoãn nộp đơn), chính là điều khiến chủ quán chủ quan.
**Chọn 1**: hook là một kỷ lục có thật nhìn thấy được (cột phá khung), cấu trúc trả lời "vì sao lại thế" bằng chính chuỗi số, và ratchet là phép biểu đồ duy nhất diễn tả đúng cảm giác "năm nào cũng tệ hơn năm trước". So sánh 8 ngành (từ ý 2) được dùng đúng cách: mức thay đổi 2019 → 2025, mỗi ngành so với chính nó.

## Logline & arc
Chỉ số phá sản ngành nhà hàng, khách sạn ở Đức lên nấc mỗi năm từ 2023 tới kỷ lục quý I/2026, và không ngành nào thoát; nhưng ngay trên cùng con phố vẫn có quán kín bàn, vì họ làm đúng bốn điều mà SAMI làm cho nhà hàng.
Setup (một cột phá khung; 2019 bình thường; 2020–22 lặng xuống vì hỗ trợ) → Turn (2023 → 2026: khung phải nới hai lần; +36 % so với 2019; cả 8 ngành đều tăng) → Ending (im lặng; "vậy vì sao có quán vẫn đông?"; 4 điều viết tay; SAMI gắn tên dịch vụ vào từng điều; cột navy mọc lên thành end card).

## Benchmark (chỉ học ngữ pháp)
- Học: biểu đồ cột "phá khung" của báo dữ liệu (giữ thang thật, để dữ liệu tự tràn ra); cách scrollytelling đổi khung từng nấc khi số vượt trần; nhịp "câu hỏi viết tay trên trang trắng" của sổ tay nhà báo.
- Không lấy: bố cục, màu, kiểu chữ của tác phẩm nào; không lấy câu chuyện/cảnh của demo style.

## Shot list (một tờ giấy, một cú máy, camera 2D)
| # | giây | khung | máy | vì sao |
|---|---|---|---|---|
| 1 | 0–4,8 | cận cực đại đỉnh cột 2026-Q1, mép khung bị rách | locked-off, rung nhẹ khi xuyên khung | hook: một dấu = một sự thật, chưa có trục |
| 2 | 4,8–9,6 | cận → toàn trục x | **pull-back** rồi **track trái** theo bút kẻ trục về 2019 | "hãy quay lại từ đầu" |
| 3 | 9,6–19,2 | trung cảnh, cột mới ở ~60 % bề ngang | **track** theo bút | 2019 bình thường, 2020–22 lặng xuống |
| 4 | 19,2–31,8 | toàn khung | **pedestal** lên theo trần + jolt ở mỗi lần ratchet, punch-in ở kỷ lục | leo thang; khung không đủ chỗ |
| 5 | 31,8–38,4 | toàn khung + ngoặc đỏ | locked-off | so sánh với 2019: +36 % |
| 6 | 38,4–50,4 | bảng thanh ngang 8 ngành | **crane xuống** (morph quét) | không chừa ai |
| 7 | 50,4–56,4 | nửa dưới tờ giấy trắng | im lặng, **pan xuống**, câu hỏi viết tay | bước ngoặt |
| 8 | 56,4–75,6 | danh sách 4 điều + nhãn dịch vụ SAMI | **push-in** chậm từng dòng rồi kéo ra | trả lời bằng chữ, không biểu đồ bịa |
| 9 | 75,6–87 | nhịp thở → cột navy mọc → end card | locked-off | CTA đứng yên ≥ 8 s |

## Beat sheet (100 BPM, 1 nhịp = 0,6 s)
- 0,0–1,2 bút đỏ kéo cột từ dưới khung lên, xuyên vạch trần (tiếng giấy thủng ở 1,2). 1,8 ghi chú đỏ "216" + "cao nhất từ 2015". Caption 1.
- 4,8–9,6 máy lùi + lia trái, bút kẻ trục x từ phải về trái (thước), về tới 2019.
- 7,8–9,6 tiêu đề in; trục y mọc (0 · 50 · 100 · 150), trần khung = 180 (nét đứt).
- 10,2–19,2 2019-Q1 → 2022-Q4, mỗi quý một nhịp, mỗi cột một plonk (cao độ = giá trị). Ghi chú xanh "2019: năm bình thường"; "2020–2022: tiền hỗ trợ, tạm hoãn nghĩa vụ nộp đơn".
- 19,8–24,0 2023–2024 mỗi quý một nhịp. 24,6 2025-Q1. 25,2 2025-Q2 = 192 chạm trần → **ratchet 180 → 200** (4 nấc × 1/8).
- 27,0 / 27,6 2025-Q3, Q4. **28,2–29,1 im lặng**, bút lưỡng lự, đổi đầu đỏ. 29,4 2026-Q1 nhập vào cột kỷ lục (tiếng đầu tiên sau im lặng, punch-in) → **ratchet 200 → 240** (8 nấc). 31,8 2026-Q2.
- 32,4–36,0 đường gạch TB 2019 (156) và TB nửa đầu 2026 (212); ngoặc đỏ "+36 %".
- 38,4–40,8 30 cột quét ngang, gom thành thanh "Nhà hàng, khách sạn"; crane xuống. 40,8–45,6 7 thanh còn lại kẻ ra mỗi nhịp; nhãn "+19 %"… "8 / 8 ngành đều tăng".
- **50,4–51,6 im lặng thật**; pan xuống trang trắng. 51,6–54,0 câu viết tay "Khó khăn không chừa ai." / "Vậy vì sao có quán vẫn đông?".
- 56,4–66,0 bốn dòng viết tay, mỗi dòng một biểu tượng chì (ghim bản đồ, ngôi sao, lịch, trái tim).
- 66,0–75,6 nhãn dịch vụ SAMI đóng dấu cạnh từng dòng (mint), dấu tích đỏ.
- **75,6–76,8 nhịp thở** (im lặng), bút rời khung. 76,8–78,0 cột navy mọc từ đáy. 78,0 → end card (logo, câu chốt, WhatsApp +49 155 60456888, sami-agency.de). ≈ 87 s hết.

## Cue map
| phần | giây | nhạc |
|---|---|---|
| A hook | 0–4,8 | sub E1 + tiếng giấy thủng; drone E/B, nhịp tim "lub-dub" thưa |
| B trục | 4,8–9,6 | thước kẻ; pad Em, bánh cóc gỗ đếm 1/8 rất nhỏ |
| C 2019–22 | 9,6–19,2 | plonk mỗi quý (giá trị thấp → gỗ, pentatonic), tim mỗi nhịp; Em → Cmaj7 → Am → B7sus |
| D 2023–26 | 19,2–32,4 | bass móc đơn vào, Em → C → D → B; **ratchet = tiếng tách gỗ đúng mỗi nấc 1/8**; im lặng thật trước 2026-Q1 |
| E so sánh | 32,4–38,4 | treo C(add9)/E, thước kẻ |
| F 8 ngành | 38,4–50,4 | quét giấy; mỗi thanh một plonk; Am → Em → C → B |
| G bước ngoặt | 50,4–66 | im lặng 1,2 s → Rhodes FM Sol trưởng (G → D/F# → Em → C), cọ trống nhẹ, không tim nữa |
| H SAMI | 66–75,6 | build: thêm kick mềm + clap, đóng dấu = pop, G → D → C → D |
| I end | 75,6–87 | 1,2 s im lặng → sub-hit, Gmaj9 ngân, pop ở WhatsApp |

## Âm thanh
| phần | nền | foley | nhạc |
|---|---|---|---|
| A | phòng yên | kéo chì, giấy thủng, viết tay | sub + drone |
| B–C | phòng yên | thước kẻ, chạm chì mỗi cột | tim + plonk |
| D | — | tách bánh cóc mỗi nấc, giấy thủng ở kỷ lục, click gỗ đổi đầu bút | bass + plonk |
| E–F | — | quét giấy (morph), thước | plonk thanh |
| G–H | quán xa rất nhỏ (noise lọc ấm, J-cut từ 51,6) | viết tay, đóng dấu (pop), tích | Rhodes + cọ |
| I | — | sub-hit, pop | pad |

## Chữ & caption
Tiêu đề in (Newsreader 600) trong world space trên khung; caption = chú thích hình (Newsreader, ≤ 3 dòng ở 9:16), kicker mono cho mốc thời gian; nguồn mono nhỏ ở đáy. Ghi chú viết tay Patrick Hand (Caveat thiếu dấu tiếng Việt). Danh sách 4 điều: viết tay lớn; nhãn dịch vụ SAMI: Be Vietnam Pro trên nền mint (màu accent duy nhất ngoài data). Không caption đè lên im lặng hay lúc ratchet kỷ lục.
