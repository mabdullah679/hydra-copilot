# CLAUDE.md (hydra-copilot)

Master rules: `~/.claude/CLAUDE.md` (read it; not copied here).

## State of this branch (main)
Docs-only. There is no code, build, or test suite on `main`: 10 markdown files (checked 2026-11-18).
The implementation (FastAPI `app/`, Next.js `web/`, `tests/`) exists only on the remote `dev` branch and is NOT part of `main`.

## Rules
- Do not describe anything in the docs as built unless it exists on the branch you are editing.
- `docs/` is the spec (v0): `API_CONTRACTS.md`, `ARCHITECTURE.md`, `POLICY.md`, `DECISIONS.md`. Change decisions only with the owner.
- `docs/TONIGHT.md` and `tickets/TICKETS.md` are historical planning notes; leave them as written.
- Keep `README.md` and `README.txt` in sync.
- Work on a feature branch and open a PR; never push to `main`.

## Checks that exist
- `.github/workflows/ci.yml`: gitleaks secrets scan + markdown relative-link check. Nothing else is claimed.
