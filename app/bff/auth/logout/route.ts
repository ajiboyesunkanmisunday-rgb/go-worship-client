import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  upstreamFetch,
} from '@/lib/api/server';

export async function POST() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  // Best-effort upstream revoke — the local session is cleared regardless.
  if (token) {
    try {
      await upstreamFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* upstream unreachable — still clear the cookies */
    }
  }

  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
