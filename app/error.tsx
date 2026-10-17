'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-6 text-center">
      <Image
        src="/auth/infinity-blue.svg"
        alt="Go Worship"
        width={96}
        height={33}
        className="h-[33px] w-[96px]"
      />

      <div className="flex flex-col items-center gap-3">
        <p className="font-plus-jakarta-sans text-[80px] font-bold leading-none text-brand-orange lg:text-[120px]">
          Oops
        </p>
        <h1 className="text-[24px] font-bold lg:text-[32px]">
          Something went wrong
        </h1>
        <p className="max-w-[440px] text-[15px] font-light text-brand-gray-500 lg:text-[17px]">
          An unexpected error occurred while loading this page. You can try
          again, or head back home.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/" className="no-underline">
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  );
}
