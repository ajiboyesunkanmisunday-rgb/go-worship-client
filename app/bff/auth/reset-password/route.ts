import { NextRequest, NextResponse } from 'next/server';
import { readJson, resolveUpstreamFromHeaders, upstreamFetch } from '@/lib/api/server';

export async function POST(req: NextRequest) {
  const body = await readJson(
    new Response(await req.text(), {
      headers: { 'content-type': 'application/json' },
    })
  );

  const { token, newPassword, tenantId } = body ?? {};

  if (!token || !newPassword) {
    return NextResponse.json(
      { message: 'Token and new password are required' },
      { status: 400 }
    );
  }

  const upstreamBase = resolveUpstreamFromHeaders(req.headers);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const resolvedTenant = tenantId ?? process.env.API_TENANT_ID;
  if (resolvedTenant) headers['X-Tenant-Id'] = resolvedTenant;

  const upstream = await upstreamFetch(
    '/auth/reset-password',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, newPassword }),
    },
    upstreamBase
  );

  const data = await readJson(upstream);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Password reset failed', code: data?.code },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
