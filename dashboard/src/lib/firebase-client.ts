// Firebase client SDK configuration for client-side operations
// Used in dashboard pages and components

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization function
let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  
  return app;
}

// Lazy-initialize services
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export const auth = new Proxy({} as Auth, {
  get: (_target, prop) => {
    if (!_auth) {
      _auth = getAuth(getApp());
    }
    return (_auth as any)[prop];
  }
});

export const db = new Proxy({} as Firestore, {
  get: (_target, prop) => {
    if (!_db) {
      _db = getFirestore(getApp());
    }
    return (_db as any)[prop];
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get: (_target, prop) => {
    if (!_storage) {
      _storage = getStorage(getApp());
    }
    return (_storage as any)[prop];
  }
});

export default getApp;
