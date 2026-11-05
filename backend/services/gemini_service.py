import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from services.syllabus import describe

load_dotenv()

# Vertex AI (GEMINI_USE_VERTEX=true, billed to the GCP project, uses the Cloud Run
# service account — no key) or the Gemini API with GEMINI_API_KEY.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1500"))  # caps cost per call
_client = None


def _get_client():
    global _client
    if _client is None:
        if os.getenv("GEMINI_USE_VERTEX", "").lower() in ("1", "true", "yes"):
            _client = genai.Client(
                vertexai=True,
                project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                location=os.getenv("VERTEX_LOCATION", "global"),
            )
        else:
            _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


def _part(p):
    if isinstance(p, dict) and "data" in p:
        return types.Part.from_bytes(data=p["data"], mime_type=p["mime_type"])
    return p


class _Model:
    """Small adapter so the functions below keep a generate_content() call."""

    def generate_content(self, contents, generation_config=None, system_instruction=None):
        if isinstance(contents, list):
            contents = [_part(c) for c in contents]
        cfg = {"max_output_tokens": MAX_OUTPUT_TOKENS, **(generation_config or {})}
        config = types.GenerateContentConfig(system_instruction=system_instruction, **cfg)
        return _get_client().models.generate_content(model=GEMINI_MODEL, contents=contents, config=config)


model = _Model()


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
    recent = history[-6:]  # Keep last 6 messages for context
    while recent and recent[0].get("role") != "user":
        recent = recent[1:]  # history must start with a user turn
    contents = [
        types.Content(role=h["role"], parts=[types.Part.from_text(text=t) for t in h["parts"]])
        for h in recent
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
    response = model.generate_content(
        contents,
        generation_config={"response_mime_type": "application/json"},
        system_instruction=system_context,
    )
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
