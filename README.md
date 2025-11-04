# HaMaaser MVP - Digital Tithing Platform

A mobile-first donation platform connecting donors with NGO beneficiary stories through a social-media-style feed.

## 📋 Project Overview

**Status**: Phase 1 Complete - Ready for Firebase Setup  
**Tech Stack**: React Native, Expo, Next.js, Firebase, Stripe  
**Timeline**: 12-week MVP delivery

### Core Features (MVP Scope)

- ✅ User authentication (Email/Google OAuth)
- ✅ Story browsing feed (infinite scroll)
- ✅ One-tap donations via Stripe Checkout
- ✅ Automated PDF receipt generation
- ✅ NGO admin dashboard for story management

## 🏗️ Project Structure

```
hamaaser/
├── mobile/                  # React Native Expo app (iOS + Android)
├── dashboard/               # Next.js admin dashboard (web)
├── functions/               # Firebase Cloud Functions (serverless)
├── firebase/                # Firebase config (rules, indexes)
├── shared/types/            # Shared TypeScript types
├── specs/                   # Feature specifications
│   └── 001-mvp-platform-spec/
│       ├── spec.md          # Requirements
│       ├── plan.md          # Implementation plan
│       ├── tasks.md         # Task breakdown
│       ├── data-model.md    # Database schema
│       └── contracts/       # API specifications
└── example pages/           # UI design mockups (HTML prototypes)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account with active project

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/yinonov/maaser.git
   cd maaser
   npm run install:all
   ```

2. **Configure environment variables**:
   ```bash
   # Mobile app
   cp mobile/.env.example mobile/.env
   # Edit mobile/.env with your Firebase config

   # Dashboard
   cp dashboard/.env.local.example dashboard/.env.local
   # Edit dashboard/.env.local with Firebase Admin SDK credentials

   # Cloud Functions
   cp functions/.env.example functions/.env
   # Edit functions/.env with Stripe and SendGrid keys
   ```

3. **Start development**:
   ```bash
   # Mobile app (in terminal 1)
   npm run mobile

   # Dashboard (in terminal 2)
   npm run dashboard

   # Cloud Functions (in terminal 3)
   npm run functions
   ```

### Firebase Setup

See [quickstart.md](specs/001-mvp-platform-spec/quickstart.md) for detailed Firebase configuration (30-45 min setup time).

## 📱 Mobile App

**Tech**: React Native 0.74, Expo SDK 51, TypeScript  
**Features**: Auth, Story Feed, Donation Flow, Receipt Viewer  
**Platforms**: iOS 15+, Android 8+

```bash
cd mobile
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
```

## 🌐 Dashboard

**Tech**: Next.js 14, Tailwind CSS, NextAuth.js  
**Features**: NGO Story Management, Donation Tracking, Admin Approval  
**Access**: Web browsers (Chrome, Safari, Firefox)

```bash
cd dashboard
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
```

## ☁️ Cloud Functions

**Tech**: Firebase Functions, Node.js 20, TypeScript  
**Features**: Payment Processing, Receipt Generation, Email Notifications  
**Runtime**: Serverless (Firebase)

```bash
cd functions
npm run serve       # Start local emulator
npm run build       # Compile TypeScript
npm run deploy      # Deploy to Firebase
```

## 🔐 Security

- **Payments**: Stripe Checkout (PCI DSS compliant)
- **Authentication**: Firebase Auth (enterprise-grade)
- **Database**: Firestore with security rules
- **API**: Cloud Functions with validation & rate limiting

## 📊 Development Status

### Phase 1: Setup ✅ (Complete)
- [x] Monorepo structure
- [x] Mobile app scaffold
- [x] Dashboard scaffold
- [x] Cloud Functions scaffold
- [x] Firebase configuration
- [x] Environment templates

### Phase 2: Foundational (Next)
- [ ] Firebase project creation
- [ ] Firestore security rules
- [ ] Shared TypeScript types
- [ ] Mobile app foundation
- [ ] Dashboard foundation
- [ ] Cloud Functions foundation

### Phase 3: User Story 1 - MVP Core (Target)
- [ ] Authentication screens
- [ ] Story feed & detail
- [ ] Donation flow
- [ ] Payment processing
- [ ] Receipt generation

## 📖 Documentation

- **[Specification](specs/001-mvp-platform-spec/spec.md)**: Feature requirements & user stories
- **[Implementation Plan](specs/001-mvp-platform-spec/plan.md)**: Technical architecture & decisions
- **[Task Breakdown](specs/001-mvp-platform-spec/tasks.md)**: 257 implementation tasks
- **[Data Model](specs/001-mvp-platform-spec/data-model.md)**: Firestore schema & security rules
- **[API Contracts](specs/001-mvp-platform-spec/contracts/)**: Payment, Story, User APIs
- **[Quickstart Guide](specs/001-mvp-platform-spec/quickstart.md)**: Developer onboarding
- **[Design Reference](specs/001-mvp-platform-spec/design-reference.md)**: Design system guide

## 🧪 Testing

**Target**: 30% code coverage (MVP acceptable)  
**Framework**: Jest + React Native Testing Library

```bash
npm test            # Run all tests
```

## 📜 Scripts

```bash
# Development
npm run mobile              # Start mobile dev server
npm run mobile:ios          # Run iOS app
npm run mobile:android      # Run Android app
npm run dashboard           # Start dashboard dev server
npm run functions           # Start functions emulator

# Production
npm run dashboard:build     # Build dashboard for production
npm run functions:deploy    # Deploy functions to Firebase

# Maintenance
npm run install:all         # Install all dependencies
npm run lint                # Lint all packages
```

## 🤝 Contributing

This is an MVP project following strict specifications. See [tasks.md](specs/001-mvp-platform-spec/tasks.md) for implementation checklist.

### Constitution Principles

1. **MVP-First**: Ship functional software fast
2. **Security as Foundation**: PCI compliance via Stripe
3. **Real Data Only**: No synthetic content
4. **Lean Scope**: Essential features only
5. **Speed Over Perfection**: 30% test coverage acceptable

See [constitution.md](.specify/memory/constitution.md) for full principles.

## 📄 License

MIT License - See LICENSE file

## 🔗 Resources

- **Firebase Console**: https://console.firebase.google.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Expo Documentation**: https://docs.expo.dev
- **Next.js Documentation**: https://nextjs.org/docs

---

**Last Updated**: 2025-11-04  
**Phase**: 1 - Setup Complete ✅  
**Next Milestone**: Firebase Project Creation (Phase 2)
