"""
chunk.py
--------
Reads ALL legal data sources, normalizes schemas, cleans boilerplate,
splits into parent/child chunks for RAG retrieval, and saves to
data/chunks/{all_chunks,parents_only,children_only}.json.

Data sources auto-discovered:
  - data/raw/combined.json                          (HuggingFace + manual PDFs)
  - data/raw/case_law/**/*.json                     (scraped court judgements)
  - data/raw/case_law/**/pdfs/*.pdf                 (orphan PDFs not yet in JSON)
  - data/raw/pdfs/urdu/*.pdf                        (Urdu statutory acts)
"""

import json
import re
import sys
import io
import uuid
from pathlib import Path

# Force UTF-8 stdout on Windows to handle Urdu filenames
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm
from collections import Counter

# ── Paths ──────────────────────────────────────────────────────────────────
RAW_DIR        = Path("data/raw")
CASE_LAW_DIR   = RAW_DIR / "case_law"
CHUNK_DATA_DIR = Path("data/chunks")
CHUNK_DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_ALL      = CHUNK_DATA_DIR / "all_chunks.json"
OUTPUT_PARENTS  = CHUNK_DATA_DIR / "parents_only.json"
OUTPUT_CHILDREN = CHUNK_DATA_DIR / "children_only.json"

# ── Chunk sizing (token-based: 1 token ≈ 4 chars) ─────────────────────────
PARENT_CHUNK_SIZE     = 4000   # ≈ 1024 tokens max
PARENT_CHUNK_MIN      = 2000   # ≈ 512 tokens min target
CHILD_CHUNK_SIZE      = 1000   # ≈ 256 tokens max
CHILD_CHUNK_OVERLAP   = 200    # ≈ 50 tokens
MIN_CHILD_SIZE        = 320    # ≈ 80 tokens — discard below this
SMALL_PARENT_THRESHOLD = 1024  # ≈ 256 tokens — no children if parent below this

# Minimum text length to consider a record valid (filters out boilerplate-only scrapes)
MIN_TEXT_LENGTH = 100

# ── Legal section boundary patterns (for legislation) ─────────────────────
SECTION_PATTERNS = [
    r'\n\s*(?:Section|SECTION|Sec\.?)\s+\d+',
    r'\n\s*\d+\.\s+[A-Z]',
    r'\n\s*(?:Article|ARTICLE)\s+\d+',
    r'\n\s*(?:Chapter|CHAPTER)\s+[IVXivx\d]+',
    r'\n\s*(?:PART|Part)\s+[IVXivx\d]+',
]

# ── Family law keyword filter ─────────────────────────────────────────────
FAMILY_KEYWORDS = ["family", "divorce", "talaq", "marriage", "custody",
                   "maintenance", "guardian", "nikah", "dissolution", "dowry"]


# ── Boilerplate cleaning ──────────────────────────────────────────────────
# Common nav/footer junk from scraped sites
BOILERPLATE_PATTERNS = [
    r'^Login\n.*?(?=\n[A-Z])',                          # paklegaldatabase nav header
    r'Keyword Search\n.*?Sort by Date\n.*?(?=\n)',       # paklegaldatabase search UI
    r'Select Categories\n.*?Select Jurisdictions\n',     # paklegaldatabase filters
    r'Newest First\nOldest First\n',                     # sort controls
    r'Citation Search\nJournal\n.*?(?=\n[A-Z])',         # citation search UI
    r'Cookie.*?Accept',                                   # cookie banners
    r'Skip to content',                                   # skip nav
    r'©.*?All [Rr]ights [Rr]eserved\.?',                 # copyright footers
    r'Powered by.*$',                                     # powered by footers
    r'Subscribe.*?newsletter',                            # subscription CTAs
]

BOILERPLATE_SUBSTRINGS = [
    "Log In", "Sign Up", "Dark Mode", "Cookie Policy",
    "Orbit – Live News Map", "SECP Company Search",
    "Sanctions & Watchlists", "Tenders",
    "UK Case Law", "US Case Law",
]


