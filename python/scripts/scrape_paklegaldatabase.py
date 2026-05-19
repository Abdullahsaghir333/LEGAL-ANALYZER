"""
scrape_paklegaldatabase.py
--------------------------
Playwright-based scraper for paklegaldatabase.com to bypass Cloudflare 403 protection.
Extracts family law judgements, titles, and citations, saving them directly
to data/raw/case_law/paklegaldatabase_family.json.
"""

import os
import json
import time
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT_DIR = Path("data/raw/case_law")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "paklegaldatabase_family.json"

BASE_URL = "https://www.paklegaldatabase.com"
# Testing both possible category URLs
TARGET_URLS = [
    f"{BASE_URL}/family-law",
    f"{BASE_URL}/category/family-law",
    f"{BASE_URL}/judgements/?search=family+law"
]

TOPIC_MAP = {
    "family":       "family_general",
    "marriage":     "nikah",
    "divorce":      "divorce",
    "dissolution":  "divorce",
    "talaq":        "divorce",
    "khula":        "divorce",
    "maintenance":  "maintenance",
    "custody":      "custody",
    "guardian":     "custody",
    "dowry":        "dowry",
    "bridal":       "dowry",
    "child":        "child_rights",
    "inheritance":  "inheritance",
    "succession":   "inheritance",
    "nikah":        "nikah",
    "dower":        "dower",
}

def infer_topic(text: str) -> str:
    text_lower = text.lower()
    for keyword, tag in TOPIC_MAP.items():
        if keyword in text_lower:
            return tag
    return "family_general"

def extract_year(text: str) -> int:
    match = re.search(r'\b(19|20)\d{2}\b', text)
    if match: return int(match.group())
    return 0

def scrape_judgements(max_pages=5):
    records = []
    
    print("--- Starting Playwright Browser (Bypassing Cloudflare 403) ---")
    
    with sync_playwright() as p:
        # headless=True for clean background execution
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Try navigating to the target URLs until one succeeds
        valid_url = None
        for test_url in TARGET_URLS:
            print(f"Testing access to {test_url}...")
            try:
                response = page.goto(test_url, timeout=30000, wait_until="domcontentloaded")
                if response and response.status < 400:
                    valid_url = test_url
                    print(f"  [+] Connected successfully to: {valid_url}")
                    break
                else:
                    status = response.status if response else "Unknown"
                    print(f"  [-] Access restricted or not found (Status: {status})")
            except Exception as e:
                print(f"  [-] Error reaching {test_url}: {e}")

        if not valid_url:
            print("\n[!] Could not bypass protection or locate family law category page.")
            print("Note: PakLegalDatabase may require user authentication or premium membership.")
            browser.close()
            return

        # Proceed with scraping pages
        for page_num in range(1, max_pages + 1):
            print(f"\n--- Scraping Page {page_num} ---")
            if page_num > 1:
                paginated_url = f"{valid_url}?page={page_num}" if "?" in valid_url else f"{valid_url}/page/{page_num}/"
                try:
                    page.goto(paginated_url, timeout=30000, wait_until="domcontentloaded")
                except Exception as e:
                    print(f"Stopping pagination: {e}")
                    break
            
            # Wait for content to render
            page.wait_for_timeout(3000)

            # Locate links to judgements
            link_elements = page.locator("a[href*='judgement'], a[href*='/case/'], article a.more-link, h2 a, h3 a").all()
            
            urls_on_page = []
            for elem in link_elements:
                try:
                    href = elem.get_attribute("href")
                    title = elem.inner_text().strip()
                    if href and title and not any(skip in href.lower() for skip in ["category", "tag", "login", "author", "about"]):
                        full_u = BASE_URL + href if href.startswith("/") else href
                        if (title, full_u) not in urls_on_page:
                            urls_on_page.append((title, full_u))
                except:
                    pass

            if not urls_on_page:
                print("No valid judgement links found on this page. Stopping.")
                break

            print(f"Found {len(urls_on_page)} candidate links on page {page_num}.")

            # Open each judgement
            for title, j_url in urls_on_page:
                print(f"  Fetching: {title[:50]}... ({j_url})")
                try:
                    j_page = context.new_page()
                    j_page.goto(j_url, timeout=25000, wait_until="domcontentloaded")
                    j_page.wait_for_timeout(2000)

                    # Extract judgement body
                    body_text = ""
                    for selector in ["div.judgement-text", "div.entry-content", "div.post-content", "article", "main"]:
                        if j_page.locator(selector).count() > 0:
                            body_text = j_page.locator(selector).first.inner_text()
                            break

                    if not body_text:
                        body_text = j_page.locator("body").inner_text()

                    if len(body_text.strip()) > 300:
                        records.append({
                            "text":           body_text.strip(),
                            "act_name":       title,
                            "section_number": "",
                            "topic_tag":      infer_topic(title + " " + body_text[:500]),
                            "province":       "Federal",
                            "language":       "en",
                            "year":           extract_year(title + " " + body_text[:500]),
                            "source_url":     j_url,
                            "is_case_law":    True,
                        })
                        print(f"    [+] Saved record: {title[:40]}")

                    j_page.close()
                    time.sleep(1)

                except Exception as ex:
                    print(f"    [!] Error fetching judgement: {ex}")
                    try: j_page.close() 
                    except: pass

        browser.close()

    if records:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"\n=======================================================")
        print(f"Scraping complete! Saved {len(records)} judgements to:")
        print(f"-> {OUTPUT_FILE}")
        print(f"=======================================================")
    else:
        print("\n[!] No judgements could be successfully scraped. The website may have strict bot protection or paywalls.")

if __name__ == "__main__":
    scrape_judgements(max_pages=3)
