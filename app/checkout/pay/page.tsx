'use client';

import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { PaymentMethod } from '@/components/checkout/payment-method';
import { getCheckoutLink, getCheckoutLinkQr } from '@/lib/api/checkout';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';

function CheckoutPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? params.get('opaqueToken');
  const [linkData, setLinkData] = useState<Record<string, unknown> | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCheckoutLink(token)
      .then((d) => setLinkData(d as Record<string, unknown>))
      .catch(() => {});
    getCheckoutLinkQr(token)
      .then((d) => {
        if (typeof d === 'string') setQrDataUrl(d);
        else if (d && typeof (d as Record<string, unknown>)['qrDataUrl'] === 'string') {
          setQrDataUrl(String((d as Record<string, unknown>)['qrDataUrl']));
        }
      })
      .catch(() => {});
  }, [token]);

  const amount = linkData?.['amount']
    ? `$${Number(linkData['amount']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$3,000';

  return (
    <CheckoutShell>
      <div className="mx-auto flex w-full max-w-[560px] flex-col rounded-[28px] bg-white px-6 py-10 lg:px-12 lg:py-14">
        {qrDataUrl && (
          <div className="mb-6 flex justify-center">
            <Image src={qrDataUrl} alt="Checkout QR code" width={120} height={120} />
          </div>
        )}
        <PaymentMethod
          amount={amount}
          onComplete={() => router.push('/checkout/success')}
        />
      </div>
    </CheckoutShell>
  );
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPayContent />
    </Suspense>
  );
}
