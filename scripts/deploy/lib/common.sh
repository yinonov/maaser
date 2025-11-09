#!/usr/bin/env bash
# Common utilities for deployment scripts
# Usage: source "$(dirname "$0")/lib/common.sh"

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for logging
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

# Logging functions
log_info() {
  echo -e "${COLOR_BLUE}ℹ ${1}${COLOR_RESET}"
}

log_success() {
  echo -e "${COLOR_GREEN}✓ ${1}${COLOR_RESET}"
}

log_warning() {
  echo -e "${COLOR_YELLOW}⚠ ${1}${COLOR_RESET}"
}

log_error() {
  echo -e "${COLOR_RED}✗ ${1}${COLOR_RESET}" >&2
}

# Validation functions
require_env_var() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    log_error "Required environment variable not set: $var_name"
    exit 3
  fi
}

validate_environment() {
  local env="$1"
  if [[ ! "$env" =~ ^(dev|staging|prod)$ ]]; then
    log_error "Invalid environment: '$env'. Must be dev, staging, or prod"
    exit 2
  fi
}

check_command() {
  local cmd="$1"
  if ! command -v "$cmd" &> /dev/null; then
    log_error "Required command not found: $cmd"
    log_info "Please install $cmd and try again"
    exit 1
  fi
}

# File operations
load_env_config() {
  local env="$1"
  local config_file="$(git rev-parse --show-toplevel)/config/environments/${env}.json"
  
  if [[ ! -f "$config_file" ]]; then
    log_error "Configuration file not found: $config_file"
    log_info "Run: ./scripts/deploy/setup-environments.sh"
    exit 1
  fi
  
  echo "$config_file"
}

save_deployment_record() {
  local env="$1"
  local platform="$2"
  local status="$3"
  local duration="$4"
  
  local repo_root="$(git rev-parse --show-toplevel)"
  local deployments_dir="$repo_root/.deployments"
  local timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local commit_sha="$(git rev-parse HEAD)"
  local version="$(git describe --tags --always)"
  
  mkdir -p "$deployments_dir"
  
  local record_file="$deployments_dir/${env}-${platform}-${timestamp}.json"
  
  cat > "$record_file" <<EOF
{
  "environment": "$env",
  "platform": "$platform",
  "status": "$status",
  "timestamp": "$timestamp",
  "commit": "$commit_sha",
  "version": "$version",
  "duration": $duration,
  "deployer": "${USER:-unknown}"
}
EOF
  
  log_info "Deployment record saved: $record_file"
}

# Time tracking
declare -g START_TIME

start_timer() {
  START_TIME=$(date +%s)
}

end_timer() {
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  echo "$duration"
}

format_duration() {
  local seconds="$1"
  local minutes=$((seconds / 60))
  local remaining_seconds=$((seconds % 60))
  
  if [[ $minutes -gt 0 ]]; then
    echo "${minutes}m ${remaining_seconds}s"
  else
    echo "${seconds}s"
  fi
}

# Confirmation
confirm() {
  local message="$1"
  local response
  
  # Skip confirmation in CI or if FORCE flag is set
  if [[ "${CI:-false}" == "true" ]] || [[ "${FORCE:-false}" == "true" ]]; then
    return 0
  fi
  
  read -r -p "$message (y/N): " response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      return 0
      ;;
    *)
      log_warning "Operation cancelled by user"
      exit 6
      ;;
  esac
}

# Dry run support
execute_or_dry_run() {
  local cmd="$*"
  
  if [[ "${DRY_RUN:-false}" == "true" ]]; then
    log_info "[DRY RUN] Would execute: $cmd"
  else
    if [[ "${DEBUG:-false}" == "true" ]]; then
      log_info "Executing: $cmd"
    fi
    eval "$cmd"
  fi
}

# Git helpers
get_current_branch() {
  git rev-parse --abbrev-ref HEAD
}

get_commit_sha() {
  git rev-parse HEAD
}

get_short_sha() {
  git rev-parse --short HEAD
}

get_version_tag() {
  git describe --tags --always
}

# JSON helpers
get_json_value() {
  local json_file="$1"
  local key="$2"
  
  if command -v jq &> /dev/null; then
    jq -r "$key" "$json_file"
  else
    log_warning "jq not installed, using grep/sed (less reliable)"
    grep "\"$key\"" "$json_file" | sed 's/.*: "\(.*\)".*/\1/'
  fi
}

# Slack notifications
send_slack_notification() {
  local message="$1"
  local status="${2:-info}"  # info, success, warning, error
  
  if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
    log_warning "SLACK_WEBHOOK_URL not set, skipping notification"
    return 0
  fi
  
  local color=""
  case "$status" in
    success) color="good" ;;
    warning) color="warning" ;;
    error) color="danger" ;;
    *) color="#0096FF" ;;
  esac
  
  local payload=$(cat <<EOF
{
  "attachments": [{
    "color": "$color",
    "text": "$message",
    "footer": "HaMaaser Deployment",
    "ts": $(date +%s)
  }]
}
EOF
)
  
  curl -X POST -H 'Content-type: application/json' \
    --data "$payload" \
    "$SLACK_WEBHOOK_URL" \
    --silent --output /dev/null || log_warning "Failed to send Slack notification"
}

# Progress indicator for long-running operations
show_progress() {
  local pid="$1"
  local message="$2"
  
  local spinner=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0
  
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r${COLOR_BLUE}${spinner[$i]} $message${COLOR_RESET}"
    i=$(((i + 1) % ${#spinner[@]}))
    sleep 0.1
  done
  
  printf "\r"  # Clear the line
}

# Export all functions
export -f log_info log_success log_warning log_error
export -f require_env_var validate_environment check_command
export -f load_env_config save_deployment_record
export -f start_timer end_timer format_duration
export -f confirm execute_or_dry_run
export -f get_current_branch get_commit_sha get_short_sha get_version_tag
export -f get_json_value send_slack_notification show_progress
