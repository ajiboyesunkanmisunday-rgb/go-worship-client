/**
 * API configuration (browser side).
 *
 * All calls go to this app's own origin, never to the backend directly:
 *  - the backend sends no CORS headers, so direct browser calls are blocked;
 *  - the backend resolves tenant context from the request host, which the
 *    proxy controls (API_UPSTREAM_URL / API_TENANT_HOST, server-only env);
 *  - auth tokens stay in httpOnly cookies the proxy attaches.
 */

/**
 * Same-origin BFF prefix — see app/bff/gw/[...path]/route.ts. Deliberately NOT
 * under /api/*, so a reverse proxy that routes /api/** to the backend (the
 * DigitalOcean/Nginx setup) doesn't hijack our proxy routes.
 */
export const API_BASE = '/bff/gw';

/** Set false to run the UI on its built-in mock data (current default). */
export const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
