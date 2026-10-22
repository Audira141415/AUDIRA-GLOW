import sys
import os
import time
from playwright.sync_api import sync_playwright

PAGES = [
    "index.html",
    "colorfigures.html",
    "playable.html",
    "gundam.html",
    "catbot.html",
    "shipwright.html",
    "datacenter.html",
    "cyberlab.html",
    "audira-studio.html",
    "cities.html",
    "objects.html",
    "lumen.html",
    "computer-demo.html"
]

def test_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        
        for page_name in PAGES:
            page = context.new_page()
            console_errors = []
            page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
            page.on("pageerror", lambda err: console_errors.append(f"[UNCAUGHT] {err}"))
            
            url = f"http://localhost:3000/{page_name}"
            print(f"\n=======================================================", flush=True)
            print(f"Testing: {page_name} ({url})", flush=True)
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=8000)
                page.wait_for_timeout(1000)
                
                # Check status
                status = resp.status if resp else "NO_RESP"
                print(f"Status: {status}")
                
                # Check canvas / svg / elements
                elements_info = page.evaluate("""() => {
                    const canvasList = Array.from(document.querySelectorAll('canvas')).map(c => ({
                        width: c.width,
                        height: c.height,
                        clientWidth: c.clientWidth,
                        clientHeight: c.clientHeight,
                        display: window.getComputedStyle(c).display,
                        visibility: window.getComputedStyle(c).visibility
                    }));
                    const svg = document.querySelector('svg#stage, svg.figure, svg');
                    const svgInfo = svg ? {
                        childrenCount: svg.children.length,
                        innerHTMLSize: svg.innerHTML.length,
                        clientWidth: svg.clientWidth,
                        clientHeight: svg.clientHeight
                    } : null;
                    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
                    const bodyChildren = document.body.children.length;
                    return { canvasList, svgInfo, bodyBg, bodyChildren };
                }""")
                print(f"DOM Info: {elements_info}")
                
                # Test figures if it's colorfigures.html
                if page_name == "colorfigures.html":
                    print("\n--- Checking all figures in colorfigures.html ---")
                    fig_count = page.evaluate("() => document.querySelectorAll('#figList button, .fig-btn, [data-fig]').length")
                    print(f"Figure buttons count: {fig_count}")
                    # Check if stage has rendered content
                    buttons = page.query_selector_all("#figList button")
                    print(f"Found {len(buttons)} figure buttons")
                    for i, btn in enumerate(buttons):
                        btn_text = btn.inner_text().replace('\n', ' ')
                        btn.click()
                        page.wait_for_timeout(200)
                        stage_content_len = page.evaluate("() => { const s = document.querySelector('#stage'); return s ? s.innerHTML.length : 0; }")
                        if stage_content_len < 50:
                            print(f"  [BLANK!] Figure #{i} ({btn_text}): stage innerHTML length is {stage_content_len}!")
                        else:
                            # Check if error occurred during switch
                            pass
                    print(f"Completed testing {len(buttons)} figures in colorfigures.html")

                if console_errors:
                    print("Errors / Warnings:")
                    for e in console_errors:
                        print("  " + e)
                else:
                    print("Console: Clean (0 errors)")
                    
                # Take screenshot
                os.makedirs("test_screenshots", exist_ok=True)
                page.screenshot(path=f"test_screenshots/{page_name.replace('.html', '')}.png")
                
            except Exception as ex:
                print(f"EXCEPTION loading {page_name}: {ex}")
            finally:
                page.close()
                
        browser.close()

if __name__ == "__main__":
    test_pages()
