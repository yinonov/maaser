// Payment service for handling donation payments via Cloud Functions
// Integrates with Stripe for payment processing

import config from '../constants/config';
import { auth } from './firebase';

const API_BASE_URL = `${config.api.baseUrl}/${config.firebase.projectId}/${config.api.functionsRegion}`;

/**
 * Create a payment intent for donation
 * @param storyId Story ID to donate to
 * @param amount Amount in agorot (cents)
 * @param message Optional donor message
 * @param isAnonymous Whether donation is anonymous
 * @returns Payment intent client secret and donation ID
 */
export const createPaymentIntent = async (
  storyId: string,
  amount: number,
  message?: string,
  isAnonymous?: boolean
): Promise<{ clientSecret: string; donationId: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const idToken = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/createPaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        storyId,
        amount,
        message,
        isAnonymous,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      donationId: data.donationId,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
};

/**
 * Confirm payment (placeholder for actual Stripe integration)
 * In production, this would use @stripe/stripe-react-native
 */
export const confirmPayment = async (
  clientSecret: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // TODO: Implement actual Stripe payment confirmation using @stripe/stripe-react-native
    // For now, this is a placeholder that simulates payment confirmation
    console.log('Payment confirmation with client secret:', clientSecret);
    
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return {
      success: false,
      error: error.message || 'Payment confirmation failed',
    };
  }
};
