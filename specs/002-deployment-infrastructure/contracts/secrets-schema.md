# Secrets Schema Contract

This document defines all required secrets for deploying the HaMaaser platform across environments.

## Overview

Secrets are stored in three locations based on their usage:

- **GitHub Secrets**: CI/CD authentication tokens
- **Firebase Functions Secrets**: Runtime secrets for Cloud Functions
- **Vercel Environment Variables**: Build-time and runtime secrets for dashboard

## Naming Convention

- Use `SCREAMING_SNAKE_CASE` for all secret names
- Prefix environment-specific variants with environment: `DEV_`, `STAGING_`, `PROD_`
- For keys with test/live modes, include mode in name: `STRIPE_TEST_KEY`, `STRIPE_LIVE_KEY`

---

## GitHub Secrets

Stored in: **Repository Settings → Secrets and Variables → Actions**

### Required for All Environments

| Secret Name | Description | Format | Used By | Rotation |
|------------|-------------|---------|---------|----------|
| `EXPO_TOKEN` | Expo authentication token | `ey...` (JWT) | Mobile builds (EAS) | 180 days |
| `VERCEL_TOKEN` | Vercel CLI authentication token | `vercel_...` | Dashboard deployment | 90 days |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_...` | Dashboard deployment | Never (org-specific) |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_...` | Dashboard deployment | Never (project-specific) |
| `FIREBASE_TOKEN` | Firebase CI token | Random string | Functions deployment | 180 days |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for notifications | `https://hooks.slack.com/...` | Deployment notifications | 365 days |

### Required for Production Only

| Secret Name | Description | Format | Used By | Rotation |
|------------|-------------|---------|---------|----------|
| `APPLE_API_KEY` | Apple App Store Connect API key (JSON) | `{...}` | iOS app submission | 365 days |
| `GOOGLE_SERVICE_ACCOUNT` | Google Play Console service account (JSON) | `{...}` | Android app submission | 365 days |

### Setup Commands

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Set secrets (will prompt for values)
gh secret set EXPO_TOKEN
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set FIREBASE_TOKEN
gh secret set SLACK_WEBHOOK_URL

# Production only
gh secret set APPLE_API_KEY
gh secret set GOOGLE_SERVICE_ACCOUNT
```

### Obtaining Tokens

**EXPO_TOKEN**:
```bash
# Login to Expo
expo login

# Generate token
expo whoami
expo token:create

# Copy token and set as GitHub Secret
gh secret set EXPO_TOKEN
```

**VERCEL_TOKEN**:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: "GitHub Actions CI/CD"
4. Scope: Full Account
5. Copy token and set as GitHub Secret

**VERCEL_ORG_ID and VERCEL_PROJECT_ID**:
```bash
# Link project locally
cd dashboard
vercel link

# Extract IDs from .vercel/project.json
cat .vercel/project.json

# Set as secrets
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

**FIREBASE_TOKEN**:
```bash
# Login to Firebase
firebase login:ci

# Copy generated token
gh secret set FIREBASE_TOKEN
```

**SLACK_WEBHOOK_URL**:
1. Go to https://api.slack.com/apps
2. Create new app → From scratch
3. Add "Incoming Webhooks" feature
4. Create webhook for #deployments channel
5. Copy webhook URL and set as GitHub Secret

---

## Firebase Functions Secrets

Stored in: **Firebase Functions Secrets Manager** (per project)

### Development Environment (hamaaser-dev)

| Secret Name | Description | Format | Used By | Rotation |
|------------|-------------|---------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe test API key | `sk_test_...` | Payment functions | 90 days |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (test) | `whsec_...` | Webhook validation | 90 days |
| `SENDGRID_API_KEY` | SendGrid API key (test domain) | `SG...` | Email functions | 180 days |

### Staging Environment (hamaaser-staging)

| Secret Name | Description | Format | Used By | Rotation |
|------------|-------------|---------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe test API key | `sk_test_...` | Payment functions | 90 days |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (test) | `whsec_...` | Webhook validation | 90 days |
| `SENDGRID_API_KEY` | SendGrid API key (live, low volume) | `SG...` | Email functions | 180 days |

### Production Environment (hamaaser-prod)

