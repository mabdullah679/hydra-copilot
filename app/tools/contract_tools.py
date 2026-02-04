from __future__ import annotations

import re
from typing import Any, Dict, List


def _find(pattern: str, text: str) -> str | None:
    m = re.search(pattern, text, re.IGNORECASE)
    return m.group(1).strip() if m else None


def extract_contract_clauses(ocr_text: str) -> Dict[str, str]:
    return {
        "parties": _find(r"parties:\s*([^\n]+)", ocr_text) or "Party A and Party B",
        "term_and_renewal": _find(r"term:\s*([^\n]+)", ocr_text) or "12 months, auto-renewal",
        "termination": _find(r"termination:\s*([^\n]+)", ocr_text) or "30 days notice",
        "payment": _find(r"payment:\s*([^\n]+)", ocr_text) or "Net 30",
        "confidentiality": _find(r"confidentiality:\s*([^\n]+)", ocr_text) or "Standard NDA terms",
        "liability": _find(r"liability:\s*([^\n]+)", ocr_text) or "Capped at fees paid",
        "indemnification": _find(r"indemnification:\s*([^\n]+)", ocr_text) or "Mutual indemnity",
        "governing_law": _find(r"governing law:\s*([^\n]+)", ocr_text) or "California",
        "data_processing": _find(r"data processing:\s*([^\n]+)", ocr_text) or "DPA attached",
    }


def flag_contract_risks(metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    risk_flags: List[Dict[str, Any]] = []
    forced = (metadata or {}).get("force_risks") or []
    for flag in forced:
        risk_flags.append({"type": flag, "severity": "high"})
    return risk_flags
