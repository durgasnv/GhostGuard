# Pitch Deck Summary

## One-Line Pitch

GhostGuard is a privacy-first tool that helps users discover forgotten digital accounts, identify risky dormant services, and generate deletion-request drafts without storing inbox data.

## The Problem

Users sign into many services over time and forget them.

Those inactive accounts still hold personal data and can become long-term privacy and breach risks.

Manual account cleanup is too slow and too tedious, so most users never do it.

## The Solution

GhostGuard scans limited inbox metadata to infer which services are still tied to a user's email address.

It then:

- identifies likely ghost accounts
- highlights breached domains
- generates deletion-request drafts for manual review

This transforms hidden digital exposure into a clear action workflow.

## Why It Stands Out

GhostGuard is built with a privacy-first architecture:

- metadata-first scanning
- local browser-side sanitization
- stateless backend analysis
- no database by default
- draft-only final action

The product solves a privacy problem without becoming another privacy risk.

## Current MVP

The current MVP includes:

- Gmail metadata scan
- `.eml` upload fallback
- sample/demo mode
- exposure dashboard
- ghost-account classification
- breach flags
- deletion draft generation

## Tech Stack

- React
- TypeScript
- Vite
- FastAPI
- Google OAuth
- Gmail metadata access
- optional Gemini enrichment

## Safety Model

GhostGuard only needs limited metadata such as sender and date fields for the current workflow.

It avoids full email body reading in the intended design and sanitizes service-level data before backend analysis.

This reduces privacy exposure and keeps user trust central to the product.

## Commercial Relevance

GhostGuard has commercial potential because it solves a real and growing problem:

- hidden digital exposure
- stale accounts
- breach anxiety
- privacy cleanup friction

It can evolve into:

- a consumer privacy audit tool
- a premium cleanup workflow product
- a team or enterprise exposure-reduction platform

## Current Limitations

The MVP still has known constraints:

- Gmail OAuth friction
- incomplete inbox coverage
- heuristic service detection
- limited breach intelligence

These are product maturity issues, not problems with the core idea.

## Future Scope

The strongest next steps are:

- full inbox pagination
- stronger domain intelligence
- better breach data
- clearer user controls
- enterprise and repeat-audit workflows

## Closing Position

GhostGuard is not just an inbox scanner.

It is a privacy cleanup workflow that helps users reclaim visibility and control over forgotten digital accounts.
