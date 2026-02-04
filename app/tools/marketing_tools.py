from __future__ import annotations

from typing import Any, Dict, List


def generate_marketing_variants(outline: str, persona: str | None, channel: str) -> List[Dict[str, Any]]:
    return [
        {
            "title": "Draft headline",
            "body": "Draft body copy aligned to brand rules.",
            "cta": "Learn more",
        }
    ]


def run_brand_checks(force_fail: bool = False) -> List[Dict[str, Any]]:
    checks = [
        {"rule": "no_profanity_or_slurs", "ok": True},
        {"rule": "no_sensitive_or_political", "ok": True},
        {"rule": "no_hype_or_guarantees", "ok": True},
        {"rule": "no_competitor_mentions", "ok": True},
        {"rule": "regulated_claims_blocked", "ok": True},
        {"rule": "pricing_disclaimer_if_needed", "ok": True},
        {"rule": "channel_limits_ok", "ok": True},
    ]
    if force_fail:
        checks.append({"rule": "forced_fail", "ok": False})
    return checks
