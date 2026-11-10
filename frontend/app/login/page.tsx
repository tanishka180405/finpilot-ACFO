"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "signup" && result.data.user && result.data.user.identities?.length === 0) {
      setMode("login");
      setMessage("This email already has an account. Sign in with your existing password.");
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your address, then sign in.");
    } else {
      router.replace("/dashboard");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-8">
        <p className="font-display text-2xl font-semibold text-white">Finpilot-Autonoumous CFO</p>
        <p className="mt-1 text-sm text-ash-400">Autonomous CFO</p>
        <h1 className="mt-8 font-display text-xl text-white">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-xs text-ash-400">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-signal-indigo" /></label>
          <label className="block text-xs text-ash-400">Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-signal-indigo" /></label>
          {message && <p className="text-sm text-signal-amber">{message}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-signal-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }} className="mt-5 text-sm text-signal-indigo hover:text-white">{mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
        <a href="/demo" className="mt-4 block text-center text-sm text-ash-400 hover:text-white">View healthy and unhealthy demo</a>
      </div>
    </main>
  );
}
