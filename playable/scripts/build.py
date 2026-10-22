#!/usr/bin/env python3
"""Assemble a playable page: the template + the engine + your robot scripts + your models (embedded, so it opens from disk).

  python3 build.py OUT.html robots.js [more.js ...] [--glb id=model.glb ...] [--title "My robots"]

Each robot script calls botFig({...}) once per robot (see assets/examples). A --glb id is the element the config points
at with  el: 'glb-<id>'. Robots built in code (from a sketch) need no --glb. Tabs appear in script order.
"""
import base64, os, sys
here = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(here, '..', 'assets')
args = sys.argv[1:]
if len(args) < 2: sys.exit(__doc__)
out, scripts, glbs, title, i = args[0], [], [], None, 1
while i < len(args):
    if args[i] == '--glb': glbs.append(args[i + 1].split('=', 1)); i += 2
    elif args[i] == '--title': title = args[i + 1]; i += 2
    else: scripts.append(args[i]); i += 1
s = open(os.path.join(A, 'template.html'), 'r', encoding='utf-8').read()
code = '\n'.join(open(p, 'r', encoding='utf-8').read() for p in [os.path.join(A, 'anim.js'), os.path.join(A, 'bots.js')] + scripts)
blobs = '\n'.join(f'<script type="application/octet-stream" id="glb-{k}">' + base64.b64encode(open(f, 'rb').read()).decode() + '</script>' for k, f in glbs)
for a, b in [('/* paste 3D figure modules here */', code), ('</body>', blobs + '\n</body>')] + ([('<title>Playable</title>', f'<title>{title}</title>')] if title else []):
    assert a in s, a; s = s.replace(a, b, 1)
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out, len(s) // 1024, 'KB')
