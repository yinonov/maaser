# Deployment Guide

This guide explains how to deploy the HaMaaser platform to different environments.

## Prerequisites

Before you can deploy, ensure you have:

1. **Required Tools Installed**:
   - Node.js 20 LTS
   - npm 10+
   - Firebase CLI: `npm install -g firebase-tools`
   - Vercel CLI: `npm install -g vercel`
   - EAS CLI: `npm install -g eas-cli`
   - GitHub CLI: `brew install gh`

2. **Authentication**:
   - Firebase: `firebase login`
   - Vercel: `vercel login`
   - Expo: `eas login`
   - GitHub: `gh auth login`

3. **Environment Setup**:
   ```bash
   npm run setup:environments
   ```

4. **Secrets Configured**:
   - See [secrets-schema.md](../specs/002-deployment-infrastructure/contracts/secrets-schema.md)
   - Verify with: `npm run check:secrets <env>`

## Deployment Commands

### Deploy All Platforms

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### Deploy Individual Platforms

```bash
# Functions only
npm run deploy:functions dev

# Dashboard only
npm run deploy:dashboard staging

# Mobile only
npm run deploy:mobile prod --platform all --submit
```

## Environment Overview

### Development (`dev`)
- **Purpose**: Local testing and development
- **Firebase Project**: `hamaaser-dev`
- **Dashboard URL**: Development Vercel preview
- **Mobile**: Internal distribution (APK/IPA)
- **Stripe**: Test mode keys
- **Auto-deploy**: No

### Staging (`staging`)
- **Purpose**: Pre-production testing and QA
- **Firebase Project**: `hamaaser-staging`
- **Dashboard URL**: Staging Vercel preview
- **Mobile**: Internal distribution (TestFlight/Internal Testing)
- **Stripe**: Test mode keys
- **Auto-deploy**: Yes (on push to main)

### Production (`prod`)
- **Purpose**: Live production environment
- **Firebase Project**: `hamaaser-prod`
- **Dashboard URL**: Production domain
- **Mobile**: App Store/Google Play
- **Stripe**: Live mode keys
- **Auto-deploy**: No (manual approval required)

## Deployment Workflows

### 1. Feature Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
npm test
npm run lint

# 3. Create pull request
gh pr create --title "My Feature" --body "Description"

# 4. CI automatically runs tests
# Wait for CI to pass

# 5. Merge to main
gh pr merge

# 6. Staging automatically deploys
# Check: https://github.com/yinonov/maaser/actions
```

### 2. Production Release Workflow

```bash
# 1. Ensure staging is stable
npm run check:secrets prod

# 2. Create release branch
git checkout main
git pull
git checkout -b release/v1.1.0

# 3. Bump versions
npm version minor
cd mobile && npm version minor && cd ..
cd dashboard && npm version minor && cd ..
cd functions && npm version minor && cd ..

# 4. Commit and tag
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin release/v1.1.0
git push origin v1.1.0

# 5. Deploy via GitHub Actions
# Go to: https://github.com/yinonov/maaser/actions
# Select "Deploy to Production"
# Run workflow with tag: v1.1.0
# Approve deployment when prompted

# 6. Monitor deployment
npm run functions:logs prod
```

### 3. Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-fix

# 2. Make minimal changes
# Fix the issue
npm test

# 3. Deploy to staging first
git push origin hotfix/critical-fix
# Wait for auto-deploy to staging

# 4. Test on staging
npm run test:e2e

# 5. Merge to main
git checkout main
git merge hotfix/critical-fix
git push

# 6. Deploy to production immediately
# Use GitHub Actions manual deployment
```

## Platform-Specific Details

### Firebase Functions

**Deploy:**
```bash
./scripts/deploy/deploy-functions.sh <env> [--only function-name] [--force]
```

**What gets deployed:**
- All Cloud Functions in `functions/src/`
- Function configuration (memory, timeout, region)
- Environment-specific secrets (Stripe, SendGrid)

**Deployment time:** 2-3 minutes

**Rollback:**
```bash
./scripts/deploy/rollback.sh <env> --platform functions
```

### Next.js Dashboard

**Deploy:**
```bash
./scripts/deploy/deploy-dashboard.sh <env> [--production]
```

**What gets deployed:**
- Static assets and pages
- API routes
- Environment variables

**Deployment time:** 3-5 minutes

**Rollback:**
- Use Vercel dashboard to promote previous deployment
- Or: `./scripts/deploy/rollback.sh <env> --platform dashboard`

### Mobile Apps

**Deploy:**
```bash
./scripts/deploy/deploy-mobile.sh <env> [--platform ios|android|all] [--submit]
```

