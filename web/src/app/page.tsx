"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type Tab = "dashboard" | "invoice" | "contract" | "marketing" | "feedback";
type Workflow = "invoice" | "contract" | "marketing";

type RunRow = {
  run_id: string;
  workflow: Workflow;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type RunDetail = {
  run_id: string;
  workflow: Workflow;
  status: string;
  request?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  audit?: { events: EventRow[] } | null;
};

type EventRow = {
  ts: string;
  step: string;
  tool?: string | null;
  decision?: string | null;
  elapsed_ms?: number | null;
  error?: string | null;
  meta?: Record<string, unknown> | null;
};

type FeedbackRow = {
  run_id: string;
  workflow: string;
  decision: string;
  reason_code?: string | null;
  notes?: string | null;
  created_at: string;
};

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base = "rounded-full px-2 py-0.5 text-xs font-medium";
  if (status === "needs_review") return <span className={`${base} bg-amber-100 text-amber-800`}>{status}</span>;
  if (status === "processing") return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
  if (status === "approved") return <span className={`${base} bg-emerald-100 text-emerald-800`}>{status}</span>;
  if (status === "denied") return <span className={`${base} bg-rose-100 text-rose-800`}>{status}</span>;
  if (status === "needs_changes") return <span className={`${base} bg-orange-100 text-orange-800`}>{status}</span>;
  if (status === "failed") return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
  return <span className={`${base} bg-zinc-100 text-zinc-700`}>{status}</span>;
}

function prettyLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [runs, setRuns] = useState<RunRow[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<RunRow | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackRow[]>([]);

  const [invoiceText, setInvoiceText] = useState(
    "vendor: Zeta LLC\ninvoice date: 2026-01-15\ndue date: 2026-02-15\ntotal: 2500\nline items total: 2400"
  );
  const [invoiceForceFail, setInvoiceForceFail] = useState(false);
  const [contractText, setContractText] = useState(
    "parties: Alpha Inc and Beta LLC\npayment: Net 30\nliability: Capped at fees paid"
  );
  const [contractRisks, setContractRisks] = useState<string[]>(["liability_cap_missing"]);
  const [marketingOutline, setMarketingOutline] = useState("Launch message");
  const [marketingPersona, setMarketingPersona] = useState("busy founder");
  const [marketingChannel, setMarketingChannel] = useState("email");
  const [feedbackDecision, setFeedbackDecision] = useState("approved");
  const [feedbackReason, setFeedbackReason] = useState("meets_brand");
  const [feedbackNotes, setFeedbackNotes] = useState("Looks good");
  const [dashboardSortBy, setDashboardSortBy] = useState<"run_id" | "workflow" | "status">("run_id");
  const [dashboardSortDir, setDashboardSortDir] = useState<"asc" | "desc">("desc");

  const tabButtons = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard" },
      { id: "invoice", label: "Invoice" },
      { id: "contract", label: "Contract" },
      { id: "marketing", label: "Marketing" },
      { id: "feedback", label: "Feedback" },
    ],
    []
  );

  const scopedRuns = useMemo(() => {
    if (tab === "invoice" || tab === "contract" || tab === "marketing") {
      return runs.filter((r) => r.workflow === tab);
    }
    return runs;
  }, [runs, tab]);

  const sortedDashboardRuns = useMemo(() => {
    const items = [...runs];
    items.sort((a, b) => {
      const av = String(a[dashboardSortBy] ?? "");
      const bv = String(b[dashboardSortBy] ?? "");
      const cmp = av.localeCompare(bv);
      return dashboardSortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [runs, dashboardSortBy, dashboardSortDir]);

  async function apiFetch(path: string, init?: RequestInit) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function fetchRuns() {
    const data = await apiFetch("/runs?limit=30");
    if (!data?.runs) return;
    const freshRuns = data.runs as RunRow[];
    setRuns(freshRuns);

    const existing = selectedRunId ? freshRuns.find((r) => r.run_id === selectedRunId) : null;
    const fallback = freshRuns[0];
    const next = existing ?? fallback;
    if (next) {
      await selectRunById(next.run_id, freshRuns);
    }
  }

  async function selectRunById(runId: string, runSource?: RunRow[]) {
    const currentRuns = runSource ?? runs;
    const run = currentRuns.find((r) => r.run_id === runId);
    if (!run) return;

    setSelectedRunId(runId);
    setSelectedRun(run);

    const [runResp, eventsResp, feedbackResp] = await Promise.all([
      apiFetch(`/runs/${runId}`),
      apiFetch(`/runs/${runId}/events`),
      apiFetch(`/feedback/${runId}`),
    ]);

    if (runResp) {
      setRunDetail(runResp as RunDetail);
      setSelectedRun((prev) => (prev ? { ...prev, status: (runResp as RunDetail).status } : prev));
    }
    setEvents(eventsResp?.events ?? []);
    setFeedbackHistory(feedbackResp?.feedback ?? []);
  }

  async function postFeedback() {
    if (!selectedRun) return;
    await apiFetch("/feedback", {
      method: "POST",
      body: JSON.stringify({
        run_id: selectedRun.run_id,
        workflow: selectedRun.workflow,
        decision: feedbackDecision,
        reason_code: feedbackReason,
        notes: feedbackNotes,
      }),
    });
    await selectRunById(selectedRun.run_id);
    await fetchRuns();
  }

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderResult() {
    if (!runDetail?.result) return <p className="text-zinc-500">Select a run to see results.</p>;

    const result = runDetail.result as Record<string, unknown>;

    if (runDetail.workflow === "invoice") {
      const route = (result.route as Record<string, unknown> | undefined) ?? {};
      const extracted = (result.extracted as Record<string, unknown> | undefined) ?? {};
      const validations = (result.validations as Array<Record<string, unknown>> | undefined) ?? [];
      return (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div><span className="font-semibold">Route:</span> {textValue(route.queue)}</div>
            <div><span className="font-semibold">Reason:</span> {textValue(route.reason)}</div>
            <div><span className="font-semibold">Invoice key:</span> {textValue(result.invoice_key)}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Extracted fields</div>
            <div className="grid gap-1 md:grid-cols-2">
              {Object.entries(extracted).map(([k, v]) => (
                <div key={k}><span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}</div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Validation checks</div>
            <div className="space-y-1">
              {validations.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{prettyLabel(String(v.rule ?? "rule"))}</span>
                  <span className={v.ok ? "text-emerald-700" : "text-red-700"}>{v.ok ? "pass" : "fail"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (runDetail.workflow === "contract") {
      const route = (result.route as Record<string, unknown> | undefined) ?? {};
      const clauses = (result.clauses as Record<string, unknown> | undefined) ?? {};
      const riskFlags = (result.risk_flags as Array<Record<string, unknown>> | undefined) ?? [];
      return (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div><span className="font-semibold">Route:</span> {textValue(route.queue)}</div>
            <div><span className="font-semibold">Reason:</span> {textValue(route.reason)}</div>
            <div><span className="font-semibold">Risk flags:</span> {riskFlags.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Clauses</div>
            <div className="grid gap-1 md:grid-cols-2">
              {Object.entries(clauses).map(([k, v]) => (
                <div key={k}><span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}</div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Risk details</div>
            {riskFlags.length === 0 ? <p className="text-zinc-500">No risks detected.</p> : riskFlags.map((f, idx) => (
              <div key={idx}>{textValue(f.type)} ({textValue(f.severity)})</div>
            ))}
          </div>
        </div>
      );
    }

    const variants = (result.variants as Array<Record<string, unknown>> | undefined) ?? [];
    const checks = (result.checks as Array<Record<string, unknown>> | undefined) ?? [];
    const pack = (result.package as Record<string, unknown> | undefined) ?? {};
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div><span className="font-semibold">Package:</span> {textValue(pack.notes)}</div>
          <div><span className="font-semibold">Format:</span> {textValue(pack.format)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Draft variants</div>
          {variants.map((v, idx) => (
            <div key={idx} className="mb-2 rounded border border-zinc-200 p-2">
              <div className="font-semibold">{textValue(v.title)}</div>
              <div className="text-zinc-700">{textValue(v.body)}</div>
              <div className="text-zinc-500">CTA: {textValue(v.cta)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Brand checks</div>
          {checks.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span>{prettyLabel(String(c.rule ?? "rule"))}</span>
              <span className={c.ok ? "text-emerald-700" : "text-red-700"}>{c.ok ? "pass" : "fail"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOriginalInput() {
    if (!runDetail?.request) return <p className="text-zinc-500">Select a run to see original input.</p>;
    const request = runDetail.request as Record<string, unknown>;

    if (runDetail.workflow === "invoice") {
      const document = (request.document as Record<string, unknown> | undefined) ?? {};
      const metadata = (request.metadata as Record<string, unknown> | undefined) ?? {};
      const emailContext = (request.email_context as Record<string, unknown> | undefined) ?? {};
      return (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div><span className="font-semibold">Content type:</span> {textValue(document.content_type)}</div>
            <div><span className="font-semibold">Idempotency key:</span> {textValue(request.idempotency_key)}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Document payload</div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-100">
              {textValue(document.content_base64)}
            </pre>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Email context</div>
            {Object.keys(emailContext).length === 0 ? <p className="text-zinc-500">No email context.</p> : Object.entries(emailContext).map(([k, v]) => (
              <div key={k}><span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}</div>
            ))}
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Metadata</div>
            {Object.keys(metadata).length === 0 ? <p className="text-zinc-500">No metadata.</p> : Object.entries(metadata).map(([k, v]) => (
              <div key={k}><span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}</div>
            ))}
          </div>
        </div>
      );
    }

    if (runDetail.workflow === "contract") {
      const document = (request.document as Record<string, unknown> | undefined) ?? {};
      const metadata = (request.metadata as Record<string, unknown> | undefined) ?? {};
      return (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div><span className="font-semibold">Counterparty:</span> {textValue(request.counterparty)}</div>
            <div><span className="font-semibold">Content type:</span> {textValue(document.content_type)}</div>
            <div><span className="font-semibold">Idempotency key:</span> {textValue(request.idempotency_key)}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Contract payload</div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-100">
              {textValue(document.content_base64)}
            </pre>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Metadata</div>
            {Object.keys(metadata).length === 0 ? <p className="text-zinc-500">No metadata.</p> : Object.entries(metadata).map(([k, v]) => (
              <div key={k}><span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}</div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div><span className="font-semibold">Outline:</span> {textValue(request.outline)}</div>
          <div><span className="font-semibold">Persona:</span> {textValue(request.persona)}</div>
          <div><span className="font-semibold">Channel:</span> {textValue(request.channel)}</div>
          <div><span className="font-semibold">Idempotency key:</span> {textValue(request.idempotency_key)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Brand rules</div>
          {Array.isArray(request.brand_rules) && request.brand_rules.length > 0 ? (
            request.brand_rules.map((r, idx) => <div key={idx}>{textValue(r)}</div>)
          ) : (
            <p className="text-zinc-500">No brand rules provided.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold">Hydra Copilot</h1>
            <p className="text-sm text-zinc-500">AI-assisted workflows with audit trails and human-in-the-loop control.</p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600">API: {API_BASE}</div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          {tabButtons.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                tab === item.id ? "bg-zinc-900 text-white shadow-sm" : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Run Inspector" subtitle="Pick any run_id to inspect timeline, output, and feedback." />
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <select
                value={selectedRunId}
                onChange={(e) => selectRunById(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
              >
                {scopedRuns.length === 0 && <option value="">No runs in this view</option>}
                {scopedRuns.map((r) => (
                  <option key={r.run_id} value={r.run_id}>
                    {r.run_id} | {r.workflow} | {r.status}
                  </option>
                ))}
              </select>
              <button onClick={fetchRuns} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Refresh runs</button>
              {selectedRun ? <div className="rounded-lg border border-zinc-200 px-3 py-2 text-xs">Selected: <span className="font-mono">{selectedRun.run_id}</span></div> : <div />}
            </div>
            {loading && <p className="mt-2 text-xs text-zinc-500">Loading...</p>}
            {error && <p className="mt-2 text-xs text-red-600">Error: {error}</p>}
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            {tab === "dashboard" && (
              <div className="space-y-4">
                <SectionTitle title="Recent Runs" subtitle="Dropdown-first selection. Latest runs are shown below for quick scanning." />
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={dashboardSortBy}
                    onChange={(e) => setDashboardSortBy(e.target.value as "run_id" | "workflow" | "status")}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  >
                    <option value="run_id">Sort by run_id</option>
                    <option value="workflow">Sort by type</option>
                    <option value="status">Sort by status</option>
                  </select>
                  <select
                    value={dashboardSortDir}
                    onChange={(e) => setDashboardSortDir(e.target.value as "asc" | "desc")}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
                <div className="space-y-2 text-sm">
                  {sortedDashboardRuns.map((r) => (
                    <button
                      key={r.run_id}
                      onClick={() => selectRunById(r.run_id)}
                      className={`flex w-full items-center justify-between rounded-lg border p-2 text-left ${
                        selectedRunId === r.run_id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                      }`}
                    >
                      <span className="font-mono text-xs">{r.run_id}</span>
                      <span className="text-xs text-zinc-600">{r.workflow}</span>
                      <StatusBadge status={r.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "invoice" && (
              <div className="space-y-4">
                <SectionTitle title="Invoice workflow" subtitle="Paste invoice text. The agent extracts fields, validates totals/dates, and routes for AP review." />
                <textarea
                  value={invoiceText}
                  onChange={(e) => setInvoiceText(e.target.value)}
                  className="h-40 w-full rounded-xl border border-zinc-200 p-3 text-sm"
                />
                <p className="text-xs text-zinc-500">Recommended keys: vendor, invoice date, due date, total, line items total.</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={invoiceForceFail} onChange={(e) => setInvoiceForceFail(e.target.checked)} />
                  Force validation failure
                </label>
                <button
                  onClick={() =>
                    apiFetch("/workflows/invoice/submit", {
                      method: "POST",
                      body: JSON.stringify({
                        document: { content_base64: invoiceText, content_type: "text/plain" },
                        metadata: { force_validation_fail: invoiceForceFail },
                      }),
                    }).then(fetchRuns)
                  }
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Submit invoice
                </button>
              </div>
            )}

            {tab === "contract" && (
              <div className="space-y-4">
                <SectionTitle title="Contract workflow" subtitle="Paste contract text. The agent extracts clauses and routes high-risk contracts to legal review." />
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="h-40 w-full rounded-xl border border-zinc-200 p-3 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    "liability_cap_missing",
                    "auto_renewal_present",
                    "unilateral_termination",
                    "unlimited_indemnity",
                    "governing_law_unacceptable",
                    "payment_net_gt_60",
                  ].map((flag) => (
                    <label key={flag} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={contractRisks.includes(flag)}
                        onChange={(e) => {
                          setContractRisks((prev) => (e.target.checked ? [...prev, flag] : prev.filter((f) => f !== flag)));
                        }}
                      />
                      {flag}
                    </label>
                  ))}
                </div>
                <button
                  onClick={() =>
                    apiFetch("/workflows/contract/submit", {
                      method: "POST",
                      body: JSON.stringify({
                        document: { content_base64: contractText, content_type: "text/plain" },
                        metadata: { force_risks: contractRisks },
                      }),
                    }).then(fetchRuns)
                  }
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Submit contract
                </button>
              </div>
            )}

            {tab === "marketing" && (
              <div className="space-y-4">
                <SectionTitle title="Marketing workflow" subtitle="Generate draft-only variants, run policy checks, and route to human review." />
                <input
                  value={marketingOutline}
                  onChange={(e) => setMarketingOutline(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  placeholder="Outline"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={marketingPersona}
                    onChange={(e) => setMarketingPersona(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                    placeholder="Persona"
                  />
                  <select
                    value={marketingChannel}
                    onChange={(e) => setMarketingChannel(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  >
                    <option value="email">email</option>
                    <option value="landing_page">landing_page</option>
                    <option value="ad">ad</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    apiFetch("/workflows/marketing/submit", {
                      method: "POST",
                      body: JSON.stringify({
                        outline: marketingOutline,
                        persona: marketingPersona,
                        channel: marketingChannel,
                        brand_rules: ["Be concise"],
                      }),
                    }).then(fetchRuns)
                  }
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Submit marketing
                </button>
              </div>
            )}

            {tab === "feedback" && (
              <div className="space-y-4">
                <SectionTitle title="Feedback" subtitle="Submit human decisions for the selected run from this page." />
                <div className="text-xs text-zinc-500">Current run_id: {selectedRun?.run_id ?? "none selected"}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={feedbackDecision} onChange={(e) => setFeedbackDecision(e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 text-sm">
                    <option value="approved">approved</option>
                    <option value="denied">denied</option>
                    <option value="needs_changes">needs_changes</option>
                  </select>
                  <input value={feedbackReason} onChange={(e) => setFeedbackReason(e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 text-sm" placeholder="reason_code" />
                </div>
                <input value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 text-sm" placeholder="notes" />
                <button onClick={postFeedback} disabled={!selectedRun} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Submit feedback
                </button>
              </div>
            )}
          </motion.div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Timeline" subtitle={`Audit events for run_id: ${selectedRun?.run_id ?? "none"}`} />
            <div className="mt-4 space-y-3 text-sm">
              {events.length === 0 ? (
                <p className="text-zinc-500">Select a run to see its timeline.</p>
              ) : (
                events.map((ev, idx) => (
                  <div key={idx} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{ev.step}</span>
                      <span className="text-xs text-zinc-500">{ev.ts}</span>
                      <span className="text-xs text-zinc-500">{ev.tool}</span>
                      <span className="text-xs text-zinc-500">{ev.decision}</span>
                    </div>
                    {ev.meta && (
                      <div className="mt-2 text-xs text-zinc-600">
                        {Object.entries(ev.meta).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-medium">{prettyLabel(k)}:</span> {textValue(v)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Feedback history" subtitle={`Feedback items for run_id: ${selectedRun?.run_id ?? "none"}`} />
            <div className="mt-4 space-y-2 text-sm">
              {feedbackHistory.length === 0 ? (
                <p className="text-zinc-500">Select a run to see feedback history.</p>
              ) : (
                feedbackHistory.map((fb, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 p-2">
                    <div>
                      <span className="font-semibold">{fb.decision}</span> <span className="text-zinc-500">({fb.reason_code || "no_reason"})</span>
                    </div>
                    <div className="text-zinc-500">{fb.notes}</div>
                    <div className="text-[10px] text-zinc-400">{fb.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Original input" subtitle={`Original submitted content for run_id: ${selectedRun?.run_id ?? "none"}`} />
            <div className="mt-4">{renderOriginalInput()}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Run output" subtitle={`Human-readable result for run_id: ${selectedRun?.run_id ?? "none"}`} />
            <div className="mt-4">
              <div className="mb-3 grid gap-2 rounded-lg bg-zinc-50 p-3 text-sm md:grid-cols-3">
                <div><span className="font-semibold">Workflow:</span> {runDetail?.workflow ?? "-"}</div>
                <div><span className="font-semibold">Status:</span> {runDetail?.status ?? "-"}</div>
                <div><span className="font-semibold">Events:</span> {events.length}</div>
              </div>
              {renderResult()}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
