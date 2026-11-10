"use client";

import Link from "next/link";
import { useBusiness } from "@/components/BusinessProvider";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const healthyRevenue = [420, 465, 510, 560, 615, 680, 735, 790, 850, 920, 985, 1050];
const unhealthyRevenue = [260, 244, 229, 215, 202, 190, 178, 168, 157, 148, 139, 131];
const mixedRevenue = [380, 430, 360, 510, 405, 590, 455, 620, 480, 680, 520, 735];
const healthyCashflow = [70, 82, 96, 110, 125, 140, 154, 170, 185, 201, 220, 238];
const unhealthyCashflow = [-390, -405, -421, -438, -454, -470, -487, -503, -520, -536, -552, -569];
const mixedCashflow = [90, 120, -130, -80, 75, 140, -180, 110, 95, -95, -60, 190];

function money(value: number) { return `₹${Math.abs(value).toLocaleString("en-IN")}k`; }

export default function OfflineDashboard() {
  const { activeBusinessId, setActiveBusinessId } = useBusiness();
  const scenario = activeBusinessId === "demo-unhealthy" ? "unhealthy" : activeBusinessId === "demo-mixed" ? "mixed" : "healthy";
  const healthy = scenario === "healthy";
  const mixed = scenario === "mixed";
  const revenue = healthy ? healthyRevenue : mixed ? mixedRevenue : unhealthyRevenue;
  const cashflow = healthy ? healthyCashflow : mixed ? mixedCashflow : unhealthyCashflow;

  return (
    <div className="flex min-h-screen bg-ink-900 text-white">
      <aside className="hidden w-64 shrink-0 border-r border-ink-700 bg-ink-950 md:flex md:flex-col">
        <div className="border-b border-ink-700 px-6 py-6"><p className="font-display text-lg font-semibold">Finpilot</p><p className="mt-1 text-xs text-ash-400">Autonomous CFO</p></div>
        <nav className="flex-1 space-y-1 px-3 py-4">{[
          ["Overview", "/dashboard"], ["Ask Finpilot", "/chat"], ["Cash flow", "/cashflow"], ["Revenue", "/revenue"],
          ["Transactions", "/transactions"], ["Invoices", "/invoices"], ["Payroll", "/payroll"], ["Simulations", "/simulations"], ["Ledger", "/ledger"],
        ].map(([item, href]) => <Link key={item} href={href} className={`block rounded-lg px-3 py-2.5 text-sm ${item === "Overview" ? "border border-signal-indigo/30 bg-signal-indigo/10 text-white" : "text-ash-400 hover:bg-ink-800 hover:text-white"}`}>{item}</Link>)}</nav>
        <div className="border-t border-ink-700 px-5 py-4 text-xs text-ash-400">Offline presentation mode</div>
      </aside>

      <main className="flex-1 px-5 py-7 md:px-10">
        <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-signal-indigo">Overview</p><h1 className="mt-2 font-display text-3xl font-semibold">{healthy ? "Northstar Labs" : mixed ? "Orbit Services" : "Redline Retail"}</h1><p className="mt-1 text-sm text-ash-400">12-month financial command center</p></div><div className="flex flex-wrap gap-2 rounded-lg border border-ink-700 bg-ink-800 p-1"><button onClick={() => setActiveBusinessId("demo-healthy")} className={`rounded-md px-3 py-2 text-xs ${healthy ? "bg-signal-emerald text-ink-950" : "text-ash-300"}`}>Healthy</button><button onClick={() => setActiveBusinessId("demo-mixed")} className={`rounded-md px-3 py-2 text-xs ${mixed ? "bg-signal-amber text-ink-950" : "text-ash-300"}`}>Mixed</button><button onClick={() => setActiveBusinessId("demo-unhealthy")} className={`rounded-md px-3 py-2 text-xs ${!healthy && !mixed ? "bg-signal-rose text-white" : "text-ash-300"}`}>Unhealthy</button></div></div>

          <div className="mt-8 grid gap-4 md:grid-cols-4"><Metric label="Cash position" value={healthy ? money(2840) : mixed ? money(620) : `-${money(1680)}`} tone={healthy ? "good" : mixed ? "neutral" : "bad"} /><Metric label="Runway" value={healthy ? "Healthy" : mixed ? "Watch closely" : "2 months"} tone={healthy ? "good" : mixed ? "neutral" : "bad"} /><Metric label="Latest revenue" value={money(revenue[11])} /><Metric label="Forecast horizon" value="12 months" /></div>

          <section className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg">Net cash flow</h2><p className="mt-1 text-xs text-ash-400">Actual trend and 12-month forecast</p></div><span className={`rounded-full px-3 py-1 text-xs ${healthy ? "bg-signal-emerald/10 text-signal-emerald" : mixed ? "bg-signal-amber/10 text-signal-amber" : "bg-signal-rose/10 text-signal-rose"}`}>{healthy ? "Positive cash flow" : mixed ? "Mixed cash flow" : "Negative cash flow"}</span></div><div className={`mt-5 rounded-lg border p-4 text-sm ${healthy ? "border-signal-emerald/30 bg-signal-emerald/10 text-signal-emerald" : mixed ? "border-signal-amber/30 bg-signal-amber/10 text-signal-amber" : "border-signal-rose/30 bg-signal-rose/10 text-signal-rose"}`}><strong>{healthy ? "Cash flow is positive." : mixed ? "Cash flow is mixed." : "Cash flow is negative."}</strong> {healthy ? "The company receives more cash than it spends, so reserves are growing." : mixed ? "Some months are profitable while others make a loss; cash timing and reserves need monitoring." : "The company spends more cash than it receives, so reserves are shrinking and costs need attention."}</div><div className="mt-8 grid grid-cols-12 items-end gap-2" style={{ height: 220 }}>{cashflow.map((value, index) => <div key={months[index]} className="flex h-full flex-col items-center justify-end gap-2"><div className={`w-full rounded-t ${value >= 0 ? "bg-signal-emerald" : "bg-signal-rose"}`} style={{ height: `${Math.max(14, Math.min(175, Math.abs(value) / 600 * 175))}px` }} /><span className="text-[10px] text-ash-400">{months[index]}</span></div>)}</div></section>

          <section className="mt-6 overflow-hidden rounded-xl border border-ink-700 bg-ink-800"><div className="border-b border-ink-700 px-5 py-4 font-display">Monthly forecast</div><div className="grid grid-cols-3 border-b border-ink-700 px-5 py-3 text-xs uppercase tracking-wide text-ash-400"><span>Month</span><span>Revenue</span><span>Net cash flow</span></div>{months.map((month, index) => <div key={month} className="grid grid-cols-3 border-b border-ink-700 px-5 py-3 text-sm last:border-0"><span className="font-mono text-ash-400">{month}</span><span className="font-mono">{money(revenue[index])}</span><span className={`font-mono ${cashflow[index] >= 0 ? "text-signal-emerald" : "text-signal-rose"}`}>{cashflow[index] >= 0 ? "" : "-"}{money(cashflow[index])}</span></div>)}</section>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) { const color = tone === "good" ? "text-signal-emerald" : tone === "bad" ? "text-signal-rose" : "text-white"; return <div className="rounded-xl border border-ink-700 bg-ink-800 p-5"><p className="text-xs uppercase tracking-wide text-ash-400">{label}</p><p className={`mt-2 font-mono text-2xl ${color}`}>{value}</p></div>; }
