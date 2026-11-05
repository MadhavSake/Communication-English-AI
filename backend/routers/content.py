from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

from services.syllabus import STAGES, RULES, stage as get_stage

# Stage metadata (kept under the old "levels" name so the API shape is unchanged)
LEVELS = {
    n: {
        "name": st["name"],
        "focus": st["focus"],
        "vocab_target": st["vocab_target"],
        "optional": st["optional"],
        "module_count": len(st["modules"]),
        "ielts_band": None,
    }
    for n, st in STAGES.items()
}

# Curated content per level

BOOKS = {
    1: [
        {"title": "Oxford Picture Dictionary", "author": "Oxford", "level": "Beginner", "description": "Visual vocabulary learning"},
        {"title": "English for Everyone: Level 1", "author": "DK", "level": "Beginner", "description": "Complete beginner course"},
    ],
    2: [
        {"title": "Grammar in Use (Elementary)", "author": "Raymond Murphy", "level": "Elementary", "description": "Cambridge grammar practice"},
        {"title": "Headway Elementary", "author": "Oxford", "level": "Elementary", "description": "Skills-based learning"},
    ],
    8: [
        {"title": "Cambridge IELTS 1-18", "author": "Cambridge", "level": "IELTS", "description": "Official practice tests"},
        {"title": "IELTS Academic 5 Practice Tests", "author": "Simone Braverman", "level": "IELTS", "description": "Strategy focused"},
        {"title": "The Official Cambridge Guide to IELTS", "author": "Cambridge", "level": "IELTS", "description": "Complete guide"},
    ],
}

AUDIO = {
    1: [
        {"title": "Alphabet Song", "description": "Learn pronunciation of all 26 letters", "duration": "3 min", "type": "pronunciation"},
        {"title": "Basic Greetings Audio", "description": "Native speaker greetings", "duration": "5 min", "type": "conversation"},
    ],
    3: [
        {"title": "BBC Learning English - 6 Minute Grammar", "description": "Grammar explained simply", "duration": "6 min", "type": "grammar", "url": "https://www.bbc.co.uk/learningenglish"},
        {"title": "Slow English Podcast", "description": "Clear, slow English for learners", "duration": "10 min", "type": "listening"},
    ],
    8: [
        {"title": "IELTS Listening Practice Test", "description": "Official-style listening test", "duration": "40 min", "type": "test"},
        {"title": "TED Talks - Academic English", "description": "Native speaker academic vocabulary", "duration": "15 min", "type": "academic"},
    ],
}

VIDEOS = {
    1: [
        {"title": "English Alphabet for Beginners", "platform": "YouTube", "duration": "8 min", "topic": "alphabet"},
        {"title": "Basic English Conversations", "platform": "YouTube", "duration": "12 min", "topic": "conversation"},
    ],
    5: [
        {"title": "English with Lucy - Fluency Tips", "platform": "YouTube", "duration": "15 min", "topic": "fluency"},
        {"title": "BBC Learning English", "platform": "YouTube", "duration": "10 min", "topic": "grammar"},
    ],
    8: [
        {"title": "IELTS Speaking Band 9 Sample", "platform": "YouTube", "duration": "20 min", "topic": "IELTS speaking"},
        {"title": "IELTS Writing Task 2 - Band 9 Essay", "platform": "YouTube", "duration": "25 min", "topic": "IELTS writing"},
        {"title": "IELTS Listening - Official Tips", "platform": "YouTube", "duration": "30 min", "topic": "IELTS listening"},
    ],
}


@router.get("/levels")
async def get_all_levels():
    return {"levels": LEVELS}


@router.get("/levels/{level}")
async def get_level_info(level: int):
    if level not in LEVELS:
        raise HTTPException(status_code=404, detail="Level not found")
    return LEVELS[level]


@router.get("/notes/{level}")
async def get_notes(level: int):
    st = get_stage(level)
    notes = [
        {"title": m["name"], "content": m["topics"], "outcome": m["outcome"], "module": i + 1}
        for i, m in enumerate(st["modules"])
    ]
    return {"level": st["stage"], "notes": notes}


@router.get("/syllabus")
async def get_syllabus():
    return {"rules": RULES, "stages": list(STAGES.values())}


@router.get("/books/{level}")
async def get_books(level: int):
    books = BOOKS.get(level, BOOKS.get(min(BOOKS.keys(), key=lambda k: abs(k - level)), []))
    return {"level": level, "books": books}


@router.get("/audio/{level}")
async def get_audio(level: int):
    audio = AUDIO.get(level, AUDIO.get(min(AUDIO.keys(), key=lambda k: abs(k - level)), []))
    return {"level": level, "audio": audio}


@router.get("/videos/{level}")
async def get_videos(level: int):
    videos = VIDEOS.get(level, VIDEOS.get(min(VIDEOS.keys(), key=lambda k: abs(k - level)), []))
    return {"level": level, "videos": videos}
