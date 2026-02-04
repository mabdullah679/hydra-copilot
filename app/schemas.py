from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Document(BaseModel):
    content_base64: str
    content_type: str = Field(default="application/pdf")


class EmailContext(BaseModel):
    from_addr: Optional[str] = Field(default=None, alias="from")
    subject: Optional[str] = None
    body: Optional[str] = None


class InvoiceRequest(BaseModel):
    document: Document
    email_context: Optional[EmailContext] = None
    metadata: Optional[Dict[str, Any]] = None


class ContractRequest(BaseModel):
    document: Document
    counterparty: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class MarketingRequest(BaseModel):
    outline: str
    persona: Optional[str] = None
    channel: str = Field(default="landing_page")
    brand_rules: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditEvent(BaseModel):
    ts: str
    step: str
    tool: Optional[str] = None
    decision: Optional[str] = None
    elapsed_ms: Optional[int] = None
    error: Optional[str] = None


class Audit(BaseModel):
    events: List[AuditEvent]


class SubmitResponse(BaseModel):
    run_id: str
    workflow: str
    status: str


class RunResponse(BaseModel):
    run_id: str
    workflow: str
    status: str
    result: Optional[Dict[str, Any]] = None
    audit: Optional[Audit] = None
