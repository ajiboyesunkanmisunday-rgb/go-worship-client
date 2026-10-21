'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useSiteContext } from '@/lib/site-context';

type SuccessScreenProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SuccessScreen({
  title = 'Successful',
  subtitle,
  actionLabel = 'Go to dashboard',
  actionHref = '/dashboard',
}: SuccessScreenProps) {
  const { context } = useSiteContext();
  const orgName = context?.branding?.organizationName ?? context?.displayName ?? 'Go Worship';
  const defaultSubtitle = `Welcome to the ${orgName} Platform`;
  const displaySubtitle = subtitle ?? defaultSubtitle;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 rounded-[11px] bg-white px-6 py-12 shadow-[0_4px_30px_rgba(0,0,0,0.06)] lg:px-16 lg:py-16">
      <Image
        src="/auth/success-check.svg"
        alt=""
        width={108}
        height={108}
        className="size-[88px] lg:size-[108px]"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[32px] font-semibold -tracking-[0.03em] lg:text-[40px]">
          {title}
        </h1>
        <p className="max-w-[400px] font-poppins text-[16px] font-light lg:text-[18px]">
          {displaySubtitle}
        </p>
      </div>

      <Button
        asChild
        size="lg"
        className="mt-2 h-[56px] w-full bg-brand-gray-300 text-white hover:bg-brand-gray-300/90"
      >
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
