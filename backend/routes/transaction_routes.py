from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import require_business_access
from supabase_client import supabase

router = APIRouter(prefix="/api/businesses", tags=["transactions"])


class TransactionInput(BaseModel):
    date: date
    amount: float
    category: str = Field(min_length=1, max_length=100)
    type: Literal["income", "expense"]
    description: str | None = None


class TransactionBatch(BaseModel):
    transactions: list[TransactionInput] = Field(min_length=1, max_length=1000)


@router.get("/{business_id}/transactions")
def list_transactions(business_id: str, _user=Depends(require_business_access)):
    response = (
        supabase.table("transactions")
        .select("id,date,amount,category,type,description")
        .eq("business_id", business_id)
        .order("date", desc=True)
        .limit(200)
        .execute()
    )
    return {"transactions": response.data or []}


@router.post("/{business_id}/transactions")
def add_transactions(business_id: str, batch: TransactionBatch, _user=Depends(require_business_access)):
    rows = []
    for transaction in batch.transactions:
        amount = abs(transaction.amount) if transaction.type == "income" else -abs(transaction.amount)
        rows.append({
            "business_id": business_id,
            "date": transaction.date.isoformat(),
            "amount": amount,
            "category": transaction.category,
            "type": transaction.type,
            "description": transaction.description,
            "source": "manual_import",
        })
    try:
        supabase.table("transactions").insert(rows).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to save transactions") from error
    return {"created": len(rows)}
