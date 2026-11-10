import time
from fastapi import APIRouter, Depends, HTTPException
from agents.cashflow import run_cashflow_forecast
from supabase_client import supabase
from auth import require_business_access

router = APIRouter(prefix="/api/agents/cashflow", tags=["cashflow"])


@router.get("/{business_id}")
def get_cashflow_forecast(business_id: str, months: int = 12, _user=Depends(require_business_access)):
    start = time.time()
    try:
        result = run_cashflow_forecast(business_id, forecast_months=months)
    except Exception as error:
        print(f"Cashflow forecast failed: {error}")
        raise HTTPException(status_code=502, detail="Unable to read this business's transaction data.") from error

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    duration_ms = int((time.time() - start) * 1000)

    try:
        supabase.table("agent_runs").insert({
            "business_id": business_id,
            "agent_type": "cashflow",
            "triggered_by": "user",
            "output_summary": result["summary"],
            "status": "completed",
            "duration_ms": duration_ms,
        }).execute()

        supabase.table("forecasts").insert({
            "business_id": business_id,
            "agent_type": "cashflow",
            "output_json": result,
        }).execute()
    except Exception as e:
        print(f"Warning: failed to write agent_runs/forecasts row: {e}")

    return result
