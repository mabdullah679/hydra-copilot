"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type Tab = "dashboard" | "invoice" | "contract" | "marketing" | "feedback";

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
    <pre className="max-h-[420px] overflow-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<unknown>(null);
  const [runs, setRuns] = useState<Array<Record<string, unknown>>>([]);
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<Array<Record<string, unknown>>>([]);

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
  const [feedbackRunId, setFeedbackRunId] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState("approved");
  const [feedbackReason, setFeedbackReason] = useState("meets_brand");
  const [feedbackNotes, setFeedbackNotes] = useState("Looks good");
  const [runIdLookup, setRunIdLookup] = useState("");

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
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function fetchRuns() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/runs?limit=20`);
      const data = await res.json();
      setRuns(data.runs ?? []);
      setOutput(data);
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/events`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setOutput(data);
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeedback(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback/${runId}`);
      const data = await res.json();
      setFeedbackHistory(data.feedback ?? []);
      setOutput(data);
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

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
                  subtitle="Pull the latest run statuses for quick inspection."
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchRuns}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Fetch runs
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">run_id</th>
                        <th className="px-3 py-2">workflow</th>
                        <th className="px-3 py-2">status</th>
                        <th className="px-3 py-2">created</th>
                        <th className="px-3 py-2">actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r) => (
                        <tr key={r.run_id} className="border-t border-zinc-200">
                          <td className="px-3 py-2 font-mono text-xs">{r.run_id}</td>
                          <td className="px-3 py-2">{r.workflow}</td>
                          <td className="px-3 py-2">{r.status}</td>
                          <td className="px-3 py-2 text-xs">{r.created_at}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => apiFetch(`/runs/${r.run_id}`)}
                                className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                              >
                                View
                              </button>
                              <button
                                onClick={() => fetchEvents(r.run_id)}
                                className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                              >
                                Events
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {runs.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-zinc-500" colSpan={5}>
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
                    })
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
                    })
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
                    })
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
                <input
                  value={feedbackRunId}
                  onChange={(e) => setFeedbackRunId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                  placeholder="run_id"
                />
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
                  onClick={() =>
                    apiFetch("/feedback", {
                      method: "POST",
                      body: JSON.stringify({
                        run_id: feedbackRunId,
                        workflow: "marketing",
                        decision: feedbackDecision,
                        reason_code: feedbackReason,
                        notes: feedbackNotes,
                      }),
                    })
                  }
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Submit feedback
                </button>
                <button
                  onClick={() => fetchFeedback(feedbackRunId)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium"
                >
                  Load feedback history
                </button>
                <div className="rounded-xl border border-zinc-200 p-3 text-xs text-zinc-700">
                  {feedbackHistory.length === 0 ? (
                    <div className="text-zinc-500">No feedback history loaded.</div>
                  ) : (
                    <div className="space-y-2">
                      {feedbackHistory.map((fb, idx) => (
                        <div key={idx} className="rounded-lg border border-zinc-200 p-2">
                          <div>
                            <span className="font-semibold">{fb.decision}</span>{" "}
                            <span className="text-zinc-500">({fb.reason_code || "no_reason"})</span>
                          </div>
                          <div className="text-zinc-500">{fb.notes}</div>
                          <div className="text-[10px] text-zinc-400">{fb.created_at}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Timeline" subtitle="Ordered audit events for the last selected run." />
            <div className="mt-4 space-y-3 text-sm">
              {events.length === 0 ? (
                <p className="text-zinc-500">No events loaded. Use “Events” on a run.</p>
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
            <SectionTitle title="Output" subtitle={loading ? "Loading..." : "Latest response from the API"} />
            <div className="mt-4">{output ? <JsonBlock data={output} /> : <p>No output yet.</p>}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Fetch by run_id" subtitle="Get full run or events for a specific run." />
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                value={runIdLookup}
                onChange={(e) => setRunIdLookup(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 p-3 text-sm"
                placeholder="run_id"
              />
              <button
                onClick={() => apiFetch(`/runs/${runIdLookup}`)}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Get run
              </button>
              <button
                onClick={() => apiFetch(`/runs/${runIdLookup}/events`)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium"
              >
                Get events
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
