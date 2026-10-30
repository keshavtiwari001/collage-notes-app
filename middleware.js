import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from './lib/session';

export const runtime = 'nodejs';

// Pages that do NOT require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);

// Pages that should redirect AWAY if already authenticated
const AUTH_ONLY_PATHS = new Set([
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Read and verify the session cookie (HMAC signature check only — no DB)
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  const token = match ? match.slice(COOKIE_NAME.length + 1) : null;
  const session = token ? verifySession(token) : null;
  const isAuthenticated = !!session;

  // If authenticated and trying to access an auth-only page → redirect to dashboard
  if (isAuthenticated && AUTH_ONLY_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not authenticated and trying to access a protected page → redirect to login
  if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL('/login', request.url);
    // Preserve destination for post-login redirect (optional, used by login page)
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.svg, favicon.ico
     * - /api/* (API routes handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.svg|favicon\\.ico|api/).*)',
  ],
};
