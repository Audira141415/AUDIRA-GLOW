import os
import re

NAV_CSS_LINK = '<link rel="stylesheet" href="assets/audira/audira-nav.css">'
NAV_JS_SCRIPT = '<script src="assets/audira/audira-nav.js"></script>'

THEME_SCRIPT = """
<script id="theme-ctrl">
(function() {
  function setTheme(t) {
    var theme = (t === 'light') ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('audira-glow-theme', theme); } catch(e) {}
    var btns = document.querySelectorAll('#themeToggle, .dh-theme-toggle');
    btns.forEach(function(btn) {
      var lbl = btn.querySelector('.theme-toggle-label');
      if (lbl) lbl.textContent = theme.toUpperCase();
    });
  }
  var saved = 'dark';
  try { saved = localStorage.getItem('audira-glow-theme') || 'dark'; } catch(e) {}
  setTheme(saved);
  
  function initBtn() {
    var btns = document.querySelectorAll('#themeToggle, .dh-theme-toggle');
    btns.forEach(function(btn) {
      var lbl = btn.querySelector('.theme-toggle-label');
      if (lbl) lbl.textContent = (document.documentElement.dataset.theme || 'dark').toUpperCase();
      btn.onclick = function() {
        var cur = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        setTheme(cur === 'light' ? 'dark' : 'light');
      };
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBtn);
  } else {
    initBtn();
  }
})();
</script>
"""

def create_header(active_key):
    # Determine active classes
    act_overview = ' active' if active_key == 'overview' else ''
    act_3d = ' active' if active_key in ('mecha', 'colorfigures', 'shipwright') else ''
    act_colorfigures = ' active' if active_key == 'colorfigures' else ''
    act_shipwright = ' active' if active_key == 'shipwright' else ''
    act_enterprise = ' active' if active_key in ('datacenter', 'cyberlab', 'studio') else ''
    act_galleries = ' active' if active_key in ('cities', 'objects', 'lumen', 'computer') else ''

    return f"""
<header class="dh">
  <div class="dh-in">
    <!-- Brand Logo -->
    <a class="dh-brand" href="index.html" title="AUDIRA GLOW · Interactive Systems Engine">
      <span class="dot"></span>
      <span>AUDIRA GLOW</span>
    </a>

    <!-- Primary Nav Items with Dropdowns -->
    <nav class="dh-nav" aria-label="Master Collections">
      <div class="dh-item">
        <a href="index.html" class="dh-link{act_overview}">Home</a>
      </div>

      <!-- 3D & Mecha Dropdown -->
      <div class="dh-item">
        <a href="playable.html" class="dh-link{act_3d}">
          <span>🎮 3D &amp; Mecha</span>
          <span class="badge">4</span>
        </a>
        <div class="dh-menu">
          <a href="gundam.html" class="dh-menu-link"><span>🤖 Gundam Striker 3D</span><span class="badge">WASD</span></a>
          <a href="playable.html" class="dh-menu-link"><span>🐱 CatBot IK Rig</span><span class="badge">3D</span></a>
          <a href="colorfigures.html" class="dh-menu-link"><span>🕹️ Colorfigures Gallery</span><span class="badge">26</span></a>
          <a href="shipwright.html" class="dh-menu-link"><span>⛵ Shipwright 3D Studio</span><span class="badge">GLB</span></a>
        </div>
      </div>

      <!-- Direct Colorfigures -->
      <div class="dh-item">
        <a href="colorfigures.html" class="dh-link{act_colorfigures}">
          <span>🕹️ Colorfigures</span>
          <span class="badge">26</span>
        </a>
      </div>

      <!-- Direct Shipwright -->
      <div class="dh-item">
        <a href="shipwright.html" class="dh-link{act_shipwright}">
          <span>⛵ Shipwright</span>
          <span class="badge">GLB</span>
        </a>
      </div>

      <!-- Enterprise Infrastructure Dropdown -->
      <div class="dh-item">
        <a href="datacenter.html" class="dh-link{act_enterprise}">
          <span>🏢 Enterprise</span>
          <span class="badge">NOC</span>
        </a>
        <div class="dh-menu">
          <a href="datacenter.html" class="dh-menu-link"><span>🖥️ Data Center Tier IV</span><span class="badge">12</span></a>
          <a href="cyberlab.html" class="dh-menu-link"><span>⚛️ Cyber Lab Sci-Fi</span><span class="badge">5</span></a>
          <a href="audira-studio.html" class="dh-menu-link"><span>📻 Valve Synth Studio</span><span class="badge">5</span></a>
        </div>
      </div>

      <!-- Galleries Dropdown -->
      <div class="dh-item">
        <a href="cities.html" class="dh-link{act_galleries}">
          <span>🏙️ Galleries</span>
          <span class="badge">33</span>
        </a>
        <div class="dh-menu">
          <a href="cities.html" class="dh-menu-link"><span>🏙️ Cyber Cities</span><span class="badge">10</span></a>
          <a href="objects.html" class="dh-menu-link"><span>📠 Classic Objects</span><span class="badge">10</span></a>
          <a href="lumen.html" class="dh-menu-link"><span>💎 Lumen Lightforms</span><span class="badge">12</span></a>
          <a href="computer-demo.html" class="dh-menu-link"><span>🖥️ Desk Computer 3D</span><span class="badge">1</span></a>
        </div>
      </div>
    </nav>

    <!-- Dedicated Search Button (Ctrl+K) -->
    <button class="dh-search-btn" id="openSearchBtn" type="button" aria-label="Search all 75+ Models (Ctrl+K)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span>Search 75+ Models...</span>
      <kbd>Ctrl K</kbd>
    </button>

    <!-- Actions: Swatches & Theme Toggle -->
    <div class="dh-actions">
      <div class="dh-swatches" id="swatches" role="radiogroup" aria-label="Glow colour"></div>
      <button class="dh-theme-toggle" id="themeToggle" type="button" aria-label="Toggle Light/Dark Theme" title="Toggle Light / Dark Mode">
        <span class="dh-theme-toggle-icon">
          <svg class="sun-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg class="moon-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </span>
        <span class="theme-toggle-label">DARK</span>
      </button>
    </div>
  </div>
</header>
"""

