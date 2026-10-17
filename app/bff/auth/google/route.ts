import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveUpstreamFromHeaders,
  setSessionCookies,
  upstreamFetch,
  readJson,
} from '@/lib/api/server';

/**
 * Google OAuth BFF route.
 *
 * Accepts { idToken, captchaToken, rememberMe } from the client-side GIS flow,
 * forwards to POST /auth/google on the upstream with the required captcha headers,
 * and sets httpOnly session cookies on success.
 *
 * Authorized by go-worship-auth-endpoints.md (SO-011 / tenant customer variant):
 *   POST /api/v1/auth/google (captcha) {idToken, timestamp, nonce, rememberMe}
 * Google login is CUSTOMER-only — the sign-in form never shows the button for
 * SYSTEM_OWNER context (gated by authentication.customerGoogleLogin from bootstrap).
 */

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const incoming = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { idToken, captchaToken, rememberMe } = incoming ?? {};

  if (!idToken) {
    return NextResponse.json(
      { message: 'Google credential is required' },
      { status: 400 }
    );
  }
  if (!captchaToken) {
    return NextResponse.json(
      { message: 'Please complete the security check.' },
      { status: 400 }
    );
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const timestamp = Date.now();
  const nonce = hex16();

  const upstream = await upstreamFetch(
    '/auth/google',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Captcha-Token': captchaToken,
        'X-Captcha-Action': 'google_login',
        'X-Captcha-Ts': String(timestamp),
        'X-Captcha-Nonce': nonce,
        'X-Correlation-Id': hex16(),
      },
      body: JSON.stringify({ idToken, timestamp, nonce, rememberMe: !!rememberMe }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        message: data?.message ?? 'Google sign-in failed',
        code: data?.code ?? null,
      },
      { status: upstream.status }
    );
  }

  const accessToken = data?.accessToken;

  // MFA required — no session created yet.
  if (!accessToken) {
    const allowedMethods: string[] =
      data?.availableFactors ??
      data?.allowedMethods ??
      data?.eligibleMethods ??
      data?.methods ??
      [];
    const primaryFactor: string | null =
      data?.primaryFactor ?? data?.preferredMethod ?? null;

    return NextResponse.json({
      mfaRequired: true,
      mfaSessionId: data?.mfaSessionId ?? null,
      allowedMethods,
      primaryFactor,
    });
  }

  const res = NextResponse.json({
    ok: true,
    userType: data?.claims?.userType ?? null,
    roles: data?.claims?.roles ?? [],
    authLevel: data?.authLevel ?? null,
    mfa: data?.mfa ?? null,
  });
  setSessionCookies(res, accessToken, data?.refreshToken);
  return res;
}
