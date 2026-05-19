"""
orchestrator.py
---------------
The 'Brain' of the LegalAnalyzer.
Searches the vector DB → generates a cited answer via Gemini.
No real-time scraping — answers from pre-indexed data only.
"""

import sys
import os

# Add the current directory to sys.path so imports work when run directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from query_engine import LegalQueryEngine
from llm_service import generate_legal_answer

NO_CONTEXT_MESSAGE = (
    "No relevant legal information was found in the database for your query.\n\n"
    "Please try rephrasing your question, or consult a qualified Pakistani lawyer "
    "for matters not covered in our indexed statutes and case law.\n\n"
    "⚠️ This is legal information, not legal advice."
)


class LegalOrchestrator:
    def __init__(self):
        self.engine = LegalQueryEngine()

    def handle_user_query(self, query_text: str):
        print(f"\n[Step 1] Searching Vector Database for: '{query_text}'")

        # Search the database (children only, with parent expansion)
        results = self.engine.get_hybrid_context(query_text, limit=5)

        if not results:
            print("[Result] No relevant data found.")
            return NO_CONTEXT_MESSAGE

        print(f"[Result] Found {len(results)} relevant chunks (Top Score: {results[0]['score']:.4f})")
        return self.generate_answer(query_text, results)

    def generate_answer(self, query, context):
        """
        Calls the Gemini API using the retrieved legal context.
        """
        formatted_context = self.engine.format_for_llm(context)
        return generate_legal_answer(query, formatted_context)


if __name__ == "__main__":
    orchestrator = LegalOrchestrator()

    try:
        print("\n--- TEST 1: EXISTING DATA ---")
        answer = orchestrator.handle_user_query("procedure for khula in Pakistan")
        print(answer)

        print("\n--- TEST 2: SPECIFIC QUERY ---")
        answer = orchestrator.handle_user_query("child maintenance calculation rules")
        print(answer)
    finally:
        orchestrator.engine.close()
