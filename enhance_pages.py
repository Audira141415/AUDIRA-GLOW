import os
import re

NAV_CSS = """
  :root { --dh-w: 1320px; }
  body { padding-top: 72px !important; }
  .dh { position:fixed; z-index:40; top:0; left:0; right:0; padding:12px 24px; font:12px/1.45 var(--mono, "DM Mono", monospace); background:linear-gradient(var(--bg) 65%, transparent); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); transition:background .3s; }
  .dh-in { max-width:var(--dh-w, 1320px); margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .dh-brand { flex:none; display:flex; align-items:center; gap:10px; color:var(--ink-hi); text-decoration:none; font-weight:600; font-size:13px; letter-spacing:.14em; text-transform:uppercase; }
  .dh-brand .dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 12px var(--accent); }
  .dh-seg { display:flex; min-width:0; overflow-x:auto; scrollbar-width:none; padding:4px; gap:4px; border:1px solid var(--edge); border-radius:999px; background:rgba(20,21,23,0.85); transition:background .3s, border-color .3s; }
  :root[data-theme="light"] .dh-seg { background:rgba(255,255,255,0.9); }
  .dh-seg a { flex:none; display:flex; align-items:center; gap:6px; white-space:nowrap; padding:6px 14px; border-radius:999px; color:var(--ink); text-decoration:none; font-size:11px; letter-spacing:.06em; transition:all .2s; }
  .dh-seg a:hover { color:var(--ink-hi); }
  .dh-seg a.active { color:var(--ink-hi); background:var(--bg); box-shadow:0 0 0 1px var(--accent) inset; }
  .dh-seg .n { opacity:.6; font-size:10px; }

  /* SWATCHES & THEME CONTROLS */
  .dh-actions { display:flex; align-items:center; gap:8px; flex:none; }
  .swatches { display:flex; align-items:center; gap:4px; padding:3px 6px; border:1px solid var(--edge); border-radius:999px; background:rgba(20,21,23,0.85); transition:background .3s, border-color .3s; }
  :root[data-theme="light"] .swatches { background:rgba(255,255,255,0.9); }
  .swatches button { width:22px; height:22px; border-radius:50%; border:1px solid transparent; background:none; cursor:pointer; display:grid; place-items:center; padding:0; }
  .swatches button i { width:10px; height:10px; border-radius:50%; background:var(--sw); border:1px solid var(--line); transition:all .2s; }
  .swatches button:hover i { transform:scale(1.2); }
  .swatches button[aria-checked="true"] { border-color:var(--line); }
  .swatches button[aria-checked="true"] i { box-shadow:0 0 10px 1px var(--sw); transform:scale(1.15); }

  /* THEME TOGGLE BUTTON */
  .theme-toggle {
    display:flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px;
    border:1px solid var(--edge); background:rgba(20,21,23,0.85); color:var(--ink);
    font:500 11px/1 var(--mono, "DM Mono", monospace); letter-spacing:.08em; cursor:pointer; transition:all .2s;
    user-select:none;
  }
  :root[data-theme="light"] .theme-toggle { background:rgba(255,255,255,0.9); }
  .theme-toggle:hover { color:var(--ink-hi); border-color:var(--line); }
  .theme-toggle-icon { display:flex; align-items:center; justify-content:center; }
  :root[data-theme="dark"] .theme-toggle .sun-icon { display:none; }
  :root[data-theme="dark"] .theme-toggle .moon-icon { display:block; color:var(--accent); }
  :root[data-theme="light"] .theme-toggle .moon-icon { display:none; }
  :root[data-theme="light"] .theme-toggle .sun-icon { display:block; color:var(--accent); }
"""

THEME_SCRIPT = """
<script id="theme-ctrl">
(function() {
  function setTheme(t) {
    var theme = (t === 'light') ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('audira-glow-theme', theme); } catch(e) {}
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var lbl = btn.querySelector('.theme-toggle-label');
      if (lbl) lbl.textContent = theme.toUpperCase();
    }
  }
  var saved = 'dark';
  try { saved = localStorage.getItem('audira-glow-theme') || 'dark'; } catch(e) {}
  setTheme(saved);
  
  function initBtn() {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var lbl = btn.querySelector('.theme-toggle-label');
      if (lbl) lbl.textContent = (document.documentElement.dataset.theme || 'dark').toUpperCase();
      btn.onclick = function() {
        var cur = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        setTheme(cur === 'light' ? 'dark' : 'light');
      };
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBtn);
  } else {
    initBtn();
  }
})();
</script>
"""

def create_header(active_tab):
    tabs = [
        ('index.html', 'OVERVIEW', '38+'),
        ('datacenter.html', 'DATA CENTER', '12'),
        ('cyberlab.html', 'CYBER LAB', '5'),
        ('audira-studio.html', 'AUDIRA STUDIO', '5'),
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
    <div class="dh-actions">
      <div class="swatches" id="swatches" role="radiogroup" aria-label="Glow colour"></div>
      <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle Light/Dark Theme" title="Toggle Light / Dark Mode">
        <span class="theme-toggle-icon">
          <svg class="sun-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg class="moon-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </span>
        <span class="theme-toggle-label">DARK</span>
      </button>
    </div>
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

    # Remove existing theme script if present
    if '<script id="theme-ctrl">' in html:
        html = re.sub(r'<script id="theme-ctrl">[\s\S]*?</script>', '', html)

    # Inject or replace NAV_CSS
    if 'var(--dh-w' not in html:
        html = html.replace('</head>', f'<style>{NAV_CSS}</style>\n</head>')
    else:
        html = re.sub(r'<style>\s*:root\s*\{\s*--dh-w:[\s\S]*?</style>', f'<style>{NAV_CSS}</style>', html)

    header_html = create_header(tab_name)
    html = html.replace('<body>', f'<body>\n{header_html}')

    if '</body>' in html:
        html = html.replace('</body>', f'{THEME_SCRIPT}\n</body>')

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Injected header & theme switcher into {filename} [{tab_name}]')

if __name__ == '__main__':
    inject('datacenter.html', 'DATA CENTER')
    inject('cyberlab.html', 'CYBER LAB')
    inject('audira-studio.html', 'AUDIRA STUDIO')
    inject('objects.html', 'OBJECTS')
    inject('cities.html', 'CITIES')
    inject('lumen.html', 'LUMEN')
    inject('computer-demo.html', 'DESK COMPUTER')
