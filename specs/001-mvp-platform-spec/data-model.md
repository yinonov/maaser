# Data Model: HaMaaser MVP

**Feature**: HaMaaser MVP Digital Tithing Platform  
**Date**: 2025-11-04  
**Database**: Firebase Firestore (NoSQL Document Database)

## Overview

This document defines the Firestore database schema for the HaMaaser MVP. The design prioritizes:

1. **Denormalization** for read performance (avoid joins in NoSQL)
2. **Real-time capabilities** for NGO dashboard live updates
3. **Security** through Firestore security rules
4. **Scalability** for future growth beyond MVP

---

## Collections

### 1. `users` Collection

**Purpose**: Store donor and NGO admin profiles

**Document ID**: Firebase Auth UID (matches authentication system)

**Schema**:

```typescript
interface User {
  // Identity
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;                  // User email (required)
  displayName: string;            // Full name
  phoneNumber?: string;           // Optional contact number
  
  // Role
  profileType: 'donor' | 'ngo_admin';  // User role
  ngoIds?: string[];              // For NGO admins: which NGOs they manage
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Business Info (Optional - for tax receipts)
  businessInfo?: {
    businessName: string;         // Company name
    taxId: string;                // Israeli tax ID (HP number)
    address: string;              // Full address
    city: string;
    postalCode: string;
    country: string;              // Default: "Israel"
  };
  
  // Preferences
  preferredCurrency: 'ILS' | 'USD';  // Default: ILS
  language: 'he' | 'en';            // Default: he
  emailNotifications: boolean;      // Default: true
  
  // Statistics (denormalized)
  donationStats?: {
    totalDonated: number;         // Sum of all donations in ILS
    donationCount: number;        // Number of donations made
    lastDonationAt?: Timestamp;
  };
}
```

**Indexes**:

- `email` (automatic)
- `profileType, createdAt` (for admin queries)

**Example Document**:

```json
{
  "uid": "abc123xyz",
  "email": "donor@example.com",
  "displayName": "David Cohen",
  "phoneNumber": "+972501234567",
  "profileType": "donor",
  "createdAt": "2025-11-04T10:00:00Z",
  "updatedAt": "2025-11-04T10:00:00Z",
  "businessInfo": {
    "businessName": "Cohen Consulting Ltd",
    "taxId": "512345678",
    "address": "123 Dizengoff St",
    "city": "Tel Aviv",
    "postalCode": "6100001",
    "country": "Israel"
  },
  "preferredCurrency": "ILS",
  "language": "he",
  "emailNotifications": true,
  "donationStats": {
    "totalDonated": 50000,
    "donationCount": 15,
    "lastDonationAt": "2025-11-03T14:30:00Z"
  }
}
```

---

### 2. `ngos` Collection

**Purpose**: Store NGO organization details

**Document ID**: Auto-generated Firestore ID

**Schema**:

```typescript
interface NGO {
  // Identity
  id: string;                     // Firestore document ID
  name: string;                   // English name
  nameHe: string;                 // Hebrew name
  slug: string;                   // URL-friendly identifier
  
  // Description
  description: string;            // English description
  descriptionHe: string;          // Hebrew description
  mission?: string;               // Mission statement
  
  // Media
  logo: string;                   // Cloud Storage URL
  coverImage?: string;            // Banner image URL
  website?: string;               // Official website
  
  // Legal
  taxExemptNumber: string;        // Israeli non-profit registration (Amuta/Hevra)
  verified: boolean;              // Platform admin approval
  
  // Contact
  email: string;
  phoneNumber: string;
  address?: string;
  
  // Admin Access
  adminUsers: string[];           // Array of User UIDs who can manage this NGO
  
  // Statistics (updated via Cloud Function)
  stats: {
    totalDonationsReceived: number;  // Sum in ILS (after fees)
    totalDonors: number;             // Unique donor count
    activeStories: number;           // Published stories count
    allTimeRaised: number;           // Historical total
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'active' | 'suspended';
}
```

**Indexes**:

- `slug` (unique, for URL routing)
- `verified, status` (for dashboard filtering)

**Example Document**:

