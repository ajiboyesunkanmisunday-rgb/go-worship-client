import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, setSessionCookies, upstreamFetch } from '@/lib/api/server';

/**
 * Final step of the first-login flow: exchange the challenge token from the
 * 428 PASSWORD_CHANGE_REQUIRED response for a new password, which issues a
 * full session. Tokens go straight into httpOnly cookies as with normal login.
 *
 * The challenge token is short-lived (expiresInSeconds: 600 in the backend's
 * example), so an expired one needs the user to sign in again.
 */
export async function POST(req: NextRequest) {
  const body = (await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  )) ?? {};

  const { challengeToken, newPassword, confirmPassword, rememberMe, tenantId } =
    body;

  if (!challengeToken || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { message: 'Missing password details' },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { message: 'Passwords do not match' },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-Id': randomUUID(),
  };
  // The backend's example sends the tenant explicitly on this call.
  if (tenantId) headers['X-Tenant-Id'] = tenantId;

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);
  const upstream = await upstreamFetch('/auth/first-login/password/complete', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      // SO-004B uses 'challengeToken'; TN-003 uses 'token' — send both so
      // either backend variant accepts the request.
      token: challengeToken,
      challengeToken,
      newPassword,
      confirmPassword,
      rememberMe: Boolean(rememberMe),
    }),
  }, upstreamBase);

  const data = await readJson(upstream);

  if (!upstream.ok || data?.ok === false) {
    return NextResponse.json(
      {
        message: data?.message ?? 'Could not set your password.',
        code: data?.code ?? data?.error,
      },
      { status: upstream.ok ? 400 : upstream.status }
    );
  }

  const accessToken = data?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { message: 'No session was returned. Please sign in.' },
      { status: 502 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    roles: data?.claims?.roles ?? [],
    userType: data?.claims?.roles?.[0] ?? null,
    // Drives subscription gating in the UI (blocked / minimal access / upsell).
    subscription: data?.subscription ?? null,
    mfa: data?.mfa ?? null,
  });
  setSessionCookies(res, accessToken, data?.refreshToken);
  return res;
}
