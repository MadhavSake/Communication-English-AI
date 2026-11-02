# Artifact Registry — Docker images store karne ke liye
resource "google_artifact_registry_repository" "english_ai" {
  project       = var.project_id
  location      = var.region
  repository_id = "english-ai"
  format        = "DOCKER"
  description   = "English AI App Docker images"

  depends_on = [google_project_service.apis]
}
