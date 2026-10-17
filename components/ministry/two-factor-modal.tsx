'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useState } from 'react';

const METHODS = [
  {
    key: 'app',
    title: 'Authenticator app',
    desc: 'Use an app like Google Authenticator or authy. This is most secure option.',
    recommended: true,
  },
  {
    key: 'email',
    title: 'Email OTP',
    desc: 'Receive codes via email. Backup option, less secure if email is compromised',
  },
  {
    key: 'sms',
    title: 'SMS Text Message',
    desc: 'Receive codes via text message. Convenient but vulnerable to SIM swapping',
  },
  {
    key: 'passkey',
    title: 'Pass key',
    desc: 'Password free login. Encrypted and synced.',
  },
];

/** Settings → Security → Set up Two-Factor Authentication (Figma 564:26783). */
export function TwoFactorModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
}) {
  const [method, setMethod] = useState('app');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[90%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-[16px] bg-white px-7 py-7 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute top-5 right-5 flex size-7 items-center justify-center rounded-full border border-[#ededed] text-black transition-opacity hover:opacity-70">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div>
            <Dialog.Title className="text-[20px] font-bold text-brand-blue">
              Set up Two- Factor Authentication
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[13px] text-[#333]">
              Choose your 2FA method
            </Dialog.Description>
          </div>

          <div className="flex flex-col gap-3">
            {METHODS.map((m) => {
              const on = method === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    'flex items-start justify-between gap-4 rounded-[10px] border p-4 text-left transition-colors',
                    on
                      ? 'border-[#34a853] bg-[#f7fdf9]'
                      : 'border-[#ededed] hover:bg-[#f7f9fc]'
                  )}
                >
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-brand-blue">
                        {m.title}
                      </span>
                      {m.recommended && (
                        <span className="rounded-full bg-[#e7f7ee] px-2 py-0.5 text-[10px] font-medium text-[#34a853]">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="max-w-[300px] text-[12px] leading-snug text-brand-gray-500">
                      {m.desc}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                      on ? 'border-[#34a853]' : 'border-[#cdcdcd]'
                    )}
                  >
                    {on && <span className="size-2 rounded-full bg-[#34a853]" />}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            className="mt-1 h-[48px] w-full"
            onClick={() => onOpenChange(false)}
          >
            Continue
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
