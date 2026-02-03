# API Contracts (v0)

## Common response
All endpoints return:
- `run_id`
- `status`: `completed | needs_review | failed`
- `result`: workflow-specific
- `audit.events[]`: append-only trace entries

Audit event (v0):
```json
{
  "ts": "2026-02-03T22:00:00Z",
  "step": "extract_fields",
  "tool": "ocr",
  "decision": "allow|escalate|abstain|deny",
  "elapsed_ms": 123,
  "error": null
}
```

## 1) Invoice → Approval
`POST /workflows/invoice/submit`

Request (v0):
```json
{
  "document": {"content_base64": "...", "content_type": "application/pdf"},
  "email_context": {"from": "optional", "subject": "optional", "body": "optional"},
  "metadata": {}
}
```

Response (v0):
```json
{
  "run_id": "inv_...",
  "status": "needs_review",
  "result": {
    "extracted": {"vendor": "...", "invoice_number": "...", "due_date": "...", "total": 123.45, "currency": "USD"},
    "validations": [{"rule": "total_present", "ok": true}],
    "route": {"queue": "ap-approvals", "reason": "policy"}
  },
  "audit": {"events": []}
}
```

## 2) Contract → Reviewer
`POST /workflows/contract/submit`

Request (v0):
```json
{
  "document": {"content_base64": "...", "content_type": "application/pdf"},
  "counterparty": "optional",
  "metadata": {}
}
```

Response (v0):
```json
{
  "run_id": "ctr_...",
  "status": "needs_review",
  "result": {
    "clauses": {"termination": "...", "payment": "..."},
    "risk_flags": [{"type": "liability_cap_missing", "severity": "high"}],
    "route": {"queue": "legal-review", "reason": "high_severity_flag"},
    "summary": "draft summary"
  },
  "audit": {"events": []}
}
```

## 3) Marketing Outline → Publishable Pitch
`POST /workflows/marketing/submit`

Request (v0):
```json
{
  "outline": "...",
  "persona": "...",
  "channel": "landing_page|email|ad",
  "brand_rules": ["..."],
  "metadata": {}
}
```

Response (v0):
```json
{
  "run_id": "mkt_...",
  "status": "needs_review",
  "result": {
    "variants": [{"title": "...", "body": "...", "cta": "..."}],
    "checks": [{"rule": "no_profanity", "ok": true}]
  },
  "audit": {"events": []}
}
```
