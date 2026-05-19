"""
scraper_02_molaw_fixed.py
--------------------------
FIXED version of molaw.gov.pk scraper.

Key discovery: molaw.gov.pk does NOT have a laws listing page.
It hosts direct PDF files at known URLs like:
  molaw.gov.pk/SiteImage/Misc/files/THE WEST PAKISTAN FAMILY COURTS ACT, 1964.pdf
  molaw.gov.pk/userfiles1/file/Family Court Act, 1964.pdf

Also discovered direct pakistancode.gov.pk act URLs from search.

Strategy:
  1. Download known PDFs directly from molaw.gov.pk
  2. Also fetch known acts from pakistancode.gov.pk using correct URLs
  3. Extract text from PDFs using pdfplumber
  4. Save as JSON for chunking pipeline
"""

import requests
import pdfplumber
import json
import time
import re
import io
from pathlib import Path

OUTPUT_DIR = Path("data/raw/case_law/molaw")
PDF_DIR    = OUTPUT_DIR / "pdfs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PDF_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/pdf,text/html,*/*",
}

# ── Direct PDF URLs from molaw.gov.pk ─────────────────────────────────────
MOLAW_PDF_URLS = [
    {
        "url":   "https://molaw.gov.pk/SiteImage/Misc/files/THE%20WEST%20PAKISTAN%20FAMILY%20COURTS%20ACT,%201964.pdf",
        "title": "The West Pakistan Family Courts Act, 1964",
        "year":  1964,
        "topic": "family_general",
    },
    {
        "url":   "http://www.molaw.gov.pk/userfiles1/file/Family%20Court%20Act,%201964.pdf",
        "title": "Family Courts Act, 1964",
        "year":  1964,
        "topic": "family_general",
    },
    {
        "url":   "https://molaw.gov.pk/SiteImage/Misc/files/anti%20rape%20trial0001.pdf",
        "title": "Anti Rape Trial Procedure Rules",
        "year":  0,
        "topic": "family_general",
    },
]

# ── Direct pakistancode.gov.pk act URLs (discovered from real search) ──────
PAKISTANCODE_ACT_URLS = [
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cJyX-sg-jjjjjjjjjjjjj",
        "title": "Muslim Family Laws Ordinance, 1961",
        "year":  1961,
        "topic": "family_general",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5po-sg-jjjjjjjjjjjjj",
        "title": "Muslim Family Laws Ordinance, 1961 (alternate)",
        "year":  1961,
        "topic": "family_general",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cJaW-sg-jjjjjjjjjjjjj",
        "title": "Dissolution of Muslim Marriages Act, 1939",
        "year":  1939,
        "topic": "divorce",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cJc=-sg-jjjjjjjjjjjjj",
        "title": "Guardians and Wards Act, 1890",
        "year":  1890,
        "topic": "custody",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-bpuUY2Rp-sg-jjjjjjjjjjjjj",
        "title": "Dowry and Bridal Gifts (Restriction) Act, 1976",
        "year":  1976,
        "topic": "dowry",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2NpZpg=-sg-jjjjjjjjjjjjj",
        "title": "Child Marriage Restraint Act, 1929",
        "year":  1929,
        "topic": "nikah",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5hm-sg-jjjjjjjjjjjjj",
        "title": "West Pakistan Muslim Personal Law (Shariat) Application Act",
        "year":  0,
        "topic": "family_general",
    },
    {
        "url":   "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lraQ==-sg-jjjjjjjjjjjjj",
        "title": "The Family Courts Act, 1964",
        "year":  1964,
        "topic": "family_general",
    },
]

# ── Direct PDF URLs from pakistancode.gov.pk ──────────────────────────────
PAKISTANCODE_PDF_URLS = [
    {
        "url":   "https://pakistancode.gov.pk/pdffiles/administratorcc19213a335396659068c340f4dbe7a9.pdf",
        "title": "Rules Under Muslim Family Laws Ordinance, 1961",
        "year":  1961,
        "topic": "family_general",
    },
    {
        "url":   "https://pakistancode.gov.pk/pdffiles/administratora2b6f3407a109a491d47d649f6ff0c01.pdf",
        "title": "Pakistan Citizenship Act, 1951",
        "year":  1951,
        "topic": "family_general",
    },
]


# ── Helper functions ───────────────────────────────────────────────────────

def infer_topic(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["divorce", "dissolution", "talaq", "khula"]):
        return "divorce"
    if any(k in t for k in ["custody", "guardian", "ward"]):
        return "custody"
    if "maintenance" in t:
        return "maintenance"
    if any(k in t for k in ["dowry", "bridal"]):
        return "dowry"
    if any(k in t for k in ["marriage", "nikah"]):
        return "nikah"
    return "family_general"


def infer_province(text: str) -> str:
    t = text.lower()
    if "punjab" in t:   return "Punjab"
    if "sindh" in t:    return "Sindh"
    if "khyber" in t:   return "KPK"
    if "balochistan" in t: return "Balochistan"
    return "Federal"


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"    pdfplumber error: {e}")
    return text.strip()


