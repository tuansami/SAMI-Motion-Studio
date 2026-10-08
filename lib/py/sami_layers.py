"""SAMI Studio 1.0 — tách lớp ảnh carousel đã thiết kế (OpenCV) cho chế độ ảnh bản đầy đủ.

    python sami_layers.py <ảnh 1080x1350> <thư mục ra> [--no-subject] [--no-text]

Ra:  text_<n>.png  từng khối chữ (RGBA, cắt sát khối, chỉ pixel nét chữ)
     subject.png   chủ thể (RGBA cỡ ảnh, mép mềm) nếu tìm được chủ thể hợp lý
     layers.json   {w, h, text: [{file, x, y, w, h}], subject: {file, bbox, area} | null}
Không cần vá nền: trong slide các lớp chỉ PHÓNG TO quanh chính nó (≥ 1) nên luôn che pixel gốc bên dưới;
khung 0 = mọi lớp ở tỉ lệ 1 = ảnh gốc y nguyên.
"""
import json
import os
import sys

import cv2
import numpy as np


def text_blocks(img):
    """khối chữ: gradient hình thái + Otsu + nối ngang → hộp; trong hộp lấy pixel khác màu nền viền."""
    H, W = img.shape[:2]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    k = max(9, W // 60)
    joined = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (k, max(3, k // 4))))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(joined, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if h < H * 0.012 or h > H * 0.22 or w < h * 1.3 or w > W * 0.98 or w * h < W * H * 0.0015:
            continue
        dens = bw[y:y + h, x:x + w].mean() / 255
        # chữ nằm trên nền phẳng (dải màu, khối) được nhận cả khi nét đậm, ít cạnh; trên ảnh chụp phải nhiều cạnh hơn
        p = max(3, h // 6)
        ring = np.concatenate([img[max(0, y - p):y, x:x + w].reshape(-1, 3), img[y + h:y + h + p, x:x + w].reshape(-1, 3)]).astype(np.float32)
        flat = len(ring) > 10 and float(ring.std(axis=0).mean()) < 14
        if dens > 0.75 or dens < (0.10 if flat else 0.18):  # ảnh nhiều chi tiết (lá, vải) → không phải chữ
            continue
        out.append([x, y, w, h])
    # gộp hộp chồng nhau / sát nhau theo dòng (một tiêu đề nhiều dòng = một khối)
    out.sort(key=lambda b: (b[1], b[0]))
    merged = []
    for b in out:
        for m in merged:
            gap = max(b[3], m[3]) * 0.6
            if b[0] < m[0] + m[2] + gap and m[0] < b[0] + b[2] + gap and b[1] < m[1] + m[3] + gap and m[1] < b[1] + b[3] + gap:
                x0, y0 = min(m[0], b[0]), min(m[1], b[1])
                m[2], m[3] = max(m[0] + m[2], b[0] + b[2]) - x0, max(m[1] + m[3], b[1] + b[3]) - y0
                m[0], m[1] = x0, y0
                break
        else:
            merged.append(list(b))
    blocks = []
    for x, y, w, h in merged[:8]:
        p = max(4, int(h * 0.08))
        x0, y0, x1, y1 = max(0, x - p), max(0, y - p), min(W, x + w + p), min(H, y + h + p)
        crop = img[y0:y1, x0:x1]
        lab_c = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
        border = np.concatenate([lab_c[0], lab_c[-1], lab_c[:, 0], lab_c[:, -1]])
        bg = np.median(border, axis=0)
        dist = np.linalg.norm(lab_c - bg, axis=2)
        m = (dist > max(18.0, float(np.percentile(dist, 60)))).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))  # lấp lỗ trong nét
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)), iterations=2)
        if m.mean() / 255 < 0.04:
            continue
        rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
        rgba[:, :, 3] = cv2.GaussianBlur(m, (3, 3), 0)
        blocks.append({'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0), 'rgba': rgba, 'mask': m})
    return blocks


def subject(img, text_mask):
    """chủ thể bằng GrabCut khởi tạo từ khung giữa; chữ đánh dấu là nền. Trả None nếu kết quả không hợp lý."""
    H, W = img.shape[:2]
    s = 0.4  # chạy ở độ phân giải nhỏ cho nhanh
    sm = cv2.resize(img, (int(W * s), int(H * s)), interpolation=cv2.INTER_AREA)
    mask = np.full(sm.shape[:2], cv2.GC_PR_BGD, np.uint8)
    h, w = mask.shape
    mask[int(h * 0.12):int(h * 0.92), int(w * 0.10):int(w * 0.90)] = cv2.GC_PR_FGD
    mask[:3, :] = mask[-3:, :] = cv2.GC_BGD
    mask[:, :3] = mask[:, -3:] = cv2.GC_BGD
    if text_mask is not None:
        mask[cv2.resize(text_mask, (w, h), interpolation=cv2.INTER_NEAREST) > 0] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(sm, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # giữ mảng liền lớn nhất, lấp lỗ, mép mềm
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n < 2:
        return None
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    fg = np.where(lab == big, 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    area = fg.mean() / 255
    if area < 0.06 or area > 0.65:
        return None
    # hình dạng phải gọn (người, món ăn, ly): độ đặc thấp = GrabCut chọn nhầm mảng nền (tường, bàn) → bỏ
    cs, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cs, key=cv2.contourArea); hull = cv2.contourArea(cv2.convexHull(c))
    solidity = cv2.contourArea(c) / hull if hull else 0
    if solidity < 0.72:
        return None
    # chủ thể phải nhiều chi tiết hơn nền (món ăn, người); mảng phẳng (tường, trời) bị GrabCut chọn nhầm → bỏ
    lap = np.abs(cv2.Laplacian(cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY), cv2.CV_32F))
    tin, tout = float(lap[fg > 0].mean()), float(lap[fg == 0].mean()) if (fg == 0).any() else 1.0
    if tin < 0.8 * tout:
        return None
    x, y, bw, bh = cv2.boundingRect(fg)
    if x <= 2 and y <= 2 and x + bw >= w - 2 and y + bh >= h - 2:  # chiếm cả khung = không tách được
        return None
    fg = cv2.resize(fg, (W, H), interpolation=cv2.INTER_LINEAR)
    fg = cv2.GaussianBlur(fg, (9, 9), 0)
    if text_mask is not None:
        fg[text_mask > 0] = 0
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = fg
    return {'rgba': rgba, 'bbox': [int(x / s), int(y / s), int(bw / s), int(bh / s)], 'area': round(float(area), 3), 'solidity': round(float(solidity), 2)}


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if len(a) < 2:
        print(__doc__)
        sys.exit(1)
    src, out = a[0], a[1]
    img = cv2.imdecode(np.fromfile(src, np.uint8), cv2.IMREAD_COLOR)  # đường dẫn Unicode trên Windows
    if img is None:
        sys.exit('Không đọc được ảnh ' + src)
    os.makedirs(out, exist_ok=True)
    H, W = img.shape[:2]
    blocks = [] if '--no-text' in sys.argv else text_blocks(img)
    tmask = np.zeros((H, W), np.uint8)
    res = {'w': W, 'h': H, 'text': [], 'subject': None}
    for i, b in enumerate(blocks):
        f = 'text_%d.png' % (i + 1)
        cv2.imencode('.png', b['rgba'])[1].tofile(os.path.join(out, f))
        tmask[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']] |= b['mask']
        res['text'].append({'file': f, 'x': b['x'], 'y': b['y'], 'w': b['w'], 'h': b['h']})
    if '--no-subject' not in sys.argv:
        s = subject(img, tmask if blocks else None)
        if s:
            cv2.imencode('.png', s['rgba'])[1].tofile(os.path.join(out, 'subject.png'))
            res['subject'] = {'file': 'subject.png', 'bbox': s['bbox'], 'area': s['area'], 'solidity': s['solidity']}
    with open(os.path.join(out, 'layers.json'), 'w', encoding='utf8') as fh:
        json.dump(res, fh, ensure_ascii=False, indent=1)
    print(json.dumps({'text': len(res['text']), 'subject': bool(res['subject'])}))


if __name__ == '__main__':
    main()
