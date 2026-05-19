"""
05_scrape_data.py
-----------------
Template script to scrape legal data from web pages, parse the HTML,
and save it as a JSON file in the exact format required by chunk.py.
"""

import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import re

RAW_DATA_DIR = Path("data/raw")
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH = RAW_DATA_DIR / "dataset6_scraped.json"

# Topic mapping logic (same as load_data.py)
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

def infer_province(text: str) -> str:
    text_lower = text.lower()
    if "punjab" in text_lower: return "Punjab"
    elif "sindh" in text_lower: return "Sindh"
    elif "khyber" in text_lower or "kpk" in text_lower: return "KPK"
    elif "balochistan" in text_lower: return "Balochistan"
    return "Federal"

def extract_year(text: str) -> int:
    match = re.search(r'\b(19|20)\d{2}\b', text)
    if match: return int(match.group())
    return 0

def scrape_website(url: str) -> dict:
    """
    Scrapes a single URL. You MUST customize the BeautifulSoup selectors 
    (like `soup.find()`) based on the HTML structure of the actual website you are scraping.
    """
    print(f"Scraping {url}...")
    try:
        # We use a user-agent to avoid getting blocked by simple bot-protections
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # --- CUSTOMIZE THESE SELECTORS ---
        # Example 1: Extracting the Title (e.g. from an <h1> tag or <title>)
        title_element = soup.find("h1")
        act_name = title_element.get_text(strip=True) if title_element else "Unknown Act"
        
        # Example 2: Extracting the Document Body (e.g. from a specific <div>)
        # Change 'main-content' to the actual class or ID of the text container on the site
        content_element = soup.find("div", class_="main-content") 
        
        if not content_element:
            # Fallback: Extract all paragraphs on the page
            paragraphs = soup.find_all("p")
            full_text = "\n\n".join([p.get_text(strip=True) for p in paragraphs])
        else:
            full_text = content_element.get_text(separator="\n\n", strip=True)
        # ---------------------------------

        return {
            "act_name": act_name,
            "text": full_text
        }

    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return None

def main():
    # List of URLs you want to scrape (Add real links here)
    urls_to_scrape = [
        # "http://example-pakistan-law-site.com/act/123",
        # "http://example-pakistan-law-site.com/act/456"
    ]
    
    if not urls_to_scrape:
        print("Please open scrape_data.py and add URLs to the 'urls_to_scrape' list.")
        return

    records = []
    
    for url in urls_to_scrape:
        scraped_data = scrape_website(url)
        
        if scraped_data and scraped_data["text"]:
            act_name = scraped_data["act_name"]
            text = scraped_data["text"]
            
            # Format the data exactly like load_data.py so chunk.py can accept it
            record = {
                "text":           text,
                "act_name":       act_name,
                "section_number": "", 
                "topic_tag":      infer_topic(act_name + " " + text[:500]),
                "province":       infer_province(act_name),
                "language":       "en",
                "year":           extract_year(act_name),
                "source_url":     url,
                "is_case_law":    False,
            }
            records.append(record)
            print(f"Successfully processed: {act_name}")

    if records:
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"\nSaved {len(records)} scraped records to {OUTPUT_PATH}")
        print("You can now add these to combined.json and run chunk.py!")

if __name__ == "__main__":
    main()
