from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

import json
from pathlib import Path
from services.syllabus import STAGES, RULES, stage as get_stage

_RES = json.loads((Path(__file__).resolve().parent.parent / "content" / "resources.json").read_text(encoding="utf-8"))


def _for_stage(kind: str, level: int) -> list:
    n = get_stage(level)["stage"]
    return [{k: v for k, v in item.items() if k != "stages"}
            for item in _RES[kind] if item["stages"][0] <= n <= item["stages"][1]]

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
    return {"level": get_stage(level)["stage"], "books": _for_stage("books", level)}


@router.get("/audio/{level}")
async def get_audio(level: int):
    return {"level": get_stage(level)["stage"], "audio": _for_stage("audio", level)}


@router.get("/videos/{level}")
async def get_videos(level: int):
    return {"level": get_stage(level)["stage"], "videos": _for_stage("videos", level)}


_LESSON_DIR = Path(__file__).resolve().parent.parent / "content" / "lessons"


@router.get("/lesson/{stage}/{module}")
async def get_lesson(stage: int, module: int):
    """Hand-written lessons shipped with the app (content/lessons/s{stage}-m{module}.json)."""
    from fastapi import HTTPException
    f = _LESSON_DIR / f"s{int(stage)}-m{int(module)}.json"
    if not f.is_file():
        raise HTTPException(status_code=404, detail="Lesson not available yet")
    return json.loads(f.read_text(encoding="utf-8"))

