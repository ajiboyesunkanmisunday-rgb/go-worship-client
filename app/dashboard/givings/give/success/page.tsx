'use client';

import { PaymentSuccess } from '@/components/checkout/payment-success';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MemberGiveSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get('amount') ?? '0';
  const display = amount && Number(amount) > 0
    ? `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$3,000';

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/givings"
      title="Payment successful"
    >
      <div className="flex h-full w-full flex-col gap-8 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/givings')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <PaymentSuccess amount={display}>
          <Link
            href="/dashboard"
            className="flex h-[56px] w-full items-center justify-center rounded-[4px] bg-[#5cb475] text-[16px] font-semibold text-white no-underline transition-colors hover:bg-[#4fa267]"
          >
            Back to dashboard
          </Link>
        </PaymentSuccess>
      </div>
    </SheetPage>
  );
}

export default function MemberGiveSuccessPage() {
  return (
    <Suspense fallback={null}>
      <MemberGiveSuccessContent />
    </Suspense>
  );
}
