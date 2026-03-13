# GhostGuard Project Workflow

## Overview

GhostGuard is a privacy-first tool for discovering likely service accounts linked to a user's inbox, identifying stale or risky accounts, and helping the user draft deletion requests.

The core design principle is simple:

- do as much sensitive processing as possible in the browser
- send only sanitized summaries to the backend
- keep the backend stateless
- let the user stay in control of final actions

For usability, the current tab session is preserved across refresh using browser `sessionStorage`, but GhostGuard still avoids long-term account persistence or a user database.

GhostGuard is meant to answer these questions:

1. Which services are still tied to my inbox?
2. Which of those services look inactive or forgotten?
3. Which of them may deserve urgent attention because of breach history?
4. How do I begin removing my data from those services?

## End-to-End Workflow

## What Email Metadata Means in GhostGuard

In this project, "metadata" means descriptive information about an email rather than the full email content itself.

Metadata helps identify where a message came from and when it was sent without requiring the app to read the body text.

### Metadata currently used by GhostGuard

For the current workflow, GhostGuard is focused on a small subset of email metadata:

- `From`: the sender address or sender identity
- `Date`: when the email was sent

These two fields are enough for the MVP to:

- identify likely service domains
- estimate last-seen activity
- count how often a domain appears

### What metadata can include more generally

Depending on the email provider or API, metadata can include fields such as:

- `From`
- `To`
- `Cc`
- `Bcc`
- `Date`
- `Subject`
- `Reply-To`
- message ID
- thread ID
- labels or categories
- routing headers

Not all of these are required for GhostGuard.

### What GhostGuard is intentionally not using in the current design

GhostGuard does not need to use:

- email body text
- attachments
- contact lists
- full message content

It also avoids sending raw mailbox content to the backend as part of the intended privacy-first flow.

### Why metadata is safer than full-content access

Metadata still carries some sensitivity, but it is significantly less invasive than full email access.

Using metadata instead of message bodies helps GhostGuard:

- reduce privacy exposure
- avoid unnecessary personal content access
- stay aligned with the product's trust model
- extract service signals with less risk

### Important limitation

Metadata is safer, but it is not completely risk-free.

For example:

- sender fields may still contain personal names or aliases
- some headers may still reveal behavioral patterns
- broad metadata access can still feel sensitive to users

That is why GhostGuard adds a second protection layer: browser-side sanitization before backend analysis.

### 1. User opens the application

The user lands on the GhostGuard homepage and is introduced to the trust model:

- only sender metadata is accessed
- email bodies and attachments are not read
- no user database is maintained
- the tool generates drafts instead of sending messages automatically

This is important because the product is built around trust before automation.

### 2. User chooses a scan mode

GhostGuard currently supports three scan paths:

- Gmail metadata scan
- sample/demo scan

#### Gmail metadata scan

The user connects a Gmail account using Google OAuth.

GhostGuard requests Gmail cleanup access for the current session. The goal is to fetch message metadata such as:

- `From`
- `Date`

For inbox cleanup features, the app can also inspect message previews and move explicitly selected emails to Trash.

#### Sample/demo scan

This is used for demos, judging, testing, and product walkthroughs without requiring a real mailbox connection.

### 3. Local metadata extraction happens in the browser

Once a scan begins, GhostGuard processes raw mail metadata inside the frontend.

For Gmail:

- the frontend fetches recent message IDs
- the frontend fetches metadata headers for those messages
- the frontend extracts sender and date information

At this point, GhostGuard starts converting raw mail headers into sanitized service candidates.

### 4. Sanitization layer reduces sensitive data

This is the most important part of the privacy model.

GhostGuard does not need to send raw mailbox content to the backend. Instead, it reduces the data into a safer structure such as:

- service name
- domain
- last seen date
- account type guess
- number of signals/messages

Example:

Instead of sending:

- full sender string
- personal aliases
- message content

GhostGuard sends something closer to:

```json
{
  "service": "Dropbox",
  "domain": "dropbox.com",
  "lastSeen": "2024-01-15T00:00:00.000Z",
  "accountType": "Storage",
  "messageCount": 2
}
```

