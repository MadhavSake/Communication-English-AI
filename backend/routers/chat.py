from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import chat_with_ai

router = APIRouter()


class Message(BaseModel):
    role: str  # "user" or "model"
    parts: List[str]


class ChatInput(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    level: int = 1
    scenario: str = "general"  # general, interview, travel, shopping, formal


@router.post("/message")
async def send_message(input: ChatInput):
    """Send a message to the AI conversation partner."""
    if not input.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = [{"role": m.role, "parts": m.parts} for m in input.history]
    result = chat_with_ai(input.message, history, input.level, input.scenario)

    return {
        "response": result["reply"],
        "corrections": result["corrections"],
        "scenario": input.scenario,
        "level": input.level,
    }


@router.get("/scenarios")
async def get_scenarios():
    """Get available conversation scenarios."""
    return {
        "scenarios": [
            {"id": "general", "name": "General Conversation", "icon": "💬", "levels": "1-12"},
            {"id": "interview", "name": "Job Interview", "icon": "💼", "levels": "6-12"},
            {"id": "travel", "name": "Travel & Tourism", "icon": "✈️", "levels": "2-6"},
            {"id": "shopping", "name": "Shopping", "icon": "🛍️", "levels": "1-4"},
            {"id": "formal", "name": "Formal Meeting", "icon": "🤝", "levels": "9-12"},
            {"id": "ielts_speaking", "name": "IELTS Speaking Test", "icon": "🎓", "levels": "7-8"},
            {"id": "debate", "name": "Debate & Discussion", "icon": "🗣️", "levels": "11-12"},
        ]
    }
