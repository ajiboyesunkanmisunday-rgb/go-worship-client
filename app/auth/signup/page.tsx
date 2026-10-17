'use client';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { MessageIcon } from '@/icons/message';
import { GoogleIcon } from '@/icons/socials';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

export default function SignupPage() {
  const [orgName, setOrgName] = useState('Celebration Church International');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});
  }, []);

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[40px]">
            Create a free account
          </h1>
          <p className="max-w-[320px] font-poppins text-[16px] font-light lg:text-[17px]">
            Welcome to {orgName} Go worship Platform
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Button asChild size="lg" className="h-[52px] w-full gap-3">
            <Link href="/auth/signup/choose-account">
              <MessageIcon color="#ffffff" className="size-[20px]" />
              Continue with Email
            </Link>
          </Button>

          <div className="flex w-full items-center justify-center gap-4">
            <div className="h-px w-full bg-brand-gray-300" />
            <span className="text-[15px] text-black">or</span>
            <div className="h-px w-full bg-brand-gray-300" />
          </div>

          <Button
            size="lg"
            variant="outline"
            className="h-[52px] w-full gap-4"
            type="button"
          >
            <GoogleIcon className="size-[24px]" />
            <span>Continue with Google</span>
          </Button>

          <p className="text-[15px] font-light">
            Already have a Go worship account?{' '}
            <Link href="/auth/login" className="font-bold text-brand-orange">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