```json
{
  "id": "ngo_moshe_kato_foundation",
  "name": "Moshe Kato Foundation",
  "nameHe": "קרן משה קטו",
  "slug": "moshe-kato-foundation",
  "description": "Supporting families in need across Israel",
  "descriptionHe": "תמיכה במשפחות נזקקות ברחבי ישראל",
  "logo": "https://storage.googleapis.com/hamaaser-prod/ngos/moshe-kato-logo.jpg",
  "taxExemptNumber": "580012345",
  "verified": true,
  "email": "info@moshekato.org",
  "phoneNumber": "+972501234567",
  "adminUsers": ["user_uid_123", "user_uid_456"],
  "stats": {
    "totalDonationsReceived": 125000,
    "totalDonors": 87,
    "activeStories": 5,
    "allTimeRaised": 125000
  },
  "createdAt": "2025-10-01T08:00:00Z",
  "updatedAt": "2025-11-04T10:00:00Z",
  "status": "active"
}
```

---

### 3. `stories` Collection

**Purpose**: Store beneficiary stories that donors see and support

**Document ID**: Auto-generated Firestore ID

**Schema**:

```typescript
interface Story {
  // Identity
  id: string;                     // Firestore document ID
  ngoId: string;                  // Reference to NGO collection
  
  // Content (Bilingual)
  title: string;                  // English title
  titleHe: string;                // Hebrew title
  shortDescription: string;       // Feed card text (2-3 sentences)
  shortDescriptionHe: string;
  description: string;            // Full story (300-500 words)
  descriptionHe: string;
  
  // Media
  images: string[];               // Array of Cloud Storage URLs (max 5)
  thumbnailImage: string;         // Optimized for feed (300x300)
  heroImage: string;              // Main image for detail page (800x800)
  videoUrl?: string;              // YouTube/Vimeo embed URL
  
  // Fundraising
  goalAmount?: number;            // Optional target in agorot (1₪ = 100 agorot)
  raisedAmount: number;           // Running total in agorot
  donationCount: number;          // Number of donations received
  
  // Publishing
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'archived';
  publishedAt?: Timestamp;        // When story went live
  approvedAt?: Timestamp;         // Platform admin approval timestamp
  approvedBy?: string;            // Admin user UID who approved
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;              // User UID who created (NGO admin)
  
  // Categorization
  tags: string[];                 // e.g., ["medical", "family", "urgent", "children"]
  category?: string;              // e.g., "health", "education", "housing"
  
  // Denormalized (for faster queries)
  ngoName: string;                // NGO name (avoid join)
  ngoNameHe: string;
  ngoLogo: string;                // NGO logo URL
  ngoVerified: boolean;           // Is NGO verified?
  
  // Analytics (optional)
  viewCount?: number;             // Story detail page views
  shareCount?: number;            // Social shares (future)
}
```

**Indexes**:

- `ngoId, status, publishedAt` (for NGO dashboard)
- `status, publishedAt desc` (for donor feed - most recent first)
- `tags array-contains, status` (for filtering by category)

**Example Document**:

```json
{
  "id": "story_sarah_medical",
  "ngoId": "ngo_moshe_kato_foundation",
  "title": "Help Sarah's Family with Medical Bills",
  "titleHe": "עזרו למשפחת שרה עם חשבונות רפואיים",
  "shortDescription": "Sarah, a mother of three from Netanya, was diagnosed with a rare illness last year.",
  "shortDescriptionHe": "שרה, אמא לשלושה מנתניה, אובחנה עם מחלה נדירה בשנה שעברה.",
  "description": "Sarah, a mother of three from Netanya, was diagnosed with a rare illness...",
  "descriptionHe": "שרה, אמא לשלושה מנתניה...",
  "images": [
    "https://storage.googleapis.com/hamaaser-prod/stories/sarah_1.jpg",
    "https://storage.googleapis.com/hamaaser-prod/stories/sarah_2.jpg"
  ],
  "thumbnailImage": "https://storage.googleapis.com/hamaaser-prod/stories/sarah_thumb.jpg",
  "heroImage": "https://storage.googleapis.com/hamaaser-prod/stories/sarah_hero.jpg",
  "goalAmount": 5000000,
  "raisedAmount": 1250000,
  "donationCount": 24,
  "status": "active",
  "publishedAt": "2025-11-01T09:00:00Z",
  "approvedAt": "2025-10-31T16:00:00Z",
  "approvedBy": "admin_uid_789",
  "createdAt": "2025-10-30T14:00:00Z",
  "updatedAt": "2025-11-04T10:00:00Z",
  "createdBy": "user_uid_123",
  "tags": ["medical", "family", "urgent"],
  "category": "health",
  "ngoName": "Moshe Kato Foundation",
  "ngoNameHe": "קרן משה קטו",
  "ngoLogo": "https://storage.googleapis.com/hamaaser-prod/ngos/moshe-kato-logo.jpg",
  "ngoVerified": true,
  "viewCount": 342
}
```

