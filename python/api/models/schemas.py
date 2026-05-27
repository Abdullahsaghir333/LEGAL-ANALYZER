"""
Pydantic request/response models for the API.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request Models ────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    """Request body for POST /api/query"""
    query:      str = Field(..., min_length=3, max_length=1000, description="Legal question")
    session_id: str = Field(default="", description="Session ID for conversation history")
    topic:      str = Field(default="", description="Optional topic filter (divorce, custody, etc)")
    province:   str = Field(default="", description="Optional province filter (Punjab, Sindh, etc)")


# ── Response Models ───────────────────────────────────────────────────────

class CitationModel(BaseModel):
    """A single cited source."""
    index:       int
    act_name:    str
    section:     str
    is_case_law: bool
    score:       float
    snippet:     str
    source_url:  str


class QueryResponse(BaseModel):
    """Response body for POST /api/query"""
    query:       str
    answer:      str
    citations:   list[CitationModel]
    language:    str
    session_id:  str
    duration_ms: int


class HealthResponse(BaseModel):
    """Response body for GET /api/health"""
    status:       str
    weaviate:     bool
    total_chunks: int
    model:        str
    llm:          str


class HistoryMessage(BaseModel):
    """A single message in the conversation history."""
    role:      str
    content:   str
    timestamp: str


class HistoryResponse(BaseModel):
    """Response body for GET /api/history/{session_id}"""
    session_id: str
    messages:   list[HistoryMessage]


class SummarizeRequest(BaseModel):
    """Request for POST /api/summarize"""
    text: str = Field(..., min_length=50, max_length=200_000)
    summary_length: str = Field(default="Medium", description="Short | Medium | Detailed")
    tone: str = Field(default="Professional", description="Professional | Simple")


class SummarizeResponse(BaseModel):
    executive_summary: str = Field(..., serialization_alias="executiveSummary")
    key_points: list[str] = Field(default_factory=list, serialization_alias="keyPoints")

    model_config = {"populate_by_name": True}
