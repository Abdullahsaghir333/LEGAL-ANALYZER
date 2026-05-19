"""
10_llm_service.py
-----------------
Connects to Google Gemini API to generate citation-ready legal answers.
Uses the context retrieved from the Query Engine.
"""

import os
import time
from google import genai
from dotenv import load_dotenv
from pathlib import Path

# Force load the .env file from the absolute project root
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Configuration
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if GEMINI_API_KEY:
    # Print partial key for debugging (first 5 and last 5 chars)
    print(f"--- DEBUG: GEMINI_API_KEY loaded: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
else:
    print(f"--- ERROR: GEMINI_API_KEY NOT FOUND AT {env_path}")

# Initialize the Google GenAI Client
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# Using Gemini 1.5 Flash for the perfect balance of speed and legal reasoning
MODEL_ID = "gemini-2.5-flash"

SYSTEM_PROMPT = """
You are an expert Pakistani Legal Assistant specializing in Family Law.
Your goal is to provide accurate, helpful, and cited legal information based ONLY on the provided context.

STRICT RULES:
1. ONLY answer based on the provided context (Acts/Statutes and Court Judgements).
2. CITATIONS ARE MANDATORY: Every factual claim must cite its source as:
   [Act Name, Section X] for legislation, e.g. [Muslim Family Laws Ordinance 1961, Section 7]
   [Court, Citation] for case law, e.g. [PLD 2021 SC 123]
3. If the answer is not in the provided context, say:
   "This matter is not covered in the retrieved sections. Please consult a qualified Pakistani lawyer."
   Do NOT make up laws or cite sections not present in the context.
4. Never give personal legal advice — only explain what the law states.
5. If the user asked in Urdu or Roman Urdu, respond in Urdu.
6. Maintain a professional, objective, and empathetic tone.
7. Always end your response with:
   "⚠️ This is legal information, not legal advice."
8. Reply in the same language the user used (Urdu/English).
"""

def generate_legal_answer(query: str, context_text: str):
    if not GEMINI_API_KEY or not client:
        return f"ERROR: Missing 'GEMINI_API_KEY'. System tried to find it at: {env_path}"

    full_prompt = f"{SYSTEM_PROMPT}\n\nUSER QUESTION: {query}\n\nLEGAL CONTEXT:\n{context_text}"
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=full_prompt
        )
        return response.text
    except Exception as e:
        return f"Error calling Gemini API: {e}"

if __name__ == "__main__":
    # Test run
    test_query = "What is the notice period for divorce?"
    mock_context = "Section 7 of MFLO 1961 states that divorce notice must be sent to the Chairman and the wife. The divorce becomes effective after 90 days."
    print(generate_legal_answer(test_query, mock_context))
