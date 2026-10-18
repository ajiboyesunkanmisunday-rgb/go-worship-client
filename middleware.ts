import { NextRequest, NextResponse } from 'next/server';

/**
 * Route-protection middleware.
 *
 * Rules:
 *  1. Protected portal routes → redirect to their login page when the session
 *     cookie is absent.
 *  2. Login / auth pages → redirect to the appropriate dashboard when the user
 *     already has a valid session cookie (avoids double login).
 *  3. BFF routes (/bff/*) and public assets pass through unconditionally.
 */

const ACCESS_COOKIE = 'gw_access';

/** Each portal: { prefix, login, home } */
const PORTALS = [
  { prefix: '/system',         login: '/system/login',         home: '/system/dashboard' },
  { prefix: '/ministry',       login: '/ministry/login',       home: '/ministry/dashboard' },
  { prefix: '/sermon-admin',   login: '/sermon-admin/login',   home: '/sermon-admin/dashboard' },
  { prefix: '/group-leader',   login: '/group-leader/login',   home: '/group-leader/dashboard' },
  { prefix: '/ministry-admin', login: '/ministry-admin/login', home: '/ministry-admin/dashboard' },
  { prefix: '/dashboard',      login: '/auth/login',           home: '/dashboard' },
  { prefix: '/first-login',    login: '/auth/login',           home: '/dashboard' },
];

/** Public auth pages (unauthenticated required). */
const AUTH_PAGES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/register-church',
  '/auth/guest',
  '/system/login',
  '/ministry/login',
  '/sermon-admin/login',
  '/group-leader/login',
  '/ministry-admin/login',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass BFF calls, static files, and Next internals.
  if (
    pathname.startsWith('/bff/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // static assets
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);

  // ── Authenticated user hitting a login / auth page ───────────────────────
  if (hasSession) {
    const isAuthPage = AUTH_PAGES.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (isAuthPage) {
      // Find which portal's login this is and redirect to its home.
      const portal = PORTALS.find((p) => p.login === pathname || pathname.startsWith(p.login + '/'));
      const home = portal?.home ?? '/dashboard';
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // ── Unauthenticated user hitting a protected portal route ─────────────────
  if (!hasSession) {
    const portal = PORTALS.find(
      (p) => pathname === p.prefix ||
             pathname.startsWith(p.prefix + '/') &&
             // Don't intercept the login page itself
             !pathname.startsWith(p.login)
    );
    if (portal) {
      const loginUrl = new URL(portal.login, req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static (Next.js static files)
     *  - _next/image  (image optimisation)
     *  - favicon.ico, robots.txt, etc.
     * The middleware function itself further skips /bff/ and assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icons/|images/).*)',
  ],
};
