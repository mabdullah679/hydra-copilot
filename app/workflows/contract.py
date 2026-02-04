from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..db import utc_now
from ..tools.contract_tools import extract_contract_clauses, flag_contract_risks
from ..tools.ocr_stub import ocr_stub


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

    ocr_text = ocr_stub(payload.get("document", {}))
    clauses = extract_contract_clauses(ocr_text)

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

    risk_flags = flag_contract_risks(payload.get("metadata") or {})

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
