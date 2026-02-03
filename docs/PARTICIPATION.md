# Participation Guide

Use this file as a fill-in-the-blanks worksheet. Once filled, we can implement the code with minimal ambiguity.

## 1) Invoice workflow: required fields + validations
Pick 3–5 required fields:
- [x] vendor
- [ ] invoice_number (optional: extract if present; backend computes canonical invoice_key for dedupe)
- [x] invoice_date
- [x] due_date
- [x] total
- [ ] currency (we will default to USD for MVP)
- [x] line_items_total

Pick 3 validation rules:
- [x] total_validator (presence + numeric parse)
- [ ] total_present (covered by total_validator)
- [ ] total_is_number (covered by total_validator)
- [ ] currency_supported
- [x] due_date_after_invoice_date
- [x] total_matches_line_items (if line items exist)

Notes:
- MVP currency policy: default `USD` unless the document explicitly states otherwise (we can add currency extraction later).
- Invoice identity: backend computes `invoice_key` for dedupe (e.g., doc_hash + vendor + invoice_date + total); if `invoice_number` is extracted, include it in the key.
- Line items: support both (a) extracted `line_items_total` from the doc and (b) computed sum of extracted line items; if they disagree beyond tolerance → escalate.

Routing policy (choose one simple rule):
- [x] if validations fail → route to `ap-exceptions`
- [x] if total >= ____ → route to `ap-manager`
- [x] else → route to `ap-approvals`

## 2) Contract workflow: clause types + risk flags
Pick 5–8 clause types to extract:
- [x] parties
- [x] term_and_renewal (optional)
- [x] termination
- [x] payment
- [x] confidentiality (if applicable)
- [x] liability
- [x] indemnification
- [x] governing_law (if provided)
- [x] data_processing

Pick 5 risk flags:
- [x] liability_cap_missing
- [x] auto_renewal_present
- [x] unilateral_termination
- [x] unlimited_indemnity
- [x] governing_law_unacceptable
- [x] payment_net_gt_60

Routing:
- [x] any risk flag present → legal-review (until model/policy matures)
- [x] else → paralegal-review

## 3) Marketing workflow: brand rules + regulated claims
Write 5 brand rules:
1) Professional, conversational, friendly tone.
2) No profanity/slurs; avoid sensitive/political topics.
3) No hype or guarantees (no “guaranteed”, “100%”, “best ever”).
4) No competitor mentions by name; avoid unnecessary comparisons.
5) Be concise and scannable (short paragraphs/bullets), but still deliver useful, impactful info; define acronyms once and clarify if asked; CTA only when it naturally fits.

Regulated claims rule (choose one):
- [x] No health claims
- [x] No financial performance guarantees
- [x] Must include disclaimer if pricing mentioned

Channel constraints:
- landing_page: max 300 words
- email: subject max 60 chars
- ad: headline max 35 chars

## 4) Your default choices (so we can start coding)
- Stack: FastAPI + SQLite + blob folder
- Execution model: [ ] single-process  [x] background worker
- PII: [x] store raw docs  [ ] hash only
- Logging: [x] redact logs

