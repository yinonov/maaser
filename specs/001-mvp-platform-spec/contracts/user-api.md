# User Management API Contract

**Service**: Firebase Authentication + Firestore  
**Base URL**: `https://us-central1-hamaaser-prod.cloudfunctions.net`  
**Authentication**: Firebase Auth token required

---

## POST /auth/register

**Purpose**: Register new user (donor or NGO admin)

**Authentication**: Not required (public endpoint)

**Request Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "donor@example.com",
  "password": "securePassword123!",
  "fullName": "David Cohen",
  "fullNameHe": "דוד כהן",
  "phone": "+972501234567",
  "preferredLanguage": "he"
}
```

**Field Requirements**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| password | string | Yes | Min 8 chars, 1 uppercase, 1 number, 1 special |
| fullName | string | Yes | Max 100 chars |
| fullNameHe | string | No | Hebrew name |
| phone | string | Yes | E.164 format (for SMS receipts) |
| preferredLanguage | string | No | "en" or "he" (default: "he") |

**Response** (Success - 201):

```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "donor@example.com",
    "emailVerified": false,
    "message": "Verification email sent to donor@example.com"
  }
}
```

**Processing Logic**:

1. Create Firebase Auth user with email/password
2. Send email verification link
3. Create user document in Firestore `users` collection
4. Set role to 'donor' by default
5. Return user ID and verification status

**Response** (Error - 400):

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "User with this email already exists"
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| EMAIL_ALREADY_EXISTS | 400 | Email is registered |
| WEAK_PASSWORD | 400 | Password doesn't meet requirements |
| INVALID_PHONE | 400 | Phone number format invalid |

---

## POST /auth/login

**Purpose**: Authenticate user and get Firebase token

**Note**: This uses Firebase Auth SDK directly on client, not HTTP endpoint. Documented here for completeness.

**Client-Side Implementation** (React Native):

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';

const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    return {
      success: true,
      userId: userCredential.user.uid,
      email: userCredential.user.email,
      token: token,
      emailVerified: userCredential.user.emailVerified
    };
  } catch (error) {
    return {
      success: false,
      error: error.code // 'auth/wrong-password', 'auth/user-not-found', etc.
    };
  }
};
```

---

## POST /auth/verify-email

**Purpose**: Resend email verification link

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "message": "Verification email sent to donor@example.com"
}
```

---

## GET /users/me

**Purpose**: Get current user profile

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "donor@example.com",
    "emailVerified": true,
    "fullName": "David Cohen",
    "fullNameHe": "דוד כהן",
    "phone": "+972501234567",
    "preferredLanguage": "he",
    "role": "donor",
    "profileComplete": true,
    "totalDonated": 2500000,
    "donationCount": 8,
    "receiptPreferences": {
      "emailReceipts": true,
      "smsReceipts": false,
      "monthlyDigest": true
    },
    "ngoAffiliation": null,
    "createdAt": "2025-10-15T08:00:00Z",
    "lastLoginAt": "2025-11-04T09:30:00Z"
  }
}
```

**Firestore Query**:

```typescript
const userId = context.auth.uid; // From Firebase Auth token
const userRef = firestore.collection('users').doc(userId);
const snapshot = await userRef.get();

if (!snapshot.exists) {
  throw new Error('User not found');
}

const user = snapshot.data();
```

---

## PUT /users/me

**Purpose**: Update current user profile

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body** (partial updates allowed):

```json
{
  "fullName": "David Yakov Cohen",
  "phone": "+972507654321",
  "preferredLanguage": "en",
  "receiptPreferences": {
    "emailReceipts": true,
    "smsReceipts": true,
    "monthlyDigest": false
  }
}
```

**Allowed Fields to Update**:

- fullName, fullNameHe
- phone
- preferredLanguage
- receiptPreferences (object)

**Protected Fields** (cannot be updated):

- email (requires Firebase Auth password re-entry)
- role (requires admin action)
- totalDonated, donationCount (auto-calculated)

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "updated": true,
    "fieldsUpdated": ["fullName", "phone"]
  }
}
```

---

## GET /users/me/donations

**Purpose**: Get user's donation history

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of donations (default: 20, max: 100) |
| offset | number | No | Pagination offset |
| storyId | string | No | Filter by specific story |
| startDate | string | No | ISO 8601 date (e.g., "2025-01-01") |
| endDate | string | No | ISO 8601 date |

**Request Example**:

```http
GET /users/me/donations?limit=10&startDate=2025-01-01
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "donations": [
      {
        "donationId": "don_xyz789",
        "amount": 500000,
        "amountDisplay": "5,000₪",
        "storyId": "story_sarah_medical",
        "storyTitle": "Help Sarah's Family with Medical Bills",
        "ngoName": "Moshe Kato Foundation",
        "ngoLogo": "https://storage.googleapis.com/...",
        "donatedAt": "2025-11-02T14:30:00Z",
        "receiptUrl": "https://storage.googleapis.com/.../receipt_xyz789.pdf",
        "status": "completed",
        "taxDeductible": true
      }
    ],
    "summary": {
      "totalAmount": 2500000,
      "totalCount": 8,
      "taxDeductibleAmount": 2500000,
      "yearToDate": 1800000
    },
    "pagination": {
      "total": 8,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Firestore Query**:

```typescript
const userId = context.auth.uid;
const donationsRef = firestore.collection('donations');
const query = donationsRef
  .where('donorId', '==', userId)
  .orderBy('donatedAt', 'desc')
  .limit(20);

const snapshot = await query.get();
const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

---

## GET /users/me/tax-summary

**Purpose**: Get annual tax summary for receipt generation

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | Yes | Tax year (e.g., 2025) |

**Request Example**:

```http
GET /users/me/tax-summary?year=2025
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "year": 2025,
    "totalDonated": 2500000,
    "totalTaxDeductible": 2500000,
    "donationCount": 8,
    "donationsByNgo": [
      {
        "ngoId": "ngo_moshe_kato_foundation",
        "ngoName": "Moshe Kato Foundation",
        "ngoTaxId": "580012345",
        "totalDonated": 1500000,
        "donationCount": 5
      },
      {
        "ngoId": "ngo_yad_sarah",
        "ngoName": "Yad Sarah",
        "ngoTaxId": "580023456",
        "totalDonated": 1000000,
        "donationCount": 3
      }
    ],
    "receipts": [
      {
        "receiptNumber": "2025-000123",
        "donationId": "don_xyz789",
        "amount": 500000,
        "date": "2025-11-02",
        "downloadUrl": "https://storage.googleapis.com/.../receipt_xyz789.pdf"
      }
    ]
  }
}
```

---

## POST /users/me/tax-summary/export

**Purpose**: Generate annual tax summary PDF

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "year": 2025,
  "format": "pdf",
  "language": "he"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "documentUrl": "https://storage.googleapis.com/.../tax_summary_2025_usr_abc123xyz.pdf",
    "expiresAt": "2025-11-11T10:00:00Z"
  }
}
```

