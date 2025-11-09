# Research: Deployment Infrastructure

**Phase**: 0 - Research & Architecture  
**Date**: 2025-11-09  
**Status**: Complete

## Overview

This research resolves all "NEEDS CLARIFICATION" items from the Technical Context and evaluates best practices for deploying React Native mobile apps (Expo), Next.js dashboards (Vercel), and Firebase Cloud Functions across multiple environments with security-first secrets management.

## Research Areas

### 1. E2E Testing Framework for Post-Deploy Validation

**Decision**: Playwright + Firebase Test Lab (iOS/Android device testing)

**Rationale**:
- **Playwright** provides reliable browser-based E2E testing for Next.js dashboard with visual regression testing capabilities
- **Firebase Test Lab** enables automated mobile app testing on real iOS and Android devices post-deployment
- Both integrate well with GitHub Actions for CI/CD automation
- Playwright supports screenshot comparison for visual regression detection
- Firebase Test Lab provides device-specific crash detection and performance metrics

**Alternatives Considered**:
- **Cypress**: Strong web testing but no native mobile support, would require separate mobile solution
- **Detox**: Excellent for React Native but requires custom infrastructure setup, violates "Speed Over Perfection" (too complex for MVP)
- **Appium**: Cross-platform but configuration-heavy, slower feedback cycles
- **Manual testing only**: Fast to implement but doesn't scale, error-prone for regression testing

**Implementation Notes**:
- Playwright tests run against staging dashboard URL after successful deployment
- Firebase Test Lab tests triggered after EAS Build completes, runs on 3-5 device configurations (1-2 iOS, 2-3 Android)
- Test failures block production promotion but don't automatically rollback staging
- E2E test coverage target: 10-15% (critical flows only: auth, donation, story viewing)

**Best Practices**:
- Write smoke tests first: app launches, key screens load, critical API calls succeed
- Use Playwright's `test.beforeEach()` to reset test data via Firebase Admin SDK
- Tag tests by priority: `@smoke`, `@critical`, `@regression`
- Set reasonable timeouts: 30s for API calls, 10s for UI interactions
- Capture screenshots and videos on test failure for debugging

**Dependencies**:
```json
{
  "@playwright/test": "^1.40.0",
  "firebase-admin": "^13.5.0"
}
```

**Configuration Example** (Playwright):
```typescript
// playwright.config.ts
export default {
  testDir: './e2e',
  timeout: 60000,
  retries: 2,
  use: {
    baseURL: process.env.STAGING_DASHBOARD_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
};
```

---

### 2. Expo EAS Build Best Practices

**Decision**: Use Expo EAS Build with managed credentials and preview builds for staging

**Rationale**:
- **Managed credentials**: Expo handles code signing certificates and provisioning profiles, eliminates manual iOS certificate management (saves hours per developer)
- **Preview builds**: Internal distribution for staging (TestFlight/Internal Testing) before store submission
- **Cloud build infrastructure**: Zero local Xcode/Android Studio requirement, builds run in Expo's infrastructure
- **Build profiles**: Separate profiles for dev/staging/prod with different configurations
- **OTA updates**: Can push JavaScript-only updates without app store review for hotfixes (within Expo constraints)

**Alternatives Considered**:
- **Local builds with Expo CLI**: Free but requires macOS with Xcode for iOS builds, not scalable across team
- **Fastlane + GitHub Actions**: More control but requires certificate management, violates "Speed Over Perfection"
- **Manual Xcode/Android Studio builds**: Extremely time-consuming, error-prone, doesn't scale

