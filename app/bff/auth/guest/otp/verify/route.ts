import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch, setSessionCookies } from '@/lib/api/server';

/**
 * BFF route for verifying the guest OTP.
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   POST /api/v1/auth/guest/otp/verify
 *   Body: { email, tokenId, code }
 *   Response: guest access token → stored as httpOnly cookie
 *
 * On success the backend returns a guest token. We store it the same way
 * as the regular login token (httpOnly cookie via setSessionCookies).
 * The guest user is a CUSTOMER_GUEST — they can browse but not fully act.
 */

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), { headers: { 'content-type': 'application/json' } })
  );

  const { email, tokenId, code } = body ?? {};

  if (!email || !tokenId || !code) {
    return NextResponse.json({ message: 'Email, token ID, and OTP code are required' }, { status: 400 });
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);

  const upstream = await upstreamFetch(
    '/auth/guest/otp/verify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Correlation-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({ email, tokenId, code }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Invalid OTP code', code: data?.code },
      { status: upstream.status }
    );
  }

  const accessToken = data?.accessToken ?? data?.guestToken ?? data?.token;

  if (!accessToken) {
    return NextResponse.json({ message: 'Unexpected response from server' }, { status: 502 });
  }

  const res = NextResponse.json({
    ok: true,
    userType: data?.claims?.userType ?? 'CUSTOMER_GUEST',
    roles: data?.claims?.roles ?? [],
    canUpgrade: true,
  });

  setSessionCookies(res, accessToken, data?.refreshToken ?? null);
  return res;
}
