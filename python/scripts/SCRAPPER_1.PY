"""
scraper_01_pakistancode_fixed.py
---------------------------------
Fixed scraper for pakistancode.gov.pk

The site does NOT have a /search endpoint.
It uses category-based URLs and direct act URLs.

Family Laws category URL (all 22 family laws listed directly):
https://pakistancode.gov.pk/english/LGu0xVD-apaUY2Fqa-bA==&action=primary&catid=3

Known direct act URLs discovered from search:
- Muslim Family Laws Ordinance 1961
- Family Courts Act 1964
- Dissolution of Muslim Marriages Act 1939
- Guardians and Wards Act 1890
- Child Marriage Restraint Act 1929
- Dowry and Bridal Gifts Act 1976
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from pathlib import Path

OUTPUT_DIR = Path("data/raw/case_law/pakistan_code")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

BASE_URL = "https://pakistancode.gov.pk"

# ── Known Family Law Category Page ────────────────────────────────────────
# This page lists all 22 family laws directly
FAMILY_CATEGORY_URL = (
    "https://pakistancode.gov.pk/english/LGu0xVD-apaUY2Fqa-bA==&action=primary&catid=3"
)

# ── Hardcoded known act URLs (fallback if category scraping fails) ─────────
KNOWN_ACT_URLS = [
    {
        "url":      "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5po-sg-jjjjjjjjjjjjj",
        "title":    "Muslim Family Laws Ordinance, 1961",
        "year":     1961,
        "topic":    "family_general",
    },
    {
        "url":      "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lraQ==-sg-jjjjjjjjjjjjj",
        "title":    "The Family Courts Act, 1964",
        "year":     1964,
        "topic":    "family_general",
    },
    {
        "url":      "https://pakistancode.gov.pk/english/UY2FqaJw2-apaUY2Fqa-apaUY2FwbJs=-sg-jjjjjjjjjjjjj-con-13500",
        "title":    "Dissolution of Muslim Marriages Act, 1939",
        "year":     1939,
        "topic":    "divorce",
    },
]


def infer_topic(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["divorce", "dissolution", "talaq", "khula"]):
        return "divorce"
    if any(k in t for k in ["custody", "guardian", "ward"]):
        return "custody"
    if "maintenance" in t:
        return "maintenance"
    if any(k in t for k in ["dowry", "bridal gift"]):
        return "dowry"
    if any(k in t for k in ["marriage", "nikah"]):
        return "nikah"
    if any(k in t for k in ["succession", "inheritance"]):
        return "inheritance"
    return "family_general"


def infer_province(text: str) -> str:
    t = text.lower()
    if "punjab" in t:
        return "Punjab"
    if "sindh" in t:
        return "Sindh"
    if "khyber" in t or "kpk" in t:
        return "KPK"
    if "balochistan" in t:
        return "Balochistan"
    return "Federal"


def get_all_family_law_links() -> list:
    """
    Scrape the Family Laws category page to get all 22 act links.
    """
    print(f"Fetching Family Laws category page...")
    links = []

    try:
        r = requests.get(FAMILY_CATEGORY_URL, headers=HEADERS, timeout=20)
        print(f"  Status: {r.status_code}")
        soup = BeautifulSoup(r.text, "html.parser")

        # Find all links on the page
        for a in soup.find_all("a", href=True):
            href  = a["href"]
            title = a.get_text(strip=True)

            if not title or len(title) < 5:
                continue

            # Skip nav/footer links
            if any(skip in href.lower() for skip in [
                "javascript", "mailto", "#", "login", "contact", "faq", "search"
            ]):
                continue

            # Build full URL
            if href.startswith("http"):
                full_url = href
            elif href.startswith("/"):
                full_url = BASE_URL + href
            else:
                full_url = BASE_URL + "/english/" + href

            # Only follow links that look like act pages
            # Pakistani code URLs contain encoded strings
            if ("UY2F" in href or "apaUY" in href or
                any(kw in title.lower() for kw in [
                    "act", "ordinance", "law", "rules", "order",
                    "marriage", "family", "divorce", "guardian",
                    "maintenance", "dissolution", "dowry", "child"
                ])):
                links.append({"title": title, "url": full_url})
                print(f"  Found: {title[:60]}")

    except Exception as e:
        print(f"  Error: {e}")

    return links


def scrape_act_page(url: str, title: str, year: int = 0, topic: str = "") -> dict:
    """
    Scrape the full text of a single act page.
    The site shows act text in a content div.
    """
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        print(f"  Status: {r.status_code} | URL: {url[:60]}")
        soup = BeautifulSoup(r.text, "html.parser")

        text = ""

        # Try selectors specific to pakistancode.gov.pk
        for selector in [
            "div.actdata",           # most likely for this site
            "div#actdata",
            "div.lawtext",
            "div#lawtext",
            "div.complete-law",
            "div#complete-law",
            "div.law-content",
            "td.actdata",
            "div.content-law",
            "div#content",
            "div.main",
            "table.act",
            "div.panel-body",
        ]:
            el = soup.select_one(selector)
            if el:
                text = el.get_text(separator="\n", strip=True)
                if len(text) > 200:
                    print(f"  Found text via selector: {selector}")
                    break

        # Fallback: get all paragraph/table text from page body
        if not text or len(text) < 200:
            # Remove boilerplate elements
            for tag in soup(["nav", "header", "footer", "script",
                              "style", "aside", ".navbar", ".menu"]):
                tag.decompose()

            # Get all paragraphs and table cells
            content_tags = soup.find_all(["p", "li", "td", "h1", "h2", "h3", "h4"])
            text = "\n".join(
                t.get_text(strip=True)
                for t in content_tags
                if len(t.get_text(strip=True)) > 10
            )

        # Clean text
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        text = text.strip()

        if len(text) < 100:
            print(f"  WARNING: Very short text ({len(text)} chars) — page may need JS")
            return {}

        # Infer year and topic if not provided
        if not year:
            m = re.search(r'\b(19|20)\d{2}\b', title)
            year = int(m.group()) if m else 0

        if not topic:
            topic = infer_topic(title + " " + text[:300])

        print(f"  Extracted {len(text)} chars | topic: {topic}")

        return {
            "text":           text,
            "act_name":       title,
            "section_number": "",
            "topic_tag":      topic,
            "province":       infer_province(title),
            "language":       "en",
            "year":           year,
            "source_url":     url,
            "is_case_law":    False,
            "chunk_type":     "parent",
            "parent_id":      "",
        }

    except Exception as e:
        print(f"  Error: {e}")
        return {}


def try_pdf_download(url: str, title: str) -> dict:
    """
    Some acts on pakistancode have PDF download links.
    This tries to find and download them.
    """
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(r.text, "html.parser")

        # Look for PDF link
        pdf_link = None
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if ".pdf" in href.lower() or "pdf" in a.get_text(strip=True).lower():
                pdf_link = BASE_URL + href if href.startswith("/") else href
                break

        if pdf_link:
            print(f"  Found PDF: {pdf_link}")
            pdf_dir = OUTPUT_DIR / "pdfs"
            pdf_dir.mkdir(exist_ok=True)

            pdf_r = requests.get(pdf_link, headers=HEADERS, timeout=30)
            filename = re.sub(r'[^\w\-_]', '_', title[:50]) + ".pdf"
            pdf_path = pdf_dir / filename

            with open(pdf_path, "wb") as f:
                f.write(pdf_r.content)
            print(f"  PDF saved: {pdf_path}")
            return {"pdf_path": str(pdf_path), "title": title}

    except Exception as e:
        print(f"  PDF error: {e}")

    return {}


def run():
    records   = []
    seen_urls = set()

    # Step 1: Get all family law links from category page
    print("=" * 60)
    print("Step 1: Getting family law act links from category page")
    print("=" * 60)
    category_links = get_all_family_law_links()
    print(f"\nFound {len(category_links)} links from category page")

    # Step 2: Add hardcoded known URLs as backup
    print("\nStep 2: Adding hardcoded known act URLs")
    all_acts = list(category_links)

    for known in KNOWN_ACT_URLS:
        if known["url"] not in [a["url"] for a in all_acts]:
            all_acts.append(known)
            print(f"  Added: {known['title']}")

    print(f"\nTotal acts to scrape: {len(all_acts)}")

    # Step 3: Scrape each act
    print("\nStep 3: Scraping act text")
    print("=" * 60)

    for i, act in enumerate(all_acts, 1):
        url   = act["url"]
        title = act.get("title", "Unknown Act")
        year  = act.get("year", 0)
        topic = act.get("topic", "")

        if url in seen_urls:
            continue
        seen_urls.add(url)

        print(f"\n[{i}/{len(all_acts)}] {title[:60]}")

        record = scrape_act_page(url, title, year, topic)

        if record and record.get("text"):
            records.append(record)
            # Also try to get PDF
            try_pdf_download(url, title)
        else:
            print(f"  FAILED — no text extracted")

        time.sleep(2)  # be respectful

    # Save results
    output = OUTPUT_DIR / "pakistan_code_acts.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"Saved {len(records)} acts → {output}")

    if records:
        from collections import Counter
        topics = Counter(r["topic_tag"] for r in records)
        print("\nTopic breakdown:")
        for t, c in topics.most_common():
            print(f"  {t}: {c}")
    else:
        print("\nWARNING: No records saved.")
        print("The site may require JavaScript rendering.")
        print("Try manual PDF download from:")
        print("  https://pakistancode.gov.pk/english/LGu0xVD-apaUY2Fqa-bA==&action=primary&catid=3")
        print("\nPlace downloaded PDFs in: data/raw/pdfs/")
        print("Then run 02_load_data.py which handles PDF extraction automatically.")


if __name__ == "__main__":
    run()