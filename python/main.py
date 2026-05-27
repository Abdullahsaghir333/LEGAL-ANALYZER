"""
Pakistan Family Law RAG API
────────────────────────────
FastAPI + LangChain + LangGraph backend.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Or:
    python main.py
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Force load project .env before anything else
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Check critical environment variables
if not os.getenv("GEMINI_API_KEY"):
    logger.warning("WARNING: GEMINI_API_KEY not set. LLM queries will fail.")
else:
    logger.info("✓ GEMINI_API_KEY is set")


# ── Request logging middleware ─────────────────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"[REQUEST] {request.method} {request.url.path}")
        try:
            response = await call_next(request)
            logger.info(f"[RESPONSE] {request.method} {request.url.path} → {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"[ERROR] {request.method} {request.url.path} → {e}")
            raise


# ── Lifespan: pre-load all heavy singletons ───────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-load models and connections. Shutdown: clean up."""
    logger.info("Starting up — pre-loading singletons...")

    # Pre-load Weaviate connection
    from services.weaviate_client import get_weaviate_client, close_weaviate_client
    client = get_weaviate_client()
    if client.is_ready():
        collection = client.collections.get("LegalChunk")
        agg = collection.aggregate.over_all(total_count=True)
        logger.info(f"Weaviate connected — {agg.total_count} chunks indexed")
    else:
        logger.warning("Weaviate NOT ready — queries will fail")

    # Pre-load embedding model (~2.2GB, takes a minute on first run)
    from services.embedding_service import get_embedding_model
    get_embedding_model()

    # Pre-compile LangGraph
    from rag.graph import get_rag_graph
    get_rag_graph()
    logger.info("LangGraph pipeline compiled")

    # Pre-load parent chunks into memory
    from rag.nodes import _get_parent_lookup
    parents = _get_parent_lookup()
    logger.info(f"Parent lookup loaded — {len(parents)} parents in memory")

    logger.info("All services loaded. Server ready.")

    yield

    # Shutdown
    logger.info("Shutting down — closing connections...")
    close_weaviate_client()
    logger.info("Weaviate connection closed.")


# ── FastAPI App ───────────────────────────────────────────────────────────

app = FastAPI(
    title="Pakistan Family Law RAG API",
    description=(
        "AI-powered Pakistani family law assistant. "
        "Ask legal questions in English or Urdu and receive cited answers "
        "grounded in real statutes and court judgements."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# Request logging middleware — logs all requests/responses
app.add_middleware(RequestLoggingMiddleware)

# CORS — allow all origins in dev, tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register Routes ──────────────────────────────────────────────────────

from api.routes import query, health, history, document, lawyer_docs

app.include_router(query.router,   prefix="/api")
app.include_router(health.router,  prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(document.router, prefix="/api")
app.include_router(lawyer_docs.router, prefix="/api")


# ── Root endpoint ─────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Pakistan Family Law RAG API",
        "version": "2.0.0",
        "docs":    "/docs",
        "health":  "/api/health",
    }


# ── Run directly ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
