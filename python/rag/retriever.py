"""
Weaviate hybrid retrieval — searches child chunks with optional topic/province filters.
"""

import re
from weaviate.classes.query import MetadataQuery, Filter
from services.weaviate_client import get_weaviate_client
from services.embedding_service import embed_query

COLLECTION_NAME = "LegalChunk"

# Junk indicators — chunks with these substrings are garbage
JUNK_INDICATORS = [
    "1991 1990 1989",
    "t h e   w h o l e",
    "negotiable instrument",
    "endorsement on a",
]

MIN_CHUNK_LENGTH = 150


def hybrid_search(
    query: str,
    query_vector: list[float],
    topic_tag: str = "",
    province: str = "",
    limit: int = 20,
    alpha: float = 0.6,
) -> list[dict]:
    """
    Execute hybrid search on Weaviate child chunks.
    Returns top results after junk filtering.
    """
    client = get_weaviate_client()
    collection = client.collections.get(COLLECTION_NAME)

    # Always filter to children only — parents are fetched by ID, not searched
    filters = Filter.by_property("chunk_type").equal("child")
    if topic_tag:
        filters = filters & Filter.by_property("topic_tag").equal(topic_tag)
    if province:
        filters = filters & Filter.by_property("province").equal(province)

    response = collection.query.hybrid(
        query=query,
        vector=query_vector,
        alpha=alpha,
        limit=limit,
        filters=filters,
        return_metadata=MetadataQuery(score=True),
    )

    chunks = []
    for obj in response.objects:
        text = obj.properties.get("text", "")

        # Skip very short chunks
        if len(text) < MIN_CHUNK_LENGTH:
            continue

        # Skip junk chunks
        text_lower = text.lower()
        if any(j.lower() in text_lower for j in JUNK_INDICATORS):
            continue

        chunks.append({
            "id":          str(obj.uuid),
            "text":        text,
            "act_name":    obj.properties.get("act_name", ""),
            "section":     obj.properties.get("section_number", ""),
            "topic":       obj.properties.get("topic_tag", ""),
            "is_case_law": obj.properties.get("is_case_law", False),
            "source":      obj.properties.get("source_url", ""),
            "province":    obj.properties.get("province", ""),
            "year":        obj.properties.get("year", 0),
            "parent_id":   obj.properties.get("parent_id", ""),
            "score":       obj.metadata.score,
        })

    return chunks
