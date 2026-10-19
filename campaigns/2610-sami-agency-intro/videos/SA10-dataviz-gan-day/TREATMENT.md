# TREATMENT · SA10 · "Khách tìm quán bằng điện thoại, và họ tìm 'gần đây'"

Style: lemo-opuscar `dataviz` (Data Storytelling). Giữ mọi bất biến của STYLE.md: giấy kem, bút chì đỏ–xanh là diễn viên duy nhất, mỗi ô / mỗi cột = một con số thật, ghi chú viết tay ghim vào dữ liệu, caption kiểu chú thích hình (Newsreader), sonification là nhạc, không fade/dissolve (chuyển cảnh = thao tác biểu đồ).
Không voice trong phim (kịch bản VO soạn sẵn `brief/VOICE_OVER.md`). Chữ tiếng Việt; tiếng Đức chỉ trong ô tìm kiếm / bản đồ. 1080×1920 trước, rồi 1920×1080 (bố cục lại). 30 fps, **90 BPM** (1 nhịp = 20 khung, 1/16 = 5 khung → hình và tiếng không trôi). Dài 89,3 s.

## Data (thật, nguồn trên màn hình)
1. **Google Trends**, Đức, cụm „in der Nähe", toàn bộ danh mục, theo tháng 1/2004 → 9/2026 (273 tháng; bỏ 10/2026 đang chạy). Chỉ số 0–100 = tỷ trọng tìm kiếm so với tháng cao nhất (8/2025 = 100), không phải số lượt. Lấy 19.10.2026. Ghi nguồn "Google Trends" theo hướng dẫn trích dẫn của Google.
2. **Eurostat `isoc_ci_dev_i`** (thiết bị dùng để lên mạng), DE, người 16–74 tuổi, 2025: điện thoại 87,4 %, máy tính để bàn 32,7 %. CC BY 4.0.
Mọi con số trên màn hình: `FACTS.md` (in lại bằng `python3 data/make_series.py`).

## Khác SA04 (cùng style)
SA04 = đường doanh thu ngành (line chart 2019–2026, tiêu đề câu hỏi bị gạch sửa, ô "tháng tới" nở thành thiệp, nhạc 75 BPM Fa trưởng celesta). SA10 = **lịch nhiệt (calendar heatmap) 12 tháng × 23 năm nằm trong màn hình một chiếc điện thoại vẽ chì**, morph thành dãy 273 cột, thêm biểu đồ waffle 100 người, rồi **quay lại chính chiếc điện thoại** (bản đồ). Nhạc 90 BPM Rê thứ → Rê trưởng, bass pulse móc đơn, plonk FM sáng (kalimba/marimba), S&H blips. Kết bằng vòng bán kính "gần đây" nở ra thành end card.

## Ba cấu trúc ứng viên
1. **Vật thể trước trục** — bút chì viết „in der Nähe" vào ô tìm kiếm của một chiếc điện thoại vẽ tay; chữ co lại thành một chấm, rơi vào màn hình → màn hình thành lịch nhiệt, từng năm sáng dần → các ô bay ra xếp thành dãy cột (lộ hình con dốc) → waffle "87/100 lên mạng bằng điện thoại" → quay về điện thoại: bản đồ „Restaurant in der Nähe" → quán của bạn có trên đó không? → 2 đòn bẩy → vòng bán kính nở thành end card.
2. **Cuộc đua từ khóa** — bar race giữa „in der Nähe", „Restaurant in der Nähe", „essen in der Nähe"… → rủi ro: các chuỗi khác nhau không cùng thang (Trends chuẩn hoá riêng), dễ đọc sai.
3. **Một tháng trước – một tháng nay** — slope chart 8/2015 ↔ 8/2025 → nhanh nhưng mất "thói quen hình thành theo năm" và nhịp mùa hè.
**Chọn 1**: chủ quán thấy chính chiếc điện thoại của khách; lịch nhiệt cho thấy cả *xu hướng* (đậm dần theo năm) lẫn *nhịp mùa hè* (cột tháng 6–8 đậm nhất) — điều một đường kẻ không cho thấy; mở và kết đều ở chiếc điện thoại (bookend).

