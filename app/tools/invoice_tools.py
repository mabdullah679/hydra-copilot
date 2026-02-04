from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Tuple


def extract_invoice_fields(ocr_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    # Stub: deterministic fields. Later replace with OCR+regex/LLM.
    return {
        "vendor": "ACME Corp",
        "invoice_number": None,
        "invoice_date": "2026-01-01",
        "due_date": "2026-02-01",
        "total": 1234.56,
        "line_items_total": 1234.56,
        "currency": "USD",
    }


def validate_invoice(extracted: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool]:
    total_validator_ok = isinstance(extracted["total"], (int, float))
    due_ok = datetime.fromisoformat(extracted["due_date"]) >= datetime.fromisoformat(extracted["invoice_date"])
    total_matches_ok = abs(extracted["total"] - extracted["line_items_total"]) < 0.01

    validations = [
        {"rule": "total_validator", "ok": total_validator_ok},
        {"rule": "due_date_after_invoice_date", "ok": due_ok},
        {"rule": "total_matches_line_items", "ok": total_matches_ok},
    ]
    failed = any(v["ok"] is False for v in validations)
    return validations, failed
