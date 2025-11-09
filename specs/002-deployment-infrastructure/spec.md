# Feature Specification: Deployment Infrastructure

**Feature Branch**: `002-deployment-infrastructure`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "Design and implement a complete deployment infrastructure for the HaMaaser MVP platform covering mobile apps (iOS/Android via Expo), Next.js dashboard (Vercel), and Firebase Cloud Functions. Include CI/CD pipelines, environment management (dev/staging/prod), secrets handling, automated testing gates, app store deployment processes, monitoring setup, and rollback procedures. Must comply with constitution's Speed Over Perfection principle - prioritize getting working deployments over perfect DevOps, but maintain Security as Foundation for secrets and payment environment separation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Production Deploy (Priority: P1)

Developer can manually trigger a production deployment to all platforms (mobile, dashboard, functions) with a single command or button press, with automatic rollback capability if deployment fails.

**Why this priority**: Core deployment capability is prerequisite for all other DevOps features. Must be reliable before automation.

**Independent Test**: Developer runs deploy command, all three platforms update successfully, version numbers increment, health checks pass within 5 minutes.

**Acceptance Scenarios**:

1. **Given** code is merged to main branch, **When** developer runs `npm run deploy:prod`, **Then** mobile builds are submitted to app stores, dashboard deploys to Vercel, and Firebase Functions deploy successfully
2. **Given** deployment fails on any platform, **When** failure is detected, **Then** system automatically rolls back to previous working version and notifies team
3. **Given** deployment is in progress, **When** developer checks status, **Then** real-time progress is visible for each platform

---

### User Story 2 - Environment Separation (Priority: P1)

System maintains separate development, staging, and production environments with isolated data, separate Stripe keys, and distinct Firebase projects.

**Why this priority**: Security as Foundation requires payment environment separation. Testing with production data violates multiple constitution principles.

**Independent Test**: Deploy same codebase to dev/staging/prod, verify each uses different Firebase projects, different Stripe keys, no data cross-contamination.

**Acceptance Scenarios**:

1. **Given** app is running in dev environment, **When** payment is processed, **Then** Stripe test keys are used and test Firebase project is updated
2. **Given** staging deployment exists, **When** production deployment runs, **Then** staging data and configuration remain unchanged
3. **Given** environment variables are needed, **When** developer accesses them, **Then** correct values load based on current environment without manual switching

---

### User Story 3 - Secrets Management (Priority: P1)

API keys, database credentials, and payment secrets are stored securely, never committed to git, and automatically injected during build/deploy.

**Why this priority**: Security as Foundation is non-negotiable. Exposed secrets in git is existential risk for payment platform.

**Independent Test**: Search git history for secrets, attempt to build without environment setup, verify secrets injection works in CI/CD.

**Acceptance Scenarios**:

1. **Given** new developer joins team, **When** they clone repository, **Then** no secrets are visible in code or git history
2. **Given** CI/CD pipeline runs, **When** build starts, **Then** secrets are securely injected from vault/secrets manager
3. **Given** Stripe API key is needed, **When** code requests it, **Then** correct key loads based on environment (test vs live) without hardcoding

---

### User Story 4 - Automated CI/CD Pipeline (Priority: P2)

When code is pushed to main branch, automated pipeline runs tests, builds all platforms, and deploys to staging automatically. Production requires manual approval.

**Why this priority**: Accelerates deployment cycle while maintaining quality gates. Follows "Speed Over Perfection" with safety nets.

**Independent Test**: Push code to main, verify automated staging deploy happens within 15 minutes, production shows as "awaiting approval".

**Acceptance Scenarios**:

1. **Given** code is pushed to main branch, **When** CI detects the push, **Then** tests run automatically and staging deploys if tests pass
2. **Given** tests fail in CI, **When** pipeline completes, **Then** deployment is blocked and developer is notified with specific failures
3. **Given** staging deployment succeeded, **When** manual production approval is given, **Then** production deployment starts with same artifacts

---

### User Story 5 - Mobile App Store Submission (Priority: P2)

