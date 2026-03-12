# Features

## Current MVP Features

### 1. Gmail Metadata Scan

GhostGuard can connect to Gmail using OAuth and scan limited email metadata such as sender and date fields.

This allows the app to infer likely services tied to the inbox without relying on full email body access.

### 2. `.eml` Upload Fallback

For demo or fallback use cases, GhostGuard supports `.eml` file upload.

This allows the system to parse email headers locally when live Gmail access is unavailable or inconvenient.

### 3. Sample Scan Mode

GhostGuard includes a sample/demo mode for judges, demos, and local testing.

This is useful when:

- Gmail OAuth is not configured
- the user does not want to connect a real inbox
- a fast demo path is needed

### 4. Local Sanitization

GhostGuard extracts and sanitizes service-level signals in the browser before sending analysis requests to the backend.

The backend receives only reduced service summaries instead of raw mailbox content.

### 5. Service Exposure Ledger

The dashboard displays:

- service name
- domain
- last seen activity
- account type
- signal count
- risk status
- breach flag

### 6. Ghost Account Classification

GhostGuard classifies discovered services into:

- Active
- Dormant
- Ghost

This helps users focus on the most likely forgotten accounts first.

### 7. Breach Awareness

GhostGuard can flag known breached domains so the user can prioritize higher-risk services.

### 8. Deletion Draft Generation

The system generates deletion-request drafts that the user can review, copy, and send manually.

The workflow is intentionally draft-first rather than auto-send.
