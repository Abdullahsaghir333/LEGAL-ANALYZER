"""
scraper_03_fsc_fixed.py
------------------------
FIXED Federal Shariat Court + Supreme Court scraper.

Real URL structure discovered:
  FSC Leading Judgements (with PDF download links):
    https://www.federalshariatcourt.gov.pk/en/leading-judgements/

  Supreme Court latest judgements (PDF downloads):
    https://www.supremecourt.gov.pk/latest-judgements/
    https://www.supremecourt.gov.pk/downloads_judgements/<filename>.pdf

Strategy: scrape the judgement listing tables → find PDF links → download → extract text
"""

import requests
import pdfplumber
import json
import time
import re
import io
from pathlib import Path
from bs4 import BeautifulSoup

FSC_OUTPUT_DIR = Path("data/raw/case_law/federal_shariat_court")
SC_OUTPUT_DIR  = Path("data/raw/case_law/supreme_court")
FSC_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
SC_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(FSC_OUTPUT_DIR / "pdfs").mkdir(exist_ok=True)
(SC_OUTPUT_DIR  / "pdfs").mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

FAMILY_KEYWORDS = [
    "family", "divorce", "talaq", "khula", "nikah", "marriage",
    "custody", "guardian", "maintenance", "dowry", "mehr", "dower",
    "dissolution", "conjugal", "muslim personal", "mflo",
    "chaddar", "parchi"   # FSC-specific terms
]


# ── Helpers ────────────────────────────────────────────────────────────────

def is_family_related(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in FAMILY_KEYWORDS)


def infer_topic(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["divorce", "dissolution", "talaq", "khula"]):
        return "divorce"
    if any(k in t for k in ["custody", "guardian", "ward"]):
        return "custody"
    if "maintenance" in t:
        return "maintenance"
    if any(k in t for k in ["dowry", "bridal", "mehr", "dower"]):
        return "dowry"
    if any(k in t for k in ["marriage", "nikah", "chaddar", "parchi"]):
        return "nikah"
    return "family_general"


def extract_year(text: str) -> int:
    m = re.search(r'\b(19|20)\d{2}\b', text)
    return int(m.group()) if m else 0