def clean_text(text: str) -> str:
    """Remove boilerplate navigation, footers, and excessive whitespace."""
    if not text:
        return ""

    # Remove boilerplate regex patterns
    for pattern in BOILERPLATE_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.DOTALL | re.IGNORECASE)

    # Remove lines that are pure boilerplate substrings
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not any(bp in stripped for bp in BOILERPLATE_SUBSTRINGS):
            cleaned_lines.append(line)

    text = '\n'.join(cleaned_lines)

    # Collapse excessive whitespace
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = re.sub(r' {3,}', '  ', text)

    return text.strip()


# ── Schema normalization ──────────────────────────────────────────────────
# The Weaviate schema expects these 9 fields exactly.
# Scrapers added extra fields (court, citation, judge, chunk_type, parent_id)
# which we either fold into existing fields or preserve in text context.

REQUIRED_FIELDS = {
    "text":           "",
    "act_name":       "",
    "section_number": "",
    "topic_tag":      "family_general",
    "province":       "Federal",
    "language":       "en",
    "year":           0,
    "source_url":     "",
    "is_case_law":    False,
}


def detect_language(text: str) -> str:
    """Detect Urdu vs English by checking Unicode character range in first 500 chars."""
    sample = text[:500]
    if not sample:
        return "en"
    urdu_chars = sum(1 for c in sample if '\u0600' <= c <= '\u06FF')
    return "ur" if urdu_chars > len(sample) * 0.15 else "en"


def normalize_record(record: dict) -> dict:
    """
    Normalize a record from any source into the standard schema.
    Folds extra scraper fields (court, citation, judge) into act_name
    so the information is preserved and searchable via BM25.
    """
    normalized = {}

    for field, default in REQUIRED_FIELDS.items():
        normalized[field] = record.get(field, default)

    # Clean the text
    normalized["text"] = clean_text(normalized["text"])

    # Detect language from text content (overrides source metadata)
    normalized["language"] = detect_language(normalized["text"])

    # Enrich act_name with court/citation info from scrapers
    court    = record.get("court", "")
    citation = record.get("citation", "")
    judge    = record.get("judge", "")

    name_parts = [normalized["act_name"]]
    if court and court not in normalized["act_name"]:
        name_parts.append(f"[{court}]")
    if citation:
        name_parts.append(f"({citation})")
    normalized["act_name"] = " ".join(p for p in name_parts if p)

    # If section_number is empty but citation exists, use citation
    if not normalized["section_number"] and citation:
        normalized["section_number"] = citation

    # Ensure year is an int
    try:
        normalized["year"] = int(normalized["year"]) if normalized["year"] else 0
    except (ValueError, TypeError):
        normalized["year"] = 0

    # Ensure is_case_law is a bool
    normalized["is_case_law"] = bool(normalized.get("is_case_law", False))

    return normalized


# ── Data loading ──────────────────────────────────────────────────────────

def load_json_file(path: Path) -> list:
    """Load and normalize records from a JSON file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            if len(data) == 0:
                print(f"  [!] WARNING: {path.name} is empty")
            return data
        return []
    except Exception as e:
        print(f"  [!] Error loading {path.name}: {e}")
        return []


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF using pdfplumber."""
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"  [!] PDF extraction error {pdf_path.name}: {e}")
        return ""


def infer_topic(text: str) -> str:
    """Infer the legal topic from text content."""
    t = text.lower()
    if any(k in t for k in ["divorce", "dissolution", "talaq", "khula"]):
        return "divorce"
    if any(k in t for k in ["custody", "guardian", "ward"]):
        return "custody"
    if any(k in t for k in ["maintenance", "nafqa"]):
        return "maintenance"
    if any(k in t for k in ["dowry", "bridal", "mehr", "mahr", "dower"]):
        return "dowry"
    if any(k in t for k in ["marriage", "nikah", "conjugal"]):
        return "nikah"
    if any(k in t for k in ["child", "minor"]):
        return "child_rights"
    if any(k in t for k in ["inheritance", "succession"]):
        return "inheritance"
    return "family_general"


