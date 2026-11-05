# 🗣️ Communication English AI — POC v1.1

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

- **Frontend:** React.js (nginx) → GCP Cloud Run
- **Backend:** Python FastAPI → GCP Cloud Run
- **AI:** Google Gemini (model set via `GEMINI_MODEL`, default `gemini-flash-latest`), Speech-to-Text, Text-to-Speech, Vision API
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

## First-time GCP setup (once)

```bash
# 1. Terraform state bucket
bash terraform/bootstrap.sh

# 2. Infra: APIs, Artifact Registry, runtime SA, Gemini secret
cd terraform
cp terraform.tfvars.example terraform.tfvars   # add gemini_api_key
terraform init
terraform apply -target=google_project_service.apis \
  -target=google_artifact_registry_repository.english_ai \
  -target=google_service_account.cloud_run_sa \
  -target=google_project_iam_member.cloud_run_roles \
  -target=google_secret_manager_secret_version.gemini_api_key \
  -target=google_secret_manager_secret_iam_member.backend_secret_access
```

The Cloud Run services themselves are deployed by GitHub Actions (images
don't exist until the first pipeline run, so a full `terraform apply` before
that would fail).

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full WIF provider resource name |
| `GCP_SERVICE_ACCOUNT` | Deployer SA email (`english-ai-deployer@<project>.iam.gserviceaccount.com`) |

The Gemini key lives in Secret Manager (`gemini-api-key`), not in GitHub.

## Deploy

Push to `main` (or run the workflow manually) → GitHub Actions:
- Backend → Cloud Run `english-ai-backend` (runtime SA `english-ai-runtime`)
- Frontend → Cloud Run `english-ai-frontend`, built with the backend URL baked in
