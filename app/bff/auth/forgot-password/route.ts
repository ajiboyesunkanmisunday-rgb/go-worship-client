import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

const hex16 = () => randomBytes(16).toString('hex');

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { email, captchaToken, tenantId } = body ?? {};

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
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
    'X-Captcha-Action': 'forgot-password',
    'X-Captcha-Ts': String(timestamp),
    'X-Captcha-Nonce': nonce,
    'X-Correlation-Id': hex16(),
  };

  const resolvedTenant = tenantId ?? process.env.API_TENANT_ID;
  if (resolvedTenant) headers['X-Tenant-Id'] = resolvedTenant;

  const upstream = await upstreamFetch(
    '/auth/forgot-password',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Failed to send reset email', code: data?.code },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
