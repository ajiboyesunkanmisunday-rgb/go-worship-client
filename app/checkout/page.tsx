'use client';

import { FormAlert } from '@/components/ui/form-alert';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  type CheckoutConfig,
  createDonation,
  getCheckoutConfig,
  getLeadremitCheckoutConfig,
  launchHostedCheckout,
} from '@/lib/api/checkout';
import { USE_LIVE_API } from '@/lib/api/config';

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="text-[14px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  'h-[52px] rounded-[6px] border-[#9b9b9b]/30 text-[14px] placeholder:text-[#9b9b9b]';

const DEFAULT_CURRENCIES = ['USD', 'CAD', 'GBP', 'NGN'];
const DEFAULT_PURPOSES = ['Tithe', 'Offering', 'Thanksgiving', 'Others'];

export default function CheckoutGivingPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CheckoutConfig>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const orgName = config.tenantDisplayName ?? 'Celebration Church';
  const currencies = config.currencies?.length ? config.currencies : DEFAULT_CURRENCIES;
  const funds = config.funds?.length ? config.funds : null;
  const campuses = config.campuses?.length ? config.campuses : null;

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getCheckoutConfig()
      .then((c) => setConfig(c))
      .catch(() => {});
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!USE_LIVE_API) {
      router.push('/checkout/pay');
      return;
    }

    const fd = new FormData(e.currentTarget);
    const donorType = String(fd.get('donorType') ?? 'guest') as 'member' | 'guest';
    const donorName = String(fd.get('donorName') ?? '');
    const donorEmail = String(fd.get('donorEmail') ?? '');
    const currency = String(fd.get('currency') ?? 'USD');
    const amount = parseFloat(String(fd.get('amount') ?? '0'));
    const fundId = String(fd.get('fundId') ?? '') || undefined;
    const campusId = String(fd.get('campusId') ?? '') || undefined;

    if (!donorEmail || amount <= 0) {
      setError('Please fill in your email address and a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the guest donation intent
      const donation = await createDonation({
        donorName: donorName || undefined,
        donorEmail,
        currency,
        amount,
        fundId,
      });

      // 2. Fetch LeadRemit checkout config for this donation
      const checkoutCfg = await getLeadremitCheckoutConfig(
        donation.donationId,
        donation.tenantId
      );

      if (!checkoutCfg.scriptUrl || !checkoutCfg.checkoutPublicKey) {
        throw new Error('Checkout configuration is unavailable. Please try again.');
      }

      // 3. Launch hosted checkout — page navigates away
      await launchHostedCheckout({
        scriptUrl: checkoutCfg.scriptUrl,
        checkoutPublicKey: checkoutCfg.checkoutPublicKey,
        lineItems: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CheckoutShell>
      <div className="mx-auto flex w-full max-w-[493px] flex-col items-center gap-6 rounded-[28px] bg-white px-6 py-8 lg:px-10 lg:py-10">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={72}
          height={25}
          className="h-[25px] w-[72px]"
        />

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-[26px] font-bold leading-[1.15] text-[#1a1a1a] lg:text-[30px]">
            {orgName}
            <br />
            Giving Platform
          </h1>
          <p className="max-w-[360px] text-[13px] text-[#5b5757]">
            A generous person will prosper; whoever refreshes others will be
            refreshed.
          </p>
        </div>

        <form ref={formRef} className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
          <Field label="Donor Details">
            <NativeSelect name="donorType" className={INPUT_CLASS} defaultValue="member">
              <NativeSelectOption value="member">Member</NativeSelectOption>
              <NativeSelectOption value="guest">Guest</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label="Full Name">
            <Input name="donorName" className={INPUT_CLASS} placeholder="Enter full name" />
          </Field>

          <Field label={<>Email Address&#42;</>}>
            <Input
              name="donorEmail"
              type="email"
              required
              className={INPUT_CLASS}
              placeholder="Enter email address"
            />
          </Field>

          {campuses && (
            <Field label="Campus">
              <NativeSelect name="campusId" className={INPUT_CLASS} defaultValue="">
                <NativeSelectOption value="">Select a campus</NativeSelectOption>
                {campuses.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}

          <Field label="Choose Currency">
            <NativeSelect name="currency" className={INPUT_CLASS} defaultValue={currencies[0]}>
              {currencies.map((c) => (
                <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label={<>Amount&#42;</>}>
            <Input
              name="amount"
              type="number"
              required
              min="1"
              step="0.01"
              className={INPUT_CLASS}
              placeholder="Enter amount"
            />
          </Field>

          <Field label={<>Purpose for giving&#42;</>}>
            {funds ? (
              <NativeSelect name="fundId" className={INPUT_CLASS} defaultValue="">
                <NativeSelectOption value="" disabled>Select a fund</NativeSelectOption>
                {funds.map((f) => (
                  <NativeSelectOption key={f.id} value={f.id}>{f.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            ) : (
              <NativeSelect name="fundId" className={INPUT_CLASS} defaultValue="">
                <NativeSelectOption value="" disabled>Select a purpose</NativeSelectOption>
                {DEFAULT_PURPOSES.map((p) => (
                  <NativeSelectOption key={p} value={p}>{p}</NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>

          {error && <FormAlert variant="error">{error}</FormAlert>}

          <Button size="lg" type="submit" className="mt-2 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Processing…' : 'Give Generously'}
          </Button>
        </form>
      </div>
    </CheckoutShell>
  );
}
