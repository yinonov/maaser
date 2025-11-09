#!/usr/bin/env bash
# Validate all required secrets are configured
# Usage: ./check-secrets.sh <environment>

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment>"
  echo "  environment: dev|staging|prod"
  exit 2
fi

ENV="$1"
validate_environment "$ENV"

# Convert environment name to full name
case "$ENV" in
  dev) FULL_ENV="development" ;;
  staging) FULL_ENV="staging" ;;
  prod) FULL_ENV="production" ;;
esac

log_info "Checking secrets for $FULL_ENV environment..."
echo ""

# Track validation status
VALIDATION_FAILED=false

# Check GitHub Secrets
check_github_secrets() {
  log_info "GitHub Secrets:"
  
  local secrets=(
    "EXPO_TOKEN"
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
    "FIREBASE_TOKEN"
    "SLACK_WEBHOOK_URL"
  )
  
  if [[ "$ENV" == "prod" ]]; then
    secrets+=("APPLE_API_KEY" "GOOGLE_SERVICE_ACCOUNT")
  fi
  
  for secret in "${secrets[@]}"; do
    if gh secret list 2>/dev/null | grep -q "^$secret"; then
      log_success "  $secret"
    else
      if [[ "$ENV" == "prod" ]] && [[ "$secret" == "APPLE_API_KEY" || "$secret" == "GOOGLE_SERVICE_ACCOUNT" ]]; then
        log_warning "  $secret (optional for submission)"
      else
        log_error "  $secret"
        VALIDATION_FAILED=true
      fi
    fi
  done
  
  echo ""
}

# Check Firebase Functions Secrets
check_firebase_secrets() {
  local firebase_project="hamaaser-$ENV"
  
  log_info "Firebase Secrets ($firebase_project):"
  
  # Check if firebase CLI is available
  if ! command -v firebase &> /dev/null; then
    log_warning "  Firebase CLI not installed, skipping Firebase secrets check"
    echo ""
    return 0
  fi
  
  # Try to switch to the project
  if ! firebase use "$ENV" &> /dev/null; then
    log_warning "  Firebase project $firebase_project not configured"
    log_info "  Run: firebase use --add"
    echo ""
    return 0
  fi
  
  local secrets=(
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "SENDGRID_API_KEY"
  )
  
  for secret in "${secrets[@]}"; do
    if firebase functions:secrets:access "$secret" --project "$firebase_project" &> /dev/null; then
      log_success "  $secret"
    else
      log_error "  $secret"
      VALIDATION_FAILED=true
    fi
  done
  
  echo ""
}

# Check Vercel Environment Variables
check_vercel_vars() {
  log_info "Vercel Environment Variables:"
  
  # Check if vercel CLI is available
  if ! command -v vercel &> /dev/null; then
    log_warning "  Vercel CLI not installed, skipping Vercel check"
    echo ""
    return 0
  fi
  
  # Determine Vercel environment
  local vercel_env="Development"
  case "$ENV" in
    staging) vercel_env="Preview" ;;
    prod) vercel_env="Production" ;;
  esac
  
  local vars=(
    "NEXT_PUBLIC_APP_ENV"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "FIREBASE_ADMIN_SERVICE_ACCOUNT"
  )
  
  cd "$REPO_ROOT/dashboard"
  
  for var in "${vars[@]}"; do
    # Check if variable exists (this is a simplified check)
    if vercel env ls "$vercel_env" 2>/dev/null | grep -q "$var"; then
      log_success "  $var"
    else
      log_warning "  $var (cannot verify, check Vercel dashboard)"
    fi
  done
  
  cd "$REPO_ROOT"
  echo ""
}

# Check environment configuration file
check_config_file() {
  log_info "Environment Configuration:"
  
  local config_file="$REPO_ROOT/config/environments/${FULL_ENV}.json"
  
  if [[ ! -f "$config_file" ]]; then
    log_error "  Configuration file not found: $config_file"
    log_info "  Run: ./scripts/deploy/setup-environments.sh"
    VALIDATION_FAILED=true
  else
    log_success "  Configuration file exists"
    
    # Check for placeholder values
    if grep -q "REPLACE_WITH" "$config_file"; then
      log_warning "  Configuration contains placeholder values"
      log_info "  Edit: $config_file"
    else
      log_success "  Configuration appears complete"
    fi
  fi
  
  echo ""
}

# Main execution
main() {
  check_config_file
  
  # Check GitHub secrets if gh CLI is available
  if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
      check_github_secrets
    else
      log_warning "GitHub CLI not authenticated, skipping GitHub secrets check"
      log_info "Run: gh auth login"
      echo ""
    fi
  else
    log_warning "GitHub CLI not installed, skipping GitHub secrets check"
    log_info "Install: brew install gh"
    echo ""
  fi
  
  # Check Firebase secrets
  check_firebase_secrets
  
  # Check Vercel variables
  check_vercel_vars
  
  # Summary
  if [[ "$VALIDATION_FAILED" == "true" ]]; then
    log_error "Secrets validation failed"
    log_info "See: specs/002-deployment-infrastructure/contracts/secrets-schema.md"
    exit 7
  else
    log_success "All required secrets appear to be configured"
  fi
}

main
