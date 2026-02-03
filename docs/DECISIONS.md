# Decisions Log

Date: 2026-02-03

## D1: Stack
- API: [x] FastAPI (Python)

### Environment storage (pick a default now; we can migrate later)
- Local dev: [x] SQLite + `blob/`
- Staging: [x] Postgres + object storage
- Prod: [x] Postgres + object storage

## D2: Execution model
- [ ] Single-process (API runs steps inline)
- [x] API + background worker

### Queue choice (pick one)
- [x] Redis + Celery (most common “resume buzz”)
- [ ] Redis + RQ (simpler)

## D3: PII / retention
- Store raw documents? [x] yes  [ ] no
- Redact logs? [x] yes  [ ] no
- Retention days: [ ] 7  [x] 30  [ ] 90

## D4: Default safety
- [x] On uncertainty: abstain + escalate
- [x] Never auto-approve payments/legal terms

## D4.1: Draft-only until task-scoped promotion
- [x] All AI outputs are draft-only by default.
- [x] Human approvals/denials are captured as feedback (with reason codes) for evaluation and improvement.
- [x] Auto-approval is enabled only per specific low-risk sub-task after passing a versioned eval suite (0 critical errors), plus canary rollout + monitoring + rollback.

## D5: Cloud provider (staging/prod)
- [x] Google Cloud (Cloud Run + GCS + Postgres)
- [ ] AWS (ECS/Lambda + S3 + Postgres)
- [ ] Azure (Container Apps/Functions + Blob + Postgres)
- [ ] Oracle Cloud (Compute + Object + DB)

Notes:
- If “always-free” is a hard constraint, managed Postgres is rarely always-free; consider running Postgres on a free-tier VM.
- 
