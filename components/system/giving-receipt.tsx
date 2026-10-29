'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { USE_LIVE_API } from '@/lib/api/config';
import { getTenantBranding, getTenantOrganization } from '@/lib/api/tenant';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-[12px] text-brand-gray-500">{label}</span>
      <span className="text-right text-[12px] font-medium text-[#1a1a1a]">
        {value}
      </span>
    </div>
  );
}

type ReceiptData = {
  org: string; orgAddress: string; orgPhone: string; orgEmail: string; orgWeb: string;
  donorName: string; donorEmail: string; donorPhone: string;
  date: string; amount: string; fund: string; donationType: string;
  paymentMethod: string; txnId: string; subtotal: string;
};

const DEFAULT_RECEIPT: ReceiptData = {
  org: 'Celebration Church Int.',
  orgAddress: 'Ontario Canada, Canada City',
  orgPhone: '+321 762 - 4763',
  orgEmail: 'info@churchonline.org',
  orgWeb: 'www.churchonline.org',
  donorName: 'Adewale Bola',
  donorEmail: 'adminadje@gmail.com',
  donorPhone: '+234 812 345 6789',
  date: 'January 12, 2025',
  amount: '$55.00',
  fund: 'General Offering',
  donationType: 'One-time',
  paymentMethod: 'Debit Card (Express 2405)',
  txnId: 'TXN-2295465',
  subtotal: '$206.00',
};

/** System → Transactions → Giving Receipt (success / failed variants). */
export function GivingReceipt({ failed = false, id }: { failed?: boolean; id?: string }) {
  const router = useRouter();
  const back = '/system/transactions';
  const [receipt, setReceipt] = useState<ReceiptData>(USE_LIVE_API ? { org: '', orgAddress: '', orgPhone: '', orgEmail: '', orgWeb: '', donorName: '', donorEmail: '', donorPhone: '', date: '', amount: '', fund: '', donationType: '', paymentMethod: '', txnId: id ?? '', subtotal: '' } : DEFAULT_RECEIPT);
  const [isFailed, setIsFailed] = useState(failed);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => {
      if (b.organizationName) setReceipt((prev) => ({ ...prev, org: prev.org === DEFAULT_RECEIPT.org ? b.organizationName! : prev.org }));
    }).catch(() => {});
    getTenantOrganization()
      .then((o) => {
        const addr = o.address ?? o.city ?? o.location ?? '';
        if (addr) setReceipt((prev) => ({ ...prev, orgAddress: prev.orgAddress === DEFAULT_RECEIPT.orgAddress ? addr : prev.orgAddress }));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    if (!id || id === 'failed') return;
    // /system/transactions/:id not in backend API — disabled.
  }, [id]);

  return (
    <SheetPage
      className="w-full max-w-[560px]!"
      backLink={back}
      title="Giving Receipt"
    >
      <div className="flex h-full w-full flex-col gap-5 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[50px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="text-[11px] leading-relaxed text-brand-gray-500">
            <p className="text-[13px] font-bold text-[#1a1a1a]">
              {receipt.org}
            </p>
            <p>{receipt.orgAddress}</p>
            <p>{receipt.orgPhone}</p>
            <p>{receipt.orgEmail}</p>
            <p>{receipt.orgWeb}</p>
          </div>
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={70}
            height={24}
            className="h-[24px] w-[70px]"
          />
        </div>

        <div className="text-[11px] leading-relaxed text-brand-gray-500">
          <p className="text-[12px] font-semibold text-[#1a1a1a]">
            Donor Information
          </p>
          <p>{receipt.donorName}</p>
          <p>{receipt.donorEmail}</p>
          <p>{receipt.donorPhone}</p>
        </div>

        <div className="border-t border-[#ededed] pt-4">
          <p className="text-[12px] font-semibold text-[#1a1a1a]">
            Giving Receipt:
          </p>
          <div className="mt-2 flex flex-col divide-y divide-[#f4f4f4]">
            <Row label="Donation Date" value={receipt.date} />
            <Row label="Amount Given" value={receipt.amount} />
            <Row label="Fund/Campaign" value={receipt.fund} />
            <Row label="Donation Type" value={receipt.donationType} />
            <Row label="Payment Method" value={receipt.paymentMethod} />
            <Row label="Transaction ID" value={receipt.txnId} />
            <Row
              label="Status"
              value={
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 font-medium',
                    isFailed ? 'text-[#eb0000]' : 'text-[#34a853]'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isFailed ? 'bg-[#eb0000]' : 'bg-[#34a853]'
                    )}
                  />
                  {isFailed ? 'Failed' : 'Successful'}
                </span>
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#ededed] pt-4">
          <span className="text-[13px] font-semibold">Subtotal</span>
          <span className="text-[15px] font-bold">{receipt.subtotal}</span>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[48px] w-full"
            onClick={() => window.print()}
          >
            Download Receipt
          </Button>
          {isFailed && (
            <button
              type="button"
              onClick={() => router.push(back)}
              className="flex h-[48px] w-full items-center justify-center rounded-[8px] border border-[#eb0000] text-[14px] font-semibold text-[#eb0000] transition-colors hover:bg-[#fde8e8]"
            >
              Refund
            </button>
          )}
        </div>

        <p className="text-center text-[10px] leading-relaxed text-brand-gray-400">
          Thank you for your generosity. Your support helps us continue our
          mission and outreach.
        </p>
      </div>
    </SheetPage>
  );
}
