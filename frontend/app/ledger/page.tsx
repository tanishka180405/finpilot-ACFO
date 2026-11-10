"use client";

import Sidebar from "@/components/Sidebar";
import AgentLedger from "@/components/AgentLedger";
import { useBusiness } from "@/components/BusinessProvider";

export default function LedgerPage() {
  const { activeBusinessId } = useBusiness();
  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-6xl">
        <h1 className="font-display text-2xl font-semibold text-white">Agent ledger</h1>
        <p className="text-sm text-ash-400 mt-1 mb-8">Auditable history of every completed agent run</p>
        {activeBusinessId ? <AgentLedger businessId={activeBusinessId} /> : <p className="text-sm text-ash-400">Create or select a business to view the ledger.</p>}
      </main>
    </div>
  );
}
