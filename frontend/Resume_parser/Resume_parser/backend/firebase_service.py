import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
from datetime import datetime

# Initialize Firebase
# We check if app is already initialized to avoid errors during hot reloads or multiple imports
if not firebase_admin._apps:
    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    # Only initialize if credentials exist, otherwise we mock or warn
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'ascendra-89464.appspot.com'
        })
    else:
        print("WARNING: Firebase credentials not found at specified path. Firestore operations will fail.")

def get_db():
    if firebase_admin._apps:
        return firestore.client()
    return None

def upload_file_to_storage(file_content, filename, content_type):
    """
    Uploads a file to Firebase Storage and returns the public URL.
    """
    try:
        bucket = storage.bucket()
        # Create a unique filename to prevent overwrites (optional, but good practice)
        # For now, we use the original filename but in a 'resumes' folder
        blob = bucket.blob(f"resumes/{filename}")
        
        blob.upload_from_string(file_content, content_type=content_type)
        
        # Make the blob public (for prototype visibility)
        blob.make_public()
        
        return blob.public_url
    except Exception as e:
        print(f"Error uploading to storage: {e}")
        return None

def save_user_profile(user_id: str, data: dict, source: str = "resume"):
    """
    Saves parsed resume data to Firestore, respecting user edits.
    If source is 'user', it forces updates and sets source='user'.
    """
    db = get_db()
    if not db:
        print("Firestore not initialized, skipping save.")
        return

    user_ref = db.collection("users").document(user_id)
    
    # 1. Personal Info (Main Doc)
    personal_info = data.get("personal_info", {})
    user_doc_data = {
        "full_name": personal_info.get("full_name"),
        "email": personal_info.get("email"),
        "phone": personal_info.get("phone"),
        "location": personal_info.get("location"),
        "professional_summary": data.get("professional_summary"),
        "resume_url": data.get("resume_url"),
        "updated_at": firestore.SERVER_TIMESTAMP
    }
    user_ref.set(user_doc_data, merge=True)

    # 2. Skills
    skills_ref = user_ref.collection("skills")
    for category, skill_list in data.get("skills", {}).items():
        if not skill_list: continue
        for skill_name in skill_list:
            skill_id = skill_name.lower().strip().replace(" ", "_").replace(".", "-").replace("/", "-")
            
            skill_data = {
                "name": skill_name,
                "category": category,
                "confidence": 1.0, 
                "source": source,
                "active": True,
                "last_updated": firestore.SERVER_TIMESTAMP
            }
            
            doc_ref = skills_ref.document(skill_id)
            
            # Logic: 
            # If source == "user", we always update (overwrite).
            # If source == "resume", we check if existing is "user".
            
            if source == "resume":
                doc = doc_ref.get()
                if doc.exists:
                    existing = doc.to_dict()
                    if existing.get("source") == "user":
                        continue
            
            doc_ref.set(skill_data, merge=True)

    # 3. Projects
    projects_ref = user_ref.collection("projects")
    for project in data.get("projects", []):
        title = project.get("title", "Untitled")
        project_id = title.lower().strip().replace(" ", "_")[:50]
        
        project_data = {
            "title": title,
            "summary": project.get("summary"),
            "tech_stack": project.get("tech_stack"),
            "source": source,
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = projects_ref.document(project_id)
        
        if source == "resume":
            doc = doc_ref.get()
            if doc.exists:
                existing = doc.to_dict()
                if existing.get("source") == "user":
                    continue
        
        doc_ref.set(project_data, merge=True)

    # 4. Experience
    experience_ref = user_ref.collection("experience")
    for exp in data.get("experience", []):
        company = exp.get("company", "Unknown")
        role = exp.get("role", "Unknown")
        exp_id = f"{company}_{role}".lower().strip().replace(" ", "_")[:50]
        
        exp_data = {
            "role": role,
            "company": company,
            "duration": exp.get("duration"),
            "responsibilities": exp.get("responsibilities"),
            "source": source
        }
        
        doc_ref = experience_ref.document(exp_id)
        
        if source == "resume":
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("source") == "user":
                continue
            
        doc_ref.set(exp_data, merge=True)

    # 5. Education
    education_ref = user_ref.collection("education")
    for edu in data.get("education", []):
        institution = edu.get("institution", "Unknown")
        degree = edu.get("degree", "Unknown")
        edu_id = f"{institution}_{degree}".lower().strip().replace(" ", "_")[:50]
        
        edu_data = {
            "institution": institution,
            "degree": degree,
            "field_of_study": edu.get("field_of_study"),
            "year": edu.get("year"),
            "source": source
        }
        
        doc_ref = education_ref.document(edu_id)
        
        if source == "resume":
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("source") == "user":
                continue
            
        doc_ref.set(edu_data, merge=True)
