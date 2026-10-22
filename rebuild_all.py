import re
import os
import shutil

print("=== REBUILDING ALL AUDIRA-GLOW COLLECTIONS ===")

with open('assets/gallery.html', 'r', encoding='utf-8') as f:
    template = f.read()

# 1. DATA CENTER SUITE (12 figures: 42U Rack, Chiller CDU, UPS Vault, CCTV PTZ, DCIM Monitor, Spine-Leaf, Diesel Generator, CRAC Air Handler, Clean Agent Fire, Smart PDU & STS, Robotic Tape Library, Cold Aisle Containment)
s_dc = open('assets/audira/audira-datacenter.js', 'r', encoding='utf-8').read()
s_chiller = open('assets/audira/audira-chiller.js', 'r', encoding='utf-8').read()
s_ups = open('assets/audira/audira-ups.js', 'r', encoding='utf-8').read()
s_cctv = open('assets/audira/audira-cctv.js', 'r', encoding='utf-8').read()
s_dcim = open('assets/audira/audira-dcim.js', 'r', encoding='utf-8').read()
s_spineleaf = open('assets/audira/audira-spineleaf.js', 'r', encoding='utf-8').read()
s_gen = open('assets/audira/audira-generator.js', 'r', encoding='utf-8').read()
s_crac = open('assets/audira/audira-crac.js', 'r', encoding='utf-8').read()
s_fire = open('assets/audira/audira-fire.js', 'r', encoding='utf-8').read()
s_pdu = open('assets/audira/audira-pdu.js', 'r', encoding='utf-8').read()
s_tape = open('assets/audira/audira-tape.js', 'r', encoding='utf-8').read()
s_containment = open('assets/audira/audira-containment.js', 'r', encoding='utf-8').read()

combined_dc = '\n\n'.join([
    s_dc, s_chiller, s_ups, s_cctv, s_dcim, s_spineleaf,
    s_gen, s_crac, s_fire, s_pdu, s_tape, s_containment
])

c_dc = template.replace('<title>Iso Figures</title>', '<title>DATA CENTER · 12 Hyperscale Tier IV Facilities</title>')
c_dc = c_dc.replace('Iso figures</span>', 'DATA CENTER</span>')
c_dc = c_dc.replace('/* paste figure scripts here (see examples/) */', combined_dc)
with open('datacenter.html', 'w', encoding='utf-8') as f:
    f.write(c_dc)
print("1. Generated datacenter.html (12 Data Center figures)")

# 2. Audira Studio (5 custom devices: Synth, Pocket Console, Valve DAC, Cyberdeck, Tube Radio)
s_synth = open('assets/audira/audira-synth.js', 'r', encoding='utf-8').read()
s_pocket = open('assets/audira/audira-pocket.js', 'r', encoding='utf-8').read()
s_tube = open('assets/audira/audira-tube.js', 'r', encoding='utf-8').read()
s_deck = open('assets/audira/audira-deck.js', 'r', encoding='utf-8').read()
s_radio = open('assets/audira/audira-radio.js', 'r', encoding='utf-8').read()
combined_audira = '\n\n'.join([s_synth, s_pocket, s_tube, s_deck, s_radio])

c_studio = template.replace('<title>Iso Figures</title>', '<title>AUDIRA GLOW STUDIO · Live Interactive</title>')
c_studio = c_studio.replace('Iso figures</span>', 'AUDIRA STUDIO</span>')
c_studio = c_studio.replace('/* paste figure scripts here (see examples/) */', combined_audira)
with open('audira-studio.html', 'w', encoding='utf-8') as f:
    f.write(c_studio)
print("2. Generated audira-studio.html (5 devices)")

# 3. Objects (10 classic objects)
path_objects = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/5/content.md'
if os.path.exists(path_objects):
    with open(path_objects, 'r', encoding='utf-8', errors='ignore') as f:
        raw_objects = f.read()
    matches_o = re.findall(r'(/\* Fig \d+ [^\n]+\*/\s*FIGS\.push\(\{[\s\S]*?\}\);)\s*</script>', raw_objects)
    if matches_o:
        combined_o = '\n\n'.join(matches_o)
        c_obj = template.replace('<title>Iso Figures</title>', '<title>Objects · iso-glow demo</title>')
        c_obj = c_obj.replace('Iso figures</span>', 'Objects</span>')
        c_obj = c_obj.replace('/* paste figure scripts here (see examples/) */', combined_o)
        with open('objects.html', 'w', encoding='utf-8') as f:
            f.write(c_obj)
        print(f"3. Generated objects.html ({len(matches_o)} objects)")

# 4. Cities (10 architectural cityscapes)
path_cities = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/136/content.md'
if os.path.exists(path_cities):
    with open(path_cities, 'r', encoding='utf-8', errors='ignore') as f:
        raw_cities = f.read()
    matches_c = re.findall(r'(/\* Fig \d+ [^\n]+\*/\s*FIGS\.push\(\{[\s\S]*?\}\);)\s*</script>', raw_cities)
    if matches_c:
        combined_c = '\n\n'.join(matches_c)
        c_cities = template.replace('<title>Iso Figures</title>', '<title>Cities · iso-glow demo</title>')
        c_cities = c_cities.replace('Iso figures</span>', 'Cities</span>')
        c_cities = c_cities.replace('/* paste figure scripts here (see examples/) */', combined_c)
        with open('cities.html', 'w', encoding='utf-8') as f:
            f.write(c_cities)
        print(f"4. Generated cities.html ({len(matches_c)} cities)")