Automated build process creates iOS and Android app binaries, submits to TestFlight/Internal Testing, and (with approval) to App Store/Play Store.

**Why this priority**: Mobile deployment is complex and error-prone. Automation reduces 2-hour manual process to 10-minute automated flow.

**Independent Test**: Trigger build, verify TestFlight build appears within 20 minutes, production release (with approval) submits to stores.

**Acceptance Scenarios**:

1. **Given** version bump is committed, **When** mobile build triggers, **Then** iOS IPA and Android AAB are built and submitted to TestFlight/Internal Testing
2. **Given** TestFlight build is approved, **When** production release is triggered, **Then** build is submitted to App Store and Play Store for review
3. **Given** app store submission fails, **When** error occurs, **Then** detailed error message is logged and team is notified

---

### User Story 6 - Monitoring and Alerts (Priority: P2)

Production errors, performance issues, and deployment failures trigger automatic alerts to team via email/Slack with actionable information.

**Why this priority**: Enables fast response to production issues. Aligns with MVP focus on shipping and learning quickly from real usage.

**Independent Test**: Trigger test error in production, verify alert arrives within 2 minutes with stack trace and affected user count.

**Acceptance Scenarios**:

1. **Given** JavaScript error occurs in production mobile app, **When** error happens, **Then** team receives alert with stack trace, device info, and user ID within 2 minutes
2. **Given** API response time exceeds 5 seconds, **When** threshold is crossed, **Then** performance alert is sent with affected endpoint details
3. **Given** deployment fails, **When** failure is detected, **Then** alert includes failure reason, affected platform, and rollback status

---

### User Story 7 - Rollback Capability (Priority: P3)

Developer can rollback to previous working version for any platform with single command, completing within 5 minutes.

**Why this priority**: Safety net for failed deployments. Lower priority because automated rollback (P1) handles most cases.

**Independent Test**: Deploy breaking change, manually trigger rollback, verify previous version is restored and functional.

**Acceptance Scenarios**:

1. **Given** production has critical bug, **When** developer runs `npm run rollback:prod`, **Then** previous working version is restored to all platforms within 5 minutes
2. **Given** rollback is needed for single platform, **When** platform-specific rollback is triggered, **Then** only that platform reverts, others remain on current version
3. **Given** rollback completes, **When** verification runs, **Then** health checks confirm system is functional on previous version

---

### User Story 8 - Deployment Analytics (Priority: P3)

Dashboard shows deployment history, success rates, average deployment time, and current versions running in each environment.

**Why this priority**: Nice-to-have visibility. Helps optimize deployment process but not critical for MVP shipping.

**Independent Test**: Open deployment dashboard, verify last 10 deployments are listed with status, duration, and deployer info.

**Acceptance Scenarios**:

1. **Given** deployments have occurred, **When** developer opens dashboard, **Then** deployment history shows last 30 days with success/failure status
2. **Given** multiple environments exist, **When** developer checks current versions, **Then** dashboard displays which version is running in dev/staging/prod for each platform
3. **Given** deployment metrics are collected, **When** viewing analytics, **Then** average deployment time and success rate are displayed per platform

---

### Edge Cases

- What happens when App Store review rejects the mobile app submission?
- How does system handle partial deployment success (e.g., mobile succeeds but dashboard fails)?
- What happens if secrets manager is temporarily unavailable during deployment?
- How does system handle version conflicts when multiple developers attempt simultaneous deployments?
- What happens when Firebase quota limits are hit during deployment?
- How does system handle deployment during active user sessions (zero-downtime requirement)?
- What happens if rollback itself fails?

## Requirements *(mandatory)*

### Functional Requirements

#### Core Deployment (P1)

- **FR-001**: System MUST support one-command deployment to production for all three platforms (mobile, dashboard, functions)
- **FR-002**: System MUST maintain three separate environments (development, staging, production) with isolated data stores
- **FR-003**: System MUST automatically rollback failed deployments to last known working version within 3 minutes
- **FR-004**: System MUST prevent production deployments if automated tests fail
- **FR-005**: System MUST inject environment-specific secrets (API keys, credentials) during build without hardcoding

