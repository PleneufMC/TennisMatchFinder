import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    // You can add custom logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicPaths = [
          '/',
          '/login',
          '/register',
          '/join',
          '/api/auth',
        ];

        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname === path || 
          req.nextUrl.pathname.startsWith(`${path}/`)
        );

        // Allow public paths and API routes that handle their own auth
        if (isPublicPath) {
          return true;
        }

        // Require authentication for dashboard routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
