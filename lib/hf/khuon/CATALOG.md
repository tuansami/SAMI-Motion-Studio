# Danh mục khuôn (sinh tự động: `node server/cli-pipeline.mjs catalog --write`)

Chọn khuôn cho từng cảnh ngay lúc viết storyboard. 1 nhịp = 0,5 s (120 BPM). Ô có `?` là tuỳ chọn (bỏ trống = ẩn). Trong chữ: `*từ*` = tô màu, ` / ` = xuống dòng.
Dựng: `cli-pipeline.mjs storyboard brief.json --out <dự án>` hoặc thêm từng cảnh: `cli-pipeline.mjs add <dự án> <khuôn> --after S02 --values '{…}'`.

## Mở đầu (hook)
- **hook-ransom** (8 nhịp, paper/night/light): Câu hook thành các mảnh giấy cắt dán bật vào từng mảnh, dòng viết tay gạch chân. Hợp chủ đề vui, mùa lễ, thủ công.
  ô: `headline` `sub?`
- **hook-words** (8 nhịp, night/paper/light): Nhãn nhỏ gõ chữ, câu hook vào từng từ theo nhịp, máy đẩy chậm. Dùng mở đầu mọi video.
  ô: `label?` `headline` `sub?`

## Vấn đề
- **problem-stamp** (10 nhịp, paper/night/light): Câu nêu nỗi đau, 2 đến 3 lý do có mũi tên đỏ xuống lần lượt, rồi con dấu đóng mạnh (khung rung nhẹ).
  ô: `headline` `p1` `p2` `p3?` `stamp`

## Lợi ích
- **benefits-3** (12 nhịp, night/light/paper): Tiêu đề rồi 3 đến 4 thẻ lợi ích vào lần lượt theo nhịp, dấu tích tự vẽ. Ngang: hàng thẻ; dọc: cột thẻ.
  ô: `title` `b1` `b2` `b3` `b4?`

## Số liệu
- **chart-bars** (10 nhịp, night/light/paper): Biểu đồ 2 đến 6 cột mọc lên lần lượt, số trên đầu cột đếm lên, cột cuối tô màu nhấn; tiêu đề và nguồn. Dùng cho kết quả trước / sau, tăng trưởng theo tháng.
  ô: `title` `l1` `v1` `l2` `v2` `l3?` `v3?` `l4?` `v4?` `l5?` `v5?` `l6?` `v6?` `unit?` `source?`
- **stat-counter** (8 nhịp, night/light/paper): Một con số lớn đếm lên trong vòng tròn tự vẽ (phần trăm thì vòng chạy đúng tỉ lệ), chú thích và nguồn.
  ô: `label?` `number` `prefix?` `suffix` `caption` `source?`

## Google Maps
- **map-route** (10 nhịp, light/paper/night): Bản đồ cách điệu vẽ bằng code, đường đi tự vẽ từ điểm xuất phát tới quán với chấm chạy theo, ghim ở hai đầu, thẻ thời gian đi bộ / lái xe. Không dùng ảnh chụp bản đồ.
  ô: `headline` `from` `to` `eta`
- **maps-profile** (12 nhịp, light/paper/night): Hồ sơ Google Maps của quán trên điện thoại: dải 3 ảnh, tên, sao đếm lên, giờ mở cửa, 4 nút bấm sáng lần lượt. Câu dẫn bên cạnh.
  ô: `headline` `sub?` `name` `rating` `count` `category` `hours` `p1_photo`[ảnh] `p2_photo`[ảnh] `p3_photo`[ảnh]
- **maps-search** (12 nhịp, paper/night/light): Điện thoại Google Maps: gõ từ khoá, danh sách quán hiện ra, quán của khách sáng lên và ghim rơi xuống bản đồ. Câu dẫn bên cạnh (ngang) hoặc phía trên (dọc).
  ô: `headline` `sub?` `query` `r1_name` `r1_rating` `r1_count` `r1_meta` `r1_photo?`[ảnh] `r2_name` `r2_rating` `r3_name` `r3_rating`

## Chat
- **chat-whatsapp** (12 nhịp, night/light/paper): Màn hình WhatsApp: 3 đến 4 tin nhắn qua lại, có dấu ba chấm đang gõ trước tin đến. Câu dẫn bên cạnh (ngang) hoặc phía trên (dọc).
  ô: `headline?` `name` `status` `m1` `m2` `m3?` `m4?`

## Ảnh
- **phone-scroll** (12 nhịp, light/night/paper): Điện thoại hiện một ảnh chụp màn hình dài (website, hồ sơ Maps, thực đơn) và tự cuộn chậm; câu dẫn + 3 điểm nổi bật dạng nhãn.
  ô: `headline` `screen_photo`[ảnh] `k1?` `k2?` `k3?`
- **photo-collage** (10 nhịp, paper/night/light): 2 đến 6 ảnh polaroid rơi xuống lần lượt, nghiêng nhẹ, có băng dính và chú thích; câu viết tay ở dưới.
  ô: `headline?` `p1_photo`[ảnh] `c1?` `p2_photo`[ảnh] `c2?` `p3_photo?`[ảnh] `c3?` `p4_photo?`[ảnh] `c4?` `p5_photo?`[ảnh] `c5?` `p6_photo?`[ảnh] `c6?`

## Thực đơn
- **menu-dish** (10 nhịp, paper/night/light): Ảnh món lớn trong khung tròn xoay nhẹ, tên món, mô tả, thẻ giá bật ra. Dùng nối nhiều cảnh cho video thực đơn / món mới.
  ô: `label?` `dish` `desc?` `price` `dish_photo`[ảnh]

## Ưu đãi
- **offer-badge** (10 nhịp, night/paper/light): Huy hiệu răng cưa xoay vào với con số ưu đãi lớn, câu ưu đãi, điều kiện nhỏ và nhãn thời hạn.
  ô: `badge` `badge_sub?` `headline` `terms?` `date?`

## Đánh giá
- **review-quote** (10 nhịp, light/paper/night): Thẻ đánh giá kiểu Google: 5 sao sáng dần, lời khách vào từng từ, tên người viết và nguồn. Dùng làm bằng chứng xã hội.
  ô: `quote` `author` `meta` `rating` `headline?`

## Thời gian
- **calendar-date** (10 nhịp, paper/light/night): Tờ lịch tháng dựng lại theo tháng / năm thật, ngày quan trọng được khoanh bằng nét bút đỏ tự vẽ; câu chốt bên cạnh.
  ô: `month` `month_num` `year` `day` `headline` `sub?`

## Kêu gọi
- **cta-contact** (8 nhịp, night/light/paper): Câu kêu gọi lớn, nút bấm đập nhẹ theo nhịp, các nhãn liên hệ (web, điện thoại, WhatsApp, địa chỉ) vào lần lượt.
  ô: `headline` `button` `web?` `phone?` `whatsapp?` `address?`

## Kết
- **endcard-logo** (8 nhịp, night/light/paper): Thẻ kết: logo (ảnh) hoặc tên thương hiệu chữ lớn, khẩu hiệu, website; vệt sáng quét qua logo.
  ô: `logo?`[ảnh] `name` `tagline?` `web?`
