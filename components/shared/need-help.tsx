'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { HelpCircle, Mail, MessageCircle, Phone, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const CONTACTS = [
  {
    icon: Mail,
    label: 'Email support',
    value: 'support@go-worship.com',
    href: 'mailto:support@go-worship.com',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: '+1 (416) 555-0132',
    href: 'tel:+14165550132',
  },
  {
    icon: MessageCircle,
    label: 'Live chat',
    value: 'Mon – Fri, 9am – 5pm EST',
    href: '#',
  },
];

function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
              Need Help?
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[13px] text-brand-gray-500">
              Our support team is here for you. Reach us any of these ways.
            </Dialog.Description>
          </div>

          <div className="flex flex-col gap-2">
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="flex items-center gap-3 rounded-[10px] border border-[#ededed] p-3 no-underline transition-colors hover:bg-[#f4f7ff]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9f0ff]">
                  <c.icon className="size-4 text-brand-blue" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">
                    {c.label}
                  </span>
                  <span className="text-[12px] text-brand-gray-500">
                    {c.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Floating "Need Help?" pill (auth screens). */
export function NeedHelpButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed right-6 bottom-6 z-20 flex items-center gap-1.5 rounded-full bg-brand-navy',
          'px-3.5 py-2.5 text-[11px] font-semibold text-white shadow-md transition-colors hover:bg-brand-navy/90',
          'lg:right-10 lg:bottom-10',
          className
        )}
      >
        <Image
          src="/auth/question.svg"
          alt=""
          width={18}
          height={18}
          className="size-[18px]"
        />
        Need Help?
      </button>
      <HelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Inline "Need Help?" pill used at the bottom of portal sidebars. */
export function NeedHelpPill() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full bg-[#0e1420] px-4 py-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0e1420]/90"
      >
        <HelpCircle className="size-4" />
        Need Help?
      </button>
      <HelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
