# Architecture (MVP)

## High-level components
- API (FastAPI): receives requests, starts workflow runs, returns results
- Orchestrator: deterministic step runner (state machine)
- Tools: pure functions (extract, validate, redact, classify, route, render)
- Policy engine: rules + allow/deny + required escalation + PII handling
- Storage:
  - SQLite for runs, events, artifacts, feedback
  - Blob folder for uploaded docs
- Workers (optional for MVP): background processing for OCR/embedding/LLM

## Agentic-lite design
- No free-form agent with unconstrained tool access.
- Workflow is a finite set of steps with typed inputs/outputs.
- LLM (optional) is used only for bounded transforms (summarize, rewrite), never for final approval decisions.

## Observability
- Event log per run: timestamp, step name, inputs/outputs hashes, latency, errors
- Metrics: counts, latencies, abstain/escalation rates

## Safety
- Prompt injection treated as untrusted content.
- Model/tool outputs validated against schemas.
- Default to "abstain + escalate" when confidence/policy fails.

## Promotion/Rollback (later)
- Versioned artifacts (extractors, classifiers, prompt templates)
- Champion selection based on eval suite + regression tests
