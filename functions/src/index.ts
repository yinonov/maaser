import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { Request, Response } from 'firebase-functions/v1';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configure CORS to allow requests from mobile app and dashboard
const corsHandler = cors({
  origin: [
    'http://localhost:3000', // Dashboard dev
    'http://localhost:19006', // Expo web dev
    'https://hamaaser-dashboard.web.app', // Production dashboard
    'https://hamaaser-dashboard.firebaseapp.com', // Alternative production URL
  ],
  credentials: true,
});

// Helper to wrap Cloud Functions with CORS
type RequestHandler = (req: Request, res: Response) => void | Promise<void>;

export const withCors = (handler: RequestHandler): RequestHandler => {
  return (req, res) => {
    return corsHandler(req, res, () => handler(req, res));
  };
};

// Export Firestore and Storage instances for use in other functions
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Import and export payment functions
import { createPaymentIntent } from './payments/createPaymentIntent';
import { handleStripeWebhook } from './payments/handleWebhook';

// Import and export receipt functions
import { generateReceipt } from './receipts/generateReceipt';
import { sendReceiptEmail } from './emails/sendReceiptEmail';

// Import and export story functions
import { createStory } from './stories/createStory';
import { updateStory } from './stories/updateStory';
import { approveStory } from './stories/approveStory';

export { createPaymentIntent };
export { handleStripeWebhook };
export { generateReceipt };
export { sendReceiptEmail };
export { createStory };
export { updateStory };
export { approveStory };

// Health check function
export const helloWorld = functions.https.onRequest(withCors((request, response) => {
  response.json({ message: 'HaMaaser Cloud Functions - Ready' });
}));
