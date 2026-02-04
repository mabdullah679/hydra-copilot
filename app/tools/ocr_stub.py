from __future__ import annotations

from typing import Any, Dict


def ocr_stub(document: Dict[str, Any]) -> str:
    content_type = document.get("content_type", "application/pdf")
    raw = document.get("content_base64", "")
    if raw and raw != "...":
        return raw
    return f"[OCR_TEXT type={content_type}]"
