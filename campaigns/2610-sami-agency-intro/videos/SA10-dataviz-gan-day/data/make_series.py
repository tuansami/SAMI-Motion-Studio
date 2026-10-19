"""Build data/series.json from the saved Google Trends + Eurostat responses and print every number the film shows.
  python3 data/make_series.py"""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
tr = json.load(open(os.path.join(H, 'google_trends_DE_in-der-naehe_2004-2026.json')))
rows = [p for p in tr['data']['default']['timelineData'] if not p.get('isPartial')]   # drop the running month (10/2026)
MON = {'Jan.': 1, 'Feb.': 2, 'März': 3, 'Apr.': 4, 'Mai': 5, 'Juni': 6, 'Juli': 7, 'Aug.': 8, 'Sept.': 9, 'Okt.': 10, 'Nov.': 11, 'Dez.': 12}
months, vals = [], []
for p in rows:
    m, y = p['formattedTime'].split(' ')
    months.append(f'{y}-{MON[m]:02d}'); vals.append(p['value'][0])
yr = {}
for ym, v in zip(months, vals): yr.setdefault(ym[:4], []).append(v)
avg = {y: round(sum(a) / len(a), 1) for y, a in yr.items()}
eu = json.load(open(os.path.join(H, 'eurostat_isoc_ci_dev_i_DE_2025.json')))
mp, dk = eu['values']['I_IUG_MP']['2025'][0], eu['values']['I_IUG_DKPC']['2025'][0]
peak = max(range(len(vals)), key=lambda i: vals[i])
out = {'keyword': 'in der Nähe', 'geo': 'DE', 'months': months, 'values': vals, 'yearAvg': avg,
       'peak': {'ym': months[peak], 'v': vals[peak]}, 'phone2025': mp, 'desktop2025': dk}
json.dump(out, open(os.path.join(H, 'series.json'), 'w'), ensure_ascii=False)
print(len(months), months[0], '→', months[-1], 'peak', months[peak], vals[peak])
print('TB năm', avg)
print('2019→2025 ×%.2f' % (avg['2025'] / avg['2019']))
j25 = [v for ym, v in zip(months, vals) if ym.startswith('2025') and int(ym[5:]) <= 9]; j26 = yr['2026']
print('1–9/2025 TB %.1f · 1–9/2026 TB %.1f' % (sum(j25) / len(j25), sum(j26) / len(j26)))
for y in range(2021, 2027):
    a = yr[str(y)]; print(y, 'tháng cao nhất', a.index(max(a)) + 1, max(a))
print('Eurostat 2025: điện thoại %.2f %% · máy bàn %.2f %% · tỉ lệ %.2f' % (mp, dk, mp / dk))
