export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-ink-900 p-8">
      <p className="font-mono text-xs text-signal-indigo tracking-widest uppercase mb-4">
        Autonomous CFO Operating System
      </p>
      <h1 className="font-display text-5xl font-semibold text-white mb-4">
        Finpilot-Autonoumous CFO
      </h1>
      <p className="text-ash-400 mb-10 max-w-md text-center leading-relaxed">
        AI agents that watch your cash flow, forecast revenue, and simulate decisions before you make them.
      </p>
      <a
        href="/dashboard"
        className="px-6 py-3 bg-signal-indigo text-white rounded-lg font-medium hover:bg-signal-indigo/90 transition"
      >
        Open dashboard
      </a>
    </main>
  );
}
