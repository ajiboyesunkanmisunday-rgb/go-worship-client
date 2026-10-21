'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { NeedHelpButton } from '@/components/shared/need-help';
import { useSiteContext } from '@/lib/site-context';

type AuthShellProps = {
  children?: React.ReactNode;
  /** Extra classes for the right-hand content column. */
  contentClassName?: string;
  /** Extra classes for the outer wrapper. */
  mainClassName?: string;
  /** Left church image source. Defaults to the shared auth photo. */
  imgSrc?: string;
  imgAlt?: string;
  /** Override the left-panel logo (overrides context branding + CCI fallback). */
  logoSrc?: string;
  /** CSS classes for the left-panel <Image>. Defaults to 'object-cover mix-blend-hard-light'. */
  imgClassName?: string;
  /** System/admin portal variant: full-bleed aside with no rounded card, no outer padding. */
  flat?: boolean;
};

/**
 * Shared visual frame for every auth screen (matches Figma Auth board):
 * - Left: church photo with a blue duotone overlay, rounded, with the
 *   "Celebration Church Canada" logo in the top-left (hidden below lg).
 * - Right: centered content column (the screen's form/content).
 * - A floating "Need Help?" pill bottom-right.
 */
export function AuthShell({
  children,
  contentClassName,
  mainClassName,
  imgSrc = '/auth/church.jpg',
  imgAlt = 'Celebration Church',
  logoSrc,
  imgClassName = 'object-cover mix-blend-hard-light',
  flat = false,
}: AuthShellProps) {
  const { context } = useSiteContext();
  const logoUrl = logoSrc ?? context?.branding?.logoUrl;
  const orgName = context?.branding?.organizationName ?? context?.displayName;

  if (flat) {
    return (
      <div className={cn('flex min-h-screen w-full bg-white', mainClassName)}>
        {/* Left: full-bleed system panel — no rounding, no outer padding */}
        <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-brand-blue lg:block">
          {/* Logo at top */}
          <div className="p-10">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={orgName ?? 'Leadremit'}
                className="h-[30px] w-auto object-contain"
              />
            ) : (
              <Image
                src="/auth/cci-logo-white.svg"
                alt={orgName ?? 'Celebration Church Canada'}
                width={160}
                height={30}
                className="h-[30px] w-auto"
              />
            )}
          </div>
          {/* Triangle pattern */}
          <svg
            className="pointer-events-none absolute bottom-0 left-0 h-[72%] w-[88%] text-white/[0.14]"
            viewBox="0 0 640 660"
            fill="none"
            preserveAspectRatio="xMinYMax meet"
            aria-hidden="true"
          >
            <path
              d="M320 90 L610 500 L320 500 Z M320 90 L30 500 L320 500 Z M-40 660 L320 210 L680 660"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </aside>

        {/* Right: content column */}
        <main
          className={cn(
            'flex w-full items-center justify-center px-6 py-12 lg:w-[54%]',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <main
      className={cn(
        'relative flex min-h-screen w-full flex-col items-stretch gap-6 bg-white px-6 py-6 lg:flex-row lg:items-center lg:pr-0 lg:pl-6',
        mainClassName
      )}
    >
      {/* Left: church image with blue duotone overlay + org logo */}
      <div className="relative hidden h-[calc(100vh-3rem)] w-[47%] shrink-0 overflow-hidden rounded-[40px] bg-brand-blue lg:block">
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          priority
          sizes="47vw"
          className={imgClassName}
        />
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={orgName ?? 'Organization logo'}
            className="absolute top-8 left-8 z-10 w-[38%] max-w-[200px] object-contain"
          />
        ) : (
          <Image
            src="/auth/cci-logo-white.svg"
            alt={orgName ?? 'Celebration Church Canada'}
            width={200}
            height={36}
            className="absolute top-8 left-8 z-10 w-[38%] max-w-[200px]"
          />
        )}
      </div>

      {/* Right: content column */}
      <div
        className={cn(
          'flex w-full flex-1 flex-col lg:h-[calc(100vh-3rem)] lg:overflow-y-auto',
          'items-center justify-center py-6',
          contentClassName
        )}
      >
        {children}
      </div>

      <NeedHelpButton />
    </main>
  );
}

export { NeedHelpButton };
