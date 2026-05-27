"""
LangGraph node functions — the 6 processing steps of the RAG pipeline.

Nodes:
1. detect_language   — Urdu / Roman Urdu / English
2. classify_query    — extract topic_tag + province via Gemini
3. retrieve          — hybrid search on Weaviate child chunks
4. expand_context    — fetch parent chunk for each child
5. generate_answer   — call Gemini with legal context
6. format_response   — structure citations + metadata
"""

import os
import re
import json
import time
import logging
from typing import TypedDict
from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser

from services.embedding_service import embed_query
from rag.retriever import hybrid_search
from rag.reranker import rerank_chunks
from rag.prompts import CLASSIFY_PROMPT, ANSWER_PROMPT
from services.session_store import get_session_history

logger = logging.getLogger(__name__)


# ── State definition ──────────────────────────────────────────────────────

class RAGState(TypedDict):
    query:           str
    session_id:      str
    topic_tag:       str            # "divorce", "custody", etc or ""
    province:        str            # "Punjab", "Federal", etc or ""
    query_vector:    list[float]
    child_chunks:    list[dict]
    expanded_chunks: list[dict]     # child + parent text combined
    answer:          str
    citations:       list[dict]
    error:           str


# ── Parent chunk lookup (loaded from parents_only.json) ───────────────────

_parent_lookup: dict[str, dict] | None = None
PARENTS_PATH = Path("data/chunks/parents_only.json")


def _get_parent_lookup() -> dict[str, dict]:
    """Load parent chunks into memory for fast ID lookup."""
    global _parent_lookup
    if _parent_lookup is None:
        if PARENTS_PATH.exists():
            with open(PARENTS_PATH, "r", encoding="utf-8") as f:
                parents = json.load(f)
            _parent_lookup = {p["id"]: p for p in parents}
            logger.info(f"Loaded {len(_parent_lookup)} parent chunks for context expansion.")
        else:
            logger.warning(f"Parents file not found at {PARENTS_PATH}")
            _parent_lookup = {}
    return _parent_lookup


# ── LLM singleton ─────────────────────────────────────────────────────────

_llm = None


def _get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            max_output_tokens=4096,
            google_api_key=api_key,
        )
    return _llm


# ── Node 1: Detect Language ───────────────────────────────────────────────

def detect_language(state: RAGState) -> RAGState:
    """(Deprecated) Language detection is now handled by LLM directly."""
    return state


# ── Node 2: Classify Query ───────────────────────────────────────────────

def classify_query(state: RAGState) -> RAGState:
    """Use Gemini to extract topic_tag and province from the query."""
    # Skip if already provided by the API caller
    if state.get("topic_tag") and state.get("province"):
        return state

    try:
        llm = _get_llm()
        chain = CLASSIFY_PROMPT | llm | StrOutputParser()
        result = chain.invoke({"query": state["query"]})

        # Parse JSON response
        # Strip markdown fences if present
        cleaned = re.sub(r'```json?\s*', '', result)
        cleaned = re.sub(r'```\s*', '', cleaned).strip()
        parsed = json.loads(cleaned)

        if not state.get("topic_tag"):
            state["topic_tag"] = parsed.get("topic", "")
        if not state.get("province"):
            state["province"] = parsed.get("province", "")

    except json.JSONDecodeError:
        logger.warning(f"Failed to parse classify response: {result}")
    except Exception as e:
        logger.warning(f"Classification failed: {e}")

    return state


# ── Node 3: Retrieve ─────────────────────────────────────────────────────

