import os

with open('assets/gallery.html', 'r', encoding='utf-8') as f:
    template = f.read()

s_synth = open('assets/audira/audira-synth.js', 'r', encoding='utf-8').read()
s_pocket = open('assets/audira/audira-pocket.js', 'r', encoding='utf-8').read()
s_tube = open('assets/audira/audira-tube.js', 'r', encoding='utf-8').read()
s_deck = open('assets/audira/audira-deck.js', 'r', encoding='utf-8').read()

combined = '\n\n'.join([s_synth, s_pocket, s_tube, s_deck])

content = template.replace('<title>Iso Figures</title>', '<title>AUDIRA GLOW STUDIO · Custom Interactive Devices</title>')
content = content.replace('Iso figures</span>', 'AUDIRA STUDIO</span>')
content = content.replace("palette: 'ember'", "palette: 'city'")
content = content.replace('/* paste figure scripts here (see examples/) */', combined)

with open('audira-studio.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Done! audira-studio.html generated ({len(content)} bytes)')
