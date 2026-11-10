"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";
  const isDemoPage = pathname === "/demo";

  if (authDisabled) return <>{children}</>;
  const [checking, setChecking] = useState(true);
  const [authUnavailable, setAuthUnavailable] = useState(false);

  useEffect(() => {
    if (isDemoPage) {
      setChecking(false);
      return;
    }
    let active = true;

    async function checkSession() {
      let data: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"] | null = null;
      let timedOut = false;
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase request timed out")), 8000)),
        ]);
        data = result.data;
      } catch {
        timedOut = true;
        if (active) {
          setAuthUnavailable(true);
          if (pathname !== "/login") router.replace("/demo");
        }
      }
      if (!active) return;
      if (!data?.session && pathname !== "/login" && !timedOut) {
        router.replace("/login");
      }
      setChecking(false);
    }

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login") router.replace("/login");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [isDemoPage, pathname, router]);

  if (isDemoPage) return <>{children}</>;

  if (pathname !== "/login" && checking) {
    return <main className="min-h-screen bg-ink-900" aria-label="Checking your session" />;
  }

  if (pathname !== "/login" && authUnavailable && pathname !== "/demo") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-8 text-center">
          <h1 className="font-display text-xl text-white">Sign-in service unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-ash-400">
            Finpilot is running locally, but it cannot reach Supabase. The offline presentation demo is available instead.
          </p>
          <button onClick={() => { window.location.href = "/demo"; }} className="mt-6 rounded-lg bg-signal-indigo px-4 py-2.5 text-sm font-medium text-white">
            Open demo
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
