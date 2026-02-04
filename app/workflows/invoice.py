from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..config import INVOICE_MANAGER_THRESHOLD
from ..db import utc_now
from ..tools.invoice_tools import extract_invoice_fields, validate_invoice
from ..tools.ocr_stub import ocr_stub


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

    ocr_text = ocr_stub(payload.get("document", {}))
    metadata = payload.get("metadata") or {}
    extracted = extract_invoice_fields(ocr_text, metadata)

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

    validations, validation_failed = validate_invoice(extracted, force_fail=bool(metadata.get("force_validation_fail")))

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
