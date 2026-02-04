# Hydra Copilot

Hydra Copilot is a helper for repetitive, document‑heavy work. It turns messy inputs into **clear draft outputs** and tells you **why** it made each decision, so a person can approve quickly and safely.

### What it helps with
- **Invoices**: pulls key fields, checks totals, and routes for approval
- **Contracts**: highlights important clauses, flags risks, and routes to legal review
- **Marketing**: turns an outline into draft copy that follows your brand rules

### Why it’s useful
- **Saves time** on first‑pass review
- **Reduces mistakes** by catching validation issues
- **Keeps humans in control** (everything is draft‑only)
- **Creates an audit trail** you can trust and improve over time

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

## Guiding constraints
- Prefer **zero paid APIs**.
- **Cloud-friendly** CPU mode should still be useful.
- Local GPU can be used later for a “premium demo mode”.