This keeps the backend focused on service-level analysis rather than personal inbox data.

GhostGuard also separates personal contacts from service domains. Public email-provider senders are categorized into a personal-contact list so they are not mixed into service risk analysis.

### 5. Backend analysis receives sanitized domain summaries

The backend is designed to be stateless.

It receives only the sanitized service candidates and performs analysis such as:

- classify status as `Active`, `Dormant`, or `Ghost`
- check whether a domain appears in a known breach list
- prepare a structured service record for the dashboard

If an LLM is configured, the backend can optionally enrich the result further.

If not, GhostGuard still works with deterministic rules and mock breach knowledge.

### 6. Dashboard presents the exposure ledger

The frontend receives structured analysis results and displays them in the dashboard.

The dashboard shows:

- service name
- domain
- account type
- last seen activity
- number of signals
- status classification
- breach flag
- confidence score
- classification reason
- user review state

This gives the user a prioritized view of likely ghost accounts and risky services.

The dashboard also supports:

- sorting by risk, recency, signals, or confidence
- hiding noisy services from the current review list
- batch selection for multi-service cleanup
- batch Gmail cleanup across selected services
- a separate personal-contacts section
- plain-language reasons for each final classification
- CSV export of the current ledger
- a focused needs-review queue

### 7. User generates deletion-request drafts

For any identified service, GhostGuard can generate a deletion-request draft.

The output is draft-only. The system does not automatically send emails on the user's behalf.

This matters for safety, legal clarity, and user control.

The draft can include:

- deletion request language
- account removal request
- confirmation request
- a placeholder account email line for the user to fill in manually

Users can also generate batch draft output for multiple selected services at once.

### 8. User reviews and acts manually

The user remains the final decision-maker.

GhostGuard helps with:

- discovery
- organization
- prioritization
- drafting

GhostGuard does not currently automate irreversible actions against external services.

For inbox cleanup, GhostGuard supports moving explicitly selected emails to Trash inside Gmail, but this action remains user-initiated and review-based.

## How the Classification Works

The current classification logic is based mainly on recency:

- `Active`: recent activity
- `Dormant`: some activity, but not recent
- `Ghost`: no meaningful recent activity

In the current implementation, this is determined from the `lastSeen` timestamp:

- more than 365 days ago -> `Ghost`
- 181 to 365 days ago -> `Dormant`
- within 180 days -> `Active`

This is a reasonable MVP rule, but not a perfect one.

## Is GhostGuard Safe?

### What makes it safer than a naive solution

GhostGuard is safer than a typical inbox-analysis tool because of these architectural choices:

- metadata-first approach
- browser-side parsing and sanitization
- no database by default
- stateless backend design
- draft-only deletion workflow
- no password handling
- OAuth-based access instead of direct credential entry

### What GhostGuard does not currently do

GhostGuard does not currently:

- store a persistent user account database
- auto-send deletion requests
- read full email bodies as part of the main intended workflow
- act as a legal proxy or guaranteed compliance tool

### Safety summary

GhostGuard is comparatively safe for an MVP because it minimizes data movement and preserves user control.

However, "safe" does not mean "risk-free." It still depends on:

- correct OAuth configuration
- careful frontend sanitization
- honest backend behavior
- clear user communication

## Current Strengths

### 1. Strong privacy narrative

The architecture aligns well with the project's promise of trust and minimal access.

### 2. Useful real-world problem

Forgotten accounts and stale digital exposure are real user problems with clear relevance.

### 3. Clear product action

GhostGuard does not stop at detection. It helps the user move toward deletion and cleanup.

### 4. Good demo potential

The sample scan, dashboard, and deletion draft flow make the product easy to present.

## Current Limitations and Cons

### 1. Gmail OAuth friction

The Gmail integration is the biggest practical friction point.

Problems:

- Google may flag the app as unverified
- Gmail scopes are sensitive or restricted
- setup is harder than normal Google sign-in
- test-user configuration can be confusing

Why this matters:

Even if the app logic is correct, users may struggle before they ever reach the scan stage.

