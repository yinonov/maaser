# Payment API Contract

**Service**: Firebase Cloud Functions  
**Base URL**: `https://us-central1-hamaaser-prod.cloudfunctions.net`  
**Authentication**: Firebase Auth token required (except webhooks)

---

## POST /createPaymentIntent

**Purpose**: Create Stripe payment intent before donation checkout

**Authentication**: Required (Firebase Auth)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "storyId": "story_sarah_medical",
  "amount": 10000,
  "currency": "ILS",
  "anonymous": false,
  "message": "Wishing Sarah a speedy recovery!"
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| storyId | string | Yes | Story document ID |
| amount | number | Yes | Amount in agorot (100₪ = 10000) |
| currency | string | Yes | "ILS" or "USD" |
| anonymous | boolean | No | Hide donor name from NGO (default: false) |
| message | string | No | Message to NGO (max 500 chars) |

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_abc123_secret_xyz789",
    "donationId": "donation_def456",
    "platformFee": 200,
    "ngoAmount": 9800
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| clientSecret | string | Stripe payment intent secret for checkout |
| donationId | string | Firestore donation document ID |
| platformFee | number | Platform fee in agorot (2% of amount) |
| ngoAmount | number | Amount NGO receives (amount - platformFee) |

**Response** (Error - 400):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be at least 500 agorot (5₪)"
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_AMOUNT | 400 | Amount below minimum or invalid |
| STORY_NOT_FOUND | 404 | Story ID doesn't exist |
| STORY_NOT_ACTIVE | 400 | Story is not in active status |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| STRIPE_ERROR | 500 | Stripe API error |

**Example Usage** (React Native):

```typescript
const response = await fetch(
  'https://us-central1-hamaaser-prod.cloudfunctions.net/createPaymentIntent',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firebaseAuthToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      storyId: 'story_sarah_medical',
      amount: 10000,
      currency: 'ILS',
      anonymous: false,
    }),
  }
);

const data = await response.json();
if (data.success) {
  // Open Stripe Checkout with clientSecret
  openStripeCheckout(data.data.clientSecret);
}
```

---

## POST /handleStripeWebhook

**Purpose**: Receive payment confirmation from Stripe

**Authentication**: Stripe signature verification (not Firebase Auth)

**Request Headers**:

```http
stripe-signature: t=1234567890,v1=abc123...
Content-Type: application/json
```

**Request Body**: Stripe webhook event payload (varies by event type)

**Handled Event Types**:

1. `payment_intent.succeeded` - Payment completed
2. `payment_intent.payment_failed` - Payment failed
3. `charge.refunded` - Donation refunded

**Event: payment_intent.succeeded**:

```json
{
  "id": "evt_abc123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount": 10000,
      "currency": "ils",
      "status": "succeeded",
      "metadata": {
        "donationId": "donation_def456"
      }
    }
  }
}
```

**Processing Logic**:

1. Verify Stripe signature
2. Extract donation ID from metadata
3. Update Firestore donation document:
   - Set `stripePaymentStatus` to 'succeeded'
   - Set `paidAt` timestamp
4. Update story raised amount
5. Update user donation stats
6. Trigger receipt generation
7. Send email notification

**Response** (Success - 200):

```json
{
  "received": true
}
```

**Response** (Error - 400):

```json
{
  "error": "Invalid signature"
}
```

---

## POST /generateReceipt

**Purpose**: Generate PDF receipt for donation

**Authentication**: Required (Firebase Auth)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "donationId": "donation_def456"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "receiptUrl": "https://storage.googleapis.com/hamaaser-prod/receipts/RCP-2025-00123.pdf",
    "receiptNumber": "RCP-2025-00123"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| receiptUrl | string | Cloud Storage URL for PDF download |
| receiptNumber | string | Unique receipt identifier |

**Receipt PDF Contents**:

- HaMaaser logo and branding
- Receipt number
- Donor information (name, address, tax ID if business)
- NGO information (name, tax-exempt number)
- Donation details (amount, date, story)
- Platform fee breakdown
- QR code for verification (links to receipt URL)
- Digital signature

**Response** (Error - 404):

```json
{
  "success": false,
  "error": {
    "code": "DONATION_NOT_FOUND",
    "message": "Donation ID does not exist"
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| DONATION_NOT_FOUND | 404 | Donation ID doesn't exist |
| PAYMENT_NOT_COMPLETE | 400 | Payment hasn't succeeded yet |
| UNAUTHORIZED | 401 | User doesn't own this donation |
| PDF_GENERATION_ERROR | 500 | PDFKit error |

---

## POST /refundDonation

**Purpose**: Process donation refund (admin only)

**Authentication**: Required (Platform admin only)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "donationId": "donation_def456",
  "reason": "Donor requested refund within 7-day window"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "refundId": "re_abc123",
    "amount": 10000,
    "status": "succeeded"
  }
}
```

**Processing Logic**:

1. Verify admin permissions
2. Check if within 7-day refund window
3. Call Stripe refund API
4. Update Firestore donation document (status → 'refunded')
5. Reverse statistics (user, story, NGO)
6. Send notification emails (donor + NGO)
7. Log admin action

**Response** (Error - 403):

```json
{
  "success": false,
  "error": {
    "code": "REFUND_WINDOW_EXPIRED",
    "message": "Refund window (7 days) has expired"
  }
}
```

---

## Security Rules

**Rate Limiting**:

- `createPaymentIntent`: Max 5 requests per minute per user
- `generateReceipt`: Max 10 requests per minute per user
- `handleStripeWebhook`: No limit (Stripe controlled)

**Input Validation**:

- Amount: Minimum 500 agorot (5₪), maximum 10,000,000 agorot (100,000₪)
- Story ID: Must exist and be active
- Currency: Only "ILS" or "USD"
- Message: Max 500 characters, sanitize HTML

**Stripe Webhook Security**:

- Verify signature using Stripe webhook secret
- Reject requests with invalid/missing signatures
- Log all webhook events for audit

---

## Testing

**Test Cards** (Stripe Test Mode):

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

**Test Webhook Events**:

```bash
stripe trigger payment_intent.succeeded
```

**Integration Test Flow**:

1. Create payment intent → Get client secret
2. Complete Stripe checkout (test card)
3. Webhook triggers → Donation status updates
4. Generate receipt → PDF created
5. Download receipt → Verify contents
