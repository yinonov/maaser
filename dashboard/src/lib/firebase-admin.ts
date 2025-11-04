// Firebase Admin SDK configuration for server-side operations
// Used in Next.js API routes and server components

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Parse service account from environment variable
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_KEY;
  
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_ADMIN_SDK_KEY environment variable is not set. ' +
      'Please download the service account key from Firebase Console.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    return adminApp;
  } catch (error) {
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Initialize app
const app = getAdminApp();

// Export services
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);

export default app;
