import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

/**
 * Dedicated BFF route for customer (member) registration.
 *
 * Why this route exists instead of the generic /bff/gw proxy:
 * The backend's captcha filter reads the captcha token from the X-Captcha-*
 * HEADERS, not the request body. The generic proxy forwards the body as-is
 * (captchaToken in body → captcha filter never sees it → 403). This route
 * lifts captchaToken out of the body and into the headers before forwarding.
 *
 * Endpoint: POST /api/v1/public/customers/register
 * (CU-001 from the QA v2.0 guide — DIRECT public self-registration.
 * Resolves tenant from the request host. No Bearer token required — this is
 * called from the public /auth/signup flow before the user is authenticated.
 * NOTE: TN-007 /tenant/admin/users/customers/provision is the INDIRECT admin
 * path; it requires TENANT_ADMIN Bearer and is a different flow.)
 */

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { captchaToken, ...provisionPayload } = body ?? {};

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
    '/public/customers/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Captcha-Token': captchaToken,
        'X-Captcha-Action': 'register',
        'X-Captcha-Ts': String(timestamp),
        'X-Captcha-Nonce': nonce,
        'X-Correlation-Id': hex16(),
      },
      body: JSON.stringify(provisionPayload),
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