**Implementation Notes**:
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "staging": {
      "distribution": "internal",
      "channel": "staging",
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "distribution": "store",
      "channel": "production",
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "build@hamaaser.org",
        "ascAppId": "NEEDS_CONFIGURATION",
        "appleTeamId": "NEEDS_CONFIGURATION"
      },
      "android": {
        "serviceAccountKeyPath": "secrets/google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

**Best Practices**:
- Use `eas build --platform all --profile staging` for simultaneous iOS/Android builds
- Store EAS credentials as GitHub Secrets: `EXPO_TOKEN` for authentication
- Enable build caching to reduce build times (managed automatically by EAS)
- Use semantic versioning: increment `versionCode` (Android) and `buildNumber` (iOS) automatically via script
- Set appropriate build timeouts: 45 minutes for iOS, 30 minutes for Android
- Use `channel` field for OTA update targeting (staging vs production channels)

**Cost Considerations**:
- EAS Build: $29/month for Expo Production plan (unlimited builds)
- Alternative (free tier): 30 builds/month - may be sufficient for MVP if we limit to 7-8 builds/week

**Dependencies**:
```bash
npm install -g eas-cli@7.0.0
```

**Version Management Script**:
```bash
#!/bin/bash
# scripts/deploy/bump-mobile-version.sh
CURRENT_BUILD=$(grep '"buildNumber"' mobile/app.json | sed 's/[^0-9]*//g')
NEW_BUILD=$((CURRENT_BUILD + 1))
sed -i '' "s/\"buildNumber\": \"$CURRENT_BUILD\"/\"buildNumber\": \"$NEW_BUILD\"/" mobile/app.json
sed -i '' "s/\"versionCode\": $CURRENT_BUILD/\"versionCode\": $NEW_BUILD/" mobile/app.json
echo "Bumped build version to $NEW_BUILD"
```

---

### 3. Vercel Deployment Strategy

**Decision**: Use Vercel CLI with GitHub integration for automated deployments

**Rationale**:
- **Preview deployments**: Automatic preview URL for every PR, enables testing before merge
- **Production deployments**: Triggered manually via GitHub Actions after approval
- **Environment variables**: Managed via Vercel dashboard or CLI, injected at build time
- **Edge Functions**: Next.js API routes run on Vercel Edge Network (low latency globally)
- **Zero downtime**: Atomic deployments with instant rollback capability
- **Automatic HTTPS**: SSL certificates provisioned automatically

**Alternatives Considered**:
- **Firebase Hosting**: Would require SSR workarounds for Next.js, not optimized for Next.js apps
- **AWS Amplify**: More complex configuration, slower deployments, higher learning curve
- **Self-hosted Next.js**: Requires infrastructure management, violates "Zero DevOps" principle

**Implementation Notes**:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_ENV": "production"
  },
  "build": {
    "env": {
      "FIREBASE_PROJECT_ID": "@firebase-project-id-prod"
    }
  }
}
```

**Best Practices**:
- Link Vercel project to GitHub repository for automatic PR previews
- Use Vercel CLI for production deployments: `vercel --prod` (triggered via GitHub Actions)
- Store sensitive secrets as Vercel environment variables (encrypted at rest)
- Use production/preview/development environment separation in Vercel dashboard
- Enable Vercel Analytics for Core Web Vitals tracking (optional, $10/month)
- Set custom domain after initial deployment: `dashboard.hamaaser.org`

**GitHub Actions Integration**:
```yaml
- name: Deploy to Vercel
  run: |
    cd dashboard
    vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Environment Variables Required**:
- `VERCEL_TOKEN`: Personal access token from Vercel dashboard
- `VERCEL_ORG_ID`: Organization ID (found in Vercel settings)
- `VERCEL_PROJECT_ID`: Project ID (found in Vercel project settings)
- `FIREBASE_PROJECT_ID`: Firebase project ID per environment
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key (environment-specific)

**Rollback Strategy**:
- Vercel maintains deployment history with one-click rollback in dashboard
- Or via CLI: `vercel rollback [deployment-url]`
- Previous deployment remains accessible at unique URL until manually deleted

---

### 4. Firebase Functions Deployment

**Decision**: Use Firebase CLI with project aliases for multi-environment deployments

**Rationale**:
- **Project aliases**: Map `dev`, `staging`, `prod` aliases to different Firebase projects
- **Partial deployments**: Deploy only changed functions to reduce deployment time
- **Environment configuration**: Use `.env` files and Firebase Functions config for secrets
- **Local testing**: Firebase Emulator Suite enables local function testing before deployment
- **Versioning**: Functions automatically versioned by Firebase, previous versions retained for rollback

**Alternatives Considered**:
- **Manual deployment**: Too slow, error-prone for multi-environment setup
- **Cloud Build**: More complex than necessary for MVP, adds cost
- **Terraform**: Over-engineered for Firebase Functions, violates "Speed Over Perfection"

**Implementation Notes**:
```json
// .firebaserc
{
  "projects": {
    "default": "hamaaser-dev",
    "dev": "hamaaser-dev",
    "staging": "hamaaser-staging",
    "prod": "hamaaser-prod"
  }
}
```

**Deployment Script**:
```bash
#!/bin/bash
# scripts/deploy/deploy-functions.sh
set -e

ENV=${1:-staging}  # Default to staging
firebase use $ENV
cd functions
npm run build
firebase deploy --only functions --force
firebase functions:log --limit 10  # Show recent logs
```

**Best Practices**:
- Run `npm run lint` and `npm test` before deployment
- Use `--only functions:functionName` for single-function deployments (faster iteration)
- Set function memory and timeout based on usage: `memory: "256MB", timeoutSeconds: 60`
- Use Cloud Scheduler for scheduled functions instead of polling
- Enable function insights for performance monitoring
- Use structured logging: `functions.logger.info({msg: "...", data: {...}})`

**Environment Configuration**:
```bash
# Set secrets per environment
firebase use staging
firebase functions:secrets:set STRIPE_SECRET_KEY

firebase use prod
firebase functions:secrets:set STRIPE_SECRET_KEY
```

