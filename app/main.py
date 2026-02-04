from __future__ import annotations

import json
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException

from .db import (
    init_db,
    insert_event,
    insert_run,
    get_run,
    get_events,
    insert_feedback,
    get_feedback,
    get_run_by_idempotency,
    utc_now,
)
from .schemas import (
    ContractRequest,
    InvoiceRequest,
    MarketingRequest,
    EventsResponse,
    FeedbackRequest,
    FeedbackResponse,
    RunResponse,
    SubmitResponse,
)
from .worker import run_workflow_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Hydra Copilot", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def _submit_run(workflow: str, payload: dict) -> SubmitResponse:
    idempotency_key = payload.get("idempotency_key")
    if idempotency_key:
        existing = get_run_by_idempotency(workflow, idempotency_key)
        if existing:
            return SubmitResponse(run_id=existing["run_id"], workflow=workflow, status=existing["status"])
    run_id = f"{workflow[:3]}_{uuid4().hex[:12]}"
    insert_run(run_id, workflow, "queued", payload)
    insert_event(run_id, utc_now(), "enqueue", "api", "allow", 1, None)
    try:
        run_workflow_task.delay(run_id)
    except Exception as exc:
        insert_event(run_id, utc_now(), "enqueue_failed", "celery", "deny", 0, str(exc))
    return SubmitResponse(run_id=run_id, workflow=workflow, status="queued")


@app.post("/workflows/invoice/submit", response_model=SubmitResponse)
def submit_invoice(req: InvoiceRequest) -> SubmitResponse:
    return _submit_run("invoice", req.model_dump(by_alias=True))


@app.post("/workflows/contract/submit", response_model=SubmitResponse)
def submit_contract(req: ContractRequest) -> SubmitResponse:
    return _submit_run("contract", req.model_dump())


@app.post("/workflows/marketing/submit", response_model=SubmitResponse)
def submit_marketing(req: MarketingRequest) -> SubmitResponse:
    return _submit_run("marketing", req.model_dump())


@app.get("/runs/{run_id}", response_model=RunResponse)
def get_run_status(run_id: str) -> RunResponse:
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run_id not found")

    result = json.loads(run["result_json"]) if run.get("result_json") else None
    audit = json.loads(run["audit_json"]) if run.get("audit_json") else None

    return RunResponse(
        run_id=run["run_id"],
        workflow=run["workflow"],
        status=run["status"],
        result=result,
        audit=audit,
    )


@app.get("/runs/{run_id}/events", response_model=EventsResponse)
def get_run_events(run_id: str) -> EventsResponse:
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run_id not found")
    events = get_events(run_id)
    return EventsResponse(run_id=run_id, events=events)


@app.post("/feedback", response_model=FeedbackResponse)
def post_feedback(req: FeedbackRequest) -> FeedbackResponse:
    run = get_run(req.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run_id not found")
    if req.workflow != run["workflow"]:
        raise HTTPException(status_code=400, detail="workflow does not match run")
    insert_feedback(req.run_id, req.workflow, req.decision, req.reason_code, req.notes)
    feedback = get_feedback(req.run_id)
    return FeedbackResponse(run_id=req.run_id, feedback=feedback)


@app.get("/feedback/{run_id}", response_model=FeedbackResponse)
def get_feedback_for_run(run_id: str) -> FeedbackResponse:
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run_id not found")
    feedback = get_feedback(run_id)
    return FeedbackResponse(run_id=run_id, feedback=feedback)
