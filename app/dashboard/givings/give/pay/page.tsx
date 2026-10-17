'use client';

import { PaymentMethod } from '@/components/checkout/payment-method';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MemberGivePayPage() {
  const router = useRouter();

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/givings/give"
      title="Complete payment"
    >
      <div className="flex h-full w-full flex-col gap-8 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/givings/give')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <PaymentMethod
          amount="$3,000"
          onComplete={() => router.push('/dashboard/givings/give/success')}
        />
      </div>
    </SheetPage>
  );
}