### 2. Scan coverage is limited

The current Gmail flow samples only a limited set of recent messages.

Problems:

- older ghost accounts may be missed
- inbox coverage is incomplete
- results may underrepresent the user's true exposure

### 3. Service detection is heuristic

GhostGuard infers services from sender domains.

Problems:

- newsletters may be mistaken for accounts
- transactional senders may be noisy
- some services use third-party email providers
- one domain does not always equal one user account

### 4. Breach data is shallow in the MVP

The current implementation uses a small known-breach set.

Problems:

- limited coverage
- not real-time
- insufficient for production-grade risk scoring

### 5. Classification can be wrong

Recency alone is not enough to reliably distinguish:

- active but low-frequency accounts
- dormant accounts
- true ghost accounts

### 6. Legal/operational ambiguity

Deletion-request generation is useful, but real compliance outcomes vary by company and jurisdiction.

Problems:

- some services ignore informal requests
- privacy laws differ by location
- draft language may need company-specific or region-specific changes

## How We Can Reduce These Problems

### 1. Improve Gmail integration

What to do:

- use a properly configured Google Cloud project
- add test users during development
- keep Gmail scan marked as beta until verified
- maintain sample/demo mode as a reliable fallback

Longer term:

- complete Google verification if the product moves toward public deployment

### 2. Add paginated inbox scanning

What to do:

- scan across more pages of Gmail results
- show progress status
- allow cancellation
- deduplicate domains as pages are processed

Benefit:

This would make the audit much more complete and useful.

### 3. Strengthen local service inference

What to do:

- improve sender parsing rules
- distinguish transactional mail from marketing mail
- build a better domain-to-service mapping layer
- add ignore/confirm controls in the dashboard

Benefit:

This would reduce false positives and improve trust in the output.

### 4. Deepen breach intelligence

What to do:

- integrate a more reliable breach data source
- add breach date and severity
- rank services by combined inactivity plus breach risk

Benefit:

This would make prioritization much stronger.

### 5. Make the deletion workflow more practical

What to do:

- support copying drafts faster
- support mailto links
- add company-specific deletion contact suggestions
- track which requests the user has already reviewed

Benefit:

This improves usability without removing user control.

### 6. Keep the trust model explicit

What to do:

- clearly show requested permissions
- explain what leaves the browser
- explain what is never stored
- provide an open-source code link

Benefit:

This strengthens adoption and reduces user hesitation.

## What Could Be Done Next

### Near-term improvements

- full Gmail pagination
- clearer error reporting
- richer domain classification
- more realistic breach intelligence
- export/share summary report

### Medium-term improvements

- draft history in session memory
- ignore list for false positives
- confidence scoring
- service-category filters
- company-specific deletion workflows

### Long-term product opportunities

- support Apple-linked or Microsoft-linked account traces
- privacy broker detection
- stale SaaS cleanup for teams
- enterprise employee exposure reduction
- privacy operations dashboard for repeated audits

## Recommended Product Positioning

GhostGuard should be positioned as:

- a privacy audit assistant
- a ghost-account discovery tool
- a deletion-request drafting workflow

GhostGuard should not be over-positioned as:

- full legal automation
- full breach intelligence platform
- guaranteed account deletion engine
- universal deep-web identity scanner

Keeping the positioning honest will improve credibility.

## Final Summary

GhostGuard works by:

1. collecting limited inbox metadata
2. sanitizing it in the browser
3. sending only service-level summaries to a stateless backend
4. classifying likely stale services
5. flagging risky domains
6. helping the user generate deletion-request drafts

Its biggest strengths are:

- privacy-aware architecture
- strong demo value
- clear user benefit

Its main weaknesses are:

- Gmail OAuth friction
- incomplete scan coverage
- heuristic service detection
- limited breach intelligence

These weaknesses can be improved through:

- better scan depth
- stronger service inference
- better breach sources
- clearer UX
- production-grade OAuth setup

In short, GhostGuard is a strong privacy-first MVP with a clear real-world use case and a practical path to becoming much more capable.
