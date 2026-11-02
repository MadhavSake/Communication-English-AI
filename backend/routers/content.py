from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

# Level metadata
LEVELS = {
    1:  {"name": "Absolute Beginner", "focus": "Alphabets, basic words, greetings", "ielts_band": None},
    2:  {"name": "Beginner",          "focus": "Simple sentences, everyday vocabulary", "ielts_band": None},
    3:  {"name": "Elementary",        "focus": "Tenses, grammar basics, 500 words", "ielts_band": None},
    4:  {"name": "Pre-Intermediate",  "focus": "Complex sentences, idioms, reading", "ielts_band": "3.0-3.5"},
    5:  {"name": "Intermediate",      "focus": "Fluency, paragraphs, writing", "ielts_band": "4.0"},
    6:  {"name": "Upper-Intermediate","focus": "Advanced grammar, formal writing", "ielts_band": "4.5"},
    7:  {"name": "Advanced",          "focus": "Presentations, business English", "ielts_band": "5.0"},
    8:  {"name": "IELTS Band 5.5",    "focus": "IELTS reading, writing task 1", "ielts_band": "5.5"},
    9:  {"name": "IELTS Band 6.0",    "focus": "IELTS listening, speaking part 1", "ielts_band": "6.0"},
    10: {"name": "IELTS Band 6.5",    "focus": "IELTS writing task 2, speaking part 2", "ielts_band": "6.5"},
    11: {"name": "IELTS Band 7.0",    "focus": "Complex arguments, academic vocabulary", "ielts_band": "7.0"},
    12: {"name": "IELTS Band 7.5",    "focus": "Cohesion, coherence, advanced idioms", "ielts_band": "7.5"},
    13: {"name": "IELTS Band 8.0",    "focus": "Near-native fluency, complex structures", "ielts_band": "8.0"},
    14: {"name": "IELTS Band 8.5",    "focus": "Expert vocabulary, error-free writing", "ielts_band": "8.5"},
    15: {"name": "IELTS Band 9.0",    "focus": "Full proficiency, native-level communication", "ielts_band": "9.0"},
}

# Curated content per level
NOTES = {
    1: [
        {"title": "The English Alphabet", "content": "A, B, C... Learn all 26 letters with pronunciation.", "duration": "10 min"},
        {"title": "Basic Greetings", "content": "Hello, Hi, Good morning, Good evening, Goodbye", "duration": "10 min"},
        {"title": "Numbers 1-100", "content": "Counting and basic number vocabulary", "duration": "15 min"},
        {"title": "Colors & Shapes", "content": "Red, Blue, Green... Circle, Square, Triangle", "duration": "10 min"},
    ],
    2: [
        {"title": "Simple Present Tense", "content": "I eat, She eats, They eat — basic sentence structure", "duration": "20 min"},
        {"title": "Common Verbs", "content": "Go, Come, Eat, Sleep, Work, Play — 50 essential verbs", "duration": "20 min"},
        {"title": "Articles: A, An, The", "content": "When to use a, an, and the with examples", "duration": "15 min"},
    ],
    3: [
        {"title": "Past Simple Tense", "content": "I went, She ate, They played — regular & irregular verbs", "duration": "25 min"},
        {"title": "Future Tense", "content": "Will, Going to, Present continuous for future", "duration": "20 min"},
        {"title": "Question Words", "content": "What, Where, When, Why, Who, How", "duration": "15 min"},
    ],
}

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
    # Get notes for this level or closest available
    notes = NOTES.get(level, NOTES.get(min(NOTES.keys(), key=lambda k: abs(k - level)), []))
    return {"level": level, "notes": notes}


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