def load_all_sources() -> list:
    """
    Discover and load ALL data sources into a single normalized list.
    """
    all_records = []

    # ── 1. All raw JSON files ─────────────────────────────────────────────
    RAW_JSON_FILES = [
        "combined.json",
        "dataset1_umair.json",
        "dataset2_ayesha.json",
        "dataset3_lawbridge.json",
        "pdf_data.json",
    ]
    print(f"\n[1] Loading raw JSON files from {RAW_DIR}/...")
    for filename in RAW_JSON_FILES:
        path = RAW_DIR / filename
        if path.exists():
            records = load_json_file(path)
            print(f"    {filename}: {len(records)} records")
            all_records.extend(records)
        else:
            print(f"    {filename}: not found — skipping")

    # ── 2. Core act PDFs in data/raw/pdfs/*.pdf ───────────────────────────
    raw_pdfs_dir = RAW_DIR / "pdfs"
    if raw_pdfs_dir.exists():
        raw_pdfs = sorted(raw_pdfs_dir.glob("*.pdf"))
        print(f"\n[2] Found {len(raw_pdfs)} PDFs in data/raw/pdfs/")
        for pdf_file in raw_pdfs:
            text = extract_text_from_pdf(pdf_file)
            if not text or len(text) < MIN_TEXT_LENGTH:
                continue
            act_name = pdf_file.stem.replace("_", " ").replace("-", " ")
            all_records.append({
                "text":           text,
                "act_name":       act_name,
                "section_number": "",
                "topic_tag":      infer_topic(act_name + " " + text[:500]),
                "province":       "Federal",
                "language":       detect_language(text),
                "year":           int(m.group()) if (m := re.search(r'\b(19|20)\d{2}\b', act_name)) else 0,
                "source_url":     str(pdf_file.as_posix()),
                "is_case_law":    False,
            })
            print(f"    [+] {pdf_file.name}")
    else:
        print(f"\n[2] data/raw/pdfs/ not found — skipping")

    # ── 3. Urdu PDFs in data/raw/pdfs/urdu/*.pdf ──────────────────────────
    urdu_dir = RAW_DIR / "pdfs" / "urdu"
    if urdu_dir.exists():
        urdu_pdfs = list(urdu_dir.glob("*.pdf"))
        if urdu_pdfs:
            print(f"\n[3] Found {len(urdu_pdfs)} Urdu PDFs")
            for pdf_file in urdu_pdfs:
                text = extract_text_from_pdf(pdf_file)
                if text and len(text) > MIN_TEXT_LENGTH:
                    act_name = pdf_file.stem.replace("_", " ").replace("-", " ")
                    all_records.append({
                        "text":           text,
                        "act_name":       act_name,
                        "section_number": "",
                        "topic_tag":      infer_topic(act_name + " " + text[:500]),
                        "province":       "Federal",
                        "language":       detect_language(text),
                        "year":           int(m.group()) if (m := re.search(r'\b(19|20)\d{2}\b', act_name)) else 0,
                        "source_url":     str(pdf_file.as_posix()),
                        "is_case_law":    False,
                    })
                    print(f"    [+] {pdf_file.name} (Urdu)")
        else:
            print(f"\n[3] No Urdu PDFs in {urdu_dir}")
    else:
        print(f"\n[3] {urdu_dir} not found — skipping")

    # ── 4. All JSON files in case_law/ (recursive) ────────────────────────
    if CASE_LAW_DIR.exists():
        json_files = sorted(CASE_LAW_DIR.rglob("*.json"))
        print(f"\n[4] Found {len(json_files)} JSON files in case_law/")

        for jf in json_files:
            records = load_json_file(jf)
            print(f"    {jf.relative_to(RAW_DIR)}: {len(records)} records")
            if records:
                all_records.extend(records)

    # ── 5. Orphan PDFs in case_law/**/pdfs/ AND **/bulletins/ ─────────────
    if CASE_LAW_DIR.exists():
        pdf_files = (
            sorted(CASE_LAW_DIR.rglob("pdfs/*.pdf")) +
            sorted(CASE_LAW_DIR.rglob("bulletins/*.pdf"))
        )
        # Build set of source_urls already in records to skip duplicates
        existing_urls = {r.get("source_url", "") for r in all_records}

        orphan_count = 0
        skipped_non_legal = 0

        # Filter out obviously non-legal PDFs (FSC admin docs, etc.)
        SKIP_PDF_NAMES = {
            "Annual_Report.pdf", "Annual_Procurement_Plan.pdf",
            "Tenders.pdf", "Telephone_Directory.pdf", "Roster.pdf",
            "Press_Releases.pdf", "Public_Notice.pdf", "Notifications.pdf",
            "Former_Chief_Justices.pdf", "Former_Judges.pdf",
            "Grievance_Redressal_Committee.pdf", "Human_Rights_Cell.pdf",
            "Circulars.pdf", "Cause_List.pdf", "home.pdf",
            "Books___Articles.pdf", "Download.pdf",
        }

        print(f"\n[5] Scanning orphan PDFs in case_law/**/(pdfs|bulletins)/...")
        print(f"    Found {len(pdf_files)} total PDF files")
        for pdf_file in pdf_files:
            if pdf_file.name in SKIP_PDF_NAMES:
                skipped_non_legal += 1
                continue

            pdf_posix = str(pdf_file.as_posix())
            if pdf_posix in existing_urls:
                continue

            text = extract_text_from_pdf(pdf_file)
            if not text or len(text) < MIN_TEXT_LENGTH:
                continue
            # Skip PDFs that don't mention any family law keyword
            if not any(kw in text.lower() for kw in FAMILY_KEYWORDS):
                skipped_non_legal += 1
                continue
            # Determine court from parent directory
            # For pdfs/: parent=pdfs, parent.parent=court_folder
            # For bulletins/: parent=bulletins, parent.parent=court_folder
            parent_dir = pdf_file.parent.parent.name  # e.g. "lahore_high_court"
            court_map = {
                "lahore_high_court":       ("Lahore High Court", "Punjab", True),
                "supreme_court":           ("Supreme Court of Pakistan", "Federal", True),
                "federal_shariat_court":   ("Federal Shariat Court", "Federal", True),
                "sindh_high_court":        ("Sindh High Court", "Sindh", True),
                "molaw":                   ("Ministry of Law", "Federal", False),
                "pakistan_code":            ("Pakistan Code", "Federal", False),
            }
            court_info = court_map.get(parent_dir, ("Unknown", "Federal", True))

            act_name = pdf_file.stem.replace("_", " ").replace("-", " ")

            all_records.append({
                "text":           text,
                "act_name":       f"{act_name} [{court_info[0]}]",
                "section_number": "",
                "topic_tag":      infer_topic(act_name + " " + text[:500]),
                "province":       court_info[1],
                "language":       detect_language(text),
                "year":           int(m.group()) if (m := re.search(r'\b(19|20)\d{2}\b', act_name)) else 0,
                "source_url":     pdf_posix,
                "is_case_law":    court_info[2],
            })
            orphan_count += 1
            sub_folder = pdf_file.parent.name  # "pdfs" or "bulletins"
            print(f"    [+] {pdf_file.name} -> {court_info[0]} ({sub_folder})")

        print(f"    Added {orphan_count} orphan PDF records (skipped {skipped_non_legal} non-legal)")

    return all_records


