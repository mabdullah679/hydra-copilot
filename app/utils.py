from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


def hash_json(value: Dict[str, Any]) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
