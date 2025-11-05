// Stripe client initialization
// Manages Stripe API instance with secret key from environment

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export default stripe;

// Helper function to calculate platform fee (2%)
export const calculatePlatformFee = (amount: number): number => {
  return Math.floor(amount * 0.02);
};

// Helper function to calculate NGO amount after fee
export const calculateNGOAmount = (amount: number): number => {
  const fee = calculatePlatformFee(amount);
  return amount - fee;
};

// Helper function to format amount for display
export const formatAmount = (amount: number, currency: string = 'ILS'): string => {
  const amountInMainUnit = amount / 100;
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency,
  }).format(amountInMainUnit);
};
