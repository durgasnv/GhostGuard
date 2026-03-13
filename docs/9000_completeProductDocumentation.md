# Complete Product Documentation

## Overview

GhostGuard is a privacy-first inbox-audit tool that helps users identify likely forgotten service accounts, review risky or dormant services, clean up related inbox messages, and generate deletion-request drafts.

The system is designed around three principles:

- use Gmail metadata instead of full email content wherever possible
- sanitize mailbox-derived information in the browser before backend analysis
- keep the user in control of all final actions

GhostGuard is not a full forensic account tracker. It is a practical review-and-cleanup workflow for dormant, ghost, or risky service accounts connected to an email inbox.

## What the Product Does

GhostGuard helps a user answer these questions:

1. Which services are still tied to my inbox?
2. Which of those services look active, dormant, or ghost-like?
3. Which services may deserve faster attention because of breach history?
4. Which inbox messages related to those services can be cleaned up?
5. How can I draft a deletion request for services I no longer use?

## Current Major Features

### 1. Gmail Scan

GhostGuard connects to Gmail through Google OAuth and scans limited message metadata.

The current scan focuses on:

- sender information
- date information

This lets the system identify likely service domains without depending on full email body content for the main scan flow.

### 2. Sample Scan Mode

GhostGuard includes a sample/demo path so the app can still be presented or tested when live Gmail access is unavailable or inconvenient.

This is especially useful for:

- demos
- judging
- local testing
- fallback presentation flow

### 3. Local Sanitization

Raw Gmail-derived information is processed in the frontend first.

The browser converts inbox-derived information into sanitized service summaries such as:

- service name
- domain
- last seen date
- account type
- number of detected signals

Only these summaries are sent to the backend.

### 4. Service Classification

The backend classifies services into:

- `Active`
- `Dormant`
- `Ghost`

This classification is based on inbox recency heuristics and optional backend enrichment.

### 5. Personal Contact Separation

GhostGuard separates public email-provider contacts from service accounts.

Examples:

- Gmail contacts
- Outlook contacts
- Yahoo contacts

These are shown separately so they are not misclassified as external services.

### 6. User Review Controls

For each service, the user can refine the result by marking it as:

- `Still Use`
- `Not Using`
- `Unsure`

This makes the classification more defensible because the final result is not based on inbox evidence alone.

### 7. Confidence Score

Each service includes a confidence score and label such as:

- `High`
- `Medium`
- `Low`

This helps the user understand how certain GhostGuard is about the result.

### 8. Reason for Classification

GhostGuard explains why a service has its current final label.

Example explanations:

- old inbox evidence and weak recent activity
- user confirmed the account is no longer used
- recent signals suggest continued relevance

### 9. Sorting and Filtering

The dashboard supports:

- filter by all
- filter by ghost
- filter by breached
- filter by reviewed
- filter by unreviewed

Sorting supports:

- highest risk
- most recent
- oldest signal
- most signals
- highest confidence

### 10. Multi-Select Batch Actions

Users can select multiple services and perform batch actions such as:

- draft selected
- delete selected
- hide selected
- export visible

This makes the app more useful for larger inbox audits.

### 11. Single-Service Gmail Cleanup

Users can open a specific service and view matched Gmail messages for that domain.

From there, they can:

- preview matched emails
- select individual emails
- move them to Trash

### 12. Batch Gmail Cleanup

GhostGuard can now move matching Gmail messages to Trash across multiple selected services.

This is done through the Gmail cleanup flow using the granted Gmail scope.

### 13. Deletion Draft Generation

GhostGuard generates deletion-request drafts for identified services.

The system keeps this flow draft-only, meaning:

- the user reviews the text
- the user decides whether to send it
- the app does not automatically contact the service

### 14. Review Queue

GhostGuard includes a focused `Needs Review` section for services that are:

- breached
- unreviewed
- lower confidence

This helps the user prioritize attention.

### 15. CSV Export

The user can export the current visible service ledger as a CSV file.

This helps with:

- record keeping
- later review
- reporting
- sharing findings with teammates

### 16. Session Persistence Across Refresh

GhostGuard now preserves the current session state across refresh within the same browser tab session.

This includes:

- Gmail auth session for the current tab session
- scanned services
- personal contacts
- review decisions
- hidden services
- selected filters and sort state

This improves usability and demo reliability while still avoiding long-term persistence.

## Step-by-Step User Process

### Step 1. Open GhostGuard

The user lands on the homepage and sees the trust model:

