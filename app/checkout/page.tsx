'use client';

import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
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

export default function CheckoutGivingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('Celebration Church');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push('/checkout/pay');
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

        <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
          <Field label="Donor Details">
            <NativeSelect className={INPUT_CLASS} defaultValue="member">
              <NativeSelectOption value="member">Member</NativeSelectOption>
              <NativeSelectOption value="guest">Guest</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label="Full Name">
            <Input className={INPUT_CLASS} placeholder="Enter full name" />
          </Field>

          <Field label={<>Email Address&#42;</>}>
            <Input
              type="email"
              className={INPUT_CLASS}
              placeholder="Enter email address"
            />
          </Field>

          <Field label="Choose Currency">
            <NativeSelect className={INPUT_CLASS} defaultValue="usd">
              <NativeSelectOption value="usd">USD</NativeSelectOption>
              <NativeSelectOption value="cad">CAD</NativeSelectOption>
              <NativeSelectOption value="gbp">GBP</NativeSelectOption>
              <NativeSelectOption value="ngn">NGN</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Amount&#42;</>}>
            <Input
              type="number"
              className={INPUT_CLASS}
              placeholder="Enter amount"
            />
          </Field>

          <Field label={<>Purpose for giving&#42;</>}>
            <NativeSelect className={INPUT_CLASS} defaultValue="">
              <NativeSelectOption value="" disabled>
                Select a purpose
              </NativeSelectOption>
              <NativeSelectOption value="tithe">Tithe</NativeSelectOption>
              <NativeSelectOption value="offering">Offering</NativeSelectOption>
              <NativeSelectOption value="thanksgiving">
                Thanksgiving
              </NativeSelectOption>
              <NativeSelectOption value="others">Others</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Button size="lg" type="submit" className="mt-2 h-[52px] w-full">
            Give Generously
          </Button>
        </form>
      </div>
    </CheckoutShell>
  );
}
