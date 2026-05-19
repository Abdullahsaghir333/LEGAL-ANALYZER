# ⚖️ LegalAnalyzer — Pakistani Family Law RAG System

A production-grade **Retrieval-Augmented Generation (RAG)** system for Pakistani Family Law. Ask legal questions in English or Urdu and receive cited, accurate answers grounded in real statutes, ordinances, and court judgements.

> **⚠️ This system provides legal information, not legal advice.**

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Streamlit Chat UI                      │
│                      (app.py)                            │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
               ▼                           ▼
    ┌─────────────────┐        ┌──────────────────────┐
    │  Orchestrator    │───────▶│   LLM Service        │
    │ (orchestrator.py)│        │  (llm_service.py)    │
    └────────┬────────┘        │  Gemini 2.5 Flash    │
             │                  └──────────────────────┘
             ▼
    ┌─────────────────────────────────────┐
    │         Query Engine                │
    │      (query_engine.py)              │
    │                                     │
    │  1. Hybrid Search (BM25 + Vector)   │
    │  2. Child → Parent Expansion        │
    │  3. Parent text → LLM context       │
    └────────┬──────────┬─────────────────┘
             │          │
             ▼          ▼
    ┌────────────┐  ┌───────────────────┐
    │  Weaviate  │  │ parents_only.json │
    │  (Docker)  │  │  (in-memory)      │
    │ 42k child  │  │  33k parents      │
    │  chunks    │  │                   │
    └────────────┘  └───────────────────┘
```

---

## 📂 Project Structure

```
LegalAnalyzer/
├── python/
│   ├── .env                          # API keys (GEMINI_API_KEY, GOOGLE_API_KEY)
│   ├── requirements.txt              # Python dependencies
│   │
│   ├── scripts/
│   │   ├── app.py                    # Streamlit chat UI
│   │   ├── orchestrator.py           # Query routing and answer generation
│   │   ├── query_engine.py           # Hybrid search + parent expansion
│   │   ├── llm_service.py            # Gemini 2.5 Flash integration
│   │   ├── chunk.py                  # Parent-child chunking pipeline
│   │   ├── embedandstore.py          # Embedding generation + Weaviate ingestion
│   │   ├── setup_weaviate.py         # Weaviate schema creation
│   │   ├── load_data.py              # HuggingFace dataset loader
│   │   ├── SCRAPPER_1.PY             # Federal Shariat Court scraper
│   │   ├── SCRAPPER2.py              # Lahore High Court scraper
│   │   ├── Scrapper3.py              # Ministry of Law scraper
│   │   ├── Scrapper4.py              # Pakistan Code scraper
│   │   ├── Scrapper5.py              # Supreme/Sindh High Court scraper
│   │   ├── scrape_paklegaldatabase.py # PakLegalDatabase.com scraper
│   │   └── scrape_judgements.py       # Court judgement scraper
│   │
│   ├── data/
│   │   ├── raw/                       # Source data (JSON + PDFs)
│   │   │   ├── combined.json          # 3,663 records (HuggingFace + manual)
│   │   │   ├── dataset1_umair.json    # 1,474 records
│   │   │   ├── dataset2_ayesha.json   # 537 records
│   │   │   ├── dataset3_lawbridge.json# 1,646 records
│   │   │   ├── pdf_data.json          # 969 records
│   │   │   ├── pdfs/                  # 6 core family law act PDFs
│   │   │   └── case_law/             # Court-wise JSON + PDFs + bulletins
│   │   ├── chunks/                    # Chunked output (3 files)
│   │   │   ├── all_chunks.json        # 75,243 chunks (parents + children)
│   │   │   ├── parents_only.json      # 32,658 parent chunks
│   │   │   └── children_only.json     # 42,585 child chunks
│   │   └── embeddings/                # Checkpoint files
│   │
│   └── vector_db/
│       └── docker-compose.yml         # Weaviate container config
│
├── backend/                           # Node.js backend (future)
├── frontend/                          # React frontend (future)
└── llm services/                      # Shared LLM configs (future)
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Docker Desktop** (for Weaviate)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone and Setup

```bash
git clone https://github.com/your-username/LegalAnalyzer.git
cd LegalAnalyzer/python

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt
pip install streamlit google-genai pdfplumber playwright
playwright install chromium
```

### 2. Configure Environment

Create `python/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Start Weaviate

```bash
cd vector_db
docker compose up -d
cd ..
```

### 4. Run the Pipeline (First Time Only)

```bash
# Step 1: Create Weaviate collection schema
python scripts/setup_weaviate.py

# Step 2: Chunk all legal data into parent-child hierarchy
python scripts/chunk.py

# Step 3: Embed and store in Weaviate (~24 hours on CPU)
python scripts/embedandstore.py
```

### 5. Launch the App

```bash
.\venv\Scripts\streamlit.exe run scripts/app.py
```

Open `http://localhost:8501` in your browser.

