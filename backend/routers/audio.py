from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from services.gemini_service import analyze_audio_file

router = APIRouter()


@router.post("/analyze")
async def analyze_audio(
    audio: UploadFile = File(...),
    level: int = Form(default=1)
):
    """Upload audio, transcribe it, and get AI analysis."""
    if not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    audio_bytes = await audio.read()
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Recording is too long. Please keep it under 3 minutes.")

    mime = audio.content_type.split(";")[0]
    analysis = analyze_audio_file(audio_bytes, mime, level)
    transcript = (analysis.pop("transcript", "") or "").strip()

    if not transcript:
        return {
            "success": False,
            "message": "Could not hear clear speech. Please speak clearly and try again."
        }

    return {
        "success": True,
        "transcription": {"transcript": transcript},
        "analysis": analysis,
    }


@router.post("/tts")
async def text_to_speech_endpoint(text: str = Form(...)):
    """Convert text to natural speech audio."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    from services.speech_service import text_to_speech  # Cloud TTS, loaded only when used
    audio_bytes = text_to_speech(text)
    return Response(content=audio_bytes, media_type="audio/mpeg")
