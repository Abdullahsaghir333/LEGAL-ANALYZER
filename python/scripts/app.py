import streamlit as st
import time
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Force project .env to override any system-level env vars
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)
# Add the current directory to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from orchestrator import LegalOrchestrator

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="LegalAnalyzer | Pakistani Family Law",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CUSTOM CSS FOR PREMIUM LOOK ---
st.markdown("""
    <style>
    /* Main container styling */
    .main {
        background-color: #fcfcfc;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: #1e293b;
        color: white;
    }
    section[data-testid="stSidebar"] .stMarkdown {
        color: #cbd5e1;
    }
    
    /* Header styling */
    .stHeading h1 {
        color: #1e293b;
        font-weight: 800;
    }
    
    /* Chat message bubble improvements */
    [data-testid="stChatMessage"] {
        border-radius: 15px;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    
    /* Status updates styling */
    .stStatus {
        border-radius: 10px;
        border: 1px solid #bfdbfe;
        background-color: #eff6ff;
    }
    
    /* Custom Card for Results */
    .result-card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 5px solid #2563eb;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 1.5rem;
    }
    
    /* Divider styling */
    hr {
        margin: 2rem 0;
        border-color: #e2e8f0;
    }
    </style>
    """, unsafe_allow_html=True)

# --- SIDEBAR ---
with st.sidebar:
    st.image("https://img.icons8.com/external-flatart-icons-flat-flatarticons/128/external-law-legal-flatart-icons-flat-flatarticons-1.png", width=80)
    st.title("JurisFlow AI")
    st.markdown("**Pakistani Family Law Expert**")
    st.markdown("---")
    
    st.info("""
    **Core Capabilities:**
    - 🔍 Hybrid Search (Acts & Judgements)
    - 🌐 Real-time Web Scraping (via Playwright)
    - 🤖 Gemini-powered Legal Reasoning
    - 📄 Automatic Citation Generation
    """)
    
    st.markdown("---")
    st.markdown("### Example Queries")
    examples = [
        "What is the procedure for Khula in Punjab?",
        "Child maintenance calculation rules",
        "Inheritance rights of daughters in Islam",
        "Recent LHC judgements on custody"
    ]
    for ex in examples:
        if st.button(ex, use_container_width=True):
            st.session_state.temp_prompt = ex

    st.markdown("---")
    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# --- MAIN UI ---
st.title("⚖️ LegalAnalyzer Project")
st.markdown("#### Retrieval-Augmented Generation (RAG) for Pakistani Statutes and Precedents")

# Initialize Session States
if 'orchestrator' not in st.session_state:
    try:
        with st.spinner("Initializing AI Engines..."):
            st.session_state.orchestrator = LegalOrchestrator()
    except Exception as e:
        st.error(f"Failed to connect to Vector Database: {e}")
        st.stop()

if 'messages' not in st.session_state:
    st.session_state.messages = []

# Display Chat History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Handle Chat Input
prompt = st.chat_input("Ask a legal question...")

# Handle example click
if 'temp_prompt' in st.session_state:
    prompt = st.session_state.temp_prompt
    del st.session_state.temp_prompt

if prompt:
    # Add user message to UI
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate Response
    with st.chat_message("assistant"):
        try:
            with st.status("Analyzing Legal Context...", expanded=True) as status:
                # Step 1: Database Search
                status.write("🔍 Searching Vector Database (42,585 child chunks)...")
                results = st.session_state.orchestrator.engine.get_hybrid_context(prompt, limit=5)

                if results:
                    status.write(f"✅ Found {len(results)} relevant legal records (Top Score: {results[0]['score']:.4f})")
                    parent_count = sum(1 for r in results if r.get("parent_text") and r["parent_text"] != r["text"])
                    if parent_count:
                        status.write(f"📄 Expanded {parent_count} results with parent section context")
                else:
                    status.write("⚠️ No relevant data found in database.")

                status.write("🤖 Reasoning with Gemini 2.5 Flash...")

                # Step 2: Generate Answer
                if results:
                    answer = st.session_state.orchestrator.generate_answer(prompt, results)
                else:
                    answer = st.session_state.orchestrator.handle_user_query(prompt)

                status.update(label="Legal Analysis Complete!", state="complete", expanded=False)

            # Display Answer
            st.markdown(answer)
            st.session_state.messages.append({"role": "assistant", "content": answer})

            # Display Sources
            if results:
                with st.expander("📚 View Cited Sources"):
                    for idx, res in enumerate(results):
                        source_type = "🏛️ Judgement" if res['is_case_law'] else "📜 Act"
                        st.markdown(f"""
                        **{idx+1}. {source_type}: {res['act_name']}**
                        - Section/Citation: `{res['section']}`
                        - Relevance Score: `{res['score']:.4f}`
                        - Snippet: *"{res['text'][:200]}..."*
                        """)
                        if res['source']:
                            st.link_button("View Source", res['source'])

        except Exception as e:
            st.error(f"An error occurred during processing: {e}")
            st.info("Ensure Weaviate and Docker are running on your system.")

# --- FOOTER ---
st.markdown("---")
st.caption("LegalAnalyzer v2.1 | Built for Pakistani Legal Professionals")