# ── Helper: extract section number from chunk text ────────────────────────

def extract_section_number(chunk_text: str, fallback: str = "") -> str:
    """Try to extract a section/article number from the start of chunk text."""
    m = re.match(r'^\s*(?:Section|SECTION|Sec\.?)\s+(\d+[\w.\-]*)', chunk_text)
    if not m:
        m = re.match(r'^\s*(\d+)\.\s+[A-Z]', chunk_text)
    return m.group(1) if m else fallback


# ── Helper: split legislation at legal section boundaries ─────────────────

def split_at_section_boundaries(text: str) -> list:
    """
    Split legislation text at legal section boundaries (Section X, Article X, etc.).
    Falls back to returning the full text as one segment if no boundaries found.
    """
    # Build a combined pattern from all section patterns
    combined = '|'.join(f'({p})' for p in SECTION_PATTERNS)
    # Find all boundary positions
    positions = [m.start() for m in re.finditer(combined, text)]

    if not positions:
        return [text]

    segments = []
    # Add text before first boundary if non-trivial
    if positions[0] > 0:
        preamble = text[:positions[0]].strip()
        if len(preamble) >= MIN_TEXT_LENGTH:
            segments.append(preamble)

    for idx, pos in enumerate(positions):
        end = positions[idx + 1] if idx + 1 < len(positions) else len(text)
        seg = text[pos:end].strip()
        if seg:
            segments.append(seg)

    return segments if segments else [text]


