import os
import re

NAV_CSS = """
  :root { --dh-w: 1280px; }
  body { padding-top: 74px !important; }
  .dh { position:fixed; z-index:20; top:0; left:0; right:0; padding:12px 16px 10px; font:12px/1.45 "DM Mono", monospace; background:linear-gradient(var(--bg) 60%, rgba(12,13,14,0)); }
  .dh-in { max-width:var(--dh-w, 1280px); margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:10px 18px; }
  .dh-brand { flex:none; display:flex; align-items:center; gap:8px; color:var(--ink-hi); text-decoration:none; font-weight:500; font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
  .dh-brand .dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--accent); box-shadow:0 0 8px var(--accent); }
  .dh-seg { display:flex; min-width:0; overflow-x:auto; scrollbar-width:none; padding:3px; gap:4px; border:1px solid var(--edge); border-radius:999px; background:var(--panel); }
  .dh-seg a { flex:none; display:flex; align-items:center; gap:6px; white-space:nowrap; padding:5px 13px; border-radius:999px; color:var(--ink); text-decoration:none; font-size:11px; letter-spacing:.06em; transition:all .2s; }
  .dh-seg a:hover { color:var(--ink-hi); }
  .dh-seg a.active { color:var(--ink-hi); background:var(--bg); box-shadow:0 0 0 1px var(--accent) inset; }
  .dh-seg .n { opacity:.6; font-size:10px; }
"""

def create_header(active_tab):
    tabs = [
        ('audira-studio.html', 'AUDIRA STUDIO', '5'),
        ('datacenter.html', 'DATA CENTER', '12'),
        ('cyberlab.html', 'CYBER LAB', '5'),
        ('objects.html', 'OBJECTS', '10'),
        ('cities.html', 'CITIES', '10'),
        ('lumen.html', 'LUMEN', '12'),
        ('computer-demo.html', 'DESK COMPUTER', '1'),
        ('assets/gallery-3d.html', '3D DEMO', '12'),
    ]
    links = []
    for href, title, count in tabs:
        is_active = ' active' if title == active_tab else ''
        links.append(f'<a href="{href}" class="{is_active}">{title} <span class="n">{count}</span></a>')
    
    seg = ''.join(links)
    return f"""
<header class="dh">
  <div class="dh-in">
    <a class="dh-brand" href="index.html"><span class="dot"></span><span>AUDIRA GLOW</span></a>
    <nav class="dh-seg" aria-label="Collections">{seg}</nav>
  </div>
</header>
"""

def inject(filename, tab_name):
    if not os.path.exists(filename):
        return
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove existing header if present
    if '<header class="dh">' in html:
        html = re.sub(r'<header class="dh">[\s\S]*?</header>', '', html)

    # Inject or replace NAV_CSS
    if 'var(--dh-w' not in html:
        html = html.replace('</head>', f'<style>{NAV_CSS}</style>\n</head>')

    header_html = create_header(tab_name)
    html = html.replace('<body>', f'<body>\n{header_html}')

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Injected header into {filename} [{tab_name}]')

if __name__ == '__main__':
    inject('datacenter.html', 'DATA CENTER')
    inject('audira-studio.html', 'AUDIRA STUDIO')
    inject('objects.html', 'OBJECTS')
    inject('cities.html', 'CITIES')
    inject('lumen.html', 'LUMEN')
    inject('computer-demo.html', 'DESK COMPUTER')
