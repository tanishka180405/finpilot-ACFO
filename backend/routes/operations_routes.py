from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import require_business_access
from supabase_client import supabase

router = APIRouter(prefix="/api/businesses", tags=["operations"])


class InvoiceInput(BaseModel):
    invoice_number: str = Field(min_length=1, max_length=80)
    client_name: str = Field(min_length=1, max_length=160)
    amount: float = Field(gt=0)
    issue_date: date
    due_date: date
    status: Literal["pending", "paid", "overdue", "cancelled"] = "pending"


class PayrollInput(BaseModel):
    employee_name: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=120)
    monthly_salary: float = Field(gt=0)
    start_date: date
    department: str | None = None


@router.get("/{business_id}/invoices")
def list_invoices(business_id: str, _user=Depends(require_business_access)):
    response = supabase.table("invoices").select("id,invoice_number,client_name,amount,issue_date,due_date,status").eq("business_id", business_id).order("due_date", desc=True).execute()
    return {"invoices": response.data or []}


@router.post("/{business_id}/invoices")
def create_invoice(business_id: str, invoice: InvoiceInput, _user=Depends(require_business_access)):
    row = {**invoice.model_dump(), "business_id": business_id, "issue_date": invoice.issue_date.isoformat(), "due_date": invoice.due_date.isoformat()}
    try:
        response = supabase.table("invoices").insert(row).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to save invoice") from error
    return response.data[0] if response.data else row


@router.get("/{business_id}/payroll")
def list_payroll(business_id: str, _user=Depends(require_business_access)):
    response = supabase.table("payroll").select("id,employee_name,role,monthly_salary,start_date,department").eq("business_id", business_id).order("start_date", desc=True).execute()
    return {"payroll": response.data or []}


@router.post("/{business_id}/payroll")
def create_payroll(business_id: str, employee: PayrollInput, _user=Depends(require_business_access)):
    row = {**employee.model_dump(), "business_id": business_id, "start_date": employee.start_date.isoformat()}
    try:
        response = supabase.table("payroll").insert(row).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to save payroll record") from error
    return response.data[0] if response.data else row
