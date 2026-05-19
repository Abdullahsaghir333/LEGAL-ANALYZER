"""
02_load_data.py
---------------
Downloads and normalises Pakistan legal datasets from HuggingFace.
Saves cleaned data to data/raw/ as JSON files ready for chunking.

Datasets used:
  - heyIamUmair/pakistani-law-family-criminal-property
  - AyeshaJadoon/Pakistan_Laws_Dataset
  - mariamffatima/lawbridge-pakistan-legal-dataset
  - ShouryaS/pakistan-legal-corpus
"""

import os
import json
import pandas as pd
from datasets import load_dataset
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

RAW_DATA_DIR = Path("data/raw")
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


# ── Topic tag mapping ────────────────────────────────────────────────────────
# Maps keywords found in act names to topic tags
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
    if "punjab" in text_lower:
        return "Punjab"
    elif "sindh" in text_lower:
        return "Sindh"
    elif "khyber" in text_lower or "kpk" in text_lower or "pakhtunkhwa" in text_lower:
        return "KPK"
    elif "balochistan" in text_lower:
        return "Balochistan"
    return "Federal"


def extract_year(text: str) -> int:
    """Extract 4-digit year from act name or text."""
    import re
    match = re.search(r'\b(19|20)\d{2}\b', text)
    if match:
        return int(match.group())
    return 0


# ── Dataset 1: heyIamUmair/pakistani-law-family-criminal-property ─────────
def load_dataset_1():
    print("\nLoading dataset 1: heyIamUmair/pakistani-law-family-criminal-property")
    try:
        ds = load_dataset(
            "heyIamUmair/pakistani-law-family-criminal-property",
            token=os.getenv("HF_TOKEN")
        )

        records = []
        # Iterate over all splits (train/test or just train)
        for split in ds.keys():
            for row in ds[split]:
                # Normalise column names — inspect what columns exist
                text = (
                    row.get("text") or
                    row.get("content") or
                    row.get("law_text") or
                    str(row)
                )
                act_name = (
                    row.get("act_name") or
                    row.get("title") or
                    row.get("law_name") or
                    "Unknown Act"
                )

                records.append({
                    "text":           text,
                    "act_name":       act_name,
                    "section_number": row.get("section", row.get("section_number", "")),
                    "topic_tag":      infer_topic(act_name + " " + text),
                    "province":       infer_province(act_name),
                    "language":       "en",
                    "year":           extract_year(act_name),
                    "source_url":     "hf://heyIamUmair/pakistani-law-family-criminal-property",
                    "is_case_law":    False,
                })

        output_path = RAW_DATA_DIR / "dataset1_umair.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"  Saved {len(records)} records -> {output_path}")
        return records

    except Exception as e:
        print(f"  Error loading dataset 1: {e}")
        print("  Make sure HF_TOKEN is set in .env if the dataset is gated.")
        return []


# ── Dataset 2: AyeshaJadoon/Pakistan_Laws_Dataset ──────────────────────────
def load_dataset_2():
    print("\nLoading dataset 2: AyeshaJadoon/Pakistan_Laws_Dataset")
    try:
        from huggingface_hub import hf_hub_download
        
        file_path = hf_hub_download(
            repo_id="AyeshaJadoon/Pakistan_Laws_Dataset",
            filename="pdf_data.json",
            repo_type="dataset",
            token=os.getenv("HF_TOKEN")
        )
        
        with open(file_path, "r", encoding="utf-8") as f:
            ds_data = json.load(f)

        records = []
        for row in ds_data:
            text = (
                row.get("text") or
                row.get("content") or
                row.get("law_text") or
                str(row)
            )
            act_name = (
                row.get("file_name") or
                row.get("act_name") or
                row.get("title") or
                row.get("name") or
                "Unknown Act"
            )
            
            # Clean up act_name (it's often a filename with .pdf)
            if act_name.endswith(".pdf"):
                act_name = act_name[:-4]
            # Replace underscores with spaces
            act_name = act_name.replace("_", " ")

            # Filter: only keep family law related acts for now
            combined = (act_name + " " + text).lower()
            family_keywords = [
                "family", "marriage", "divorce", "dissolution", "talaq",
                "maintenance", "custody", "guardian", "dowry", "nikah",
                "dower", "mehr", "bridal", "succession", "inheritance",
                "child marriage", "muslim personal"
            ]
            is_family_related = any(kw in combined for kw in family_keywords)

            if not is_family_related:
                continue  # skip non-family law acts

            records.append({
                "text":           text,
                "act_name":       act_name,
                "section_number": row.get("section", row.get("section_number", "")),
                "topic_tag":      infer_topic(act_name + " " + text[:500]),
                "province":       infer_province(act_name),
                "language":       "en",
                "year":           extract_year(act_name),
                "source_url":     "hf://AyeshaJadoon/Pakistan_Laws_Dataset",
                "is_case_law":    False,
            })

        output_path = RAW_DATA_DIR / "dataset2_ayesha.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"  Saved {len(records)} family law records -> {output_path}")
        return records

    except Exception as e:
        print(f"  Error loading dataset 2: {e}")
        return []


