# Deployment Script API Contract

This document defines the interface for all deployment scripts in `scripts/deploy/`.

## Common Interface

All deployment scripts must follow this interface:

```bash
#!/usr/bin/env bash
# Script description

set -e  # Exit on error
set -u  # Exit on undefined variable

# Usage function
usage() {
  echo "Usage: $0 <environment> [options]"
  echo "  environment: dev|staging|prod"
  echo "  options: script-specific flags"
  exit 1
}

# Validate environment argument
ENV="${1:-}"
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Invalid environment '$ENV'"
  usage
fi

# Main script logic
main() {
  echo "Deploying to $ENV..."
  # Implementation
}

main "$@"
```

---

## Script: deploy-all.sh

**Purpose**: Orchestrate deployment of all platforms (mobile, dashboard, functions)

### Interface

```bash
./scripts/deploy/deploy-all.sh <environment> [--skip-mobile] [--skip-dashboard] [--skip-functions]
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`
- `--skip-mobile`: Skip mobile build/deploy
- `--skip-dashboard`: Skip dashboard deploy
- `--skip-functions`: Skip functions deploy

### Environment Variables Required

- `EXPO_TOKEN`: Expo authentication (if deploying mobile)
- `VERCEL_TOKEN`: Vercel authentication (if deploying dashboard)
- `FIREBASE_TOKEN`: Firebase authentication (if deploying functions)

### Exit Codes

- `0`: All deployments succeeded
- `1`: One or more deployments failed
- `2`: Invalid arguments
- `3`: Missing required environment variables

### Example Usage

```bash
# Deploy everything to staging
./scripts/deploy/deploy-all.sh staging

# Deploy only dashboard and functions to production
./scripts/deploy/deploy-all.sh prod --skip-mobile

# Deploy to dev (all platforms)
./scripts/deploy/deploy-all.sh dev
```

### Output Format

```
[deploy-all] Starting deployment to staging
[deploy-all] ✓ Validating secrets
[deploy-all] → Deploying functions...
[functions] ✓ Functions deployed (2m 15s)
[deploy-all] → Deploying dashboard...
[dashboard] ✓ Dashboard deployed (3m 45s)
[deploy-all] → Building mobile...
[mobile] ✓ Mobile builds started (1m 02s)
[deploy-all] ✅ Deployment complete (7m 12s)
```

---

## Script: deploy-mobile.sh

**Purpose**: Build and deploy mobile apps via Expo EAS

### Interface

```bash
./scripts/deploy/deploy-mobile.sh <environment> [--platform ios|android|all] [--submit]
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`
- `--platform` (optional): `ios`, `android`, or `all` (default: `all`)
- `--submit`: Submit to App Store/Play Store after build (prod only)

### Environment Variables Required

- `EXPO_TOKEN`: Expo authentication token
- `APPLE_API_KEY`: Apple API key (if `--submit` for iOS)
- `GOOGLE_SERVICE_ACCOUNT`: Google service account JSON (if `--submit` for Android)

### Exit Codes

- `0`: Build succeeded
- `1`: Build failed
- `2`: Invalid arguments
- `3`: Missing credentials
- `4`: Submission failed

### Example Usage

```bash
# Build for staging (both platforms)
./scripts/deploy/deploy-mobile.sh staging

# Build and submit iOS to production
./scripts/deploy/deploy-mobile.sh prod --platform ios --submit

# Build Android for development
./scripts/deploy/deploy-mobile.sh dev --platform android
```

### Output

```json
{
  "environment": "staging",
  "builds": [
    {
      "platform": "ios",
      "status": "finished",
      "buildUrl": "https://expo.dev/builds/abc123",
      "duration": 890
    },
    {
      "platform": "android",
      "status": "finished",
      "buildUrl": "https://expo.dev/builds/def456",
      "duration": 720
    }
  ]
}
```

---

## Script: deploy-dashboard.sh

**Purpose**: Deploy Next.js dashboard to Vercel

### Interface

```bash
./scripts/deploy/deploy-dashboard.sh <environment> [--production]
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`
- `--production`: Use Vercel production deploy (required for prod)

### Environment Variables Required

- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Exit Codes

- `0`: Deployment succeeded
- `1`: Deployment failed
- `2`: Invalid arguments
- `3`: Missing credentials

### Example Usage

```bash
# Deploy to staging
./scripts/deploy/deploy-dashboard.sh staging

# Deploy to production
./scripts/deploy/deploy-dashboard.sh prod --production

# Deploy to dev
./scripts/deploy/deploy-dashboard.sh dev
```

### Output

```json
{
  "environment": "staging",
  "deploymentUrl": "https://staging-dashboard.hamaaser.org",
  "inspectorUrl": "https://vercel.com/hamaaser/dashboard/abc123",
  "duration": 225
}
```

---

## Script: deploy-functions.sh

**Purpose**: Deploy Firebase Cloud Functions

### Interface

```bash
./scripts/deploy/deploy-functions.sh <environment> [--only function-name] [--force]
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`
- `--only`: Deploy specific function only (e.g., `--only createPaymentIntent`)
- `--force`: Skip confirmation prompts

### Environment Variables Required

- `FIREBASE_TOKEN`: Firebase CI token

### Exit Codes

- `0`: Deployment succeeded
- `1`: Deployment failed
- `2`: Invalid arguments
- `3`: Tests failed (deployment blocked)

### Example Usage

```bash
# Deploy all functions to staging
./scripts/deploy/deploy-functions.sh staging

# Deploy specific function to production
./scripts/deploy/deploy-functions.sh prod --only handleWebhook --force

# Deploy to dev
./scripts/deploy/deploy-functions.sh dev
```

