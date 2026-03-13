# Limitations and Risks

## Overview

GhostGuard is a strong MVP, but it still has practical, technical, and product limitations.

Being explicit about these limits improves the credibility of the project.

## 1. Gmail OAuth Friction

The biggest operational challenge is Gmail access.

Problems include:

- unverified app warnings
- Google Cloud setup complexity
- sensitive scope restrictions
- test-user setup issues

Impact:

This can block users before they even try the core workflow.

## 2. Limited Inbox Coverage

The current scan logic does not yet guarantee full inbox coverage.

Problems:

- recent-message sampling can miss older ghost accounts
- partial scans underrepresent real exposure
- users may assume the result is complete when it is not

## 3. Heuristic Service Detection

GhostGuard infers services from sender domains and metadata patterns.

Problems:

- marketing mail may look like account activity
- third-party senders may distort service identity
- one domain does not always represent one account

Impact:

This can introduce false positives and false negatives.

## 4. Simplified Risk Classification

The current Active / Dormant / Ghost logic is based mainly on recency.

Problems:

- low-frequency but still important accounts may be mislabeled
- active accounts may appear dormant
- some ghost accounts may still generate occasional mail

## 5. Shallow Breach Intelligence

The current MVP breach data is limited.

Problems:

- not comprehensive
- not real-time
- not sufficient for production-grade risk scoring

## 6. Legal Variability

Deletion-request drafting is useful, but privacy compliance is not uniform across all companies or countries.

Problems:

- legal rights differ by region
- some services may require custom workflows
- draft language alone does not guarantee deletion

## 7. User Trust Risk

Even privacy-first products can lose trust if they are not transparent.

Risk factors:

- unclear permissions
- vague claims about safety
- overpromising capabilities

## How to Reduce These Risks

Practical mitigation steps:

- improve OAuth setup and documentation
- add deeper paginated scanning
- strengthen local parsing and classification rules
- integrate better breach intelligence
- add user controls for confirm/ignore feedback
- keep product claims honest and precise

## Summary

GhostGuard's main risks are integration friction, incomplete scan coverage, heuristic analysis errors, and trust sensitivity.

None of these are fatal, but they need to be addressed for a production-grade product.
