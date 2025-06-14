import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public routes
        if (pathname.startsWith('/auth/') || 
            pathname === '/' || 
            pathname.startsWith('/about') || 
            pathname.startsWith('/how-it-works') ||
            pathname.startsWith('/api/auth')) {
          return true;
        }

        // Require authentication for protected routes
        if (pathname.startsWith('/candidate/') || 
            pathname.startsWith('/professional/') ||
            pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
          return !!token;
        }

        return true;
      },
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
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};