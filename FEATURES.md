# GhostGuard: New Feature Implementation Plan

This document outlines the requirements and implementation plan for two new features for the GhostGuard project.

---

## Feature 1: In-App Email Deletion

**Objective:** Empower users to clean up their inbox by viewing and deleting emails associated with an identified service directly from the GhostGuard dashboard.

### 1.1. Core Requirement: Permission Scope Elevation

This feature fundamentally changes the application's privacy model and requires more permissions.

- **Action:** The Google OAuth scope must be upgraded from `https://www.googleapis.com/auth/gmail.metadata` to `https://www.googleapis.com/auth/gmail.modify`.
- **File to Modify:** `frontend/src/auth.tsx`.
- **User Impact:** The user must be clearly informed that the app will now have the ability to read and delete emails. The authentication modal text must be updated to reflect this significant change.

### 1.2. Implementation Steps

1.  **Update Authentication (`frontend/src/auth.tsx`):**
    *   Change the `GMAIL_METADATA_SCOPE` constant to `https://www.googleapis.com/auth/gmail.modify`.
    *   Update the text in the `AuthModal` component to clearly state that the app can "Read and delete emails" to manage clutter.

2.  **Update Dashboard UI (`frontend/src/Dashboard.tsx`):**
    *   In the services table, add a new "View Emails" button to each row. This button will be disabled if the `messageCount` is 0.

3.  **Create Email Viewer Modal:**
    *   Create a new component (e.g., `EmailViewerModal.tsx`).
    *   When "View Emails" is clicked, this modal will open, passing the `service.domain` to it.
    *   Inside the modal, trigger a function to fetch emails using the Gmail API: `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:${domain}`.
    *   For each message ID returned, fetch its details (subject, snippet, date) using the `users.messages.get` endpoint.
    *   Display the list of emails, each with a checkbox.

4.  **Implement Deletion Logic:**
    *   The modal will contain a "Delete Selected Emails" button.
    *   On click, this function will collect the IDs of all checked emails.
    *   It will make a POST request to the Gmail API's batch deletion endpoint: `https://gmail.googleapis.com/gmail/v1/users/me/messages/batchDelete`.
    *   After a successful deletion, provide feedback to the user (e.g., a success message), close the modal, and refresh the service list on the dashboard to reflect the updated message counts.

---

## Feature 2: Categorize Personal Contacts

**Objective:** Differentiate between emails from automated services and emails from personal contacts to prevent misclassification and provide a more accurate overview of the user's inbox.

### Option A: Simple Frontend-Based Filtering

**Concept:** Expand the existing frontend logic to classify common public email domains as "Personal" instead of just ignoring them.

1.  **Modify Domain Extraction (`frontend/src/scan.ts`):**
    *   In the `extractDomainFromFromHeader` function, instead of returning `null` for a domain in `EXCLUDED_DOMAINS`, return a special object or flag indicating it's a "Personal" contact (e.g., `{ domain: domain, type: 'Personal' }`).
2.  **Update Aggregation Logic (`frontend/src/scan.ts`):**
    *   The `aggregateHeaderGroups` function must be updated to handle this new type. It should group personal contacts separately from services.
3.  **Update Dashboard UI (`frontend/src/Dashboard.tsx`):**
    *   Create a new state variable, e.g., `personalContacts`.
    *   Add a new summary card to the dashboard: "Personal Contacts".
    *   Display the list of personal contacts in a new, simplified table or list below the main services table. This list would not need the "Status," "Security," or "Action" columns.

### Option B: "Smart" Backend-Based LLM Classification (Recommended)

**Concept:** Leverage the backend's Gemini model to intelligently determine if a domain belongs to a service or a personal email provider.

1.  **Adjust Frontend Scanning (`frontend/src/scan.ts`):**
    *   Modify or remove the `EXCLUDED_DOMAINS` check. The goal is to pass most, if not all, unique domains to the backend for classification.

2.  **Update Backend API (`backend/main.py`):**
    *   **Modify API Models:** Update the Pydantic models to accept and return a new category field (e.g., `category: Literal['Service', 'Personal']`).
    *   **Enhance LLM Prompt:** Modify the prompt sent to the Gemini model in the `/analyze` endpoint. The new prompt should instruct the model:
        > "For each domain, first classify it as either a 'Service' or a 'Personal'. 'Personal' domains are public email providers (like gmail.com, yahoo.com). For items classified as 'Service', also determine their status (Active, Dormant, Ghost)..."
    *   **Update Response Logic:** The backend will process the LLM's response and return a list of items, each tagged with its category.

3.  **Update Dashboard UI (`frontend/src/Dashboard.tsx`):**
    *   The frontend will receive a mixed list of services and personal contacts.
    *   Filter the incoming array into two separate state variables: `services` and `personalContacts`.
    *   Add a "Personal Contacts" summary card.
    *   Render the `personalContacts` in a separate, simplified list or table, as the columns for services are not applicable.
