import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
# Ensure GROQ_API_KEY is set in .env
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

RESUME_SCHEMA = """
{
  "personal_info": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "professional_summary": "",
  "skills": {
    "technical": [],
    "soft": [],
    "tools_frameworks": []
  },
  "education": [
    {
      "degree": "",
      "field_of_study": "",
      "institution": "",
      "year": ""
    }
  ],
  "experience": [
    {
      "role": "",
      "company": "",
      "duration": "",
      "responsibilities": []
    }
  ],
  "projects": [
    {
      "title": "",
      "summary": "",
      "tech_stack": []
    }
  ],
  "certifications": []
}
"""

SYSTEM_PROMPT = f"""
You are an advanced ATS resume parser. Your job is to extract structured data from resume text.
You must output STRICT JSON matching the following schema exactly:
{RESUME_SCHEMA}

RULES:
- Resume input is PLAIN TEXT.
- Section names may vary ("Tech Stack" -> SKILLS).
- Normalize aliases (ML -> Machine Learning, JS -> JavaScript).
- Infer skills conservatively.
- If data is missing, return null or empty arrays [].
- NEVER hallucinate.
- Output MUST be valid JSON.
- NO markdown, NO comments, NO explanations.
"""

def parse_resume_with_groq(resume_text: str):
    """
    Parses resume text using Groq API and returns structured JSON.
    """
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse this resume:\n\n{resume_text}"}
            ],
            model="llama-3.3-70b-versatile", 
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        parsed_data = json.loads(content)
        return parsed_data
    except json.JSONDecodeError:
        # Basic retry logic could go here, for now we raise
        raise ValueError("LLM did not return valid JSON.")
    except Exception as e:
        print(f"Error parsing resume with Groq: {e}")
        raise e
