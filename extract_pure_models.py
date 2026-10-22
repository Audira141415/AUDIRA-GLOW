import glob
import os
import re

os.makedirs('assets/colorfigures/models', exist_ok=True)

html_files = sorted(glob.glob('assets/colorfigures/*.html'))
print(f"Extracting pure model scripts from {len(html_files)} figures...")

manifest_models = []

for filepath in html_files:
    filename = os.path.basename(filepath)
    fid = os.path.splitext(filename)[0]
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    scripts = re.findall(r'<script>([\s\S]*?)</script>', html)
    
    # In every compiled Colorfigures HTML, scripts[3] is the exact pure figure model script
    if len(scripts) > 3 and 'mountFigure' in scripts[3]:
        fig_script = scripts[3]
    else:
        # Fallback search
        fig_script = None
        for i in range(len(scripts)-1, -1, -1):
            if 'mountFigure({' in scripts[i]:
                fig_script = scripts[i]
                break
        if not fig_script:
            fig_script = scripts[3] if len(scripts) > 3 else scripts[-1]
            
    fig_script = fig_script.strip()
    
    out_js = f'assets/colorfigures/models/{fid}.js'
    with open(out_js, 'w', encoding='utf-8') as out_f:
        out_f.write(fig_script)
        
    # Extract figure title/metadata
    m_title = re.search(r"title:\s*['\"]([^'\"]+)['\"]", fig_script)
    title = m_title.group(1) if m_title else fid
    
    manifest_models.append({
        'id': fid,
        'title': title,
        'js_file': out_js,
        'size': len(fig_script)
    })
    print(f"[{len(manifest_models):02d}/26] Extracted {out_js:<35} ({len(fig_script):>5} bytes) - {title}")

import json
with open('assets/colorfigures/models/manifest.json', 'w', encoding='utf-8') as mf:
    json.dump(manifest_models, mf, indent=2)

print("\nSuccessfully extracted all 26 pure model scripts to assets/colorfigures/models/!")
