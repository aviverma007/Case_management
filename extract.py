import openpyxl, json
from collections import defaultdict, Counter

wb = openpyxl.load_workbook('/mnt/user-data/uploads/Case_Management.xlsx', read_only=True)
ws = wb.active
hdrs = []
rows = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        hdrs = [str(h).strip() if h else f'c{i}' for h in row]
    elif any(v is not None for v in row):
        r = dict(zip(hdrs, row))
        if r.get('Case Number'):
            rows.append(r)
wb.close()
print(f'rows: {len(rows)}')

def dist(k, n=10):
    c = Counter(str(r.get(k,'')).strip() for r in rows if r.get(k))
    return [{'name': x, 'value': v} for x, v in c.most_common(n) if x and x != 'None']

status   = dist('Status', 8)
origin   = dist('Case Origin', 8)
priority = dist('Priority', 6)
ctype    = dist('Case Type', 8)
area     = dist('Area', 10)
subarea  = dist('Sub Area', 12)
owner    = dist('Case Owner', 12)
hod      = dist('HOD 1', 8)
tl       = dist('Team Leader', 10)
resp     = dist('Response Time Category', 6)
resol    = dist('Resolution Time Category', 6)
hni      = dist('HNI Customer', 4)
proj     = dist('Project', 8)
excl     = dist('Exclusions/ Inclusions', 4)

# Area + Sub Area table
ast = defaultdict(lambda: defaultdict(int))
for r in rows:
    a = str(r.get('Area', '')).strip()
    s = str(r.get('Sub Area', '')).strip()
    if a and s and a != 'None' and s != 'None':
        ast[a][s] += 1
asl = []
for a, subs in sorted(ast.items(), key=lambda x: -sum(x[1].values()))[:15]:
    for s, c in sorted(subs.items(), key=lambda x: -x[1])[:3]:
        asl.append({'area': a, 'sub_area': s, 'count': c})

# Monthly trend
mon = defaultdict(lambda: {'opened': 0, 'closed': 0})
for r in rows:
    dt = str(r.get('Date/Time Opened', '')).strip()
    if '/' in dt:
        try:
            p = dt.split(',')[0].strip().split('/')
            k = f"{p[2].strip()}-{int(p[0]):02d}"
            mon[k]['opened'] += 1
        except:
            pass

ml = sorted(
    [{'month': k, 'opened': v['opened'], 'closed': v['closed']} for k, v in mon.items()],
    key=lambda x: x['month']
)[-18:]

tot = len(rows)
op  = sum(1 for r in rows if str(r.get('Status', '')).strip().lower() in
          ('new', 'open', 'in progress', 'pending for clarification', 're-open'))
cl  = sum(1 for r in rows if str(r.get('Status', '')).strip().lower() == 'closed')
esc = sum(1 for r in rows if str(r.get('Is Escalated closure', '')).strip().lower() in ('yes', 'true'))

sk = ['Case Number','Case Owner','HOD 1','Team Leader','Priority',
      'Case Origin','Case Type','Status','Category','Sub Category','Area','Sub Area','Age']
sample = [{k: str(r.get(k, '')).strip() for k in sk} for r in rows[:300]]

out = {
    'summary': {
        'total': tot, 'open': op, 'closed': cl,
        'owners': len(set(str(r.get('Case Owner','')).strip() for r in rows if r.get('Case Owner'))),
        'areas': len(set(str(r.get('Area','')).strip() for r in rows if r.get('Area'))),
        'escalated': esc,
    },
    'statusDist': status, 'originDist': origin, 'priorityDist': priority,
    'typeDist': ctype, 'areaDist': area, 'subareaDistList': subarea,
    'ownerDist': owner, 'hodDist': hod, 'tlDist': tl,
    'responseDist': resp, 'resolDist': resol,
    'hniDist': hni, 'projectDist': proj, 'exclDist': excl,
    'areaSubTable': asl, 'monthly': ml, 'sampleCases': sample,
}
with open('src/caseData.json', 'w') as f:
    json.dump(out, f, indent=2)
print('Done.')
print('Status:', status[:3])
print('Origins:', origin[:3])
print('Monthly:', ml[:4])
print('Owners:', owner[:3])
