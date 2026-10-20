import sys, cv2, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); W,H = im.size
S = 4
a = np.array(im)[:,:,3]
a = cv2.resize(a, (W*S, H*S), interpolation=cv2.INTER_CUBIC)
_, b = cv2.threshold(a, 128, 255, cv2.THRESH_BINARY)
rows = np.where(b.max(axis=1) > 0)[0]
# find vertical gap between symbol and wordmark
gaps = [r for r in range(rows[0], rows[-1]) if b[r].max() == 0]
print('rows', rows[0]/S, rows[-1]/S, 'gap', gaps[0]/S if gaps else None, gaps[-1]/S if gaps else None)
cs, hier = cv2.findContours(b, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
parts = {'sym': [], 'word': []}
split = (gaps[0] + gaps[-1]) / 2 if gaps else 1e9
for c in cs:
    if cv2.contourArea(c) < 20 * S * S: continue
    c = cv2.approxPolyDP(c, 0.6 * S, True)
    y = c[:,0,1].mean()
    pts = c[:,0,:] / S
    d = 'M' + ' L'.join('%.1f %.1f' % (x, y2) for x, y2 in pts) + ' Z'
    parts['sym' if y < split else 'word'].append((d, cv2.arcLength(c, True) / S))
import json
json.dump({'w': W, 'h': H, 'split': split / S, 'sym': parts['sym'], 'word': parts['word']}, open(out, 'w'))
print(len(parts['sym']), len(parts['word']), sum(len(d) for d, _ in parts['sym'] + parts['word']))