# ── Helper: split case law into paragraph-based parents ───────────────────

def split_case_law_parents(text: str) -> list:
    """
    Split case law text at paragraph boundaries (\\n\\n).
    Returns list of (chunk_text, section_label) tuples.
    The headnote (text before first \\n\\n or before JUDGMENT:/ORDER:) is
    returned as the first element with section_label='headnote'.
    """
    # Find headnote boundary
    headnote_end = None
    for marker in ["JUDGMENT:", "ORDER:", "J U D G M E N T", "O R D E R"]:
        idx = text.find(marker)
        if idx > 0:
            headnote_end = idx
            break

    first_para = text.find("\n\n")
    if headnote_end is None:
        headnote_end = first_para if first_para > 0 else len(text)
    elif first_para > 0:
        headnote_end = min(headnote_end, first_para)

    results = []
    # Headnote as standalone parent
    headnote = text[:headnote_end].strip()
    if headnote and len(headnote) >= MIN_TEXT_LENGTH:
        results.append((headnote, "headnote"))

    # Remaining text split into paragraph groups
    remaining = text[headnote_end:].strip()
    if remaining:
        paragraphs = re.split(r'\n\n+', remaining)
        # Merge small paragraphs together to reach parent size range
        buffer = ""
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(buffer) + len(para) + 2 < PARENT_CHUNK_SIZE:
                buffer = (buffer + "\n\n" + para).strip() if buffer else para
            else:
                if buffer and len(buffer) >= MIN_TEXT_LENGTH:
                    results.append((buffer, ""))
                buffer = para
        if buffer and len(buffer) >= MIN_TEXT_LENGTH:
            results.append((buffer, ""))

    return results if results else [(text, "")]


# ── Helper: create child chunks from a parent ─────────────────────────────

def make_children(parent_text: str, parent_id: str, record: dict,
                  section_number: str, child_splitter) -> list:
    """Split parent text into child chunks. Returns list of chunk dicts."""
    child_texts = child_splitter.split_text(parent_text)
    children = []
    for ct in child_texts:
        if len(ct) < MIN_CHILD_SIZE:
            continue
        children.append({
            "id":             str(uuid.uuid4()),
            "text":           ct,
            "act_name":       record["act_name"],
            "section_number": extract_section_number(ct, section_number),
            "topic_tag":      infer_topic(ct) or record["topic_tag"],
            "province":       record["province"],
            "language":       record["language"],
            "year":           record["year"],
            "source_url":     record["source_url"],
            "is_case_law":    record["is_case_law"],
            "chunk_type":     "child",
            "parent_id":      parent_id,
        })
    return children


# ── Chunking ──────────────────────────────────────────────────────────────

