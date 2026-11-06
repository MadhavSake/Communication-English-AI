from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Communication English AI",
    description="AI-powered English communication improvement platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cost guard: limit AI calls per client IP (per instance) ─────────────
import time
from collections import defaultdict, deque
from fastapi import Request
from fastapi.responses import JSONResponse

AI_PREFIXES = ("/api/grammar", "/api/chat/message", "/api/audio", "/api/vision")
AI_LIMIT_PER_HOUR = int(os.getenv("AI_LIMIT_PER_HOUR", "40"))
AI_LIMIT_PER_DAY = int(os.getenv("AI_LIMIT_PER_DAY", "150"))
_hits = defaultdict(deque)


@app.middleware("http")
async def ai_rate_limit(request: Request, call_next):
    path = request.url.path
    if request.method == "POST" or path.startswith("/api/grammar/daily-prompt"):
        if path.startswith(AI_PREFIXES):
            # Only signed-in, allowed users may use AI features (they cost money).
            from services.auth import verify, AuthError
            import asyncio
            header = request.headers.get("authorization", "")
            token = header[7:] if header.lower().startswith("bearer ") else ""
            try:
                await asyncio.to_thread(verify, token)
            except AuthError as e:
                return JSONResponse(status_code=e.status, content={"detail": e.message})
            ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
            now = time.time()
            q = _hits[ip]
            while q and now - q[0] > 86400:
                q.popleft()
            last_hour = sum(1 for t in q if now - t < 3600)
            if last_hour >= AI_LIMIT_PER_HOUR or len(q) >= AI_LIMIT_PER_DAY:
                return JSONResponse(status_code=429, content={
                    "detail": "You've reached today's practice limit for AI feedback. Please try again later."})
            q.append(now)
    return await call_next(request)


# Import each router independently so one failing import
# (e.g. a missing GCP client library) doesn't take down every endpoint.
import importlib

_ROUTERS = [
    ("grammar", "/api/grammar", "Grammar"),
    ("audio",   "/api/audio",   "Audio"),
    ("vision",  "/api/vision",  "Vision"),
    ("content", "/api/content", "Content"),
    ("chat",    "/api/chat",    "Chat"),
    ("live",    "/api/live",    "Live"),
]
for _name, _prefix, _tag in _ROUTERS:
    try:
        _mod = importlib.import_module(f"routers.{_name}")
        app.include_router(_mod.router, prefix=_prefix, tags=[_tag])
    except Exception as e:
        print(f"Warning: could not load router '{_name}': {e}")

@app.exception_handler(Exception)
async def ai_errors(request, exc):
    """Turn AI quota / availability errors into a friendly 503 instead of a bare 500."""
    from fastapi.responses import JSONResponse
    code = getattr(exc, "code", None)
    if code in (429, 503) or "RESOURCE_EXHAUSTED" in str(exc):
        return JSONResponse(status_code=503, content={
            "detail": "The AI coach is busy right now. Please try again in a minute."})
    print(f"Unhandled error: {type(exc).__name__}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.get("/")
def root():
    return {"status": "ok", "message": "Communication English AI backend is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}
