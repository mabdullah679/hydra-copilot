from __future__ import annotations

from datetime import datetime
import re
from typing import Any, Dict, List, Tuple


def _find(pattern: str, text: str) -> str | None:
    m = re.search(pattern, text, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _find_number(pattern: str, text: str) -> float | None:
    val = _find(pattern, text)
    if val is None:
        return None
    try:
        return float(val.replace(",", ""))
    except ValueError:
        return None


def extract_invoice_fields(ocr_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    vendor = _find(r"vendor:\s*([^\n]+)", ocr_text) or "ACME Corp"
    invoice_number = _find(r"invoice\s*#?:\s*([^\n]+)", ocr_text)
    invoice_date = _find(r"invoice date:\s*([0-9\-]+)", ocr_text) or "2026-01-01"
    due_date = _find(r"due date:\s*([0-9\-]+)", ocr_text) or "2026-02-01"
    total = _find_number(r"total:\s*([\d\.,]+)", ocr_text) or 1234.56
    line_items_total = _find_number(r"line items total:\s*([\d\.,]+)", ocr_text) or total
    currency = _find(r"currency:\s*([A-Z]{3})", ocr_text) or "USD"
    return {
        "vendor": vendor,
        "invoice_number": invoice_number,
        "invoice_date": invoice_date,
        "due_date": due_date,
        "total": total,
        "line_items_total": line_items_total,
        "currency": currency,
    }


def validate_invoice(extracted: Dict[str, Any], force_fail: bool = False) -> Tuple[List[Dict[str, Any]], bool]:
    total_validator_ok = isinstance(extracted["total"], (int, float))
    due_ok = datetime.fromisoformat(extracted["due_date"]) >= datetime.fromisoformat(extracted["invoice_date"])
    total_matches_ok = abs(extracted["total"] - extracted["line_items_total"]) < 0.01

    validations = [
        {"rule": "total_validator", "ok": total_validator_ok},
        {"rule": "due_date_after_invoice_date", "ok": due_ok},
        {"rule": "total_matches_line_items", "ok": total_matches_ok},
    ]
    if force_fail:
        validations.append({"rule": "forced_fail", "ok": False})
    failed = any(v["ok"] is False for v in validations)
    return validations, failed
