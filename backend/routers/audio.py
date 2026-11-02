from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from services.speech_service import transcribe_audio, text_to_speech
from services.gemini_service import analyze_audio_transcript

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

    # Step 1: Transcribe
    transcription = transcribe_audio(audio_bytes)

    if not transcription.get("transcript"):
        return {
            "success": False,
            "message": "Could not transcribe audio. Please speak clearly and try again."
        }

    # Step 2: AI analysis of transcript
    analysis = analyze_audio_transcript(transcription["transcript"], level)

    return {
        "success": True,
        "transcription": transcription,
        "analysis": analysis,
    }


@router.post("/tts")
async def text_to_speech_endpoint(text: str = Form(...)):
    """Convert text to natural speech audio."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    audio_bytes = text_to_speech(text)
    return Response(content=audio_bytes, media_type="audio/mpeg")