def download_and_extract_pdf(url: str, save_dir: Path, filename: str) -> str:
    """Download a PDF from URL and extract its text."""
    try:
        print(f"    Downloading: {url[-60:]}")
        r = requests.get(url, headers=HEADERS, timeout=30)

        if r.status_code != 200:
            print(f"    HTTP {r.status_code} — skipping")
            return ""

        if len(r.content) < 500:
            print(f"    Too small ({len(r.content)} bytes) — skipping")
            return ""

        # Save PDF
        safe_name = re.sub(r'[^\w\-_.]', '_', filename)[:80] + ".pdf"
        pdf_path  = save_dir / "pdfs" / safe_name
        with open(pdf_path, "wb") as f:
            f.write(r.content)

        # Extract text
        text = ""
        with pdfplumber.open(io.BytesIO(r.content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        print(f"    Extracted {len(text)} chars from PDF")
        return text

    except Exception as e:
        print(f"    PDF error: {e}")
        return ""


def make_record(text, title, year, topic, url, court, is_case_law=True) -> dict:
    return {
        "text":           text,
        "act_name":       title,
        "section_number": "",
        "topic_tag":      topic or infer_topic(title + " " + text[:300]),
        "province":       "Federal",
        "language":       "en",
        "year":           year or extract_year(title + " " + text[:200]),
        "source_url":     url,
        "is_case_law":    is_case_law,
        "chunk_type":     "parent",
        "parent_id":      "",
        "court":          court,
    }


# ══════════════════════════════════════════════════════════════════════════
# FEDERAL SHARIAT COURT
# ══════════════════════════════════════════════════════════════════════════

FSC_BASE = "https://www.federalshariatcourt.gov.pk"

FSC_LISTING_URLS = [
    f"{FSC_BASE}/en/leading-judgements/",
    f"{FSC_BASE}/en/reported-judgements/",
    f"{FSC_BASE}/en/judgments/",
    f"{FSC_BASE}/judgments/",
]


def scrape_fsc() -> list:
    print("\n" + "="*60)
    print("FEDERAL SHARIAT COURT")
    print("="*60)

    records   = []
    seen_urls = set()

    for listing_url in FSC_LISTING_URLS:
        print(f"\nTrying: {listing_url}")
        try:
            r = requests.get(listing_url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                print(f"  HTTP {r.status_code} — skipping")
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            print(f"  Page loaded ({len(r.text)} chars)")

            # Find all PDF download links on this page
            pdf_links = []
            for a in soup.find_all("a", href=True):
                href  = a["href"]
                title = a.get_text(strip=True)

                # Build full URL
                if href.startswith("http"):
                    full_url = href
                elif href.startswith("/"):
                    full_url = FSC_BASE + href
                else:
                    full_url = FSC_BASE + "/" + href

                # Target PDF links or judgement page links
                is_pdf  = ".pdf" in href.lower()
                is_page = any(x in href.lower() for x in [
                    "judgement", "judgment", "decision", "petition", "shariat"
                ])

                if (is_pdf or is_page) and full_url not in seen_urls:
                    seen_urls.add(full_url)
                    pdf_links.append({
                        "url":   full_url,
                        "title": title or href.split("/")[-1],
                        "is_pdf": is_pdf
                    })

            print(f"  Found {len(pdf_links)} judgement/PDF links")

            # Also check for table rows (FSC uses tables)
            rows = soup.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if not cells:
                    continue

                row_text = " ".join(c.get_text(strip=True) for c in cells)
                if not is_family_related(row_text) and len(records) > 5:
                    continue  # skip non-family rows once we have some data

                # Find PDF link in this row
                for a in row.find_all("a", href=True):
                    href = a["href"]
                    full_url = FSC_BASE + href if href.startswith("/") else href
                    if full_url not in seen_urls:
                        seen_urls.add(full_url)
                        title = row_text[:100] or a.get_text(strip=True)
                        pdf_links.append({
                            "url":    full_url,
                            "title":  title,
                            "is_pdf": ".pdf" in href.lower()
                        })

            # Process each link
            for link in pdf_links:
                url   = link["url"]
                title = link["title"]
                print(f"\n  [{title[:55]}]")

                if link["is_pdf"]:
                    text = download_and_extract_pdf(url, FSC_OUTPUT_DIR, title)
                else:
                    # It's an HTML page — scrape it, then look for PDF inside
                    try:
                        pr = requests.get(url, headers=HEADERS, timeout=15)
                        psoup = BeautifulSoup(pr.text, "html.parser")

                        # Look for PDF link inside this page
                        inner_pdf = None
                        for pa in psoup.find_all("a", href=True):
                            if ".pdf" in pa["href"].lower():
                                inner_url = FSC_BASE + pa["href"] if pa["href"].startswith("/") else pa["href"]
                                if inner_url not in seen_urls:
                                    inner_pdf = inner_url
                                    seen_urls.add(inner_url)
                                    break

                        if inner_pdf:
                            text = download_and_extract_pdf(inner_pdf, FSC_OUTPUT_DIR, title)
                        else:
                            # Extract text directly from HTML
                            for tag in psoup(["nav", "header", "footer", "script", "style"]):
                                tag.decompose()
                            text = psoup.get_text(separator="\n", strip=True)
                            text = re.sub(r'\n{3,}', '\n\n', text).strip()
                    except Exception as e:
                        print(f"    HTML error: {e}")
                        text = ""

                if text and len(text) > 200:
                    record = make_record(
                        text, title, 0, infer_topic(title + " " + text[:300]),
                        url, "Federal Shariat Court"
                    )
                    records.append(record)
                    print(f"    Saved | topic: {record['topic_tag']}")

                time.sleep(1.5)

        except Exception as e:
            print(f"  Error: {e}")

    return records


# ══════════════════════════════════════════════════════════════════════════
# SUPREME COURT
# ══════════════════════════════════════════════════════════════════════════

SC_BASE = "https://www.supremecourt.gov.pk"

SC_LISTING_URLS = [
    f"{SC_BASE}/latest-judgements/",
    f"{SC_BASE}/cases-judgements/",
    f"{SC_BASE}/judgements/",
]

SC_SEARCH_KEYWORDS = [
    "family", "divorce", "talaq", "khula",
    "maintenance", "custody", "guardian", "nikah"
]


def scrape_supreme_court() -> list:
    print("\n" + "="*60)
    print("SUPREME COURT OF PAKISTAN")
    print("="*60)

    records   = []
    seen_urls = set()

    for listing_url in SC_LISTING_URLS:
        print(f"\nTrying: {listing_url}")
        try:
            r = requests.get(listing_url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}")
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            print(f"  Page loaded ({len(r.text)} chars)")

            # Find all PDF links — SC hosts judgements as PDFs
            for a in soup.find_all("a", href=True):
                href  = a["href"]
                title = a.get_text(strip=True)

                if ".pdf" not in href.lower():
                    continue

                full_url = SC_BASE + href if href.startswith("/") else href

                if full_url in seen_urls:
                    continue

                # Filter for family law related PDFs
                combined = (href + " " + title).lower()
                if not is_family_related(combined) and len(records) > 10:
                    continue

                seen_urls.add(full_url)

                print(f"\n  {title[:55] or href[-40:]}")
                text = download_and_extract_pdf(full_url, SC_OUTPUT_DIR, title or href.split("/")[-1])

                if text and len(text) > 200:
                    # Double check it's family related after reading
                    if is_family_related(text[:1000]) or len(records) < 5:
                        record = make_record(
                            text,
                            title or href.split("/")[-1],
                            0,
                            infer_topic(title + " " + text[:500]),
                            full_url,
                            "Supreme Court of Pakistan"
                        )
                        records.append(record)
                        print(f"    Saved | topic: {record['topic_tag']}")

                time.sleep(1.5)

        except Exception as e:
            print(f"  Error: {e}")

    # Also try known SC PDF pattern
    print(f"\nTrying known SC PDF URL pattern...")
    known_sc_pdfs = [
        "c.p._1737_l_2020.pdf",  # family courts case found in search
    ]
    for pdf_name in known_sc_pdfs:
        url = f"{SC_BASE}/downloads_judgements/{pdf_name}"
        if url not in seen_urls:
            seen_urls.add(url)
            title = pdf_name.replace("_", " ").replace(".pdf", "")
            text = download_and_extract_pdf(url, SC_OUTPUT_DIR, title)
            if text and len(text) > 200:
                records.append(make_record(
                    text, title, 0, infer_topic(text[:500]),
                    url, "Supreme Court of Pakistan"
                ))

    return records


# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════

def run():
    all_records = []

    # FSC
    fsc_records = scrape_fsc()
    all_records.extend(fsc_records)

    fsc_output = FSC_OUTPUT_DIR / "fsc_judgements.json"
    with open(fsc_output, "w", encoding="utf-8") as f:
        json.dump(fsc_records, f, ensure_ascii=False, indent=2)
    print(f"\nFSC: {len(fsc_records)} judgements saved → {fsc_output}")

    # Supreme Court
    sc_records = scrape_supreme_court()
    all_records.extend(sc_records)

    sc_output = SC_OUTPUT_DIR / "supreme_court_judgements.json"
    with open(sc_output, "w", encoding="utf-8") as f:
        json.dump(sc_records, f, ensure_ascii=False, indent=2)
    print(f"SC:  {len(sc_records)} judgements saved → {sc_output}")

    # Summary
    print(f"\n{'='*60}")
    print(f"Total: {len(all_records)} judgements")
    from collections import Counter
    topics = Counter(r["topic_tag"] for r in all_records)
    for t, c in topics.most_common():
        print(f"  {t}: {c}")

    if len(all_records) == 0:
        print("\nWARNING: 0 records. These sites likely require JavaScript.")
        print("Manual option:")
        print("  1. Go to https://www.federalshariatcourt.gov.pk/en/leading-judgements/")
        print("  2. Download each PDF manually")
        print("  3. Place in data/raw/pdfs/case_law/")
        print("  4. Run 02_load_data.py — pdfplumber handles extraction")


if __name__ == "__main__":
    run()