import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, upstreamFetch } from '@/lib/api/server';

/**
 * Step 1 of the first-login flow.
 *
 * The provisioning email links to /first-login?token=... on this app. That
 * token is single-use and short-lived; consuming it returns the tenant the
 * user belongs to and where to send them next.
 *
 * Verified against production: an invalid token comes back as HTTP 200 with
 * `ok: false` and `error: "INVALID_OR_EXPIRED"` — not a 4xx — so the body has
 * to be checked, not just the status.
 */
export async function POST(req: NextRequest) {
  const { token } = (await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  )) ?? {};

  if (!token) {
    return NextResponse.json({ message: 'Missing link token' }, { status: 400 });
  }

  const upstream = await upstreamFetch('/auth/first-login/link/consume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-Id': randomUUID(),
    },
    body: JSON.stringify({ token }),
  });

  const data = await readJson(upstream);

  if (!upstream.ok || data?.ok === false) {
    return NextResponse.json(
      {
        message:
          data?.message ?? 'This link is invalid or has expired.',
        code: data?.error ?? 'INVALID_OR_EXPIRED',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    tenantId: data?.tenantId ?? null,
    nextAction: data?.nextAction ?? null,
    loginUrl: data?.loginUrl ?? null,
  });
}
