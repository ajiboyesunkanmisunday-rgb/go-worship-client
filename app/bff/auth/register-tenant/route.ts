import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

/**
 * Dedicated BFF route for church (tenant) self-registration.
 *
 * Why this route exists: the backend's captcha filter reads tokens from
 * X-Captcha-* HEADERS, not the request body. The generic /bff/gw proxy
 * forwards the body as-is, so captchaToken in body → captcha filter 403.
 * This route lifts captchaToken out of the body into the headers.
 *
 * Endpoint: POST /api/v1/public/tenants/register  (TN-001A/B)
 * Body (after stripping captchaToken):
 *   { tenant{name,shortName,slug,billingEmail,subDomain|customDomain,
 *            legalName,countryCode,currency},
 *     adminEmail, rawPassword, confirmPassword, displayName, phone }
 *
 * This is a public endpoint — no Bearer token, no session cookies needed.
 * The upstream Origin header is set to satisfy the backend's Origin check
 * (same fix as the gw proxy for /public/* routes).
 */

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { captchaToken, ...registrationPayload } = body ?? {};

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
    '/public/tenants/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: new URL(upstreamBase).origin,
        'X-Captcha-Token': captchaToken,
        'X-Captcha-Action': 'register',
        'X-Captcha-Ts': String(timestamp),
        'X-Captcha-Nonce': nonce,
        'X-Correlation-Id': hex16(),
      },
      body: JSON.stringify(registrationPayload),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Registration failed', code: data?.code },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
