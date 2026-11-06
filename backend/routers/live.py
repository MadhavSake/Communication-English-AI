"""
Live voice tutor: browser <-> this WebSocket <-> Gemini Live API (Vertex AI).

Protocol (browser side):
  1. Open  wss://<backend>/api/live/voice
  2. Send JSON  {"type": "start", "token": <Firebase ID token>, "stage": 3, "scenario": "general"}
  3. Send binary frames: raw PCM16 mono 16 kHz microphone audio
  4. Receive binary frames: raw PCM16 mono 24 kHz tutor audio
     Receive JSON: {"type": "ready"|"user"|"tutor"|"interrupted"|"turn_complete"
                    |"report"|"error"|"limit", ...}
  5. Send JSON {"type": "stop"} to end; the server replies with a "report".

Cost guards: Firebase login required, one session at a time per user,
max session length and max minutes per user per day (per instance).
"""
import asyncio
import json
import os
import time
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types

from services.gemini_service import _get_client, model as text_model
from services.syllabus import describe

router = APIRouter()

LIVE_MODEL = os.getenv("LIVE_MODEL", "gemini-live-2.5-flash-preview-native-audio-09-2025")
LIVE_VOICE = os.getenv("LIVE_VOICE", "Kore")
MAX_SESSION_SECONDS = int(os.getenv("LIVE_MAX_SESSION_SECONDS", "300"))      # 5 min
MAX_DAILY_SECONDS = int(os.getenv("LIVE_MAX_DAILY_SECONDS", "600"))          # 10 min / user / day
MAX_TRANSCRIPT_CHARS = 12000

_used = defaultdict(float)   # (uid, day) -> seconds used
_active = set()              # uids with an open session

SCENARIOS = {
    "general": "a friendly everyday conversation about the learner's day, family, work and hobbies",
    "interview": "a job interview where you are the interviewer",
    "travel": "travel situations: airport, hotel, asking directions",
    "shopping": "shopping at a store or market",
    "ielts": "an IELTS Speaking test (Parts 1, 2 and 3) where you are the examiner",
    "business": "a business meeting or client call",
}


def _today() -> str:
    return time.strftime("%Y-%m-%d", time.gmtime())


def _verify_token(token: str) -> dict:
    from services.auth import verify
    return verify(token)


def _system_instruction(stage: int, scenario: str) -> str:
    return f"""You are a warm, patient spoken-English tutor for an Indian learner at {describe(stage)}.
Practice scenario: {SCENARIOS.get(scenario, SCENARIOS['general'])}.

How to talk:
- Speak clearly and a little slowly. Match the learner's level: very simple words for stages 1-3,
  natural everyday English for 4-6, IELTS-style for 7-8, professional English for 9-12.
- Keep each reply short (1-3 sentences) and end with a question so the learner keeps speaking.
- When the learner makes a grammar or word mistake, first repeat the correct sentence naturally
  ("Oh, you went to the market yesterday — nice!"), and only sometimes say the rule in a few words.
- If a word is mispronounced, model the correct pronunciation once and ask them to repeat it.
- If the learner seems stuck, you may give a short hint in simple Hindi, then continue in English.
- Be encouraging. Never lecture. Start by greeting the learner and asking one easy question."""


def _report(transcript: list, stage: int) -> dict:
    """Summarise the session's mistakes with the cheap text model."""
    lines = "\n".join(f"{who.upper()}: {text}" for who, text in transcript)[-MAX_TRANSCRIPT_CHARS:]
    if not any(who == "learner" for who, _ in transcript):
        return {"summary": "No speech from the learner was captured in this session.", "corrections": [], "tips": []}
    prompt = f"""This is the transcript of a spoken English practice session with a learner at {describe(stage)}.
Transcripts are automatic, so ignore small transcription noise.

{lines}

Respond ONLY with JSON:
{{"summary": "2-3 encouraging sentences about how the learner did",
  "fluency_score": 0-100, "grammar_score": 0-100, "vocabulary_score": 0-100, "overall_score": 0-100,
  "corrections": [{{"wrong": "what the learner said", "right": "better version", "why": "short reason"}}],
  "pronunciation_notes": ["word and how to say it, only if clearly noticeable"],
  "tips": ["2-3 short next steps"]}}"""
    resp = text_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
    return json.loads(resp.text)


