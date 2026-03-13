# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- CSS-based custom UI

The frontend is responsible for:

- user interaction
- Gmail metadata requests
- local sanitization
- dashboard rendering

## Backend

- Python
- FastAPI

The backend is responsible for:

- receiving sanitized service candidates
- classifying activity status
- enriching service records
- generating deletion-request drafts

## Authentication and Data Access

- Google OAuth
- Gmail metadata access

OAuth is used instead of password-based access.

## Optional Intelligence Layer

- Gemini integration for service/draft enrichment

The app can still operate in a deterministic fallback mode without the LLM.

## Architecture Style

GhostGuard follows a privacy-first split:

- frontend handles sensitive parsing and sanitization
- backend stays stateless
- database storage is avoided in the MVP

## Why This Stack Fits

This stack is suitable because it is:

- fast to prototype
- easy to demo
- lightweight to deploy
- compatible with browser-based privacy controls