| Secret Name | Description | Format | Used By | Rotation |
|------------|-------------|---------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe live API key | `sk_live_...` | Payment functions | 90 days |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (live) | `whsec_...` | Webhook validation | 90 days |
| `SENDGRID_API_KEY` | SendGrid API key (live) | `SG...` | Email functions | 180 days |

### Setup Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set secrets per environment
firebase use dev
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_API_KEY

firebase use staging
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_API_KEY

firebase use prod
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_API_KEY
```

### Obtaining Secrets

**STRIPE_SECRET_KEY**:
1. Go to https://dashboard.stripe.com/apikeys
2. For dev/staging: Use "Test mode" keys (`sk_test_...`)
3. For production: Use "Live mode" keys (`sk_live_...`)
4. Copy "Secret key"

**STRIPE_WEBHOOK_SECRET**:
1. Go to https://dashboard.stripe.com/webhooks
2. Create webhook endpoint:
   - URL: `https://us-central1-hamaaser-{env}.cloudfunctions.net/handleWebhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Copy "Signing secret" (`whsec_...`)

**SENDGRID_API_KEY**:
1. Go to https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name: "HaMaaser {Environment}"
4. Permissions: "Full Access" (or "Mail Send" + "Email Activity")
5. Copy API key (starts with `SG.`)

### Access in Functions Code

```typescript
import { defineSecret } from 'firebase-functions/params';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const handlePayment = onRequest(
  { secrets: [stripeSecretKey] },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value());
    // Use stripe...
  }
);
```

---

## Vercel Environment Variables

Stored in: **Vercel Dashboard → Project Settings → Environment Variables**

### Development Environment

| Variable Name | Description | Type | Value Example |
|--------------|-------------|------|---------------|
| `NEXT_PUBLIC_APP_ENV` | Environment identifier | Plain Text | `development` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Plain Text | `hamaaser-dev` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key (public) | Plain Text | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Plain Text | `hamaaser-dev.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Plain Text | `hamaaser-dev.appspot.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test) | Plain Text | `pk_test_...` |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Firebase Admin SDK credentials (JSON) | Secret | `{...}` |

### Preview Environment

Same as Development (inherits from Development environment variables in Vercel)

### Staging Environment

| Variable Name | Description | Type | Value Example |
|--------------|-------------|------|---------------|
| `NEXT_PUBLIC_APP_ENV` | Environment identifier | Plain Text | `staging` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Plain Text | `hamaaser-staging` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key (public) | Plain Text | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Plain Text | `hamaaser-staging.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Plain Text | `hamaaser-staging.appspot.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test) | Plain Text | `pk_test_...` |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Firebase Admin SDK credentials (JSON) | Secret | `{...}` |

### Production Environment

| Variable Name | Description | Type | Value Example |
|--------------|-------------|------|---------------|
| `NEXT_PUBLIC_APP_ENV` | Environment identifier | Plain Text | `production` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Plain Text | `hamaaser-prod` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key (public) | Plain Text | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Plain Text | `hamaaser-prod.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Plain Text | `hamaaser-prod.appspot.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (live) | Plain Text | `pk_live_...` |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Firebase Admin SDK credentials (JSON) | Secret | `{...}` |

### Setup via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd dashboard
vercel link

# Set environment variables (prompts for environment)
vercel env add NEXT_PUBLIC_APP_ENV
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add FIREBASE_ADMIN_SERVICE_ACCOUNT
```

### Obtaining Values

**Firebase configuration**:
```bash
# Get from Firebase console
firebase projects:list

# Or extract from Firebase web app config
# Go to: Firebase Console → Project Settings → Your apps → SDK setup
```

**FIREBASE_ADMIN_SERVICE_ACCOUNT**:
```bash
# Generate service account key
firebase projects:list
# Go to: Firebase Console → Project Settings → Service Accounts
# Click "Generate new private key"
# Download JSON file
# Copy JSON content (entire file) as secret value
```

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**:
1. Go to https://dashboard.stripe.com/apikeys
2. For dev/staging: Use "Test mode" keys (`pk_test_...`)
3. For production: Use "Live mode" keys (`pk_live_...`)
4. Copy "Publishable key"

---

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
.vercel
secrets/
*.pem
*.p12
*.mobileprovision
service-account-*.json
```

