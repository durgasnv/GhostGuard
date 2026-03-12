# Workflow

## End-to-End Product Workflow

### 1. User enters GhostGuard

The user lands on the application and sees the trust model:

- limited metadata access
- no email body reading in the intended flow
- no persistent user database
- manual review before deletion requests are sent

### 2. User chooses a scan path

GhostGuard currently supports:

- Gmail metadata scan
- `.eml` upload
- sample/demo scan

### 3. Metadata is collected locally

For Gmail:

- the frontend requests message metadata
- the frontend extracts fields such as `From` and `Date`

For `.eml`:

- the frontend parses the uploaded header block locally

### 4. Data is sanitized in the browser

The browser converts raw sender metadata into safer service-domain summaries such as:

- service name
- domain
- last seen timestamp
- account type
- signal count

This reduces privacy exposure before backend analysis.

### 5. Backend performs stateless analysis

The backend receives only sanitized service candidates and:

- classifies status as Active, Dormant, or Ghost
- flags known breached domains
- prepares structured service records for the dashboard

### 6. Dashboard shows results

The user sees a service ledger with the key findings and can identify which services deserve cleanup.

### 7. User generates deletion drafts

For selected services, GhostGuard creates deletion-request draft text.

The user remains responsible for final review and sending.

## Metadata Definition

In GhostGuard, metadata means descriptive email information rather than full email content.

GhostGuard currently relies on a narrow metadata subset:

- `From`
- `Date`

These fields help infer:

- which service sent the email
- how recently that service was active
- how often the service appears

GhostGuard intentionally avoids relying on:

- email body text
- attachments
- contact lists

## Why the Workflow Matters

The workflow is designed to balance utility and trust.

Instead of centralizing mailbox content, GhostGuard:

- processes sensitive data locally first
- limits what leaves the browser
- keeps the backend focused on service-level analysis
- keeps user action manual at the final stage
