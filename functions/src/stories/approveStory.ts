/**
 * Approve Story Cloud Function
 * POST /stories/:storyId/approve
 * 
 * Approve or reject a pending story (platform admin only)
 * Per contracts/story-api.md
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleCallableError } from '../utils/errorHandler';

export const approveStory = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to approve stories'
      );
    }

    const userId = context.auth.uid;
    const { storyId, approved, notes, reason } = data;

    if (!storyId) {
      throw new functions.https.HttpsError('invalid-argument', 'Story ID is required');
    }

    if (approved === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Approval status is required');
    }

    const db = admin.firestore();

    // Verify platform admin role
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (userData?.profileType !== 'platform_admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only platform admins can approve stories'
      );
    }

    // Get story document
    const storyRef = db.collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Story not found');
    }

    const storyData = storyDoc.data();

    // Prepare update based on approval/rejection
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (approved) {
      // Approve story
      updates.status = 'active';
      updates.publishedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.approvedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.approvedBy = userId;
      if (notes) {
        updates.approvalNotes = notes;
      }
    } else {
      // Reject story
      updates.status = 'draft';
      updates.rejectionReason = reason || 'Story does not meet quality standards';
      updates.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.rejectedBy = userId;
    }

    // Update the story
    await storyRef.update(updates);

    // Create audit log
    await db.collection('admin_actions').add({
      action: approved ? 'approve_story' : 'reject_story',
      resourceType: 'story',
      resourceId: storyId,
      performedBy: userId,
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        storyTitle: storyData?.title,
        ngoId: storyData?.ngoId,
        notes: notes || reason,
      },
    });

    // Send notification email to NGO admin (optional - can be implemented later)
    if (approved) {
      // await sendApprovalEmail(storyData?.createdBy, storyId);
      console.log(`Story ${storyId} approved - notification email pending implementation`);
    } else {
      // await sendRejectionEmail(storyData?.createdBy, storyId, reason);
      console.log(`Story ${storyId} rejected - notification email pending implementation`);
    }

    return {
      success: true,
      data: {
        storyId: storyId,
        status: updates.status,
        ...(approved && { publishedAt: new Date().toISOString() }),
        ...(! approved && { rejectionReason: updates.rejectionReason }),
      },
    };
  } catch (error: any) {
    console.error('Error approving story:', error);
    return handleCallableError(error);
  }
});