#### Security & Secrets (P1)

- **FR-006**: System MUST never store secrets in git repository or source code
- **FR-007**: System MUST use separate Stripe API keys for test (dev/staging) and live (production) environments
- **FR-008**: System MUST use separate Firebase projects for dev, staging, and production
- **FR-009**: System MUST encrypt secrets at rest and in transit during CI/CD pipeline
- **FR-010**: System MUST restrict production secrets access to authorized personnel only

#### Mobile Deployment (P1)

- **FR-011**: System MUST build iOS IPA using Expo EAS Build with production certificates
- **FR-012**: System MUST build Android AAB using Expo EAS Build with production keystore
- **FR-013**: System MUST submit iOS builds to TestFlight for staging releases
- **FR-014**: System MUST submit Android builds to Internal Testing track for staging releases
- **FR-015**: System MUST support production submission to App Store and Google Play Store

#### Dashboard Deployment (P1)

- **FR-016**: System MUST deploy Next.js dashboard to Vercel with automatic preview deployments for PRs
- **FR-017**: System MUST configure custom domain for production dashboard
- **FR-018**: System MUST enable Vercel environment variables for dev/staging/prod
- **FR-019**: System MUST support zero-downtime deployments for dashboard updates

#### Functions Deployment (P1)

- **FR-020**: System MUST deploy Firebase Cloud Functions to correct project per environment
- **FR-021**: System MUST maintain function configuration (memory, timeout, region) in version control
- **FR-022**: System MUST run function unit tests before deployment
- **FR-023**: System MUST support function-level rollback independent of mobile/dashboard

#### CI/CD Automation (P2)

- **FR-024**: System MUST automatically trigger staging deployment on main branch commits
- **FR-025**: System MUST require manual approval for production deployments
- **FR-026**: System MUST run linting, type checking, and unit tests in CI pipeline
- **FR-027**: System MUST build all platforms in parallel to minimize deployment time
- **FR-028**: System MUST provide deployment status visibility (in-progress, success, failed)

#### Monitoring & Alerts (P2)

- **FR-029**: System MUST capture and report JavaScript errors from mobile app in production
- **FR-030**: System MUST capture and report server errors from Firebase Functions
- **FR-031**: System MUST send alerts for deployment failures within 2 minutes
- **FR-032**: System MUST track API response times and alert on performance degradation
- **FR-033**: System MUST provide error rate dashboard showing trends over time

#### Rollback & Recovery (P2)

- **FR-034**: System MUST support manual rollback command for each platform
- **FR-035**: System MUST preserve last 5 deployment versions for rollback capability
- **FR-036**: System MUST run health checks after rollback to verify system stability
- **FR-037**: System MUST log all rollback actions with timestamp and triggering user

### Key Entities

- **Environment**: Configuration bundle (dev/staging/prod) containing Firebase project ID, Stripe keys, API endpoints, feature flags
- **Deployment**: Record of single deployment event including version, timestamp, platforms affected, deployer, status, duration
- **Build Artifact**: Platform-specific binary (IPA, AAB) or compiled code (dashboard bundle, functions) with version and environment metadata
- **Secret**: Encrypted key-value pair (API key, certificate, password) with environment scope and access controls
- **Alert**: Notification triggered by error, performance issue, or deployment event, containing severity, message, and actionable context

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can deploy all three platforms from local machine to staging in under 15 minutes (excluding app store review times)
- **SC-002**: Zero production secrets are found in git history or codebase (verified by automated scanning)
- **SC-003**: Automated staging deployment succeeds within 20 minutes of main branch commit 95% of the time
- **SC-004**: Production errors trigger team alerts within 2 minutes with actionable error details
- **SC-005**: Manual production deployment (after approval) completes in under 30 minutes for all platforms
- **SC-006**: Rollback to previous version completes in under 5 minutes and passes health checks
- **SC-007**: Failed deployments automatically rollback without manual intervention 100% of the time
- **SC-008**: Deployment success rate exceeds 90% (excluding intentional test failures)
