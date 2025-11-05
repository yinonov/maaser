// Stripe Webhook Handler
// Processes Stripe webhook events for payment status updates

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import stripe from '../utils/stripe';
import { logInfo, logError, logAudit } from '../utils/logger';

const db = admin.firestore();

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      logError('Webhook signature verification failed', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    logInfo('Received Stripe webhook', {
      type: event.type,
      id: event.id,
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        logInfo('Unhandled webhook event type', { type: event.type });
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logError('Error processing webhook', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePaymentSucceeded(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata;

  logInfo('Processing successful payment', { paymentIntentId });

  try {
    // Find donation by paymentIntentId
    const donationsSnapshot = await db
      .collection('donations')
      .where('paymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (donationsSnapshot.empty) {
      logError('Donation not found for payment intent', { paymentIntentId });
      return;
    }

    const donationDoc = donationsSnapshot.docs[0];
    const donationId = donationDoc.id;
    const donationData = donationDoc.data();

    // Update donation status
    await donationDoc.ref.update({
      status: 'succeeded',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Updated donation status to succeeded', { donationId });

    // Update story stats
    await db.collection('stories').doc(donationData.storyId).update({
      raisedAmount: admin.firestore.FieldValue.increment(donationData.amount),
      donationCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Updated story stats', { storyId: donationData.storyId });

    // Update user stats
    await db.collection('users').doc(donationData.userId).update({
      totalDonated: admin.firestore.FieldValue.increment(donationData.amount),
      donationCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Updated user stats', { userId: donationData.userId });

    // Update NGO stats
    await db.collection('ngos').doc(donationData.ngoId).update({
      totalDonationsReceived: admin.firestore.FieldValue.increment(donationData.ngoAmount),
      totalDonors: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Updated NGO stats', { ngoId: donationData.ngoId });

    // Log audit trail
    logAudit('donation_completed', {
      donationId,
      userId: donationData.userId,
      amount: donationData.amount,
      storyId: donationData.storyId,
      ngoId: donationData.ngoId,
    });

    // Trigger receipt generation
    // NOTE: In production, this would be better as a Firestore trigger or Pub/Sub
    // For now, calling directly (can be improved in Phase 7)
    try {
      // You can trigger the generateReceipt function here or via a separate process
      logInfo('Receipt generation should be triggered', { donationId });
      // TODO: Call generateReceipt Cloud Function or set up as Firestore trigger
    } catch (receiptError) {
      logError('Error triggering receipt generation', receiptError);
      // Don't fail the webhook if receipt generation fails
    }

    logInfo('Payment processing complete', { donationId });
  } catch (error) {
    logError('Error handling payment success', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id;

  logInfo('Processing failed payment', { paymentIntentId });

  try {
    // Find donation by paymentIntentId
    const donationsSnapshot = await db
      .collection('donations')
      .where('paymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (donationsSnapshot.empty) {
      logError('Donation not found for failed payment', { paymentIntentId });
      return;
    }

    const donationDoc = donationsSnapshot.docs[0];
    const donationId = donationDoc.id;

    // Update donation status
    await donationDoc.ref.update({
      status: 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Updated donation status to failed', { donationId });
  } catch (error) {
    logError('Error handling payment failure', error);
    throw error;
  }
}
