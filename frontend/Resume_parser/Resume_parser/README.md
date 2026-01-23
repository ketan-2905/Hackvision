# Antigravity Resume Parser

A high-performance, AI-powered ATS resume parser that extracts structured data from PDF/DOCX resumes and auto-fills an editable user profile.

## Features

- **Fast Parsing**: Uses local text extraction + Groq Llama 3 for speed.
- **Smart Extraction**: Normalizes skills, extracts projects, experience, and education.
- **Edit Preservation**: User edits are stored in Firebase and NEVER overwritten by future parses.
- **Modern UI**: Dark mode, glassmorphism, and responsive design.

## Setup

### Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure Environment:
   - Rename `.env` (if needed) and fill in:
     - `GROQ_API_KEY`: Your Groq API Key.
     - `FIREBASE_CREDENTIALS_PATH`: Path to your Firebase Admin SDK JSON.

4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Architecture

- **Frontend**: React, Vite, CSS Modules (Glassmorphism).
- **Backend**: FastAPI, PyMuPDF, Python-Docx.
- **AI**: Groq API (Llama 3 70B).
- **Database**: Firebase Firestore.

## Edit Preservation Logic

See [EDIT_PRESERVATION_LOGIC.md](./EDIT_PRESERVATION_LOGIC.md) for details on how we ensure user data is protected.
