terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Terraform state stored in GCS bucket (remote state)
  backend "gcs" {
    bucket = "madhav-test-471011-tfstate"
    prefix = "english-ai/terraform.tfstate"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
