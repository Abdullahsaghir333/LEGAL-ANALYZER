"""
GET /api/health — Health check endpoint.
Verifies Weaviate connectivity and reports system status.
"""

import logging
from fastapi import APIRouter
from api.models.schemas import HealthResponse
from services.weaviate_client import get_weaviate_client
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health-simple")
async def health_simple():
    """
    Lightweight health check — just confirms FastAPI is running.
    Use this to test basic connectivity from Node.js backend.
    """
    logger.info("[HEALTH SIMPLE] FastAPI is alive")
    return {
        "status": "ok",
        "service": "Pakistan Family Law RAG API",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check system health: Weaviate connection and chunk count.
    """
    logger.info("[HEALTH CHECK] Starting health check...")
    weaviate_ok = False
    chunk_count = 0

    try:
        client = get_weaviate_client()
        weaviate_ok = client.is_ready()
        logger.info(f"[HEALTH CHECK] Weaviate is_ready(): {weaviate_ok}")

        if weaviate_ok:
            collection = client.collections.get("LegalChunk")
            agg = collection.aggregate.over_all(total_count=True)
            chunk_count = agg.total_count
            logger.info(f"[HEALTH CHECK] LegalChunk collection has {chunk_count} chunks")
    except Exception as e:
        logger.error(f"[HEALTH CHECK] Weaviate error: {e}", exc_info=True)

    logger.info(f"[HEALTH CHECK] Returning status={'ok' if weaviate_ok else 'degraded'}")
    return HealthResponse(
        status="ok" if weaviate_ok else "degraded",
        weaviate=weaviate_ok,
        total_chunks=chunk_count,
        model="intfloat/multilingual-e5-large",
        llm="gemini-2.5-flash",
    )
