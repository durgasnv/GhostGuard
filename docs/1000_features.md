# Features

## Current MVP Features

### 1. Gmail Metadata Scan

GhostGuard can connect to Gmail using OAuth and scan limited email metadata such as sender and date fields.

This allows the app to infer likely services tied to the inbox without relying on full email body access.

### 2. Sample Scan Mode

GhostGuard includes a sample/demo mode for judges, demos, and local testing.

This is useful when:

- Gmail OAuth is not configured
- the user does not want to connect a real inbox
- a fast demo path is needed

### 3. Local Sanitization

GhostGuard extracts and sanitizes service-level signals in the browser before sending analysis requests to the backend.

The backend receives only reduced service summaries instead of raw mailbox content.

### 4. Service Exposure Ledger

The dashboard displays:

- service name
- domain
- last seen activity
- account type
- signal count
- risk status
- breach flag

### 5. Ghost Account Classification

GhostGuard classifies discovered services into:

- Active
- Dormant
- Ghost

This helps users focus on the most likely forgotten accounts first.

### 6. Breach Awareness

GhostGuard can flag known breached domains so the user can prioritize higher-risk services.

### 7. Personal Contact Separation

GhostGuard now separates public-email-provider contacts from service accounts.

Examples include:

- Gmail contacts
- Yahoo contacts
- Outlook contacts

These are shown in a separate personal-contacts section so they are not misclassified as services.

### 8. User Review and Confidence

Users can refine the system output by marking a service as:

- Still Use
- Not Using
- Unsure

GhostGuard combines inbox evidence with user confirmation and shows a confidence score plus a short explanation for the final status.

### 9. Sorting and Prioritization

The exposure ledger can now be sorted by:

- highest risk
- most recent signal
- oldest signal
- most signals
- highest confidence

This helps users focus on the most urgent cleanup items first.

### 10. Inbox Cleanup

Users can open service-related Gmail messages directly inside the dashboard and move selected emails to Trash.

The dashboard also supports a batch `Delete Selected` action that moves matching Gmail messages for multiple selected services to Trash in one run.

This helps reduce inbox clutter while reviewing stale services.

### 11. Deletion Draft Generation

The system generates deletion-request drafts with a placeholder account-email line that the user can fill in before sending.

The workflow is intentionally draft-first rather than auto-send.

### 12. Batch Cleanup Controls

The dashboard now supports practical multi-item cleanup workflows such as:

- selecting multiple services
- generating multiple deletion drafts in one batch
- trashing matching Gmail messages for multiple selected services
- hiding noisy services from the active review list

This makes GhostGuard more useful for larger audits.

### 13. Review Queue and Export

GhostGuard now includes a few lightweight workflow features that make the audit easier to finish:

- a `Needs Review` queue for breached, unreviewed, or low-confidence services
- CSV export for the visible service ledger