## Logline & arc
Ba chữ „in der Nähe" mà người Đức gõ vào điện thoại đã tăng hơn ba lần trong sáu năm và chạm kỷ lục ở mùa hè 2025; quán hiện ra trong khoảnh khắc "gần đây" là quán có khách.
Setup (một người đói mở điện thoại) → Turn (từng ô đậm dần, kỷ lục 8/2025, ×3,3, 87/100 dùng điện thoại) → Ending (bản đồ: quán của bạn có mặt không? → Google Ads Maps + Local SEO → SAMI).

## Benchmark (chỉ học ngữ pháp)
- Học: lịch nhiệt kiểu "year strip" của báo dữ liệu (một ô = một ngày/tháng, đọc được cả mùa lẫn năm); nhịp "một ý một lúc" của scrollytelling; phép "một vật thể biến thành dấu dữ liệu đầu tiên".
- Không lấy: bố cục, màu, kiểu chữ của tác phẩm nào; không lấy câu chuyện/cảnh của demo style.

## Shot list (một tờ giấy, một cú máy, camera 2D)
| # | giây | khung | máy | vì sao |
|---|---|---|---|---|
| 1 | 0–6,7 | cận ô tìm kiếm → toàn điện thoại | push-in sẵn rồi **pull-back** khi chữ rơi | hook: vật thể (câu tìm kiếm) thành dấu dữ liệu đầu tiên |
| 2 | 6,7–16 | toàn cảnh điện thoại + tiêu đề | locked-off, lưới kẻ ra | đơn vị đến cùng khung: 1 ô = 1 tháng |
| 3 | 16–27 | trung cảnh, hàng mới ở ~55 % chiều cao | **track** theo bút (đẩy nhẹ 1,3×) | tiến trình: quá khứ ở trên, tương lai ở dưới; chậm dần khi data đáng xem |
| 4 | 27–31 | cận ô 8/2025 | im lặng 1 nhịp → **punch-in** 2 khung + rung tắt dần | kỷ lục |
| 5 | 31–42,7 | toàn biểu đồ cột | **crane** lên + pull-out khi ô bay ra xếp cột | encoding morph: lộ hình dạng cả 22 năm |
| 6 | 42,7–52 | 2 waffle 10×10 | **pan** sang phải (thêm data thật) | thang người: 87/100 |
| 7 | 52–69,7 | lại điện thoại, bản đồ | im lặng → pan về + push vào bản đồ | quay về vật thể; nỗi đau: quán của bạn vắng mặt |
| 8 | 69,7–78,7 | điện thoại + 2 ghi chú ở lề | locked-off | 2 đòn bẩy đọc rõ |
| 9 | 78,7–89,3 | vòng bán kính nở → end card SAMI | nhịp thở 1,3 s, locked-off | CTA đứng yên ≥ 8 s |

## Beat sheet (90 BPM, 1 nhịp = 0,667 s)
- 0,0 cận ô tìm kiếm; 0,3–0,9 bút kẻ khung ô; 0,9–2,3 viết tay „in der Nähe"; 2,5 chạm kính lúp. Caption 1.
- 2,7–3,3 chữ co thành một chấm; 3,3–4,0 chấm rơi vào màn hình (vị trí ô 1/2004); 3,6–5,6 bút vẽ thân máy trong khi camera lùi.
- 6,7 tiêu đề in; 6,7–7,7 kẻ lưới (thước), số tháng 1…12, thang màu 0–100.
- 7,7–10,0 2004–2010: nửa nhịp một năm, gần như trắng. 10,0 ghi chú xanh "2004–2010: gần như chưa ai gõ".
- 10,7–16,0 2011–2018: một nhịp một năm.
- 16,0–20,0 2019–2021: hai nhịp một năm. 20,0–26,0 2022–2024: ba nhịp một năm (mỗi tháng 1/16 → chậm dần, từng ô có tiếng).
- 24,7 vòng xanh quanh cột tháng 6–8: "mùa hè luôn đậm nhất".
- 26,0–27,0 2025 tháng 1–7; **27,2–27,8 im lặng**, bút lưỡng lự, đổi đầu đỏ; 28,0 tháng 8 = 100 (punch-in, tiếng đầu tiên sau im lặng); ghi chú đỏ "8/2025: kỷ lục 100".
- 28,7–29,2 tháng 9–12/2025; 29,3–30,7 2026 tháng 1–9.
- 31,3–33,3 273 ô bay khỏi điện thoại, xếp thành dãy cột; crane lên. 33,0–34,0 trục y mọc (0 · 50 · 100), năm trên trục x.
- 34,7 đường gạch TB 2019 = 23 và TB 2025 = 77; ngoặc đỏ "× 3,3".
- 42,7–44,0 pan phải; 44,0–46,7 waffle "điện thoại: 87/100" điền từng ô; 46,7–47,7 "máy tính bàn: 33/100".
- **52,0–52,7 im lặng**; camera về điện thoại; bút gạch „in der Nähe", viết „Restaurant in der Nähe"; phố vẽ chì, chấm "bạn ở đây" + vòng bán kính nét đứt; 3 ghim quán (tên hư cấu, ghi "Minh họa").
- 61,7 một ghim nét đứt ngoài vòng: "quán của bạn?" (đỏ).
- 70,3 ghim nét đứt tô mint, nhãn "Gesponsert" → ghi chú ① Google Ads Maps; 73,3 sao + ảnh + giờ mở → ② Local SEO.
- **78,7–80,0 nhịp thở** (im lặng), bút rời khung. 80,0–80,7 vòng bán kính nở thành nền navy. 80,7 → end card. 89,3 hết.

