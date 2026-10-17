'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NeedHelpButton } from './auth-shell';

type WizardShellProps = {
  children?: React.ReactNode;
  /** Current step (1-based). When set, renders the progress bar. */
  step?: number;
  totalSteps?: number;
  /** Where the back button goes. Omit to hide it. */
  backHref?: string;
  contentClassName?: string;
};

/**
 * Left panel for the sign-up wizard (Figma board 107:6846): a full-height
 * blue panel with the church photo, Celebration Church Canada logo, and the
 * "Grace Flows Through Generosity" verse. The right side hosts a back button,
 * an optional step progress bar, and the step content.
 */
export function WizardShell({
  children,
  step,
  totalSteps = 3,
  backHref,
  contentClassName,
}: WizardShellProps) {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen w-full bg-white">
      {/* Left: verse panel */}
      <div className="relative hidden h-screen w-[35%] max-w-[597px] shrink-0 overflow-hidden bg-brand-blue lg:block">
        <Image
          src="/auth/church.jpg"
          alt=""
          fill
          priority
          sizes="35vw"
          className="object-cover mix-blend-hard-light"
        />
        <Image
          src="/auth/cci-logo-white.svg"
          alt="Celebration Church Canada"
          width={181}
          height={32}
          className="absolute top-32 left-20 z-10 w-[181px]"
        />
        <div className="absolute inset-x-0 top-[30%] z-10 flex flex-col items-center gap-4 px-10 text-center text-white">
          <h2 className="font-poppins text-[32px] leading-[1.08] font-bold -tracking-[0.01em] xl:text-[40px]">
            Grace Flows
            <br />
            Through Generosity
          </h2>
          <p className="max-w-[400px] font-poppins text-[15px] leading-[1.37] font-light xl:text-[17px]">
            &ldquo;Give, and it will be given to you. A good measure, pressed
            down, shaken together and running over, will be poured into your
            lap.&rdquo;
          </p>
        </div>
      </div>

      {/* Right: content */}
      <div
        className={cn(
          'relative flex-1 overflow-y-auto px-6 py-10 lg:h-screen lg:px-16 lg:py-12',
          contentClassName
        )}
      >
        {backHref && (
          <button
            type="button"
            onClick={() => router.push(backHref)}
            aria-label="Go back"
            className="flex size-9 items-center justify-center rounded-[4px] bg-[#f1f1f1] text-brand-gray-500 transition-colors hover:bg-[#e8e8e8]"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        {step ? (
          <div className="mt-8 flex w-full max-w-[773px] gap-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-[3px] flex-1 rounded-full',
                  i < step ? 'bg-brand-orange' : 'bg-brand-gray-300'
                )}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8 w-full max-w-[773px]">{children}</div>
      </div>

      <NeedHelpButton />
    </main>
  );
}
