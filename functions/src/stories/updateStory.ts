/**
 * Update Story Cloud Function
 * PUT /stories/:storyId
 * 
 * Updates an existing story (requires NGO admin or platform admin role)
 * Per contracts/story-api.md
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleCallableError } from '../utils/errorHandler';

export const updateStory = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update stories'
      );
    }

    const userId = context.auth.uid;
    const { storyId, ...updateData } = data;

    if (!storyId) {
      throw new functions.https.HttpsError('invalid-argument', 'Story ID is required');
    }

    const db = admin.firestore();

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const isPlatformAdmin = userData?.profileType === 'platform_admin';
    const isNgoAdmin = userData?.profileType === 'ngo_admin';

    // Get story document
    const storyRef = db.collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Story not found');
    }

    const storyData = storyDoc.data();

    // Verify permissions
    if (!isPlatformAdmin) {
      // NGO admin must be admin of the story's NGO
      if (!isNgoAdmin || !userData?.ngoIds || !userData.ngoIds.includes(storyData?.ngoId)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to update this story'
        );
      }
    }

    // Prepare update object
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Allowed fields for NGO admin
    const allowedFields = [
      'title',
      'titleHe',
      'shortDescription',
      'shortDescriptionHe',
      'description',
      'descriptionHe',
      'goalAmount',
      'tags',
      'category',
      'videoUrl',
    ];

    // Platform admin can also change status
    if (isPlatformAdmin) {
      allowedFields.push('status');
    }

    // Copy allowed fields from updateData
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    // NGO admin can pause/activate their own stories
    if (!isPlatformAdmin && updateData.status) {
      const allowedStatuses = ['paused', 'active'];
      if (!allowedStatuses.includes(updateData.status)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'NGO admins can only pause or activate stories'
        );
      }
      updates.status = updateData.status;
    }

    // If critical fields changed on active story, revert to pending_approval
    const criticalFields = ['title', 'titleHe', 'description', 'descriptionHe'];
    const criticalFieldChanged = criticalFields.some(field => updateData[field] !== undefined);
    
    if (storyData?.status === 'active' && criticalFieldChanged && !isPlatformAdmin) {
      updates.status = 'pending_approval';
      updates.approvedAt = null;
      updates.approvedBy = null;
    }

    // Update the story
    await storyRef.update(updates);

    return {
      success: true,
      data: {
        storyId: storyId,
        updated: true,
        fieldsUpdated: Object.keys(updateData),
        ...(updates.status && { statusChanged: updates.status }),
      },
    };
  } catch (error: any) {
    console.error('Error updating story:', error);
    return handleCallableError(error);
  }
});
