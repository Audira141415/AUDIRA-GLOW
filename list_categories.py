import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def inspect_file(step_num, label):
    path = f'C:/Users/ASUS/.gemini/antigravity-ide/brain/2c002388-1657-4b83-b41b-63b1c2600654/.system_generated/steps/{step_num}/content.md'
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        print(f"\n==================== {label} ====================")
        titles = re.findall(r'<title>(.*?)</title>', text)
        print("Page Title:", titles[0] if titles else "N/A")
        
        # Find all FIG definitions
        figs = re.findall(r"name:\s*['\"]([^'\"]+)['\"],\s*hint:\s*['\"]([^'\"]+)['\"]", text)
        if not figs:
            figs = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", text)
            for i, name in enumerate(figs[:15]):
                print(f"  {i+1}. {name}")
        else:
            for i, (name, hint) in enumerate(figs):
                print(f"  {i+1}. {name} — ({hint})")
    except Exception as e:
        print(f"Error {label}: {e}")

inspect_file(5, "1. OBJECTS (10)")
inspect_file(136, "2. CITIES (10)")
inspect_file(140, "3. 3D DEMO (12)")
inspect_file(141, "4. LUMEN (12)")
inspect_file(143, "5. ANATOMY (4)")