**Testing Strategy**:
```bash
# Local testing with emulators
firebase emulators:start --only functions,firestore
npm run test:integration  # Hit emulated functions
```

**Deployment Gates**:
1. Unit tests pass (`npm test` in functions/)
2. Linting passes (`npm run lint`)
3. Build succeeds (`npm run build`)
4. Emulator tests pass (optional for staging, required for prod)

---

### 5. Secrets Management Strategy

**Decision**: Use GitHub Secrets + Firebase Functions Secrets + Vercel Environment Variables

**Rationale**:
- **GitHub Secrets**: Encrypted secrets for CI/CD (EXPO_TOKEN, VERCEL_TOKEN, Firebase service accounts)
- **Firebase Functions Secrets**: Native secrets management for Cloud Functions (Stripe keys, API tokens)
- **Vercel Environment Variables**: Dashboard-specific secrets (Firebase config, Stripe public keys)
- **Separation**: Each platform's secrets stored in appropriate system, not duplicated
- **Zero git exposure**: All secrets injected at build/runtime, never committed

**Alternatives Considered**:
- **HashiCorp Vault**: Over-engineered for MVP, requires infrastructure management
- **AWS Secrets Manager**: Adds AWS dependency, not necessary with Firebase-first stack
- **Environment files in git**: SECURITY VIOLATION - never acceptable for payment platform
- **Plain text in CI**: SECURITY VIOLATION - exposes secrets in logs

**Implementation Architecture**:

```
GitHub Secrets (CI/CD credentials)
├── EXPO_TOKEN                    # Expo EAS authentication
├── VERCEL_TOKEN                  # Vercel CLI authentication
├── FIREBASE_SERVICE_ACCOUNT_DEV  # Firebase admin for dev
├── FIREBASE_SERVICE_ACCOUNT_STAGING
├── FIREBASE_SERVICE_ACCOUNT_PROD
├── GOOGLE_PLAY_SERVICE_ACCOUNT   # Android app publishing
└── APPLE_API_KEY                 # iOS app publishing

Firebase Functions Secrets (runtime secrets)
├── dev project
│   ├── STRIPE_SECRET_KEY         # Test key
│   └── SENDGRID_API_KEY          # Test key
├── staging project
│   ├── STRIPE_SECRET_KEY         # Test key
│   └── SENDGRID_API_KEY          # Live key (low volume)
└── prod project
    ├── STRIPE_SECRET_KEY         # Live key
    └── SENDGRID_API_KEY          # Live key

Vercel Environment Variables (build-time + runtime)
├── Development
│   ├── NEXT_PUBLIC_FIREBASE_PROJECT_ID
│   ├── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Test key
│   └── FIREBASE_ADMIN_SERVICE_ACCOUNT (encrypted)
├── Preview
│   └── [same as staging]
└── Production
    ├── NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ├── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Live key
    └── FIREBASE_ADMIN_SERVICE_ACCOUNT (encrypted)
```

**Best Practices**:
- **Rotation**: Rotate secrets every 90 days, test in staging first
- **Audit**: Log all secret access (Firebase Functions Secrets provides automatic audit logs)
- **Least privilege**: Each environment's service account has minimal permissions
- **Validation**: Run `scripts/deploy/check-secrets.sh` before deployment to verify all required secrets exist
- **Documentation**: Maintain `config/environments/.env.example` with all required secret names (NO VALUES)
- **Emergency revocation**: Document process to revoke compromised secrets across all systems

**Secret Validation Script**:
```bash
#!/bin/bash
# scripts/deploy/check-secrets.sh
ENV=${1:-staging}

echo "Checking secrets for $ENV environment..."

# Check GitHub Secrets (requires gh CLI)
gh secret list | grep -q EXPO_TOKEN || echo "❌ Missing: EXPO_TOKEN"
gh secret list | grep -q VERCEL_TOKEN || echo "❌ Missing: VERCEL_TOKEN"

# Check Firebase Secrets
firebase use $ENV
firebase functions:secrets:access STRIPE_SECRET_KEY > /dev/null || echo "❌ Missing: STRIPE_SECRET_KEY"

# Check Vercel Secrets
vercel env ls $ENV | grep -q NEXT_PUBLIC_FIREBASE_PROJECT_ID || echo "❌ Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID"

echo "✅ Secret validation complete"
```

**Security Guardrails**:
1. **Pre-commit hooks**: Scan for accidentally committed secrets using `git-secrets` or `trufflehog`
2. **CI scanning**: GitHub Advanced Security secret scanning (enabled automatically on private repos)
3. **Runtime validation**: Functions check for required environment variables on cold start, fail fast if missing
4. **Principle of least privilege**: Each service account has minimal IAM permissions

