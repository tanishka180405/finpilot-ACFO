"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

type CashflowResponse = {
  current_cash_position: number;
  runway_months: number | null;
  summary: string;
  forecast: { month: string; predicted_net_cashflow: number }[];
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function CashflowPage() {
  const { activeBusinessId } = useBusiness();
  const [data, setData] = useState<CashflowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusinessId) return;
    apiFetch(`/api/agents/cashflow/${activeBusinessId}?months=12`)
      .then((response) => {
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [activeBusinessId]);

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-6xl">
        <h1 className="font-display text-2xl font-semibold text-white">Cash flow</h1>
        <p className="text-sm text-ash-400 mt-1 mb-8">Cash position, runway, and twelve-month forecast</p>
        {!data && !error && <p className="text-sm font-mono text-ash-400">Loading cash flow forecast...</p>}
        {error && <p className="rounded-lg border border-signal-rose/30 bg-signal-rose/10 p-4 text-sm text-signal-rose">{error}</p>}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl">
              <Metric label="Cash position" value={formatINR(data.current_cash_position)} />
              <Metric label="Runway" value={data.runway_months ? `${data.runway_months} months` : "Healthy"} />
            </div>
            <div className="bg-ink-800 border border-ink-700 rounded-xl p-5 mb-6 text-sm text-ash-200">{data.summary}</div>
            <div className="bg-ink-800 border border-ink-700 rounded-xl overflow-hidden max-w-3xl">
              <div className="px-5 py-4 border-b border-ink-700 font-display text-sm font-medium text-white">Forecast months</div>
              {data.forecast.map((item) => (
                <div key={item.month} className="flex justify-between px-5 py-3 border-b border-ink-700 last:border-b-0 text-sm">
                  <span className="font-mono text-ash-400">{item.month}</span>
                  <span className={item.predicted_net_cashflow >= 0 ? "font-mono text-signal-emerald" : "font-mono text-signal-rose"}>{formatINR(item.predicted_net_cashflow)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-ink-800 border border-ink-700 rounded-xl p-5"><p className="text-xs text-ash-400 uppercase tracking-wide">{label}</p><p className="mt-2 font-mono text-2xl text-white">{value}</p></div>;
}
