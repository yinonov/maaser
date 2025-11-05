# Tasks: HaMaaser MVP Digital Tithing Platform

**Input**: Design documents from `/specs/001-mvp-platform-spec/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓  
**Generated**: 2025-11-04

**Tests**: Tests are OPTIONAL for MVP per constitution (30% coverage target). Test tasks included but can be deferred to polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each story is a complete, shippable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions (from plan.md)

```text
hamaaser/
├── mobile/                  # React Native Expo app
├── dashboard/               # Next.js admin dashboard
├── functions/               # Firebase Cloud Functions
├── firebase/                # Firebase config (rules, indexes)
└── shared/                  # Shared TypeScript types
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [x] T001 Create monorepo root structure with mobile/, dashboard/, functions/, firebase/, shared/ directories
- [x] T002 Initialize mobile/ with Expo SDK 51+ project: `cd mobile && npx create-expo-app@latest . --template blank-typescript`
- [x] T003 [P] Initialize dashboard/ with Next.js 14+: `cd dashboard && npx create-next-app@latest . --typescript --app --use-npm`
- [x] T004 [P] Initialize functions/ with Firebase Cloud Functions: `cd functions && firebase init functions` (Node.js 20, TypeScript)
- [x] T005 [P] Create shared/types/ directory with package.json for shared TypeScript types
- [x] T006 [P] Configure root package.json with workspace scripts (mobile, dashboard, functions commands)
- [x] T007 [P] Setup ESLint + Prettier configs in root with React Native and Next.js presets
- [x] T008 [P] Create .gitignore with node_modules/, .expo/, .next/, functions/lib/, .env* patterns
- [x] T009 Create firebase/firebase.json config file with Firestore, Functions, Storage, Hosting settings
- [x] T010 [P] Setup environment variable templates: mobile/.env.example, dashboard/.env.local.example, functions/.env.example

**Checkpoint**: ✅ Project structure initialized - ready for Firebase setup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Firebase Setup

- [x] T011 Create Firebase project via console: hamaaser-dev (development environment)
- [x] T012 Enable Firebase Authentication with Email/Password and Google OAuth providers
- [x] T013 Enable Firestore Database in us-central1 with test mode initially
- [x] T014 Enable Cloud Storage for Firebase in us-central1 with test mode
- [x] T015 Deploy Firestore security rules from firebase/firestore.rules per data-model.md
- [x] T016 Deploy Firestore indexes from firebase/firestore.indexes.json with compound indexes for stories, donations queries
- [x] T017 Deploy Storage security rules from firebase/storage.rules for user/NGO image uploads
- [ ] T018 Register iOS app bundle in Firebase console and download GoogleService-Info.plist to mobile/ios/
- [ ] T019 Register Android app package in Firebase console and download google-services.json to mobile/android/app/
- [x] T020 Register web app in Firebase console and save config to dashboard/.env.local

### Shared Types

- [x] T021 [P] Create shared/types/user.ts with User interface matching data-model.md users collection schema
- [x] T022 [P] Create shared/types/ngo.ts with NGO interface matching data-model.md ngos collection schema
- [x] T023 [P] Create shared/types/story.ts with Story interface matching data-model.md stories collection schema
- [x] T024 [P] Create shared/types/donation.ts with Donation interface matching data-model.md donations collection schema
- [x] T025 [P] Create shared/types/index.ts exporting all types for easy imports

### Mobile App Foundation

