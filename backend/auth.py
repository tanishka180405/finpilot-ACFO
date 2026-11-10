from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError, AuthRetryableError

from supabase_client import supabase

bearer = HTTPBearer(auto_error=True)


def require_business_access(
    business_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    try:
        response = supabase.auth.get_user(credentials.credentials)
        user = response.user
    except AuthApiError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from error
    except AuthRetryableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable. Please try again shortly.",
        ) from error

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    try:
        owned_business = (
            supabase.table("businesses")
            .select("id")
            .eq("id", business_id)
            .eq("owner_id", user.id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business access could not be verified. Please try again shortly.",
        ) from error
    if not owned_business.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this business")
    return user
