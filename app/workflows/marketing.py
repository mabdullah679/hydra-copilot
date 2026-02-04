from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..db import utc_now


def run_marketing_workflow(payload: Dict[str, Any]) -> Tuple[str, Dict[str, Any], List[Dict[str, Any]]]:
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

    variants = [
        {
            "title": "Draft headline",
            "body": "Draft body copy aligned to brand rules.",
            "cta": "Learn more",
        }
    ]

    events.append(
        {
            "ts": utc_now(),
            "step": "generate_variants",
            "tool": "generator",
            "decision": "allow",
            "elapsed_ms": 5,
            "error": None,
        }
    )

    checks = [
        {"rule": "no_profanity", "ok": True},
        {"rule": "no_hype", "ok": True},
        {"rule": "no_competitor_mentions", "ok": True},
    ]

    events.append(
        {
            "ts": utc_now(),
            "step": "brand_checks",
            "tool": "checker",
            "decision": "allow",
            "elapsed_ms": 2,
            "error": None,
        }
    )

    result = {"variants": variants, "checks": checks, "package": {"format": "json", "notes": "draft only"}}
    status = "needs_review"
    return status, result, events
