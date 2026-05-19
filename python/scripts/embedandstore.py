"""
embedandstore.py
----------------
Generates embeddings for all chunks using multilingual-e5-large
and stores them in Weaviate with all metadata.

Model: intfloat/multilingual-e5-large
  - Supports Urdu + English
  - 1024-dim vectors
  - Free, runs locally on CPU (slow but fine for setup)

Batch size: 32 (adjust down to 8 if you run out of RAM)

Input files (from chunk.py):
  - data/chunks/children_only.json   (default — children embedded, parents fetched by ID)
  - data/chunks/all_chunks.json      (--all flag)
  - data/chunks/parents_only.json    (--parents-only flag)
  - data/chunks/children_only.json   (--children-only flag)

Checkpoint: saves progress every 5000 chunks to data/embeddings/checkpoint.json
  so interrupted runs can be resumed automatically.

Chunk schema expected:
  id, text, act_name, section_number, topic_tag, province,
  language, year, source_url, is_case_law, chunk_type, parent_id
"""

import json
import time
import sys
import weaviate
import weaviate.classes as wvc
from weaviate.classes.query import MetadataQuery
from sentence_transformers import SentenceTransformer
from pathlib import Path
from tqdm import tqdm
from dotenv import load_dotenv
import os

load_dotenv()

CHUNK_DATA_DIR = Path("data/chunks")
BATCH_SIZE     = 32        # reduce to 8 if low RAM
COLLECTION     = "LegalChunk"

# For multilingual-e5 models, queries need "query: " prefix
# and passages need "passage: " prefix
PASSAGE_PREFIX = "passage: "
QUERY_PREFIX   = "query: "


def load_model():
    print("Loading embedding model: intfloat/multilingual-e5-large")
    print("(First run will download ~2.2GB — subsequent runs use cache)")
    model = SentenceTransformer("intfloat/multilingual-e5-large")
    print(f"Model loaded. Embedding dimension: {model.get_sentence_embedding_dimension()}")
    return model


