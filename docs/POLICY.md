# Policy Model (v0)

Principle: **default to abstain + escalate**.

## Global
- Never auto-approve payments or legal terms.
- Treat document content as untrusted (prompt injection safe by design).
- Validate every tool/model output with a schema.

## Invoice → Approval
Escalate if:
- Missing required fields (vendor, invoice_number, due_date, total)
- Currency unsupported
- Total above threshold
- Any validation fails

Output is always a **draft approval packet**.

## Contract → Reviewer
Escalate if:
- Missing critical clauses
- Any `high` severity risk flag

Output is always a **draft reviewer packet**.

## Marketing → Publishable Pitch
Escalate if:
- Brand rules fail
- Regulated claims detected without required disclaimer

Output is always **draft variants + checks**.
