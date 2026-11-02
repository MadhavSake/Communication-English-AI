variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "madhav-test-471011"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-south1"
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "english-ai"
}
