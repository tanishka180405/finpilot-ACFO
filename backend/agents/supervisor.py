import re

from agents.cashflow import run_cashflow_forecast
from agents.revenue import run_revenue_forecast
from agents.simulation import run_hiring_simulation
def _average_monthly_salary(business_id: str) -> float:
    from supabase_client import supabase

    response = (
        supabase.table("payroll")
        .select("monthly_salary")
        .eq("business_id", business_id)
        .execute()
    )
    salaries = [float(item["monthly_salary"]) for item in (response.data or [])]
    return sum(salaries) / len(salaries) if salaries else 50_000


def _extract_hiring_assumptions(question: str, business_id: str) -> tuple[int, float, int]:
    normalized = question.lower().replace(",", "")
    employee_match = re.search(r"(?:hire|add|recruit)\s+(\d+)", normalized)
    employee_match = employee_match or re.search(r"(\d+)\s+(?:more\s+)?(?:employees?|people|hires?|staff)", normalized)
    employees = int(employee_match.group(1)) if employee_match else 1

    salary_match = re.search(r"(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?", normalized)
    if salary_match:
        salary = float(salary_match.group(1))
        if re.search(r"(?:rs\.?|inr|₹)\s*\d+(?:\.\d+)?\s*(?:k|thousand)", normalized):
            salary *= 1_000
    else:
        salary = _average_monthly_salary(business_id)

    start_after_months = 3 if "next quarter" in normalized else 1 if "next month" in normalized else 0
    return employees, salary, start_after_months


def answer_financial_question(business_id: str, question: str) -> dict:
    normalized = question.lower()

    if any(word in normalized for word in ("hire", "employee", "employees", "staff", "people")):
        employees, salary, start_after_months = _extract_hiring_assumptions(question, business_id)
        simulation = run_hiring_simulation(business_id, employees, salary, start_after_months)
        if "error" in simulation:
            return simulation
        timing = "next quarter" if start_after_months == 3 else "next month" if start_after_months == 1 else "immediately"
        answer = (
            f"I modelled hiring {employees} employee(s) {timing} at Rs.{salary:,.0f} per month. "
            f"{simulation['summary']}"
        )
        return {"intent": "hiring_simulation", "answer": answer, "result": simulation}

    if any(word in normalized for word in ("revenue", "sales", "mrr")):
        forecast = run_revenue_forecast(business_id)
        if "error" in forecast:
            return forecast
        return {"intent": "revenue_forecast", "answer": forecast["summary"], "result": forecast}

    if any(word in normalized for word in ("cash", "runway", "afford", "burn")):
        forecast = run_cashflow_forecast(business_id)
        if "error" in forecast:
            return forecast
        return {"intent": "cashflow_forecast", "answer": forecast["summary"], "result": forecast}

    return {
        "intent": "clarification",
        "answer": "I can help with cash flow, revenue, or hiring scenarios. For example: Can I afford to hire 10 people next quarter?",
        "result": None,
    }