**Processing Logic**:

1. Query all donations for specified year
2. Group by NGO and generate summary
3. Render PDF with Hebrew/English based on language
4. Upload to Cloud Storage with 7-day expiration
5. Return download URL

---

## DELETE /users/me

**Purpose**: Delete user account (GDPR compliance)

**Authentication**: Required + Password re-entry

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "password": "currentPassword123!",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "message": "Account deleted successfully. Donation records retained for tax compliance."
}
```

**Processing Logic**:

1. Re-authenticate user with password
2. Verify confirmation text matches
3. Delete user from Firebase Auth
4. Anonymize user document (remove PII, keep donations for audit)
5. Schedule donation records for deletion after 7 years (tax law)

---

## POST /users/me/change-email

**Purpose**: Change user email address

**Authentication**: Required + Password re-entry

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "newEmail": "newemail@example.com",
  "password": "currentPassword123!"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "newEmail": "newemail@example.com",
    "emailVerified": false,
    "message": "Verification email sent to newemail@example.com"
  }
}
```

**Processing Logic**:

1. Re-authenticate with current password
2. Update email in Firebase Auth
3. Send verification email to new address
4. Update user document in Firestore
5. Return verification status

---

## POST /users/me/change-password

**Purpose**: Change user password

**Authentication**: Required + Current password

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newSecurePassword456!"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Note**: This uses Firebase Auth SDK directly:

```typescript
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
```

---

## GET /users/:userId (Platform Admin Only)

**Purpose**: Get any user's profile (admin debugging)

**Authentication**: Required (platform admin only)

**Request Example**:

```http
GET /users/usr_abc123xyz
Authorization: Bearer <admin_firebase_auth_token>
```

**Response**: Same as GET /users/me but for specified user

---

## Security Rules

**Firestore Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read/write their own document
      allow read, write: if request.auth.uid == userId;
      
      // Platform admins can read all users
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'platform_admin';
      
      // Prevent role escalation
      allow update: if request.auth.uid == userId && 
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
    }
  }
}
```

**Input Validation**:

- Full name: Max 100 characters
- Phone: E.164 format validation
- Email: RFC 5322 format
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special character

**Rate Limiting**:

- Profile updates: Max 10 per hour per user
- Email changes: Max 3 per day per user
- Password resets: Max 5 per day per IP

---

## Client-Side Authentication Flow

**Registration**:

```typescript
// 1. Register with Firebase Auth
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// 2. Create Firestore user document
await setDoc(doc(firestore, 'users', userCredential.user.uid), {
  email: email,
  fullName: fullName,
  fullNameHe: fullNameHe,
  phone: phone,
  preferredLanguage: preferredLanguage,
  role: 'donor',
  createdAt: serverTimestamp()
});

// 3. Send verification email
await sendEmailVerification(userCredential.user);
```

**Login**:

```typescript
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await userCredential.user.getIdToken();

// Store token for API calls
AsyncStorage.setItem('authToken', token);
```

**Token Refresh** (automatic with Firebase SDK):

```typescript
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(true); // Force refresh
    AsyncStorage.setItem('authToken', token);
  }
});
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or expired auth token |
| USER_NOT_FOUND | 404 | User document doesn't exist |
| EMAIL_ALREADY_EXISTS | 400 | Email is already registered |
| WEAK_PASSWORD | 400 | Password doesn't meet security requirements |
| INVALID_PHONE | 400 | Phone number format invalid |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| WRONG_PASSWORD | 401 | Incorrect password for re-authentication |

---

## Testing

**Test Users** (Seed Data):

```json
{
  "email": "test.donor@hamaaser.org",
  "password": "TestPass123!",
  "fullName": "Test Donor",
  "role": "donor"
}
```

**Test Scenarios**:

1. Register new user → Verify email sent → Login
2. Update profile → Check Firestore document updated
3. View donation history → Verify pagination
4. Generate tax summary → Download PDF
5. Change email → Re-verify new email
6. Delete account → Verify PII removed, donations retained
