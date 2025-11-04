// NextAuth.js API route for authentication
// Handles sign-in, sign-out, and session management

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email/Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          // Verify Firebase ID token (client will sign in first and send token)
          const decodedToken = await adminAuth.verifyIdToken(credentials.password);
          
          // Get user from Firestore
          const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
          
          if (!userDoc.exists) {
            throw new Error('User not found');
          }

          const userData = userDoc.data();

          // Check if user is NGO admin
          if (userData?.profileType !== 'ngo_admin') {
            throw new Error('Only NGO admins can access the dashboard');
          }

          return {
            id: decodedToken.uid,
            email: decodedToken.email || '',
            name: userData?.displayName || '',
            image: null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in Firestore
          const userDoc = await adminDb.collection('users').doc(user.id).get();
          
          if (!userDoc.exists) {
            // New user - check if they should be NGO admin
            // For MVP, reject new Google sign-ins (require email/password registration first)
            return false;
          }

          const userData = userDoc.data();
          
          // Only allow NGO admins
          if (userData?.profileType !== 'ngo_admin') {
            return false;
          }

          return true;
        } catch (error) {
          console.error('Sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