**Secrets Onboarding Checklist**:
- [ ] Install GitHub CLI: `brew install gh`
- [ ] Authenticate: `gh auth login`
- [ ] Set GitHub Secrets: `gh secret set EXPO_TOKEN`
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Set Firebase Secrets: `firebase functions:secrets:set STRIPE_SECRET_KEY`
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Link project: `vercel link`
- [ ] Set Vercel variables: `vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID`

---

### 6. GitHub Actions CI/CD Pipeline Design

**Decision**: Four separate workflows for different deployment scenarios

**Rationale**:
- **Separation of concerns**: Each workflow has single responsibility
- **Parallel execution**: Tests and builds can run concurrently
- **Manual gates**: Production requires approval, staging is automatic
- **Reusable actions**: Common steps extracted to reusable actions

**Workflow Architecture**:

1. **ci-tests.yml** (Trigger: PR, Push to any branch)
   - Run ESLint, TypeScript type checking
   - Run Jest unit tests (mobile, dashboard, functions)
   - Run Firebase Emulator Suite integration tests
   - Post coverage report to PR
   - Status check required before merge

2. **deploy-staging.yml** (Trigger: Push to `main` branch)
   - Wait for ci-tests.yml to pass
   - Deploy functions to staging Firebase project
   - Deploy dashboard to Vercel staging
   - Trigger Expo EAS Build for staging (internal distribution)
   - Run Playwright E2E tests against staging dashboard
   - Run Firebase Test Lab tests on staging mobile build
   - Post deployment status to Slack

3. **deploy-production.yml** (Trigger: Manual workflow dispatch)
   - Require manual approval (GitHub Environment protection rule)
   - Validate production secrets exist
   - Deploy functions to production Firebase project
   - Deploy dashboard to Vercel production
   - Trigger Expo EAS Submit for App Store/Play Store
   - Run smoke tests against production
   - Post deployment notification to Slack
   - Create GitHub release with version tag

4. **mobile-build.yml** (Trigger: Manual or called by other workflows)
   - Reusable workflow for building mobile apps
   - Inputs: environment (dev/staging/prod), platform (ios/android/all)
   - Bump version numbers automatically
   - Run Expo EAS Build
   - Output: Build URLs and QR codes for testing

**Example Workflow** (deploy-staging.yml):
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd functions && npm ci
      
      - name: Run tests
        run: cd functions && npm test
      
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase use staging
          firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  deploy-dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd dashboard && npm ci
      
      - name: Deploy to Vercel
        run: |
          cd dashboard
          vercel --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: cd mobile && npm ci
      
      - name: Build on EAS
        run: |
          cd mobile
          eas build --platform all --profile staging --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  e2e-tests:
    needs: [deploy-dashboard]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Playwright
        run: npm ci && npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          STAGING_DASHBOARD_URL: ${{ secrets.STAGING_DASHBOARD_URL }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: playwright-report/
```

**Best Practices**:
- Use caching for `node_modules` to speed up builds: `cache: 'npm'`
- Pin action versions: `uses: actions/checkout@v4` (not `@main`)
- Use secrets for all credentials, never hardcode
- Set timeouts to prevent hung jobs: `timeout-minutes: 30`
- Use matrix strategy for parallel testing across Node versions (if needed)
- Store artifacts (builds, test reports) for 30 days: `retention-days: 30`

---

## Summary of Decisions

| Area | Technology | Rationale |
|------|-----------|-----------|
| **E2E Testing** | Playwright + Firebase Test Lab | Best balance of reliability and setup simplicity |
| **Mobile Builds** | Expo EAS Build | Managed credentials, zero local requirements |
| **Dashboard Deploy** | Vercel CLI + GitHub Integration | Zero-config Next.js optimization, preview deployments |
| **Functions Deploy** | Firebase CLI with project aliases | Native Firebase integration, simple multi-env |
| **Secrets Management** | GitHub Secrets + Firebase Secrets + Vercel Env Vars | Platform-native, secure, auditable |
| **CI/CD Platform** | GitHub Actions | Free for private repos, native GitHub integration |

## Next Steps (Phase 1)

1. Create `data-model.md` defining environment configuration schemas
2. Generate `contracts/` with CI/CD pipeline definitions and deployment script interfaces
3. Create `quickstart.md` with step-by-step deployment runbook
4. Update agent context with new technologies (Expo EAS, Vercel CLI, Playwright)

## Outstanding Questions

- **RESOLVED**: E2E testing framework → Playwright + Firebase Test Lab
- **NEW**: Should we use Expo OTA updates for hotfixes, or always go through app stores?
  - **Recommendation**: Use OTA for JavaScript-only hotfixes during MVP (faster), full store releases for native changes
- **NEW**: What's the mobile app version numbering strategy?
  - **Recommendation**: Semantic versioning for display version (1.0.0, 1.1.0), auto-increment build numbers (1, 2, 3...)
