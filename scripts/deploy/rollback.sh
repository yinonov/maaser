#!/usr/bin/env bash
# Rollback deployment to previous version
# Usage: ./rollback.sh <environment> [--platform mobile|dashboard|functions|all]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [--platform mobile|dashboard|functions|all]"
  echo "  environment: staging|prod"
  echo "  --platform: Specific platform to rollback (default: all)"
  exit 2
fi

ENV="$1"

# Only allow rollback for staging and prod
if [[ ! "$ENV" =~ ^(staging|prod)$ ]]; then
  log_error "Rollback only supported for staging and prod environments"
  exit 2
fi

shift

PLATFORM="all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)
      PLATFORM="$2"
      if [[ ! "$PLATFORM" =~ ^(mobile|dashboard|functions|all)$ ]]; then
        log_error "Invalid platform: $PLATFORM"
        exit 2
      fi
      shift 2
      ;;
    *)
      log_error "Unknown option: $1"
      exit 2
      ;;
  esac
done

log_info "[rollback] Starting rollback for $ENV"
log_warning "[rollback] This will revert to the previous deployment"

# Confirm rollback
confirm "Are you sure you want to rollback $ENV?"

# Start timer
start_timer

ROLLBACK_STATUS="success"
FAILED_PLATFORMS=()

# Rollback functions
rollback_functions() {
  log_info "[rollback] Rolling back functions..."
  
  cd "$REPO_ROOT/functions"
  
  # Get previous deployment info
  DEPLOYMENTS_DIR="$REPO_ROOT/.deployments"
  PREVIOUS_DEPLOYMENT=$(ls -t "$DEPLOYMENTS_DIR/$ENV-functions-"*.json 2>/dev/null | sed -n '2p' || echo "")
  
  if [[ -z "$PREVIOUS_DEPLOYMENT" ]]; then
    log_error "No previous deployment found for functions"
    return 5
  fi
  
  PREVIOUS_COMMIT=$(get_json_value "$PREVIOUS_DEPLOYMENT" ".commit")
  
  log_info "Rolling back to commit: $PREVIOUS_COMMIT"
  
  # Checkout previous commit
  git stash push -m "Rollback stash $(date +%s)" || true
  git checkout "$PREVIOUS_COMMIT" -- .
  
  # Deploy previous version
  if firebase use "$ENV" && firebase deploy --only functions; then
    log_success "Functions rolled back successfully"
    git reset --hard HEAD  # Clean up
  else
    log_error "Functions rollback failed"
    git reset --hard HEAD  # Clean up
    return 1
  fi
}

# Rollback dashboard
rollback_dashboard() {
  log_info "[rollback] Rolling back dashboard..."
  
  cd "$REPO_ROOT/dashboard"
  
  # Vercel maintains deployment history
  log_info "To rollback dashboard, use Vercel dashboard:"
  log_info "1. Go to: https://vercel.com/hamaaser/dashboard/deployments"
  log_info "2. Find the previous successful deployment"
  log_info "3. Click 'Promote to Production'"
  log_warning "Dashboard rollback must be done manually via Vercel UI"
  
  # For now, we'll skip automatic rollback
  log_warning "Dashboard rollback skipped (manual action required)"
}

# Rollback mobile
rollback_mobile() {
  log_info "[rollback] Rolling back mobile apps..."
  
  log_warning "Mobile app rollback is not supported via script"
  log_info "Mobile apps are distributed via app stores and cannot be instantly rolled back"
  log_info "Users will receive previous version through app store updates"
  log_info ""
  log_info "To rollback mobile apps:"
  log_info "1. Build previous version: git checkout <previous-commit> && ./scripts/deploy/deploy-mobile.sh $ENV --platform all --submit"
  log_info "2. Wait for app store approval (~24-48 hours)"
  log_info "3. Users will update to rollback version"
  
  log_warning "Mobile rollback skipped (requires manual rebuild and app store approval)"
}

# Execute rollback based on platform
if [[ "$PLATFORM" == "all" ]] || [[ "$PLATFORM" == "functions" ]]; then
  if ! rollback_functions; then
    ROLLBACK_STATUS="failed"
    FAILED_PLATFORMS+=("functions")
  fi
fi

if [[ "$PLATFORM" == "all" ]] || [[ "$PLATFORM" == "dashboard" ]]; then
  rollback_dashboard
fi

if [[ "$PLATFORM" == "all" ]] || [[ "$PLATFORM" == "mobile" ]]; then
  rollback_mobile
fi

# Get duration
DURATION=$(end_timer)
FORMATTED_DURATION=$(format_duration "$DURATION")

# Report results
echo ""
log_info "═══════════════════════════════════════"

if [[ "$ROLLBACK_STATUS" == "success" ]] && [[ ${#FAILED_PLATFORMS[@]} -eq 0 ]]; then
  log_success "[rollback] ✅ Rollback completed"
  log_info "[rollback] Total time: $FORMATTED_DURATION"
  
  send_slack_notification "✅ Rollback of $ENV completed in $FORMATTED_DURATION" "warning"
  
  exit 0
else
  log_error "[rollback] ❌ Rollback failed for some platforms"
  if [[ ${#FAILED_PLATFORMS[@]} -gt 0 ]]; then
    log_error "[rollback] Failed platforms: ${FAILED_PLATFORMS[*]}"
  fi
  log_info "[rollback] Total time: $FORMATTED_DURATION"
  
  send_slack_notification "❌ Rollback of $ENV failed" "error"
  
  exit 1
fi
