# GhostGuard Project Critique & Analysis

## 1. Security & Privacy (Core Value Proposition)
- **OAuth Scopes:** The requirement for "read-only minimal scope" is excellent. However, the Gmail API `https://www.googleapis.com/auth/gmail.readonly` still provides access to full email bodies. To truly minimize access, we should investigate if metadata-only scopes (like `gmail.metadata`) are sufficient for extracting sender domains without body access.
- **Local Processing:** The "zero-persistence" architecture (browser-only state) is a strong trust signal. Using FastAPI as a stateless proxy for the LLM is a good approach, but we must ensure that the backend truly logs nothing (e.g., disabling default request logging for sensitive payloads).
- **Sanitization:** Sanitizing data before sending it to the LLM (removing names, specific email aliases, and keeping only domains) is critical. This should happen in the **frontend** before it even hits our backend.

## 2. Technical Feasibility
- **LLM for Header Parsing:** Gemini 1.5 Flash is highly capable of structured JSON output. The challenge will be the **volume of headers**. A typical user might have thousands of emails. Sending all of them to an LLM will be slow and expensive (even on free tiers).
    - *Improvement:* Perform initial regex/string parsing in the browser to deduplicate domains *before* LLM analysis.
- **HaveIBeenPwned API:** The free tier is quite limited and often requires an API key for specific account checks. For a "domain-wide" breach check, we might need to rely on their publicly available datasets or a different source if we want to stay entirely "free" without per-user keys.
- **Gmail API Limits:** Large-scale scanning of an inbox can trigger rate limits. We should implement pagination and "lazy loading" of the service list.

## 3. User Experience (UX)
- **Drafting vs. Sending:** The "Draft Deletion Email" approach is safer legally and technically than automated sending. Integrating with the Gmail `drafts.create` endpoint is the right way to keep the user in control.
- **"Ghost" Logic:** Defining "Ghost" as "no recent activity" is subjective. We need clear UI indicators of *when* the last email was received so the user can make an informed decision.
- **Disclaimer:** The legal nature of GDPR/CCPA requests means we need a robust disclaimer stating that GhostGuard is a tool, not a legal representative.

## 4. Architectural Risks
- **Statelessness vs. Large Datasets:** If the user has 500+ services, keeping all that in React state might get heavy. We should ensure the UI remains responsive (virtualized lists).
- **LLM Hallucinations:** The LLM might misidentify a domain (e.g., a newsletter vs. a service). We should allow users to "flag" or "ignore" incorrect categorizations.

## 5. Proposed Roadmap Adjustments
- **Phase 0 (Sanitization Layer):** Build a robust JS-based domain extractor to reduce LLM token usage.
- **Phase 1 (Gmail Metadata):** Prioritize `gmail.metadata` scope to prove we aren't reading bodies.
- **Phase 2 (Local Storage for UX):** Consider `sessionStorage` (which clears on tab close) for a better UX if the user accidentally refreshes, while staying true to the "no database" rule.
