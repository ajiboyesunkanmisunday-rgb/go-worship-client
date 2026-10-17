'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { NeedHelpButton } from '@/components/shared/need-help';
import { useSiteContext } from '@/lib/site-context';

type AuthShellProps = {
  children?: React.ReactNode;
  /** Extra classes for the right-hand content column. */
  contentClassName?: string;
  /** Extra classes for the outer <main> (e.g. background override). */
  mainClassName?: string;
  /** Left church image source. Defaults to the shared auth photo. */
  imgSrc?: string;
  imgAlt?: string;
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
}: AuthShellProps) {
  const { context } = useSiteContext();
  const logoUrl = context?.branding?.logoUrl;
  const orgName = context?.branding?.organizationName ?? context?.displayName;

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
          className="object-cover mix-blend-hard-light"
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