**What gets deployed:**
- Native iOS IPA
- Native Android APK/AAB
- JavaScript bundle

**Deployment time:** 
- Build: 10-15 minutes
- Store submission: 24-48 hours (iOS), 2-4 hours (Android)

**Rollback:**
- Build and submit previous version
- Not instant (requires new app store submission)

## CI/CD Pipeline Details

### Pull Request Checks

Triggered on: Pull request to main/develop

**Steps:**
1. Lint all packages
2. Run unit tests
3. Build all packages
4. Security audit

**Required:** All checks must pass before merge

### Staging Deployment

Triggered on: Push to main branch

**Steps:**
1. Run tests
2. Deploy Functions
3. Deploy Dashboard
4. Build Mobile apps (optional)

**Duration:** 10-15 minutes

### Production Deployment

Triggered by: Manual workflow dispatch

**Steps:**
1. Verify version tag
2. Check secrets
3. Deploy Functions
4. Deploy Dashboard
5. Build and submit Mobile apps
6. Send notifications

**Duration:** 15-30 minutes (excluding app store review)

## Rollback Procedures

### Automatic Rollback

Automatic rollback triggers when:
- Deployment fails
- Health checks fail
- Critical errors detected

**Affected platforms:** Functions, Dashboard

### Manual Rollback

```bash
# Rollback all platforms
npm run rollback:prod

# Rollback specific platform
./scripts/deploy/rollback.sh prod --platform functions
```

**Rollback time:** 3-5 minutes

## Monitoring

### View Logs

```bash
# Firebase Functions
firebase functions:log --limit 100

# Vercel Dashboard
vercel logs <deployment-url>

# Mobile app errors
# Check Expo dashboard: https://expo.dev
```

### Deployment Status

```bash
# GitHub Actions
gh run list --workflow="Deploy to Production"

# Vercel deployments
vercel ls --prod

# EAS builds
eas build:list
```

## Troubleshooting

### Common Issues

#### "Secrets validation failed"

**Solution:**
```bash
# Check which secrets are missing
npm run check:secrets <env>

# Set missing secrets
gh secret set SECRET_NAME
# or
firebase functions:secrets:set SECRET_NAME
# or
vercel env add SECRET_NAME
```

#### "EAS Build failed"

**Solution:**
```bash
# View build logs
eas build:list
# Click on failed build

# Common fixes:
eas credentials  # Update credentials
eas build --clear-cache  # Clear build cache
```

#### "Vercel deployment failed"

**Solution:**
```bash
# View detailed logs
vercel logs <deployment-url>

# Check environment variables
vercel env ls production

# Redeploy
cd dashboard && vercel --prod
```

#### "Firebase Functions deployment failed"

**Solution:**
```bash
# Check if logged in
firebase login

# Switch to correct project
firebase use <env>

# View detailed error
firebase deploy --only functions --debug
```

## Best Practices

### 1. Always Test on Staging First

Never deploy directly to production without testing on staging.

### 2. Use Semantic Versioning

- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### 3. Deploy During Low Traffic

Production deployments should happen during maintenance windows or low-traffic periods.

### 4. Monitor After Deployment

Watch logs and metrics for at least 30 minutes after production deployment.

### 5. Keep Deployment Records

All deployments are automatically logged to `.deployments/` directory.

### 6. Rotate Secrets Regularly

- Critical secrets: Every 90 days
- High-sensitivity: Every 180 days
- Medium-sensitivity: Every 365 days

## Emergency Procedures

### Critical Production Issue

```bash
# 1. Immediate rollback
npm run rollback:prod

# 2. Verify rollback successful
npm run functions:logs prod

# 3. Notify team
# Post in #incidents Slack channel

# 4. Investigate issue
# Check logs, errors, metrics

# 5. Fix and redeploy when ready
```

### Compromised Secret

```bash
# 1. Rotate secret immediately
# Generate new key in provider dashboard

# 2. Update secret
firebase functions:secrets:set SECRET_NAME
# or
gh secret set SECRET_NAME

# 3. Redeploy affected services
npm run deploy:functions prod --force

# 4. Revoke old secret
# In provider dashboard

# 5. Document incident
```

## Additional Resources

- [Quickstart Guide](../specs/002-deployment-infrastructure/quickstart.md)
- [Deployment API Contract](../specs/002-deployment-infrastructure/contracts/deployment-api.md)
- [Secrets Schema](../specs/002-deployment-infrastructure/contracts/secrets-schema.md)
- [Feature Specification](../specs/002-deployment-infrastructure/spec.md)

## Getting Help

- **Documentation**: `specs/002-deployment-infrastructure/`
- **Issues**: https://github.com/yinonov/maaser/issues
- **Team Slack**: #deployments channel
