from google.cloud import speech
from google.cloud import texttospeech
import base64
import os


def transcribe_audio(audio_bytes: bytes, language_code: str = "en-US") -> dict:
    """Convert audio bytes to text using Google Speech-to-Text."""
    client = speech.SpeechClient()

    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code=language_code,
        enable_automatic_punctuation=True,
        enable_word_time_offsets=True,
        model="latest_long",
    )

    response = client.recognize(config=config, audio=audio)

    if not response.results:
        return {"transcript": "", "confidence": 0, "words": []}

    result = response.results[0]
    alternative = result.alternatives[0]

    words = []
    for word_info in alternative.words:
        words.append({
            "word": word_info.word,
            "start_time": word_info.start_time.total_seconds(),
            "end_time": word_info.end_time.total_seconds(),
        })

    return {
        "transcript": alternative.transcript,
        "confidence": round(alternative.confidence * 100, 2),
        "words": words,
        "speaking_rate": len(words) / (words[-1]["end_time"] / 60) if words else 0,
    }


def text_to_speech(text: str, voice_name: str = "en-US-Neural2-F") -> bytes:
    """Convert text to natural-sounding speech."""
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice_name,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.9,  # Slightly slower for learning
        pitch=0.0,
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    return response.audio_content
