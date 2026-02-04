from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..config import INVOICE_MANAGER_THRESHOLD
from ..db import utc_now


def run_invoice_workflow(payload: Dict[str, Any]) -> Tuple[str, Dict[str, Any], List[Dict[str, Any]]]:
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

    extracted = {
        "vendor": "ACME Corp",
        "invoice_date": "2026-01-01",
        "due_date": "2026-02-01",
        "total": 1234.56,
        "line_items_total": 1234.56,
        "currency": "USD",
    }

    events.append(
        {
            "ts": utc_now(),
            "step": "extract_fields",
            "tool": "extractor",
            "decision": "allow",
            "elapsed_ms": 5,
            "error": None,
        }
    )

    validations = [
        {"rule": "total_validator", "ok": True},
        {"rule": "due_date_after_invoice_date", "ok": True},
        {"rule": "total_matches_line_items", "ok": True},
    ]

    events.append(
        {
            "ts": utc_now(),
            "step": "validate",
            "tool": "validator",
            "decision": "allow",
            "elapsed_ms": 2,
            "error": None,
        }
    )

    validation_failed = any(v["ok"] is False for v in validations)
    if validation_failed:
        route = {"queue": "ap-exceptions", "reason": "validation_failed"}
    elif extracted["total"] >= INVOICE_MANAGER_THRESHOLD:
        route = {"queue": "ap-manager", "reason": "total_ge_threshold"}
    else:
        route = {"queue": "ap-approvals", "reason": "default"}

    events.append(
        {
            "ts": utc_now(),
            "step": "route_for_approval",
            "tool": "router",
            "decision": "allow",
            "elapsed_ms": 1,
            "error": None,
        }
    )

    result = {"extracted": extracted, "validations": validations, "route": route}
    status = "needs_review"
    return status, result, events
