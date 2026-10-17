import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

/**
 * BFF route for starting the guest OTP login flow.
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   POST /api/v1/auth/guest/otp/start
 *   Body: { email }
 *
 * Captcha token is lifted from the body into X-Captcha-* headers per the
 * backend's captcha filter contract (NEVER in the body).
 */

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), { headers: { 'content-type': 'application/json' } })
  );

  const { email, captchaToken } = body ?? {};

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }
  if (!captchaToken) {
    return NextResponse.json({ message: 'Please complete the security check.' }, { status: 400 });
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const timestamp = Date.now();
  const nonce = hex16();

  const upstream = await upstreamFetch(
    '/auth/guest/otp/start',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Captcha-Token': captchaToken,
        'X-Captcha-Action': 'guest_otp_start',
        'X-Captcha-Ts': String(timestamp),
        'X-Captcha-Nonce': nonce,
        'X-Correlation-Id': hex16(),
      },
      body: JSON.stringify({ email }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Could not send OTP', code: data?.code },
      { status: upstream.status }
    );
  }

  // Return the tokenId / sessionId the client needs for the verify step
  return NextResponse.json(data ?? { ok: true });
}
