import { NextRequest, NextResponse } from 'next/server';
import {
  readJson,
  resolveUpstreamFromHeaders,
  setSessionCookies,
  upstreamFetch,
} from '@/lib/api/server';

/**
 * Login-MFA: verify the submitted code and complete the login.
 *
 * No session exists yet — no Authorization header, no captcha.
 * The mfaSessionId from the login response is the credential.
 *
 * TN-028 OTP_EMAIL verify: {mfaSessionId, method, tokenId, code}
 * TN-030 TOTP verify:      {mfaSessionId, method, code}  (no tokenId)
 *
 * On success the upstream returns access + refresh tokens, which this
 * route stores in httpOnly cookies (same as the normal login route).
 */
export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { mfaSessionId, method, code, tokenId } = body ?? {};
  if (!mfaSessionId || !method || !code) {
    return NextResponse.json(
      { message: 'mfaSessionId, method, and code are required' },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = { mfaSessionId, method, code };
  // OTP_EMAIL and OTP_SMS need the tokenId from the begin response.
  // TOTP does NOT send tokenId (TN-030).
  if (tokenId && method !== 'TOTP') {
    payload.tokenId = tokenId;
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const upstream = await upstreamFetch(
    '/auth/mfa/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Invalid code', code: data?.code },
      { status: upstream.status }
    );
  }

  const accessToken = data?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { message: 'Unexpected response from server', code: 'NO_TOKEN' },
      { status: 502 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    userType: data?.claims?.userType ?? null,
    roles: data?.claims?.roles ?? [],
    authLevel: data?.authLevel ?? null,
  });
  setSessionCookies(res, accessToken, data?.refreshToken);
  return res;
}
