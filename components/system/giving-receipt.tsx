'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

/** System → Transactions → Giving Receipt (success / failed variants). */
export function GivingReceipt({ failed = false }: { failed?: boolean }) {
  const router = useRouter();
  const back = '/system/transactions';

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
              Celebration Church Int.
            </p>
            <p>Ontario Canada, Canada City</p>
            <p>+321 762 - 4763</p>
            <p>info@churchonline.org</p>
            <p>www.churchonline.org</p>
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
          <p>Adewale Bola</p>
          <p>adminadje@gmail.com</p>
          <p>+234 812 345 6789</p>
        </div>

        <div className="border-t border-[#ededed] pt-4">
          <p className="text-[12px] font-semibold text-[#1a1a1a]">
            Giving Receipt:
          </p>
          <div className="mt-2 flex flex-col divide-y divide-[#f4f4f4]">
            <Row label="Donation Date" value="January 12, 2025" />
            <Row label="Amount Given" value="$55.00" />
            <Row label="Fund/Campaign" value="General Offering" />
            <Row label="Donation Type" value="One-time" />
            <Row label="Payment Method" value="Debit Card (Express 2405)" />
            <Row label="Transaction ID" value="TXN-2295465" />
            <Row
              label="Status"
              value={
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 font-medium',
                    failed ? 'text-[#eb0000]' : 'text-[#34a853]'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      failed ? 'bg-[#eb0000]' : 'bg-[#34a853]'
                    )}
                  />
                  {failed ? 'Failed' : 'Successful'}
                </span>
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#ededed] pt-4">
          <span className="text-[13px] font-semibold">Subtotal</span>
          <span className="text-[15px] font-bold">$206.00</span>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[48px] w-full"
            onClick={() => window.print()}
          >
            Download Receipt
          </Button>
          {failed && (
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
