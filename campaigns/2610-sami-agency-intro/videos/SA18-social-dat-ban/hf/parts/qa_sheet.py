import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; files=sys.argv[2:]
ims=[Image.open(f).convert('RGB') for f in files]
w,h=ims[0].size
s=540/max(w,h) if w>h else 360/w
tw,th=int(w*s),int(h*s)
cols=min(len(ims), 6 if w<h else 4); rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*tw+(cols+1)*8, rows*(th+30)+8),(40,40,40))
d=ImageDraw.Draw(sheet)
for i,(im,f) in enumerate(zip(ims,files)):
    x=8+(i%cols)*(tw+8); y=8+(i//cols)*(th+30)
    sheet.paste(im.resize((tw,int(im.size[1]*tw/im.size[0]))),(x,y)); d.text((x,y+th+6),f.split('_')[-1],fill=(255,255,255))
sheet.save(out,quality=88)
