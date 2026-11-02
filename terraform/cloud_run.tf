# ── Backend: Cloud Run Service ────────────────────────────
resource "google_cloud_run_v2_service" "backend" {
  project  = var.project_id
  name     = "${var.app_name}-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      # Image will be updated by GitHub Actions on each deploy
      image = "${var.region}-docker.pkg.dev/${var.project_id}/english-ai/${var.app_name}-backend:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true  # Only use CPU during requests (cost saving)
      }

      # Gemini API Key from Secret Manager
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 3
      }
    }
  }

  depends_on = [
    google_artifact_registry_repository.english_ai,
    google_secret_manager_secret_version.gemini_api_key,
  ]
}

# Allow public access to backend
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Frontend: Cloud Run Service ───────────────────────────
resource "google_cloud_run_v2_service" "frontend" {
  project  = var.project_id
  name     = "${var.app_name}-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/english-ai/${var.app_name}-frontend:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
        cpu_idle = true
      }

      ports {
        container_port = 80
      }
    }
  }

  depends_on = [google_artifact_registry_repository.english_ai]
}

# Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
