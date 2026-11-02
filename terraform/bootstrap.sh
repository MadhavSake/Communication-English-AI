#!/bin/bash
# Run this ONCE manually in GCP Cloud Shell before first deploy
# This creates the GCS bucket for Terraform state

PROJECT_ID="madhav-test-471011"
REGION="asia-south1"
BUCKET="${PROJECT_ID}-tfstate"

echo "Creating Terraform state bucket..."
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET
gsutil versioning set on gs://$BUCKET

echo "✅ Done! Bucket: gs://$BUCKET"
echo "Now push to main branch — GitHub Actions will handle everything!"
