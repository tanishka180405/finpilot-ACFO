"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

type Transaction = { date: string; amount: number; category: string; type: "income" | "expense"; description?: string };

function normalizeDate(value: string) {
  const cleaned = value.trim().replaceAll("/", "-");
  const dayFirst = /^(\d{2})-(\d{2})-(\d{4})$/.exec(cleaned);
  return dayFirst ? `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}` : cleaned;
}

function formatApiError(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return `${detail[0].loc?.join(".") || "Input"}: ${detail[0].msg}`;
  return "Unable to save transactions. Check the CSV values and try again.";
}

export default function TransactionsPage() {
  const { activeBusinessId } = useBusiness();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [savedRows, setSavedRows] = useState<(Transaction & { id?: string })[]>([]);
  const [form, setForm] = useState<Transaction>({ date: new Date().toISOString().slice(0, 10), amount: 0, category: "subscription_revenue", type: "income", description: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadSavedRows() {
    if (!activeBusinessId) return;
    const response = await apiFetch(`/api/businesses/${activeBusinessId}/transactions`);
    if (response.ok) setSavedRows((await response.json()).transactions || []);
  }

  useEffect(() => { loadSavedRows(); }, [activeBusinessId]);

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
      const amount = Number(row.amount);
      return { date: normalizeDate(row.date), amount: Math.abs(amount), category: row.category || "other", type: row.type === "expense" ? "expense" : "income", description: row.description } as Transaction;
    }).filter((row) => row.date && Number.isFinite(row.amount));
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRows(parseCsv(await file.text()));
    setMessage(null);
  }

  async function saveRows(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeBusinessId || rows.length === 0) return setMessage("Add at least one transaction first.");
    setSaving(true);
    const response = await apiFetch(`/api/businesses/${activeBusinessId}/transactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactions: rows }) });
    const body = await response.json();
    setMessage(response.ok ? `${body.created} transactions saved.` : formatApiError(body.detail));
    if (response.ok) setRows([]);
    if (response.ok) loadSavedRows();
    setSaving(false);
  }

  function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRows((current) => [...current, form]);
    setForm({ ...form, amount: 0, description: "" });
  }

  return (
    <div className="flex min-h-screen bg-ink-900"><Sidebar /><main className="flex-1 max-w-6xl px-10 py-8">
      <h1 className="font-display text-2xl font-semibold text-white">Transactions</h1>
      <p className="mt-1 mb-8 text-sm text-ash-400">Import a CSV or add income and expenses manually.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-ink-700 bg-ink-800 p-5"><h2 className="font-display text-sm text-white">CSV import</h2><p className="mt-2 text-xs text-ash-400">Required columns: date, amount, category, type. Type must be income or expense.</p><input type="file" accept=".csv,text/csv" onChange={importFile} className="mt-5 block w-full text-sm text-ash-300 file:mr-3 file:rounded-md file:border-0 file:bg-signal-indigo file:px-3 file:py-2 file:text-xs file:text-white" /></section>
        <form onSubmit={addManual} className="rounded-xl border border-ink-700 bg-ink-800 p-5"><h2 className="font-display text-sm text-white">Manual entry</h2><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs text-ash-400">Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-2 w-full rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-xs text-white" /></label><label className="text-xs text-ash-400">Amount<input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="mt-2 w-full rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-xs text-white" /></label><label className="text-xs text-ash-400">Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-xs text-white" /></label><label className="text-xs text-ash-400">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Transaction["type"] })} className="mt-2 w-full rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-xs text-white"><option value="income">Income</option><option value="expense">Expense</option></select></label></div><button className="mt-4 rounded-md border border-signal-indigo/50 px-3 py-2 text-xs text-signal-indigo">Add to batch</button></form>
      </div>
      <form onSubmit={saveRows} className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-5"><div className="flex items-center justify-between"><h2 className="font-display text-sm text-white">Ready to save ({rows.length})</h2><button disabled={saving || rows.length === 0} className="rounded-md bg-signal-indigo px-4 py-2 text-xs text-white disabled:opacity-50">{saving ? "Saving..." : "Save transactions"}</button></div>{rows.length > 0 && <div className="mt-4 max-h-64 overflow-auto divide-y divide-ink-700">{rows.map((row, index) => <div key={`${row.date}-${index}`} className="flex justify-between py-2 text-xs"><span className="font-mono text-ash-400">{row.date} · {row.category}</span><span className={row.type === "income" ? "text-signal-emerald" : "text-signal-rose"}>{row.type === "income" ? "+" : "-"}₹{row.amount.toLocaleString("en-IN")}</span></div>)}</div>}{message && <p className="mt-4 text-sm text-ash-300">{message}</p>}</form>
      <div className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-5"><h2 className="font-display text-sm text-white">Saved transactions ({savedRows.length})</h2><div className="mt-3 max-h-64 overflow-auto divide-y divide-ink-700">{savedRows.map((row) => <div key={row.id} className="flex justify-between py-2 text-xs"><span className="font-mono text-ash-400">{row.date} · {row.category}</span><span className={Number(row.amount) >= 0 ? "text-signal-emerald" : "text-signal-rose"}>{Number(row.amount) >= 0 ? "+" : "-"}₹{Math.abs(Number(row.amount)).toLocaleString("en-IN")}</span></div>)}{savedRows.length === 0 && <p className="py-3 text-xs text-ash-400">No saved transactions for this business yet.</p>}</div></div>
    </main></div>
  );
}
