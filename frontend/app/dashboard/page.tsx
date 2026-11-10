"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import AgentLedger from "@/components/AgentLedger";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

type CashflowResponse = {
  summary: string;
  current_cash_position: number;
  runway_months: number | null;
  historical: { month: string; net_cashflow: number }[];
  forecast: {
    month: string;
    predicted_net_cashflow: number;
    lower_bound: number;
    upper_bound: number;
  }[];
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneColor =
    tone === "good" ? "text-signal-emerald" : tone === "warn" ? "text-signal-amber" : "text-white";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/90 p-5 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-signal-indigo/40">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${tone === "good" ? "bg-signal-emerald" : tone === "warn" ? "bg-signal-amber" : "bg-signal-indigo"}`} />
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ash-400">{label}</p>
      <p className={`mt-3 font-mono text-2xl font-semibold tabular ${toneColor}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-ash-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  return <AuthenticatedDashboard />;
}

function AuthenticatedDashboard() {
  const { activeBusinessId, businesses } = useBusiness();
  const activeBusiness = businesses.find((business) => business.id === activeBusinessId);
  const [data, setData] = useState<CashflowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusinessId) {
      setLoading(false);
      setError("Create or select a business to view its forecast.");
      return;
    }
    setLoading(true);
    apiFetch(`/api/agents/cashflow/${activeBusinessId}?months=12`)
      .then((res) => {
        return res.text().then((raw) => {
          if (res.ok) {
            try { return JSON.parse(raw); } catch { throw new Error("The backend returned an invalid response."); }
          }
          try {
            const body = JSON.parse(raw);
            throw new Error(body.detail || `API error: ${res.status}`);
          } catch (error) {
            if (error instanceof Error && error.message !== `API error: ${res.status}`) throw error;
            throw new Error(raw || `API error: ${res.status}`);
          }
        });
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeBusinessId]);

  const chartData = data
    ? [
        ...data.historical.map((h) => ({ month: h.month, actual: h.net_cashflow, cashflow: h.net_cashflow, positiveCashflow: h.net_cashflow >= 0 ? h.net_cashflow : null, negativeCashflow: h.net_cashflow < 0 ? h.net_cashflow : null })),
        ...data.forecast.map((f) => ({
          month: f.month,
          predicted: f.predicted_net_cashflow,
          cashflow: f.predicted_net_cashflow,
          positiveCashflow: f.predicted_net_cashflow >= 0 ? f.predicted_net_cashflow : null,
          negativeCashflow: f.predicted_net_cashflow < 0 ? f.predicted_net_cashflow : null,
          lower: f.lower_bound,
          upper: f.upper_bound,
        })),
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_35%)] px-5 py-7 md:px-10 md:py-9">
        <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-signal-indigo">Financial command center</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Overview</h1>
            <p className="mt-2 text-sm text-ash-400">{activeBusiness?.name || "No business selected"} <span className="mx-1 text-ink-600">•</span> updated moments ago</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-signal-emerald/20 bg-signal-emerald/10 px-3 py-1.5 text-xs font-mono text-signal-emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-emerald" />
            LIVE MONITORING
          </div>
        </div>

        {loading && <p className="text-ash-400 text-sm font-mono">Loading forecast...</p>}

        {error && (
          <div className="bg-signal-rose/10 border border-signal-rose/30 text-signal-rose text-sm p-4 rounded-lg mb-6">
            <p>{error}</p>
            {(error.toLowerCase().includes("not enough") || error.toLowerCase().includes("transaction")) && (
              <p className="mt-2 text-ash-300">Use “Load demo financial data” in the sidebar, or add transactions from the Transactions page.</p>
            )}
          </div>
        )}

        {data && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <KpiCard label="Cash position" value={formatINR(data.current_cash_position)} tone={data.current_cash_position < 0 ? "warn" : "good"} />
              <KpiCard
                label="Runway"
                value={data.runway_months ? `${data.runway_months} mo` : "Healthy"}
                tone={data.runway_months ? "warn" : "good"}
              />
              <KpiCard label="Forecast horizon" value="12 months" sub="80% confidence interval" />
            </div>

            <div className="mb-6 rounded-2xl border border-signal-indigo/20 bg-gradient-to-r from-signal-indigo/10 via-ink-800 to-ink-800 p-5 shadow-lg shadow-black/10">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-signal-indigo">CFO insight</p>
              <p className="text-sm leading-relaxed text-ash-200">{data.summary}</p>
            </div>

            <div className="mb-6 h-80 rounded-2xl border border-ink-700 bg-ink-800/90 p-5 shadow-lg shadow-black/10">
              <p className="mb-1 font-display text-sm font-medium text-white">
                Net cash flow — actual vs. forecast
              </p>
              <p className="mb-4 text-xs text-ash-400">Actual performance compared with forecast</p>
              <ResponsiveContainer width="100%" height="85%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="negativeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB7185" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#FB7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2438" vertical={false} />
                  <XAxis dataKey="month" stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121A2B",
                      border: "1px solid #28344C",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="cashflow" name="Monthly cash flow" stroke="#FBBF24" strokeWidth={2.5} dot={({ cx, cy, payload }) => <circle cx={cx} cy={cy} r={4} fill={payload.cashflow < 0 ? "#FB7185" : "#34D399"} stroke="#121A2B" strokeWidth={2} />} activeDot={{ r: 6 }} />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#6366F1"
                    fill="url(#predictedFill)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <AgentLedger businessId={activeBusinessId || ""} />
          </>
        )}
        </div>
      </main>
    </div>
  );
}
