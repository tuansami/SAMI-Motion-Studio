# ghép ảnh QA: python3 tools/sheet.py out.jpg a.jpg b.jpg ... (scale 0.5)
import sys
from PIL import Image
out, fs = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in fs]
s = 0.5 if ims[0].size[1] > ims[0].size[0] else 0.4
w, h = int(ims[0].size[0] * s), int(ims[0].size[1] * s)
cols = min(len(ims), 4 if ims[0].size[1] > ims[0].size[0] else 2)
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (w * cols, h * rows), 'white')
for i, im in enumerate(ims): sh.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
sh.save(out, quality=85)
