from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import fitz  # PyMuPDF
import docx
import io

app = FastAPI(title="Resume Text Extraction Service")

# CORS configuration - allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "text-extraction"}

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from PDF or DOCX file.
    Returns: {"text": str, "success": bool, "filename": str}
    """
    try:
        # Read file content
        content = await file.read()
        filename = file.filename or "unknown"
        
        # Extract based on file type
        if filename.lower().endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            
            # Get metadata before closing
            page_count = len(doc)
            doc.close()
            
            return {
                "text": text.strip(),
                "success": True,
                "filename": filename,
                "pages": page_count,
                "length": len(text.strip())
            }
            
        elif filename.lower().endswith(".docx") or filename.lower().endswith(".doc"):
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
            
            return {
                "text": text.strip(),
                "success": True,
                "filename": filename,
                "paragraphs": len(doc.paragraphs),
                "length": len(text.strip())
            }
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {filename}. Only PDF and DOCX are supported."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(e)}"
        )

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Resume Text Extraction Service Starting...")
    print("=" * 60)
    print("📍 Listening on: http://127.0.0.1:8001")
    print("🔗 Health check: http://127.0.0.1:8001/health")
    print("📄 Endpoint: POST http://127.0.0.1:8001/extract-text")
    print("=" * 60)
    
    uvicorn.run(
        "text_extractor:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
