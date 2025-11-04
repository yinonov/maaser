# Story Management API Contract

**Service**: Firebase Cloud Functions + Firestore Direct Access  
**Base URL**: `https://us-central1-hamaaser-prod.cloudfunctions.net`  
**Authentication**: Firebase Auth token required

---

## GET /stories

**Purpose**: Get list of active stories for donor feed

**Authentication**: Optional (public endpoint)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of stories to return (default: 10, max: 50) |
| offset | number | No | Pagination offset (default: 0) |
| ngoId | string | No | Filter by NGO ID |
| tag | string | No | Filter by tag (e.g., "medical", "urgent") |
| sortBy | string | No | Sort field: "recent" (default), "popular", "neediest" |

**Request Example**:

```http
GET /stories?limit=10&sortBy=recent
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": "story_sarah_medical",
        "title": "Help Sarah's Family with Medical Bills",
        "titleHe": "עזרו למשפחת שרה עם חשבונות רפואיים",
        "shortDescription": "Sarah, a mother of three from Netanya...",
        "shortDescriptionHe": "שרה, אמא לשלושה מנתניה...",
        "thumbnailImage": "https://storage.googleapis.com/...",
        "goalAmount": 5000000,
        "raisedAmount": 1250000,
        "donationCount": 24,
        "ngoName": "Moshe Kato Foundation",
        "ngoNameHe": "קרן משה קטו",
        "ngoLogo": "https://storage.googleapis.com/...",
        "ngoVerified": true,
        "publishedAt": "2025-11-01T09:00:00Z",
        "tags": ["medical", "family", "urgent"]
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Firestore Query** (Direct from mobile/web):

```typescript
const storiesRef = firestore.collection('stories');
const query = storiesRef
  .where('status', '==', 'active')
  .orderBy('publishedAt', 'desc')
  .limit(10);

const snapshot = await query.get();
const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

---

## GET /stories/:storyId

**Purpose**: Get single story details

**Authentication**: Optional (public endpoint for active stories)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| storyId | string | Story document ID |

**Request Example**:

```http
GET /stories/story_sarah_medical
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "id": "story_sarah_medical",
    "title": "Help Sarah's Family with Medical Bills",
    "titleHe": "עזרו למשפחת שרה עם חשבונות רפואיים",
    "description": "Full story text (300-500 words)...",
    "descriptionHe": "טקסט סיפור מלא...",
    "images": [
      "https://storage.googleapis.com/.../sarah_1.jpg",
      "https://storage.googleapis.com/.../sarah_2.jpg"
    ],
    "heroImage": "https://storage.googleapis.com/.../sarah_hero.jpg",
    "videoUrl": "https://youtube.com/embed/...",
    "goalAmount": 5000000,
    "raisedAmount": 1250000,
    "donationCount": 24,
    "progressPercentage": 25,
    "ngoId": "ngo_moshe_kato_foundation",
    "ngoName": "Moshe Kato Foundation",
    "ngoNameHe": "קרן משה קטו",
    "ngoLogo": "https://storage.googleapis.com/...",
    "ngoVerified": true,
    "ngoDescription": "Supporting families in need...",
    "publishedAt": "2025-11-01T09:00:00Z",
    "tags": ["medical", "family", "urgent"],
    "category": "health"
  }
}
```

**Response** (Error - 404):

```json
{
  "success": false,
  "error": {
    "code": "STORY_NOT_FOUND",
    "message": "Story does not exist"
  }
}
```

**Firestore Query** (Direct):

```typescript
const storyRef = firestore.collection('stories').doc(storyId);
const snapshot = await storyRef.get();

if (!snapshot.exists) {
  throw new Error('Story not found');
}

const story = { id: snapshot.id, ...snapshot.data() };
```

---

## POST /stories (NGO Admin)

**Purpose**: Create new story (requires NGO admin role)

**Authentication**: Required (NGO admin)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ngoId | string | Yes | NGO ID (must be admin of this NGO) |
| title | string | Yes | English title |
| titleHe | string | Yes | Hebrew title |
| shortDescription | string | Yes | Brief description (2-3 sentences) |
| shortDescriptionHe | string | Yes | Hebrew brief description |
| description | string | Yes | Full story (300-500 words) |
| descriptionHe | string | Yes | Hebrew full story |
| goalAmount | number | No | Fundraising goal in agorot |
| tags | string[] | Yes | Array of tags (min 1, max 5) |
| category | string | Yes | "health", "education", "housing", "emergency" |
| images | File[] | Yes | Image files (min 1, max 5, max 5MB each) |
| videoUrl | string | No | YouTube/Vimeo embed URL |

**Request Example** (Multipart Form):

```typescript
const formData = new FormData();
formData.append('ngoId', 'ngo_moshe_kato_foundation');
formData.append('title', 'Help Sarah\'s Family');
formData.append('titleHe', 'עזרו למשפחת שרה');
formData.append('shortDescription', 'Sarah, a mother of three...');
formData.append('goalAmount', '5000000');
formData.append('tags', JSON.stringify(['medical', 'family']));
formData.append('category', 'health');
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const response = await fetch('/stories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
  body: formData,
});
```

**Response** (Success - 201):

```json
{
  "success": true,
  "data": {
    "storyId": "story_new_abc123",
    "status": "pending_approval",
    "message": "Story submitted for approval. You will be notified when it's live."
  }
}
```

