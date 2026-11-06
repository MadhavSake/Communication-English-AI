"""Firebase ID-token verification and the email allow-list for AI features."""
import os
import re
import time

FIREBASE_PROJECT = os.getenv("FIREBASE_PROJECT", "")
# Separate several emails with ';' (commas clash with Cloud Run --set-env-vars).
ALLOWED_EMAILS = {e.strip().lower() for e in re.split(r"[;,]", os.getenv("ALLOWED_EMAILS", "")) if e.strip()}

_cache = {}  # token -> (claims, expires_at)


class AuthError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def verify(token: str) -> dict:
    """Return Firebase claims for an allowed user, or raise AuthError."""
    if not token:
        raise AuthError(401, "Please sign in.")
    hit = _cache.get(token)
    if hit and hit[1] > time.time():
        claims = hit[0]
    else:
        if not FIREBASE_PROJECT:
            raise AuthError(503, "Sign-in is not configured on the server.")
        from google.auth.transport import requests as ga_requests
        from google.oauth2 import id_token
        try:
            claims = id_token.verify_firebase_token(token, ga_requests.Request(), audience=FIREBASE_PROJECT)
        except Exception:
            raise AuthError(401, "Your session has expired. Please sign in again.")
        if len(_cache) > 500:
            _cache.clear()
        _cache[token] = (claims, min(claims.get("exp", 0), time.time() + 600))
    email = (claims.get("email") or "").lower()
    if ALLOWED_EMAILS and email not in ALLOWED_EMAILS:
        raise AuthError(403, "This account does not have access yet.")
    return claims
