from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ..db import utc_now
from ..tools.marketing_tools import generate_marketing_variants, run_brand_checks


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

    variants = generate_marketing_variants(
        payload.get("outline", ""),
        payload.get("persona"),
        payload.get("channel", "landing_page"),
    )

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

    force_brand_fail = bool((payload.get("metadata") or {}).get("force_brand_fail"))
    checks = run_brand_checks(force_fail=force_brand_fail)

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
