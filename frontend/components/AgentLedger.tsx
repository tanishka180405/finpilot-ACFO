"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type LedgerEntry = {
  time: string;
  agent: string;
  action: string;
  status: "ok" | "warn" | "info";
};

type ApiRun = {
  id: string;
  agent_type: string;
  output_summary: string | null;
  status: string;
  created_at: string;
};

const MOCK_ENTRIES: LedgerEntry[] = [
  { time: "09:41:12", agent: "cashflow", action: "Forecast recomputed — 12mo horizon, runway stable", status: "ok" },
  { time: "09:41:09", agent: "supervisor", action: "Routed query to cashflow agent", status: "info" },
  { time: "08:15:44", agent: "revenue", action: "Monthly revenue trend updated (+6.2% MoM)", status: "ok" },
  { time: "07:02:31", agent: "simulation", action: "Ran scenario: +10 hires, Q3 — runway drops to 4mo", status: "warn" },
  { time: "06:58:02", agent: "cashflow", action: "Scheduled forecast refresh completed", status: "ok" },
];

const STATUS_COLOR: Record<LedgerEntry["status"], string> = {
  ok: "bg-signal-emerald",
  warn: "bg-signal-amber",
  info: "bg-signal-indigo",
};

function toLedgerStatus(status: string): LedgerEntry["status"] {
  if (status === "completed") return "ok";
  if (status === "failed" || status === "error") return "warn";
  return "info";
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export default function AgentLedger({ businessId }: { businessId: string }) {
  const [entries, setEntries] = useState<ApiRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/agent-runs/${businessId}?limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((json: { runs: ApiRun[] }) => setEntries(json.runs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [businessId]);

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-medium text-white">Agent ledger</p>
          <p className="text-xs text-ash-400 mt-0.5">Live audit trail of every agent decision</p>
        </div>
        <span className="text-[11px] font-mono text-ash-400 border border-ink-600 rounded-md px-2 py-1">
          agent_runs
        </span>
      </div>

      <div className="divide-y divide-ink-700">
        {loading && <p className="px-5 py-4 text-sm font-mono text-ash-400">Loading audit trail...</p>}
        {error && <p className="px-5 py-4 text-sm text-signal-rose">Unable to load agent ledger: {error}</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="px-5 py-4 text-sm text-ash-400">No agent runs recorded yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-ink-700/40 transition">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOR[toLedgerStatus(entry.status)]}`} />
            <span className="font-mono text-xs text-ash-400 shrink-0 w-20 tabular">{formatTime(entry.created_at)}</span>
            <span className="font-mono text-xs text-signal-indigo shrink-0 w-24">{entry.agent_type}</span>
            <span className="text-sm text-ash-200 leading-snug">
              {entry.output_summary || `Agent run ${entry.status}.`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
