from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from parser import extract_text
from llm_service import parse_resume_with_groq
from firebase_service import save_user_profile, upload_file_to_storage
from pydantic import BaseModel

app = FastAPI(title="Antigravity Resume Parser")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...), 
    user_id: str = Form("default_user") # Accept user_id as form data
):
    """
    Uploads a resume (PDF/DOCX), parses it, and saves structured data to Firestore.
    """
    # Validate file type
    filename = file.filename
    if not (filename.lower().endswith(".pdf") or filename.lower().endswith(".docx")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX allowed.")

    try:
        # Read file content
        file_content = await file.read()
        
        # 1. Extract Text (Local, No LLM)
        print(f"Extracting text from {filename}...")
        text = extract_text(file_content, filename)
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file.")

        # 2. Upload to Firebase Storage
        print(f"Uploading {filename} to Firebase Storage...")
        resume_url = upload_file_to_storage(file_content, filename, file.content_type)
        
        # 3. Parse with Groq (One Call)
        print("Parsing text with Groq...")
        parsed_data = parse_resume_with_groq(text)
        
        # Add resume URL to data
        if resume_url:
            parsed_data["resume_url"] = resume_url
        
        # 3. Save to Firestore (Preserving User Edits)
        print(f"Saving data for user: {user_id}...")
        save_user_profile(user_id, parsed_data)
        
        return {
            "status": "success",
            "message": "Resume parsed and saved successfully.",
            "data": parsed_data
        }

    except Exception as e:
        print(f"Error processing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

class ProfileUpdate(BaseModel):
    user_id: str
    data: dict



@app.post("/update-profile")
async def update_profile(update: ProfileUpdate):
    """
    Updates user profile data manually.
    """
    try:
        # We flag this data as coming from 'user' so it locks in the edits
        # The frontend should send the full object or partial. 
        # We need to ensure the 'source' is set to 'user' for these fields.
        
        # Helper to recursively set source='user' would be ideal, 
        # but for now we rely on the save_user_profile logic which we might need to tweak 
        # OR we just pass a flag to save_user_profile.
        
        # Actually, let's just modify the data before saving to enforce source='user'
        # This is a bit of a hack for the prototype.
        
        data = update.data
        
        # Mark top-level source if we had one, but we track at collection level.
        # We need to ensure that when we save, we explicitly set source='user'
        # Let's modify save_user_profile to accept a 'source' override or handle it here.
        
        # For this prototype, we will trust the frontend to send 'source': 'user' 
        # OR we update the save_user_profile to handle this.
        # Let's update save_user_profile in firebase_service.py to be more robust first?
        # No, let's just do it here for simplicity:
        
        # We will iterate and inject source='user' for the collections
        if "skills" in data:
            for cat, skills in data["skills"].items():
                # This is just a list of strings in the JSON schema
                # We need to change how we save it.
                pass 
                
        # Actually, the save_user_profile function logic:
        # if existing.get("source") == "user": continue
        # This prevents OVERWRITING user data with resume data.
        # But now we ARE the user. We want to overwrite everything.
        
        # So we need a mode in save_user_profile.
        
        save_user_profile(update.user_id, data, source="user")
        
        return {"status": "success", "message": "Profile updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