**Processing Logic**:

1. Verify user is NGO admin for specified NGO
2. Validate all required fields
3. Upload images to Cloud Storage (resize to thumbnails)
4. Create story document with status 'pending_approval'
5. Send notification to platform admin for review
6. Return story ID

**Response** (Error - 403):

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_NGO",
    "message": "You are not an admin of this NGO"
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED_NGO | 403 | User is not admin of specified NGO |
| INVALID_IMAGES | 400 | Image validation failed (size/format) |
| MISSING_REQUIRED_FIELD | 400 | Required field missing |
| UPLOAD_FAILED | 500 | Cloud Storage upload error |

---

## PUT /stories/:storyId (NGO Admin)

**Purpose**: Update existing story

**Authentication**: Required (NGO admin for this story's NGO)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body** (JSON - partial updates allowed):

```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "goalAmount": 6000000,
  "status": "paused"
}
```

**Allowed Fields to Update**:

- title, titleHe
- shortDescription, shortDescriptionHe
- description, descriptionHe
- goalAmount
- tags, category
- videoUrl
- status (NGO admin can only set 'active' or 'paused')

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "storyId": "story_sarah_medical",
    "updated": true,
    "fieldsUpdated": ["title", "goalAmount"]
  }
}
```

**Note**: If story is already approved and active, updates to title/description require re-approval (status reverts to 'pending_approval').

---

## DELETE /stories/:storyId (NGO Admin)

**Purpose**: Delete story (soft delete - archives it)

**Authentication**: Required (NGO admin or platform admin)

**Request Example**:

```http
DELETE /stories/story_sarah_medical
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "storyId": "story_sarah_medical",
    "status": "archived",
    "message": "Story archived successfully"
  }
}
```

**Processing Logic**:

1. Verify permissions (NGO admin or platform admin)
2. Update story status to 'archived' (don't actually delete)
3. Remove from active feed
4. Keep donation records intact (for audit trail)

---

## POST /stories/:storyId/approve (Platform Admin Only)

**Purpose**: Approve pending story for publication

**Authentication**: Required (platform admin only)

**Request Headers**:

```http
Authorization: Bearer <firebase_auth_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "approved": true,
  "notes": "Looks good, approved for publication"
}
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "storyId": "story_sarah_medical",
    "status": "active",
    "publishedAt": "2025-11-04T10:00:00Z"
  }
}
```

**Processing Logic**:

1. Verify platform admin role
2. Update story status to 'active'
3. Set `publishedAt` and `approvedBy` fields
4. Send notification email to NGO admin
5. Story now visible in donor feed

**Rejection** (approved: false):

```json
{
  "approved": false,
  "reason": "Images do not meet quality standards. Please re-upload."
}
```

**Response** (Rejection):

```json
{
  "success": true,
  "data": {
    "storyId": "story_sarah_medical",
    "status": "draft",
    "rejectionReason": "Images do not meet quality standards..."
  }
}
```

---

## GET /ngos/:ngoId/stories (NGO Dashboard)

**Purpose**: Get all stories for NGO (including drafts/pending)

**Authentication**: Required (NGO admin)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: "draft", "pending_approval", "active", "paused" |
| limit | number | No | Number of stories (default: 20) |
| offset | number | No | Pagination offset |

**Request Example**:

```http
GET /ngos/ngo_moshe_kato_foundation/stories?status=active
Authorization: Bearer <firebase_auth_token>
```

**Response** (Success - 200):

```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": "story_sarah_medical",
        "title": "Help Sarah's Family with Medical Bills",
        "status": "active",
        "raisedAmount": 1250000,
        "goalAmount": 5000000,
        "donationCount": 24,
        "viewCount": 342,
        "publishedAt": "2025-11-01T09:00:00Z",
        "createdAt": "2025-10-30T14:00:00Z"
      }
    ],
    "stats": {
      "totalStories": 8,
      "activeStories": 5,
      "pendingApproval": 2,
      "drafts": 1
    }
  }
}
```

---

## Security Rules

**Authorization**:

- Public read: Only stories with status 'active'
- NGO admin read: All stories for their NGO
- NGO admin write: Create/update stories for their NGO
- Platform admin: Full access to all stories

**Input Validation**:

- Title: Max 100 characters
- Short description: Max 300 characters
- Description: Max 5000 characters
- Images: Max 5, 5MB each, JPEG/PNG only
- Tags: Min 1, max 5
- Goal amount: Min 50000 (500₪), max 100000000 (1M₪)

**Rate Limiting**:

- Story creation: Max 5 per hour per NGO
- Story updates: Max 20 per hour per NGO

---

## Firestore Queries Summary

**Donor Feed** (read active stories):

```typescript
firestore.collection('stories')
  .where('status', '==', 'active')
  .orderBy('publishedAt', 'desc')
  .limit(10)
```

**NGO Dashboard** (read NGO's stories):

```typescript
firestore.collection('stories')
  .where('ngoId', '==', ngoId)
  .orderBy('createdAt', 'desc')
```

**Platform Admin** (pending approval):

```typescript
firestore.collection('stories')
  .where('status', '==', 'pending_approval')
  .orderBy('createdAt', 'asc')
```