---

## 🧠 How It Works

### Data Pipeline

| Step | Script | What It Does |
|------|--------|-------------|
| 1 | `SCRAPPER_1.PY` → `Scrapper5.py` | Scrape court portals (FSC, LHC, SHC, SC, MoLaw, Pakistan Code) |
| 2 | `load_data.py` | Load HuggingFace family law datasets |
| 3 | `chunk.py` | Split into parent (512-1024 tokens) and child (128-256 tokens) chunks |
| 4 | `embedandstore.py` | Embed with multilingual-e5-large (1024-dim) → store in Weaviate |

### Query Pipeline

| Step | Component | What It Does |
|------|-----------|-------------|
| 1 | **Weaviate Hybrid Search** | BM25 + vector search on 42,585 child chunks |
| 2 | **Parent Expansion** | Each child hit → fetch full parent section from memory |
| 3 | **Gemini 2.5 Flash** | Generate cited answer using parent context |
| 4 | **Streamlit UI** | Display answer + expandable source citations |

### Parent-Child Chunking Strategy

```
Source Document (e.g., Muslim Family Laws Ordinance 1961)
    │
    ├── Parent Chunk (Section 7 — full section, ~800 tokens)
    │   ├── Child Chunk 1 (first 200 tokens + 50 overlap)
    │   ├── Child Chunk 2 (next 200 tokens + 50 overlap)
    │   └── Child Chunk 3 (remaining tokens)
    │
    ├── Parent Chunk (Section 8 — full section)
    │   ├── Child Chunk 4
    │   └── Child Chunk 5
    ...
```

- **Children** are embedded in Weaviate for precise semantic search
- **Parents** are stored in `parents_only.json` and loaded into memory at query time
- When a child matches, its parent provides the LLM with full section context

---

## 📊 Data Statistics

| Metric | Count |
|--------|-------|
| Raw records loaded | 8,423 |
| After deduplication | 4,101 |
| Total chunks | 75,243 |
| Parent chunks | 32,658 |
| Child chunks (embedded) | 42,585 |
| Embedding dimensions | 1,024 |
| Embedding time (CPU) | ~24 hours |

### Topic Distribution

| Topic | Chunks |
|-------|--------|
| family_general | 65,400 |
| custody | 5,258 |
| child_rights | 1,099 |
| maintenance | 1,096 |
| divorce | 953 |
| nikah | 749 |
| inheritance | 557 |
| dowry | 131 |

### Data Sources

| Source | Records | Type |
|--------|---------|------|
| combined.json (HuggingFace) | 3,663 | Statutes |
| dataset1_umair.json | 1,474 | Statutes |
| dataset2_ayesha.json | 537 | Statutes |
| dataset3_lawbridge.json | 1,646 | Statutes |
| pdf_data.json | 969 | Statutes |
| 6 Core Act PDFs | 6 | Legislation |
| Federal Shariat Court | 47 | Case Law |
| Ministry of Law Acts | 12 | Legislation |
| Pakistan Code Acts | 49 | Legislation |
| PakLegalDatabase | 9 | Case Law |
| LHC Bulletins | 3 | Case Law |
| Orphan PDFs (court sites) | 8 | Mixed |

---

## 🔧 Key Technologies

| Component | Technology |
|-----------|-----------|
| **Vector Database** | Weaviate 1.27 (Docker) |
| **Embedding Model** | `intfloat/multilingual-e5-large` (1024-dim, Urdu + English) |
| **LLM** | Google Gemini 2.5 Flash |
| **Search** | Hybrid (BM25 keyword + cosine vector similarity) |
| **Frontend** | Streamlit |
| **Scraping** | Playwright + BeautifulSoup |
| **Text Splitting** | LangChain RecursiveCharacterTextSplitter + custom legal section splitter |

---

## 📜 Covered Legislation

- Muslim Family Laws Ordinance, 1961
- West Pakistan Family Courts Act, 1964
- Dissolution of Muslim Marriages Act, 1939
- Dowry and Bridal Gifts (Restriction) Act, 1976
- Child Marriage Restraint Act, 1929
- Guardian and Wards Act, 1890
- Pakistan Citizenship Act, 1951
- And 4,000+ additional statutory provisions and court judgements

---

## 🗣️ Example Queries

- "What is the procedure for Khula in Punjab?"
- "Child maintenance calculation rules"
- "طلاق کا طریقہ کار کیا ہے؟" (Urdu: What is the divorce procedure?)
- "Inheritance rights of daughters in Islam"
- "Recent LHC judgements on custody"

---

## 📝 License

This project is for educational and research purposes. Legal data sourced from publicly available Pakistani government portals and legal databases.

---

## 👥 Contributors

- **Abdullah Saghir** — Lead Developer
