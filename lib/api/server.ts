import { NextResponse } from 'next/server';

/** Server-only helpers shared by the BFF route handlers. */

export const UPSTREAM = (
  process.env.API_UPSTREAM_URL ?? 'https://api.go-worship.com'
).replace(/\/$/, '');

/** Frontend hostnames that map to the System-Owner (SO) context (comma-separated). */
const SO_FRONTEND_HOSTS = (
  process.env.SO_FRONTEND_HOSTS ?? 'app.go-worship.com,go-worship.com,www.go-worship.com'
)
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export const API_PREFIX = '/api/v1';

export const ACCESS_COOKIE = 'gw_access';
export const REFRESH_COOKIE = 'gw_refresh';

/**
 * Option A (2026-08-27 backend decision): each church uses its own host.
 *
 * - SO frontend hosts or localhost → canonical SO API (UPSTREAM)
 * - Any other host → that host itself serves the tenant API (backend resolves
 *   tenant from the Host header it receives)
 */
export function resolveUpstream(host: string): string {
  const h = (host || '').split(':')[0].toLowerCase().trim();
  if (!h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || SO_FRONTEND_HOSTS.includes(h)) {
    return UPSTREAM;
  }
  return `https://${h}`;
}

/** Read the X-Forwarded-Host (or Host) header and resolve the upstream base URL. */
export function resolveUpstreamFromHeaders(
  headers: Headers | { get(name: string): string | null }
): string {
  const host =
    (headers.get('x-forwarded-host') ?? headers.get('host') ?? '').split(':')[0].toLowerCase().trim();
  return resolveUpstream(host);
}

/**
 * Fetch from the upstream API.
 *
 * @param path - API path relative to API_PREFIX (e.g. "/auth/login")
 * @param init - fetch init
 * @param upstreamBase - upstream origin; defaults to UPSTREAM (SO API).
 *   Pass `resolveUpstreamFromHeaders(req.headers)` when the host context matters.
 */
export function upstreamFetch(
  path: string,
  init: RequestInit = {},
  upstreamBase: string = UPSTREAM
) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  return fetch(`${upstreamBase}${API_PREFIX}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export function setSessionCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string
) {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...baseCookie, maxAge: 60 * 30 });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      ...baseCookie,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 });
}
