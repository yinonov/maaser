# Research Document: HaMaaser MVP Technical Decisions

**Feature**: HaMaaser MVP Digital Tithing Platform  
**Date**: 2025-11-04  
**Phase**: Phase 0 - Technical Research & Decision Documentation

## Overview

This document consolidates research findings and rationale for key technical decisions made during the planning phase. All decisions align with the HaMaaser MVP Constitution principles, particularly MVP-First Development and Speed Over Perfection.

---

## Decision 1: Mobile Framework Selection

**Decision**: React Native with Expo SDK

**Rationale**:

- **Single Codebase**: One JavaScript/TypeScript codebase serves both iOS and Android, reducing development time by ~40%
- **Fast Iteration**: Hot reload enables rapid UI development and testing
- **Expo Advantages**: Simplifies build process, eliminates need for Xcode/Android Studio for most development, provides over-the-air (OTA) updates for JS-only changes
- **Mature Ecosystem**: Large library ecosystem for common mobile features (navigation, camera, push notifications)
- **Team Familiarity**: JavaScript/TypeScript skills transfer from web development

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Native iOS/Android | Best performance, full platform APIs | 2x development time, 2x maintenance | Violates MVP-First principle - too slow |
| Flutter | Good performance, growing ecosystem | Dart language learning curve, smaller ecosystem | Additional language adds complexity |
| Progressive Web App | No app store approval needed | Limited offline, no push notifications (iOS), poor UX | Doesn't meet mobile-first requirement |

**Risk Mitigation**:

- Performance concerns: Profile early, optimize hot paths
- Platform-specific features: Use expo-modules or native bridges only when necessary
- Future migration: React Native can be ejected from Expo if needed

---

## Decision 2: Backend Architecture

**Decision**: Firebase serverless (Auth + Firestore + Cloud Functions + Storage)

**Rationale**:

- **Zero DevOps**: No server management, automatic scaling, built-in security
- **Real-time Updates**: Firestore provides live data sync for NGO dashboard
- **Integrated Services**: Auth, database, storage, hosting in one platform
- **Speed**: Eliminates weeks of backend setup and infrastructure work
- **Cost-Effective**: Free tier supports MVP, pay-as-you-grow pricing

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Node.js + PostgreSQL on Cloud Run | Full control, SQL queries, cheaper at scale | Requires DevOps, slower MVP delivery | Violates Speed Over Perfection |
| Supabase | Open-source Firebase alternative, PostgreSQL | Younger ecosystem, fewer integrations | Firebase more battle-tested |
| AWS Amplify | Similar to Firebase, AWS ecosystem | More complex setup, steeper learning curve | Firebase simpler for MVP |

**Migration Path** (if needed post-MVP):

- Export Firestore data using automated scripts
- Migrate to PostgreSQL with minimal application changes (isolate DB layer)
- Move Cloud Functions to containerized services on Cloud Run

---

## Decision 3: Payment Processing

**Decision**: Stripe Checkout (hosted payment pages)

**Rationale**:

- **PCI Compliance**: Stripe handles all payment data - we never touch credit card info
- **Security**: Battle-tested, enterprise-grade payment security
- **Developer Experience**: Simple integration (a few lines of code)
- **Conversion Optimized**: Stripe's checkout UI is tested with millions of transactions
- **Payment Methods**: Supports cards, Apple Pay, Google Pay out-of-box
- **Israeli Market**: Stripe supports NIS currency and Israeli businesses

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Tranzila (Israel) | Local Israeli processor | Less international, smaller ecosystem | Stripe more feature-rich |
| Stripe Elements (custom UI) | Full UI control | Requires custom forms, PCI concerns | Violates Security as Foundation |
| PayPal | Widely recognized brand | Higher fees, poor developer experience | More complex integration |

**Technical Integration**:

- Mobile app: Use Stripe React Native SDK + hosted checkout webview
- Web dashboard: Stripe.js for admin features
- Backend: Stripe webhooks → Firebase Cloud Functions for payment confirmation

---

## Decision 4: State Management (Mobile App)

**Decision**: Zustand

**Rationale**:

