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

# Import each router independently so one failing import
# (e.g. a missing GCP client library) doesn't take down every endpoint.
import importlib

_ROUTERS = [
    ("grammar", "/api/grammar", "Grammar"),
    ("audio",   "/api/audio",   "Audio"),
    ("vision",  "/api/vision",  "Vision"),
    ("content", "/api/content", "Content"),
    ("chat",    "/api/chat",    "Chat"),
]
for _name, _prefix, _tag in _ROUTERS:
    try:
        _mod = importlib.import_module(f"routers.{_name}")
        app.include_router(_mod.router, prefix=_prefix, tags=[_tag])
    except Exception as e:
        print(f"Warning: could not load router '{_name}': {e}")

@app.get("/")
def root():
    return {"status": "ok", "message": "Communication English AI backend is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}
