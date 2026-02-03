# Project Brief

## Goal
Ship a portfolio-grade, end-to-end "AI Assisted Workflows" system that demonstrates:
- Agentic workflow automation (tools + policies + auditability)
- Document understanding (IDP) and structured extraction
- Evaluation, monitoring, feedback loop, and promotion/rollback

## Workflows (under one umbrella)
1) Invoice → Approval
- Input: invoice PDF/image + optional email context
- Output: extracted fields + validations + routing decision + approval packet

2) Contract → Reviewer
- Input: contract PDF/text
- Output: key clauses extracted + risk flags + reviewer routing + trace

3) Marketing Outline → Publishable Pitch
- Input: outline + brand rules + target persona
- Output: structured pitch package + policy checks + publish-ready assets

## Constraints
- Prefer zero paid APIs.
- Cloud-friendly: CPU-only deployment should still be useful.
- Local GPU can be used for "premium" demo mode.

## Non-goals
- Fully autonomous, high-stakes decisions without human review.
- Beating best-in-class enterprise systems.

## Definition of Done (MVP)
- Single API with three endpoints (one per workflow)
- Every request produces an auditable trace (steps, tool calls, policy decisions)
- Storage of inputs/outputs/metrics locally (SQLite or files)
- Basic evaluation harness (golden test cases)
- Feedback endpoint and a documented retraining/promotion process
