import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

/**
 * Login-MFA: arm a challenge for the given factor.
 *
 * Called after /bff/auth/login returns mfaRequired=true.
 * At this point there is NO session yet — the mfaSessionId from the login
 * response IS the credential (no Authorization header, no captcha).
 *
 * TN-023 (OTP_EMAIL): begin → backend sends the OTP email, returns tokenId
 * TN-025 (TOTP): begin → backend arms the challenge, returns {challengeType:"ENTER_TOTP"}
 *
 * The response is forwarded as-is; the client reads tokenId (OTP) or
 * challengeType (TOTP) to know what to render next.
 */
export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { mfaSessionId, method } = body ?? {};
  if (!mfaSessionId || !method) {
    return NextResponse.json(
      { message: 'mfaSessionId and method are required' },
      { status: 400 }
    );
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const upstream = await upstreamFetch(
    '/auth/mfa/begin',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ mfaSessionId, method }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Failed to start MFA challenge', code: data?.code },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
