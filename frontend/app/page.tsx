import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-6 py-12 text-white">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-signal-indigo/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-signal-emerald/10 blur-3xl" />
      <section className="relative w-full max-w-4xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-indigo text-2xl font-semibold shadow-2xl shadow-signal-indigo/30">F</div>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-signal-indigo">Autonomous CFO operating system</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">Financial clarity, powered by agents.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ash-400 sm:text-lg">Finpilot watches your cash flow, forecasts revenue, and simulates decisions before you make them.</p>
        <Link href="/dashboard" className="mt-9 inline-flex items-center gap-3 rounded-xl bg-signal-indigo px-6 py-3.5 font-medium text-white shadow-xl shadow-signal-indigo/25 transition hover:-translate-y-0.5 hover:bg-indigo-500">Open dashboard <span aria-hidden="true">→</span></Link>
        <div className="mx-auto mt-16 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          {[['01', 'Cash flow', 'See positive and negative months clearly.'], ['02', 'Revenue', 'Understand growth and changing trends.'], ['03', 'Agents', 'Get recommendations before decisions.']].map(([number, title, text]) => <div key={title} className="rounded-2xl border border-ink-700 bg-ink-800/70 p-5"><p className="font-mono text-xs text-signal-indigo">{number}</p><p className="mt-4 font-display text-base">{title}</p><p className="mt-2 text-xs leading-relaxed text-ash-400">{text}</p></div>)}
        </div>
      </section>
    </main>
  );
}
