# Quickstart: Deployment Infrastructure

**Last Updated**: 2025-11-09  
**Prerequisites**: macOS/Linux, Node.js 20+, npm 10+, Git

This guide walks through setting up the complete deployment infrastructure for the HaMaaser platform from scratch.

---

## Part 1: Initial Setup (One-time, ~60 minutes)

### Step 1: Install Required Tools

```bash
# Install Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20 LTS
brew install node@20

# Install GitHub CLI
brew install gh

# Install global npm packages
npm install -g firebase-tools@latest eas-cli@latest vercel@latest
```

Verify installations:
```bash
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
gh --version    # Should be 2.x.x
firebase --version  # Should be 13.x.x
eas --version   # Should be 7.x.x
vercel --version  # Should be 32.x.x
```

---

### Step 2: Clone Repository

```bash
# Clone repository
git clone https://github.com/yinonov/maaser.git
cd maaser

# Install root dependencies
npm install

# Install dependencies for all workspaces
npm run install:all
```

---

### Step 3: Authenticate with Services

#### GitHub Authentication

```bash
# Login to GitHub
gh auth login
# Follow prompts: Choose "GitHub.com", "HTTPS", "Login with a web browser"

# Verify authentication
gh auth status
```

#### Firebase Authentication

```bash
# Login to Firebase
firebase login
# Opens browser for Google authentication

# Verify authentication
firebase projects:list
```

#### Expo Authentication

```bash
# Login to Expo
eas login
# Enter credentials (create account at expo.dev if needed)

# Verify authentication
eas whoami
```

#### Vercel Authentication

```bash
# Login to Vercel
vercel login
# Follow email verification link

# Verify authentication
vercel whoami
```

---

### Step 4: Create Firebase Projects

Create three Firebase projects (one per environment):

#### Option A: Via Firebase Console (Recommended for first setup)

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Project name: `hamaaser-dev`
   - Enable Google Analytics: Optional
   - Click "Create project"
4. Repeat for `hamaaser-staging` and `hamaaser-prod`

#### Option B: Via CLI (Faster for experienced users)

```bash
# Create projects
firebase projects:create hamaaser-dev --display-name "HaMaaser Development"
firebase projects:create hamaaser-staging --display-name "HaMaaser Staging"
firebase projects:create hamaaser-prod --display-name "HaMaaser Production"
```

**Enable required services for each project:**

```bash
# For each project, enable:
# - Authentication (Google + Email/Password)
# - Firestore Database
# - Cloud Storage
# - Cloud Functions

# Via console: Go to each project → Enable services
# Or via CLI:
firebase use dev
firebase init firestore
firebase init functions
firebase init storage

firebase use staging
firebase init firestore
firebase init functions
firebase init storage

firebase use prod
firebase init firestore
firebase init functions
firebase init storage
```

---

### Step 5: Configure Firebase Project Aliases

```bash
# Link Firebase projects to aliases
firebase use --add
# Select "hamaaser-dev" → alias: "dev"

firebase use --add
# Select "hamaaser-staging" → alias: "staging"

firebase use --add
# Select "hamaaser-prod" → alias: "prod"

# Set default to dev
firebase use dev

# Verify configuration
cat .firebaserc
```

Should output:
```json
{
  "projects": {
    "default": "hamaaser-dev",
    "dev": "hamaaser-dev",
    "staging": "hamaaser-staging",
    "prod": "hamaaser-prod"
  }
}
```

---

### Step 6: Create Vercel Project

```bash
# Link dashboard to Vercel
cd dashboard
vercel link
# Choose: Create new project
# Project name: "hamaaser-dashboard"
# Directory: dashboard (already correct)

# Extract project IDs
cat .vercel/project.json
# Save VERCEL_ORG_ID and VERCEL_PROJECT_ID for later

cd ..
```

---

### Step 7: Create Expo Project

```bash
# Configure EAS for mobile app
cd mobile

# Initialize EAS
eas init --id <project-id>
# If no project exists, it will create one

# Verify eas.json exists
cat eas.json

cd ..
```

---

### Step 8: Set Up Secrets

#### 8.1 GitHub Secrets

```bash
# Generate and set tokens
gh secret set EXPO_TOKEN
# Paste: Run `eas whoami` and generate token via expo.dev

gh secret set VERCEL_TOKEN
# Paste: Get from https://vercel.com/account/tokens

gh secret set VERCEL_ORG_ID
# Paste: From .vercel/project.json

gh secret set VERCEL_PROJECT_ID
# Paste: From .vercel/project.json

gh secret set FIREBASE_TOKEN
# Paste: Run `firebase login:ci` to generate

gh secret set SLACK_WEBHOOK_URL
# Paste: Create at https://api.slack.com/apps → Incoming Webhooks

# Production only (optional for now)
gh secret set APPLE_API_KEY
gh secret set GOOGLE_SERVICE_ACCOUNT
```

