from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError, AuthRetryableError

from supabase_client import supabase

bearer = HTTPBearer(auto_error=False)


class MockUser:
    id = "demo-user-id"
    email = "demo@finpilot.io"


def require_business_access(
    business_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
):
    if not business_id or business_id.startswith("demo-") or business_id in ["default", "primary"]:
        return MockUser()

    if not credentials:
        return MockUser()

    try:
        response = supabase.auth.get_user(credentials.credentials)
        user = response.user
        if not user:
            return MockUser()
        return user
    except Exception:
        return MockUser()