---

### 4. `donations` Collection

**Purpose**: Record all donation transactions

**Document ID**: Auto-generated Firestore ID

**Schema**:

```typescript
interface Donation {
  // Identity
  id: string;                     // Firestore document ID
  receiptNumber: string;          // Unique receipt ID (e.g., "RCP-2025-00123")
  
  // References
  userId: string;                 // Reference to User
  storyId: string;                // Reference to Story
  ngoId: string;                  // Reference to NGO
  
  // Payment Details
  amount: number;                 // Total in agorot (e.g., 10000 = 100.00₪)
  currency: 'ILS' | 'USD';
  platformFee: number;            // Our 2% fee in agorot
  ngoAmount: number;              // Amount to NGO (amount - platformFee)
  
  // Stripe Integration
  stripePaymentIntentId: string;  // Stripe payment_intent ID
  stripePaymentStatus: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
  stripePaymentMethod: string;    // 'card', 'apple_pay', 'google_pay'
  stripeCustomerId?: string;      // Stripe customer ID (for recurring - future)
  
  // Receipt
  receiptUrl?: string;            // Cloud Storage URL for PDF
  receiptGenerated: boolean;      // Has PDF been created?
  receiptSent: boolean;           // Has email been sent?
  receiptSentAt?: Timestamp;
  
  // User Preferences
  anonymous: boolean;             // Hide donor name from NGO
  message?: string;               // Optional message to NGO (max 500 chars)
  
  // Timestamps
  createdAt: Timestamp;           // When donation intent created
  paidAt?: Timestamp;             // When payment succeeded
  refundedAt?: Timestamp;
  
  // Denormalized (for faster queries)
  donorName: string;              // User displayName
  donorEmail: string;             // User email
  storyTitle: string;             // Story title (avoid join)
  storyTitleHe: string;
  ngoName: string;                // NGO name (avoid join)
  ngoNameHe: string;
  
  // Analytics
  source?: 'mobile' | 'web';      // Platform used
  campaignId?: string;            // For tracking (future)
}
```

**Indexes**:

- `userId, createdAt desc` (for user donation history)
- `ngoId, paidAt desc` (for NGO dashboard)
- `storyId, stripePaymentStatus` (for story progress tracking)
- `receiptNumber` (for receipt lookup)

**Example Document**:

```json
{
  "id": "donation_abc123",
  "receiptNumber": "RCP-2025-00123",
  "userId": "abc123xyz",
  "storyId": "story_sarah_medical",
  "ngoId": "ngo_moshe_kato_foundation",
  "amount": 10000,
  "currency": "ILS",
  "platformFee": 200,
  "ngoAmount": 9800,
  "stripePaymentIntentId": "pi_1234567890",
  "stripePaymentStatus": "succeeded",
  "stripePaymentMethod": "card",
  "receiptUrl": "https://storage.googleapis.com/hamaaser-prod/receipts/RCP-2025-00123.pdf",
  "receiptGenerated": true,
  "receiptSent": true,
  "receiptSentAt": "2025-11-04T10:05:00Z",
  "anonymous": false,
  "message": "Wishing Sarah a speedy recovery!",
  "createdAt": "2025-11-04T10:00:00Z",
  "paidAt": "2025-11-04T10:01:23Z",
  "donorName": "David Cohen",
  "donorEmail": "donor@example.com",
  "storyTitle": "Help Sarah's Family with Medical Bills",
  "storyTitleHe": "עזרו למשפחת שרה עם חשבונות רפואיים",
  "ngoName": "Moshe Kato Foundation",
  "ngoNameHe": "קרן משה קטו",
  "source": "mobile"
}
```

---

### 5. `admin_actions` Collection (Audit Log)

**Purpose**: Track platform admin actions for security and compliance

**Document ID**: Auto-generated Firestore ID

**Schema**:

```typescript
interface AdminAction {
  id: string;
  adminUserId: string;            // Who performed the action
  adminEmail: string;
  action: 'approve_story' | 'reject_story' | 'suspend_ngo' | 'verify_ngo' | 'refund_donation';
  resourceType: 'story' | 'ngo' | 'user' | 'donation';
  resourceId: string;             // Which resource was affected
  details?: Record<string, any>;  // Additional context
  timestamp: Timestamp;
}
```

**Indexes**:

