// Firebase Admin SDK configuration for server-side operations
// Used in Next.js API routes and server components

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (adminApp) {
    return adminApp;
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

// Lazy-initialize services
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _adminStorage: Storage | null = null;

export const adminAuth = new Proxy({} as Auth, {
  get: (_target, prop) => {
    if (!_adminAuth) {
      _adminAuth = getAuth(getAdminApp());
    }
    return (_adminAuth as any)[prop];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get: (_target, prop) => {
    if (!_adminDb) {
      _adminDb = getFirestore(getAdminApp());
    }
    return (_adminDb as any)[prop];
  }
});

export const adminStorage = new Proxy({} as Storage, {
  get: (_target, prop) => {
    if (!_adminStorage) {
      _adminStorage = getStorage(getAdminApp());
    }
    return (_adminStorage as any)[prop];
  }
});

export default getAdminApp;
