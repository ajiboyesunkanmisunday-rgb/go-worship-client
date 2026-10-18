import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  API_PREFIX,
  REFRESH_COOKIE,
  UPSTREAM,
  clearSessionCookies,
  readJson,
  resolveUpstreamFromHeaders,
  setSessionCookies,
  upstreamFetch,
} from '@/lib/api/server';

/**
 * BFF proxy to the Go-Worship backend.
 *
 * Why this exists:
 *  1. CORS — the backend does not send Access-Control-Allow-* headers to
 *     cross-origin requests, so the browser cannot call it directly.
 *     Server-to-server calls are not subject to CORS.
 *  2. Token security — access/refresh tokens live in httpOnly cookies and are
 *     attached here; they're never readable from page JavaScript.
 *  3. Tenant routing — the backend resolves tenant from the request Host header,
 *     so we forward each request to the host the visitor arrived on (Option A).
 */

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  // Strip these so the backend's CORS filter sees the upstream as same-origin,
  // not a cross-origin browser request (confirmed fix for 403 Invalid CORS on
  // authed writes through the proxy — 2026-08-27).
  'origin',
  'referer',
]);

/** Trades the refresh cookie for a new token pair. Returns null on failure. */
async function refresh(refreshToken: string, upstreamBase: string) {
  try {
    const res = await upstreamFetch(
      '/auth/refresh',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
      upstreamBase
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    const accessToken = data?.accessToken ?? data?.token;
    if (!accessToken) return null;
    return { accessToken, refreshToken: data?.refreshToken ?? refreshToken };
  } catch {
    return null;
  }
}

async function proxy(req: NextRequest, path: string[]) {
  const jar = await cookies();
  const search = req.nextUrl.search ?? '';

  // Resolve the upstream base from the browser's host — Option A multi-tenant.
  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const url = `${upstreamBase}${API_PREFIX}/${path.join('/')}${search}`;

  const inbound = new Headers();
  req.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) inbound.set(k, v);
  });
  inbound.set('Accept', 'application/json');
  inbound.delete('cookie');

  // /public/* endpoints require an Origin header — the backend's CORS filter
  // rejects requests without one. Setting the upstream's own origin satisfies
  // it as a same-origin request (no CORS risk). (2026-10-06 BFF fix.)
  if (path[0] === 'public') {
    try {
      inbound.set('Origin', new URL(upstreamBase).origin);
    } catch {
      inbound.set('Origin', UPSTREAM);
    }
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  const send = (token?: string) => {
    const headers = new Headers(inbound);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, {
      method: req.method,
      headers,
      body: body || undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  };

  const refreshTok = jar.get(REFRESH_COOKIE)?.value;
  let renewed: { accessToken: string; refreshToken: string } | null = null;
  let upstream: Response;

  try {
    upstream = await send(jar.get(ACCESS_COOKIE)?.value);

    if (upstream.status === 401 && refreshTok) {
      renewed = await refresh(refreshTok, upstreamBase);
      if (renewed) upstream = await send(renewed.accessToken);
    }
  } catch (err) {
    return NextResponse.json(
      {
        message: 'Upstream API unreachable',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();

  // If still 401 after refresh attempt (or no refresh token was present),
  // check whether the backend sent IDLE_TIMEOUT so the client can surface the
  // right reason on the login page.
  if (upstream.status === 401) {
    let bodyCode: string | null = null;
    try {
      const parsed = JSON.parse(text);
      bodyCode = parsed?.code ?? null;
    } catch { /* ignore */ }

    const res = NextResponse.json(
      {
        message: bodyCode === 'IDLE_TIMEOUT'
          ? 'Session expired due to inactivity.'
          : 'Unauthorized',
        code: bodyCode ?? 'UNAUTHORIZED',
      },
      { status: 401 }
    );
    clearSessionCookies(res);
    return res;
  }

  const res = new NextResponse(text || null, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  if (renewed) {
    setSessionCookies(res, renewed.accessToken, renewed.refreshToken);
  }

  return res;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