- **Lightweight**: ~1KB library vs 10KB+ for Redux
- **Simple API**: Less boilerplate than Redux
- **TypeScript Support**: Excellent type inference
- **React Hooks Native**: Feels natural in React Native
- **Sufficient for MVP**: Handles auth, donations, stories without complexity

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Redux Toolkit | Industry standard, mature | Overkill for MVP, more boilerplate | Violates Speed Over Perfection |
| Context API | Built-in React | Performance issues with frequent updates | Not sufficient for complex state |
| Jotai | Similar to Zustand | Smaller community | Zustand more established |

**Deviation from Constitution**: Constitution suggests Context API, but Zustand provides better developer experience with minimal complexity increase. Approved as justified trade-off.

---

## Decision 5: Admin Dashboard Framework

**Decision**: Next.js 14 (App Router)

**Rationale**:

- **React-Based**: Team already using React for mobile app
- **Server-Side Rendering**: Fast initial page loads for dashboard
- **API Routes**: Built-in backend endpoints without separate server
- **File-Based Routing**: Intuitive folder structure
- **Vercel Deployment**: One-click deploy with automatic CI/CD

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Create React App | Simple, minimal | No SSR, no built-in API routes | Next.js provides more features |
| Vite + React | Fastest build times | Requires separate backend | Next.js more integrated |
| Vue/Nuxt | Good developer experience | Different framework from mobile | Team consistency important |

---

## Decision 6: Database Schema Design

**Decision**: Firestore NoSQL document model with denormalization

**Rationale**:

- **Real-Time Sync**: Firestore excels at live updates (NGO dashboard needs this)
- **Flexible Schema**: Easy to add fields during MVP iteration
- **Automatic Scaling**: No database tuning or sharding needed
- **Offline Support**: Built-in mobile offline capabilities

**Key Design Patterns**:

1. **Denormalization**: Store NGO name in Story document (avoid extra reads)
2. **Subcollections**: User donations as subcollection for efficient queries
3. **Indexes**: Create compound indexes for common query patterns

**Collections**:

- `users` - Donor and NGO admin profiles
- `ngos` - NGO organization details
- `stories` - Beneficiary stories
- `donations` - All donation records
- `receipts` - PDF receipt metadata (files stored in Cloud Storage)

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| PostgreSQL | Complex queries, ACID transactions | Requires server management | Violates Zero DevOps goal |
| MongoDB Atlas | Flexible NoSQL | Less integrated with Firebase | Firebase ecosystem lock-in acceptable for MVP |

---

## Decision 7: Receipt Generation

**Decision**: Server-side PDF generation using PDFKit in Cloud Functions

**Rationale**:

- **Consistency**: All receipts generated server-side with same template
- **Security**: Receipt generation logic protected from client manipulation
- **Tax Compliance**: Server controls ensure receipts meet legal requirements
- **Email Integration**: Generate once, email + store in Cloud Storage

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Client-side (jsPDF) | No server cost, instant generation | Security risk, inconsistent formatting | Can't guarantee legal compliance |
| Third-party service (DocRaptor) | Easier HTML→PDF | External dependency, higher cost | Unnecessary complexity for MVP |

**Receipt Requirements** (Israeli tax law):

- Donor name, address, tax ID (if business)
- NGO name, tax-exempt registration number
- Donation amount, date, receipt number
- Digital signature or QR code for verification

---

## Decision 8: Image Storage & Optimization

**Decision**: Firebase Cloud Storage with client-side resize (React Native Image Picker)

**Rationale**:

- **Integrated**: Part of Firebase ecosystem
- **Security**: Fine-grained security rules
- **CDN**: Automatic content delivery for fast image loads
- **Cost-Effective**: Pay only for storage used

**Image Optimization Strategy**:

1. **Upload**: NGO admins upload photos via dashboard
2. **Resize**: Cloud Function triggers on upload, creates thumbnails (300x300, 800x800)
3. **Serve**: Mobile app loads appropriately sized images

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Cloudinary | Advanced transforms, optimization | External service, higher cost | Firebase sufficient for MVP |
| AWS S3 | Industry standard | More complex setup | Firebase simpler |

