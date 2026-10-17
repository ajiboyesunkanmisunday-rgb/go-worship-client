'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const LINES = [
  ['Donor', 'John Christain'],
  ['Reference', 'GW-2025-004821'],
  ['Date', 'June 12, 2025'],
  ['Method', 'Bank transfer'],
  ['Fund / Campaign', 'General Offering'],
];

/** Transaction receipt modal — makes the table's "View" action functional. */
export function ReceiptButton({ highlighted }: { highlighted?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'h-8 w-[52px] rounded-[6px] text-[11px] text-white transition-opacity hover:opacity-90',
          highlighted ? 'bg-brand-blue' : 'bg-brand-gray-300'
        )}
      >
        View
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-[16px] bg-white px-7 py-8 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <Dialog.Close className="absolute top-5 right-5 text-black transition-opacity hover:opacity-70">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <Image
              src="/auth/infinity-blue.svg"
              alt="Go Worship"
              width={56}
              height={19}
              className="h-[19px] w-[56px]"
            />

            <div>
              <Dialog.Title className="text-[20px] font-bold">
                Giving Receipt
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] text-brand-gray-500">
                Transaction details for this contribution.
              </Dialog.Description>
            </div>

            <div className="flex flex-col gap-3 rounded-[10px] bg-[#f7f9fc] p-4">
              {LINES.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-[12px] text-brand-gray-500">{k}</span>
                  <span className="text-[12px] font-medium text-[#1a1a1a]">
                    {v}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between gap-4 border-t border-[#e5e9f0] pt-3">
                <span className="text-[13px] font-semibold">Total</span>
                <span className="text-[16px] font-bold text-brand-blue">
                  $2000
                </span>
              </div>
            </div>

            <Button size="lg" className="h-[48px] w-full" onClick={() => window.print()}>
              Download Receipt
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
