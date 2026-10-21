import re, sys
sys.stdout.reconfigure(encoding='utf-8')

for step, label in [(140, '3D DEMO (12)'), (143, 'ANATOMY (4)')]:
    path = f'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/{step}/content.md'
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    print(f"\n==================== {label} ====================")
    # Check for FIGS or figures
    items = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", text)
    seen = set()
    unique = []
    for item in items:
        if item not in seen and len(item) < 40 and not item.startswith(('iso-', 'http', 'viewport', 'color-')):
            seen.add(item)
            unique.append(item)
    for i, it in enumerate(unique[:15]):
        print(f"  {i+1}. {it}")
