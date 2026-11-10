"use client";

import { FormEvent, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useBusiness } from "@/components/BusinessProvider";
import { apiFetch } from "@/lib/api";

const EXAMPLE_QUESTION = "Can I afford to hire 10 people next quarter?";

type ChatResponse = {
  intent: string;
  answer: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const { activeBusinessId } = useBusiness();
  const [question, setQuestion] = useState(EXAMPLE_QUESTION);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setMessages((current) => [...current, { role: "user", text: trimmedQuestion }]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      if (!activeBusinessId) throw new Error("Create or select a business first.");
      const response = await apiFetch(`/api/chat/${activeBusinessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const answer: ChatResponse = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: answer.answer }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to answer that question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex flex-1 flex-col px-10 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white">Ask Finpilot-Autonoumous CFO</h1>
          <p className="mt-1 text-sm text-ash-400">Ask a financial question and Finpilot-Autonoumous CFO routes it to the right analysis agent.</p>
        </div>

        <div className="flex-1 rounded-xl border border-ink-700 bg-ink-800 p-5 space-y-4 min-h-80">
          {messages.length === 0 && (
            <div className="rounded-lg border border-signal-indigo/30 bg-signal-indigo/10 p-4 text-sm text-ash-200">
              Try the prepared question below, or ask about cash flow, revenue, or hiring plans.
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`max-w-3xl rounded-xl p-4 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-signal-indigo text-white" : "border border-ink-700 bg-ink-900 text-ash-200"}`}>
              <p className="mb-1 font-mono text-[11px] uppercase opacity-70">{message.role === "user" ? "You" : "Finpilot-Autonoumous CFO Supervisor"}</p>
              {message.text}
            </div>
          ))}
          {loading && <p className="font-mono text-sm text-ash-400">Routing question and running analysis...</p>}
        </div>

        {error && <p className="mt-4 text-sm text-signal-rose">Unable to answer: {error}</p>}
        <form onSubmit={ask} className="mt-5 flex gap-3">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a financial question..." className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-sm text-white outline-none placeholder:text-ash-400 focus:border-signal-indigo" />
          <button disabled={loading} className="rounded-lg bg-signal-indigo px-5 py-3 text-sm font-medium text-white disabled:opacity-60">Ask Finpilot-Autonoumous CFO</button>
        </form>
      </main>
    </div>
  );
}
