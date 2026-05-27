"""
query_engine.py
---------------
The core retrieval engine for the Pakistani Family Law RAG system.
Performs Hybrid Search (BM25 + Vector) on Weaviate child chunks,
then fetches parent chunks from disk for broader context.

Architecture:
  - Children are embedded in Weaviate (42k+ chunks, 128-256 tokens each)
  - Parents live in parents_only.json (loaded into memory as a lookup dict)
  - Search hits children → parent_id → fetch full parent for LLM context
"""

import json
import weaviate
import weaviate.classes as wvc
from weaviate.classes.query import MetadataQuery, Filter
from sentence_transformers import SentenceTransformer
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

COLLECTION   = "LegalChunk"
QUERY_PREFIX = "query: "  # Required for multilingual-e5 models
PARENTS_PATH = Path("data/chunks/parents_only.json")


class LegalQueryEngine:
    def __init__(self):
        print("Connecting to Weaviate and loading embedding model...")
        self.client = weaviate.connect_to_local(host="localhost", port=8080)

        # Verify connection
        if not self.client.is_ready():
            raise ConnectionError("Weaviate is not running on localhost:8080. Start it with Docker first.")

        self.model = SentenceTransformer("intfloat/multilingual-e5-large")
        self.collection = self.client.collections.get(COLLECTION)

        # Load parent chunks into memory for fast lookup by ID
        self.parent_lookup = {}
        if PARENTS_PATH.exists():
            with open(PARENTS_PATH, "r", encoding="utf-8") as f:
                parents = json.load(f)
            self.parent_lookup = {p["id"]: p for p in parents}
            print(f"Loaded {len(self.parent_lookup)} parent chunks for context expansion.")
        else:
            print(f"WARNING: {PARENTS_PATH} not found — parent context unavailable.")

        print("Query Engine Initialized.")

    def get_hybrid_context(self, query_text: str, limit: int = 5, topic: str = None):
        """
        Executes a Hybrid Search combining BM25 (Keyword) and Vector (Semantic) search.
        Returns child hits enriched with their parent context.
        """
        # Generate the embedding for the query
        query_vector = self.model.encode(
            QUERY_PREFIX + query_text,
            normalize_embeddings=True
        ).tolist()

        # Always filter to children only — parents are fetched by ID, not searched
        child_filter = Filter.by_property("chunk_type").equal("child")
        if topic:
            filters = child_filter & Filter.by_property("topic_tag").equal(topic)
        else:
            filters = child_filter

        # Hybrid search: alpha=0.5 provides a balanced mix.
        # Increase alpha (e.g., 0.7) for more semantic weight.
        # Decrease alpha (e.g., 0.3) for more keyword weight (better for citations).
        response = self.collection.query.hybrid(
            query=query_text,
            vector=query_vector,
            alpha=0.5,
            limit=limit,
            filters=filters,
            return_metadata=MetadataQuery(score=True)
        )

        results = []
        seen_parents = set()  # avoid duplicate parent context

        for obj in response.objects:
            props = obj.properties
            parent_id = props.get("parent_id", "")
            chunk_type = props.get("chunk_type", "child")

            # Build result — parent_text is what goes to LLM,
            # child text is the precise citation shown to user
            child_text = props["text"]

            # Fetch parent context for richer LLM input
            parent_text = child_text  # fallback: use child text if no parent
            if parent_id:
                parent = self.parent_lookup.get(parent_id)
                if parent:
                    # Parent chunks can be massive (e.g. 800k chars), so we truncate them
                    # to prevent exceeding LLM context windows and API rate limits.
                    parent_text = parent["text"]
                    if len(parent_text) > 4000:
                        # Find where the child text occurs in the parent
                        child_pos = parent_text.find(child_text[:100])
                        if child_pos != -1:
                            start_idx = max(0, child_pos - 1000)
                            end_idx = min(len(parent_text), child_pos + len(child_text) + 2000)
                            parent_text = "... " + parent_text[start_idx:end_idx] + " ..."
                        else:
                            parent_text = parent_text[:4000] + " ... (truncated)"

            result = {
                "score":        obj.metadata.score,
                "text":         child_text,       # precise match (shown to user)
                "parent_text":  parent_text,       # full section (sent to LLM)
                "act_name":     props["act_name"],
                "section":      props["section_number"],
                "topic":        props["topic_tag"],
                "is_case_law":  props["is_case_law"],
                "source":       props["source_url"],
                "chunk_type":   chunk_type,
                "parent_id":    parent_id,
            }

            results.append(result)

        return results

    def format_for_llm(self, results):
        """
        Converts the search results into a clean text block for the LLM.
        Sends parent_text (full section) as the primary context.
        Child text is the precise excerpt for citation.
        """
        if not results:
            return "No relevant legal context found."

        context_blocks = []
        for i, res in enumerate(results, 1):
            type_label = "JUDGEMENT" if res["is_case_law"] else "ACT/STATUTE"
            block = (
                f"--- DOCUMENT {i} ({type_label}) ---\n"
                f"Title: {res['act_name']}\n"
                f"Citation/Section: {res['section']}\n"
                f"Topic: {res['topic']}\n"
                f"Legal Text:\n{res['parent_text']}\n"
            )
            context_blocks.append(block)

        return "\n".join(context_blocks)

    def close(self):
        self.client.close()


if __name__ == "__main__":
    # Simple test run
    engine = LegalQueryEngine()

    try:
        user_query = "What is the legal age of marriage for girls in Punjab?"
        print(f"\nSearching for: {user_query}")

        raw_results = engine.get_hybrid_context(user_query, limit=3)

        print(f"\n--- {len(raw_results)} results found ---")
        for i, r in enumerate(raw_results, 1):
            has_parent = "✓" if r.get("parent_text") else "✗"
            print(f"  [{i}] Score: {r['score']:.4f} | {r['act_name']} | Parent: {has_parent}")

        print("\n--- FORMATTED CONTEXT FOR LLM ---")
        print(engine.format_for_llm(raw_results))

    finally:
        engine.close()
