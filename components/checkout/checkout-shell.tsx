'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSiteContext } from '@/lib/site-context';

type CheckoutShellProps = {
  children?: React.ReactNode;
  /** Extra classes for the right-hand content column. */
  contentClassName?: string;
};

/**
 * Shared visual frame for the giving / payment-checkout flow
 * (matches Figma board 101:4021):
 * - Left: hero photo with a dark overlay, rounded, with the white
 *   "Celebration Church Canada" logo top-left and the
 *   "Grace Flows Through Generosity" headline + quote at the bottom.
 * - Right: centered content column (the screen's card).
 */
export function CheckoutShell({ children, contentClassName }: CheckoutShellProps) {
  const { context } = useSiteContext();
  const orgName = context?.branding?.organizationName ?? context?.displayName ?? 'Celebration Church Canada';
  const logoUrl = context?.branding?.logoUrl ?? '';
  return (
    <main className="relative flex min-h-screen w-full flex-col items-stretch gap-6 bg-[#f7f7ff] px-4 py-4 lg:flex-row lg:items-center lg:gap-8 lg:px-6 lg:py-6">
      {/* Left: hero image with dark overlay + logo + headline */}
      <div className="relative hidden h-[calc(100vh-3rem)] w-[47%] shrink-0 overflow-hidden rounded-[40px] bg-brand-navy lg:block">
        <Image
          src="/checkout/hero.jpg"
          alt="Worship"
          fill
          priority
          unoptimized
          sizes="47vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={orgName}
            className="absolute top-8 left-8 z-10 w-[38%] max-w-[200px] object-contain"
          />
        ) : (
          <Image
            src="/auth/cci-logo-white.svg"
            alt={orgName}
            width={200}
            height={36}
            className="absolute top-8 left-8 z-10 w-[38%] max-w-[200px]"
          />
        )}

        <div className="absolute inset-x-0 bottom-16 z-10 flex flex-col items-center gap-4 px-10 text-center text-white">
          <h2 className="text-[36px] font-bold leading-[1.08] -tracking-[0.02em] xl:text-[48px]">
            Grace Flows
            <br />
            Through Generosity
          </h2>
          <p className="max-w-[440px] text-[16px] font-light leading-[1.4] xl:text-[20px]">
            &ldquo;Give, and it will be given to you. A good measure, pressed
            down, shaken together and running over, will be poured into your
            lap.&rdquo;
          </p>
        </div>
      </div>

      {/* Right: content column */}
      <div
        className={cn(
          'flex w-full flex-1 flex-col items-center justify-center py-6',
          'lg:h-[calc(100vh-3rem)] lg:overflow-y-auto',
          contentClassName
        )}
      >
        {children}
      </div>
    </main>
  );
}
