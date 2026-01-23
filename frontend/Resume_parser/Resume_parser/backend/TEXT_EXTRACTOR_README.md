# Python Text Extraction Service

## Quick Start

### 1. Install Dependencies
```bash
cd d:\hackvision-jan-26\Hackvision\frontend\Resume_parser\Resume_parser\backend
pip install fastapi uvicorn pymupdf python-docx
```

### 2. Start the Service
```bash
python text_extractor.py
```

The service will start on **http://127.0.0.1:8001**

### 3. Test the Service
Visit: http://127.0.0.1:8001/health

You should see: `{"status":"ok","service":"text-extraction"}`

## API Endpoint

**POST** `/extract-text`

**Request**: multipart/form-data with `file` field

**Response**:
```json
{
  "text": "extracted text here...",
  "success": true,
  "filename": "resume.pdf",
  "pages": 2,
  "length": 5432
}
```

## Integration with Next.js

The Next.js API route at `/api/resume/analyze` now calls this service automatically.

**Both services must be running**:
- Python service: port 8001
- Next.js dev server: port 3000

## Troubleshooting

**Error: "PDF extraction service not running"**
- Start the Python service with `python text_extractor.py`

**Error: "No module named 'fitz'"**
- Install PyMuPDF: `pip install pymupdf`

**CORS errors**:
- The service is configured to allow requests from localhost:3000
