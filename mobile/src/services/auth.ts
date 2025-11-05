// Authentication service for Firebase Auth operations
// Handles registration, login, logout, and user document creation

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
  AuthCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../../../shared/types';

/**
 * Register a new user with email and password
 * Creates user in Firebase Auth and Firestore users collection
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  fullName: string
): Promise<User> => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Send email verification
    await sendEmailVerification(firebaseUser);

    // Create user document in Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: fullName,
      photoURL: null,
      profileType: 'donor',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: false,
      // Donor-specific fields
      totalDonated: 0,
      donationCount: 0,
      // Optional fields
      ngoIds: [],
      phoneNumber: null,
      preferredLanguage: 'he',
      stripeCustomerId: null,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    return newUser;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register');
  }
};

/**
 * Sign in with email and password
 */
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() as User;

    // Update last login timestamp
    await setDoc(
      doc(db, 'users', firebaseUser.uid),
      {
        lastLoginAt: serverTimestamp(),
        emailVerified: firebaseUser.emailVerified,
      },
      { merge: true }
    );

    return {
      ...userData,
      emailVerified: firebaseUser.emailVerified,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to login');
  }
};

/**
 * Sign in with Google OAuth
 * Uses credential from expo-auth-session
 */
export const loginWithGoogle = async (credential: AuthCredential): Promise<User> => {
  try {
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    // Check if user document exists
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    let userData: User;

    if (!userDoc.exists()) {
      // Create new user document for first-time Google sign-in
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL,
        profileType: 'donor',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: firebaseUser.emailVerified,
        totalDonated: 0,
        donationCount: 0,
        ngoIds: [],
        phoneNumber: firebaseUser.phoneNumber,
        preferredLanguage: 'he',
        stripeCustomerId: null,
      };

      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // Update existing user's last login
      userData = userDoc.data() as User;
      await setDoc(
        userDocRef,
        {
          lastLoginAt: serverTimestamp(),
          emailVerified: firebaseUser.emailVerified,
        },
        { merge: true }
      );
    }

    return userData;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message || 'Failed to login with Google');
  }
};

/**
 * Sign out current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Failed to logout');
  }
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user signed in');
    }
    await sendEmailVerification(currentUser);
  } catch (error: any) {
    console.error('Resend verification error:', error);
    throw new Error(error.message || 'Failed to resend verification email');
  }
};

/**
 * Set up auth state listener
 * Returns unsubscribe function
 */
export const setupAuthListener = (
  onUserChange: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        // Fetch user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          onUserChange({
            ...userData,
            emailVerified: firebaseUser.emailVerified,
          });
        } else {
          onUserChange(null);
        }
      } catch (error) {
        console.error('Error fetching user document:', error);
        onUserChange(null);
      }
    } else {
      onUserChange(null);
    }
  });
};
