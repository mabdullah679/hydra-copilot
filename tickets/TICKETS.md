# Tickets

This is the execution backlog. Each ticket should be small enough to finish in 1–3 sessions.

## Tonight (1–2 hours)
- T001: Decide MVP stack + repo layout
  - AC: pick language/framework, storage choice, and local dev commands

- T002: Define API contracts for the 3 workflows
  - AC: request/response JSON schemas documented

- T003: Define workflow step graph + policy model (v0)
  - AC: each workflow has steps, tool boundaries, and escalation rules

- T004: Implement skeleton API with stubbed workflow responses + audit events
  - AC: endpoints respond; audit log persisted; deterministic run IDs

## Next
- T010: Upload handling + blob storage
- T011: OCR baseline (Tesseract or similar) for invoice/contract
- T012: Structured extraction baseline (rules + regex + templates)
- T013: Marketing rewrite generator (local LLM optional) + brand checks
- T014: Evaluation harness with golden cases + CI target
- T015: Feedback endpoint + data model
- T016: Observability dashboards/log queries (even if just SQL + logfmt)
- T017: Failure injection test suite

