"""
06_scrape_judgements.py
-----------------------
A Playwright-based scraper to dynamically fetch Case Law (Judgements) from Pakistani courts.
It downloads the PDFs, extracts the text using pdfplumber, and saves the structured
data (with citations and metadata) into the JSON format required by chunk.py.
"""

import os
import json
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
import pdfplumber
import requests
import weaviate
from weaviate.classes.query import Filter

# Set up directories
RAW_DATA_DIR = Path("data/raw")
PDF_DIR = RAW_DATA_DIR / "pdfs"
PDF_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH = RAW_DATA_DIR / "dataset7_judgements.json"

# Reuse the topic tagging logic
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

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extracts text from a downloaded PDF using pdfplumber."""
    try:
        full_text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
        return full_text
    except Exception as e:
        print(f"  [!] Error reading PDF {pdf_path.name}: {e}")
        return ""

def download_pdf(url: str, save_path: Path):
    """Downloads a PDF file using requests."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"  [!] Failed to download PDF from {url}: {e}")
        return False

def check_if_citation_exists(collection, citation):
    """Checks if a judgement with this citation already exists in Weaviate."""
    if not collection: return False
    try:
        response = collection.query.fetch_objects(
            filters=Filter.by_property("section_number").equal(citation),
            limit=1
        )
        return len(response.objects) > 0
    except:
        return False

def scrape_judgements(search_keyword="Family"):
    records = []
    
    # Optional: Connect to Weaviate to check for duplicates
    client = None
    collection = None
    try:
        client = weaviate.connect_to_local(host="localhost", port=8080)
        collection = client.collections.get("LegalChunk")
    except:
        print("Note: Weaviate not connected. Skipping duplicate checks.")
    # ---------------------------------------------------------
    # NOTE: This is a structural template. You will need to 
    # adjust the target URL and CSS selectors (page.locator) 
    # depending on which specific Pakistani High Court you scrape.
    # ---------------------------------------------------------
    TARGET_URL = "https://example-pakistan-court.pk/judgements/search" 
    
    with sync_playwright() as p:
        # headless=False means a physical browser window will open so you can watch it
        browser = p.chromium.launch(headless=False) 
        page = browser.new_page()
        
        print(f"Navigating to {TARGET_URL}...")
        try:
            page.goto(TARGET_URL, timeout=60000)
            
            # Example: Wait for the dynamic judgements table to load
            # page.wait_for_selector("table.judgements-table")
            
            # Example: Type 'Family' into the search bar and press Enter
            # page.fill("input#search-bar", "Family Khula Custody")
            # page.click("button#search-submit")
            # page.wait_for_timeout(3000) # Give it time to load results
            
            # Loop through the rows of the table
            # rows = page.locator("table.judgements-table tbody tr")
            # count = rows.count()
            
            # ---- DUMMY LOOP FOR TESTING THE PIPELINE ----
            count = 0 # Change this to rows.count() when you add real selectors
            print(f"Found {count} judgements on the page.")
            
            for i in range(count):
                # row = rows.nth(i)
                # act_name = row.locator("td.case-title").inner_text()
                # citation = row.locator("td.citation").inner_text()
                # pdf_href = row.locator("td.download a").get_attribute("href")
                
                # Mock data variables
                act_name = f"Mst. Example vs. Example (Case {i})"
                citation = f"PLD 202{i} SC 12{i}"
                pdf_href = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                
                print(f"Processing: {citation} - {act_name}")
                
                # --- NEW: Check for duplicates before downloading ---
                if collection and check_if_citation_exists(collection, citation):
                    print(f"  [~] Citation {citation} already in DB. Skipping.")
                    continue
                # ----------------------------------------------------

                pdf_filename = f"{citation.replace(' ', '_')}.pdf"
                pdf_path = PDF_DIR / pdf_filename
                
                # 1. Download the PDF
                if not pdf_path.exists():
                    success = download_pdf(pdf_href, pdf_path)
                    if not success:
                        continue
                
                # 2. Extract Text
                print(f"  Extracting text from {pdf_filename}...")
                full_text = extract_text_from_pdf(pdf_path)
                
                if not full_text.strip():
                    print("  [!] Extracted text is empty. Might be a scanned image requiring OCR.")
                    continue
                
                # 3. Format as a record for chunk.py
                records.append({
                    "text":           full_text,
                    "act_name":       act_name,          
                    "section_number": citation,          # Storing Citation here so BM25 can index it!
                    "topic_tag":      infer_topic(act_name + " " + full_text[:1000]),
                    "province":       "Federal",         # or extract from court name
                    "language":       "en",
                    "year":           extract_year(citation),
                    "source_url":     pdf_href,
                    "is_case_law":    True,              # CRITICAL: Marks this as a judgement
                })
                
                # Small delay to avoid overwhelming the server
                time.sleep(1)
                
        except Exception as e:
            print(f"Scraping failed: {e}")
            
        finally:
            browser.close()
            if client: client.close()

    # Save all processed judgements
    if records:
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"\nSaved {len(records)} judgements to {OUTPUT_PATH}")
        print("You can now merge this with combined.json and run chunk.py!")
    else:
        print("\nNo records were processed. Please update the script selectors to target a real court website.")

if __name__ == "__main__":
    scrape_judgements()
