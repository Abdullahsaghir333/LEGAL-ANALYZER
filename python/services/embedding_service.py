"""
Embedding model singleton.
Uses intfloat/multilingual-e5-large (1024-dim, Urdu + English).
"""

from sentence_transformers import SentenceTransformer

_model = None

QUERY_PREFIX = "query: "


def get_embedding_model() -> SentenceTransformer:
    """Return a singleton SentenceTransformer model."""
    global _model
    if _model is None:
        print("Loading embedding model: intfloat/multilingual-e5-large ...")
        _model = SentenceTransformer("intfloat/multilingual-e5-large")
        print(f"Embedding model loaded. Dim: {_model.get_sentence_embedding_dimension()}")
    return _model


def embed_query(query: str) -> list[float]:
    """Embed a query string with the required 'query: ' prefix."""
    model = get_embedding_model()
    vector = model.encode(
        QUERY_PREFIX + query,
        normalize_embeddings=True,
    )
    return vector.tolist()
