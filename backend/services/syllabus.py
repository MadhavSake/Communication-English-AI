"""Loads the 12-stage syllabus (content/syllabus.json) once at startup."""
import json
from pathlib import Path

_DATA = json.loads((Path(__file__).resolve().parent.parent / "content" / "syllabus.json").read_text(encoding="utf-8"))

RULES = _DATA["rules"]
STAGES = {s["stage"]: s for s in _DATA["stages"]}
MAX_STAGE = max(STAGES)


def stage(n: int) -> dict:
    """Return stage n, clamped to the valid range."""
    n = min(max(int(n), 1), MAX_STAGE)
    return STAGES[n]


def describe(n: int) -> str:
    """Short learner description used in AI prompts."""
    s = stage(n)
    return f"Stage {s['stage']} of {MAX_STAGE} — {s['name']} ({s['focus']})"