# ── Dataset 3: mariamffatima/lawbridge-pakistan-legal-dataset ─────────────
def load_dataset_3():
    print("\nLoading dataset 3: mariamffatima/lawbridge-pakistan-legal-dataset")
    try:
        ds = load_dataset(
            "mariamffatima/lawbridge-pakistan-legal-dataset",
            token=os.getenv("HF_TOKEN")
        )

        records = []
        for split in ds.keys():
            for row in ds[split]:
                text = (
                    row.get("text") or
                    row.get("content") or
                    row.get("law_text") or
                    str(row)
                )
                act_name = (
                    row.get("act_name") or
                    row.get("title") or
                    row.get("name") or
                    "Unknown Act"
                )

                records.append({
                    "text":           text,
                    "act_name":       act_name,
                    "section_number": row.get("section", row.get("section_number", "")),
                    "topic_tag":      infer_topic(act_name + " " + text),
                    "province":       infer_province(act_name),
                    "language":       "en",
                    "year":           extract_year(act_name),
                    "source_url":     "hf://mariamffatima/lawbridge-pakistan-legal-dataset",
                    "is_case_law":    False,
                })

        output_path = RAW_DATA_DIR / "dataset3_lawbridge.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"  Saved {len(records)} records -> {output_path}")
        return records

    except Exception as e:
        print(f"  Error loading dataset 3: {e}")
        return []


# ── Dataset 4: ShouryaS/pakistan-legal-corpus ──────────────────────────────
def load_dataset_4():
    print("\nLoading dataset 4: ShouryaS/pakistan-legal-corpus")
    try:
        ds = load_dataset(
            "ShouryaS/pakistan-legal-corpus",
            token=os.getenv("HF_TOKEN")
        )

        records = []
        for split in ds.keys():
            for row in ds[split]:
                text = (
                    row.get("text") or
                    row.get("content") or
                    row.get("law_text") or
                    str(row)
                )
                act_name = (
                    row.get("act_name") or
                    row.get("title") or
                    row.get("name") or
                    "Unknown Act"
                )

                records.append({
                    "text":           text,
                    "act_name":       act_name,
                    "section_number": row.get("section", row.get("section_number", "")),
                    "topic_tag":      infer_topic(act_name + " " + text),
                    "province":       infer_province(act_name),
                    "language":       "en",
                    "year":           extract_year(act_name),
                    "source_url":     "hf://ShouryaS/pakistan-legal-corpus",
                    "is_case_law":    False,
                })

        output_path = RAW_DATA_DIR / "dataset4_shouryas.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"  Saved {len(records)} records -> {output_path}")
        return records

    except Exception as e:
        print(f"  Error loading dataset 4: {e}")
        return []


