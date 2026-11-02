# 🗣️ Communication English AI

An AI-powered English communication improvement platform — from absolute beginner to IELTS Band 9.

## Features

- 📚 **Notes** — Level-wise study material + live grammar checker
- 🎤 **Audio Practice** — Record speech → AI transcription + fluency analysis
- 😊 **Face & Expression Analysis** — Confidence, smile, eye contact detection
- 💬 **Live Chat** — AI conversation partner with scenario-based practice
- 🎬 **Videos** — Curated lessons per level
- 📖 **Books** — Recommended reading list
- 📊 **Progress** — Skill tracking & level journey

## 15 Learning Levels

| Levels | Focus |
|--------|-------|
| 1–3    | Beginner to Elementary |
| 4–7    | Pre-Intermediate to Advanced |
| 8–15   | IELTS Band 5.5 → 9.0 |

## Tech Stack

- **Frontend:** React.js → Firebase Hosting
- **Backend:** Python FastAPI → GCP Cloud Run
- **AI:** Google Gemini 1.5 Flash, Speech-to-Text, Vision API
- **CI/CD:** GitHub Actions

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY in .env
uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8080 npm start
```

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | GCP service account JSON (base64) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |
| `GCP_PROJECT_HASH` | Cloud Run URL hash (from console) |

## Deploy

Push to `main` branch → GitHub Actions auto-deploys:
- Backend → GCP Cloud Run
- Frontend → Firebase Hosting
