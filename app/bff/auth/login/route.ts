import { createHmac, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveUpstreamFromHeaders,
  setSessionCookies,
  upstreamFetch,
  readJson,
} from '@/lib/api/server';

/**
 * Login BFF route.
 *
 * Mints captcha headers server-side (the HMAC secret never reaches the browser),
 * forwards credentials upstream, and stores the resulting tokens in httpOnly
 * cookies. The tokens are never returned to the browser.
 *
 * Login response shapes handled:
 *   200 with accessToken → success; set cookies, return role/mfa info
 *   200 without accessToken → MFA required; return mfaSessionId + method list
 *   428 (or 200 with code PASSWORD_CHANGE_REQUIRED) → first-login; return challengeToken
 *   4xx/5xx → forward the upstream error
 */

const LOGIN_PATH = '/api/v1/auth/login';

function tenantSignature(secret: string, tenantId: string, ts: number, path: string) {
  const canonical = `${tenantId}:${ts}:${path}:POST`;
  return createHmac('sha256', secret).update(canonical).digest('base64');
}

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const incoming = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { username, email, password, captchaToken, tenantId } = incoming ?? {};
  const identifier = username ?? email;

  if (!identifier || !password) {
    return NextResponse.json(
      { message: 'Email and password are required' },
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Captcha-Token': captchaToken,
    'X-Captcha-Action': 'login',
    'X-Captcha-Ts': String(timestamp),
    'X-Captcha-Nonce': nonce,
    'X-Correlation-Id': hex16(),
  };

  const resolvedTenant = tenantId ?? process.env.API_TENANT_ID;
  if (resolvedTenant) headers['X-Tenant-Id'] = resolvedTenant;

  const hmacSecret = process.env.LOGIN_HMAC_SECRET;
  if (hmacSecret && resolvedTenant) {
    headers['X-Captcha-Signature'] = tenantSignature(
      hmacSecret,
      resolvedTenant,
      timestamp,
      LOGIN_PATH
    );
  }

  const upstream = await upstreamFetch(
    '/auth/login',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: identifier, password, timestamp, nonce }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  // 428 first-login / PASSWORD_CHANGE_REQUIRED
  if (upstream.status === 428 || data?.code === 'PASSWORD_CHANGE_REQUIRED') {
    return NextResponse.json({
      passwordChangeRequired: true,
      challengeToken: data?.challengeToken ?? null,
      expiresInSeconds: data?.expiresInSeconds ?? null,
      tenantId: data?.tenantId ?? null,
      username: data?.username ?? identifier,
      message: data?.message ?? 'You must change your password on first login.',
    });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      {
        message: data?.message ?? 'Invalid email or password',
        code: data?.code,
        details: data?.details ?? null,
      },
      { status: upstream.status }
    );
  }

  const accessToken = data?.accessToken;

  // MFA required — no session created yet.
  if (!accessToken) {
    // Read the method list and preferred method resiliently from any field name
    // the backend might use (confirmed fields from live HAR: availableFactors,
    // primaryFactor — but we also handle the spec variants).
    const allowedMethods: string[] =
      data?.availableFactors ??
      data?.allowedMethods ??
      data?.eligibleMethods ??
      data?.mfaMethods ??
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
