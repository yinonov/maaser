// Environment configuration for HaMaaser mobile app
// Reads from .env file via Expo's process.env

export const config = {
  // Firebase
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },
  
  // API URLs
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001',
    functionsRegion: 'us-central1',
  },
  
  // Stripe
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  
  // App settings
  app: {
    version: '1.0.0',
    buildNumber: '1',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Feature flags
  features: {
    enableAnalytics: false,  // TODO: Enable in production
    enableCrashReporting: false,  // TODO: Enable in production
  },
} as const;

export default config;
