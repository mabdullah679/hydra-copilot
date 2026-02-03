# Tonight (Session 1) — 60 to 120 minutes

## Outcome
When you log off tonight, you should have:
- A concrete MVP shape you can explain in 60 seconds
- The first “real” engineering decisions locked in writing
- A tight backlog that makes tomorrow’s coding session easy

## 0) Vocabulary (so we speak the same language)
- **Workflow**: a named automation (invoice/contract/marketing)
- **Run**: one execution of a workflow (has a `run_id`)
- **Step**: deterministic stage in a run (e.g., `extract`, `validate`, `route`)
- **Tool**: a bounded function a step can call (OCR, extractor, validator)
- **Policy**: rules that gate actions (`allow/deny/escalate/abstain`)
- **Audit event**: append-only record of what happened

## 1) Decisions to make (pick defaults; we can change later)
### D1: Stack
Recommendation:
- API: Python + FastAPI
- Storage: SQLite (runs/events/feedback) + `blob/` folder for files

Questions:
- Do you want a single-process MVP (simpler), or API + background worker (more realistic)?

### D2: “Agentic-lite” boundaries (important)
- No unconstrained agent.
- Steps are fixed; tools are typed; outputs validated.
- Default behavior on low confidence / policy failure: **abstain + escalate**.

### D3: Policy model v0
For each workflow, define:
- What must trigger escalation?
- What is allowed to be auto-produced as “draft” only?
- What PII rules apply (store raw docs? hash only? redact logs?)

## 2) MVP contracts to write tonight
Create/confirm request/response JSON for each endpoint:
- `POST /workflows/invoice/submit`
- `POST /workflows/contract/submit`
- `POST /workflows/marketing/submit`

Each response should include:
- `run_id`
- `status` (`completed|needs_review|failed`)
- `result` (workflow-specific)
- `audit` (minimal trace: steps + timings + policy decisions)

## 3) Minimal step graphs (v0)
Invoice:
1) ingest → 2) extract_fields → 3) validate → 4) route_for_approval → 5) produce_packet

Contract:
1) ingest → 2) extract_clauses → 3) risk_flags → 4) route_reviewer → 5) produce_summary

Marketing:
1) ingest → 2) generate_variants(draft) → 3) brand_checks → 4) package_assets

## 4) Participation: what I need from you tonight
Answer these so we can lock the spec:
1) Pick 3–5 “required fields” for invoices (e.g., vendor, total, due date).
2) Pick 5–8 clause types for contracts (termination, payment, liability, etc.).
3) Write 5 brand rules (tone, forbidden words, length, etc.) for marketing.

## 5) Stop point
If we finish sections 1–4, you can log off. Tomorrow’s first coding task becomes purely mechanical.