def retrieve(state: RAGState) -> RAGState:
    """Embed query and search Weaviate for relevant child chunks."""
    try:
        # Embed the query
        vector = embed_query(state["query"])
        state["query_vector"] = vector

        # Hybrid search
        raw_chunks = hybrid_search(
            query=state["query"],
            query_vector=vector,
            topic_tag=state["topic_tag"],
            province=state["province"],
            limit=20,
            alpha=0.6,
        )

        # Re-rank and select top chunks for richer context
        state["child_chunks"] = rerank_chunks(raw_chunks, top_k=8)

        if not state["child_chunks"]:
            # Retry without filters if no results
            raw_chunks = hybrid_search(
                query=state["query"],
                query_vector=vector,
                topic_tag="",
                province="",
                limit=20,
                alpha=0.6,
            )
            state["child_chunks"] = rerank_chunks(raw_chunks, top_k=8)

    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        state["error"] = f"Retrieval error: {e}"

    return state


# ── Node 4: Expand Context ───────────────────────────────────────────────

def expand_context(state: RAGState) -> RAGState:
    """Fetch parent chunk for each child to provide broader legal context."""
    parent_lookup = _get_parent_lookup()
    expanded = []

    for chunk in state["child_chunks"]:
        parent_id = chunk.get("parent_id", "")
        parent_text = ""

        if parent_id and parent_lookup:
            parent = parent_lookup.get(parent_id)
            if parent:
                parent_text = parent.get("text", "")
                # Skip if parent is too large (bulletin with mixed cases)
                if len(parent_text) > 8000:
                    parent_text = parent_text[:8000]

        expanded.append({
            **chunk,
            "context_text": parent_text if parent_text else chunk["text"],
        })

    state["expanded_chunks"] = expanded
    return state


# ── Node 5: Generate Answer ──────────────────────────────────────────────

def generate_answer(state: RAGState) -> RAGState:
    """Call Gemini with the expanded legal context to generate a cited answer."""
    if state.get("error"):
        state["answer"] = "An error occurred during retrieval. Please try again."
        return state

    if not state["expanded_chunks"]:
        state["answer"] = (
            "No relevant legal information was found for your query.\n\n"
            "Please try rephrasing your question, or consult a qualified Pakistani lawyer.\n\n"
            "⚠️ This is legal information, not legal advice."
        )
        return state

    # Build context string
    context_blocks = []
    for i, chunk in enumerate(state["expanded_chunks"], 1):
        type_label = "JUDGEMENT" if chunk.get("is_case_law") else "ACT/STATUTE"
        block = (
            f"--- DOCUMENT {i} ({type_label}) ---\n"
            f"Title: {chunk['act_name']}\n"
            f"Citation/Section: {chunk['section']}\n"
            f"Topic: {chunk['topic']}\n"
            f"Legal Text:\n{chunk['context_text']}\n"
        )
        context_blocks.append(block)

    context = "\n".join(context_blocks)

    history_dicts = get_session_history(state["session_id"])
    history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history_dicts])

    # Call Gemini with retry logic for rate limits
    try:
        llm = _get_llm()
        chain = ANSWER_PROMPT | llm | StrOutputParser()

        for attempt in range(3):
            try:
                answer = chain.invoke({
                    "history":  history_str,
                    "context":  context,
                    "query":    state["query"],
                })
                state["answer"] = answer
                return state
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    wait = 20 * (attempt + 1)
                    logger.warning(f"Rate limited. Retrying in {wait}s (attempt {attempt + 1}/3)")
                    time.sleep(wait)
                else:
                    raise

        state["answer"] = "The API rate limit was exceeded. Please wait a minute and try again."

    except Exception as e:
        logger.error(f"Answer generation failed: {e}")
        state["error"] = str(e)
        state["answer"] = f"Error generating answer: {e}"

    return state


# ── Node 6: Format Response ──────────────────────────────────────────────

def format_response(state: RAGState) -> RAGState:
    """Structure citations from the expanded chunks."""
    citations = []
    for i, chunk in enumerate(state["expanded_chunks"], 1):
        citations.append({
            "index":       i,
            "act_name":    chunk.get("act_name", ""),
            "section":     chunk.get("section", ""),
            "is_case_law": chunk.get("is_case_law", False),
            "score":       round(chunk.get("score", 0), 4),
            "snippet":     chunk.get("text", "")[:200],
            "source_url":  chunk.get("source", ""),
        })

    state["citations"] = citations
    return state
