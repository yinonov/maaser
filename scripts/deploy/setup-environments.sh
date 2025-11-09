#!/usr/bin/env bash
# Setup environment configuration files
# Usage: ./setup-environments.sh [--recreate]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="$REPO_ROOT/config/environments"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
RECREATE=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --recreate)
      RECREATE=true
      shift
      ;;
    *)
      echo "Usage: $0 [--recreate]"
      exit 2
      ;;
  esac
done

# Create config directory
mkdir -p "$CONFIG_DIR"

# Function to create environment config
create_env_config() {
  local env="$1"
  local short_name="$2"
  local config_file="$CONFIG_DIR/${env}.json"
  
  if [[ -f "$config_file" ]] && [[ "$RECREATE" == "false" ]]; then
    log_warning "Configuration file already exists: $config_file"
    log_info "Use --recreate to overwrite"
    return 0
  fi
  
  log_info "Creating configuration for $env environment..."
  
  # Determine Firebase project ID
  local firebase_project_id="hamaaser-${short_name}"
  
  # Determine Stripe mode
  local stripe_mode="test"
  if [[ "$env" == "production" ]]; then
    stripe_mode="live"
  fi
  
  # Determine bundle identifiers
  local bundle_suffix=""
  if [[ "$env" != "production" ]]; then
    bundle_suffix=".${short_name}"
  fi
  
  # Create config file
  cat > "$config_file" <<EOF
{
  "name": "$env",
  "shortName": "$short_name",
  "firebase": {
    "projectId": "$firebase_project_id",
    "apiKey": "REPLACE_WITH_FIREBASE_API_KEY",
    "authDomain": "${firebase_project_id}.firebaseapp.com",
    "storageBucket": "${firebase_project_id}.appspot.com",
    "messagingSenderId": "REPLACE_WITH_MESSAGING_SENDER_ID",
    "appId": "REPLACE_WITH_FIREBASE_APP_ID"
  },
  "stripe": {
    "publishableKey": "REPLACE_WITH_STRIPE_PUBLISHABLE_KEY",
    "mode": "$stripe_mode",
    "webhookEndpoint": "https://us-central1-${firebase_project_id}.cloudfunctions.net/handleWebhook"
  },
  "targets": {
    "dashboard": {
      "url": "https://${env}-dashboard.hamaaser.org",
      "vercelProjectId": "REPLACE_WITH_VERCEL_PROJECT_ID"
    },
    "mobile": {
      "bundleIdentifier": "org.hamaaser.app${bundle_suffix}",
      "packageName": "org.hamaaser.app${bundle_suffix}",
      "easProfile": "$env",
      "updateChannel": "$env"
    },
    "functions": {
      "region": "us-central1",
      "runtime": "nodejs20"
    }
  },
  "features": {
    "maintenanceMode": false,
    "enableAnalytics": true,
    "enableErrorReporting": true,
    "logLevel": "$([ "$env" = "production" ] && echo "info" || echo "debug")"
  }
}
EOF
  
  log_success "Created: $config_file"
}

# Create .env.example template
create_env_example() {
  local env_example="$CONFIG_DIR/.env.example"
  
  if [[ -f "$env_example" ]] && [[ "$RECREATE" == "false" ]]; then
    log_warning "Template already exists: $env_example"
    return 0
  fi
  
  log_info "Creating .env.example template..."
  
  cat > "$env_example" <<'EOF'
# GitHub Secrets (for CI/CD)
# Set these in: Repository Settings → Secrets and Variables → Actions
EXPO_TOKEN=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
FIREBASE_TOKEN=
SLACK_WEBHOOK_URL=

# Production Only
APPLE_API_KEY=
GOOGLE_SERVICE_ACCOUNT=

# Firebase Functions Secrets (per environment)
# Set these with: firebase functions:secrets:set STRIPE_SECRET_KEY
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=

# Vercel Environment Variables (per environment)
# Set these with: vercel env add <NAME>
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
FIREBASE_ADMIN_SERVICE_ACCOUNT=
EOF
  
  log_success "Created: $env_example"
}

# Main execution
main() {
  log_info "Setting up environment configurations..."
  
  # Create environment configs
  create_env_config "development" "dev"
  create_env_config "staging" "staging"
  create_env_config "production" "prod"
  
  # Create .env.example
  create_env_example
  
  log_success "Environment setup complete!"
  log_info ""
  log_info "Next steps:"
  log_info "1. Edit configuration files in config/environments/"
  log_info "2. Replace placeholder values with actual credentials"
  log_info "3. Run: ./scripts/deploy/check-secrets.sh <env>"
  log_info ""
  log_info "See: specs/002-deployment-infrastructure/quickstart.md for detailed setup"
}

main
