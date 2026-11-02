output "backend_url" {
  description = "Backend Cloud Run URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "Frontend Cloud Run URL — share this link!"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry" {
  description = "Docker registry path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/english-ai"
}
