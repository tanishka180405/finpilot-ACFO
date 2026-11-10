"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Sidebar from "@/components/Sidebar";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

type RevenueResponse = {
  latest_monthly_revenue: number;
  projected_monthly_revenue: number;
  growth_rate: number;
  summary: string;
  historical: { month: string; revenue: number }[];
  forecast: { month: string; predicted_revenue: number }[];
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RevenuePage() {
  const { activeBusinessId } = useBusiness();
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusinessId) return;
    apiFetch(`/api/agents/revenue/${activeBusinessId}?months=12`)
      .then((response) => {
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [activeBusinessId]);

  const chartData = data
    ? [
        ...data.historical.map((item) => ({ month: item.month, actual: item.revenue })),
        ...data.forecast.map((item) => ({ month: item.month, predicted: item.predicted_revenue })),
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-6xl">
        <h1 className="font-display text-2xl font-semibold text-white">Revenue outlook</h1>
        <p className="text-sm text-ash-400 mt-1 mb-8">Subscription revenue trend and twelve-month projection</p>

        {!data && !error && <p className="text-sm font-mono text-ash-400">Forecasting revenue...</p>}
        {error && <p className="rounded-lg border border-signal-rose/30 bg-signal-rose/10 p-4 text-sm text-signal-rose">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Metric label="Latest MRR" value={formatINR(data.latest_monthly_revenue)} />
              <Metric label="Projected MRR" value={formatINR(data.projected_monthly_revenue)} />
              <Metric label="12-month trend" value={`${data.growth_rate >= 0 ? "+" : ""}${data.growth_rate}%`} positive={data.growth_rate >= 0} />
            </div>
            <div className="bg-ink-800 border border-ink-700 rounded-xl p-5 mb-6 text-sm text-ash-200">{data.summary}</div>
            <div className="bg-ink-800 border border-ink-700 rounded-xl p-5 h-96">
              <p className="font-display text-sm font-medium text-white mb-4">Monthly subscription revenue</p>
              <ResponsiveContainer width="100%" height="88%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2438" vertical={false} />
                  <XAxis dataKey="month" stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#121A2B", border: "1px solid #28344C", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="actual" stroke="#34D399" fill="url(#revenueFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="predicted" stroke="#6366F1" fill="url(#revenueFill)" strokeDasharray="4 4" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl p-5">
      <p className="text-xs text-ash-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 font-mono text-2xl ${positive === undefined ? "text-white" : positive ? "text-signal-emerald" : "text-signal-rose"}`}>{value}</p>
    </div>
  );
}