def embed_batch(model: SentenceTransformer, texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a batch of texts.
    Adds 'passage: ' prefix required by multilingual-e5 models.
    """
    prefixed = [PASSAGE_PREFIX + t for t in texts]
    embeddings = model.encode(
        prefixed,
        normalize_embeddings=True,    # cosine similarity works best with normalised vectors
        show_progress_bar=False,
        batch_size=BATCH_SIZE,
    )
    return embeddings.tolist()


CHECKPOINT_PATH = Path("data/embeddings/checkpoint.json")


def store_chunks(chunks: list[dict], model: SentenceTransformer, start_offset: int = 0):
    """
    Embed all chunks and store in Weaviate using batch import.
    Uses the stable UUID from chunk['id'] directly.
    Stores chunk_type and parent_id alongside all other metadata.
    Saves checkpoint every 5000 chunks for resume on interruption.
    """
    client = weaviate.connect_to_local(host="localhost", port=8080)

    try:
        collection = client.collections.get(COLLECTION)

        print(f"\nStoring {len(chunks)} chunks into Weaviate...")
        print(f"Batch size: {BATCH_SIZE}")

        # Count chunk types
        parent_count = sum(1 for c in chunks if c.get("chunk_type") == "parent")
        child_count  = sum(1 for c in chunks if c.get("chunk_type") == "child")
        print(f"  Parents: {parent_count}, Children: {child_count}")

        success_count = 0
        error_count   = 0

        # Process in batches
        with collection.batch.dynamic() as batch:
            for i in tqdm(range(0, len(chunks), BATCH_SIZE), desc="Embedding + storing"):
                batch_chunks = chunks[i : i + BATCH_SIZE]

                # Extract texts and generate embeddings
                texts = [c["text"] for c in batch_chunks]

                try:
                    embeddings = embed_batch(model, texts)
                except Exception as e:
                    print(f"\nEmbedding error at batch {i}: {e}")
                    error_count += len(batch_chunks)
                    continue

                # Save checkpoint every 5000 chunks
                chunks_processed = i + len(batch_chunks)
                if chunks_processed % 5000 == 0:
                    checkpoint = {"last_index": start_offset + chunks_processed}
                    with open(CHECKPOINT_PATH, "w") as f:
                        json.dump(checkpoint, f)
                    print(f"\n  Checkpoint saved: {start_offset + chunks_processed} chunks done")

                # Store each chunk with its vector
                for chunk, vector in zip(batch_chunks, embeddings):
                    try:
                        chunk_id = chunk["id"]

                        batch.add_object(
                            properties={
                                "text":           chunk["text"],
                                "act_name":       chunk["act_name"],
                                "section_number": chunk["section_number"],
                                "topic_tag":      chunk["topic_tag"],
                                "province":       chunk["province"],
                                "language":       chunk["language"],
                                "year":           chunk["year"] if chunk["year"] else 0,
                                "source_url":     chunk["source_url"],
                                "is_case_law":    chunk["is_case_law"],
                                "chunk_type":     chunk.get("chunk_type", "parent"),
                                "parent_id":      chunk.get("parent_id", ""),
                            },
                            vector=vector,
                            uuid=chunk_id,
                        )
                        success_count += 1
                    except Exception as e:
                        print(f"\nStorage error for chunk {chunk['id']}: {e}")
                        error_count += 1

        print(f"\nIngestion complete:")
        print(f"  Successfully stored : {success_count}")
        print(f"  Errors              : {error_count}")

        # Clear checkpoint on successful completion
        if CHECKPOINT_PATH.exists():
            CHECKPOINT_PATH.unlink()
            print("  Checkpoint cleared (run complete)")

    finally:
        client.close()


def verify_storage():
    """
    Quick verification — counts objects and runs a test query.
    """
    client = weaviate.connect_to_local(host="localhost", port=8080)

    try:
        collection = client.collections.get(COLLECTION)

        # Count total objects
        count = collection.aggregate.over_all(total_count=True)
        print(f"\nVerification:")
        print(f"  Total objects in Weaviate: {count.total_count}")

        # Test hybrid search query
        model = SentenceTransformer("intfloat/multilingual-e5-large")
        test_query = "how can a wife get divorce in Pakistan"
        query_vector = model.encode(
            QUERY_PREFIX + test_query,
            normalize_embeddings=True
        ).tolist()

        results = collection.query.hybrid(
            query=test_query,          # for BM25 (keyword search)
            vector=query_vector,       # for dense search
            alpha=0.6,                 # 0=pure BM25, 1=pure vector, 0.6=mostly semantic
            limit=3,
            return_metadata=MetadataQuery(score=True)
        )

        print(f"\nTest query: '{test_query}'")
        print(f"Top results:")
        for i, obj in enumerate(results.objects, 1):
            print(f"\n  [{i}] Score: {obj.metadata.score:.4f}")
            print(f"       Act    : {obj.properties['act_name']}")
            print(f"       Section: {obj.properties['section_number']}")
            print(f"       Topic  : {obj.properties['topic_tag']}")
            print(f"       Type   : {obj.properties.get('chunk_type', 'N/A')}")
            print(f"       Text   : {obj.properties['text'][:150]}...")

    finally:
        client.close()


# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Determine which chunk file to load
    if "--all" in sys.argv:
        chunk_path = CHUNK_DATA_DIR / "all_chunks.json"
        print("Mode: all chunks (parents + children)")
    elif "--parents-only" in sys.argv:
        chunk_path = CHUNK_DATA_DIR / "parents_only.json"
        print("Mode: parents only")
    elif "--children-only" in sys.argv:
        chunk_path = CHUNK_DATA_DIR / "children_only.json"
        print("Mode: children only")
    else:
        chunk_path = CHUNK_DATA_DIR / "children_only.json"
        print("Mode: children only (default — parents fetched by ID at query time)")
        print("Use --all to embed everything, --parents-only for parents only")

    if not chunk_path.exists():
        print(f"Chunk file not found at {chunk_path}")
        print("Run scripts/chunk.py first.")
        exit(1)

    with open(chunk_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"Loaded {len(chunks)} chunks from {chunk_path.name}")

    # Check for existing checkpoint and resume from it
    Path("data/embeddings").mkdir(parents=True, exist_ok=True)
    start_index = 0

    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH) as f:
            cp = json.load(f)
        start_index = cp.get("last_index", 0)
        print(f"Resuming from checkpoint at index {start_index} / {len(chunks)}")
        chunks = chunks[start_index:]
    else:
        print("No checkpoint found — starting from beginning")

    # Load model
    model = load_model()

    # Embed and store
    start = time.time()
    store_chunks(chunks, model, start_offset=start_index)
    elapsed = time.time() - start
    print(f"\nTotal time: {elapsed:.1f}s ({elapsed/60:.1f} min)")

    # Verify
    verify_storage()