# ── Sourcing Local PDFs & Case Law Folders (New Multi-Source Architecture) ──
def load_all_local_sources():
    """
    Traverses the expanded directory structure for Pakistani Family Law:
    1. data/raw/pdfs/ (English statutory acts -> is_case_law: False, language: en)
    2. data/raw/pdfs/urdu/ (Urdu statutory acts -> is_case_law: False, language: ur)
    3. data/raw/case_law/federal_shariat_court/ (Case law -> is_case_law: True, province: Federal)
    4. data/raw/case_law/supreme_court/ (Case law -> is_case_law: True, province: Federal)
    5. data/raw/case_law/lahore_high_court/ (Case law -> is_case_law: True, province: Punjab)
    6. data/raw/case_law/*.json (Scraped case law records e.g. paklegaldatabase_family.json)
    """
    import pdfplumber

    records = []

    # Define source configurations
    sources = [
        {"dir": "data/raw/pdfs", "is_case_law": False, "language": "en", "default_prov": "Federal"},
        {"dir": "data/raw/pdfs/urdu", "is_case_law": False, "language": "ur", "default_prov": "Federal"},
        {"dir": "data/raw/case_law/federal_shariat_court", "is_case_law": True, "language": "en", "default_prov": "Federal"},
        {"dir": "data/raw/case_law/supreme_court", "is_case_law": True, "language": "en", "default_prov": "Federal"},
        {"dir": "data/raw/case_law/lahore_high_court", "is_case_law": True, "language": "en", "default_prov": "Punjab"},
    ]

    print("\n--- Scanning Local PDF Repositories & Case Law Directories ---")

    for src in sources:
        dir_path = Path(src["dir"])
        dir_path.mkdir(parents=True, exist_ok=True)  # Ensure folder architecture exists

        pdf_files = list(dir_path.glob("*.pdf"))
        if not pdf_files:
            print(f"  [~] No PDFs found in {src['dir']}")
            continue

        print(f"  [+] Found {len(pdf_files)} PDFs in {src['dir']} (Case Law: {src['is_case_law']}, Lang: {src['language']})")

        for pdf_file in pdf_files:
            print(f"    Extracting: {pdf_file.name}")
            try:
                full_text = ""
                with pdfplumber.open(pdf_file) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            full_text += page_text + "\n"

                act_name = pdf_file.stem.replace("_", " ").replace("-", " ")
                province = infer_province(act_name) if not src["is_case_law"] else src["default_prov"]

                records.append({
                    "text":           full_text.strip(),
                    "act_name":       act_name,
                    "section_number": "",
                    "topic_tag":      infer_topic(act_name + " " + full_text[:500]),
                    "province":       province,
                    "language":       src["language"],
                    "year":           extract_year(act_name),
                    "source_url":     str(pdf_file.as_posix()),
                    "is_case_law":    src["is_case_law"],
                })
            except Exception as e:
                print(f"    [!] Error reading {pdf_file.name}: {e}")

    # Scan for pre-scraped JSON case law files (like paklegaldatabase_family.json)
    case_law_json_dir = Path("data/raw/case_law")
    case_law_json_dir.mkdir(parents=True, exist_ok=True)
    json_files = list(case_law_json_dir.glob("*.json"))

    if json_files:
        print(f"\n  [+] Found {len(json_files)} scraped JSON files in data/raw/case_law/")
        for j_file in json_files:
            print(f"    Ingesting: {j_file.name}")
            try:
                with open(j_file, "r", encoding="utf-8") as f:
                    j_data = json.load(f)
                    records.extend(j_data)
                    print(f"      Added {len(j_data)} case law records from {j_file.name}")
            except Exception as e:
                print(f"    [!] Error loading {j_file.name}: {e}")

    print(f"--- Completed Local Ingestion: {len(records)} total records added ---")
    return records


# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    all_records = []

    records1 = load_dataset_1()
    all_records.extend(records1)

    records2 = load_dataset_2()
    all_records.extend(records2)

    records3 = load_dataset_3()
    all_records.extend(records3)

    # records4 = load_dataset_4()
    # all_records.extend(records4)

    local_records = load_all_local_sources()
    all_records.extend(local_records)

    # Save combined dataset
    combined_path = RAW_DATA_DIR / "combined.json"
    with open(combined_path, "w", encoding="utf-8") as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    print(f"\nTotal records loaded: {len(all_records)}")
    print(f"Combined dataset saved -> {combined_path}")

    # Show topic distribution
    from collections import Counter
    topics = Counter(r["topic_tag"] for r in all_records)
    print("\nTopic distribution:")
    for topic, count in topics.most_common():
        print(f"  {topic}: {count}")
