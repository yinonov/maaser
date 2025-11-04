# Implementation Plan: HaMaaser MVP Digital Tithing Platform

**Branch**: `001-mvp-platform-spec` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-platform-spec/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Building a mobile-first donation platform that connects donors with NGO beneficiary stories through a social-media-style feed. Core MVP features include user authentication, story browsing, one-tap donations via Stripe, automated receipt generation, and an NGO admin dashboard for story management. Technical approach uses React Native + Firebase + Stripe to minimize infrastructure complexity and accelerate 12-week MVP delivery timeline.

## Technical Context

**Language/Version**: JavaScript/TypeScript ES2022, Node.js 20 LTS  
**Primary Dependencies**: React Native 0.74+, Expo SDK 51+, Next.js 14+, Firebase SDK 10.7+  
**Storage**: Firebase Firestore (NoSQL document database), Firebase Cloud Storage (images/PDFs)  
**Testing**: Jest + React Native Testing Library (30% coverage target for MVP)  
**Target Platform**: iOS 15+, Android 8+, Web browsers (Chrome/Safari/Firefox for dashboard)  
**Project Type**: Mobile + Web (React Native mobile app + Next.js admin dashboard + Firebase Cloud Functions)  
**Performance Goals**: <3sec app launch, <2sec story feed load, 60 FPS scrolling, <5sec donation completion  
**Constraints**: 99% uptime for payments, <2% crash rate, 95% payment success rate, works on 3G networks  
**Scale/Scope**: 1K users initially, 10K within 6 months, 10-20 NGO partners, 100+ stories, PCI DSS compliant (via Stripe)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. MVP-First Development (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Using Firebase serverless architecture minimizes infrastructure work. Stripe Checkout eliminates payment form development. React Native provides single codebase for dual platforms. All choices optimize for 12-week delivery.

### ✅ II. Security as Foundation (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Stripe Checkout handles all payment data (PCI compliant by design). Firebase Auth provides enterprise-grade authentication. No payment data touches our servers. Fee transparency implemented in donation flow UI (FR-003).

### ✅ III. Real Data Only (NON-NEGOTIABLE)

- **Status**: PASS
- **Compliance**: Data model includes Story entity with NGO verification. Platform admin approval required before stories go live (FR-016). No synthetic data in production environment.

### ✅ IV. Lean Scope Discipline

- **Status**: PASS
- **Compliance**: Spec clearly defines OUT-of-scope features (recurring donations, gamification, social sharing). Focus on P1 user story (donor discovery + first donation). Decision tree implemented for feature requests.

### ✅ V. Speed Over Perfection

- **Status**: PASS
- **Compliance**: 30% test coverage target (vs typical 80%). Zustand for state management (lighter than Redux). Firebase eliminates DevOps. Expo simplifies React Native builds. TypeScript in loose mode for faster development.

### ✅ Technology Stack Constraints

- **Status**: PASS
- **Compliance**:
  - React Native ✓
  - Firebase Auth ✓
  - Firestore ✓
  - Stripe Checkout ✓
  - Firebase Hosting + Vercel ✓
  - Zustand (lightweight alternative to Context API - approved deviation for better DX) ✓

**Gate Result**: ALL CHECKS PASSED - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-platform-spec/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── design-reference.md  # Phase 1 output (design system guide)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── contracts/           # Phase 1 output (/speckit.plan command)
    ├── payment-api.md   # Payment endpoints
    ├── story-api.md     # Story management endpoints
    └── user-api.md      # User/auth endpoints

example pages/           # UI mockups (Google Stitch prototypes)
├── home.html                           # Story feed screen
├── registration-login.html             # Auth flow
├── dontation.html                      # Donation flow
├── invoice.html                        # Receipt generation
└── business-payment-setup.html         # NGO payment settings
```

### Source Code (repository root)

```text
hamaaser/
├── mobile/                     # React Native app (iOS + Android)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── StoryCard.tsx
│   │   │   ├── DonationButton.tsx
│   │   │   └── ReceiptViewer.tsx
│   │   ├── screens/            # Screen components
│   │   │   ├── auth/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── SignUpScreen.tsx
│   │   │   │   └── LoginScreen.tsx
│   │   │   ├── feed/
│   │   │   │   ├── FeedScreen.tsx
│   │   │   │   └── StoryDetailScreen.tsx
│   │   │   ├── donation/
│   │   │   │   ├── DonationFlowScreen.tsx
│   │   │   │   └── SuccessScreen.tsx
│   │   │   ├── profile/
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── DonationsListScreen.tsx
│   │   │   └── onboarding/
│   │   │       └── OnboardingCarousel.tsx
│   │   ├── navigation/         # Navigation config
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthStack.tsx
│   │   │   └── MainTabs.tsx
│   │   ├── stores/             # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── storyStore.ts
│   │   │   └── donationStore.ts
│   │   ├── services/           # API calls, Firebase
│   │   │   ├── firebase.ts
│   │   │   ├── stripe.ts
│   │   │   └── api.ts
│   │   ├── utils/              # Helper functions
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   ├── constants/          # Config, colors, strings
│   │   │   ├── colors.ts
│   │   │   ├── config.ts
│   │   │   └── strings.ts
│   │   └── types/              # TypeScript types
│   │       ├── user.ts
│   │       ├── story.ts
│   │       └── donation.ts
│   ├── assets/                 # Images, fonts
│   ├── app.json                # Expo config
│   ├── package.json
│   └── tsconfig.json
│
├── dashboard/                  # Next.js admin dashboard (web)
│   ├── src/
│   │   ├── app/                # Next.js app directory
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── stories/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   ├── donations/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   └── api/
│   │   │       └── auth/[...nextauth].ts
│   │   ├── components/         # React components
│   │   │   ├── StoryForm.tsx
│   │   │   ├── DonationTable.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── lib/                # Utilities, Firebase admin
│   │   │   ├── firebase-admin.ts
│   │   │   └── utils.ts
│   │   └── types/              # TypeScript types
│   │       └── index.ts
│   ├── public/                 # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts            # Function exports
│   │   ├── payments/           # Payment-related functions
│   │   │   ├── createPaymentIntent.ts
│   │   │   └── handleWebhook.ts
│   │   ├── receipts/           # Receipt generation
│   │   │   └── generateReceipt.ts
│   │   ├── emails/             # Email functions
│   │   │   └── sendReceiptEmail.ts
│   │   └── utils/              # Shared utilities
│   │       └── validation.ts
│   ├── package.json
│   └── tsconfig.json
│
├── firebase/                   # Firebase config
│   ├── firestore.rules         # Security rules
│   ├── firestore.indexes.json  # Database indexes
│   └── firebase.json           # Firebase config
│
├── shared/                     # Shared types/utils (monorepo style)
│   └── types/
│       ├── user.ts
│       ├── story.ts
│       ├── donation.ts
│       └── ngo.ts
│
└── README.md
```

**Structure Decision**: Selected Mobile + Web option due to:

1. **React Native mobile app** required for iOS/Android donor experience (FR-001, FR-002)
2. **Next.js web dashboard** required for NGO admin story management (FR-006)
3. **Firebase Cloud Functions** required for secure payment processing and receipt generation (FR-004, FR-005)
4. **Shared types** folder enables code reuse between mobile/web/functions without duplication

This structure keeps mobile, web, and serverless concerns separated while sharing TypeScript type definitions for consistency.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected**. All constitution principles are satisfied by the proposed architecture.