### Output

```json
{
  "environment": "staging",
  "project": "hamaaser-staging",
  "functions": [
    "createPaymentIntent",
    "handleWebhook",
    "generateReceipt"
  ],
  "duration": 163
}
```

---

## Script: rollback.sh

**Purpose**: Rollback deployment to previous version

### Interface

```bash
./scripts/deploy/rollback.sh <environment> [--platform mobile|dashboard|functions|all]
```

### Arguments

- `environment` (required): `staging` or `prod`
- `--platform` (optional): Specific platform to rollback (default: `all`)

### Environment Variables Required

- Same as deployment scripts for respective platforms

### Exit Codes

- `0`: Rollback succeeded
- `1`: Rollback failed
- `2`: Invalid arguments
- `5`: No previous version found

### Example Usage

```bash
# Rollback everything in production
./scripts/deploy/rollback.sh prod

# Rollback only dashboard in staging
./scripts/deploy/rollback.sh staging --platform dashboard
```

### Output

```json
{
  "environment": "prod",
  "rollback": {
    "from": {
      "version": "1.2.0",
      "commit": "abc123",
      "deploymentId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "to": {
      "version": "1.1.0",
      "commit": "def456",
      "deploymentId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "platforms": ["mobile", "dashboard", "functions"],
    "duration": 280
  }
}
```

---

## Script: setup-environments.sh

**Purpose**: Initialize environment configuration files

### Interface

```bash
./scripts/deploy/setup-environments.sh [--recreate]
```

### Arguments

- `--recreate`: Overwrite existing environment files

### Environment Variables Required

None (prompts for values interactively)

### Exit Codes

- `0`: Setup succeeded
- `1`: Setup failed
- `6`: User cancelled

### Example Usage

```bash
# Interactive setup
./scripts/deploy/setup-environments.sh

# Recreate all environments
./scripts/deploy/setup-environments.sh --recreate
```

### Output

Creates:
- `config/environments/development.json`
- `config/environments/staging.json`
- `config/environments/production.json`
- `config/environments/.env.example`

---

## Script: check-secrets.sh

**Purpose**: Validate all required secrets are configured

### Interface

```bash
./scripts/deploy/check-secrets.sh <environment>
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`

### Environment Variables Required

- All secrets defined in `config/secrets-schema.json`

### Exit Codes

- `0`: All secrets valid
- `1`: One or more secrets missing
- `2`: Invalid arguments
- `7`: Secrets validation failed

### Example Usage

```bash
# Check staging secrets
./scripts/deploy/check-secrets.sh staging

# Check production secrets
./scripts/deploy/check-secrets.sh prod
```

### Output

```
Checking secrets for staging environment...

GitHub Secrets:
  ✓ EXPO_TOKEN
  ✓ VERCEL_TOKEN
  ✓ FIREBASE_TOKEN
  ✗ APPLE_API_KEY (optional for staging)

Firebase Secrets (hamaaser-staging):
  ✓ STRIPE_SECRET_KEY
  ✓ SENDGRID_API_KEY

Vercel Environment Variables:
  ✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ✓ FIREBASE_ADMIN_SERVICE_ACCOUNT

Result: ✅ All required secrets configured
```

---

## Script: validate-config.sh

**Purpose**: Validate environment configuration file

### Interface

```bash
./scripts/deploy/validate-config.sh <environment>
```

### Arguments

- `environment` (required): `dev`, `staging`, or `prod`

### Exit Codes

- `0`: Configuration valid
- `1`: Configuration invalid
- `2`: Invalid arguments

### Example Usage

```bash
# Validate staging config
./scripts/deploy/validate-config.sh staging
```

### Output

```
Validating config/environments/staging.json...

  ✓ Schema valid
  ✓ Firebase project ID format
  ✓ Stripe key format (test mode)
  ✓ URL formats
  ✓ Bundle identifiers

Result: ✅ Configuration valid
```

---

## Common Utilities

All scripts have access to these utility functions (defined in `scripts/deploy/lib/common.sh`):

```bash
# Logging functions
log_info "message"     # Blue info message
log_success "message"  # Green success message
log_warning "message"  # Yellow warning message
log_error "message"    # Red error message

# Validation functions
require_env_var "VAR_NAME"           # Exit if environment variable missing
validate_environment "env"           # Validate env is dev|staging|prod
check_command "command"              # Exit if command not installed

# File operations
load_env_config "environment"        # Load config/environments/{env}.json
save_deployment_record "data"        # Save deployment record

# Time tracking
start_timer                          # Start timing operation
end_timer                            # End timing and return duration

# Confirmation
confirm "Are you sure?"              # Prompt for yes/no confirmation
```

---

## Error Handling

All scripts must:

1. Use `set -e` to exit on first error
2. Use `set -u` to exit on undefined variables
3. Trap errors and provide cleanup:

```bash
cleanup() {
  log_error "Deployment failed at line $1"
  # Cleanup operations
}

trap 'cleanup $LINENO' ERR
```

4. Return appropriate exit codes (see above)
5. Log errors to stderr: `log_error "message" >&2`

---

## Testing

Scripts can be tested with:

```bash
# Dry-run mode (no actual deployment)
DRY_RUN=1 ./scripts/deploy/deploy-all.sh staging

# Verbose mode (show all commands)
DEBUG=1 ./scripts/deploy/deploy-all.sh staging

# Test mode (use test credentials)
TEST_MODE=1 ./scripts/deploy/check-secrets.sh prod
```
