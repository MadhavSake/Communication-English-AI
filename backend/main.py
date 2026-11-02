from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import grammar, audio, vision, content, chat
import os

app = FastAPI(
    title="Communication English AI",
    description="AI-powered English communication improvement platform",
    version="1.0.0"
)

# CORS - allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(grammar.router, prefix="/api/grammar", tags=["Grammar"])
app.include_router(audio.router,   prefix="/api/audio",   tags=["Audio"])
app.include_router(vision.router,  prefix="/api/vision",  tags=["Vision"])
app.include_router(content.router, prefix="/api/content", tags=["Content"])
app.include_router(chat.router,    prefix="/api/chat",    tags=["Chat"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Communication English AI backend is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}
