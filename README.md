# GhostGuard

GhostGuard is a privacy-first dashboard for identifying dormant services tied to a Gmail inbox and drafting deletion requests without persisting user data.

## Current MVP

- Google OAuth is used only to request temporary Gmail metadata access.
- Inbox scanning reads sender and date headers in the browser and sanitizes them into domains before anything is sent to the backend.
- The backend is stateless and enriches sanitized domain summaries with risk labels, breach flags, and deletion-draft text.
- `.eml` upload is supported for demo flows that should not require a live Google account.

## Architecture

- Frontend: React + TypeScript + Vite
- Backend: FastAPI
- Auth: Google OAuth token client
- Analysis contract: sanitized service domains only

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Optional environment variables:

- `GEMINI_API_KEY` for LLM-based service enrichment

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional environment variables:

- `VITE_GOOGLE_CLIENT_ID` for Gmail OAuth
- `VITE_API_BASE_URL` to override `http://localhost:8080`

## Privacy Model

- Stored data: none by design in the browser session or backend database
- Gmail access: sender metadata only for active scans
- Drafting: user-reviewed deletion text only, no automatic sending