#### 8.2 Firebase Functions Secrets

```bash
# Development
firebase use dev
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste: Get from https://dashboard.stripe.com/test/apikeys (sk_test_...)

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste: Create webhook at https://dashboard.stripe.com/test/webhooks

firebase functions:secrets:set SENDGRID_API_KEY
# Paste: Get from https://app.sendgrid.com/settings/api_keys

# Staging
firebase use staging
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_API_KEY

# Production (when ready)
firebase use prod
firebase functions:secrets:set STRIPE_SECRET_KEY  # Use sk_live_... key
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_API_KEY
```

#### 8.3 Vercel Environment Variables

```bash
cd dashboard

# Development environment
vercel env add NEXT_PUBLIC_APP_ENV development Development
# Enter: development

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID development Development
# Enter: hamaaser-dev

vercel env add NEXT_PUBLIC_FIREBASE_API_KEY development Development
# Enter: Get from Firebase Console → Project Settings → Web App

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY development Development
# Enter: pk_test_... from Stripe dashboard

# Repeat for staging and production environments
# vercel env add <NAME> <VALUE> Preview,Production

cd ..
```

---

### Step 9: Create Environment Configuration Files

```bash
# Run setup script
./scripts/deploy/setup-environments.sh

# This creates:
# - config/environments/development.json
# - config/environments/staging.json
# - config/environments/production.json

# Edit each file with correct values from Firebase Console
```

**Example development.json:**
```json
{
  "name": "development",
  "shortName": "dev",
  "firebase": {
    "projectId": "hamaaser-dev",
    "apiKey": "AIza...",
    "authDomain": "hamaaser-dev.firebaseapp.com",
    "storageBucket": "hamaaser-dev.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abc123"
  },
  "stripe": {
    "publishableKey": "pk_test_...",
    "mode": "test",
    "webhookEndpoint": "https://us-central1-hamaaser-dev.cloudfunctions.net/handleWebhook"
  },
  "targets": {
    "dashboard": {
      "url": "http://localhost:3002",
      "vercelProjectId": "prj_..."
    },
    "mobile": {
      "bundleIdentifier": "com.hamaaser.app.dev",
      "packageName": "com.hamaaser.app.dev",
      "easProfile": "development",
      "updateChannel": "development"
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
    "logLevel": "debug"
  }
}
```

---

### Step 10: Validate Setup

```bash
# Check all secrets are configured
./scripts/deploy/check-secrets.sh dev
./scripts/deploy/check-secrets.sh staging

# Should output all green checkmarks
```

---

## Part 2: First Deployment (~30 minutes)

### Step 1: Deploy to Development

```bash
# Deploy Firebase Functions
./scripts/deploy/deploy-functions.sh dev

# Deploy Dashboard
./scripts/deploy/deploy-dashboard.sh dev

# Build Mobile App (takes ~15 minutes)
./scripts/deploy/deploy-mobile.sh dev --platform all
```

### Step 2: Verify Development Deployment

```bash
# Check Functions are live
firebase use dev
firebase functions:log --limit 5

# Check Dashboard is live
# Open: http://localhost:3002 (or Vercel preview URL)

# Check Mobile Build
# Open: https://expo.dev (check builds)
```

---

### Step 3: Deploy to Staging

```bash
# Option A: Manual deployment
./scripts/deploy/deploy-all.sh staging

# Option B: Push to main branch (triggers GitHub Actions)
git checkout main
git pull
git merge <your-feature-branch>
git push

# GitHub Actions will automatically deploy to staging
# Check: https://github.com/yinonov/maaser/actions
```

### Step 4: Run E2E Tests on Staging

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run tests
npm run test:e2e
```

---

## Part 3: Production Deployment (~45 minutes)

**⚠️ Prerequisites:**
- [ ] Staging deployment successful
- [ ] E2E tests passing
- [ ] Manual QA completed on staging
- [ ] All production secrets configured
- [ ] Team approval obtained

### Step 1: Prepare for Production

```bash
# Validate production secrets
./scripts/deploy/check-secrets.sh prod

# Validate production configuration
./scripts/deploy/validate-config.sh prod

# Run full test suite
npm test
```

### Step 2: Create Production Release

```bash
# Create release branch
git checkout main
git pull
git checkout -b release/v1.0.0

# Bump version numbers
npm version minor  # Or patch/major
cd mobile && npm version minor && cd ..
cd dashboard && npm version minor && cd ..
cd functions && npm version minor && cd ..

# Commit and tag
git add .
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push origin release/v1.0.0
git push origin v1.0.0
```

### Step 3: Deploy to Production

#### Option A: Via GitHub Actions (Recommended)

1. Go to: https://github.com/yinonov/maaser/actions
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter version tag: `v1.0.0`
5. Click "Run workflow"
6. Approve deployment when prompted (GitHub Environment protection)

#### Option B: Manual Deployment

```bash
# Deploy functions
./scripts/deploy/deploy-functions.sh prod --force

