from fastapi import APIRouter, Depends, Query
from supabase_client import supabase
from auth import require_business_access

router = APIRouter(prefix="/api/agent-runs", tags=["agent-runs"])


@router.get("/{business_id}")
def get_agent_runs(business_id: str, limit: int = Query(default=10, ge=1, le=50), _user=Depends(require_business_access)):
    """Return the most recent agent audit entries for one business."""
    response = (
        supabase.table("agent_runs")
        .select("id, agent_type, output_summary, status, created_at")
        .eq("business_id", business_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"runs": response.data or []}
