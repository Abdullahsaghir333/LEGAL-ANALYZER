"""
GET /api/history/{session_id} — Conversation history endpoint.
Returns the message history for a given session.
"""

from fastapi import APIRouter
from api.models.schemas import HistoryResponse, HistoryMessage
from services.session_store import get_session_history

router = APIRouter(tags=["History"])


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str):
    """
    Retrieve conversation history for a session.
    """
    raw_messages = get_session_history(session_id)

    messages = [
        HistoryMessage(
            role=m.get("role", "user"),
            content=m.get("content", ""),
            timestamp=m.get("timestamp", ""),
        )
        for m in raw_messages
    ]

    return HistoryResponse(
        session_id=session_id,
        messages=messages,
    )
