from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..db import utc_now


def run_contract_workflow(payload: Dict[str, Any]) -> Tuple[str, Dict[str, Any], List[Dict[str, Any]]]:
    events: List[Dict[str, Any]] = []

    events.append(
        {
            "ts": utc_now(),
            "step": "ingest",
            "tool": "ingest",
            "decision": "allow",
            "elapsed_ms": 1,
            "error": None,
        }
    )

    clauses = {
        "parties": "Party A and Party B",
        "term_and_renewal": "12 months, auto-renewal",
        "termination": "30 days notice",
        "payment": "Net 30",
        "confidentiality": "Standard NDA terms",
        "liability": "Capped at fees paid",
        "indemnification": "Mutual indemnity",
        "governing_law": "California",
        "data_processing": "DPA attached",
    }

    events.append(
        {
            "ts": utc_now(),
            "step": "extract_clauses",
            "tool": "extractor",
            "decision": "allow",
            "elapsed_ms": 6,
            "error": None,
        }
    )

    risk_flags: List[Dict[str, Any]] = []

    events.append(
        {
            "ts": utc_now(),
            "step": "risk_flags",
            "tool": "policy",
            "decision": "allow",
            "elapsed_ms": 2,
            "error": None,
        }
    )

    if risk_flags:
        route = {"queue": "legal-review", "reason": "risk_flag_present"}
    else:
        route = {"queue": "paralegal-review", "reason": "no_risk_flags"}

    result = {"clauses": clauses, "risk_flags": risk_flags, "route": route, "summary": "Draft summary"}
    status = "needs_review"
    return status, result, events
