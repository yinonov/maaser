/**
 * Create Story Cloud Function
 * POST /stories
 * 
 * Creates a new beneficiary story (requires NGO admin role)
 * Per contracts/story-api.md
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { validateStoryInput } from '../utils/validation';
import { handleCallableError } from '../utils/errorHandler';

export const createStory = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create stories'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    // Get user document to verify NGO admin role
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (userData?.profileType !== 'ngo_admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only NGO admins can create stories'
      );
    }

    // Verify user is admin of the specified NGO
    const ngoId = data.ngoId;
    if (!userData?.ngoIds || !userData.ngoIds.includes(ngoId)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are not an admin of this NGO'
      );
    }

    // Validate required fields
    const validationError = validateStoryInput(data);
    if (validationError) {
      throw new functions.https.HttpsError('invalid-argument', validationError);
    }

    // Get NGO data for denormalization
    const ngoDoc = await db.collection('ngos').doc(ngoId).get();
    if (!ngoDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'NGO not found');
    }

    const ngoData = ngoDoc.data();

    // Create story document
    const storyData = {
      ngoId: ngoId,
      
      // Content (bilingual)
      title: data.title,
      titleHe: data.titleHe,
      shortDescription: data.shortDescription,
      shortDescriptionHe: data.shortDescriptionHe,
      description: data.description,
      descriptionHe: data.descriptionHe,
      
      // Media
      images: data.images || [],
      thumbnailImage: data.images?.[0] || '',
      heroImage: data.images?.[0] || '',
      videoUrl: data.videoUrl || null,
      
      // Fundraising
      goalAmount: data.goalAmount || null,
      raisedAmount: 0,
      donationCount: 0,
      
      // Publishing
      status: 'pending_approval',
      publishedAt: null,
      approvedAt: null,
      approvedBy: null,
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      
      // Categorization
      tags: data.tags || [],
      category: data.category || null,
      
      // Denormalized NGO data
      ngoName: ngoData?.name || '',
      ngoNameHe: ngoData?.nameHe || '',
      ngoLogo: ngoData?.logo || '',
      ngoVerified: ngoData?.verified || false,
      
      // Analytics
      viewCount: 0,
      shareCount: 0,
    };

    const storyRef = await db.collection('stories').add(storyData);

    // Send notification to platform admin (optional - can be implemented later)
    // await sendAdminNotification(storyRef.id, userData.email);

    return {
      success: true,
      data: {
        storyId: storyRef.id,
        status: 'pending_approval',
        message: 'Story submitted for approval. You will be notified when it\'s live.',
      },
    };
  } catch (error: any) {
    console.error('Error creating story:', error);
    return handleCallableError(error);
  }
});