def download_pdf(url: str, title: str) -> str:
    """Download a PDF and return extracted text."""
    try:
        print(f"  Downloading PDF: {url[:70]}")
        r = requests.get(url, headers=HEADERS, timeout=30)
        print(f"  Status: {r.status_code} | Size: {len(r.content)} bytes")

        if r.status_code != 200:
            print(f"  FAILED: HTTP {r.status_code}")
            return ""

        if len(r.content) < 1000:
            print(f"  FAILED: Response too small — likely not a PDF")
            return ""

        # Save PDF to disk
        filename = re.sub(r'[^\w\-_]', '_', title[:60]) + ".pdf"
        pdf_path = PDF_DIR / filename
        with open(pdf_path, "wb") as f:
            f.write(r.content)
        print(f"  Saved PDF: {pdf_path}")

        # Extract text
        text = extract_text_from_pdf_bytes(r.content)
        print(f"  Extracted: {len(text)} chars")
        return text

    except Exception as e:
        print(f"  Error downloading PDF: {e}")
        return ""


def scrape_html_page(url: str, title: str) -> str:
    """Scrape text from an HTML page (for pakistancode act pages)."""
    from bs4 import BeautifulSoup

    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        print(f"  Status: {r.status_code}")

        if r.status_code != 200:
            return ""

        soup = BeautifulSoup(r.text, "html.parser")

        text = ""
        for selector in [
            "div.actdata", "div#actdata",
            "div.lawtext", "div#lawtext",
            "div.complete-law", "div.content",
            "div#content", "article",
            "div.panel-body", "td.actdata",
        ]:
            el = soup.select_one(selector)
            if el:
                text = el.get_text(separator="\n", strip=True)
                if len(text) > 200:
                    print(f"  Found text via: {selector}")
                    break

        # Fallback
        if not text or len(text) < 200:
            for tag in soup(["nav", "header", "footer", "script", "style"]):
                tag.decompose()
            paras = soup.find_all(["p", "li", "td", "h2", "h3", "h4"])
            text = "\n".join(
                p.get_text(strip=True) for p in paras
                if len(p.get_text(strip=True)) > 15
            )

        # Also check if there's a PDF link on this page
        pdf_links = [
            a["href"] for a in soup.find_all("a", href=True)
            if ".pdf" in a["href"].lower()
        ]
        if pdf_links and (not text or len(text) < 200):
            pdf_url = pdf_links[0]
            if not pdf_url.startswith("http"):
                pdf_url = "https://pakistancode.gov.pk" + pdf_url
            print(f"  Found PDF link on page: {pdf_url[:60]}")
            text = download_pdf(pdf_url, title) or text

        return re.sub(r'\n{3,}', '\n\n', text).strip()

    except Exception as e:
        print(f"  HTML scrape error: {e}")
        return ""


def make_record(text: str, title: str, year: int, topic: str, url: str,
                is_case_law: bool = False) -> dict:
    if not topic:
        topic = infer_topic(title + " " + text[:300])
    if not year:
        m = re.search(r'\b(19|20)\d{2}\b', title)
        year = int(m.group()) if m else 0

    return {
        "text":           text,
        "act_name":       title,
        "section_number": "",
        "topic_tag":      topic,
        "province":       infer_province(title),
        "language":       "en",
        "year":           year,
        "source_url":     url,
        "is_case_law":    is_case_law,
        "chunk_type":     "parent",
        "parent_id":      "",
    }


# ── Main ───────────────────────────────────────────────────────────────────

def run():
    records = []

    # ── Phase 1: molaw.gov.pk PDFs ─────────────────────────────────────────
    print("=" * 60)
    print("Phase 1: Downloading PDFs from molaw.gov.pk")
    print("=" * 60)

    for act in MOLAW_PDF_URLS:
        print(f"\n{act['title']}")
        text = download_pdf(act["url"], act["title"])
        if text:
            records.append(make_record(
                text, act["title"], act["year"], act["topic"], act["url"]
            ))
        time.sleep(2)

    # ── Phase 2: pakistancode.gov.pk HTML pages ────────────────────────────
    print("\n" + "=" * 60)
    print("Phase 2: Scraping HTML act pages from pakistancode.gov.pk")
    print("=" * 60)

    for act in PAKISTANCODE_ACT_URLS:
        print(f"\n{act['title']}")
        text = scrape_html_page(act["url"], act["title"])
        if text and len(text) > 100:
            print(f"  Got {len(text)} chars")
            records.append(make_record(
                text, act["title"], act["year"], act["topic"], act["url"]
            ))
        else:
            print(f"  HTML failed — trying PDF download link on same page")
        time.sleep(2)

    # ── Phase 3: pakistancode.gov.pk direct PDFs ──────────────────────────
    print("\n" + "=" * 60)
    print("Phase 3: Downloading direct PDFs from pakistancode.gov.pk")
    print("=" * 60)

    for act in PAKISTANCODE_PDF_URLS:
        print(f"\n{act['title']}")
        text = download_pdf(act["url"], act["title"])
        if text:
            records.append(make_record(
                text, act["title"], act["year"], act["topic"], act["url"]
            ))
        time.sleep(2)

    # ── Save results ───────────────────────────────────────────────────────
    output = OUTPUT_DIR / "molaw_acts.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"Total records saved: {len(records)}")
    print(f"Output: {output}")
    print(f"PDFs saved in: {PDF_DIR}")

    if records:
        for r in records:
            print(f"  [{r['year']}] {r['act_name'][:55]} | {len(r['text'])} chars")
    else:
        print("\nWARNING: 0 records — all downloads failed.")
        print("Possible reasons:")
        print("  1. Site is blocking requests — try opening URLs in browser manually")
        print("  2. PDFs require authentication")
        print("  3. Network issue")
        print("\nManual fallback:")
        print("  Download PDFs from the URLs above in your browser")
        print("  Save to: data/raw/pdfs/")
        print("  Run 02_load_data.py — it will extract text automatically")


if __name__ == "__main__":
    run()