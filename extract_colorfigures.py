import json
import os
import sys
import re

content_path = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/8b58ac86-3d31-4d66-83fd-02031b83575a/.system_generated/steps/4/content.md'

with open(content_path, 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('const FIGS = [')
end_idx = text.find('];\n', idx)
if end_idx == -1:
    end_idx = text.find('];', idx)

sub = text[idx + len('const FIGS = '):end_idx + 1]
figs = json.loads(sub)

print(f"Loaded {len(figs)} figures successfully.")

os.makedirs('assets/colorfigures', exist_ok=True)

manifest = []
for i, fig in enumerate(figs):
    fid = fig['id']
    name = fig['name']
    src = fig['src']
    
    file_path = f'assets/colorfigures/{fid}.html'
    with open(file_path, 'w', encoding='utf-8') as f_out:
        f_out.write(src)
        
    manifest.append({
        'index': i + 1,
        'id': fid,
        'name': name,
        'file': file_path,
        'size': len(src)
    })
    print(f"[{i+1:02d}/26] Saved assets/colorfigures/{fid}.html ({len(src)} bytes) - {name}")

with open('assets/colorfigures/manifest.json', 'w', encoding='utf-8') as f_man:
    json.dump(manifest, f_man, indent=2)

print("\nAll 26 figures extracted into assets/colorfigures/ and manifest.json created.")
