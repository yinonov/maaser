#!/usr/bin/env bash
# Orchestrate deployment of all platforms
# Usage: ./deploy-all.sh <environment> [--skip-mobile] [--skip-dashboard] [--skip-functions]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [options]"
  echo "  environment: dev|staging|prod"
  echo "  --skip-mobile: Skip mobile build/deploy"
  echo "  --skip-dashboard: Skip dashboard deploy"
  echo "  --skip-functions: Skip functions deploy"
  exit 2
fi

ENV="$1"
validate_environment "$ENV"
shift

DEPLOY_MOBILE=true
DEPLOY_DASHBOARD=true
DEPLOY_FUNCTIONS=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-mobile)
      DEPLOY_MOBILE=false
      shift
      ;;
    --skip-dashboard)
      DEPLOY_DASHBOARD=false
      shift
      ;;
    --skip-functions)
      DEPLOY_FUNCTIONS=false
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      exit 2
      ;;
  esac
done

# Validate configuration
log_info "[deploy-all] Starting deployment to $ENV"
log_info "[deploy-all] Validating configuration..."

if ! "$SCRIPT_DIR/check-secrets.sh" "$ENV"; then
  log_error "[deploy-all] Secrets validation failed"
  exit 3
fi

log_success "[deploy-all] ✓ Configuration validated"

# Start overall timer
start_timer

# Track deployment status
OVERALL_STATUS="success"
FAILED_PLATFORMS=()

# Deploy functions first (backend must be ready for frontend)
if [[ "$DEPLOY_FUNCTIONS" == "true" ]]; then
  log_info "[deploy-all] → Deploying functions..."
  
  if "$SCRIPT_DIR/deploy-functions.sh" "$ENV"; then
    log_success "[deploy-all] ✓ Functions deployed"
  else
    log_error "[deploy-all] ✗ Functions deployment failed"
    OVERALL_STATUS="failed"
    FAILED_PLATFORMS+=("functions")
  fi
else
  log_info "[deploy-all] ⊘ Skipping functions deployment"
fi

# Deploy dashboard (web frontend)
if [[ "$DEPLOY_DASHBOARD" == "true" ]]; then
  log_info "[deploy-all] → Deploying dashboard..."
  
  DASHBOARD_FLAGS=""
  if [[ "$ENV" == "prod" ]]; then
    DASHBOARD_FLAGS="--production"
  fi
  
  if "$SCRIPT_DIR/deploy-dashboard.sh" "$ENV" $DASHBOARD_FLAGS; then
    log_success "[deploy-all] ✓ Dashboard deployed"
  else
    log_error "[deploy-all] ✗ Dashboard deployment failed"
    OVERALL_STATUS="failed"
    FAILED_PLATFORMS+=("dashboard")
  fi
else
  log_info "[deploy-all] ⊘ Skipping dashboard deployment"
fi

# Build mobile apps (can take longer, runs last)
if [[ "$DEPLOY_MOBILE" == "true" ]]; then
  log_info "[deploy-all] → Building mobile apps..."
  
  if "$SCRIPT_DIR/deploy-mobile.sh" "$ENV" --platform all; then
    log_success "[deploy-all] ✓ Mobile builds started"
  else
    log_error "[deploy-all] ✗ Mobile build failed"
    OVERALL_STATUS="failed"
    FAILED_PLATFORMS+=("mobile")
  fi
else
  log_info "[deploy-all] ⊘ Skipping mobile deployment"
fi

# Get total duration
TOTAL_DURATION=$(end_timer)
FORMATTED_DURATION=$(format_duration "$TOTAL_DURATION")

# Report results
echo ""
log_info "═══════════════════════════════════════"

if [[ "$OVERALL_STATUS" == "success" ]]; then
  log_success "[deploy-all] ✅ All deployments completed successfully"
  log_info "[deploy-all] Total time: $FORMATTED_DURATION"
  
  send_slack_notification "✅ Full deployment to $ENV completed in $FORMATTED_DURATION" "success"
  
  exit 0
else
  log_error "[deploy-all] ❌ Some deployments failed"
  log_error "[deploy-all] Failed platforms: ${FAILED_PLATFORMS[*]}"
  log_info "[deploy-all] Total time: $FORMATTED_DURATION"
  
  send_slack_notification "❌ Deployment to $ENV failed: ${FAILED_PLATFORMS[*]}" "error"
  
  # Offer rollback
  if [[ "$ENV" == "prod" ]] || [[ "$ENV" == "staging" ]]; then
    echo ""
    log_warning "To rollback failed deployments, run:"
    log_info "  ./scripts/deploy/rollback.sh $ENV"
  fi
  
  exit 1
fi
