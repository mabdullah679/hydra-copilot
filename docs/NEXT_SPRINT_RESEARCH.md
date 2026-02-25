# Next Sprint Research Plan: Multi-Format Inputs and LLM Scope

## Why this sprint
Before introducing LLMs, define exactly what each workflow accepts, how inputs are normalized, and what deterministic pass/fail checks remain non-LLM.

## Research outcomes required
- Input contract per workflow (allowed file types, size limits, required fields, optional fields).
- Parsing strategy per input type (text, PDF/image OCR, docx, email body/attachments, video/audio metadata).
- Deterministic policy checks and pass/fail criteria that must exist before LLM assistance.
- Clear LLM responsibility boundary per workflow.
- API and UI changes required for upload + preview + validation feedback.

## Workflow-specific research checklist

### 1) Invoice -> AP triage
- Confirm real inbound channels: AP inbox emails, ERP export, vendor portal uploads.
- Identify common invoice formats: PDF (text/native), scanned image, OCR output JSON, CSV export.
- Define minimum canonical fields: vendor, invoice number, invoice date, due date, total, currency, line-items total.
- Define strict pass/fail tests: date consistency, amount arithmetic, duplicate invoice key, PO match availability.
- Decide confidence thresholds and forced human-review rules.

### 2) Contract -> legal review
- Confirm source formats: DOCX, PDF, plain text, email thread + attachment.
- Decide clause schema for MVP: parties, term, renewal, termination, payment, liability, indemnity, governing law, data processing.
- Define risk rules as deterministic baseline (e.g., missing liability cap -> fail).
- Define escalation matrix: legal-review vs paralegal-review vs blocked.

### 3) Marketing outline -> brand checks
- Confirm source formats: text brief, doc/pdf brief, image references, optional campaign assets.
- Define output package schema: headline/body/CTA variants + channel metadata.
- Define deterministic checks first: profanity, sensitive topics, exaggerated claims, competitor mentions, disclaimers.
- Define pass/fail and human-review conditions by channel.

## Cross-cutting technical research
- File handling: storage path, retention policy, max upload size, mime validation, antivirus/safety check.
- OCR/ASR options: local-first candidates, expected quality, runtime on CPU/GPU.
- Observability: event-level traces for parse/validate/route and error categories.
- Security/compliance: PII handling, redaction strategy, audit retention.

## Deliverables for sprint end
- `docs/INPUT_CONTRACTS.md` with exact schemas and constraints.
- `docs/POLICY_RULES.md` with pass/fail logic and reason codes.
- `docs/LLM_BOUNDARY.md` stating what LLM will and will not do.
- Backend tickets for upload endpoints + parser adapters.
- Frontend tickets for per-workflow input forms and run output cards.
