#!/usr/bin/env bash
# Build and deploy mobile apps via Expo EAS
# Usage: ./deploy-mobile.sh <environment> [--platform ios|android|all] [--submit]

set -e
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [--platform ios|android|all] [--submit]"
  echo "  environment: dev|staging|prod"
  echo "  --platform: ios, android, or all (default: all)"
  echo "  --submit: Submit to App Store/Play Store after build (prod only)"
  exit 2
fi

ENV="$1"
validate_environment "$ENV"
shift

PLATFORM="all"
SUBMIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)
      PLATFORM="$2"
      if [[ ! "$PLATFORM" =~ ^(ios|android|all)$ ]]; then
        log_error "Invalid platform: $PLATFORM"
        exit 2
      fi
      shift 2
      ;;
    --submit)
      SUBMIT=true
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      exit 2
      ;;
  esac
done

# Validate submit flag
if [[ "$SUBMIT" == "true" ]] && [[ "$ENV" != "prod" ]]; then
  log_warning "App store submission is only supported for production"
  SUBMIT=false
fi

# Check required commands
check_command "eas"
check_command "node"
check_command "npm"

# Check required environment variables for CI
if [[ "${CI:-false}" == "true" ]]; then
  require_env_var "EXPO_TOKEN"
fi

# Check submission credentials
if [[ "$SUBMIT" == "true" ]]; then
  if [[ "$PLATFORM" == "ios" ]] || [[ "$PLATFORM" == "all" ]]; then
    if [[ -z "${APPLE_API_KEY:-}" ]]; then
      log_warning "APPLE_API_KEY not set, iOS submission will be skipped"
    fi
  fi
  if [[ "$PLATFORM" == "android" ]] || [[ "$PLATFORM" == "all" ]]; then
    if [[ -z "${GOOGLE_SERVICE_ACCOUNT:-}" ]]; then
      log_warning "GOOGLE_SERVICE_ACCOUNT not set, Android submission will be skipped"
    fi
  fi
fi

# Load environment config
CONFIG_FILE=$(load_env_config "${ENV}")
EAS_PROFILE=$(get_json_value "$CONFIG_FILE" ".targets.mobile.easProfile")

log_info "[deploy-mobile] Starting build for $ENV (profile: $EAS_PROFILE)"

# Start timer
start_timer

# Switch to mobile directory
cd "$REPO_ROOT/mobile"

# Install dependencies
log_info "Installing dependencies..."
execute_or_dry_run "npm ci"

# Build based on platform
BUILD_STATUS="success"
BUILD_URLS=()

build_platform() {
  local platform="$1"
  
  log_info "Building for $platform..."
  
  BUILD_CMD="eas build --platform $platform --profile $EAS_PROFILE --non-interactive"
  
  if [[ "${CI:-false}" == "true" ]]; then
    BUILD_CMD="$BUILD_CMD --no-wait"
  fi
  
  if BUILD_OUTPUT=$(execute_or_dry_run "$BUILD_CMD" 2>&1); then
    log_success "$platform build started"
    
    # Extract build URL
    BUILD_URL=$(echo "$BUILD_OUTPUT" | grep -oE 'https://expo.dev/[^ ]+' | head -1 || echo "")
    if [[ -n "$BUILD_URL" ]]; then
      BUILD_URLS+=("$BUILD_URL")
      log_info "Build URL: $BUILD_URL"
    fi
    
    # Submit if requested
    if [[ "$SUBMIT" == "true" ]]; then
      submit_platform "$platform"
    fi
  else
    log_error "$platform build failed"
    log_error "$BUILD_OUTPUT"
    BUILD_STATUS="failed"
    return 1
  fi
}

submit_platform() {
  local platform="$1"
  
  log_info "Submitting $platform to store..."
  
  SUBMIT_CMD="eas submit --platform $platform --profile $EAS_PROFILE --latest --non-interactive"
  
  if execute_or_dry_run "$SUBMIT_CMD" 2>&1; then
    log_success "$platform submitted to store"
  else
    log_error "$platform submission failed"
    exit 4
  fi
}

# Build for requested platforms
if [[ "$PLATFORM" == "all" ]] || [[ "$PLATFORM" == "ios" ]]; then
  build_platform "ios" || BUILD_STATUS="failed"
fi

if [[ "$PLATFORM" == "all" ]] || [[ "$PLATFORM" == "android" ]]; then
  build_platform "android" || BUILD_STATUS="failed"
fi

# Get duration
DURATION=$(end_timer)
FORMATTED_DURATION=$(format_duration "$DURATION")

# Save deployment record
cd "$REPO_ROOT"
save_deployment_record "$ENV" "mobile" "$BUILD_STATUS" "$DURATION"

# Send notification
if [[ "$BUILD_STATUS" == "success" ]]; then
  NOTIFICATION_MSG="✅ Mobile builds started for $ENV ($PLATFORM) in $FORMATTED_DURATION"
  for url in "${BUILD_URLS[@]}"; do
    NOTIFICATION_MSG="$NOTIFICATION_MSG\n$url"
  done
  send_slack_notification "$NOTIFICATION_MSG" "success"
  log_success "[deploy-mobile] ✅ Build(s) started ($FORMATTED_DURATION)"
else
  send_slack_notification "❌ Mobile build for $ENV failed" "error"
  log_error "[deploy-mobile] ❌ Build failed"
  exit 1
fi

# Output build info
if [[ "${DRY_RUN:-false}" == "false" ]]; then
  cat <<EOF

{
  "environment": "$ENV",
  "platform": "$PLATFORM",
  "builds": [
$(
  for url in "${BUILD_URLS[@]}"; do
    echo "    {\"buildUrl\": \"$url\"}"
  done | paste -sd "," -
)
  ],
  "duration": $DURATION
}
EOF
fi
