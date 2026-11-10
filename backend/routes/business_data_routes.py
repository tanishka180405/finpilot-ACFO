from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException

from auth import require_business_access
from supabase_client import supabase

router = APIRouter(prefix="/api/businesses", tags=["business-data"])


def _has_rows(table: str, business_id: str) -> bool:
    response = supabase.table(table).select("id").eq("business_id", business_id).limit(1).execute()
    return bool(response.data)


@router.post("/{business_id}/seed-demo")
def seed_demo_data(business_id: str, _user=Depends(require_business_access)):
    has_transactions = _has_rows("transactions", business_id)
    has_invoices = _has_rows("invoices", business_id)
    has_payroll = _has_rows("payroll", business_id)
    if has_transactions and has_invoices and has_payroll:
        return {"created": 0, "message": "This business already has complete demo data."}

    rows = []
    invoices = []
    payroll = []
    for month_index in range(24):
        year = 2024 + month_index // 12
        month = month_index % 12 + 1
        month_start = date(year, month, 1).isoformat()
        seasonal_factor = 0.82 if month in (1, 12) else 1.0
        revenue = round(450_000 * (1.11 ** month_index) * seasonal_factor)
        salary_cost = round(-(520_000 + month_index * 24_000))
        rows.extend([
            {"business_id": business_id, "date": month_start, "amount": revenue, "category": "subscription_revenue", "type": "income", "description": "Monthly subscription revenue", "source": "demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": salary_cost, "category": "salaries", "type": "expense", "description": "Monthly payroll", "source": "demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -85_000, "category": "marketing", "type": "expense", "description": "Marketing and growth spend", "source": "demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -65_000, "category": "software_subscriptions", "type": "expense", "description": "Cloud and software subscriptions", "source": "demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -95_000, "category": "rent", "type": "expense", "description": "Office and facilities", "source": "demo_seed"},
        ])
        for client_index in range(5):
            issue_date = date(year, month, min(2 + client_index * 4, 26))
            invoices.append({
                "business_id": business_id,
                "invoice_number": f"INV-{year}{month:02d}-{client_index + 1:02d}",
                "client_name": ["Acme Corp", "Northstar Labs", "Orbit Retail", "Vertex Health", "Bluebird Media"][client_index],
                "amount": round(revenue / 5),
                "issue_date": issue_date.isoformat(),
                "due_date": (issue_date + timedelta(days=30)).isoformat(),
                "status": "paid" if month_index < 20 or client_index < 3 else "pending",
            })

    for employee_index in range(14):
        start_month = employee_index + 1
        start_date = date(2024 + (start_month - 1) // 12, (start_month - 1) % 12 + 1, 1)
        payroll.append({
            "business_id": business_id,
            "employee_name": f"Demo Employee {employee_index + 1}",
            "role": "Engineer" if employee_index % 3 else "Account Manager",
            "monthly_salary": 55_000 + employee_index * 7_500,
            "start_date": start_date.isoformat(),
            "department": "Product" if employee_index % 3 else "Operations",
        })

    if has_transactions:
        rows = []
    if has_invoices:
        invoices = []
    if has_payroll:
        payroll = []

    try:
        if rows:
            supabase.table("transactions").insert(rows).execute()
        if invoices:
            supabase.table("invoices").insert(invoices).execute()
        if payroll:
            supabase.table("payroll").insert(payroll).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to seed demo financial data") from error
    return {"created": len(rows), "invoices": len(invoices), "payroll": len(payroll), "message": "24 months of demo financial data, invoices, and payroll were added."}


@router.post("/{business_id}/seed-unhealthy-demo")
def seed_unhealthy_demo_data(business_id: str, _user=Depends(require_business_access)):
    """Create a deliberately unhealthy company scenario for demos and presentations."""
    if _has_rows("transactions", business_id):
        return {"created": 0, "message": "This business already has transaction data. Use a new business for the unhealthy demo."}

    rows = []
    invoices = []
    payroll = []
    clients = ["Acme Corp", "Northstar Labs", "Orbit Retail", "Vertex Health", "Bluebird Media"]

    for month_index in range(12):
        year = 2025 + month_index // 12
        month = month_index % 12 + 1
        month_start = date(year, month, 1).isoformat()
        revenue = round(260_000 * (0.94 ** month_index))
        salary_cost = -round(430_000 + month_index * 18_000)
        rows.extend([
            {"business_id": business_id, "date": month_start, "amount": revenue, "category": "subscription_revenue", "type": "income", "description": "Declining subscription revenue", "source": "unhealthy_demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": salary_cost, "category": "salaries", "type": "expense", "description": "Oversized payroll commitment", "source": "unhealthy_demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -120_000, "category": "marketing", "type": "expense", "description": "High marketing spend", "source": "unhealthy_demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -80_000, "category": "software_subscriptions", "type": "expense", "description": "Unused software and cloud tools", "source": "unhealthy_demo_seed"},
            {"business_id": business_id, "date": month_start, "amount": -100_000, "category": "rent", "type": "expense", "description": "Fixed office and facilities cost", "source": "unhealthy_demo_seed"},
        ])
        for client_index, client in enumerate(clients):
            issue_date = date(year, month, min(2 + client_index * 4, 26))
            invoices.append({
                "business_id": business_id,
                "invoice_number": f"RISK-{year}{month:02d}-{client_index + 1:02d}",
                "client_name": client,
                "amount": round(revenue / 5),
                "issue_date": issue_date.isoformat(),
                "due_date": (issue_date + timedelta(days=30)).isoformat(),
                "status": "overdue" if month_index >= 3 else "pending",
            })

    for employee_index in range(16):
        payroll.append({
            "business_id": business_id,
            "employee_name": f"At-Risk Employee {employee_index + 1}",
            "role": "Engineer" if employee_index % 2 else "Operations",
            "monthly_salary": 55_000 + employee_index * 5_000,
            "start_date": date(2024, 1, 1).isoformat(),
            "department": "Product" if employee_index % 2 else "Operations",
        })

    try:
        supabase.table("transactions").insert(rows).execute()
        supabase.table("invoices").insert(invoices).execute()
        supabase.table("payroll").insert(payroll).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to seed unhealthy demo financial data") from error

    return {
        "created": len(rows),
        "invoices": len(invoices),
        "payroll": len(payroll),
        "message": "Unhealthy demo data added: declining revenue, high fixed costs, overdue invoices, and negative cash flow.",
    }
