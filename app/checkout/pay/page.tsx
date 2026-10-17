'use client';

import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { PaymentMethod } from '@/components/checkout/payment-method';
import { useRouter } from 'next/navigation';

export default function CheckoutPayPage() {
  const router = useRouter();

  return (
    <CheckoutShell>
      <div className="mx-auto flex w-full max-w-[560px] flex-col rounded-[28px] bg-white px-6 py-10 lg:px-12 lg:py-14">
        <PaymentMethod
          amount="$3,000"
          onComplete={() => router.push('/checkout/success')}
        />
      </div>
    </CheckoutShell>
  );
}
