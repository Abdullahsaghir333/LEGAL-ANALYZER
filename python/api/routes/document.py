import io
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
import pdfplumber

from api.models.schemas import SummarizeRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Document"])

@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract text from a PDF file using pdfplumber.
    Falls back to OCR (pytesseract) if necessary (to be implemented later).
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        extracted_text = ""
        
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n\n"
                    
        # Future: If extracted_text is empty, use OCR (pytesseract) here
        
        if not extracted_text.strip():
            return {"text": "No text could be extracted from this PDF. It may be scanned and require OCR."}
            
        return {"text": extracted_text.strip(), "filename": file.filename}
        
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(req: SummarizeRequest):
    """Summarize document text using Gemini (standalone endpoint — does not use vector DB)."""
    import json as json_stdlib
    import os
    import re

    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage, SystemMessage

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    lengths = {
        "short": "About 3–4 bullets.",
        "medium": "Two short paragraphs plus up to 6 bullets.",
        "detailed": "Full structured memo-style breakdown.",
        }
    tone_map = {"professional": "formal legal/industrial wording.", "simple": "clear Plain English."}

    lk = req.summary_length.strip().lower()
    lk_norm = "medium"
    if lk in lengths:
        lk_norm = lk
    td_norm = tone_map.get(req.tone.strip().lower(), tone_map["professional"])

    system = (
        f"You summarize legal and business documents for lawyers. "
        f"Length: {lengths[lk_norm]} Tone: {td_norm} "
        "Output JSON only with keys: executiveSummary (string), keyPoints (array of strings)."
    )
    human = f"Document text to summarize:\n\n{req.text[:120_000]}"

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.2,
        max_output_tokens=2048,
        google_api_key=api_key,
    )
    raw = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=human),
    ])
    txt = getattr(raw, "content", raw) if raw is not None else ""

    def _parse(text: str) -> dict:
        text = text.strip()
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json_stdlib.loads(m.group(0))
            except json_stdlib.JSONDecodeError:
                pass
        return {"executiveSummary": text[:2000], "keyPoints": []}

    data = _parse(txt)
    return {
        "executiveSummary": data.get("executiveSummary", "") or str(data.get("executive_summary", "")),
        "keyPoints": data.get("keyPoints") or data.get("key_points") or [],
    }
