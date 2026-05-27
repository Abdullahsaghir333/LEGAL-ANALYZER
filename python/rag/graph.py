"""
LangGraph workflow definition — 6-node RAG pipeline.

Flow:
  detect_language → classify_query → retrieve →
  expand_context → generate_answer → format_response → END
"""

from langgraph.graph import StateGraph, END
from rag.nodes import (
    RAGState,
    detect_language,
    classify_query,
    retrieve,
    expand_context,
    generate_answer,
    format_response,
)

_compiled_graph = None


def build_rag_graph():
    """Build and compile the LangGraph RAG workflow."""
    graph = StateGraph(RAGState)

    # Add all 6 nodes
    graph.add_node("detect_language",  detect_language)
    graph.add_node("classify_query",   classify_query)
    graph.add_node("retrieve",         retrieve)
    graph.add_node("expand_context",   expand_context)
    graph.add_node("generate_answer",  generate_answer)
    graph.add_node("format_response",  format_response)

    # Define linear flow
    graph.set_entry_point("detect_language")
    graph.add_edge("detect_language",  "classify_query")
    graph.add_edge("classify_query",   "retrieve")
    graph.add_edge("retrieve",         "expand_context")
    graph.add_edge("expand_context",   "generate_answer")
    graph.add_edge("generate_answer",  "format_response")
    graph.add_edge("format_response",  END)

    return graph.compile()


def get_rag_graph():
    """Return a singleton compiled graph."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_rag_graph()
    return _compiled_graph
