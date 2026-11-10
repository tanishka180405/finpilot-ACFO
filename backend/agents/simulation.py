from datetime import datetime

from agents.cashflow import run_cashflow_forecast


def _calculate_runway(current_cash: float, values: list[float]) -> int | None:
    balance = current_cash
    for index, value in enumerate(values, start=1):
        balance += value
        if balance <= 0:
            return index
    return None


def run_hiring_simulation(
    business_id: str,
    additional_employees: int,
    monthly_salary: float,
    start_after_months: int = 0,
    forecast_months: int = 12,
) -> dict:
    baseline = run_cashflow_forecast(business_id, forecast_months=forecast_months)
    if "error" in baseline:
        return baseline

    monthly_hiring_cost = additional_employees * monthly_salary
    adjusted_values: list[float] = []
    forecast_out = []

    for index, item in enumerate(baseline["forecast"]):
        hiring_cost = monthly_hiring_cost if index >= start_after_months else 0
        scenario_cashflow = item["predicted_net_cashflow"] - hiring_cost
        adjusted_values.append(scenario_cashflow)
        forecast_out.append({
            "month": item["month"],
            "baseline_net_cashflow": item["predicted_net_cashflow"],
            "scenario_net_cashflow": round(scenario_cashflow, 2),
            "hiring_cost": hiring_cost,
        })

    current_cash = baseline["current_cash_position"]
    baseline_runway = _calculate_runway(
        current_cash,
        [item["predicted_net_cashflow"] for item in baseline["forecast"]],
    )
    scenario_runway = _calculate_runway(current_cash, adjusted_values)
    total_impact = sum(item["hiring_cost"] for item in forecast_out)
    scenario_end_cash = current_cash + sum(adjusted_values)

    start_label = "immediately" if start_after_months == 0 else f"in {start_after_months} month(s)"
    runway_text = f"a runway of {scenario_runway} month(s)" if scenario_runway else "no runway risk in the forecast window"
    summary = (
        f"Hiring {additional_employees} employee(s) at Rs.{monthly_salary:,.0f}/month {start_label} "
        f"adds Rs.{monthly_hiring_cost:,.0f} in monthly payroll. Over {forecast_months} months, "
        f"the cash impact is Rs.{total_impact:,.0f}, leaving {runway_text}."
    )

    return {
        "business_id": business_id,
        "generated_at": datetime.utcnow().isoformat(),
        "assumptions": {
            "additional_employees": additional_employees,
            "monthly_salary": monthly_salary,
            "start_after_months": start_after_months,
            "monthly_hiring_cost": monthly_hiring_cost,
        },
        "current_cash_position": current_cash,
        "baseline_runway_months": baseline_runway,
        "scenario_runway_months": scenario_runway,
        "scenario_end_cash": round(scenario_end_cash, 2),
        "total_cash_impact": round(total_impact, 2),
        "forecast": forecast_out,
        "summary": summary,
    }
