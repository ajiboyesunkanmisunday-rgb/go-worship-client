'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Landing page for the provisioning email link:
 *   /first-login?token=...
 *
 * Consumes the single-use token, then sends the user to sign in with their
 * temporary password. The tenant returned by the consume call is carried
 * through so login can send X-Tenant-Id explicitly.
 */
function FirstLoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [error, setError] = useState<string | null>(null);
  // Guards against React StrictMode double-invoking and burning the
  // single-use token twice.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    if (!token) {
      setError('This link is missing its access token.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/bff/auth/first-login/consume', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(data?.message ?? 'This link is invalid or has expired.');
          return;
        }

        const qs = new URLSearchParams({ firstLogin: '1' });
        if (data?.tenantId) qs.set('tenant', data.tenantId);
        router.replace(`/auth/login?${qs.toString()}`);
      } catch {
        setError('Could not reach the server. Please try again.');
      }
    })();
  }, [token, router]);

  return (
    <AuthLayout imgAlt="Celebration Church">
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-start gap-6 lg:items-center">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        {error ? (
          <div className="flex flex-col items-start gap-4 text-left lg:items-center lg:text-center">
            <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[34px]">
              Link no longer valid
            </h1>
            <p
              role="alert"
              className={cn(
                'max-w-[380px] font-poppins text-[16px] font-light',
                'text-brand-gray-600'
              )}
            >
              {error}
            </p>
            <p className="text-[15px] font-light">
              These links are single-use and expire quickly. Ask your
              administrator to send a new invitation, or{' '}
              <Link href="/auth/login" className="font-bold text-brand-orange">
                sign in
              </Link>{' '}
              if you have already set a password.
            </p>
            <Button asChild size="lg" className="h-[52px] w-full">
              <Link href="/auth/login">Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 text-left lg:items-center lg:text-center">
            <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[34px]">
              Setting up your access
            </h1>
            <p className="max-w-[340px] font-poppins text-[16px] font-light">
              One moment while we verify your invitation link…
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

export default function FirstLoginPage() {
  return (
    <Suspense fallback={null}>
      <FirstLoginInner />
    </Suspense>
  );
}