@router.websocket("/voice")
async def live_voice(ws: WebSocket):
    await ws.accept()
    uid = None
    started = None
    transcript = []   # [(who, text)]
    stage = 1
    try:
        # ── 1. Authenticate ─────────────────────────────────────
        try:
            first = json.loads(await asyncio.wait_for(ws.receive_text(), timeout=15))
            assert first.get("type") == "start"
            claims = await asyncio.to_thread(_verify_token, first.get("token", ""))
            uid = claims["user_id"] if "user_id" in claims else claims["sub"]
        except Exception:
            await ws.send_json({"type": "error", "message": "Please sign in again and retry."})
            await ws.close(code=4401)
            return

        stage = int(first.get("stage") or 1)
        scenario = str(first.get("scenario") or "general")
        key = (uid, _today())
        remaining = MAX_DAILY_SECONDS - _used[key]
        if uid in _active:
            await ws.send_json({"type": "error", "message": "A voice session is already open in another tab."})
            await ws.close(code=4409)
            uid = None  # don't release the other session's lock
            return
        if remaining < 15:
            await ws.send_json({"type": "limit", "message": "You've used today's live voice minutes. Come back tomorrow!"})
            await ws.close(code=4429)
            return
        _active.add(uid)
        session_limit = min(MAX_SESSION_SECONDS, remaining)

        # ── 2. Connect to Gemini Live ───────────────────────────
        config = types.LiveConnectConfig(
            response_modalities=[types.Modality.AUDIO],
            system_instruction=_system_instruction(stage, scenario),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=LIVE_VOICE))),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )
        async with _get_client().aio.live.connect(model=LIVE_MODEL, config=config) as session:
            started = time.monotonic()
            await ws.send_json({"type": "ready", "seconds": int(session_limit)})
            # Ask the tutor to open the conversation
            await session.send_client_content(
                turns=types.Content(role="user", parts=[types.Part(text="(The learner has joined. Greet them and ask your first question.)")]),
                turn_complete=True,
            )

            async def upstream():
                while True:
                    msg = await ws.receive()
                    if msg.get("type") == "websocket.disconnect":
                        return
                    if msg.get("bytes"):
                        await session.send_realtime_input(
                            audio=types.Blob(data=msg["bytes"], mime_type="audio/pcm;rate=16000"))
                    elif msg.get("text"):
                        data = json.loads(msg["text"])
                        if data.get("type") == "stop":
                            return
                        if data.get("type") == "pause":
                            await session.send_realtime_input(audio_stream_end=True)

            async def downstream():
                while True:
                    async for m in session.receive():
                        sc = m.server_content
                        if not sc:
                            continue
                        if sc.interrupted:
                            await ws.send_json({"type": "interrupted"})
                        if sc.input_transcription and sc.input_transcription.text:
                            t = sc.input_transcription.text
                            transcript.append(("learner", t))
                            await ws.send_json({"type": "user", "text": t})
                        if sc.output_transcription and sc.output_transcription.text:
                            t = sc.output_transcription.text
                            transcript.append(("tutor", t))
                            await ws.send_json({"type": "tutor", "text": t})
                        if sc.model_turn and sc.model_turn.parts:
                            for part in sc.model_turn.parts:
                                if part.inline_data and part.inline_data.data:
                                    await ws.send_bytes(part.inline_data.data)
                        if sc.turn_complete:
                            await ws.send_json({"type": "turn_complete"})

            tasks = [asyncio.create_task(upstream()), asyncio.create_task(downstream())]
            done, pending = await asyncio.wait(tasks, timeout=session_limit, return_when=asyncio.FIRST_COMPLETED)
            for t in pending:
                t.cancel()
            for t in done:
                if not t.cancelled() and t.exception():
                    print(f"live stream ended with error: {type(t.exception()).__name__}: {t.exception()}")
            if not done:
                await ws.send_json({"type": "limit", "message": "Session time is over. Here is your report."})

        # ── 3. Report ───────────────────────────────────────────
        try:
            report = await asyncio.to_thread(_report, _merge(transcript), stage)
            await ws.send_json({"type": "report", "report": report})
        except Exception as e:
            print(f"live report failed: {e}")
            await ws.send_json({"type": "report", "report": {"summary": "Session finished.", "corrections": [], "tips": []}})
        await ws.close()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"live session error: {type(e).__name__}: {e}")
        try:
            await ws.send_json({"type": "error", "message": "The voice coach is not available right now. Please try again later."})
            await ws.close(code=1011)
        except Exception:
            pass
    finally:
        if uid:
            _active.discard(uid)
            if started is not None:
                _used[(uid, _today())] += time.monotonic() - started


def _merge(transcript: list) -> list:
    """Join consecutive transcription fragments from the same speaker."""
    merged = []
    for who, text in transcript:
        if merged and merged[-1][0] == who:
            merged[-1] = (who, merged[-1][1] + text)
        else:
            merged.append((who, text))
    return [(w, t.strip()) for w, t in merged if t.strip()]
