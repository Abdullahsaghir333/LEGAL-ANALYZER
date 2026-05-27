"""
Result re-ranking — selects the top-N most relevant chunks after junk filtering.
Currently uses score-based re-ranking; can be upgraded to a cross-encoder later.
"""

import re


def rerank_chunks(chunks: list[dict], top_k: int = 5) -> list[dict]:
    """
    Re-rank and select the best chunks.
    Currently sorts by hybrid score and deduplicates by parent_id.
    """
    if not chunks:
        return []

    # Sort by score descending (already sorted from Weaviate, but be safe)
    sorted_chunks = sorted(chunks, key=lambda c: c.get("score", 0), reverse=True)

    # Deduplicate: if multiple children share the same parent, keep the highest-scored one
    seen_parents = set()
    deduped = []
    for chunk in sorted_chunks:
        parent_id = chunk.get("parent_id", "")
        if parent_id and parent_id in seen_parents:
            continue
        if parent_id:
            seen_parents.add(parent_id)
        deduped.append(chunk)

    # Clean up act_name if it looks like a hash
    for chunk in deduped:
        act_name = chunk.get("act_name", "")
        if re.match(r'^administrator[a-f0-9]+$', act_name):
            chunk["act_name"] = "Pakistan Code — Family Law Act"

    return deduped[:top_k]
