# Safety and Privacy

## Privacy-First Design Principle

GhostGuard is designed around a simple trust model:

- minimize the amount of user data accessed
- process sensitive information locally where possible
- avoid long-term storage
- keep the user in control of final actions

This is central to the product identity.

## What GhostGuard Accesses

In the intended workflow, GhostGuard uses limited email metadata rather than full mailbox content.

The main metadata fields used in the MVP are:

- `From`
- `Date`

These are enough to infer likely service domains and estimate account recency.

## What GhostGuard Avoids

GhostGuard is intentionally designed to avoid relying on:

- email body text
- attachments
- contact lists
- password-based login
- auto-sending deletion emails

This makes the system less invasive than a full inbox reader.

## Why Local Sanitization Matters

Before data is sent to the backend, the frontend converts raw mail signals into sanitized summaries such as:

- service name
- domain
- last seen date
- message count

This reduces privacy exposure because the backend does not need raw mailbox content to do its analysis.

## Backend Safety Model

The backend is designed to be stateless in the MVP.

That means:

- it receives a request
- performs analysis
- returns a result
- does not rely on a user database

This reduces persistence risk.

## Why Draft-Only Is Safer

GhostGuard generates deletion-request drafts but does not automatically send them.

This is safer because:

- the user reviews the content before taking action
- no irreversible step happens automatically
- legal and communication risk stays under user control

## Is It Completely Risk-Free?

No.

Even metadata can still reveal sensitive patterns. Sender fields may contain names, aliases, or behavior signals.

So GhostGuard should be described as:

- privacy-minimizing
- lower-risk than full-content scanning
- safer by design

But not as:

- perfectly private
- zero-risk
- legally guaranteed

## Why This Matters for Users

Trust is a major barrier in privacy products.

GhostGuard becomes easier to trust because it can clearly explain:

- what it reads
- what it never reads
- what leaves the browser
- what it does not store

## Summary

GhostGuard is safer than a naive inbox-analysis tool because it limits access, sanitizes data locally, avoids persistence, and keeps user actions manual.

Its safety comes from architecture, not from vague promises.
