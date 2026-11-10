"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
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
    <div className="bg-ink-800 border border-ink-700 rounded-xl p-5">
      <p className="text-xs text-ash-400 uppercase tracking-wide">{label}</p>
      <p className={`font-mono text-2xl mt-2 tabular ${toneColor}`}>{value}</p>
      {sub && <p className="text-xs text-ash-400 mt-1">{sub}</p>}
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
        ...data.historical.map((h) => ({ month: h.month, actual: h.net_cashflow })),
        ...data.forecast.map((f) => ({
          month: f.month,
          predicted: f.predicted_net_cashflow,
          lower: f.lower_bound,
          upper: f.upper_bound,
        })),
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />

      <main className="flex-1 px-10 py-8 max-w-6xl">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">Overview</h1>
            <p className="text-sm text-ash-400 mt-1">{activeBusiness?.name || "No business selected"} · updated moments ago</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-ash-400 border border-ink-700 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-emerald" />
            live
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
            <div className="grid grid-cols-3 gap-4 mb-6">
              <KpiCard label="Cash position" value={formatINR(data.current_cash_position)} />
              <KpiCard
                label="Runway"
                value={data.runway_months ? `${data.runway_months} mo` : "Healthy"}
                tone={data.runway_months ? "warn" : "good"}
              />
              <KpiCard label="Forecast horizon" value="12 months" sub="80% confidence interval" />
            </div>

            <div className="bg-ink-800 border border-ink-700 rounded-xl p-5 mb-6">
              <p className="text-sm text-ash-200 leading-relaxed">{data.summary}</p>
            </div>

            <div className="bg-ink-800 border border-ink-700 rounded-xl p-5 mb-6 h-80">
              <p className="font-display text-sm font-medium text-white mb-4">
                Net cash flow — actual vs. forecast
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="actual" stroke="#34D399" fill="url(#actualFill)" strokeWidth={2} />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#6366F1"
                    fill="url(#predictedFill)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <AgentLedger businessId={activeBusinessId || ""} />
          </>
        )}
      </main>
    </div>
  );
}
