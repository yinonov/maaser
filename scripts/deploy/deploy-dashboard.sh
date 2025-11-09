#!/usr/bin/env bash
# Deploy Next.js dashboard to Vercel
# Usage: ./deploy-dashboard.sh <environment> [--production]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [--production]"
  echo "  environment: dev|staging|prod"
  echo "  --production: Use Vercel production deploy (required for prod)"
  exit 2
fi

ENV="$1"
validate_environment "$ENV"
shift

USE_PRODUCTION=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --production)
      USE_PRODUCTION=true
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      exit 2
      ;;
  esac
done

# Validate production flag
if [[ "$ENV" == "prod" ]] && [[ "$USE_PRODUCTION" == "false" ]]; then
  log_error "Production deployment requires --production flag"
  exit 2
fi

# Check required commands
check_command "vercel"
check_command "node"
check_command "npm"

# Check required environment variables for CI
if [[ "${CI:-false}" == "true" ]]; then
  require_env_var "VERCEL_TOKEN"
  require_env_var "VERCEL_ORG_ID"
  require_env_var "VERCEL_PROJECT_ID"
fi

# Load environment config
CONFIG_FILE=$(load_env_config "${ENV}")

log_info "[deploy-dashboard] Starting deployment to $ENV"

# Start timer
start_timer

# Switch to dashboard directory
cd "$REPO_ROOT/dashboard"

# Install dependencies
log_info "Installing dependencies..."
execute_or_dry_run "npm ci"

# Run linting
log_info "Running linter..."
if execute_or_dry_run "npm run lint" 2>&1; then
  log_success "Linting passed"
else
  log_warning "Linting warnings detected (continuing)"
fi

# Build locally to catch errors early
log_info "Building application..."
execute_or_dry_run "npm run build"
log_success "Build complete"

# Deploy to Vercel
log_info "Deploying to Vercel..."

VERCEL_CMD="vercel"

# Add environment-specific flags
case "$ENV" in
  dev)
    # Development deployments are preview deployments
    ;;
  staging)
    # Staging deployments are preview deployments
    ;;
  prod)
    VERCEL_CMD="$VERCEL_CMD --prod"
    ;;
esac

# CI mode
if [[ "${CI:-false}" == "true" ]]; then
  VERCEL_CMD="$VERCEL_CMD --yes"
fi

# Deploy
if DEPLOY_OUTPUT=$(execute_or_dry_run "$VERCEL_CMD" 2>&1); then
  DEPLOY_STATUS="success"
  
  # Extract deployment URL from output
  DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^ ]+\.vercel\.app' | head -1 || echo "")
  
  log_success "Dashboard deployed successfully"
  if [[ -n "$DEPLOYMENT_URL" ]]; then
    log_info "Deployment URL: $DEPLOYMENT_URL"
  fi
else
  DEPLOY_STATUS="failed"
  log_error "Dashboard deployment failed"
  log_error "$DEPLOY_OUTPUT"
  exit 1
fi

# Get duration
DURATION=$(end_timer)
FORMATTED_DURATION=$(format_duration "$DURATION")

# Save deployment record
cd "$REPO_ROOT"
save_deployment_record "$ENV" "dashboard" "$DEPLOY_STATUS" "$DURATION"

# Send notification
if [[ "$DEPLOY_STATUS" == "success" ]]; then
  send_slack_notification "✅ Dashboard deployed to $ENV in $FORMATTED_DURATION\n$DEPLOYMENT_URL" "success"
  log_success "[deploy-dashboard] ✅ Deployment complete ($FORMATTED_DURATION)"
else
  send_slack_notification "❌ Dashboard deployment to $ENV failed" "error"
  log_error "[deploy-dashboard] ❌ Deployment failed"
  exit 1
fi

# Output deployment info
if [[ "${DRY_RUN:-false}" == "false" ]] && [[ -n "$DEPLOYMENT_URL" ]]; then
  cat <<EOF

{
  "environment": "$ENV",
  "deploymentUrl": "$DEPLOYMENT_URL",
  "duration": $DURATION
}
EOF
fi
