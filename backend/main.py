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

# Import routers safely
try:
    from routers import grammar, audio, vision, content, chat
    app.include_router(grammar.router, prefix="/api/grammar", tags=["Grammar"])
    app.include_router(audio.router,   prefix="/api/audio",   tags=["Audio"])
    app.include_router(vision.router,  prefix="/api/vision",  tags=["Vision"])
    app.include_router(content.router, prefix="/api/content", tags=["Content"])
    app.include_router(chat.router,    prefix="/api/chat",    tags=["Chat"])
except Exception as e:
    print(f"Warning: Could not load some routers: {e}")

@app.get("/")
def root():
    return {"status": "ok", "message": "Communication English AI backend is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}
