"""Check the default distributable for private paths and personal-site residues."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
SKIP={'node_modules','.git','private','__pycache__','.venv','review'}
bad=[]
for p in ROOT.rglob('*'):
 if not p.is_file() or any(x in SKIP or x=='dist' or x.startswith('dist-') for x in p.relative_to(ROOT).parts):continue
 if p.suffix in {'.jpg','.jpeg','.webp','.png','.zip'}:bad.append(str(p.relative_to(ROOT))+': default release must use original SVG demos only')
 if p.suffix not in {'.js','.css','.html','.py','.cjs','.json','.md','.txt','.mdc'}:continue
 text=p.read_text(encoding='utf-8')
 # Split known residues so the scanner itself is portable and can be scanned.
 forbidden=['kai-'+'guangyin.pages.dev','256430'+'4142','G:'+chr(47)+'尼康照片','C:'+chr(92)+'Users'+chr(92)+'lenovo']
 if any(x in text for x in forbidden):bad.append(str(p.relative_to(ROOT))+': personal residue')
 if re.search(r'\b[A-Za-z]:[\\/](?:Users|尼康照片)',text):bad.append(str(p.relative_to(ROOT))+': fixed local path')
if bad:raise SystemExit('\n'.join(bad))
print('PASS default source: no personal photos, public-personal URLs, account or local-user paths')
