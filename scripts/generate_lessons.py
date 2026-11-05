#!/usr/bin/env python3
"""
Generate a lesson (notes, examples, vocabulary, common mistakes and a quiz)
for every module in backend/content/syllabus.json and save it to Firestore
at lessons/s{stage}-m{module}.

Run in Cloud Shell (uses your free Gemini key and your Google login):

    pip install --user google-generativeai google-cloud-firestore
    export GEMINI_API_KEY=...            # the free-tier key
    export FIREBASE_PROJECT=madhav-test-471011-c1d58
    python3 scripts/generate_lessons.py                 # all stages
    python3 scripts/generate_lessons.py --stages 1 2    # only some stages
    python3 scripts/generate_lessons.py --force         # regenerate existing

It skips lessons that already exist, so you can stop and re-run safely.
Lessons are saved with reviewed=false — review them before real students use them.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import google.generativeai as genai
from google.cloud import firestore

ROOT = Path(__file__).resolve().parent.parent
SYLLABUS = json.loads((ROOT / "backend" / "content" / "syllabus.json").read_text(encoding="utf-8"))

PROMPT = """You are an expert English teacher writing a lesson for Indian learners
(mother tongue often Hindi or Marathi) in an English-learning app.

Stage {stage} of 12 — {stage_name}: {stage_focus}
Module {module}: {module_name}
Topics to cover: {topics}
Expected outcome: {outcome}

Write the lesson in simple English suited to this stage (stages 1–3: very short
sentences and basic words; stages 7–8: IELTS style; stages 9–12: professional).
Return ONLY JSON with exactly this shape:
{{
  "title": "lesson title",
  "summary": "1–2 sentence overview",
  "explanation": ["paragraph 1", "paragraph 2", "..."],
  "key_points": ["short rule or tip", "..."],
  "examples": [{{"english": "example sentence", "note": "why it is correct"}}],
  "vocabulary": [{{"word": "word", "meaning": "simple meaning", "example": "sentence"}}],
  "common_mistakes": [{{"wrong": "incorrect sentence", "right": "corrected sentence", "why": "short reason"}}],
  "practice": ["a short speaking or writing task for the learner"],
  "quiz": [{{"question": "question", "options": ["A", "B", "C", "D"], "answer_index": 0, "explanation": "why"}}]
}}
Use 3–5 explanation paragraphs, 5–8 examples, 8–12 vocabulary words,
3–5 common mistakes, 2–3 practice tasks and exactly 5 quiz questions.
Vary the position of the correct option across quiz questions."""

REQUIRED = ["title", "summary", "explanation", "examples", "vocabulary", "common_mistakes", "quiz"]


def valid(lesson: dict) -> bool:
    if not all(k in lesson for k in REQUIRED):
        return False
    for q in lesson["quiz"]:
        if len(q.get("options", [])) < 2 or not 0 <= int(q.get("answer_index", -1)) < len(q["options"]):
            return False
    return len(lesson["quiz"]) >= 3


def generate(model, stage: dict, idx: int, mod: dict, retries: int = 5) -> dict:
    prompt = PROMPT.format(
        stage=stage["stage"], stage_name=stage["name"], stage_focus=stage["focus"],
        module=idx, module_name=mod["name"], topics=mod["topics"], outcome=mod["outcome"],
    )
    delay = 20
    for attempt in range(1, retries + 1):
        try:
            resp = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json", "temperature": 0.4}
            )
            lesson = json.loads(resp.text)
            if valid(lesson):
                return lesson
            print(f"    attempt {attempt}: response missing fields, retrying")
        except Exception as e:  # rate limits (429) and transient errors
            print(f"    attempt {attempt}: {type(e).__name__}: {str(e)[:120]} — waiting {delay}s")
            time.sleep(delay)
            delay = min(delay * 2, 120)
    raise RuntimeError("gave up after retries")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stages", type=int, nargs="*", help="only these stage numbers")
    ap.add_argument("--force", action="store_true", help="regenerate lessons that already exist")
    ap.add_argument("--pause", type=float, default=5, help="seconds between requests (free-tier rate limit)")
    args = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY")
    project = os.environ.get("FIREBASE_PROJECT")
    if not key or not project:
        sys.exit("Set GEMINI_API_KEY and FIREBASE_PROJECT first (see the top of this file).")

    genai.configure(api_key=key)
    model = genai.GenerativeModel(os.environ.get("GEMINI_MODEL", "gemini-flash-latest"))
    db = firestore.Client(project=project)

    done = skipped = failed = 0
    for stage in SYLLABUS["stages"]:
        if args.stages and stage["stage"] not in args.stages:
            continue
        print(f"Stage {stage['stage']}: {stage['name']}")
        for idx, mod in enumerate(stage["modules"], 1):
            doc_id = f"s{stage['stage']}-m{idx}"
            ref = db.collection("lessons").document(doc_id)
            if not args.force and ref.get().exists:
                print(f"  {doc_id} {mod['name']}: exists, skipping")
                skipped += 1
                continue
            print(f"  {doc_id} {mod['name']}: generating…")
            try:
                lesson = generate(model, stage, idx, mod)
            except RuntimeError as e:
                print(f"  {doc_id}: FAILED ({e}) — re-run later to retry")
                failed += 1
                continue
            lesson.update({
                "stage": stage["stage"], "module": idx, "module_name": mod["name"],
                "reviewed": False, "updated_at": firestore.SERVER_TIMESTAMP,
            })
            ref.set(lesson)
            done += 1
            time.sleep(args.pause)

    print(f"\nDone: {done} generated, {skipped} skipped, {failed} failed.")
    if failed:
        print("Re-run the same command to retry the failed ones.")


if __name__ == "__main__":
    main()
