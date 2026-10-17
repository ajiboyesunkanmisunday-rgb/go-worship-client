'use client';

import { PaymentSuccess } from '@/components/checkout/payment-success';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MemberGiveSuccessPage() {
  const router = useRouter();

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/givings"
      title="Payment successful"
    >
      <div className="flex h-full w-full flex-col gap-8 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/givings/give/pay')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <PaymentSuccess amount="$3,000">
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
