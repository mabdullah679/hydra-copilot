from __future__ import annotations

from typing import Any, Dict


def ocr_stub(document: Dict[str, Any]) -> str:
    # Placeholder for OCR. Returns a deterministic string for now.
    content_type = document.get("content_type", "application/pdf")
    return f"[OCR_TEXT type={content_type}]"
