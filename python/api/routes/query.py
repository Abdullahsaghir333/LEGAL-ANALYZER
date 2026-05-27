"""
POST /api/query — Main RAG query endpoint.
Runs the full LangGraph pipeline and returns a cited answer.
"""

import asyncio
import uuid
import time
import logging

from fastapi import APIRouter, HTTPException
from api.models.schemas import QueryRequest, QueryResponse, CitationModel
from rag.graph import get_rag_graph
from rag.nodes import RAGState
from services.session_store import save_to_history

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Query"])


@router.get("/query/ping")
async def query_ping():
    """Browser-friendly check — open http://127.0.0.1:8000/api/query/ping to confirm API is up."""
    logger.info("[QUERY PING] FastAPI query router is reachable")
    return {
        "status": "ok",
        "message": "Use POST /api/query with JSON body, or try /docs for Swagger UI",
        "example_body": {"query": "What is khula?", "session_id": "test"},
    }


@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """
    Process a legal query through the RAG pipeline.
    Returns a cited answer with source metadata.
    """
    logger.info(f"[QUERY ENDPOINT HIT] Query: {request.query[:50]}... Session: {request.session_id}")
    start = time.time()

    # Generate session_id if not provided
    session_id = request.session_id or str(uuid.uuid4())

    # Build initial state
    initial_state: RAGState = {
        "query":           request.query,
        "session_id":      session_id,
        "language":        "",
        "topic_tag":       request.topic,
        "province":        request.province,
        "query_vector":    [],
        "child_chunks":    [],
        "expanded_chunks": [],
        "answer":          "",
        "citations":       [],
        "error":           "",
    }

    try:
        # Run sync LangGraph in a thread so long CPU work does not block other requests
        graph = get_rag_graph()
        result = await asyncio.to_thread(graph.invoke, initial_state)

        # Check for errors
        if result.get("error") and not result.get("answer"):
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline error: {result['error']}"
            )

        # Save to session history
        save_to_history(session_id, request.query, result.get("answer", ""))

        duration_ms = int((time.time() - start) * 1000)

        # Build citation models
        citations = [
            CitationModel(**c) for c in result.get("citations", [])
        ]

        logger.info(f"[QUERY COMPLETE] Duration: {duration_ms}ms, Answer length: {len(result.get('answer', ''))}")

        return QueryResponse(
            query=request.query,
            answer=result.get("answer", ""),
            citations=citations,
            language=result.get("language", "en"),
            session_id=session_id,
            duration_ms=duration_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[QUERY ERROR] Exception: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
