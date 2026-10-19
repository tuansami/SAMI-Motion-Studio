# Eurostat sts_rb_q (Business registration and bankruptcy index, quarterly), DE, BKRT, NSA, Index 2021=100 → series.json + FACTS printout.
# Source JSON fetched 19.10.2026 from https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_rb_q?geo=DE&indic_bt=BKRT&s_adj=NSA&unit=I21
import json, os
H = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(H, 'eurostat_sts_rb_q_DE_BKRT_I21.json')))
tl = list(d['dimension']['time']['category']['index'].keys()); T = len(tl)
nace = d['dimension']['nace_r2']['category']['index']
def ser(code):
    i = nace[code]; return {tl[j]: d['value'].get(str(i * T + j)) for j in range(T)}
I = ser('I')
q = [k for k in tl if k >= '2019-Q1' and I[k] is not None]
avg = lambda s, y: round(sum(s[f'{y}-Q{n}'] for n in range(1, 5)) / 4, 1)
sectors = ['I', 'G', 'F', 'B-E', 'H', 'J', 'K-N', 'P-S_X_S94']
VI = {'I': 'Nhà hàng, khách sạn', 'G': 'Thương mại', 'F': 'Xây dựng', 'B-E': 'Công nghiệp', 'H': 'Vận tải, kho bãi',
      'J': 'Thông tin, truyền thông', 'K-N': 'Tài chính, dịch vụ DN', 'P-S_X_S94': 'Giáo dục, y tế, xã hội'}
dumb = [{'code': c, 'vi': VI[c], 'y2019': avg(ser(c), 2019), 'y2025': avg(ser(c), 2025)} for c in sectors]
out = {'source': 'Eurostat sts_rb_q · DE · Bankruptcy declarations · NSA · Index 2021=100 · CC BY 4.0', 'updated': d['updated'],
       'quarters': q, 'values': [I[k] for k in q], 'pre': {k: I[k] for k in tl if k < '2019-Q1'},
       'avgI': {y: avg(I, y) for y in range(2015, 2026)}, 'dumbbell': dumb, 'total': {'y2019': avg(ser('B-S_X_O_S94'), 2019), 'y2025': avg(ser('B-S_X_O_S94'), 2025)}}
json.dump(out, open(os.path.join(H, 'series.json'), 'w'), ensure_ascii=False, indent=1)
mx = max((v, k) for k, v in I.items() if v is not None)
print('quarters', q[0], '→', q[-1], len(q)); print('I max', mx)
print('I max before 2026', max((v, k) for k, v in I.items() if v is not None and k < '2026'))
print('I yearly avg', out['avgI']); print('I 2026 Q1,Q2', I['2026-Q1'], I['2026-Q2'])
print('I 2026H1 avg vs 2019 avg', round((I['2026-Q1'] + I['2026-Q2']) / 2 / avg(I, 2019), 3))
for r in dumb: print(r, round(r['y2025'] / r['y2019'], 3))
print('total', out['total'])
