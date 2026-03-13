from datetime import datetime, timezone
from fastapi import FastAPI
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

class DomainCandidate(BaseModel):
    service: str
    domain: str
    lastSeen: str
    accountType: str = "Linked Service"
    messageCount: int = 1

class AnalyzeRequest(BaseModel):
    domains: List[DomainCandidate]

class ServiceInfo(BaseModel):
    service: str
    domain: str
    lastSeen: str
    accountType: str
    messageCount: int = 1
    status: Optional[str] = "Active"
    breached: Optional[bool] = False

def parse_iso_date(value: str) -> Optional[datetime]:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

def classify_status(last_seen: str) -> str:
    parsed = parse_iso_date(last_seen)
    if not parsed:
        return "Dormant"

    now = datetime.now(timezone.utc)
    delta_days = max((now - parsed.astimezone(timezone.utc)).days, 0)

    if delta_days > 365:
        return "Ghost"
    if delta_days > 180:
        return "Dormant"
    return "Active"

def normalize_service_name(domain: str) -> str:
    host = domain.lower().split(".")[0]
    return " ".join(part.capitalize() for part in host.replace("-", " ").replace("_", " ").split())

def candidate_to_service(candidate: DomainCandidate) -> ServiceInfo:
    return ServiceInfo(
        service=candidate.service or normalize_service_name(candidate.domain),
        domain=candidate.domain,
        lastSeen=candidate.lastSeen,
        accountType=candidate.accountType,
        messageCount=max(candidate.messageCount, 1),
        status=classify_status(candidate.lastSeen),
        breached=check_breach(candidate.domain),
    )

@app.get("/")
def read_root():
    return {"status": "online", "message": "GhostGuard Backend"}

@app.post("/analyze", response_model=List[ServiceInfo])
async def analyze_domains(data: AnalyzeRequest):
    default_results = [candidate_to_service(candidate) for candidate in data.domains]

    if not default_results:
        return []

    if not client:
        return default_results

    sanitized_payload = [
        {
            "domain": candidate.domain,
            "service": candidate.service,
            "lastSeen": candidate.lastSeen,
            "accountType": candidate.accountType,
            "messageCount": candidate.messageCount,
        }
        for candidate in data.domains
    ]

    prompt = f"""
    You are given sanitized service summaries derived from email metadata.
    Do not infer or request personal data.
    Return ONLY a JSON list with keys:
    "service", "domain", "lastSeen", "accountType", "messageCount", "status"

    Status rules:
    - Ghost: last activity more than 365 days ago
    - Dormant: last activity between 181 and 365 days ago
    - Active: last activity within 180 days

    Data:
    {json.dumps(sanitized_payload)}
    """

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text_content = response.text.strip()
        if "```json" in text_content:
            text_content = text_content.split("```json")[1].split("```")[0].strip()
        elif "```" in text_content:
            text_content = text_content.split("```")[1].split("```")[0].strip()

        results = json.loads(text_content)
        enriched_results = []
        for item in results:
            domain = item.get("domain", "")
            enriched_results.append(ServiceInfo(
                service=item.get("service") or normalize_service_name(domain),
                domain=domain,
                lastSeen=item.get("lastSeen", datetime.now(timezone.utc).date().isoformat()),
                accountType=item.get("accountType", "Linked Service"),
                messageCount=max(int(item.get("messageCount", 1)), 1),
                status=item.get("status") or classify_status(item.get("lastSeen", "")),
                breached=check_breach(domain),
            ))
        return enriched_results
    except Exception as e:
        print(f"Gemini error, falling back to deterministic analysis: {e}")
        return default_results

class DeletionRequest(BaseModel):
    service_name: str

@app.post("/generate-deletion-draft")
async def generate_draft(req: DeletionRequest):
    requester_line = "[Your Email]"
    mock_draft = f"To: privacy@{req.service_name.lower()}.com\nSubject: Data Deletion Request\n\nI am requesting deletion of my account and associated personal data under applicable privacy law. Please confirm receipt of this request and notify me once deletion is complete.\n\nAccount email: {requester_line}\n\nRegards,\n[Your Name]"

    if not client:
        return {"draft": mock_draft}

    prompt = f"Write a formal GDPR Article 17 / CCPA deletion request email to {req.service_name}. Include: data deletion, account removal, confirmation receipt request, and a placeholder requester email line using {requester_line}. Tone: professional."
    
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