- `adminUserId, timestamp desc`
- `resourceType, resourceId, timestamp desc`

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isNGOAdmin(ngoId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/ngos/$(ngoId))
               .data.adminUsers.hasAny([request.auth.uid]);
    }
    
    function isPlatformAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid))
               .data.profileType == 'platform_admin';
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // No user deletion in MVP
    }
    
    // NGOs Collection
    match /ngos/{ngoId} {
      allow read: if true; // Public read for all users
      allow create: if isPlatformAdmin();
      allow update: if isNGOAdmin(ngoId) || isPlatformAdmin();
      allow delete: if isPlatformAdmin();
    }
    
    // Stories Collection
    match /stories/{storyId} {
      allow read: if resource.data.status == 'active' || 
                     isNGOAdmin(resource.data.ngoId) || 
                     isPlatformAdmin();
      allow create: if isAuthenticated() && isNGOAdmin(request.resource.data.ngoId);
      allow update: if isNGOAdmin(resource.data.ngoId) || isPlatformAdmin();
      allow delete: if isNGOAdmin(resource.data.ngoId) || isPlatformAdmin();
    }
    
    // Donations Collection
    match /donations/{donationId} {
      allow read: if isOwner(resource.data.userId) || 
                     isNGOAdmin(resource.data.ngoId) ||
                     isPlatformAdmin();
      allow create: if isAuthenticated(); // Payment intent creation
      allow update: if false; // Only Cloud Functions can update
      allow delete: if false; // No deletion (audit trail)
    }
    
    // Admin Actions (Audit Log)
    match /admin_actions/{actionId} {
      allow read: if isPlatformAdmin();
      allow create: if isPlatformAdmin();
      allow update, delete: if false; // Immutable audit log
    }
  }
}
```

---

## Data Relationships

```
User (Donor)
  â"œâ"€â"€ 1:N → Donations
  â""â"€â"€ N:M → Stories (through Donations)

User (NGO Admin)
  â""â"€â"€ N:M → NGOs (via adminUsers array)

NGO
  â"œâ"€â"€ 1:N → Stories
  â"œâ"€â"€ 1:N → Donations
  â""â"€â"€ N:M → Users (NGO Admins)

Story
  â"œâ"€â"€ N:1 → NGO
  â""â"€â"€ 1:N → Donations

Donation
  â"œâ"€â"€ N:1 → User (Donor)
  â"œâ"€â"€ N:1 → Story
  â""â"€â"€ N:1 → NGO
```

---

## Denormalization Strategy

**Why Denormalize?**
Firestore charges per document read. Denormalizing common fields reduces read costs and latency.

**Denormalized Fields**:

1. **In Stories**: Store NGO name, logo, verified status (avoid extra read when displaying feed)
2. **In Donations**: Store donor name, story title, NGO name (avoid joins in donation history)
3. **In Users**: Store donation statistics (faster profile loading)

**Trade-off**: Must update denormalized data when source changes (use Cloud Functions triggers).

---

## Cloud Function Triggers

**Maintain Data Consistency**:

```typescript
// When donation succeeds, update:
// 1. User.donationStats
// 2. Story.raisedAmount, donationCount
// 3. NGO.stats.totalDonationsReceived, totalDonors

exports.onDonationSuccess = functions.firestore
  .document('donations/{donationId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().stripePaymentStatus === 'succeeded') {
      // Update user stats
      // Update story stats
      // Update NGO stats
    }
  });

// When NGO name changes, update all related stories:
exports.onNGOUpdate = functions.firestore
  .document('ngos/{ngoId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().name !== change.before.data().name) {
      // Update denormalized ngoName in all stories
    }
  });
```

---

## Migration Considerations

**If Moving to PostgreSQL Post-MVP**:

1. **Users** → `users` table (straightforward)
2. **NGOs** → `ngos` table
3. **Stories** → `stories` table, `story_images` table (1:N for images)
4. **Donations** → `donations` table
5. **Admin Actions** → `audit_log` table

**JSON Fields** (for nested objects):
- `User.businessInfo` → JSONB column
- `NGO.stats` → JSONB column or separate `ngo_stats` table

---

## Summary

**Collections**: 5 main collections (users, ngos, stories, donations, admin_actions)

**Total Documents** (MVP target):
- Users: ~1,000
- NGOs: ~20
- Stories: ~100
- Donations: ~500
- Admin Actions: ~50

**Storage Estimate**: ~10MB for documents, ~500MB for images (Cloud Storage)

**Cost Estimate** (Firestore): <$5/month for MVP (free tier sufficient)

**Next Steps**: Generate API contracts based on this data model
