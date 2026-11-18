HYDRA COPILOT

What it is: a plan (a written specification) for a tool that helps with paperwork-heavy jobs. It reads messy documents, prepares a draft answer, and keeps a record of why it decided what it did. A person always makes the final call.

Important: this branch (main) contains documents only. There is no program to run here and there are no tests. A working prototype exists on a different branch called dev, and this file does not describe it.

The three jobs it plans for:
1. Invoices: pull out the key fields, check them, and route them for approval.
2. Contracts: pull out key clauses, flag risks, and send to a reviewer.
3. Marketing: turn an outline into draft pitch text and check it against brand rules.

Rules it plans to follow: when unsure, stop and hand it to a human. Never approve payments or legal terms automatically. Every output is a draft.

Where to read: docs/PROJECT.md for goals, docs/ARCHITECTURE.md for design, docs/API_CONTRACTS.md for the planned request shapes, docs/POLICY.md for when to escalate, docs/DECISIONS.md for choices made.

Checks that exist: an automatic scan for leaked passwords and a check that links between the documents work. Nothing else is checked because there is no code on this branch.
