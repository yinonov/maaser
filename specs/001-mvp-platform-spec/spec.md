# Feature Specification: HaMaaser MVP Digital Tithing Platform

**Feature Branch**: `001-mvp-platform-spec`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "HaMaaser MVP - Product Specification (spec.md)"

## Design Assets

High-fidelity UI mockups created with Google Stitch (HTML/Tailwind CSS prototypes):

- **`/example pages/home.html`**: Story feed with infinite scroll, story cards showing progress bars, donation counts, and social proof
- **`/example pages/registration-login.html`**: Authentication flow with email/password and social login options (Google, WhatsApp)
- **`/example pages/dontation.html`**: Donation flow with amount selection, frequency toggle, and fee transparency
- **`/example pages/invoice.html`**: Receipt generation interface showing donation history with search/filter and PDF preview
- **`/example pages/business-payment-setup.html`**: NGO payment settings for invoice details and saved payment methods

These mockups demonstrate:

- **Design System**: Warm terracotta/gold primary colors (#d4a373, #eebd2b, #E87A5D, #A0DDE6), dark mode support, Plus Jakarta Sans typography
- **RTL Support**: All pages render properly in Hebrew right-to-left layout
- **Responsive Design**: Mobile-first with breakpoints for tablet/desktop
- **Key UI Patterns**: Card-based layouts, progress bars, segmented controls, modal overlays, loading states

Developers should reference these pages for visual design consistency when implementing React Native components and Next.js dashboard screens.

## Clarifications

### Session 2025-11-04

- Q: NGO Content Moderation Strategy → A: All stories require pre-approval before going live (delays but maximum safety)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Donor Discovery and First Donation (Priority: P1)

A potential donor downloads the app, discovers emotionally resonant stories, and completes their first donation within 5 minutes.

**Why this priority**: This is the core value proposition - if users can't discover and donate to stories easily, the entire platform fails. This represents the minimum viable experience.

**Independent Test**: Can be fully tested by installing the app, signing up, browsing 3-5 real stories, selecting one, and completing a donation with receipt confirmation. Delivers immediate value by enabling charitable giving.

**Acceptance Scenarios**:

1. **Given** a new user opens the app, **When** they complete signup with email/Google OAuth, **Then** they can access the story feed within 30 seconds
2. **Given** user is on the story feed, **When** they scroll through available stories, **Then** they see 3-5 real beneficiary stories with photos and compelling descriptions
3. **Given** user taps on a story, **When** they view the detail page, **Then** they can read the full story, see multiple photos, and understand the need clearly
4. **Given** user decides to donate, **When** they tap "Donate Now" and select an amount, **Then** they see transparent fee breakdown (e.g., "98₪ to NGO + 2₪ platform fee")
5. **Given** user proceeds to payment, **When** they complete Stripe checkout, **Then** they receive confirmation screen and email receipt within 5 minutes

---

### User Story 2 - NGO Story Management (Priority: P2)

NGO administrators can independently add and manage stories of their beneficiaries without technical assistance.

**Why this priority**: Platform success depends on fresh, authentic content. NGOs must be self-sufficient in content creation to scale beyond MVP.

**Independent Test**: Can be tested by providing NGO admin credentials, logging into dashboard, adding a new story with photos and description, and verifying it appears in the donor feed within minutes.

**Acceptance Scenarios**:

1. **Given** NGO admin has credentials, **When** they log into the web dashboard, **Then** they can view their total donations and active stories
2. **Given** admin is on dashboard, **When** they click "Add New Story", **Then** they can fill out title, description, upload photos, and set a goal amount
3. **Given** admin submits a new story, **When** they click "Publish", **Then** the story enters pending approval status and NGO receives confirmation that review is in progress
4. **Given** platform admin approves a story, **When** approval is granted, **Then** the story appears in the donor feed within 1 minute and NGO receives approval notification
5. **Given** donations are received, **When** admin checks the dashboard, **Then** they can see real-time donation updates and export data as CSV

---

### User Story 3 - Returning Donor Experience (Priority: P3)

Existing donors can quickly browse new stories and donate again with minimal friction using saved payment methods.

**Why this priority**: Donor retention drives platform sustainability. Returning donors with saved payment info represent the highest conversion users.

**Independent Test**: Can be tested by having a user who previously donated return to the app, browse new stories, and complete a second donation in under 60 seconds.

**Acceptance Scenarios**:

1. **Given** returning user opens the app, **When** they're automatically logged in, **Then** they see the feed with new stories since their last visit
2. **Given** user selects a story to support, **When** they choose donation amount, **Then** payment completes in one tap using saved payment method
3. **Given** user completes donation, **When** they want to track giving, **Then** they can view complete donation history in "My Donations" tab

---

### User Story 4 - Donation Tracking and Receipts (Priority: P3)

Donors can access their complete giving history and download tax-compliant receipts for business/personal records.

**Why this priority**: Essential for user trust and practical tax needs, especially for business donors fulfilling ma'aser obligations.

**Independent Test**: Can be tested by completing donations and then accessing "My Donations" tab to view history and download PDF receipts.

**Acceptance Scenarios**:

1. **Given** user has made donations, **When** they access "My Donations" tab, **Then** they see chronological list of all donations with amounts, dates, and NGO names
2. **Given** user taps on a donation record, **When** they view details, **Then** they can download a PDF receipt with all tax-compliant information
3. **Given** user completes a donation, **When** payment succeeds, **Then** they automatically receive email receipt within 5 minutes

---

### Edge Cases

- What happens when payment fails during checkout? System shows clear error message with suggested actions and doesn't lose donation intent.
- How does system handle NGO uploading inappropriate content? All stories require platform admin pre-approval before going live, with content guidelines provided during NGO onboarding.
- What if user wants to cancel/refund a donation? 7-day refund window available through support contact, with NGO notification.
- How does app perform with poor network connectivity? Graceful degradation with offline capability for viewing previously loaded stories.
- What if NGO account is compromised? Account suspension capability with immediate story removal and investigation process.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create accounts using email/password or Google OAuth authentication
- **FR-002**: System MUST display a scrollable feed of real beneficiary stories with photos, titles, and descriptions
- **FR-003**: System MUST enable one-tap donations with transparent fee display before payment processing
- **FR-004**: System MUST process payments securely through Stripe Checkout without storing payment data
- **FR-005**: System MUST generate and email PDF receipts automatically after successful donations
- **FR-006**: System MUST provide NGO administrators with web dashboard to add and manage stories independently
- **FR-007**: System MUST store complete donation history accessible to users in "My Donations" section
- **FR-008**: System MUST support Hebrew and English language interfaces with proper RTL/LTR handling
- **FR-009**: System MUST validate email addresses during registration and send verification links
- **FR-010**: System MUST display real-time donation progress on NGO dashboard
- **FR-011**: System MUST allow story uploads with multiple photos and rich text descriptions
- **FR-012**: System MUST maintain 99% uptime for payment processing and core app functionality
- **FR-013**: System MUST provide clear error messages and recovery paths for failed operations
- **FR-014**: System MUST log all transactions and security events for audit purposes
- **FR-015**: System MUST support NIS currency with optional USD for international donors
- **FR-016**: System MUST require platform admin approval for all NGO stories before they become visible to donors

### Key Entities

- **User**: Represents donors with authentication credentials, donation history, profile information (name, email, business details for tax receipts)
- **Story**: Represents beneficiary situations with title, description, photos, goal amount, associated NGO, publication status
- **Donation**: Links users to stories with amount, timestamp, payment status, receipt information, platform fees
- **NGO**: Organizations managing stories with admin credentials, verification status, total funds raised, active story count
- **Receipt**: Tax-compliant documents with donor details, NGO information, donation amount, digital signatures

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of users successfully complete their first donation within 5 minutes of signup
- **SC-002**: Payment processing succeeds for 95% of donation attempts without technical failures
- **SC-003**: Users receive email receipts within 5 minutes for 100% of successful donations
- **SC-004**: 30% of donors return to make a second donation within 30 days of their first
- **SC-005**: NGO administrators can add new stories and see them live in under 10 minutes without technical support
- **SC-006**: App launches and displays story feed within 3 seconds on standard mobile devices
- **SC-007**: Platform processes 50,000₪ in total donations during 3-month MVP period
- **SC-008**: System maintains 99% uptime during business hours (8am-10pm Israel time)
- **SC-009**: User app crash rate remains below 2% of all sessions
- **SC-010**: 15% conversion rate from story views to completed donations
