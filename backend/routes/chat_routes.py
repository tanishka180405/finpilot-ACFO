import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from agents.supervisor import answer_financial_question
from supabase_client import supabase
from auth import require_business_access

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


@router.post("/{business_id}")
def ask_finpilot(business_id: str, request: ChatRequest, _user=Depends(require_business_access)):
    started_at = time.time()
    response = answer_financial_question(business_id, request.question)
    if "error" in response:
        raise HTTPException(status_code=400, detail=response["error"])

    duration_ms = int((time.time() - started_at) * 1000)
    try:
        supabase.table("agent_runs").insert({
            "business_id": business_id,
            "agent_type": "supervisor",
            "triggered_by": "user",
            "user_query": request.question,
            "output_summary": response["answer"],
            "status": "completed",
            "duration_ms": duration_ms,
        }).execute()
    except Exception as error:
        print(f"Warning: failed to write supervisor run: {error}")

    return response
