import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // This function runs only if the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Only allow authenticated users
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all routes except login and api/auth
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /robots.txt, etc. (static files)
     */
    '/((?!login|api/auth|_next|favicon.ico|robots.txt).*)',
  ],
};
