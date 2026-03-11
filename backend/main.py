from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = FastAPI(title="GhostGuard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")

# Mock breach data for demo
KNOWN_BREACHES = {
    "dropbox.com": "2012-08-31",
    "canva.com": "2019-05-24",
    "linkedin.com": "2021-06-22",
    "adobe.com": "2013-10-04",
    "myspace.com": "2016-05-31"
}

def check_breach(domain: str) -> bool:
    return domain.lower() in KNOWN_BREACHES

class HeaderData(BaseModel):
    headers: List[str]

class ServiceInfo(BaseModel):
    service: str
    domain: str
    lastSeen: str
    accountType: str
    status: Optional[str] = "Active"
    breached: Optional[bool] = False

@app.get("/")
def read_root():
    return {"status": "online", "message": "GhostGuard Backend"}

@app.post("/analyze", response_model=List[ServiceInfo])
async def analyze_headers(data: HeaderData):
    # Mock data to always fallback to for demo stability
    mock_results = [
        ServiceInfo(service="Netflix", domain="netflix.com", lastSeen="2024-03-01", accountType="Subscription", status="Active"),
        ServiceInfo(service="Dropbox", domain="dropbox.com", lastSeen="2022-01-15", accountType="Storage", status="Ghost"),
        ServiceInfo(service="LinkedIn", domain="linkedin.com", lastSeen="2023-05-10", accountType="Professional", status="Dormant"),
        ServiceInfo(service="Canva", domain="canva.com", lastSeen="2023-11-20", accountType="Design", status="Active"),
    ]
    for item in mock_results:
        item.breached = check_breach(item.domain)

    if not client:
        return mock_results

    prompt = f"""
    Extract the sender domain, service name, and account type from these email headers. 
    Analyze the frequency and recency to determine if the account is 'Active', 'Dormant', or 'Ghost'.
    'Ghost' means signed up but no recent activity (e.g., last email > 1 year ago).
    'Dormant' means between 6 months and 1 year.
    'Active' means < 6 months.
    
    Headers:
    {json.dumps(data.headers[:20])} 

    Return ONLY a JSON list of objects with the following keys:
    "service", "domain", "lastSeen", "accountType", "status"
    """

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text_content = response.text.strip()
        # Basic cleanup if Gemini wraps in markdown
        if "```json" in text_content:
            text_content = text_content.split("```json")[1].split("```")[0].strip()
        elif "```" in text_content:
            text_content = text_content.split("```")[1].split("```")[0].strip()
        
        results = json.loads(text_content)
        # Add breach info
        for item in results:
            item["breached"] = check_breach(item.get("domain", ""))
            
        return results
    except Exception as e:
        print(f"Gemini error, falling back to mock: {e}")
        return mock_results

class DeletionRequest(BaseModel):
    service_name: str
    user_email: str

@app.post("/generate-deletion-draft")
async def generate_draft(req: DeletionRequest):
    mock_draft = f"To: privacy@{req.service_name.lower()}.com\nSubject: GDPR Data Deletion Request\n\nI am writing to request the deletion of my account and all associated personal data under GDPR Article 17. Please confirm once my request has been processed.\n\nRegards,\n[Your Name]"

    if not client:
        return {"draft": mock_draft}

    prompt = f"Write a formal GDPR Article 17 / CCPA deletion request email to {req.service_name} for the user {req.user_email}. Include: data deletion, account removal, and confirmation receipt request. Tone: professional."
    
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return {"draft": response.text}
    except Exception as e:
        print(f"Gemini error, falling back to mock: {e}")
        return {"draft": mock_draft}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
