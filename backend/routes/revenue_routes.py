import time

from fastapi import APIRouter, Depends, HTTPException, Query

from agents.revenue import run_revenue_forecast
from supabase_client import supabase
from auth import require_business_access

router = APIRouter(prefix="/api/agents/revenue", tags=["revenue"])


@router.get("/{business_id}")
def get_revenue_forecast(business_id: str, months: int = Query(default=12, ge=1, le=24), _user=Depends(require_business_access)):
    started_at = time.time()
    result = run_revenue_forecast(business_id, forecast_months=months)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    duration_ms = int((time.time() - started_at) * 1000)
    try:
        supabase.table("agent_runs").insert({
            "business_id": business_id,
            "agent_type": "revenue",
            "triggered_by": "user",
            "output_summary": result["summary"],
            "status": "completed",
            "duration_ms": duration_ms,
        }).execute()
        supabase.table("forecasts").insert({
            "business_id": business_id,
            "agent_type": "revenue",
            "output_json": result,
        }).execute()
    except Exception as error:
        print(f"Warning: failed to write revenue agent records: {error}")

    return result
