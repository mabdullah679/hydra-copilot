# Hydra Copilot

A specification-stage project for AI-assisted document workflows that produce draft outputs plus an audit trail, with a human approving every decision.

**Status of this branch: documentation only.** `main` contains the written spec (API contracts, architecture, policy model, decisions, tickets). No code is on `main`. A prototype implementation lives on the separate `dev` branch and is not covered by this README.

```
document / outline --> [ workflow steps ] --> draft output + audit events --> human review --> feedback
                          (spec only)
```

Not local or contained: nothing runs from `main`; there is no service, database, or model to supply.

## Prerequisites
None to read it. The spec assumes (does not install) Python/FastAPI, SQLite, and later Postgres and a queue; see [docs/DECISIONS.md](docs/DECISIONS.md).

## Read it
1. Scope and goals: [docs/PROJECT.md](docs/PROJECT.md)
2. Design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. Endpoint shapes: [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md)
4. Escalation rules: [docs/POLICY.md](docs/POLICY.md)

If you want running code, check out the `dev` branch instead; its own README applies there.

## What the spec defines
| Workflow | Input | Output (always a draft) |
|---|---|---|
| Invoice to Approval | invoice document | extracted fields, validations, routing, approval packet |
| Contract to Reviewer | contract document | clauses, risk flags, reviewer routing |
| Marketing Outline to Pitch | outline, persona, brand rules | pitch variants plus policy checks |

## Interface (v0 contract, not implemented on main)
| Method | Path |
|---|---|
| POST | `/workflows/invoice/submit` |
| POST | `/workflows/contract/submit` |
| POST | `/workflows/marketing/submit` |

No authentication is specified yet.

## Tests and CI
No tests exist on `main`. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs a secrets scan and checks that relative links in the markdown resolve. It does not run application tests because there are none.

## Layout
| Path | Role |
|---|---|
| [docs/PROJECT.md](docs/PROJECT.md) | goals, workflows, definition of done |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | components, agentic-lite design, safety |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | v0 request/response shapes |
| [docs/POLICY.md](docs/POLICY.md) | abstain/escalate rules |
| [docs/DECISIONS.md](docs/DECISIONS.md) | stack and safety decisions |
| [docs/PARTICIPATION.md](docs/PARTICIPATION.md) | participation notes |
| [docs/TONIGHT.md](docs/TONIGHT.md), [tickets/TICKETS.md](tickets/TICKETS.md) | original planning notes and backlog |
| [docs/README.md](docs/README.md) | docs index |

## Design decisions
- Draft-only outputs: the obvious alternative, auto-approval, is rejected because payments and legal terms must never be auto-approved ([docs/DECISIONS.md](docs/DECISIONS.md) D4, D4.1).
- Fixed step graphs instead of a free-form agent, so every tool call and policy decision can be audited ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
