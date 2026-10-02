# Regenerate docs/*.html from the .md files:  python docs/build-docs.py
import markdown, pathlib
CSS = """body{max-width:960px;margin:0 auto;padding:32px 24px 80px;background:#07041A;color:#EEEBFF;font:15.5px/1.65 "Segoe UI",Inter,system-ui,sans-serif}
h1{font-size:30px;background:linear-gradient(120deg,#08DDA4,#7667FE);-webkit-background-clip:text;color:transparent}h2{margin-top:44px;border-top:1px solid rgba(255,255,255,.1);padding-top:22px;color:#08DDA4}h3{color:#b9b2ff}
a{color:#08DDA4}code{background:#161039;padding:1px 6px;border-radius:5px;color:#8ff0d2}pre{background:#0F0A2A;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px;overflow:auto}pre code{background:none;color:#EEEBFF}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}th,td{border:1px solid rgba(255,255,255,.12);padding:7px 10px;text-align:left;vertical-align:top}th{background:#161039}
blockquote{border-left:3px solid #7667FE;margin:12px 0;padding:6px 14px;background:#0F0A2A;border-radius:0 8px 8px 0;color:#cfcaf0}hr{border:0;border-top:1px solid rgba(255,255,255,.1)}
.toc{background:#0F0A2A;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 18px;margin:18px 0}"""
for md in pathlib.Path(__file__).parent.glob('*.md'):
    m = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
    body = m.convert(md.read_text(encoding='utf-8'))
    title = md.stem.replace('_', ' ')
    html = f'<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>{CSS}</style></head><body><div class="toc"><b>Mục lục</b>{m.toc}</div>{body}</body></html>'
    md.with_suffix('.html').write_text(html, encoding='utf-8')
    print('built', md.with_suffix('.html').name)
