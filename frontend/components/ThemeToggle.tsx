"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("finpilot_theme");
    const useLight = saved === "light";
    setLight(useLight);
    document.documentElement.classList.toggle("light", useLight);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    window.localStorage.setItem("finpilot_theme", next ? "light" : "dark");
  }

  return <button type="button" onClick={toggle} aria-label={`Switch to ${light ? "dark" : "light"} mode`} className="mt-3 flex w-full items-center justify-between rounded-lg border border-ink-600 px-3 py-2 text-xs text-ash-300 transition hover:border-signal-indigo hover:text-white"><span>{light ? "☀ Light mode" : "☾ Dark mode"}</span><span className="text-[10px]">{light ? "ON" : "ON"}</span></button>;
}
