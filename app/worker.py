from __future__ import annotations

from celery import Celery

from .config import REDIS_URL
import json

from .db import get_run, insert_event, update_run, utc_now
from .workflows.runner import run_workflow

celery_app = Celery("hydra_copilot", broker=REDIS_URL, backend=REDIS_URL)


@celery_app.task(name="hydra.run_workflow")
def run_workflow_task(run_id: str) -> None:
    run = get_run(run_id)
    if not run:
        return

    workflow = run["workflow"]
    payload = json.loads(run["request_json"])

    insert_event(run_id, utc_now(), "dispatch", "celery", "allow", 1, None)

    status, result, events = run_workflow(workflow, payload)
    audit = {"events": events}

    for ev in events:
        insert_event(
            run_id=run_id,
            ts=ev["ts"],
            step=ev["step"],
            tool=ev.get("tool"),
            decision=ev.get("decision"),
            elapsed_ms=ev.get("elapsed_ms"),
            error=ev.get("error"),
            meta=ev.get("meta"),
        )

    update_run(run_id, status=status, result=result, audit=audit)
