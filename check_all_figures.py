import sys
import os
import time
from playwright.sync_api import sync_playwright

SUITES = [
    { "file": "datacenter.html", "name": "Data Center", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "cyberlab.html", "name": "Cyber Lab", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "audira-studio.html", "name": "Audira Studio", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "cities.html", "name": "Cyber Cities", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "objects.html", "name": "Classic Objects", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "lumen.html", "name": "Lumen Lightforms", "selector": ".side-item, [data-fig-btn], button[data-idx], .suite-nav button, a.side-nav-item, [role=tab]" },
    { "file": "colorfigures.html", "name": "Colorfigures", "selector": ".fig-item" }
]

def check_all_figures():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        for suite in SUITES:
            url = f"http://localhost:3000/{suite['file']}"
            print(f"\n=======================================================", flush=True)
            print(f"Testing Suite: {suite['name']} ({suite['file']})", flush=True)
            page.goto(url, wait_until="domcontentloaded", timeout=10000)
            page.wait_for_timeout(1000)
            
            # Find the figure buttons or list items
            fig_elements_info = page.evaluate("""() => {
                const candidates = [
                    ...document.querySelectorAll('.layout > nav button'),
                    ...document.querySelectorAll('nav#nav button'),
                    ...document.querySelectorAll('.fig-item')
                ];
                return candidates.map((el, i) => ({
                    index: i,
                    text: el.innerText.trim().replace(/\\n/g, ' '),
                    tag: el.tagName,
                    className: el.className
                }));
            }""")
            
            print(f"Found {len(fig_elements_info)} items in navigation sidebar.", flush=True)
            
            # Test clicking each item
            for i, info in enumerate(fig_elements_info):
                errs = []
                page.on("pageerror", lambda err: errs.append(str(err)))
                
                # Click the item by nth matching element
                clicked = page.evaluate(f"""(idx) => {{
                    const candidates = [
                        ...document.querySelectorAll('.layout > nav button'),
                        ...document.querySelectorAll('nav#nav button'),
                        ...document.querySelectorAll('.fig-item')
                    ];
                    if (candidates[idx]) {{
                        candidates[idx].click();
                        return true;
                    }}
                    return false;
                }}""", i)
                
                page.wait_for_timeout(300)
                
                # Check stage SVG or canvas or iframe
                stage_status = page.evaluate("""() => {
                    const s = document.querySelector('svg#stage, #stage svg, #figureFrame');
                    if (!s) return { found: false };
                    if (s.tagName.toLowerCase() === 'iframe') {
                        return { found: true, isIframe: true, src: s.src };
                    }
                    const innerLen = s.innerHTML.length;
                    const children = s.children.length;
                    const bcr = s.getBoundingClientRect();
                    return { found: true, isIframe: false, innerLen, children, width: bcr.width, height: bcr.height };
                }""")
                
                status_str = "OK"
                if not stage_status.get("found"):
                    status_str = "STAGE_NOT_FOUND"
                elif not stage_status.get("isIframe") and stage_status.get("innerLen", 0) < 50:
                    status_str = f"BLANK_BLACK (innerHTML len={stage_status.get('innerLen')})"
                
                if errs:
                    status_str += f" | JS_ERRORS: {errs}"
                    
                print(f"  [{i+1}/{len(fig_elements_info)}] {info['text']} -> {status_str}", flush=True)
                
        browser.close()

if __name__ == "__main__":
    check_all_figures()
