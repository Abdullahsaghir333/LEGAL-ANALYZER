"""
In-memory session/history store.
Stores the last 20 messages per session_id.
"""

from collections import defaultdict
from datetime import datetime, timezone


_sessions: dict[str, list[dict]] = defaultdict(list)


def save_to_history(session_id: str, query: str, answer: str):
    """Append a query-answer pair to the session history."""
    _sessions[session_id].append({
        "role":      "user",
        "content":   query,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    _sessions[session_id].append({
        "role":      "assistant",
        "content":   answer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    # Keep last 20 messages per session
    _sessions[session_id] = _sessions[session_id][-20:]


def get_session_history(session_id: str) -> list[dict]:
    """Return the conversation history for a session."""
    return _sessions.get(session_id, [])


def list_sessions() -> list[str]:
    """Return all active session IDs."""
    return list(_sessions.keys())