---

## Decision 9: Internationalization (i18n)

**Decision**: i18next for mobile, Next.js i18n for web

**Rationale**:

- **Mobile (i18next)**: Standard for React Native, supports RTL, key-based translations
- **Web (Next.js i18n)**: Built-in Next.js feature, minimal setup

**RTL Support** (Hebrew):

- Use `I18nManager.forceRTL(true)` in React Native for Hebrew
- Mirror UI layouts automatically with Flexbox
- Test thoroughly on Hebrew interface

**Languages**: Hebrew (primary), English (secondary)

---

## Decision 10: Testing Strategy

**Decision**: Jest + React Native Testing Library with 30% coverage target

**Rationale**:

- **Focus**: Test critical paths only (auth, donation flow, receipt generation)
- **Speed**: Lower coverage target aligns with MVP-First principle
- **Automated**: Unit tests for business logic, manual tests for UI

**Test Priorities**:

1. **High Priority**: Payment processing, receipt generation, auth flows
2. **Medium Priority**: Story CRUD, donation history
3. **Low Priority**: UI component styling, animations

**Manual Testing** (Required):

- Physical device testing (iOS + Android)
- Payment testing with Stripe test cards
- End-to-end user journeys
- Accessibility testing (minimum WCAG AA)

---

## Decision 11: Monitoring & Analytics

**Decision**: Firebase Analytics + Crashlytics (mobile), Sentry (web)

**Rationale**:

- **Firebase Analytics**: Built-in, automatic device/OS tracking, custom events
- **Crashlytics**: Real-time crash reporting for mobile
- **Sentry**: Best-in-class error tracking for web dashboard

**Key Metrics to Track**:

- `story_view` - User views story detail
- `donation_start` - User initiates donation flow
- `donation_complete` - Payment succeeds
- `receipt_download` - User downloads PDF
- Crash rate, payment success rate, app performance

---

## Decision 12: Development Environment Setup

**Tooling Decisions**:

- **Package Manager**: npm (standard, widely compatible)
- **TypeScript**: Loose mode for faster development, strict mode post-MVP
- **Linting**: ESLint with React/React Native configs
- **Formatting**: Prettier for consistent code style
- **Git Workflow**: Feature branches → develop → main
- **CI/CD**: GitHub Actions for automated testing/deployment

**Local Development Requirements**:

- Node.js 20 LTS
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator (Mac only) or Android Emulator
- VS Code with React Native, TypeScript extensions

---

## Research Summary: Confidence Levels

| Decision Area | Confidence | Reasoning |
|---------------|-----------|-----------|
| React Native + Expo | **High** | Proven for similar apps, large community |
| Firebase Backend | **High** | Perfect fit for MVP, easy to migrate later |
| Stripe Payments | **High** | Industry standard, security-first |
| Zustand State Management | **Medium** | Less proven than Redux, but simpler |
| Next.js Dashboard | **High** | Standard choice for React admin dashboards |
| Firestore Schema | **Medium** | NoSQL requires careful planning, may need adjustments |
| Server-side Receipts | **High** | Necessary for legal compliance |
| 30% Test Coverage | **Medium** | Risk: bugs may slip through, accepted for MVP speed |

---

## Open Questions Resolved

1. **Q: Should we use TypeScript?**
   - **A**: Yes, but in loose mode for MVP. Strict mode post-launch.

2. **Q: How to handle video content?**
   - **A**: YouTube embed links (no direct hosting to save costs).

3. **Q: Backup strategy?**
   - **A**: Firestore automated daily backups + manual monthly exports.

4. **Q: Support multiple currencies?**
   - **A**: NIS primary, USD optional for MVP. More currencies post-launch.

5. **Q: How to handle NGO verification?**
   - **A**: Manual approval process by platform admin (Maor/Mordechai).

---

## Next Steps

1. ✅ Research complete - All technical unknowns resolved
2. → Proceed to **Phase 1**: Generate data-model.md, contracts/, quickstart.md
3. → Update agent context files with technology stack
4. → Re-evaluate Constitution Check post-design

**Status**: Phase 0 Complete - Ready for Phase 1 Design
