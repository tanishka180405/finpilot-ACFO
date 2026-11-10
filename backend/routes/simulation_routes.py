import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from agents.simulation import run_hiring_simulation
from supabase_client import supabase
from auth import require_business_access

router = APIRouter(prefix="/api/agents/simulation", tags=["simulation"])


class HiringSimulationRequest(BaseModel):
    additional_employees: int = Field(ge=1, le=100)
    monthly_salary: float = Field(gt=0, le=1_000_000)
    start_after_months: int = Field(default=0, ge=0, le=23)
    forecast_months: int = Field(default=12, ge=1, le=24)


@router.post("/{business_id}")
def simulate_hiring(business_id: str, request: HiringSimulationRequest, _user=Depends(require_business_access)):
    started_at = time.time()
    result = run_hiring_simulation(business_id, **request.model_dump())

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    duration_ms = int((time.time() - started_at) * 1000)
    try:
        supabase.table("agent_runs").insert({
            "business_id": business_id,
            "agent_type": "simulation",
            "triggered_by": "user",
            "user_query": f"Hire {request.additional_employees} employees at Rs.{request.monthly_salary}/month",
            "output_summary": result["summary"],
            "status": "completed",
            "duration_ms": duration_ms,
        }).execute()
        supabase.table("forecasts").insert({
            "business_id": business_id,
            "agent_type": "simulation",
            "output_json": result,
        }).execute()
    except Exception as error:
        print(f"Warning: failed to write simulation records: {error}")

    return result
