"""
scraper_05_lhc_shc_fixed.py
-----------------------------
FIXED LHC + SHC scraper using real discovered URLs.

LHC Real URL patterns:
  PDF judgements:   https://sys.lhc.gov.pk/appjudgments/2024LHC1234.pdf
  Research bulletins: https://researchcenter.lhc.gov.pk/pdf/CaseLawBulletin/
  Case law search:  https://sys.lhc.gov.pk/appjudgments/ (directory listing)

Strategy for LHC:
  1. Download fortnightly bulletins from researchcenter.lhc.gov.pk
     — each bulletin PDF lists ~50 cases with summaries and PDF URLs
     — filter for family law cases and download those PDFs
  2. Directly enumerate known family law PDF patterns

SHC:
  Uses a search API at: https://www.shc.gov.pk
"""

import requests
import pdfplumber
import json
import time
import re
import io
from pathlib import Path
from bs4 import BeautifulSoup

LHC_OUTPUT = Path("data/raw/case_law/lahore_high_court")
SHC_OUTPUT = Path("data/raw/case_law/sindh_high_court")
LHC_OUTPUT.mkdir(parents=True, exist_ok=True)
SHC_OUTPUT.mkdir(parents=True, exist_ok=True)
(LHC_OUTPUT / "pdfs").mkdir(exist_ok=True)
(LHC_OUTPUT / "bulletins").mkdir(exist_ok=True)
(SHC_OUTPUT / "pdfs").mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/pdf,*/*",
}

FAMILY_KEYWORDS = [
    "family", "divorce", "talaq", "khula", "nikah", "marriage",
    "custody", "guardian", "maintenance", "dowry", "mehr", "dower",
    "dissolution", "conjugal", "muslim family", "mflo",
    "restitution", "child custody", "family court",
]


# ── Helpers ────────────────────────────────────────────────────────────────

def is_family(text: str) -> bool:
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
    if any(k in t for k in ["marriage", "nikah", "conjugal", "restitution"]):
        return "nikah"
    return "family_general"


def extract_year(text: str) -> int:
    m = re.search(r'\b(19|20)\d{2}\b', text)
    return int(m.group()) if m else 0


def pdf_bytes_to_text(pdf_bytes: bytes) -> str:
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        return re.sub(r'\n{3,}', '\n\n', text).strip()
    except Exception as e:
        return ""


def download_pdf(url: str, save_dir: Path, filename: str) -> str:
    """Download PDF and return extracted text."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200 or len(r.content) < 500:
            return ""
        safe = re.sub(r'[^\w\-_.]', '_', filename)[:80] + ".pdf"
        with open(save_dir / safe, "wb") as f:
            f.write(r.content)
        return pdf_bytes_to_text(r.content)
    except Exception as e:
        return ""


def make_record(text, title, year, topic, url, court, province) -> dict:
    return {
        "text":           text,
        "act_name":       title,
        "section_number": "",
        "topic_tag":      topic or infer_topic(title + " " + text[:300]),
        "province":       province,
        "language":       "en",
        "year":           year or extract_year(title + " " + text[:200]),
        "source_url":     url,
        "is_case_law":    True,
        "chunk_type":     "parent",
        "parent_id":      "",
        "court":          court,
    }


# ══════════════════════════════════════════════════════════════════════════
# LAHORE HIGH COURT
# ══════════════════════════════════════════════════════════════════════════

LHC_SYS_BASE      = "https://sys.lhc.gov.pk/appjudgments"
LHC_RESEARCH_BASE = "https://researchcenter.lhc.gov.pk"

# Fortnightly bulletin index page
BULLETIN_INDEX_URL = f"{LHC_RESEARCH_BASE}/CaseLawBulletin"

# Known bulletin PDF URLs from search results
KNOWN_BULLETIN_URLS = [
    "https://researchcenter.lhc.gov.pk/pdf/CaseLawBulletin/Bulletinfrom16.12.2023to31.12.2023_3d1a.pdf",
    "https://researchcenter.lhc.gov.pk/pdf/CaseLawBulletin/Bulletinfrom16.05.2024to31.05.2024_75a1.pdf",
    "https://researchcenter.lhc.gov.pk/pdf/CaseLawBulletin/ConsolidatedBulletinfrom01.01.2024till29.02.2024_b9d8.pdf",
]


def get_bulletin_urls() -> list:
    """Get all bulletin PDF URLs from the research center index page."""
    urls = list(KNOWN_BULLETIN_URLS)  # start with known ones

    try:
        r = requests.get(BULLETIN_INDEX_URL, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if ".pdf" in href.lower() and "bulletin" in href.lower():
                    full = LHC_RESEARCH_BASE + href if href.startswith("/") else href
                    if full not in urls:
                        urls.append(full)
            print(f"  Found {len(urls)} bulletin PDFs from index")
    except Exception as e:
        print(f"  Bulletin index error: {e} — using known URLs only")

    return urls


def extract_lhc_pdf_urls_from_bulletin(bulletin_text: str) -> list:
    """
    Extract LHC judgement PDF URLs from a bulletin PDF's text.
    Pattern: https://sys.lhc.gov.pk/appjudgments/2023LHC6736.pdf
    """
    urls = re.findall(
        r'https?://sys\.lhc\.gov\.pk/appjudgments/\d{4}LHC\d+\.pdf',
        bulletin_text
    )
    # Also find SC URLs referenced in bulletins
    sc_urls = re.findall(
        r'https?://www\.supremecourt\.gov\.pk/downloads_judgements/[\w\.\-]+\.pdf',
        bulletin_text
    )
    return list(set(urls))  # return only LHC URLs


def scrape_lhc_via_bulletins() -> list:
    """
    Method 1: Download bulletins → extract LHC PDF URLs → download family law ones.
    This is the most reliable method since bulletins explicitly tag case subjects.
    """
    print("\n── Method 1: LHC Research Bulletins ──")
    records   = []
    seen_urls = set()

    bulletin_urls = get_bulletin_urls()
    print(f"  Processing {len(bulletin_urls)} bulletins...")

    for b_url in bulletin_urls:
        print(f"\n  Bulletin: {b_url[-50:]}")
        try:
            r = requests.get(b_url, headers=HEADERS, timeout=30)
            if r.status_code != 200:
                print(f"    HTTP {r.status_code}")
                continue

            # Save bulletin
            b_name = b_url.split("/")[-1]
            with open(LHC_OUTPUT / "bulletins" / b_name, "wb") as f:
                f.write(r.content)

            # Extract text from bulletin
            b_text = pdf_bytes_to_text(r.content)
            if not b_text:
                print(f"    Could not extract text")
                continue

            print(f"    Bulletin text: {len(b_text)} chars")

            # Find all LHC judgement URLs in this bulletin
            judgement_urls = extract_lhc_pdf_urls_from_bulletin(b_text)
            print(f"    Found {len(judgement_urls)} LHC judgement URLs")

            # Also find case titles near those URLs to pre-filter
            # Split bulletin into sections and check which ones are family related
            lines = b_text.split("\n")
            family_sections = []
            for i, line in enumerate(lines):
                if is_family(line):
                    # Get surrounding context (±5 lines)
                    start = max(0, i-5)
                    end   = min(len(lines), i+5)
                    context = " ".join(lines[start:end])
                    # Find PDF URL in this context
                    url_match = re.search(
                        r'https?://sys\.lhc\.gov\.pk/appjudgments/\S+\.pdf',
                        context
                    )
                    if url_match:
                        family_sections.append({
                            "url":     url_match.group(),
                            "context": context
                        })

            print(f"    Family law sections: {len(family_sections)}")

            # Download family law judgements
            for section in family_sections:
                url = section["url"]
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                filename = url.split("/")[-1].replace(".pdf", "")
                print(f"    Downloading: {filename}")
                text = download_pdf(url, LHC_OUTPUT / "pdfs", filename)

                if text and len(text) > 200:
                    records.append(make_record(
                        text, filename,
                        extract_year(filename),
                        infer_topic(section["context"] + " " + text[:300]),
                        url, "Lahore High Court", "Punjab"
                    ))
                    print(f"      Saved: {len(text)} chars")

                time.sleep(1)

        except Exception as e:
            print(f"    Error: {e}")

        time.sleep(1.5)

    return records


def scrape_lhc_direct_enumeration(years=None, num_start=1, num_end=300) -> list:
    """
    Method 2: Direct enumeration of sys.lhc.gov.pk/appjudgments/<year>LHC<num>.pdf
    Fast-fail on 404, filter by content for family law.
    Lower num_end keeps it fast — increase for more coverage.
    """
    print("\n── Method 2: LHC Direct PDF Enumeration ──")
    if years is None:
        years = [2022, 2023, 2024]

    records = []

    for year in years:
        print(f"\n  Year {year} (checking {num_start}–{num_end})...")
        year_count = 0

        for num in range(num_start, num_end + 1):
            filename = f"{year}LHC{num}.pdf"
            url      = f"{LHC_SYS_BASE}/{filename}"

            try:
                r = requests.get(url, headers=HEADERS, timeout=10)
                if r.status_code == 404:
                    continue
                if r.status_code != 200 or len(r.content) < 500:
                    continue

                text = pdf_bytes_to_text(r.content)
                if not text:
                    continue

                # Only keep family law cases
                if not is_family(text[:1000]):
                    continue

                # Save PDF
                with open(LHC_OUTPUT / "pdfs" / filename, "wb") as f:
                    f.write(r.content)

                year_count += 1
                topic = infer_topic(text[:500])
                print(f"  {filename} | {topic} | {year}")

                records.append(make_record(
                    text, filename, year, topic,
                    url, "Lahore High Court", "Punjab"
                ))

                time.sleep(0.5)

            except Exception:
                continue

            # Small pause every 50 checks
            if num % 50 == 0:
                time.sleep(1)

        print(f"  Year {year}: {year_count} family judgements found")

    return records


# ══════════════════════════════════════════════════════════════════════════
# SINDH HIGH COURT
# ══════════════════════════════════════════════════════════════════════════

SHC_BASE = "https://www.shc.gov.pk"

SHC_SEARCH_URLS = [
    f"{SHC_BASE}/en/advance-search",
    f"{SHC_BASE}/judgements",
    f"{SHC_BASE}/case-search",
    f"{SHC_BASE}/search",
]


def scrape_shc() -> list:
    print("\n── SHC: Scraping Sindh High Court ──")
    records   = []
    seen_urls = set()

    # Try each listing/search URL
    for base_url in SHC_SEARCH_URLS:
        print(f"\n  Trying: {base_url}")
        try:
            r = requests.get(base_url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}")
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            print(f"  Page loaded: {len(r.text)} chars")

            # Find PDF links
            pdf_links = []
            for a in soup.find_all("a", href=True):
                href  = a["href"]
                title = a.get_text(strip=True)
                if ".pdf" not in href.lower():
                    continue
                full = SHC_BASE + href if href.startswith("/") else href
                if full not in seen_urls:
                    seen_urls.add(full)
                    pdf_links.append({"url": full, "title": title})

            print(f"  Found {len(pdf_links)} PDF links")

            for link in pdf_links:
                combined = (link["url"] + " " + link["title"]).lower()
                if not is_family(combined):
                    continue

                print(f"\n  {link['title'][:55]}")
                text = download_pdf(link["url"], SHC_OUTPUT / "pdfs",
                                    link["title"] or link["url"].split("/")[-1])
                if text and len(text) > 200:
                    records.append(make_record(
                        text, link["title"],
                        extract_year(link["title"]),
                        infer_topic(link["title"] + " " + text[:300]),
                        link["url"], "Sindh High Court", "Sindh"
                    ))
                    print(f"    Saved: {len(text)} chars")
                time.sleep(1)

        except Exception as e:
            print(f"  Error: {e}")

    # Try keyword search with POST
    print("\n  Trying SHC keyword search...")
    for keyword in ["family", "divorce", "talaq", "maintenance", "custody"]:
        for search_url in [f"{SHC_BASE}/search", f"{SHC_BASE}/advance-search"]:
            try:
                r = requests.post(
                    search_url,
                    data={"keyword": keyword, "q": keyword, "search": keyword},
                    headers={**HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
                    timeout=15
                )
                if r.status_code != 200:
                    continue

                soup = BeautifulSoup(r.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href  = a["href"]
                    title = a.get_text(strip=True)
                    if ".pdf" not in href.lower():
                        continue
                    full = SHC_BASE + href if href.startswith("/") else href
                    if full in seen_urls:
                        continue
                    seen_urls.add(full)
                    text = download_pdf(full, SHC_OUTPUT / "pdfs", title or full.split("/")[-1])
                    if text and len(text) > 200:
                        records.append(make_record(
                            text, title, extract_year(title),
                            infer_topic(title + " " + text[:300]),
                            full, "Sindh High Court", "Sindh"
                        ))
                        print(f"  Saved: {title[:50]} | {len(text)} chars")
                    time.sleep(1)
            except:
                continue

    return records


# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════

def run():
    print("="*60)
    print("LHC + SHC Fixed Scraper")
    print("="*60)

    all_records = []

    # ── LHC ────────────────────────────────────────────────────────────────
    print("\n[LAHORE HIGH COURT]")

    # Method 1: bulletins (best quality — explicitly tagged)
    lhc_bulletin_records = scrape_lhc_via_bulletins()
    print(f"\nBulletin method: {len(lhc_bulletin_records)} records")

    # Method 2: direct enumeration of recent years
    # num_end=300 keeps it fast (~5 min per year), increase to 2000 for full coverage
    lhc_direct_records = scrape_lhc_direct_enumeration(
        years=[2022, 2023, 2024],
        num_start=1,
        num_end=300
    )
    print(f"Direct method: {len(lhc_direct_records)} records")

    # Combine LHC records (deduplicate)
    lhc_all = lhc_bulletin_records + lhc_direct_records
    seen = set()
    lhc_unique = []
    for r in lhc_all:
        key = r["source_url"]
        if key not in seen:
            seen.add(key)
            lhc_unique.append(r)

    lhc_output = LHC_OUTPUT / "lhc_judgements.json"
    with open(lhc_output, "w", encoding="utf-8") as f:
        json.dump(lhc_unique, f, ensure_ascii=False, indent=2)
    print(f"\nLHC total: {len(lhc_unique)} judgements → {lhc_output}")
    all_records.extend(lhc_unique)

    # ── SHC ────────────────────────────────────────────────────────────────
    print("\n[SINDH HIGH COURT]")
    shc_records = scrape_shc()

    shc_output = SHC_OUTPUT / "shc_judgements.json"
    with open(shc_output, "w", encoding="utf-8") as f:
        json.dump(shc_records, f, ensure_ascii=False, indent=2)
    print(f"\nSHC total: {len(shc_records)} judgements → {shc_output}")
    all_records.extend(shc_records)

    # ── Combined output ────────────────────────────────────────────────────
    combined_output = Path("data/raw/case_law/high_courts_judgements.json")
    with open(combined_output, "w", encoding="utf-8") as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"TOTAL: {len(all_records)} judgements → {combined_output}")

    if all_records:
        from collections import Counter
        print("\nTopic breakdown:")
        for t, c in Counter(r["topic_tag"] for r in all_records).most_common():
            print(f"  {t}: {c}")
        print("\nCourt breakdown:")
        for t, c in Counter(r["court"] for r in all_records).most_common():
            print(f"  {t}: {c}")
    else:
        print("\nStill 0 records — see manual instructions below:")
        print("\nLHC manual download:")
        print("  1. Go to https://sys.lhc.gov.pk/appjudgments/")
        print("  2. Try URLs like: https://sys.lhc.gov.pk/appjudgments/2024LHC100.pdf")
        print("  3. Search on Google: site:sys.lhc.gov.pk family")
        print("\nSHC manual download:")
        print("  1. Go to https://www.shc.gov.pk/judgements")
        print("  2. Filter by Family Law subject")
        print("  3. Save PDFs to data/raw/pdfs/case_law/")


if __name__ == "__main__":
    run()