def chunk_data():
    # ── Step 1: Load all sources ──────────────────────────────────────────
    print("=" * 60)
    print("CHUNK.PY — Parent/Child Legal Data Chunker")
    print("=" * 60)

    raw_records = load_all_sources()

    # ── Step 2: Normalize and deduplicate ─────────────────────────────────
    print(f"\n--- Normalizing {len(raw_records)} raw records ---")
    seen_texts = set()
    records = []

    for r in raw_records:
        normalized = normalize_record(r)
        text = normalized["text"]

        # Skip empty / too short
        if not text or len(text) < MIN_TEXT_LENGTH:
            continue

        # Deduplicate by first 200 chars of text (catches duplicates across sources)
        text_key = text[:200].strip().lower()
        if text_key in seen_texts:
            continue
        seen_texts.add(text_key)

        records.append(normalized)

    print(f"After normalization + dedup: {len(records)} unique records")

    # ── Step 3: Create text splitters ─────────────────────────────────────
    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=PARENT_CHUNK_SIZE,
        chunk_overlap=0,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHILD_CHUNK_SIZE,
        chunk_overlap=CHILD_CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    # ── Step 4: Parent-child chunking ─────────────────────────────────────
    all_chunks = []
    statute_count = 0
    case_law_count = 0

    print(f"\nStarting parent/child chunking for {len(records)} records...")
    print(f"  Parent target: {PARENT_CHUNK_MIN}–{PARENT_CHUNK_SIZE} chars")
    print(f"  Child target:  512–{CHILD_CHUNK_SIZE} chars, {CHILD_CHUNK_OVERLAP} overlap")
    print(f"  Min child:     {MIN_CHILD_SIZE} chars")

    for record in tqdm(records, desc="Chunking"):
        text = record["text"]
        is_case_law = record["is_case_law"]
        inherited_section = record["section_number"]

        if is_case_law:
            case_law_count += 1
            parent_segments = split_case_law_parents(text)
        else:
            statute_count += 1
            # Split at legal section boundaries first
            raw_segments = split_at_section_boundaries(text)
            # Further split oversized segments with parent_splitter
            parent_segments = []
            for seg in raw_segments:
                if len(seg) > PARENT_CHUNK_SIZE:
                    for sub in parent_splitter.split_text(seg):
                        parent_segments.append((sub, ""))
                else:
                    parent_segments.append((seg, ""))

        # Process each parent segment
        for seg_text, seg_label in parent_segments:
            seg_text = seg_text.strip()
            if not seg_text or len(seg_text) < MIN_TEXT_LENGTH:
                continue

            parent_id = str(uuid.uuid4())
            section_num = seg_label if seg_label == "headnote" else extract_section_number(seg_text, inherited_section)

            parent_chunk = {
                "id":             parent_id,
                "text":           seg_text,
                "act_name":       record["act_name"],
                "section_number": section_num,
                "topic_tag":      infer_topic(seg_text) or record["topic_tag"],
                "province":       record["province"],
                "language":       record["language"],
                "year":           record["year"],
                "source_url":     record["source_url"],
                "is_case_law":    record["is_case_law"],
                "chunk_type":     "parent",
                "parent_id":      "",
            }
            all_chunks.append(parent_chunk)

            # Create children only if parent is large enough
            if len(seg_text) > SMALL_PARENT_THRESHOLD:
                children = make_children(
                    seg_text, parent_id, record, section_num, child_splitter
                )
                all_chunks.extend(children)

    # ── Step 5: Save 3 output files ───────────────────────────────────────
    parents = [c for c in all_chunks if c["chunk_type"] == "parent"]
    children = [c for c in all_chunks if c["chunk_type"] == "child"]

    with open(OUTPUT_ALL, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    with open(OUTPUT_PARENTS, "w", encoding="utf-8") as f:
        json.dump(parents, f, ensure_ascii=False, indent=2)
    with open(OUTPUT_CHILDREN, "w", encoding="utf-8") as f:
        json.dump(children, f, ensure_ascii=False, indent=2)

    # ── Step 6: Report ────────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"CHUNKING COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Input records:      {len(records)}")
    print(f"    Statutes:         {statute_count}")
    print(f"    Case law:         {case_law_count}")
    print(f"  Output chunks:      {len(all_chunks)}")
    print(f"    Parents:          {len(parents)}")
    print(f"    Children:         {len(children)}")
    print(f"  Saved to:")
    print(f"    {OUTPUT_ALL}")
    print(f"    {OUTPUT_PARENTS}")
    print(f"    {OUTPUT_CHILDREN}")

    # Topic distribution
    topics = Counter(c["topic_tag"] for c in all_chunks)
    print(f"\n  Topic distribution:")
    for topic, count in topics.most_common():
        print(f"    {topic}: {count}")

    # Source type breakdown
    case_chunks    = sum(1 for c in all_chunks if c["is_case_law"])
    statute_chunks = len(all_chunks) - case_chunks
    print(f"\n  Chunk type breakdown:")
    print(f"    Statute chunks:   {statute_chunks}")
    print(f"    Case law chunks:  {case_chunks}")

    # Language breakdown
    langs = Counter(c["language"] for c in all_chunks)
    print(f"\n  Language breakdown:")
    for lang, count in langs.most_common():
        print(f"    {lang}: {count}")


if __name__ == "__main__":
    chunk_data()