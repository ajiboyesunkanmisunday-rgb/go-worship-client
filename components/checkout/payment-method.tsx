'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  Copy,
  CreditCard,
  Hash,
  Landmark,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const TABS = [
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'ussd', label: 'USSD', icon: Hash },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const VERB: Record<TabKey, string> = {
  card: 'Pay',
  transfer: 'Transfer',
  bank: 'Transfer',
  ussd: 'Pay',
};

function GreenButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex h-[56px] w-full items-center justify-center rounded-[4px] bg-[#5cb475] text-[18px] font-semibold text-white transition-colors hover:bg-[#4fa267]"
    >
      {children}
    </button>
  );
}

function OutlineButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex h-[56px] w-full items-center justify-center rounded-[4px] border border-[#9b9b9b]/40 text-[16px] font-semibold text-[#333] transition-colors hover:bg-[#f7f7f7]"
    >
      {children}
    </button>
  );
}

function AccountBox({ bank, account }: { bank: string; account: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[8px] bg-[#f2f2f2] px-6 py-6 text-center">
      <p className="text-[13px] text-[#9b9b9b]">Leadremit Checkout</p>
      <p className="text-[16px] font-semibold text-[#1a1a1a]">{bank}</p>
      <div className="flex items-center gap-2">
        <p className="text-[26px] font-bold tracking-wide text-[#1a1a1a]">
          {account}
        </p>
        <button
          type="button"
          aria-label="Copy account number"
          className="text-[#5b5757] hover:text-black"
        >
          <Copy className="size-[18px]" />
        </button>
      </div>
      <p className="text-[12px] text-[#9b9b9b]">Expires after 5 minute</p>
    </div>
  );
}

/**
 * Shared payment-method panel (Card / Transfer / Bank / USSD) used by both the
 * public checkout (101:4021) and the member giving slide-over (63:3361/63:3841).
 */
export function PaymentMethod({
  amount,
  onComplete,
}: {
  amount: string;
  onComplete: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('card');

  return (
    <div className="flex w-full flex-col">
      {/* header: logo + amount */}
      <div className="flex items-center justify-between">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />
        <p className="text-[16px] font-medium text-[#9b9b9b]">
          {VERB[tab]} <span className="text-[#318a12]">{amount}</span>
        </p>
      </div>

      {/* tabs */}
      <div className="mt-8 flex items-center gap-6 border-b border-[#f2f2f2]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 pb-3 text-[13px] font-medium transition-colors',
                active
                  ? 'border-[#58af6b] text-[#58af6b]'
                  : 'border-transparent text-[#5b5757] hover:text-black'
              )}
            >
              <Icon className="size-[15px]" />
              {label}
            </button>
          );
        })}
      </div>

      {/* panels */}
      <div className="mt-7 flex flex-col gap-4">
        {tab === 'card' && (
          <>
            <label className="flex flex-col gap-1 rounded-[4px] border border-[#9b9b9b]/30 px-3 py-2">
              <span className="text-[13px] text-[#9b9b9b]">CARD NUMBER</span>
              <Input
                className="h-auto border-0 p-0 text-[15px] font-semibold text-[#333] shadow-none placeholder:text-[#9b9b9b] focus-visible:ring-0"
                placeholder="0000 0000 0000 0000"
              />
            </label>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1 rounded-[4px] border border-[#9b9b9b]/30 px-3 py-2">
                <span className="text-[13px] text-[#9b9b9b]">CARD EXPIRY</span>
                <Input
                  className="h-auto border-0 p-0 text-[15px] font-semibold text-[#333] shadow-none placeholder:text-[#9b9b9b] focus-visible:ring-0"
                  placeholder="MM / YY"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 rounded-[4px] border border-[#9b9b9b]/30 px-3 py-2">
                <span className="flex items-center justify-between text-[13px] text-[#9b9b9b]">
                  CVV <span className="text-[11px]">HELP?</span>
                </span>
                <Input
                  className="h-auto border-0 p-0 text-[15px] font-semibold text-[#333] shadow-none placeholder:text-[#9b9b9b] focus-visible:ring-0"
                  placeholder="123"
                />
              </label>
            </div>

            <GreenButton onClick={onComplete}>Pay {amount}</GreenButton>
          </>
        )}

        {tab === 'transfer' && (
          <>
            <AccountBox bank="Bank of America" account="0001234567" />
            <OutlineButton onClick={onComplete}>
              I&apos;ve sent the money
            </OutlineButton>
          </>
        )}

        {tab === 'bank' && (
          <>
            <AccountBox bank="Chase Bank" account="0009876543" />
            <OutlineButton onClick={onComplete}>
              I&apos;ve sent the money
            </OutlineButton>
          </>
        )}

        {tab === 'ussd' && (
          <>
            <div className="flex flex-col items-center gap-2 rounded-[8px] bg-[#f2f2f2] px-6 py-8 text-center">
              <p className="text-[13px] text-[#9b9b9b]">
                Dial the code below to pay
              </p>
              <p className="text-[26px] font-bold tracking-wide text-[#1a1a1a]">
                *894*000*3000#
              </p>
              <p className="text-[12px] text-[#9b9b9b]">Expires after 5 minute</p>
            </div>
            <OutlineButton onClick={onComplete}>
              I&apos;ve completed the payment
            </OutlineButton>
          </>
        )}
      </div>
    </div>
  );
}
