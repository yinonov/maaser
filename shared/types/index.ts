// Shared TypeScript types for HaMaaser platform
// Based on data-model.md from specs/001-mvp-platform-spec

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// User Types
// ============================================================================

export type ProfileType = 'donor' | 'ngo_admin';
export type Currency = 'ILS' | 'USD';
export type Language = 'he' | 'en';

export interface BusinessInfo {
  businessName: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface DonationStats {
  totalDonated: number;
  donationCount: number;
  lastDonationAt?: Timestamp;
}

export interface User {
  // Identity
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;

  // Role
  profileType: ProfileType;
  ngoIds?: string[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;

  // Business Info
  businessInfo?: BusinessInfo;

  // Preferences
  preferredCurrency: Currency;
  language: Language;
  emailNotifications: boolean;

  // Statistics
  donationStats?: DonationStats;
}

// ============================================================================
// NGO Types
// ============================================================================

export type NGOStatus = 'pending' | 'active' | 'suspended';

export interface NGOStats {
  totalDonationsReceived: number;
  totalDonors: number;
  activeStories: number;
  allTimeRaised: number;
}

export interface NGO {
  // Identity
  id: string;
  name: string;
  nameHe: string;
  slug: string;

  // Description
  description: string;
  descriptionHe: string;
  mission?: string;

  // Media
  logo: string;
  coverImage?: string;
  website?: string;

  // Legal
  taxExemptNumber: string;
  verified: boolean;

  // Contact
  email: string;
  phoneNumber: string;
  address?: string;

  // Admin Access
  adminUsers: string[];

  // Statistics
  stats: NGOStats;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: NGOStatus;
}

// ============================================================================
// Story Types
// ============================================================================

export type StoryStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export interface Story {
  // Identity
  id: string;
  ngoId: string;

  // Content (Bilingual)
  title: string;
  titleHe: string;
  shortDescription: string;
  shortDescriptionHe: string;
  description: string;
  descriptionHe: string;

  // Media
  images: string[];
  thumbnailImage: string;
  heroImage: string;
  videoUrl?: string;

  // Fundraising
  goalAmount?: number;
  raisedAmount: number;
  donationCount: number;

  // Publishing
  status: StoryStatus;
  publishedAt?: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;

  // Categorization
  tags: string[];
  category?: string;

  // Denormalized
  ngoName: string;
  ngoNameHe: string;
  ngoLogo: string;
  ngoVerified: boolean;

  // Analytics
  viewCount?: number;
  shareCount?: number;
}

// ============================================================================
// Donation Types
// ============================================================================

export type StripePaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';

export type DonationSource = 'mobile' | 'web';

export interface Donation {
  // Identity
  id: string;
  receiptNumber: string;

  // References
  userId: string;
  storyId: string;
  ngoId: string;

  // Payment Details
  amount: number;
  currency: Currency;
  platformFee: number;
  ngoAmount: number;

  // Stripe Integration
  stripePaymentIntentId: string;
  stripePaymentStatus: StripePaymentStatus;
  stripePaymentMethod: string;
  stripeCustomerId?: string;

  // Receipt
  receiptUrl?: string;
  receiptGenerated: boolean;
  receiptSent: boolean;
  receiptSentAt?: Timestamp;

  // User Preferences
  anonymous: boolean;
  message?: string;

  // Timestamps
  createdAt: Timestamp;
  paidAt?: Timestamp;
  refundedAt?: Timestamp;

  // Denormalized
  donorName: string;
  donorEmail: string;
  storyTitle: string;
  storyTitleHe: string;
  ngoName: string;
  ngoNameHe: string;

  // Analytics
  source?: DonationSource;
  campaignId?: string;
}

// ============================================================================
// Admin Action Types
// ============================================================================

export type AdminActionType =
  | 'approve_story'
  | 'reject_story'
  | 'suspend_ngo'
  | 'verify_ngo'
  | 'refund_donation';

export type ResourceType = 'story' | 'ngo' | 'user' | 'donation';

export interface AdminAction {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: AdminActionType;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Form Types (for validation)
// ============================================================================

export interface CreateStoryInput {
  ngoId: string;
  title: string;
  titleHe: string;
  shortDescription: string;
  shortDescriptionHe: string;
  description: string;
  descriptionHe: string;
  goalAmount?: number;
  tags: string[];
  category?: string;
}

export interface UpdateStoryInput extends Partial<CreateStoryInput> {
  status?: StoryStatus;
}

export interface CreateDonationInput {
  storyId: string;
  amount: number;
  currency: Currency;
  anonymous: boolean;
  message?: string;
  source: DonationSource;
}

export interface UpdateUserProfileInput {
  displayName?: string;
  phoneNumber?: string;
  businessInfo?: BusinessInfo;
  preferredCurrency?: Currency;
  language?: Language;
  emailNotifications?: boolean;
}
