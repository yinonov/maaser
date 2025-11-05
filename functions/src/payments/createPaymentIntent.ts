// Create Payment Intent Cloud Function
// Handles donation payment intent creation via Stripe

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import stripe, { calculatePlatformFee, calculateNGOAmount } from '../utils/stripe';
import { validateRequest } from '../utils/validation';
import { handleError } from '../utils/errorHandler';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

interface CreatePaymentIntentRequest {
  storyId: string;
  amount: number; // Amount in agorot (cents)
  message?: string;
  isAnonymous?: boolean;
}

export const createPaymentIntent = functions.https.onRequest(async (req, res) => {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Parse and validate request body
    const requestData: CreatePaymentIntentRequest = req.body;

    if (!requestData.storyId) {
      res.status(400).json({ error: 'storyId is required' });
      return;
    }

    if (!requestData.amount || requestData.amount < 500) {
      res.status(400).json({ error: 'Amount must be at least 500 agorot (5₪)' });
      return;
    }

    // Validate story exists and is active
    const storyRef = db.collection('stories').doc(requestData.storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    const storyData = storyDoc.data();
    if (storyData?.status !== 'active') {
      res.status(400).json({ error: 'Story is not active' });
      return;
    }

    // Calculate fees
    const platformFee = calculatePlatformFee(requestData.amount);
    const ngoAmount = calculateNGOAmount(requestData.amount);

    logInfo('Creating payment intent', {
      userId,
      storyId: requestData.storyId,
      amount: requestData.amount,
      platformFee,
      ngoAmount,
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: requestData.amount,
      currency: 'ils',
      metadata: {
        userId,
        storyId: requestData.storyId,
        ngoId: storyData.ngoId,
        platformFee: platformFee.toString(),
        ngoAmount: ngoAmount.toString(),
      },
      description: `Donation to ${storyData.titleHe || storyData.title}`,
    });

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create donation document in Firestore
    const donationRef = db.collection('donations').doc();
    await donationRef.set({
      id: donationRef.id,
      userId,
      userEmail: userData?.email || null,
      userName: requestData.isAnonymous ? null : (userData?.displayName || null),
      storyId: requestData.storyId,
      storyTitle: storyData.titleHe || storyData.title,
      ngoId: storyData.ngoId,
      ngoName: storyData.ngoNameHe || storyData.ngoName,
      amount: requestData.amount,
      platformFee,
      ngoAmount,
      currency: 'ILS',
      status: 'pending',
      message: requestData.message || null,
      isAnonymous: requestData.isAnonymous || false,
      paymentIntentId: paymentIntent.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: null,
      receiptNumber: null,
      receiptUrl: null,
      receiptGenerated: false,
      receiptSent: false,
    });

    logInfo('Payment intent created successfully', {
      donationId: donationRef.id,
      paymentIntentId: paymentIntent.id,
    });

    // Return client secret and donation ID
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      donationId: donationRef.id,
    });
  } catch (error: any) {
    logError('Error creating payment intent', error);
    handleError(error, res);
  }
});
