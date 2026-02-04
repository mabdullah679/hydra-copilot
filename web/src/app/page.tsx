"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type Tab = "dashboard" | "invoice" | "contract" | "marketing" | "feedback";

type RunRow = {
  run_id: string;
  workflow: string;
  status: string;
  created_at?: string;
  updated_at?: string;
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

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-[360px] overflow-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base = "rounded-full px-2 py-0.5 text-xs font-medium";
  if (status === "needs_review") return <span className={`${base} bg-amber-100 text-amber-800`}>{status}</span>;
  if (status === "processing") return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
  if (status === "failed") return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
  return <span className={`${base} bg-zinc-100 text-zinc-700`}>{status}</span>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<unknown>(null);

  const [runs, setRuns] = useState<RunRow[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunRow | null>(null);
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

  async function apiFetch(path: string, init?: RequestInit) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOutput(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setOutput({ error: message });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function fetchRuns() {
    const data = await apiFetch("/runs?limit=20");
    if (data?.runs) setRuns(data.runs);
  }

  async function selectRun(run: RunRow) {
    setSelectedRun(run);
    const [eventsResp, feedbackResp] = await Promise.all([
      apiFetch(`/runs/${run.run_id}/events`),
      apiFetch(`/feedback/${run.run_id}`),
    ]);
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
    await selectRun(selectedRun);
  }

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold">Hydra Copilot</h1>
            <p className="text-sm text-zinc-500">
              AI‑assisted workflows with audit trails and human‑in‑the‑loop control.
            </p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600">
            API: {API_BASE}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          {tabButtons.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                tab === item.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            {tab === "dashboard" && (
              <div className="space-y-6">
                <SectionTitle
                  title="Recent Runs"
                  subtitle="Runs auto‑load. Click a row to inspect."
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchRuns}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Refresh runs
                  </button>
                  {loading && <span className="text-xs text-zinc-500">Loading…</span>}
                  {error && <span className="text-xs text-red-600">Error: {error}</span>}
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">run_id</th>
                        <th className="px-3 py-2">workflow</th>
                        <th className="px-3 py-2">status</th>
                        <th className="px-3 py-2">created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r) => (
                        <tr
                          key={r.run_id}
                          className={`border-t border-zinc-200 cursor-pointer ${
                            selectedRun?.run_id === r.run_id ? "bg-zinc-50" : "hover:bg-zinc-50"
                          }`}
                          onClick={() => selectRun(r)}
                        >
                          <td className="px-3 py-2 font-mono text-xs">{r.run_id}</td>
                          <td className="px-3 py-2">{r.workflow}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-3 py-2 text-xs">{r.created_at}</td>
                        </tr>
                      ))}
                      {runs.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-zinc-500" colSpan={4}>
                            No runs yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "invoice" && (
              <div className="space-y-4">
                <SectionTitle
                  title="Invoice workflow"
                  subtitle="Paste a plain‑text invoice to drive deterministic parsing."
                />
                <textarea
                  value={invoiceText}
                  onChange={(e) => setInvoiceText(e.target.value)}
                  className="h-40 w-full rounded-xl border border-zinc-200 p-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={invoiceForceFail}
                    onChange={(e) => setInvoiceForceFail(e.target.checked)}
                  />
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
                <SectionTitle title="Contract workflow" subtitle="Paste contract text and force risk flags." />
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
                          setContractRisks((prev) =>
                            e.target.checked ? [...prev, flag] : prev.filter((f) => f !== flag)
                          );
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
                <SectionTitle title="Marketing workflow" subtitle="Generate draft copy from an outline." />
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
                <SectionTitle title="Feedback" subtitle="Record human approval/denial with reasons." />
                <div className="text-xs text-zinc-500">
                  Tip: select a run in Dashboard to auto‑load feedback.
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={feedbackDecision}
                    onChange={(e) => setFeedbackDecision(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  >
                    <option value="approved">approved</option>
                    <option value="denied">denied</option>
                    <option value="needs_changes">needs_changes</option>
                  </select>
                  <input
                    value={feedbackReason}
                    onChange={(e) => setFeedbackReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                    placeholder="reason_code"
                  />
                </div>
                <input
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  placeholder="notes"
                />
                <button
                  onClick={postFeedback}
                  disabled={!selectedRun}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Submit feedback for selected run
                </button>
              </div>
            )}
          </motion.div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Timeline" subtitle="Audit events for the selected run." />
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
                            <span className="font-medium">{k}:</span> {String(v)}
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
            <SectionTitle title="Feedback history" subtitle="Feedback items for the selected run." />
            <div className="mt-4 space-y-2 text-sm">
              {feedbackHistory.length === 0 ? (
                <p className="text-zinc-500">Select a run to see feedback history.</p>
              ) : (
                feedbackHistory.map((fb, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 p-2">
                    <div>
                      <span className="font-semibold">{fb.decision}</span>{" "}
                      <span className="text-zinc-500">({fb.reason_code || "no_reason"})</span>
                    </div>
                    <div className="text-zinc-500">{fb.notes}</div>
                    <div className="text-[10px] text-zinc-400">{fb.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Output" subtitle={loading ? "Loading..." : "Latest response from the API"} />
            <div className="mt-4">
              {error && <p className="mb-2 text-sm text-red-600">Error: {error}</p>}
              {output ? <JsonBlock data={output} /> : <p>No output yet.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
