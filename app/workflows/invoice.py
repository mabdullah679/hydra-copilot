from __future__ import annotations

from datetime import datetime
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
        "invoice_number": None,
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

    total_validator_ok = isinstance(extracted["total"], (int, float))
    due_ok = datetime.fromisoformat(extracted["due_date"]) >= datetime.fromisoformat(extracted["invoice_date"])
    total_matches_ok = abs(extracted["total"] - extracted["line_items_total"]) < 0.01

    validations = [
        {"rule": "total_validator", "ok": total_validator_ok},
        {"rule": "due_date_after_invoice_date", "ok": due_ok},
        {"rule": "total_matches_line_items", "ok": total_matches_ok},
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

    invoice_key = f"{extracted['vendor']}|{extracted['invoice_date']}|{extracted['total']}"
    result = {
        "extracted": extracted,
        "validations": validations,
        "route": route,
        "invoice_key": invoice_key,
    }
    status = "needs_review"
    return status, result, events
