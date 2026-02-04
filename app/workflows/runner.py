from __future__ import annotations

from typing import Any, Dict, List, Tuple

from .contract import run_contract_workflow
from .invoice import run_invoice_workflow
from .marketing import run_marketing_workflow


def run_workflow(workflow: str, payload: Dict[str, Any]) -> Tuple[str, Dict[str, Any], List[Dict[str, Any]]]:
    if workflow == "invoice":
        return run_invoice_workflow(payload)
    if workflow == "contract":
        return run_contract_workflow(payload)
    if workflow == "marketing":
        return run_marketing_workflow(payload)
    raise ValueError(f"Unknown workflow: {workflow}")
