# Hydra Copilot

Hydra Copilot helps teams handle messy work faster and more safely. You give it documents or outlines, and it returns **drafts plus a clear audit trail** so a human can quickly review and approve.

It currently supports three real-world workflows:
- **Invoices** → extract key fields, validate totals, and route for approval
- **Contracts** → extract important clauses, flag risks, and route to legal review
- **Marketing** → turn an outline into publishable draft copy that follows brand rules

Every result is **draft-only**, with reasons for any escalations, so you can trust the process and improve it over time.

## Start here
- docs/README.md
- docs/PROJECT.md
- docs/ARCHITECTURE.md
- docs/TONIGHT.md
- tickets/TICKETS.md

## Local dev commands (PowerShell)
From anywhere inside the repo:
1) Set aliases for this session:
   - `.\scripts\alias.ps1` (creates `hc` + `hydra`)
2) Use commands:
   - `hc redis`   (start Redis via Docker)
   - `hc dev`     (start API)
   - `hc worker`  (start Celery worker, Windows-safe)
   - `hc smoke`   (submit sample request)
   - `hc test`    (run tests)

## One-shot local boot
Starts Redis → API → worker, waits for readiness, then offers to run smoke test:
- `.\scripts\boot.ps1`

## Tonight deliverable (1–2 hours)
- A written MVP spec (endpoints + schemas + step graphs)
- A v0 policy model (abstain/escalate rules)
- A clear “next coding session” plan (tickets + acceptance criteria)

## Guiding constraints
- Prefer **zero paid APIs**.
- **Cloud-friendly** CPU mode should still be useful.
- Local GPU can be used later for a “premium demo mode”.
