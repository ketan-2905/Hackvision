import fitz  # PyMuPDF
import docx
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file stream."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error parsing PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file stream."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error parsing DOCX: {str(e)}")

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Determines file type and extracts text accordingly."""
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX are supported.")
