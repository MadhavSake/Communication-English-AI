from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.gemini_service import check_grammar, improve_sentence, get_daily_prompt

router = APIRouter()


class TextInput(BaseModel):
    text: str = Field(..., max_length=3000)
    level: int = 1


@router.post("/check")
async def grammar_check(input: TextInput):
    """Check grammar and get detailed feedback."""
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if not 1 <= input.level <= 15:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 15")
    result = check_grammar(input.text, input.level)
    return result


@router.post("/improve")
async def improve_text(input: TextInput):
    """Get improved versions of a sentence."""
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = improve_sentence(input.text, input.level)
    return result


@router.get("/daily-prompt/{level}")
async def daily_prompt(level: int):
    """Get a daily practice prompt for the given level."""
    if not 1 <= level <= 15:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 15")
    result = get_daily_prompt(level)
    return result
