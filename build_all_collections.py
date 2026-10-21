import re
import os

with open('assets/gallery.html', 'r', encoding='utf-8') as f:
    template = f.read()

# 1. Build cities.html from step 136
path_cities = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/136/content.md'
if os.path.exists(path_cities):
    with open(path_cities, 'r', encoding='utf-8', errors='ignore') as f:
        raw_cities = f.read()
    matches_c = re.findall(r'(/\* Fig \d+ [^\n]+\*/\s*FIGS\.push\(\{[\s\S]*?\}\);)\s*</script>', raw_cities)
    if matches_c:
        combined_c = '\n\n'.join(matches_c)
        content_c = template.replace('<title>Iso Figures</title>', '<title>Cities · iso-glow demo</title>')
        content_c = content_c.replace('Iso figures</span>', 'Cities</span>')
        content_c = content_c.replace("palette: 'ember'", "palette: 'city'")
        content_c = content_c.replace('/* paste figure scripts here (see examples/) */', combined_c)
        with open('cities.html', 'w', encoding='utf-8') as f:
            f.write(content_c)
        print(f"Generated cities.html with {len(matches_c)} figures")

# 2. Build lumen.html from step 141
path_lumen = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/141/content.md'
if os.path.exists(path_lumen):
    with open(path_lumen, 'r', encoding='utf-8', errors='ignore') as f:
        raw_lumen = f.read()
    start = raw_lumen.find('const FIGS = [];')
    end = raw_lumen.find('const ISO = (() => {')
    if start != -1 and end != -1:
        # Extract figures code
        lumen_figs = raw_lumen[start + len('const FIGS = [];'):end].strip()
        # Clean closing/opening script tags if any
        lumen_figs = lumen_figs.replace('</script>', '').replace('<script>', '')
        content_l = template.replace('<title>Iso Figures</title>', '<title>Lumen · iso-glow demo</title>')
        content_l = content_l.replace('Iso figures</span>', 'Lumen</span>')
        content_l = content_l.replace("palette: 'ember'", "palette: 'ember'")
        content_l = content_l.replace('/* paste figure scripts here (see examples/) */', lumen_figs)
        with open('lumen.html', 'w', encoding='utf-8') as f:
            f.write(content_l)
        print("Generated lumen.html successfully")