- [x] T026 Install core mobile dependencies: `firebase@10.7+, @react-navigation/native@6+, zustand@4+, expo-router@3+`
- [x] T027 Configure Firebase in mobile/src/services/firebase.ts with Firestore, Auth, Storage initialization
- [x] T028 Create mobile/src/constants/colors.ts with design system colors (#d4a373, #eebd2b, etc.) from design-reference.md
- [x] T029 Create mobile/src/constants/config.ts with environment variables (API URLs, Stripe publishable key)
- [x] T030 Setup i18next in mobile/src/services/i18n.ts with Hebrew/English support and RTL handling
- [x] T031 Configure Expo app.json with iOS bundle ID, Android package, splash screen, app icon placeholders
- [x] T032 Create mobile/src/navigation/AppNavigator.tsx with React Navigation stack structure (Auth, Main tabs)
- [x] T033 [P] Create Zustand stores: mobile/src/stores/authStore.ts for user authentication state
- [x] T034 [P] Create mobile/src/stores/storyStore.ts for stories feed state
- [x] T035 [P] Create mobile/src/stores/donationStore.ts for donation flow state

### Dashboard Foundation

- [x] T036 Install core dashboard dependencies: `firebase-admin@11+, next-auth@4+, @stripe/stripe-js@3+`
- [x] T037 Configure Firebase Admin SDK in dashboard/src/lib/firebase-admin.ts with service account credentials
- [x] T038 Setup NextAuth.js in dashboard/src/app/api/auth/[...nextauth]/route.ts with Firebase Auth provider
- [x] T039 Create dashboard layout in dashboard/src/app/(dashboard)/layout.tsx with sidebar navigation
- [x] T040 Create dashboard/src/components/Sidebar.tsx with NGO admin navigation menu (Stories, Donations, Settings)
- [x] T041 Configure Tailwind CSS in dashboard/tailwind.config.ts with design system colors from design-reference.md

### Cloud Functions Foundation

- [x] T042 Install Cloud Functions dependencies: `stripe@14+, pdfkit@0.14+, sendgrid/mail@8+`
- [x] T043 Create functions/src/utils/validation.ts with input validation helpers for API requests
- [x] T044 Create functions/src/utils/stripe.ts with Stripe client initialization using secret key from env
- [x] T045 Configure CORS in functions/src/index.ts to allow requests from mobile app and dashboard origins
- [x] T046 Setup error handling middleware in functions/src/utils/errorHandler.ts for consistent API error responses
- [x] T047 Create functions/src/utils/logger.ts with structured logging for Cloud Functions (info, error, audit levels)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Donor Discovery and First Donation (Priority: P1) 🎯 MVP

**Goal**: Enable donors to discover stories, signup/login, and complete their first donation with receipt

**Independent Test**: Install app → Sign up with email → Browse 3+ stories → Select story → Donate 50₪ → Receive receipt email within 5 min

### Mobile: Authentication (US1)

- [x] T048 [P] [US1] Create mobile/src/screens/auth/WelcomeScreen.tsx with "Sign Up" and "Login" buttons per registration-login.html
- [x] T049 [P] [US1] Create mobile/src/screens/auth/SignUpScreen.tsx with email, password, full name fields and Google OAuth button
- [x] T050 [P] [US1] Create mobile/src/screens/auth/LoginScreen.tsx with email, password fields and "Forgot Password" link
- [x] T051 [US1] Implement Firebase email/password registration in mobile/src/services/auth.ts with email verification trigger
- [x] T052 [US1] Implement Firebase Google OAuth in mobile/src/services/auth.ts using expo-auth-session for native sign-in
- [x] T053 [US1] Create Firestore user document on registration in mobile/src/services/auth.ts writing to users collection per data-model.md
- [x] T054 [US1] Add auth state listener in mobile/src/stores/authStore.ts to persist login across app restarts
- [x] T055 [US1] Implement email verification check in mobile/src/screens/auth/VerifyEmailScreen.tsx with resend button

### Mobile: Story Feed (US1)

- [x] T056 [P] [US1] Create mobile/src/screens/feed/FeedScreen.tsx with FlatList for infinite scroll story feed per home.html
- [x] T057 [P] [US1] Create mobile/src/components/StoryCard.tsx with thumbnail, title, short description, progress bar, donate button
- [x] T058 [US1] Implement Firestore query in mobile/src/services/storyService.ts: GET active stories ordered by publishedAt desc with limit 10
- [x] T059 [US1] Add pagination to FeedScreen in mobile/src/screens/feed/FeedScreen.tsx using onEndReached with offset incrementing
- [x] T060 [US1] Implement pull-to-refresh in FeedScreen in mobile/src/screens/feed/FeedScreen.tsx to reload latest stories
- [x] T061 [US1] Add story detail navigation on StoryCard tap in mobile/src/components/StoryCard.tsx routing to StoryDetailScreen

### Mobile: Story Detail (US1)

- [x] T062 [P] [US1] Create mobile/src/screens/feed/StoryDetailScreen.tsx with hero image, full description, photo gallery, progress bar
- [x] T063 [US1] Implement Firestore document read in mobile/src/services/storyService.ts: GET /stories/:storyId with denormalized NGO data
- [x] T064 [US1] Display donation progress in StoryDetailScreen calculating percentage: (raisedAmount / goalAmount) * 100
- [x] T065 [US1] Add scrollable image gallery in StoryDetailScreen using horizontal FlatList for story.images array
- [x] T066 [US1] Display NGO information section in StoryDetailScreen with NGO logo, name, verified badge from denormalized fields
- [x] T067 [US1] Add "Donate Now" button in StoryDetailScreen navigating to DonationFlowScreen with storyId parameter

### Mobile: Donation Flow (US1)

- [x] T068 [P] [US1] Create mobile/src/screens/donation/DonationFlowScreen.tsx with amount selection, message input per dontation.html
- [x] T069 [US1] Add preset amount buttons in DonationFlowScreen (18₪, 50₪, 100₪) with active state styling
- [x] T070 [US1] Add custom amount input in DonationFlowScreen with numeric keyboard and validation (min 5₪)
- [x] T071 [US1] Display fee breakdown in DonationFlowScreen: "98₪ to NGO + 2₪ platform fee" with 2% calculation
- [x] T072 [US1] Add optional message textarea in DonationFlowScreen (max 500 chars) and anonymous toggle checkbox
- [x] T073 [US1] Implement Stripe payment intent creation in mobile/src/services/paymentService.ts calling Cloud Function createPaymentIntent
- [x] T074 [US1] Integrate @stripe/stripe-react-native in DonationFlowScreen opening Stripe Checkout webview with clientSecret
- [x] T075 [US1] Handle payment success callback in DonationFlowScreen navigating to SuccessScreen with donationId
- [x] T076 [US1] Handle payment failure in DonationFlowScreen showing error alert with retry option

### Mobile: Donation Success (US1)

- [x] T077 [P] [US1] Create mobile/src/screens/donation/SuccessScreen.tsx with checkmark animation, donation summary, "View Receipt" button
- [x] T078 [US1] Display donation details in SuccessScreen: amount, story title, NGO name, receipt number from donation document
- [x] T079 [US1] Add "Back to Stories" button in SuccessScreen navigating to FeedScreen with feed refresh
- [x] T080 [US1] Add "Share" button in SuccessScreen (placeholder for future - out of scope per spec.md)

### Cloud Functions: Payment API (US1)

- [x] T081 [P] [US1] Implement functions/src/payments/createPaymentIntent.ts per contracts/payment-api.md POST /createPaymentIntent
- [x] T082 [US1] Validate request in createPaymentIntent: check storyId exists, story status is active, amount >= 500 agorot
- [x] T083 [US1] Calculate platform fee in createPaymentIntent: platformFee = Math.floor(amount * 0.02), ngoAmount = amount - platformFee
- [x] T084 [US1] Create Stripe PaymentIntent in createPaymentIntent using stripe.paymentIntents.create with amount, currency ILS
- [x] T085 [US1] Create Firestore donation document in createPaymentIntent with status pending, return donationId and clientSecret
- [x] T086 [P] [US1] Implement functions/src/payments/handleWebhook.ts per contracts/payment-api.md POST /handleStripeWebhook
- [x] T087 [US1] Verify Stripe webhook signature in handleWebhook using stripe.webhooks.constructEvent with signing secret
- [x] T088 [US1] Handle payment_intent.succeeded event in handleWebhook updating donation status to succeeded, setting paidAt timestamp
- [x] T089 [US1] Update story stats on payment success in handleWebhook: increment raisedAmount, donationCount in stories collection
- [x] T090 [US1] Update user stats on payment success in handleWebhook: increment totalDonated, donationCount in users collection
- [x] T091 [US1] Update NGO stats on payment success in handleWebhook: increment totalDonationsReceived, totalDonors in ngos collection
- [x] T092 [US1] Trigger receipt generation on payment success in handleWebhook calling generateReceipt function with donationId

### Cloud Functions: Receipt Generation (US1)

- [x] T093 [P] [US1] Implement functions/src/receipts/generateReceipt.ts per contracts/payment-api.md POST /generateReceipt
- [x] T094 [US1] Fetch donation data in generateReceipt querying donations collection with denormalized donor and NGO info
- [x] T095 [US1] Generate unique receipt number in generateReceipt: format RCP-YYYY-#####, store in donation.receiptNumber
- [x] T096 [US1] Create PDF using PDFKit in generateReceipt with Hebrew font support, layout: header (NGO logo, name), body (donor details, amount, date), footer (legal text)
- [x] T097 [US1] Upload PDF to Cloud Storage in generateReceipt: path receipts/{receiptNumber}.pdf, set public read access
- [x] T098 [US1] Update donation document in generateReceipt setting receiptUrl, receiptGenerated: true
- [x] T099 [US1] Send receipt email in generateReceipt calling sendReceiptEmail function with donor email, PDF attachment URL
- [x] T100 [P] [US1] Implement functions/src/emails/sendReceiptEmail.ts using SendGrid API to send email with PDF link
- [x] T101 [US1] Update donation document after email sent in sendReceiptEmail setting receiptSent: true, receiptSentAt timestamp

### Mobile: Testing US1 (Optional - can defer to Phase 7)

- [ ] T102 [P] [US1] Write integration test in mobile/**tests**/auth.test.ts: signup → login → verify email flow (OPTIONAL - deferred per constitution 30% coverage)
- [ ] T103 [P] [US1] Write integration test in mobile/**tests**/donation.test.ts: browse stories → select story → donate → receive receipt (OPTIONAL - deferred per constitution 30% coverage)

**Checkpoint**: USER STORY 1 COMPLETE - MVP is now functional! Can test end-to-end: signup → browse → donate → receipt

**MVP Scope**: Stop here for initial launch. Stories 2-4 are post-MVP enhancements.

---

## Phase 4: User Story 2 - NGO Story Management (Priority: P2)

**Goal**: Enable NGO admins to add and manage beneficiary stories via web dashboard

**Independent Test**: Login as NGO admin → Add new story with photos → Submit for approval → Verify pending status → (Admin approves) → Story appears in mobile feed

### Dashboard: Authentication (US2)

- [x] T104 [P] [US2] Create dashboard/src/app/(auth)/login/page.tsx with email/password form using NextAuth
- [x] T105 [US2] Configure NextAuth callbacks in dashboard/src/app/api/auth/[...nextauth]/route.ts to check user.profileType === 'ngo_admin'
- [x] T106 [US2] Add protected route middleware in dashboard/src/middleware.ts redirecting non-authenticated users to /login
- [x] T107 [US2] Create dashboard/src/app/(dashboard)/page.tsx with NGO admin dashboard showing stats (total donations, active stories)

### Dashboard: Story List (US2)

- [x] T108 [P] [US2] Create dashboard/src/app/(dashboard)/stories/page.tsx with table listing NGO's stories (title, status, raised amount, date)
- [x] T109 [US2] Fetch NGO stories in stories/page.tsx querying Firestore: WHERE ngoId == currentUser.ngoIds[0] ORDER BY createdAt DESC
- [x] T110 [US2] Add status filter dropdown in stories/page.tsx filtering by draft, pending_approval, active, paused, archived
- [x] T111 [US2] Add "Create New Story" button in stories/page.tsx navigating to /stories/new
- [x] T112 [US2] Display story stats in table: viewCount, donationCount, raisedAmount / goalAmount percentage

### Dashboard: Create Story (US2)

- [x] T113 [P] [US2] Create dashboard/src/app/(dashboard)/stories/new/page.tsx with story creation form per business-payment-setup.html structure
- [x] T114 [P] [US2] Create dashboard/src/components/StoryForm.tsx reusable form component with bilingual fields (title, titleHe, description, descriptionHe)
- [x] T115 [US2] Add image upload widget in StoryForm using Firebase Storage upload with resize to 800x800 and 300x300 thumbnails
- [x] T116 [US2] Implement multi-image upload in StoryForm allowing max 5 images with preview and delete functionality
- [x] T117 [US2] Add rich text editor in StoryForm for description field supporting bold, italic, lists (using react-quill or similar)
- [x] T118 [US2] Add form fields in StoryForm: goalAmount (optional, number input), tags (multi-select), category (dropdown)
- [x] T119 [US2] Validate form in StoryForm: title/titleHe required, description 300-5000 chars, min 1 image, max 5 tags
- [x] T120 [US2] Submit story in StoryForm calling Cloud Function createStory, setting status: pending_approval, createdBy: currentUser.uid

### Cloud Functions: Story API (US2)

- [x] T121 [P] [US2] Implement functions/src/stories/createStory.ts per contracts/story-api.md POST /stories
- [x] T122 [US2] Validate NGO admin permission in createStory: verify currentUser.ngoIds includes request.body.ngoId
- [x] T123 [US2] Upload images to Cloud Storage in createStory: path stories/{storyId}/{filename}, generate signed URLs
- [x] T124 [US2] Create story document in createStory in Firestore stories collection with status: pending_approval, denormalized NGO data
- [x] T125 [US2] Send notification to platform admin in createStory (email alert that new story needs approval)
- [x] T126 [P] [US2] Implement functions/src/stories/updateStory.ts per contracts/story-api.md PUT /stories/:storyId
- [x] T127 [US2] Validate permissions in updateStory: verify currentUser is NGO admin for this story or platform admin
- [x] T128 [US2] Allow status changes in updateStory: NGO admin can set active→paused, platform admin can set pending_approval→active
- [x] T129 [US2] Revert to pending if critical fields change in updateStory: if title/description updated on active story, set status: pending_approval

### Dashboard: Edit Story (US2)

- [x] T130 [P] [US2] Create dashboard/src/app/(dashboard)/stories/[id]/edit/page.tsx reusing StoryForm component with pre-filled data
- [x] T131 [US2] Fetch existing story in edit page querying Firestore document by storyId
- [x] T132 [US2] Allow image replacement in edit mode: delete old image from Storage, upload new, update images array
- [x] T133 [US2] Add "Pause Story" button in edit page for active stories (sets status: paused, hides from feed)
- [x] T134 [US2] Add "Reactivate Story" button in edit page for paused stories (requires re-approval if content changed)
- [x] T135 [US2] Show approval status in edit page: if pending_approval, display "Waiting for admin approval" message

### Dashboard: Story Approval (Platform Admin - US2)

- [x] T136 [P] [US2] Create dashboard/src/app/(dashboard)/admin/approve/page.tsx with list of pending stories (platform admin only)
- [x] T137 [US2] Filter pending stories in approve page: WHERE status == 'pending_approval' ORDER BY createdAt ASC
- [x] T138 [US2] Add "Approve" button in approve page calling Cloud Function approveStory setting status: active, publishedAt: now
- [x] T139 [US2] Add "Reject" button in approve page with reason textarea, setting status: draft with rejection notes
- [x] T140 [US2] Implement functions/src/stories/approveStory.ts per contracts/story-api.md POST /stories/:storyId/approve
- [x] T141 [US2] Verify platform admin role in approveStory checking user.profileType === 'platform_admin'
- [x] T142 [US2] Update story on approval in approveStory: status: active, publishedAt: FieldValue.serverTimestamp(), approvedBy: adminUid
- [x] T143 [US2] Create audit log in approveStory writing to admin_actions collection with action: approve_story, resourceId: storyId
- [x] T144 [US2] Send approval email to NGO admin in approveStory notifying story is now live with link to feed

### Dashboard: Donation Tracking (US2)

- [x] T145 [P] [US2] Create dashboard/src/app/(dashboard)/donations/page.tsx with table of donations for NGO's stories
- [x] T146 [US2] Fetch NGO donations in donations page: WHERE ngoId == currentNGO.id ORDER BY paidAt DESC with pagination
- [x] T147 [US2] Display donation details in table: donor name (or Anonymous), amount, story title, date, receipt link
- [x] T148 [US2] Add CSV export button in donations page generating downloadable CSV with all donation records
- [x] T149 [US2] Calculate real-time stats in donations page: total raised (sum ngoAmount), donor count (unique userIds), average donation

### Dashboard: Testing US2 (Optional - can defer to Phase 7)

- [ ] T150 [P] [US2] Write E2E test in dashboard/**tests**/story-management.test.ts: create story → submit → approve (admin) → verify in feed

**Checkpoint**: USER STORY 2 COMPLETE - NGOs can now manage their own content independently

---

## Phase 5: User Story 3 - Returning Donor Experience (Priority: P3)

**Goal**: Enable returning donors to donate again quickly with saved payment methods

**Independent Test**: Existing donor returns → Already logged in → Browse stories → Select story → Donate with one tap (saved card) → Complete in <60 seconds

### Mobile: Saved Payment Methods (US3)

- [ ] T151 [P] [US3] Modify DonationFlowScreen in mobile/src/screens/donation/DonationFlowScreen.tsx to check for Stripe customer ID in user document
- [ ] T152 [US3] Display saved card option in DonationFlowScreen if stripeCustomerId exists: show last4, brand, expiry with "Use saved card" button
- [ ] T153 [US3] Add "Use different card" option in DonationFlowScreen to open full Stripe Checkout for new payment method
- [ ] T154 [US3] Modify createPaymentIntent in functions/src/payments/createPaymentIntent.ts to accept optional paymentMethodId for saved cards
- [ ] T155 [US3] Confirm payment immediately in createPaymentIntent if paymentMethodId provided using stripe.paymentIntents.confirm()
- [ ] T156 [US3] Add "Save card for future donations" checkbox in DonationFlowScreen for new payments, pass saveCard: true to API

### Mobile: Donation History (US3)

- [ ] T157 [P] [US3] Create mobile/src/screens/profile/DonationsListScreen.tsx with chronological list of user's donations
- [ ] T158 [US3] Add "My Donations" tab in mobile/src/navigation/MainTabs.tsx as third tab with history icon
- [ ] T159 [US3] Fetch user donations in DonationsListScreen querying Firestore: WHERE userId == currentUser.uid ORDER BY paidAt DESC limit 20
- [ ] T160 [US3] Display donation card in DonationsListScreen with story thumbnail, title, amount, date, receipt button
- [ ] T161 [US3] Add pagination to DonationsListScreen using onEndReached to load more donations (20 per page)
- [ ] T162 [US3] Add "View Receipt" button on each donation card navigating to ReceiptViewerScreen with donationId

### Mobile: Receipt Viewer (US3)

- [ ] T163 [P] [US3] Create mobile/src/screens/profile/ReceiptViewerScreen.tsx displaying PDF receipt in WebView or PDF viewer
- [ ] T164 [US3] Fetch receipt URL in ReceiptViewerScreen from donation.receiptUrl field
- [ ] T165 [US3] Add "Download" button in ReceiptViewerScreen using expo-file-system to save PDF to device
- [ ] T166 [US3] Add "Share" button in ReceiptViewerScreen using expo-sharing to share PDF via email/messaging apps
- [ ] T167 [US3] Add "Email Receipt" button in ReceiptViewerScreen calling Cloud Function to resend receipt email

### Cloud Functions: User API Extensions (US3)

- [ ] T168 [P] [US3] Implement functions/src/users/getDonationHistory.ts per contracts/user-api.md GET /users/me/donations
- [ ] T169 [US3] Add query parameters in getDonationHistory: limit, offset, storyId filter, date range (startDate, endDate)
- [ ] T170 [US3] Return donation summary in getDonationHistory response: totalAmount, totalCount, taxDeductibleAmount, yearToDate
- [ ] T171 [P] [US3] Implement functions/src/users/resendReceipt.ts to trigger receipt email resend for existing donation

### Mobile: Returning User UX (US3)

- [ ] T172 [P] [US3] Implement "Remember me" in login screen storing Firebase refresh token securely using expo-secure-store
- [ ] T173 [US3] Add auto-login on app launch in mobile/src/services/auth.ts checking for valid refresh token, silently authenticate
- [ ] T174 [US3] Show "New stories since your last visit" badge in FeedScreen comparing current feed with lastLoginAt timestamp
- [ ] T175 [US3] Add donation success count to profile header showing total donations made and total amount donated

### Mobile: Testing US3 (Optional - can defer to Phase 7)

- [ ] T176 [P] [US3] Write integration test in mobile/**tests**/returning-donor.test.ts: login → view history → donate with saved card → verify <60 sec

**Checkpoint**: USER STORY 3 COMPLETE - Returning donors have optimized experience

---

## Phase 6: User Story 4 - Donation Tracking and Receipts (Priority: P3)

**Goal**: Enable donors to track giving history and download tax-compliant receipts

**Independent Test**: Donor with multiple donations → Open "My Donations" → Filter by year → Download annual tax summary PDF → Verify all donations listed

### Mobile: Advanced Donation History (US4)

- [ ] T177 [P] [US4] Add year filter dropdown in DonationsListScreen to filter donations by year (2025, 2024, 2023, All time)
- [ ] T178 [US4] Add NGO filter in DonationsListScreen showing list of NGOs donated to, tap to filter by specific NGO
- [ ] T179 [US4] Add search bar in DonationsListScreen to search by story title or NGO name
- [ ] T180 [US4] Display annual summary card at top of DonationsListScreen: "You donated X₪ to Y stories in 2025"
- [ ] T181 [US4] Add sort options in DonationsListScreen: by date (desc/asc), by amount (high to low), by NGO name (alphabetical)

### Mobile: Tax Summary (US4)

- [ ] T182 [P] [US4] Create mobile/src/screens/profile/TaxSummaryScreen.tsx with annual giving breakdown per invoice.html layout
- [ ] T183 [US4] Add "Generate Tax Summary" button in DonationsListScreen navigating to TaxSummaryScreen with year parameter
- [ ] T184 [US4] Fetch tax summary in TaxSummaryScreen calling Cloud Function getTaxSummary with year query parameter
- [ ] T185 [US4] Display tax summary sections in TaxSummaryScreen: total donated, donations by NGO (with NGO tax ID), individual receipts list
- [ ] T186 [US4] Add "Export as PDF" button in TaxSummaryScreen calling Cloud Function to generate consolidated annual PDF
- [ ] T187 [US4] Add "Email Summary" button in TaxSummaryScreen to email PDF summary to user's registered email

### Cloud Functions: Tax Summary API (US4)

- [ ] T188 [P] [US4] Implement functions/src/users/getTaxSummary.ts per contracts/user-api.md GET /users/me/tax-summary?year=2025
- [ ] T189 [US4] Query donations for year in getTaxSummary: WHERE userId == currentUser.uid AND paidAt >= year-01-01 AND paidAt < (year+1)-01-01
- [ ] T190 [US4] Group donations by NGO in getTaxSummary calculating sum per NGO with NGO name, tax ID, total amount
- [ ] T191 [US4] Return donation list in getTaxSummary with receiptNumber, amount, date, downloadUrl for each donation
- [ ] T192 [P] [US4] Implement functions/src/users/exportTaxSummary.ts per contracts/user-api.md POST /users/me/tax-summary/export
- [ ] T193 [US4] Generate annual PDF in exportTaxSummary using PDFKit with Hebrew support, layout: header (user info), body (donations table grouped by NGO), footer (total)
- [ ] T194 [US4] Upload consolidated PDF in exportTaxSummary to Cloud Storage: path tax-summaries/{userId}/{year}.pdf with 7-day expiration
- [ ] T195 [US4] Return download URL in exportTaxSummary with expiresAt timestamp

### Dashboard: Receipt Management for NGOs (US4)

- [ ] T196 [P] [US4] Add receipt download button in dashboard/src/app/(dashboard)/donations/page.tsx on each donation row
- [ ] T197 [US4] Add bulk receipt download in donations page: select multiple donations, download ZIP of all receipts
- [ ] T198 [US4] Add receipt regeneration button in donations page for donations with receiptGenerated: false (retry failed generations)

### Mobile: Receipt Search and Filter (US4)

- [ ] T199 [P] [US4] Add "Download All Receipts" button in DonationsListScreen downloading ZIP of all receipts for selected year
- [ ] T200 [US4] Add receipt status indicator in DonationsListScreen showing checkmark if receiptGenerated: true, pending spinner otherwise
- [ ] T201 [US4] Add "Request Receipt" button in DonationsListScreen for donations missing receipts, calling Cloud Function to regenerate

### Cloud Functions: Receipt Management (US4)

- [ ] T202 [P] [US4] Implement functions/src/receipts/regenerateReceipt.ts to handle manual receipt regeneration requests
- [ ] T203 [US4] Add retry logic in regenerateReceipt for failed PDF generations due to temporary errors
- [ ] T204 [US4] Implement bulk receipt generation in functions/src/receipts/generateBulkReceipts.ts for admin-triggered batch operations

### Mobile: Testing US4 (Optional - can defer to Phase 7)

- [ ] T205 [P] [US4] Write integration test in mobile/**tests**/tax-summary.test.ts: filter by year → generate summary → download PDF → verify data

**Checkpoint**: USER STORY 4 COMPLETE - Full donation tracking and tax compliance features implemented

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Mobile Polish

- [ ] T206 [P] Add loading states across all screens with skeleton loaders for better perceived performance
- [ ] T207 [P] Add error boundaries in mobile/src/components/ErrorBoundary.tsx to catch and display React errors gracefully
- [ ] T208 [P] Implement offline mode in mobile app caching stories in AsyncStorage for viewing without network
- [ ] T209 [P] Add pull-to-refresh on all list screens (FeedScreen, DonationsListScreen) to reload fresh data
- [ ] T210 [P] Optimize image loading in StoryCard using expo-image with lazy loading and blur placeholders
- [ ] T211 [P] Add haptic feedback on button taps using expo-haptics for better tactile UX
- [ ] T212 [P] Implement deep linking for story shares (maaser://story/{storyId}) using expo-linking
- [ ] T213 Add app analytics tracking key events: story_view, donation_start, donation_complete, receipt_download using Firebase Analytics
- [ ] T214 Add crash reporting using Firebase Crashlytics for mobile app monitoring
- [ ] T215 Optimize bundle size running metro-bundler analysis, remove unused dependencies

### Dashboard Polish

- [x] T216 [P] Add loading skeletons in dashboard for table loading states
- [x] T217 [P] Add toast notifications in dashboard using react-hot-toast for user feedback on actions
- [ ] T218 [P] Implement dark mode in dashboard matching mobile design system with Tailwind dark: classes
- [ ] T219 [P] Add dashboard analytics using Google Analytics 4 for NGO admin behavior tracking
- [ ] T220 Add Sentry error tracking in dashboard for production error monitoring
- [ ] T221 Optimize Next.js build with static page generation for public pages (login, landing)

### Security Hardening

- [x] T222 [P] Review and tighten Firestore security rules in firebase/firestore.rules ensuring role-based access control
- [x] T223 [P] Review and tighten Storage security rules in firebase/storage.rules preventing unauthorized image access
- [ ] T224 [P] Add rate limiting to Cloud Functions in functions/src/utils/rateLimiter.ts preventing abuse (10 requests/min per IP)
- [ ] T225 [P] Add input sanitization in Cloud Functions for all user-provided text fields preventing XSS
- [ ] T226 [P] Implement HTTPS-only enforcement in firebase.json and Expo app.json
- [ ] T227 Add API request logging in Cloud Functions for security audit trail
- [ ] T228 Enable Firebase App Check in mobile app to prevent unauthorized API access from non-app clients

### Performance Optimization

- [ ] T229 [P] Add Firestore query optimization: ensure all compound indexes are created per data-model.md
- [ ] T230 [P] Implement Cloud Storage CDN caching for images with max-age headers for faster loads
- [ ] T231 [P] Optimize PDF generation in functions/src/receipts/generateReceipt.ts caching PDFKit fonts and templates
- [ ] T232 Add database backup automation using Firebase Firestore export scheduled daily
- [ ] T233 Implement Cloud Function cold start optimization with min instances = 1 for critical functions (createPaymentIntent)

### Testing (Optional - Deferred Test Tasks)

- [ ] T234 [P] Write unit tests for Zustand stores in mobile/**tests**/stores/ testing auth, story, donation state management
- [ ] T235 [P] Write unit tests for Cloud Functions in functions/src/**tests**/ testing payment, receipt, story logic with mocked Firestore/Stripe
- [ ] T236 [P] Write component tests for mobile screens using React Native Testing Library in mobile/**tests**/components/
- [ ] T237 [P] Write E2E tests for dashboard using Playwright in dashboard/**tests**/e2e/ covering story creation flow
- [ ] T238 Setup CI/CD pipeline with GitHub Actions running lint + test on PR, deploying on merge to main
- [ ] T239 Add Stripe test mode validation ensuring all test card numbers work correctly in development
- [ ] T240 Create test data seeding script in scripts/seed-dev-data.ts creating 5 NGOs, 20 stories, 50 donations for testing

### Documentation

- [ ] T241 [P] Update README.md with project overview, tech stack summary, quick start links to quickstart.md
- [ ] T242 [P] Create mobile/README.md with mobile-specific setup instructions (Expo, iOS/Android simulators)
- [ ] T243 [P] Create dashboard/README.md with dashboard setup (Next.js, Firebase Admin SDK, environment variables)
- [ ] T244 [P] Create functions/README.md with Cloud Functions deployment instructions (Firebase CLI, environment config)
- [ ] T245 [P] Document API endpoints in docs/api/ folder with OpenAPI spec for Cloud Functions
- [ ] T246 Create deployment guide in docs/deployment.md covering production Firebase project setup, environment promotion
- [ ] T247 Create troubleshooting guide in docs/troubleshooting.md with common issues and solutions
- [ ] T248 Add inline code comments in complex functions (payment flow, receipt generation) for maintainability

### Production Readiness

- [ ] T249 Setup production Firebase project (hamaaser-prod) separate from development
- [ ] T250 Configure production Stripe account with live keys replacing test keys in production env
- [ ] T251 Setup SendGrid production API key with proper sender verification for receipt emails
- [ ] T252 Configure custom domain for dashboard (admin.hamaaser.org) using Firebase Hosting
- [ ] T253 Submit mobile app to Apple App Store for review with required assets (screenshots, privacy policy)
- [ ] T254 Submit mobile app to Google Play Store for review with required assets
- [ ] T255 Create privacy policy and terms of service pages linked from mobile app and dashboard
- [ ] T256 Setup monitoring alerts in Firebase Console for high error rates, slow functions, budget thresholds
- [ ] T257 Run quickstart.md validation ensuring new developer can setup project from scratch in <45 minutes

**Final Checkpoint**: Production-ready MVP complete! 🚀

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP core, must complete first
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel to US1 if team capacity allows
- **User Story 3 (Phase 5)**: Depends on US1 completion (requires donation flow to exist)
- **User Story 4 (Phase 6)**: Depends on US1 completion (requires donations to track)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (Donor Discovery)**: **Independent** - No dependencies on other stories, pure donor flow
- **US2 (NGO Management)**: **Independent** - Can run parallel to US1, separate dashboard app
- **US3 (Returning Donor)**: Depends on US1 - Extends donation flow with saved payments
- **US4 (Donation Tracking)**: Depends on US1 - Extends donation history and receipts

### Critical Path (Fastest MVP Delivery)

```
Setup (Phase 1) → Foundational (Phase 2) → User Story 1 (Phase 3) → SHIP MVP
```

**Timeline Estimate**:

- Phase 1: 2 days
- Phase 2: 5 days
- Phase 3 (US1): 10 days
- **Total MVP: 17 days** (with 2 developers)

### Parallel Opportunities

**Phase 2 (Foundational) - Can run in parallel**:

- Firebase setup (T011-T020) - Developer A
- Shared types (T021-T025) - Developer B
- Mobile foundation (T026-T035) - Developer A
- Dashboard foundation (T036-T041) - Developer B  
- Functions foundation (T042-T047) - Developer C

**Phase 3 (User Story 1) - Can parallelize within story**:

- Mobile Auth (T048-T055) - Developer A
- Mobile Feed (T056-T061) - Developer B
- Cloud Functions Payment (T081-T092) - Developer C
Then converge for integration

**Phase 4 vs Phase 3 - Can run stories in parallel**:

- Team A: Finish User Story 1 (mobile donor experience)
- Team B: Start User Story 2 (dashboard NGO experience)
- Zero conflicts - different apps, different collections

---

## Parallel Example: User Story 1

```bash
# Sprint 1: Foundational (5 days) - All parallel
Developer A: T026-T035 (Mobile foundation)
Developer B: T036-T041 (Dashboard foundation)  
Developer C: T042-T047 (Functions foundation)

# Sprint 2: US1 Core (5 days) - Parallel tracks
Developer A: T048-T055 (Auth) → T056-T067 (Feed + Detail)
Developer B: T068-T080 (Donation Flow + Success)
Developer C: T081-T092 (Payment API + Webhook) → T093-T101 (Receipts)

# Sprint 3: US1 Integration (2 days) - Convergence
All: Integration testing, bug fixes, end-to-end validation
```

---

## Implementation Strategy

### MVP First (Recommended - User Story 1 Only)

1. ✅ Complete Phase 1: Setup (2 days)
2. ✅ Complete Phase 2: Foundational (5 days) - **CRITICAL - blocks everything**
3. ✅ Complete Phase 3: User Story 1 (10 days) - Donor discovery + first donation
4. 🚢 **SHIP MVP** - Test with 10 beta users, validate core value prop
5. Iterate based on feedback before building US2-US4

**Why this works**: US1 is independently valuable - donors can discover stories and donate. NGOs can add stories manually (via Firebase console) until US2 is ready. Validates core hypothesis with minimal investment.

### Incremental Delivery (Post-MVP)

After MVP validation:

1. Add User Story 2 (NGO Management) - NGOs can self-serve content (3-4 days)
2. Add User Story 3 (Returning Donors) - Optimize for retention (2-3 days)
3. Add User Story 4 (Tax Tracking) - Power user feature (2-3 days)
4. Polish Phase - Production hardening (5 days)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With 3 developers:

1. **Week 1-2**: All complete Setup + Foundational together
2. **Week 3-4**: Once Foundational done:
   - Developer A + B: User Story 1 (mobile experience)
   - Developer C: User Story 2 (dashboard) - runs parallel, zero conflicts
3. **Week 5**: Integration, testing, polish
4. **Week 6**: User Story 3 (Developer A) + User Story 4 (Developer B) + Security (Developer C)

**Total timeline**: 6 weeks for all 4 user stories with 3 developers

---

## Summary

- **Total Tasks**: 257 tasks
- **Task Breakdown**:
  - Phase 1 (Setup): 10 tasks
  - Phase 2 (Foundational): 37 tasks - **MUST complete before any user story**
  - Phase 3 (User Story 1): 55 tasks - **MVP scope** 🎯
  - Phase 4 (User Story 2): 47 tasks
  - Phase 5 (User Story 3): 26 tasks
  - Phase 6 (User Story 4): 30 tasks
  - Phase 7 (Polish): 52 tasks

- **Parallel Opportunities**: 91 tasks marked [P] can run in parallel
- **Independent Stories**: US1 and US2 can develop in parallel after Foundational
- **MVP Recommendation**: Ship after Phase 1 + Phase 2 + Phase 3 (102 tasks, ~3 weeks with 2 developers)

- **Test Coverage**: Test tasks included but optional per constitution (30% target). Can defer all test tasks (T102, T103, T150, T176, T205, T234-T240) to Phase 7 or omit for MVP speed.

**Next Action**: Start with T001 - Create project structure, follow checklist sequentially respecting [P] parallelization and user story independence.
