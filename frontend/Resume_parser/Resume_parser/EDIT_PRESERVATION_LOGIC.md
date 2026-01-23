# Edit Preservation Logic

## Overview
The system ensures that user-made edits to their profile are **never** overwritten by subsequent resume parsings. This is achieved by tracking the `source` of each data field or collection item in Firebase Firestore.

## Data Model Strategy

Each document in the sub-collections (`skills`, `projects`, `experience`, `education`) has a `source` field.

- `source: "resume"`: The data came from the automated parser.
- `source: "user"`: The data was manually edited or created by the user.

## Logic Flow

When a new resume is uploaded:

1. **Text Extraction**: The resume is converted to plain text.
2. **Parsing**: The LLM extracts structured data (Skills, Projects, etc.).
3. **Database Update (The Guardrail)**:
   - The backend iterates through the extracted items.
   - For each item (e.g., a Skill "Python"):
     - It checks if a document with that ID already exists in Firestore.
     - **IF** it exists **AND** `source == "user"`:
       - **ACTION**: SKIP update. The user's version is preserved.
     - **ELSE** (It doesn't exist OR `source == "resume"`):
       - **ACTION**: OVERWRITE/CREATE. The parser's version is saved.

## Example Scenario

1. **Initial Upload**: 
   - Parser finds "Python". 
   - Saved to Firestore: `{ name: "Python", confidence: 1.0, source: "resume" }`.

2. **User Edit**: 
   - User changes "Python" confidence to `5.0` (Expert).
   - Frontend updates Firestore: `{ name: "Python", confidence: 5.0, source: "user" }`.

3. **Re-upload Resume**:
   - Parser finds "Python" again (confidence 1.0).
   - Backend checks Firestore for "Python".
   - Finds `source: "user"`.
   - **Result**: The update is ignored. "Python" remains at confidence `5.0`.

## Implementation Details

- **Skills**: ID is normalized (lowercase, underscores).
- **Projects**: ID is normalized title.
- **Experience/Education**: ID is composite key (Company_Role / Institution_Degree).
- **Personal Info**: Currently updated on every parse (Phase 1 simplification), but can be extended to field-level tracking if needed.
