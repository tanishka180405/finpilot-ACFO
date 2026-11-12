import { supabase } from "@/lib/supabase";

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const liveRes = await fetch(path, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (liveRes.ok) {
        return liveRes;
      }
    } catch {
      // Gracefully fall back to local presentation data if backend is waking up
    }
    return mockApiResponse(path, options);
  }

  async function send(accessToken?: string) {
    const headers = new Headers(options.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(path, { ...options, headers });
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  let response = await send(data.session?.access_token);
  // A 403 means the user is signed in but does not own the requested business.
  // Only retry a 401, which indicates a stale or expired access token.
  if (response.status === 401) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.data.session?.access_token) response = await send(refreshed.data.session.access_token);
  }
  return response;
}

function mockApiResponse(path: string, options: RequestInit): Response {
  const unhealthy = path.includes("demo-unhealthy");
  const mixed = path.includes("demo-mixed");
  const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"];
  const revenue = (unhealthy ? [260, 244, 229, 215, 202, 190, 178, 168, 157, 148, 139, 131] : mixed ? [380, 430, 360, 510, 405, 590, 455, 620, 480, 680, 520, 735] : [420, 465, 510, 560, 615, 680, 735, 790, 850, 920, 985, 1050]).map((value) => value * 1000);
  const cashflow = (unhealthy ? [-390, -405, -421, -438, -454, -470, -487, -503, -520, -536, -552, -569] : mixed ? [90, 120, -130, -80, 75, 140, -180, 110, 95, -95, -60, 190] : [70, 82, 96, 110, 125, 140, 154, 170, 185, 201, 220, 238]).map((value) => value * 1000);
  const payload = path.includes("/cashflow/")
      ? { summary: unhealthy ? "Cash flow is trending negative. Immediate cost reduction is required." : mixed ? "Cash flow is mixed: profitable and loss-making periods occur in an uneven pattern. Monitor timing and reserves." : "Cash flow is trending positive with no near-term runway risk.", current_cash_position: unhealthy ? -1680000 : mixed ? 620000 : 2840000, runway_months: unhealthy ? 2 : null, historical: months.slice(0, 6).map((month, index) => ({ month, net_cashflow: cashflow[index] })), forecast: months.slice(6).map((month, index) => ({ month, predicted_net_cashflow: cashflow[index + 6], lower_bound: cashflow[index + 6] * 0.85, upper_bound: cashflow[index + 6] * 1.15 })) }
    : path.includes("/revenue/")
      ? { latest_monthly_revenue: revenue[11], projected_monthly_revenue: revenue[11], growth_rate: unhealthy ? -49.6 : mixed ? 6.2 : 150, summary: unhealthy ? "Subscription revenue is declining and requires urgent intervention." : mixed ? "Revenue is volatile, with an uneven mix of strong and weak months." : "Subscription revenue is growing steadily.", historical: months.slice(0, 6).map((month, index) => ({ month, revenue: revenue[index] })), forecast: months.slice(6).map((month, index) => ({ month, predicted_revenue: revenue[index + 6] })) }
      : path.includes("/simulation/")
        ? { assumptions: { additional_employees: 10, monthly_salary: 45000, start_after_months: 3, monthly_hiring_cost: 450000 }, baseline_runway_months: unhealthy ? 2 : null, scenario_runway_months: unhealthy ? 1 : null, scenario_end_cash: unhealthy ? -3200000 : 5680000, total_cash_impact: 5400000, summary: unhealthy ? "Hiring would accelerate the cash shortfall." : "The business can absorb the planned hiring in the forecast window.", forecast: months.slice(6).map((month, index) => ({ month, baseline_net_cashflow: cashflow[index + 6], scenario_net_cashflow: cashflow[index + 6] - 450000 })) }
        : path.includes("/chat/")
          ? { intent: "cashflow_forecast", answer: unhealthy ? "This company should pause hiring, reduce fixed costs, and collect overdue invoices immediately." : mixed ? "This company has both profitable and loss-making months; improve cash timing and keep a reserve." : "This company can consider hiring while maintaining a healthy cash buffer." }
          : path.includes("/agent-runs/")
            ? { runs: [{ id: "demo-run-1", agent_type: "cashflow", status: "completed", output_summary: unhealthy ? "Negative cash-flow warning generated" : mixed ? "Mixed cash-flow pattern detected" : "12-month forecast completed", created_at: "2025-12-15T09:41:12Z" }, { id: "demo-run-2", agent_type: "revenue", status: "completed", output_summary: unhealthy ? "Revenue decline detected" : mixed ? "Revenue volatility detected" : "Revenue trend updated", created_at: "2025-12-15T08:15:44Z" }] }
            : path.includes("/transactions")
              ? { transactions: months.map((month, index) => ({ id: `demo-tx-${index}`, date: `${month}-01`, amount: cashflow[index], category: "subscription_revenue", type: cashflow[index] >= 0 ? "income" : "expense", description: "Offline demo transaction" })) }
              : path.includes("/invoices") ? { invoices: months.slice(0, 6).map((month, index) => ({ id: `demo-invoice-${index}`, invoice_number: `DEMO-${index + 1}`, client_name: "Demo Client", amount: revenue[index], issue_date: `${month}-01`, due_date: `${month}-28`, status: unhealthy ? "overdue" : "paid" })) }
                : path.includes("/payroll") ? { payroll: [{ id: "demo-payroll-1", employee_name: "Demo Employee", role: "Engineer", monthly_salary: unhealthy ? 55000 : 45000, department: "Product", start_date: "2024-01-01" }] }
                  : { message: unhealthy ? "Unhealthy offline demo data loaded." : "Healthy offline demo data loaded." };
  return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
}
