import io
import uuid
import time
import logging
import os
from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from weaviate.classes.query import MetadataQuery, Filter

from services.embedding_service import embed_query
from services.weaviate_client import get_weaviate_client
from services.session_store import get_session_history, save_to_history

logger = logging.getLogger(__name__)

router = APIRouter(tags=["LawyerDocs"])

class LawyerQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000)
    lawyer_id: str = Field(...)
    session_id: str = Field(default="")
    context_mode: str = Field(default="General")


def _context_filter(context_mode: str):
    mode = (context_mode or "General").strip()
    if mode == "Contracts":
        return Filter.by_property("document_type").equal("contract")
    if mode == "Cases":
        return Filter.any_of([
            Filter.by_property("document_type").equal("case_file"),
            Filter.by_property("document_type").like("case_*"),
        ])
    return None

@router.post("/lawyer-docs/upload")
async def upload_lawyer_doc(
    file: UploadFile = File(...),
    lawyer_id: str = Form(...),
    document_type: str = Form(default="case_file")
):
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
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text extracted from PDF.")

        # Chunk the text
        child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        chunks = child_splitter.split_text(extracted_text)

        client = get_weaviate_client()
        collection = client.collections.get("LawyerDocumentChunk")
        
        with collection.batch.dynamic() as batch:
            for chunk_text in chunks:
                if len(chunk_text) < 100:
                    continue
                
                vector = embed_query(chunk_text)
                
                batch.add_object(
                    properties={
                        "text": chunk_text,
                        "lawyer_id": lawyer_id,
                        "document_type": document_type,
                        "source": file.filename
                    },
                    vector=vector
                )

        if len(collection.batch.failed_objects) > 0:
            logger.error("Failed to insert some chunks into Weaviate.")
            raise HTTPException(status_code=500, detail="Failed to store document in database.")

        return {
            "message": "Document uploaded and embedded successfully", 
            "chunks_stored": len(chunks),
            "extracted_text": extracted_text.strip()
        }
        
    except Exception as e:
        logger.error(f"Error uploading lawyer doc: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/lawyer-docs/query")
async def query_lawyer_docs(request: LawyerQueryRequest):
    try:
        start_time = time.time()
        
        # 1. Embed query
        vector = embed_query(request.query)
        
        # 2. Retrieve from Weaviate with metadata filter
        client = get_weaviate_client()
        collection = client.collections.get("LawyerDocumentChunk")
        
        filters = Filter.by_property("lawyer_id").equal(request.lawyer_id)
        context_filter = _context_filter(request.context_mode)
        if context_filter is not None:
            filters = filters & context_filter
        
        response = collection.query.hybrid(
            query=request.query,
            vector=vector,
            alpha=0.6,
            limit=5,
            filters=filters,
            return_metadata=MetadataQuery(score=True),
        )
        
        chunks = []
        for obj in response.objects:
            chunks.append({
                "text": obj.properties.get("text", ""),
                "source": obj.properties.get("source", ""),
                "document_type": obj.properties.get("document_type", ""),
                "score": obj.metadata.score,
            })
            
        if not chunks:
            return {
                "query": request.query,
                "answer": "No relevant documents found in your private uploaded files.",
                "citations": [],
                "session_id": request.session_id,
                "duration_ms": int((time.time() - start_time) * 1000)
            }
            
        # 3. Generate Answer using Gemini
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API Key missing")
            
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.1,
            max_output_tokens=1500,
            google_api_key=api_key,
        )
        
        context_blocks = []
        citations = []
        for i, chunk in enumerate(chunks, 1):
            context_blocks.append(
                f"--- DOCUMENT {i} ---\n"
                f"Source: {chunk['source']} ({chunk['document_type']})\n"
                f"Text:\n{chunk['text']}\n"
            )
            citations.append({
                "index": i,
                "source_url": chunk['source'],
                "snippet": chunk['text'][:200],
                "score": round(chunk['score'], 4),
                "is_case_law": False,
                "act_name": chunk['source'],
                "section": chunk['document_type']
            })
            
        context_str = "\n".join(context_blocks)
        
        history_dicts = get_session_history(request.session_id)
        history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history_dicts])
        
        prompt = (
            "You are a helpful AI assistant for a lawyer.\n"
            "Answer the lawyer's query strictly based on the following documents uploaded by them.\n"
            "If the answer is not in the documents, state that clearly.\n\n"
            "Conversation History:\n"
            f"{history_str}\n\n"
            "Context Documents:\n"
            f"{context_str}\n\n"
            f"Query: {request.query}\n\n"
            "Answer:"
        )
        
        chain = llm | StrOutputParser()
        answer = chain.invoke(prompt)
        
        # Save to history
        save_to_history(request.session_id, request.query, answer)
        
        return {
            "query": request.query,
            "answer": answer,
            "citations": citations,
            "session_id": request.session_id,
            "duration_ms": int((time.time() - start_time) * 1000)
        }
        
    except Exception as e:
        logger.error(f"Error in lawyer query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
