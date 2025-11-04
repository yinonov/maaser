# HaMaaser Developer Quickstart Guide

**Last Updated**: 2025-11-04  
**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or later ([Download](https://nodejs.org/))
- **npm**: v10.x or later (included with Node.js)
- **Git**: v2.x or later ([Download](https://git-scm.com/))
- **VS Code**: Latest version (recommended) with extensions:
  - ESLint
  - Prettier
  - React Native Tools
  - Firebase Explorer
- **iOS Simulator** (macOS only): Xcode 15+ with iOS 17+ simulator
- **Android Emulator**: Android Studio with API 33+

**Accounts Required**:

- Firebase account ([Create free account](https://firebase.google.com/))
- Stripe account ([Create account](https://stripe.com/))
- Expo account ([Create free account](https://expo.dev/))

---

## 1. Clone Repository

```bash
git clone https://github.com/your-org/hamaaser.git
cd hamaaser
```

---

## 2. Install Dependencies

Install root dependencies and all workspace packages:

```bash
npm install
```

This will install dependencies for:

- `/mobile` - React Native Expo app
- `/dashboard` - Next.js admin dashboard
- `/functions` - Firebase Cloud Functions
- `/shared` - Shared TypeScript types

**Verify Installation**:

```bash
npm run verify
```

Expected output:

```
✓ Node.js version: 20.x.x
✓ npm version: 10.x.x
✓ Expo CLI installed
✓ Firebase CLI installed
✓ All workspace packages installed
```

---

## 3. Firebase Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `hamaaser-dev`
4. Enable Google Analytics (optional for dev)
5. Click **"Create project"**

### 3.2 Enable Services

In Firebase Console:

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password**
   - Click **Save**

2. **Firestore Database**:
   - Go to Firestore Database
   - Click **Create database**
   - Select **Test mode** (we'll add security rules later)
   - Choose location: `us-central1`
   - Click **Enable**

3. **Cloud Storage**:
   - Go to Storage
   - Click **Get started**
   - Select **Test mode**
   - Choose location: `us-central1`
   - Click **Done**

4. **Cloud Functions**:
   - Go to Functions
   - Click **Get started** (auto-enabled)

### 3.3 Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click **Web** (</> icon)
4. Register app name: `hamaaser-web`
5. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "hamaaser-dev.firebaseapp.com",
  projectId: "hamaaser-dev",
  storageBucket: "hamaaser-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Repeat for **iOS** and **Android** apps (register in Firebase Console)

### 3.4 Firebase CLI Login

```bash
# Install Firebase CLI globally (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select your Firebase project
firebase use hamaaser-dev
```

---

## 4. Environment Configuration

### 4.1 Mobile App (.env)

Create `/mobile/.env`:

```bash
# Firebase Config
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hamaaser-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hamaaser-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hamaaser-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Stripe Config (use test keys)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# API Base URL (for local development)
EXPO_PUBLIC_API_URL=http://localhost:5001/hamaaser-dev/us-central1

# Environment
EXPO_PUBLIC_ENV=development
```

**Get Stripe Test Keys**:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** → **API keys**
3. Copy **Publishable key** (pk_test_...)
4. Copy **Secret key** (sk_test_...) for functions

### 4.2 Cloud Functions (.env)

Create `/functions/.env`:

```bash
# Stripe Config
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # (Will generate in step 6)

# SendGrid Config (for email receipts)
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=receipts@hamaaser.org

# Environment
NODE_ENV=development
```

**Get SendGrid API Key**:

1. Create account at [SendGrid](https://sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Create new API key with **Mail Send** permissions
4. Copy key (starts with `SG.`)

### 4.3 Dashboard (.env.local)

Create `/dashboard/.env.local`:

```bash
# Firebase Admin (for server-side)
FIREBASE_PROJECT_ID=hamaaser-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@hamaaser-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Next.js Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hamaaser-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hamaaser-dev

# Environment
NEXT_PUBLIC_ENV=development
```

**Get Firebase Admin SDK Key**:

1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Copy `project_id`, `client_email`, `private_key` to `.env.local`

---

## 5. Deploy Security Rules

Deploy Firestore security rules and indexes:

```bash
# From /firebase directory
cd firebase
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

**Verify Deployment**:

```bash
firebase firestore:indexes
```

Expected output:

```
✓ stories_status_published (status ASC, publishedAt DESC)
✓ donations_donor_date (donorId ASC, donatedAt DESC)
✓ stories_ngo_created (ngoId ASC, createdAt DESC)
```

---

## 6. Seed Test Data

Seed Firebase with test data (NGOs, stories, users):

```bash
npm run seed:dev
```

This creates:

- **3 Test NGOs**: Moshe Kato Foundation, Yad Sarah, Leket Israel
- **5 Test Stories**: Medical, education, housing needs
- **2 Test Users**:
  - Donor: `test.donor@hamaaser.org` / `TestPass123!`
  - NGO Admin: `test.ngo@hamaaser.org` / `TestPass123!`

**Verify in Firestore**:

```bash
firebase firestore:query "SELECT * FROM stories LIMIT 5"
```

---

## 7. Run Mobile App

### 7.1 Start Expo Development Server

```bash
cd mobile
npm start
```

This opens Expo DevTools at `http://localhost:8081`.

### 7.2 Run on iOS Simulator (macOS only)

Press `i` in terminal, or:

```bash
npm run ios
```

### 7.3 Run on Android Emulator

Press `a` in terminal, or:

```bash
npm run android
```

### 7.4 Run on Physical Device

1. Install **Expo Go** app from App Store / Google Play
2. Scan QR code from terminal
3. App loads on device

**Expected Result**:

- App launches in 2-3 seconds
- See story feed with 5 test stories
- Can navigate to story details
- Login with `test.donor@hamaaser.org` / `TestPass123!`

---

## 8. Run Dashboard (Web Admin)

### 8.1 Start Next.js Development Server

```bash
cd dashboard
npm run dev
```

Server starts at `http://localhost:3000`.

### 8.2 Test Admin Login

1. Open `http://localhost:3000`
2. Click **"Login"**
3. Use test NGO admin credentials:
   - Email: `test.ngo@hamaaser.org`
   - Password: `TestPass123!`
4. Should see NGO dashboard with story management

**Expected Result**:

- Dashboard loads in <2 seconds
- See list of stories for NGO
- Can create new story
- Can upload images

---

## 9. Run Cloud Functions Locally

### 9.1 Start Firebase Emulator

```bash
cd functions
npm run serve
```

This starts:

- **Firestore Emulator**: `http://localhost:8080`
- **Auth Emulator**: `http://localhost:9099`
- **Functions Emulator**: `http://localhost:5001`
- **Emulator UI**: `http://localhost:4000`

### 9.2 Test Payment Function

```bash
curl -X POST http://localhost:5001/hamaaser-dev/us-central1/createPaymentIntent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_firebase_token>" \
  -d '{
    "amount": 500000,
    "storyId": "story_sarah_medical",
    "currency": "ILS"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_3xyz_secret_abc",
    "paymentIntentId": "pi_3xyz"
  }
}
```

---

## 10. Test Stripe Webhook

### 10.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows/Linux
# Download from https://stripe.com/docs/stripe-cli
```

### 10.2 Login to Stripe

```bash
stripe login
```

### 10.3 Forward Webhooks to Local Functions

```bash
stripe listen --forward-to http://localhost:5001/hamaaser-dev/us-central1/handleStripeWebhook
```

This generates a webhook signing secret (starts with `whsec_`).

**Copy to `/functions/.env`**:

```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...
```

### 10.4 Test Payment Flow

1. In mobile app, tap **"Donate"** on story
2. Enter amount: 100₪
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `123`
5. Complete payment

**Expected Result**:

- Payment succeeds on Stripe
- Webhook fires to local function
- Donation record created in Firestore
- Receipt PDF generated and stored
- Email receipt sent (if SendGrid configured)

**Verify in Firestore**:

```bash
firebase firestore:query "SELECT * FROM donations WHERE status = 'completed'"
```

---

## 11. Run Tests

### 11.1 Mobile Tests

```bash
cd mobile
npm test
```

Runs Jest tests for:

- Components (UI)
- Hooks (state management)
- Utils (formatting, validation)

### 11.2 Functions Tests

```bash
cd functions
npm test
```

Tests Cloud Functions with emulators.

### 11.3 E2E Tests (Detox - Optional)

```bash
cd mobile
npm run test:e2e:ios
```

---

## 12. Make Your First Code Change

Let's add a debug indicator to the mobile app:

### 12.1 Edit Story Card Component

Open `/mobile/src/components/StoryCard.tsx`:

```typescript
// Add after imports
const isDev = __DEV__;

// Add in JSX (inside View)
{isDev && (
  <Text style={{ color: 'red', fontSize: 10 }}>
    [DEV MODE]
  </Text>
)}
```

### 12.2 Hot Reload

Save file. App reloads automatically. You'll see `[DEV MODE]` on story cards.

### 12.3 Commit Changes

```bash
git add mobile/src/components/StoryCard.tsx
git commit -m "Add dev mode indicator to story cards"
git push origin feature/your-feature-name
```

---

## 13. Useful Commands

### Development

```bash
# Run all services (mobile + dashboard + functions)
npm run dev:all

# Run mobile app
npm run mobile

# Run dashboard
npm run dashboard

# Run functions locally
npm run functions:serve

# Seed test data
npm run seed:dev
```

### Testing

```bash
# Run all tests
npm test

# Run mobile tests with coverage
npm run test:mobile:coverage

# Run functions tests
npm run test:functions

# E2E tests (iOS)
npm run test:e2e:ios
```

### Linting & Formatting

```bash
# Lint all code
npm run lint

# Fix lint issues
npm run lint:fix

# Format with Prettier
npm run format
```

### Firebase

```bash
# Deploy all Firebase services
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# View Firestore data
firebase firestore:query "SELECT * FROM stories"

# View Cloud Functions logs
firebase functions:log
```

---

## 14. Common Issues

### Issue: "Firebase not initialized"

**Solution**: Check `/mobile/.env` has correct Firebase config.

```bash
# Verify environment variables loaded
npx expo config --type introspect | grep FIREBASE
```

### Issue: "Stripe payment fails with 'Invalid API key'"

**Solution**: Ensure you're using **test keys** (starts with `pk_test_` and `sk_test_`).

### Issue: "Module not found"

**Solution**: Clear cache and reinstall:

```bash
npm run clean
npm install
```

### Issue: "Firestore permission denied"

**Solution**: Deploy security rules:

```bash
cd firebase
firebase deploy --only firestore:rules
```

### Issue: "Expo Go app shows 'Network error'"

**Solution**: Ensure mobile device and dev machine are on same WiFi.

---

## 15. Next Steps

- **Read the Spec**: See `/specs/001-mvp-platform-spec/spec.md` for full requirements
- **Review Design Mockups**: See `/example pages/*.html` for high-fidelity UI prototypes (Google Stitch)
  - `home.html` - Story feed with infinite scroll
  - `registration-login.html` - Auth flow with social login
  - `dontation.html` - Donation flow with amount selection
  - `invoice.html` - Receipt generation interface
  - `business-payment-setup.html` - NGO payment settings
- **Review Data Model**: See `/specs/001-mvp-platform-spec/data-model.md` for Firestore schema
- **API Contracts**: See `/specs/001-mvp-platform-spec/contracts/` for all API endpoints
- **Check Tasks**: See `/specs/001-mvp-platform-spec/tasks.md` for task breakdown
- **Join Team**: Ask team lead for Slack invite and Firebase project access

---

## 16. Project Structure

```
hamaaser/
├── mobile/                 # React Native Expo app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation config
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # Firebase services
│   │   └── utils/          # Helper functions
│   ├── app.json            # Expo config
│   └── package.json
│
├── dashboard/              # Next.js admin dashboard
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── lib/                # Firebase Admin, utils
│   └── package.json
│
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   ├── payment/        # Payment handlers
│   │   ├── receipts/       # Receipt generation
│   │   ├── triggers/       # Firestore triggers
│   │   └── index.ts        # Function exports
│   └── package.json
│
├── shared/                 # Shared TypeScript types
│   ├── types/              # Interface definitions
│   └── package.json
│
├── firebase/               # Firebase config
│   ├── firestore.rules     # Security rules
│   ├── firestore.indexes   # Composite indexes
│   ├── storage.rules       # Storage rules
│   └── firebase.json       # Firebase config
│
└── specs/                  # Project specifications
    └── 001-mvp-platform-spec/
        ├── spec.md         # Feature requirements
        ├── plan.md         # Implementation plan
        ├── data-model.md   # Database schema
        ├── contracts/      # API contracts
        └── tasks.md        # Task breakdown
```

---

## 17. Development Workflow

1. **Pick a Task**: From `/specs/001-mvp-platform-spec/tasks.md`
2. **Create Branch**: `git checkout -b feature/task-id-description`
3. **Code**: Make changes, test locally
4. **Lint**: `npm run lint:fix`
5. **Test**: `npm test`
6. **Commit**: `git commit -m "[TASK-ID] Description"`
7. **Push**: `git push origin feature/task-id-description`
8. **PR**: Create pull request on GitHub
9. **Review**: Wait for team review
10. **Merge**: Merge to `main` after approval

---

## 18. Support

- **Technical Issues**: Slack `#dev-help` channel
- **Specification Questions**: See `/specs/001-mvp-platform-spec/spec.md`
- **Firebase Issues**: Check [Firebase Status](https://status.firebase.google.com/)
- **Stripe Issues**: Check [Stripe Status](https://status.stripe.com/)

---

**Happy Coding!** 🚀