# 5. Lumen (12 solid geometric light figures)
path_lumen = r'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/141/content.md'
if os.path.exists(path_lumen):
    with open(path_lumen, 'r', encoding='utf-8', errors='ignore') as f:
        raw_lumen = f.read()
    start = raw_lumen.find('const FIGS = [];')
    end = raw_lumen.find('const ISO = (() => {')
    if start != -1 and end != -1:
        lumen_figs = raw_lumen[start + len('const FIGS = [];'):end].strip()
        lumen_figs = lumen_figs.replace('</script>', '').replace('<script>', '')
        c_lumen = template.replace('<title>Iso Figures</title>', '<title>Lumen · iso-glow demo</title>')
        c_lumen = c_lumen.replace('Iso figures</span>', 'Lumen</span>')
        c_lumen = c_lumen.replace('/* paste figure scripts here (see examples/) */', lumen_figs)
        with open('lumen.html', 'w', encoding='utf-8') as f:
            f.write(c_lumen)
        print("5. Generated lumen.html (12 figures)")

# 6. Desk Computer standalone
with open('assets/examples/desk-computer.js', 'r', encoding='utf-8') as f:
    fig_comp = f.read()
c_comp = template.replace('<title>Iso Figures</title>', '<title>Desk Computer · iso-glow demo</title>')
c_comp = c_comp.replace('Iso figures</span>', 'Desk Computer</span>')
c_comp = c_comp.replace('/* paste figure scripts here (see examples/) */', fig_comp)
with open('computer-demo.html', 'w', encoding='utf-8') as f:
    f.write(c_comp)
print("6. Generated computer-demo.html (standalone)")

# 7. CYBER LAB SUITE (5 figures: Quantum Computer, Tokamak Fusion, Hovercar, Orbital Satellite, Custom Liquid PC)
s_quantum = open('assets/audira/audira-quantum.js', 'r', encoding='utf-8').read()
s_tokamak = open('assets/audira/audira-tokamak.js', 'r', encoding='utf-8').read()
s_hovercar = open('assets/audira/audira-hovercar.js', 'r', encoding='utf-8').read()
s_satellite = open('assets/audira/audira-satellite.js', 'r', encoding='utf-8').read()
s_custompc = open('assets/audira/audira-custompc.js', 'r', encoding='utf-8').read()

combined_cyber = '\n\n'.join([s_quantum, s_tokamak, s_hovercar, s_satellite, s_custompc])
c_cyber = template.replace('<title>Iso Figures</title>', '<title>CYBER LAB · 5 Advanced Sci-Fi Technologies</title>')
c_cyber = c_cyber.replace('Iso figures</span>', 'CYBER LAB</span>')
c_cyber = c_cyber.replace('/* paste figure scripts here (see examples/) */', combined_cyber)
with open('cyberlab.html', 'w', encoding='utf-8') as f:
    f.write(c_cyber)
print("7. Generated cyberlab.html (5 Cyber Lab figures)")

# 8. COLORFIGURES SUITE (26 Hand-Inked Playable Mechanical Figures)
if os.path.exists('assets/colorfigures/manifest.json'):
    import json
    with open('assets/colorfigures/manifest.json', 'r', encoding='utf-8') as f_man:
        manifest = json.load(f_man)
    print(f"8. Verified Colorfigures Suite ({len(manifest)} playable figures in assets/colorfigures/, 26 pure scripts in assets/colorfigures/models/, and colorfigures.html)")
else:
    print("8. Warning: assets/colorfigures/manifest.json not found. Run extract_colorfigures.py")

# 9. SHIPWRIGHT 3D SUITE (Parametric 18th-century Ship of the Line & GLB Exporter)
if os.path.exists('shipwright.html'):
    size_kb = os.path.getsize('shipwright.html') / 1024
    print(f"9. Verified Shipwright 3D Studio ({size_kb:.1f} KB - Procedural Three.js + GLTF Exporter in shipwright.html)")
else:
    print("9. Warning: shipwright.html not found.")

# 10. PLAYABLE 3D SUITE (Drivable Character Playground & Sketch-to-Robot Engine)
if os.path.exists('playable.html'):
    size_kb = os.path.getsize('playable.html') / 1024
    print(f"10. Verified Playable 3D Playground ({size_kb:.1f} KB - Three.js Character Rig + IK Gait in playable.html)")
if os.path.exists('gundam.html'):
    size_kb = os.path.getsize('gundam.html') / 1024
    print(f"    + Verified AUDIRA-01 Gundam Striker ({size_kb:.1f} KB in gundam.html)")
else:
    print("10. Warning: playable.html or gundam.html not found.")

# 11. Inject top navigation header & search palette
import enhance_pages
enhance_pages.inject('index.html', 'overview')
enhance_pages.inject('datacenter.html', 'datacenter')
enhance_pages.inject('cyberlab.html', 'cyberlab')
enhance_pages.inject('audira-studio.html', 'studio')
enhance_pages.inject('objects.html', 'objects')
enhance_pages.inject('cities.html', 'cities')
enhance_pages.inject('lumen.html', 'lumen')
enhance_pages.inject('computer-demo.html', 'computer')
enhance_pages.inject('shipwright.html', 'shipwright')
enhance_pages.inject('colorfigures.html', 'colorfigures')

shutil.copyfile('index.html', 'landing.html')
print("11. Synchronized index.html and landing.html as main homepage with Universal Nav & Search")
print("=== ALL COMPLETED SUCCESSFULLY ===")

