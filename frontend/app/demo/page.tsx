"use client";

import { useState } from "react";

const healthy = [420, 465, 510, 560, 615, 680, 735, 790, 850, 920, 985, 1050];
const unhealthy = [260, 244, 229, 215, 202, 190, 178, 168, 157, 148, 139, 131];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}k`;
}

export default function DemoPage() {
  const [scenario, setScenario] = useState<"healthy" | "unhealthy">("healthy");
  const values = scenario === "healthy" ? healthy : unhealthy;
  const isHealthy = scenario === "healthy";

  return (
    <main className="min-h-screen bg-ink-900 px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-widest text-signal-indigo">Finpilot presentation demo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Healthy vs. unhealthy company</h1>
            <p className="mt-2 text-sm text-ash-400">Local demo data — no Supabase sign-in required.</p>
          </div>
          <div className="flex gap-2 rounded-lg border border-ink-700 bg-ink-800 p-1">
            <button onClick={() => setScenario("healthy")} className={`rounded-md px-4 py-2 text-sm ${isHealthy ? "bg-signal-emerald text-ink-950" : "text-ash-300"}`}>Healthy company</button>
            <button onClick={() => setScenario("unhealthy")} className={`rounded-md px-4 py-2 text-sm ${!isHealthy ? "bg-signal-rose text-white" : "text-ash-300"}`}>Unhealthy company</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Metric label="Scenario" value={isHealthy ? "Healthy" : "At risk"} tone={isHealthy ? "good" : "bad"} />
          <Metric label="Latest monthly revenue" value={formatINR(values[11])} />
          <Metric label="Cash-flow outlook" value={isHealthy ? "Positive" : "Negative"} tone={isHealthy ? "good" : "bad"} />
        </div>

        <section className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-5">
          <h2 className="font-display text-lg">12-month revenue trend</h2>
          <div className="mt-5 grid grid-cols-12 items-end gap-2" style={{ height: 220 }}>
            {values.map((value, index) => <div key={months[index]} className="flex h-full flex-col items-center justify-end gap-2"><div className={`w-full rounded-t ${isHealthy ? "bg-signal-emerald" : "bg-signal-rose"}`} style={{ height: `${Math.max(12, (value / 1100) * 180)}px` }} /><span className="text-[10px] text-ash-400">{months[index]}</span></div>)}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
          <div className="border-b border-ink-700 px-5 py-4 font-display">Monthly data</div>
          <div className="grid grid-cols-3 border-b border-ink-700 px-5 py-3 text-xs uppercase tracking-wide text-ash-400"><span>Month</span><span>Revenue</span><span>Assessment</span></div>
          {values.map((value, index) => <div key={months[index]} className="grid grid-cols-3 border-b border-ink-700 px-5 py-3 text-sm last:border-0"><span className="font-mono text-ash-400">{months[index]}</span><span className="font-mono">{formatINR(value)}</span><span className={isHealthy ? "text-signal-emerald" : "text-signal-rose"}>{isHealthy ? "Growing" : "Declining"}</span></div>)}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const color = tone === "good" ? "text-signal-emerald" : tone === "bad" ? "text-signal-rose" : "text-white";
  return <div className="rounded-xl border border-ink-700 bg-ink-800 p-5"><p className="text-xs uppercase tracking-wide text-ash-400">{label}</p><p className={`mt-2 font-mono text-2xl ${color}`}>{value}</p></div>;
}