- limited Gmail access
- privacy-first design
- draft-first cleanup workflow

### Step 2. Connect Gmail

The user signs in with Google and grants Gmail cleanup access for the current session.

GhostGuard uses that session to:

- scan Gmail metadata
- fetch service-related message previews when needed
- move selected messages to Trash

### Step 3. Start the Scan

The user clicks `Scan Gmail`.

GhostGuard then:

1. requests a recent list of Gmail messages
2. fetches message metadata
3. extracts sender and date information
4. derives service domains locally

### Step 4. Sanitize the Data

Before backend analysis, the frontend converts raw inbox-derived information into service-level summaries.

This reduces privacy exposure because the backend does not receive raw inbox content.

### Step 5. Analyze the Services

The backend receives sanitized summaries and returns service records that include:

- service name
- domain
- last seen
- message count
- status
- breach flag

### Step 6. Review the Dashboard

The user sees:

- service ledger
- summary cards
- personal contacts
- confidence values
- classification reasons
- breach indicators

### Step 7. Refine the Results

The user can review each service and mark it:

- still use
- not using
- unsure

This changes the final classification and confidence presentation.

### Step 8. Prioritize Cleanup

The user can:

- filter the list
- sort by risk or recency
- focus on the `Needs Review` section
- hide noisy entries

### Step 9. Clean Related Gmail Messages

The user can either:

- open a service and trash selected matching emails
- select multiple services and use `Delete Selected`

### Step 10. Generate Deletion Drafts

The user can:

- generate a draft for one service
- generate drafts for multiple selected services

These drafts remain editable and manual.

### Step 11. Export Findings

The user can export the visible ledger as CSV for later use.

## Full Workflow Architecture

The current GhostGuard workflow is:

1. Gmail OAuth authentication
2. Gmail metadata fetch in the frontend
3. local extraction of sender/date information
4. browser-side sanitization into service summaries
5. backend analysis of sanitized service records
6. dashboard rendering
7. user review and prioritization
8. Gmail cleanup actions
9. deletion-draft generation
10. optional export

## How the Classification Works

GhostGuard does not claim certainty from metadata alone.

Instead, the final classification is a combination of:

- inbox recency
- service presence frequency
- breach signal
- user confirmation

### Signal Status

This is the system-inferred status based on inbox-derived evidence.

### Final Status

This is the result after combining system inference with user review.

### Confidence

Confidence reflects how strong the current conclusion is based on:

- review confirmation
- age of inbox evidence
- ambiguity of the current signal set

## Safety Model

GhostGuard is privacy-minimizing, not privacy-free.

The system is designed to reduce risk by:

- avoiding full body scanning in the main analysis flow
- sanitizing mailbox information in the browser
- keeping the backend stateless
- avoiding automatic outbound deletion requests
- limiting persistence to browser `sessionStorage` for the current tab session

## What Is Stored

GhostGuard does not use a persistent backend user database in the MVP.

The app currently stores session-only information in browser `sessionStorage` so refreshes do not wipe the current tab session.

This includes:

- current auth session
- dashboard state
- review state
- filter state

This data is not intended as permanent storage.

## Product Strengths

GhostGuard is strong because it combines:

- a real user problem
- a privacy-first trust model
- practical inbox cleanup
- review-based classification
- actionable output instead of passive analytics

## Current Limitations

### 1. Gmail OAuth Friction

Google warns about restricted Gmail scopes during testing.

### 2. Limited Inbox Coverage

The current scan still samples a recent portion of the inbox rather than a full historical audit.

### 3. Heuristic Classification

Inbox evidence does not prove real-time website usage.

### 4. Restricted Public Rollout

Because the app uses Gmail restricted scopes, broad public access requires Google verification.

### 5. Limited Breach Intelligence

The breach dataset is still lightweight in the MVP.

## Recommended Next Steps

### Product Improvements

- full inbox pagination
- scan progress indicator
- stronger breach intelligence
- richer service categorization
- clearer domain-to-service mapping

### Platform Improvements

- stronger Google verification readiness
- better testing setup for additional users
- improved deployment documentation

### Workflow Improvements

- more robust export/report formats
- optional mailto generation
- better review prioritization logic

## Summary

GhostGuard is now a more complete audit-and-cleanup workflow than the early prototype.

The current product supports:

- Gmail scanning
- personal contact separation
- user-reviewed classification
- confidence and explanation layers
- batch cleanup
- draft generation
- export
- session persistence across refresh

This makes it much more usable for demos, testing, and structured account-review workflows.
