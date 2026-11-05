import google.generativeai as genai
import os
from dotenv import load_dotenv
from services.syllabus import describe

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# gemini-1.5-flash has been retired; keep the model configurable via env.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")  # free tier
model = genai.GenerativeModel(GEMINI_MODEL)


def check_grammar(text: str, level: int) -> dict:
    """Analyze grammar, fluency and suggest improvements."""
    prompt = f"""
    You are an English teacher helping a learner at {describe(level)}.
    
    Analyze this text: "{text}"
    
    Respond in JSON format:
    {{
        "corrected_text": "corrected version",
        "errors": [
            {{"error": "original", "correction": "fixed", "explanation": "why"}}
        ],
        "fluency_score": 85,
        "grammar_score": 78,
        "vocabulary_score": 70,
        "overall_feedback": "encouraging feedback for this level",
        "tips": ["tip1", "tip2", "tip3"]
    }}
    """
    response = model.generate_content(prompt)
    import json, re
    # Extract JSON from response
    text_response = response.text
    json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return {"error": "Could not parse response", "raw": text_response}


def improve_sentence(text: str, level: int) -> dict:
    """Suggest improved version of a sentence."""
    prompt = f"""
    You are helping an English learner at {describe(level)} improve their sentence.
    Original: "{text}"
    
    Provide 3 improved versions suitable for their level.
    Respond in JSON:
    {{
        "original": "{text}",
        "improvements": [
            {{"version": "improved sentence", "explanation": "what changed and why"}}
        ],
        "level_appropriate_tip": "specific tip for level {level}"
    }}
    """
    response = model.generate_content(prompt)
    import json, re
    text_response = response.text
    json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return {"error": "Could not parse response"}


def get_daily_prompt(level: int) -> dict:
    """Get a daily speaking/writing practice prompt for the level."""
    desc = describe(level)
    prompt = f"""
    Create a daily English practice prompt for a {desc} student.
    Respond in JSON:
    {{
        "topic": "topic title",
        "prompt": "practice prompt/question",
        "example_response": "example answer at their level",
        "key_vocabulary": ["word1", "word2", "word3", "word4", "word5"],
        "grammar_focus": "grammar point to practice",
        "time_suggestion": "2-3 minutes"
    }}
    """
    response = model.generate_content(prompt)
    import json, re
    text_response = response.text
    json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return {"error": "Could not parse response"}


def analyze_audio_transcript(transcript: str, level: int) -> dict:
    """Deep analysis of spoken English from transcript."""
    prompt = f"""
    Analyze this spoken English transcript from a learner at {describe(level)}:
    "{transcript}"
    
    Respond in JSON:
    {{
        "grammar_score": 80,
        "fluency_score": 75,
        "vocabulary_score": 70,
        "pronunciation_tips": ["tip based on text patterns"],
        "filler_words_detected": ["um", "like"],
        "filler_word_count": 3,
        "confidence_indicators": "analysis of confidence from text",
        "strengths": ["strength1", "strength2"],
        "improvements": ["area1", "area2"],
        "overall_score": 75,
        "ielts_equivalent_band": "4.5",
        "detailed_feedback": "encouraging detailed feedback"
    }}
    """
    response = model.generate_content(prompt)
    import json, re
    text_response = response.text
    json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return {"error": "Could not parse response"}


def chat_with_ai(message: str, history: list, level: int, scenario: str = "general") -> dict:
    """AI conversation partner: replies in character and lists the learner's mistakes."""
    import json
    system_context = f"""
    You are a friendly English conversation partner helping a learner at {describe(level)} practice.
    Scenario: {scenario}
    - Stay in the scenario and keep the conversation going with a question.
    - Stages 1-3: use very simple words and short sentences
    - Stages 7-8: use IELTS-style language
    - Stages 9-12: use professional and business English
    - Be encouraging and supportive.
    Respond ONLY with JSON:
    {{"reply": "your next message in the conversation",
      "corrections": [{{"wrong": "exact mistaken phrase from the learner's LAST message",
                        "right": "corrected phrase", "why": "one short reason"}}]}}
    Use an empty corrections list if the learner's last message had no real mistakes.
    """
    chat_model = genai.GenerativeModel(
        GEMINI_MODEL, system_instruction=system_context,
        generation_config={"response_mime_type": "application/json"},
    )
    recent = history[-6:]  # Keep last 6 messages for context
    while recent and recent[0].get("role") != "user":
        recent = recent[1:]  # history must start with a user turn
    chat = chat_model.start_chat(history=recent)
    response = chat.send_message(message)
    try:
        data = json.loads(response.text)
        return {"reply": str(data.get("reply", "")).strip(), "corrections": data.get("corrections") or []}
    except (ValueError, AttributeError):
        return {"reply": response.text, "corrections": []}


def analyze_audio_file(audio_bytes: bytes, mime_type: str, level: int) -> dict:
    """Listen to a recording with Gemini and return transcript + speaking feedback."""
    import json
    prompt = f"""
    You are an English speaking coach. Listen to this recording of a learner at {describe(level)}.
    Respond ONLY with JSON:
    {{
        "transcript": "exactly what the learner said",
        "grammar_score": 0-100, "fluency_score": 0-100, "vocabulary_score": 0-100,
        "pronunciation_score": 0-100, "overall_score": 0-100,
        "grammar_mistakes": [{{"wrong": "phrase", "right": "correction", "why": "short reason"}}],
        "pronunciation_tips": ["specific word and how to say it better"],
        "tone_feedback": "comment on tone, confidence, intonation and energy",
        "pace": "too slow / good / too fast, with one short comment",
        "filler_words_detected": ["um", "like"],
        "filler_word_count": 0,
        "strengths": ["..."],
        "improvements": ["..."],
        "ielts_equivalent_band": "e.g. 5.5 (only for stages 6-8, otherwise empty)",
        "detailed_feedback": "2-4 encouraging sentences with the most important advice"
    }}
    If the recording has no clear speech, return an empty transcript.
    """
    response = model.generate_content(
        [prompt, {"mime_type": mime_type, "data": audio_bytes}],
        generation_config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)