## Cue map
| phần | giây | nhạc |
|---|---|---|
| A hook | 0–6,7 | drone Rê (D2/A2), S&H blips thưa, gõ chữ = sột soạt chì |
| B 2004–2010 | 6,7–10,7 | pad Dm(add9), plonk trầm mỗi năm (giá trị ~1 → gỗ, gần như lặng) |
| C 2011–2018 | 10,7–16 | Bbmaj7 → C, kick mềm mỗi nhịp, plonk mỗi năm |
| D 2019–2026 | 16–31 | **bass pulse móc đơn** vào; Dm → F → C → G; mỗi tháng một plonk (pentatonic → nửa cung → không lượng tử khi gần 100); im lặng thật trước 8/2025 |
| E morph | 31–42,7 | quét giấy + plonk lướt theo cột; Bb → F/A → Gm → A (treo) |
| F waffle | 42,7–52 | ticks dày (tiếng gõ đầu chì), Dm → Bb → C |
| G bản đồ | 52–69,7 | im lặng 0,67 s → pad mỏng Gm → Dm, không kick, blips thưa (nỗi đau) |
| H đòn bẩy | 69,7–78,7 | build: Bb → C → D, kick + pulse trở lại |
| I end | 78,7–89,3 | 1,3 s im lặng → sub-hit, Dmaj9, pop ở WhatsApp, ngân dài |

## Âm thanh
| phần | nền | foley | nhạc |
|---|---|---|---|
| A | phòng yên | sột soạt viết, chạm kính lúp, rơi "tick" | drone + blips |
| B | — | thước kẻ (lưới), tap mỗi năm | pad + plonk |
| C–D | tiếng phố xa rất nhỏ (noise lọc, J-cut cho bản đồ) | tap mỗi ô, click gỗ đổi đầu bút, giấy thủng ở punch-in | pulse + plonk |
| E | — | quét giấy (morph), thước (trục) | lướt |
| F | — | tick dày | plonk |
| G | phố (L-cut từ D) | gạch chữ, viết, pop ghim | mỏng |
| H | — | pop ghim mint, viết | build |
| I | — | sub-hit logo, pop WhatsApp | kết |

## Thiết kế chữ
- Tiêu đề biểu đồ (Newsreader 600, world space trên điện thoại): "Mức tìm „in der Nähe" ở Đức, từng tháng".
- Caption = chú thích hình: Newsreader, mực, ≤ 3 dòng, kicker mono (khoảng năm đã vẽ).
- Ghi chú tay: **Patrick Hand** (Caveat của style thiếu dấu tiếng Việt — bài học SA04), xanh = con người/ký ức, đỏ = kỷ lục/cảnh báo.
- Nguồn cố định cuối khung (IBM Plex Mono nhỏ), đổi theo biểu đồ (Google Trends / Eurostat). Bản đồ ghi "Minh họa · tên quán hư cấu".
- Đọc: luật BIBLE (số chữ ÷ 3 + 1 s; số liệu ≥ 2,5 s; CTA ≥ 3,5 s) + `readcheck.mjs`.
- End card: màu SAMI (navy #0C0628, mint #08DDA4, tím #7667FE), Be Vietnam Pro, logo `logo-white.svg`, bong bóng chat vẽ bằng code.
