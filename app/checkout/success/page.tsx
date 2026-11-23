'use client';

import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { PaymentSuccess } from '@/components/checkout/payment-success';
import { getCheckoutSessionStatus } from '@/lib/api/checkout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function CheckoutSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get('amount') ?? '0';
  const checkoutToken = params.get('token') ?? params.get('checkoutToken') ?? params.get('checkout_token');
  const [sessionStatus, setSessionStatus] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (checkoutToken) {
      getCheckoutSessionStatus(checkoutToken)
        .then((s) => setSessionStatus(s as Record<string, unknown>))
        .catch(() => {});
    }
  }, [checkoutToken]);

  const resolvedAmount = sessionStatus?.['amount']
    ? Number(sessionStatus['amount'])
    : Number(amount);
  const display = resolvedAmount > 0
    ? `$${resolvedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$3,000';

  return (
    <CheckoutShell>
      <div className="relative mx-auto flex w-full max-w-[560px] flex-col rounded-[28px] bg-white px-6 py-10 lg:px-12 lg:py-14">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute left-6 top-6 flex size-9 items-center justify-center rounded-full border border-[#e5e5e5] text-[#5b5757] transition-colors hover:bg-[#f7f7f7] lg:left-8 lg:top-8"
        >
          <ArrowLeft className="size-[18px]" />
        </button>

        <PaymentSuccess amount={display}>
          <Link
            href="/auth/signup"
            className="flex h-[56px] w-full items-center justify-center rounded-[4px] bg-[#5cb475] text-[16px] font-semibold text-white no-underline transition-colors hover:bg-[#4fa267]"
          >
            Create an account
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-[56px] w-full items-center justify-center rounded-[4px] border border-[#9b9b9b]/40 text-[16px] font-semibold text-[#34a853] transition-colors hover:bg-[#f7f7f7]"
          >
            Get Receipt
          </button>
        </PaymentSuccess>
      </div>
    </CheckoutShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
