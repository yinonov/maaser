#!/usr/bin/env bash
# Deploy Firebase Cloud Functions
# Usage: ./deploy-functions.sh <environment> [--only function-name] [--force]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [--only function-name] [--force]"
  echo "  environment: dev|staging|prod"
  echo "  --only: Deploy specific function only"
  echo "  --force: Skip confirmation prompts"
  exit 2
fi

ENV="$1"
validate_environment "$ENV"
shift

ONLY_FUNCTION=""
FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      ONLY_FUNCTION="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      exit 2
      ;;
  esac
done

# Check required commands
check_command "firebase"
check_command "node"
check_command "npm"

# Load environment config
CONFIG_FILE=$(load_env_config "${ENV}")
FIREBASE_PROJECT=$(get_json_value "$CONFIG_FILE" ".firebase.projectId")

log_info "[deploy-functions] Starting deployment to $ENV (project: $FIREBASE_PROJECT)"

# Start timer
start_timer

# Switch to functions directory
cd "$REPO_ROOT/functions"

# Switch to correct Firebase project
log_info "Switching to Firebase project: $FIREBASE_PROJECT"
execute_or_dry_run "firebase use $ENV"

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

# Build TypeScript
log_info "Building TypeScript..."
execute_or_dry_run "npm run build"
log_success "Build complete"

# Run tests
log_info "Running tests..."
if npm test &> /dev/null; then
  log_success "Tests passed"
else
  log_error "Tests failed"
  log_error "Deployment blocked due to test failures"
  exit 3
fi

# Confirm deployment
if [[ "$ENV" == "prod" ]] && [[ "$FORCE" == "false" ]]; then
  confirm "Deploy to PRODUCTION?"
fi

# Deploy functions
log_info "Deploying functions..."

DEPLOY_CMD="firebase deploy --only functions"
if [[ -n "$ONLY_FUNCTION" ]]; then
  DEPLOY_CMD="$DEPLOY_CMD:$ONLY_FUNCTION"
  log_info "Deploying only function: $ONLY_FUNCTION"
fi

if execute_or_dry_run "$DEPLOY_CMD"; then
  DEPLOY_STATUS="success"
  log_success "Functions deployed successfully"
else
  DEPLOY_STATUS="failed"
  log_error "Functions deployment failed"
  exit 1
fi

# Get duration
DURATION=$(end_timer)
FORMATTED_DURATION=$(format_duration "$DURATION")

# Save deployment record
cd "$REPO_ROOT"
save_deployment_record "$ENV" "functions" "$DEPLOY_STATUS" "$DURATION"

# Send notification
if [[ "$DEPLOY_STATUS" == "success" ]]; then
  send_slack_notification "✅ Functions deployed to $ENV in $FORMATTED_DURATION" "success"
  log_success "[deploy-functions] ✅ Deployment complete ($FORMATTED_DURATION)"
else
  send_slack_notification "❌ Functions deployment to $ENV failed" "error"
  log_error "[deploy-functions] ❌ Deployment failed"
  exit 1
fi

# Output deployment info
if [[ "${DRY_RUN:-false}" == "false" ]]; then
  cat <<EOF

{
  "environment": "$ENV",
  "project": "$FIREBASE_PROJECT",
  "functions": $(firebase functions:list --json 2>/dev/null | jq -r '[.[].id]' || echo '[]'),
  "duration": $DURATION
}
EOF
fi
