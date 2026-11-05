# Service Account for Cloud Run to use GCP APIs
resource "google_service_account" "cloud_run_sa" {
  project      = var.project_id
  account_id   = "english-ai-runtime"
  display_name = "English AI Cloud Run Runtime SA"
}

# Allow Cloud Run SA to call Speech, Vision, TTS APIs
locals {
  cloud_run_roles = [
    "roles/speech.client",
    "roles/texttospeech.client",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/secretmanager.secretAccessor",
  ]
}

resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset(local.cloud_run_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Deployer SA already exists (created manually) — just add missing roles
resource "google_project_iam_member" "deployer_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.admin",
    "roles/iam.serviceAccountUser",
    "roles/secretmanager.admin",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:english-ai-deployer@${var.project_id}.iam.gserviceaccount.com"
}
