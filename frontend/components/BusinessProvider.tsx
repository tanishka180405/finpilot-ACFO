"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

type Business = { id: string; name: string; industry: string | null; currency: string | null };
type BusinessContextValue = {
  businesses: Business[];
  activeBusinessId: string | null;
  loading: boolean;
  createBusiness: (name: string) => Promise<string | null>;
  seedDemoData: (id: string) => Promise<string | null>;
  seedUnhealthyDemoData: (id: string) => Promise<string | null>;
  setActiveBusinessId: (id: string) => void;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
      const localBusinesses = [
        { id: "demo-healthy", name: "Northstar Labs (Healthy)", industry: "Technology", currency: "INR" },
        { id: "demo-unhealthy", name: "Redline Retail (Unhealthy)", industry: "Retail", currency: "INR" },
        { id: "demo-mixed", name: "Orbit Services (Mixed)", industry: "Services", currency: "INR" },
      ];
      setBusinesses(localBusinesses);
      const saved = window.localStorage.getItem("finpilot_business_id");
      setActiveBusinessIdState(localBusinesses.some((business) => business.id === saved) ? saved : localBusinesses[0].id);
      setLoading(false);
      return () => { mounted = false; };
    }
    async function loadBusinesses() {
      let sessionResult: Awaited<ReturnType<typeof supabase.auth.getSession>>;
      try {
        sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase request timed out")), 8000)),
        ]);
      } catch {
        if (mounted) setLoading(false);
        return;
      }
      const { data: session } = sessionResult;
      if (!session.session) {
        if (mounted) setLoading(false);
        return;
      }
      const { data, error } = await supabase.from("businesses").select("id,name,industry,currency").order("name");
      if (!mounted) return;
      if (!error) {
        const available = data || [];
        setBusinesses(available);
        const saved = window.localStorage.getItem("finpilot_business_id") || window.localStorage.getItem("finova_business_id");
        const selected = available.find((business) => business.id === saved) || available[0];
        setActiveBusinessIdState(selected?.id || null);
      }
      setLoading(false);
    }
    loadBusinesses();
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadBusinesses());
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  function setActiveBusinessId(id: string) {
    setActiveBusinessIdState(id);
    window.localStorage.setItem("finpilot_business_id", id);
  }

  async function createBusiness(name: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !name.trim()) return null;
    const { data, error } = await supabase.from("businesses").insert({ owner_id: userData.user.id, name: name.trim(), currency: "INR" }).select("id,name,industry,currency").single();
    if (error || !data) return null;
    setBusinesses((current) => [...current, data]);
    setActiveBusinessId(data.id);
    return data.id;
  }

  async function seedDemoData(id: string) {
    const response = await apiFetch(`/api/businesses/${id}/seed-demo`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) return typeof body.detail === "string" ? body.detail : body.detail ? JSON.stringify(body.detail) : "Unable to load demo data.";
    return body.message;
  }

  async function seedUnhealthyDemoData(id: string) {
    const response = await apiFetch(`/api/businesses/${id}/seed-unhealthy-demo`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) return typeof body.detail === "string" ? body.detail : body.detail ? JSON.stringify(body.detail) : "Unable to load unhealthy demo data.";
    return body.message;
  }

  const value = useMemo(() => ({ businesses, activeBusinessId, loading, createBusiness, seedDemoData, seedUnhealthyDemoData, setActiveBusinessId }), [businesses, activeBusinessId, loading]);
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used inside BusinessProvider");
  return context;
}
