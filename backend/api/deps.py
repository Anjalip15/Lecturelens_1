import logging
import socket
import time

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.supabase_client import supabase

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()

MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 1.0

# Errors that mean "couldn't reach Supabase", not "bad token"
NETWORK_ERRORS = (httpx.TransportError, socket.gaierror, ConnectionError, TimeoutError)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    """
    Extracts the Bearer token, asks Supabase to verify it, and returns the
    authenticated user's UUID.

    - Network problems are retried, then reported as 503 (not the user's fault).
    - Token problems are reported as 401.
    """
    token = credentials.credentials
    response = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = supabase.auth.get_user(token)
            break
        except NETWORK_ERRORS as e:
            logger.warning("Auth network error (attempt %d/%d): %s", attempt, MAX_ATTEMPTS, e)
            if attempt == MAX_ATTEMPTS:
                raise HTTPException(
                    status_code=503,
                    detail="Auth service temporarily unavailable. Please retry.",
                )
            time.sleep(RETRY_DELAY_SECONDS * attempt)
        except Exception as e:
            # Supabase rejected the token (expired, malformed, revoked, etc.)
            logger.info("Token rejected: %s", e)
            raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not response or not response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return response.user.id