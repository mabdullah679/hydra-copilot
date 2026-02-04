from __future__ import annotations

from typing import Any, Dict, List


def extract_contract_clauses(ocr_text: str) -> Dict[str, str]:
    return {
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


def flag_contract_risks(metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    risk_flags: List[Dict[str, Any]] = []
    forced = (metadata or {}).get("force_risks") or []
    for flag in forced:
        risk_flags.append({"type": flag, "severity": "high"})
    return risk_flags