def inject(filename, active_key):
    if not os.path.exists(filename):
        return
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove existing <header class="dh"> if present
    if '<header class="dh">' in html:
        html = re.sub(r'<header class="dh">[\s\S]*?</header>', '', html)

    # Remove old theme script
    if '<script id="theme-ctrl">' in html:
        html = re.sub(r'<script id="theme-ctrl">[\s\S]*?</script>', '', html)

    # Remove old style blocks from previous injections
    html = re.sub(r'<style>\s*:root\s*\{\s*--dh-w:[\s\S]*?</style>', '', html)

    # Ensure audira-nav.css is in head
    if 'assets/audira/audira-nav.css' not in html:
        html = html.replace('</head>', f'{NAV_CSS_LINK}\n</head>')

    # Ensure body has has-dh class
    if '<body' in html:
        if 'class="' in html[html.find('<body'):html.find('<body') + 50]:
            html = re.sub(r'<body class="([^"]*)"', r'<body class="\1 has-dh"', html, count=1)
        else:
            html = html.replace('<body>', '<body class="has-dh">', 1)

    # Inject header
    header_html = create_header(active_key)
    # Insert after <body...>
    body_idx = html.find('<body')
    if body_idx != -1:
        end_body_tag = html.find('>', body_idx)
        if end_body_tag != -1:
            html = html[:end_body_tag+1] + '\n' + header_html + '\n' + html[end_body_tag+1:]

    # Inject JS scripts before </body>
    scripts_to_add = ''
    if 'assets/audira/audira-nav.js' not in html:
        scripts_to_add += f'{NAV_JS_SCRIPT}\n'
    scripts_to_add += THEME_SCRIPT

    if '</body>' in html:
        html = html.replace('</body>', f'{scripts_to_add}\n</body>')

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Enhanced {filename} with Universal Nav & Search [{active_key}]')

if __name__ == '__main__':
    inject('index.html', 'overview')
    inject('datacenter.html', 'datacenter')
    inject('cyberlab.html', 'cyberlab')
    inject('audira-studio.html', 'studio')
    inject('objects.html', 'objects')
    inject('cities.html', 'cities')
    inject('lumen.html', 'lumen')
    inject('computer-demo.html', 'computer')
    inject('shipwright.html', 'shipwright')
    inject('colorfigures.html', 'colorfigures')
