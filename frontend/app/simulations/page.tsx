"use client";

import { FormEvent, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "@/components/Sidebar";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

type SimulationResponse = {
  assumptions: { additional_employees: number; monthly_salary: number; start_after_months: number; monthly_hiring_cost: number };
  baseline_runway_months: number | null;
  scenario_runway_months: number | null;
  scenario_end_cash: number;
  total_cash_impact: number;
  summary: string;
  forecast: { month: string; baseline_net_cashflow: number; scenario_net_cashflow: number }[];
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function SimulationsPage() {
  const { activeBusinessId } = useBusiness();
  const [employees, setEmployees] = useState(10);
  const [salary, setSalary] = useState(45000);
  const [startAfterMonths, setStartAfterMonths] = useState(3);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!activeBusinessId) throw new Error("Create or select a business first.");
      const response = await apiFetch(`/api/agents/simulation/${activeBusinessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additional_employees: employees,
          monthly_salary: salary,
          start_after_months: startAfterMonths,
          forecast_months: 12,
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      setResult(await response.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run simulation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-6xl">
        <h1 className="font-display text-2xl font-semibold text-white">Hiring simulation</h1>
        <p className="text-sm text-ash-400 mt-1 mb-8">Test how an additional payroll commitment affects cash flow and runway.</p>

        <form onSubmit={runSimulation} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-ink-800 border border-ink-700 rounded-xl p-5 mb-6">
          <Field label="New employees" value={employees} onChange={setEmployees} min={1} />
          <Field label="Monthly salary (INR)" value={salary} onChange={setSalary} min={1} step={1} />
          <Field label="Start after months" value={startAfterMonths} onChange={setStartAfterMonths} min={0} max={23} />
          <button disabled={loading} className="self-end rounded-lg bg-signal-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {loading ? "Running simulation..." : "Run simulation"}
          </button>
        </form>

        {error && <p className="mb-6 rounded-lg border border-signal-rose/30 bg-signal-rose/10 p-4 text-sm text-signal-rose">{error}</p>}

        {result && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Metric label="Monthly payroll added" value={formatINR(result.assumptions.monthly_hiring_cost)} />
              <Metric label="Twelve-month cash impact" value={`-${formatINR(result.total_cash_impact)}`} tone="warn" />
              <Metric label="Scenario runway" value={result.scenario_runway_months ? `${result.scenario_runway_months} months` : "Healthy"} tone={result.scenario_runway_months ? "warn" : "good"} />
            </div>
            <div className="mb-6 rounded-xl border border-ink-700 bg-ink-800 p-5 text-sm text-ash-200">{result.summary}</div>
            <div className="h-96 rounded-xl border border-ink-700 bg-ink-800 p-5">
              <p className="mb-4 font-display text-sm font-medium text-white">Net cash flow: baseline vs. hiring scenario</p>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={result.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2438" vertical={false} />
                  <XAxis dataKey="month" stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B96AC" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#121A2B", border: "1px solid #28344C", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="baseline_net_cashflow" name="Baseline" stroke="#34D399" strokeWidth={2} />
                  <Line type="monotone" dataKey="scenario_net_cashflow" name="Hiring scenario" stroke="#F5B94D" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (value: number) => void; min: number; max?: number; step?: number }) {
  return <label className="text-xs text-ash-400">{label}<input type="number" value={value} min={min} max={max} step={step ?? 1} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-signal-indigo" /></label>;
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" }) {
  const color = tone === "good" ? "text-signal-emerald" : tone === "warn" ? "text-signal-amber" : "text-white";
  return <div className="rounded-xl border border-ink-700 bg-ink-800 p-5"><p className="text-xs uppercase tracking-wide text-ash-400">{label}</p><p className={`mt-2 font-mono text-2xl ${color}`}>{value}</p></div>;
}
