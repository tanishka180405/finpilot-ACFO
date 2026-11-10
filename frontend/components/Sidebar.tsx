"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBusiness } from "@/components/BusinessProvider";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Ask Finpilot-Autonoumous CFO", href: "/chat" },
  { label: "Cash flow", href: "/cashflow" },
  { label: "Revenue", href: "/revenue" },
  { label: "Transactions", href: "/transactions" },
  { label: "Invoices", href: "/invoices" },
  { label: "Payroll", href: "/payroll" },
  { label: "Simulations", href: "/simulations" },
  { label: "Ledger", href: "/ledger" },
];

const OFFLINE_DEMOS = [
  { id: "demo-healthy", name: "Northstar Labs (Healthy)" },
  { id: "demo-mixed", name: "Orbit Services (Mixed)" },
  { id: "demo-unhealthy", name: "Redline Retail (Unhealthy)" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { businesses, activeBusinessId, loading: businessesLoading, setActiveBusinessId, createBusiness, seedDemoData, seedUnhealthyDemoData } = useBusiness();
  const visibleBusinesses = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true" && businesses.length === 0 ? OFFLINE_DEMOS : businesses;
  const [newBusinessName, setNewBusinessName] = useState("");
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function addBusiness() {
    const created = await createBusiness(newBusinessName);
    if (created) setNewBusinessName("");
  }

  async function loadDemoData() {
    if (!activeBusinessId) return;
    setDataMessage("Loading...");
    setDataMessage(await seedDemoData(activeBusinessId));
  }

  async function loadUnhealthyDemoData() {
    if (!activeBusinessId) return;
    setDataMessage("Loading unhealthy scenario...");
    setDataMessage(await seedUnhealthyDemoData(activeBusinessId));
  }

  return (
    <aside className="w-60 shrink-0 border-r border-ink-700 bg-ink-950 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-ink-700">
        <p className="font-display font-semibold text-lg tracking-tight text-white">
          Finpilot-Autonoumous CFO
        </p>
        <p className="text-xs text-ash-400 mt-0.5">Autonomous CFO</p>
        {businessesLoading && visibleBusinesses.length === 0 ? <p className="mt-4 text-xs font-mono text-ash-400">Loading businesses...</p> : (
          <>
            {visibleBusinesses.length > 0 && <select value={activeBusinessId || "demo-healthy"} onChange={(event) => setActiveBusinessId(event.target.value)} className="mt-4 w-full rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-xs text-ash-200 outline-none">
              {visibleBusinesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
            </select>}
            {process.env.NEXT_PUBLIC_DISABLE_AUTH === "true" && <div className="mt-2 grid grid-cols-3 gap-1">
              {OFFLINE_DEMOS.map((demo) => <button key={demo.id} type="button" onClick={() => setActiveBusinessId(demo.id)} className={`rounded px-1 py-1.5 text-[10px] ${activeBusinessId === demo.id ? "bg-signal-indigo text-white" : "border border-ink-600 text-ash-400 hover:text-white"}`}>{demo.id === "demo-healthy" ? "Healthy" : demo.id === "demo-mixed" ? "Mixed" : "Unhealthy"}</button>)}
            </div>}
            <div className="mt-3">
              <p className="text-xs text-ash-400">Add another business</p>
              <div className="mt-2 flex gap-1"><input value={newBusinessName} onChange={(event) => setNewBusinessName(event.target.value)} placeholder="Business name" className="min-w-0 flex-1 rounded-md border border-ink-600 bg-ink-900 px-2 py-1.5 text-xs text-white" /><button onClick={addBusiness} className="rounded-md bg-signal-indigo px-2 text-xs text-white">Add</button></div>
            </div>
            {activeBusinessId && <button onClick={loadDemoData} className="mt-3 w-full rounded-md border border-signal-indigo/40 px-2 py-1.5 text-left text-xs text-signal-indigo hover:bg-signal-indigo/10">Load demo financial data</button>}
            {activeBusinessId && <button onClick={loadUnhealthyDemoData} className="mt-2 w-full rounded-md border border-signal-rose/40 px-2 py-1.5 text-left text-xs text-signal-rose hover:bg-signal-rose/10">Load unhealthy demo scenario</button>}
            {dataMessage && <p className="mt-2 text-[11px] text-ash-400">{dataMessage}</p>}
          </>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === item.href
                ? "bg-signal-indigo/10 text-white border border-signal-indigo/30"
                : "text-ash-400 hover:bg-ink-800 hover:text-ash-200 border border-transparent"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-ink-700">
        <div className="flex items-center gap-2 px-2">
          <span className="w-2 h-2 rounded-full bg-signal-emerald" />
          <p className="text-xs text-ash-400 font-mono">3 agents active</p>
        </div>
        <button onClick={signOut} className="mt-3 px-2 text-xs text-ash-400 hover:text-white">Sign out</button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
