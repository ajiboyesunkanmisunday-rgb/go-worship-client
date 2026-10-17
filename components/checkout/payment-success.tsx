import { Check, Lock } from 'lucide-react';
import Image from 'next/image';

/**
 * Shared "Payment Successful" panel used by both the public checkout success
 * screen (28:401) and the member giving success slide-over (63:4156).
 * Pass the action buttons as children (they differ per flow).
 */
export function PaymentSuccess({
  amount,
  org = 'CCI USA',
  children,
}: {
  amount: string;
  org?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col">
      <Image
        src="/auth/infinity-blue.svg"
        alt="Go Worship"
        width={64}
        height={22}
        className="h-[22px] w-[64px]"
      />

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-[#34a853]">
          <Check className="size-9 text-[#34a853]" strokeWidth={2.5} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[22px] font-semibold text-[#1a1a1a]">
            Payment Successful
          </h1>
          <p className="text-[13px] text-[#9b9b9b]">
            You paid {amount} to {org}
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-3 py-1.5 text-[12px] text-[#5b5757]">
          <Lock className="size-3.5" />
          Secured by{' '}
          <span className="font-semibold text-brand-blue">Leadremit</span>
        </div>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3">{children}</div>
    </div>
  );
}
