# Implementation Plan: Deployment Infrastructure

**Branch**: `002-deployment-infrastructure` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-deployment-infrastructure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Building a complete CI/CD deployment infrastructure for the HaMaaser MVP platform covering three distinct platforms: React Native mobile apps (iOS/Android via Expo EAS), Next.js admin dashboard (Vercel), and Firebase Cloud Functions. Core capabilities include one-command production deployments, three-environment separation (dev/staging/prod), automated CI/CD pipelines with testing gates, secure secrets management, mobile app store automation, production monitoring with alerts, and automatic rollback on failure. Technical approach prioritizes "Speed Over Perfection" using managed services (Expo EAS, Vercel, Firebase) over custom DevOps infrastructure while maintaining "Security as Foundation" through strict secrets isolation and payment environment separation.

## Technical Context

**Language/Version**: Node.js 20 LTS, Bash scripting (deployment scripts), YAML (CI/CD config)  
**Primary Dependencies**: Expo EAS CLI 7.0+, Vercel CLI 32+, Firebase CLI 13+, GitHub Actions (CI/CD runner)  
**Storage**: N/A (infrastructure configuration only, uses Firebase Firestore from main app)  
**Testing**: Jest (pre-deployment test gates), Firebase Emulator Suite (function testing), NEEDS CLARIFICATION: E2E testing framework for post-deploy validation  
**Target Platform**: Expo EAS Build (iOS/Android builds), Vercel Edge Network (dashboard), Google Cloud Functions (Firebase runtime)  
**Project Type**: Infrastructure/DevOps (supports mobile + web + serverless platforms)  
**Performance Goals**: <15min staging deploy, <30min production deploy, <5min rollback, <2min alert delivery  
**Constraints**: Zero downtime for dashboard deployments, no secrets in git, 99.9% deployment success rate, PCI-compliant secrets handling  
**Scale/Scope**: 3 environments, 3 platforms, 5-10 deployments/week during MVP, support for 2-5 developers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. MVP-First Development (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Using fully managed services (Expo EAS for mobile builds, Vercel for dashboard, Firebase for functions) eliminates need to build custom CI/CD infrastructure. Automated deployment accelerates MVP iteration by reducing deployment time from 2+ hours manual to <30min automated. Enables rapid shipping of fixes and features to validate product-market fit faster.

### ✅ II. Security as Foundation (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Strict environment separation ensures Stripe test keys never touch production data (FR-007, FR-008). Secrets management via GitHub Secrets and environment variables prevents accidental exposure (FR-006). Separate Firebase projects per environment provide data isolation. Automated secrets scanning prevents commits containing keys. This directly protects payment processing integrity required for donation platform trust.

### ✅ III. Real Data Only (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Environment separation enables development and staging environments to use test data while production maintains real NGO stories and real donations. No deployment infrastructure component generates or requires synthetic user-facing content. This principle is satisfied through infrastructure design, not violated.

### ✅ IV. Lean Scope Discipline

- **Status**: PASS
- **Compliance**: Deployment scope is tightly defined: three platforms, three environments, core automation only. Explicitly OUT-of-scope: advanced deployment strategies (blue-green, canary), sophisticated monitoring dashboards, custom build optimization, deployment scheduling, multi-region deployments. These can be added post-MVP if needed. Focus is on reliable, repeatable deployments that unblock shipping MVP.

### ✅ V. Speed Over Perfection

- **Status**: PASS WITH INTENTIONAL SHORTCUTS
- **Compliance**: Using managed services over self-hosted (Expo EAS vs custom build servers, Vercel vs self-managed hosting, GitHub Actions vs Jenkins). Manual production approval vs fully automated (adds safety gate during MVP phase). Basic monitoring (error alerts) vs comprehensive observability (detailed metrics, tracing, APM). 30% test coverage requirement maintained—deployment gates don't enforce 80%+ coverage. These shortcuts accelerate MVP delivery while maintaining safety and reliability.

### ⚠️ Technology Stack Constraints

- **Status**: PASS WITH APPROVED DEVIATIONS
- **Compliance**:
  - Firebase Auth ✓ (used in main app)
  - Firestore ✓ (used in main app)
  - Firebase Hosting ✓ (deployment target)
  - Vercel ✓ (approved hosting for Next.js dashboard)
  - **APPROVED DEVIATION**: GitHub Actions (CI/CD runner - not in original stack but necessary for automation, aligns with "Speed Over Perfection")
  - **APPROVED DEVIATION**: Expo EAS Build (replaces manual Expo builds - necessary for automated mobile deployment, aligns with managed services principle)

**Gate Result**: ALL CHECKS PASSED WITH APPROVED DEVIATIONS - Proceed to Phase 0 Research

**Rationale for Deviations**: GitHub Actions and Expo EAS are industry-standard managed services that eliminate DevOps complexity. Both are zero-infrastructure solutions that align with constitution's "Speed Over Perfection" and "Zero DevOps" principles. These additions enable automation without requiring custom infrastructure development.

## Project Structure

### Documentation (this feature)

```text
specs/002-deployment-infrastructure/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (environment config models)
├── quickstart.md        # Phase 1 output (deployment runbook)
└── contracts/           # Phase 1 output (/speckit.plan command)
    ├── github-actions.yml     # CI/CD pipeline definition
    ├── deployment-api.md      # Deployment script interfaces
    └── secrets-schema.md      # Required secrets per environment
```

### Source Code (repository root)

```text
hamaaser/
├── .github/
│   └── workflows/
│       ├── ci-tests.yml              # Run tests on PR
│       ├── deploy-staging.yml        # Auto-deploy to staging on main
│       ├── deploy-production.yml     # Manual production deployment
│       └── mobile-build.yml          # Expo EAS build automation
│
├── scripts/
│   └── deploy/
│       ├── deploy-all.sh             # One-command deployment orchestrator
│       ├── deploy-mobile.sh          # Expo EAS build & submit
│       ├── deploy-dashboard.sh       # Vercel deployment
│       ├── deploy-functions.sh       # Firebase Functions deployment
│       ├── rollback.sh               # Multi-platform rollback
│       ├── setup-environments.sh     # Initialize dev/staging/prod
│       └── check-secrets.sh          # Validate secrets configuration
│
├── config/
│   └── environments/
│       ├── development.json          # Dev environment config
│       ├── staging.json              # Staging environment config
│       ├── production.json           # Prod environment config (no secrets)
│       └── .env.example              # Template for required secrets
│
├── mobile/
│   ├── eas.json                      # Expo EAS Build configuration
│   ├── app.json                      # Environment-specific app config
│   └── [existing mobile structure]
│
├── dashboard/
│   ├── vercel.json                   # Vercel deployment config
│   ├── next.config.mjs               # Environment-aware Next config
│   └── [existing dashboard structure]
│
├── functions/
│   ├── .firebaserc                   # Firebase project aliases
│   └── [existing functions structure]
│
└── .firebaserc                       # Root Firebase project configuration
```

**Structure Decision**: Selected **Infrastructure/DevOps** pattern because this feature adds deployment automation tooling that spans all three existing projects (mobile, dashboard, functions) without modifying their internal structure. Deployment scripts live in dedicated `scripts/deploy/` directory. GitHub Actions workflows orchestrate CI/CD. Environment configurations are centralized in `config/environments/` to prevent duplication. This structure keeps deployment concerns separated from application code while providing unified deployment commands.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected**. All constitution principles are satisfied with two approved deviations (GitHub Actions and Expo EAS) that align with "Speed Over Perfection" and managed services strategy.
