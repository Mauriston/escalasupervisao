"""Gera js/snapshot.js (cópia local da aba AGENDA) a partir da planilha publicada.

Uso: python3 scripts/gerar_snapshot.py [saida]
A página sempre tenta ler a planilha ao vivo; este arquivo é só o fallback.
"""
import csv
import datetime
import io
import json
import re
import sys
import urllib.request

SHEET_ID = '1iUXf6HYi_tIuOflN1kuCsLddUbpwIwu7S6KGYZrJSws'
URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=AGENDA&range=A:D'

out = sys.argv[1] if len(sys.argv) > 1 else 'js/snapshot.js'
with urllib.request.urlopen(URL, timeout=30) as r:
    text = r.read().decode('utf-8')
if text.lstrip().startswith('<'):
    sys.exit('A planilha não está pública (resposta HTML).')

data = {}
for row in csv.reader(io.StringIO(text)):
    mt = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})', (row[0] if row else '').strip())
    if not mt:
        continue
    svc = (row[2] if len(row) > 2 else '').strip()
    ret = (row[3] if len(row) > 3 else '').strip()
    if svc or ret:
        data[f'{mt[3]}-{int(mt[2]):02d}-{int(mt[1]):02d}'] = [svc, ret]
if not data:
    sys.exit('Nenhuma linha válida na aba AGENDA.')

hoje = datetime.date.today().strftime('%d/%m/%Y')
with open(out, 'w', encoding='utf-8') as f:
    f.write('// Cópia local da aba AGENDA (fallback quando a planilha não responde).\n')
    f.write(f'// Gerado em {hoje} a partir da planilha; a página sempre tenta os dados ao vivo primeiro.\n')
    f.write(f'window.ESCALA_SNAPSHOT = {{date:{json.dumps(hoje)}, data:{json.dumps(data, ensure_ascii=False, separators=(",", ":"))}}};\n')
print(f'{len(data)} dias gravados em {out}')