### 2. Use Git Secrets Scanner

```bash
# Install git-secrets
brew install git-secrets

# Initialize in repo
cd /path/to/hamaaser
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'sk_live_[0-9a-zA-Z]{24,}'
git secrets --add 'pk_live_[0-9a-zA-Z]{24,}'
git secrets --add 'AIza[0-9A-Za-z_-]{35}'

# Scan repo
git secrets --scan
git secrets --scan-history
```

### 3. Rotate Secrets Regularly

Schedule rotation reminders:

- **Critical secrets** (Stripe live keys, Firebase service accounts): 90 days
- **High-sensitivity secrets** (Auth tokens): 180 days
- **Medium-sensitivity secrets** (API keys): 365 days

### 4. Principle of Least Privilege

- Each service account should have minimal required permissions
- Use environment-specific accounts (don't reuse prod credentials in dev)
- Revoke unused tokens immediately

### 5. Audit Access

```bash
# Check who has access to GitHub secrets
gh api repos/:owner/:repo/actions/secrets

# Check Firebase IAM
firebase projects:list
# Go to: Firebase Console → Project Settings → Users and Permissions

# Check Vercel team access
vercel teams ls
vercel projects ls
```

---

## Validation Script

Use `scripts/deploy/check-secrets.sh` to validate:

```bash
#!/usr/bin/env bash
# Check all required secrets are configured

ENV=${1:-staging}

echo "Checking secrets for $ENV environment..."

# GitHub Secrets (requires gh CLI)
echo "GitHub Secrets:"
gh secret list | grep -q EXPO_TOKEN && echo "  ✓ EXPO_TOKEN" || echo "  ✗ EXPO_TOKEN"
gh secret list | grep -q VERCEL_TOKEN && echo "  ✓ VERCEL_TOKEN" || echo "  ✗ VERCEL_TOKEN"
# ... etc

# Firebase Secrets
echo "Firebase Secrets ($ENV):"
firebase use $ENV
firebase functions:secrets:access STRIPE_SECRET_KEY > /dev/null 2>&1 && echo "  ✓ STRIPE_SECRET_KEY" || echo "  ✗ STRIPE_SECRET_KEY"
# ... etc

# Vercel Secrets
echo "Vercel Environment Variables ($ENV):"
vercel env ls $ENV | grep -q NEXT_PUBLIC_FIREBASE_PROJECT_ID && echo "  ✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID" || echo "  ✗ NEXT_PUBLIC_FIREBASE_PROJECT_ID"
# ... etc

echo "✅ Secrets validation complete"
```

Run before every deployment:
```bash
./scripts/deploy/check-secrets.sh staging
./scripts/deploy/check-secrets.sh prod
```

---

## Emergency Secret Revocation

If a secret is compromised:

1. **Rotate immediately**:
   ```bash
   # Example: Rotate Stripe key
   # 1. Generate new key in Stripe Dashboard
   # 2. Update in Firebase Secrets
   firebase use prod
   firebase functions:secrets:set STRIPE_SECRET_KEY
   # 3. Redeploy functions
   ./scripts/deploy/deploy-functions.sh prod --force
   # 4. Verify new key works
   # 5. Revoke old key in Stripe Dashboard
   ```

2. **Audit access logs**:
   - Check Stripe Dashboard → Developers → Logs
   - Check Firebase Console → Functions → Logs
   - Check Vercel → Project → Logs

3. **Notify team**:
   - Post in Slack #security channel
   - Document incident in security log

4. **Review access controls**:
   - Revoke unnecessary access
   - Update IAM permissions
   - Rotate related secrets

---

## .env.example Template

Store in `config/environments/.env.example` (NO VALUES):

```bash
# GitHub Secrets (for CI/CD)
EXPO_TOKEN=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
FIREBASE_TOKEN=
SLACK_WEBHOOK_URL=
APPLE_API_KEY=
GOOGLE_SERVICE_ACCOUNT=

# Firebase Functions Secrets (per environment)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=

# Vercel Environment Variables (per environment)
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
FIREBASE_ADMIN_SERVICE_ACCOUNT=
```
