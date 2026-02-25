# Staging Sprint Plan

This document defines what we will actually run in staging, and what remains planned.

## Target architecture (staging subset)
**We will run:**
- `web` (Next.js UI)
- `api-control-plane` (FastAPI)
- `worker-default` (Celery)
- `redis` (broker/result backend)
- `postgres` (system of record for runs/events/feedback)
- `object-storage` (MinIO locally; cloud later)

**We will NOT run yet (documented only):**
- `worker-heavy` (separate queue for OCR/LLM/embeddings)
- `llm-gateway` (model routing, caching, retries)
- `hydra-ops` full observability stack (OTel + Prom/Grafana/Loki/Tempo)

## Deployment intent
- **Local staging** via Docker Compose (API + worker + Redis + Postgres + MinIO + web).
- **Cloud staging** later: Cloud Run for API/worker, managed Postgres, object storage.

## Staging acceptance criteria
- Submit runs from UI end‑to‑end.
- Runs list populated.
- Timeline events render with hashes + reason codes.
- Feedback submitted and visible in UI.

## Frontend review needed
- UI/UX polish pass still required (visual hierarchy, spacing, states).
- Original input render needs polishing.
- Verify each tab/button has clear user guidance and no dead paths.
- Validate responsiveness (mobile/tablet) and empty-state messaging.
- **Reminder**: run full E2E on the frontend (all tabs + workflows + feedback) before staging rollout.

## Dev note: OCR (planned in dev)
- OCR is the text extraction step for PDFs/images.
- Plan: add a local OCR integration (e.g., Tesseract) as an optional tool behind a feature flag.
- The workflow will fall back to stub text if OCR is unavailable.