# Deploy dashboard
./scripts/deploy/deploy-dashboard.sh prod --production

# Submit mobile apps to stores
./scripts/deploy/deploy-mobile.sh prod --platform all --submit
```

### Step 4: Monitor Production

```bash
# Watch Functions logs
firebase use prod
firebase functions:log --limit 50 --follow

# Check Dashboard is live
open https://dashboard.hamaaser.org

# Check mobile app submissions
# iOS: https://appstoreconnect.apple.com
# Android: https://play.google.com/console
```

---

## Part 4: Common Tasks

### Deploy Hotfix to Production

```bash
# Create hotfix branch
git checkout main
git pull
git checkout -b hotfix/critical-bug-fix

# Make changes, test locally
npm test

# Deploy to staging first
git push origin hotfix/critical-bug-fix
# Wait for staging deployment via GitHub Actions

# Test on staging
npm run test:e2e

# Merge to main and deploy to production
git checkout main
git merge hotfix/critical-bug-fix
git push

# Trigger production deployment via GitHub Actions
```

### Rollback Production Deployment

```bash
# Option A: Via script
./scripts/deploy/rollback.sh prod

# Option B: Vercel dashboard (dashboard only)
# Go to: https://vercel.com/hamaaser/dashboard/deployments
# Find previous deployment → Click "Promote to Production"

# Option C: Firebase console (functions only)
# Go to: Firebase Console → Functions → Select function → Rollback
```

### View Deployment History

```bash
# View local deployment records
ls -la .deployments/

# View GitHub Actions history
gh run list --workflow="Deploy to Production"

# View Vercel deployment history
vercel ls --prod

# View Firebase Functions deployment history
firebase functions:log --limit 100
```

### Update Secrets

```bash
# Rotate secret (example: Stripe key)
# 1. Generate new key in Stripe Dashboard
# 2. Update in Firebase Secrets
firebase use prod
firebase functions:secrets:set STRIPE_SECRET_KEY
# 3. Redeploy functions
./scripts/deploy/deploy-functions.sh prod --force
# 4. Verify new key works
# 5. Revoke old key in Stripe Dashboard
```

---

## Troubleshooting

### "EXPO_TOKEN invalid" error

```bash
# Regenerate token
eas login
eas whoami
# Go to: https://expo.dev/accounts/<username>/settings/access-tokens
# Create new token → Update GitHub Secret
gh secret set EXPO_TOKEN
```

### "Firebase project not found" error

```bash
# Verify project aliases
firebase projects:list
cat .firebaserc

# Re-add project
firebase use --add
# Select correct project → Alias: dev/staging/prod
```

### "Vercel deployment failed" error

```bash
# Check Vercel logs
vercel logs <deployment-url>

# Verify environment variables
vercel env ls production

# Redeploy
cd dashboard
vercel --prod
```

### "EAS Build failed" error

```bash
# Check build logs
eas build:list
# Click on failed build → View logs

# Common issues:
# - Missing credentials: Run `eas credentials`
# - Dependency issues: Clear cache with `eas build --clear-cache`
# - Invalid app.json: Validate with `eas build:configure`
```

### "Secrets validation failed" error

```bash
# Run detailed check
./scripts/deploy/check-secrets.sh <env>

# For each missing secret:
# 1. Identify which system (GitHub/Firebase/Vercel)
# 2. Follow setup instructions in contracts/secrets-schema.md
# 3. Re-run validation
```

---

## Maintenance

### Weekly Tasks

- [ ] Review deployment logs for errors
- [ ] Check staging environment is in sync with main
- [ ] Verify all tests passing in CI

### Monthly Tasks

- [ ] Review and rotate medium-sensitivity secrets
- [ ] Update dependencies (`npm outdated`)
- [ ] Review Vercel/Firebase usage and costs
- [ ] Check EAS Build queue times

### Quarterly Tasks

- [ ] Rotate critical secrets (Stripe keys, service accounts)
- [ ] Review IAM permissions
- [ ] Audit team access to deployment systems
- [ ] Update deployment documentation

---

## Getting Help

- **Documentation**: `specs/002-deployment-infrastructure/`
- **Scripts**: `scripts/deploy/`
- **Contracts**: `specs/002-deployment-infrastructure/contracts/`
- **Issues**: https://github.com/yinonov/maaser/issues
- **Team Slack**: #deployments channel

---

## Next Steps

After completing this quickstart:

1. ✅ Review `specs/002-deployment-infrastructure/spec.md` for full requirements
2. ✅ Read `specs/002-deployment-infrastructure/contracts/` for API details
3. ✅ Set up monitoring alerts (see `config/alerts.json`)
4. ✅ Configure custom domain for production dashboard
5. ✅ Set up App Store/Play Store listings for mobile apps
