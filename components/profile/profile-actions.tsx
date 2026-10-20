'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { logout as apiLogout } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';

function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(): void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 rounded-[16px] bg-white px-8 py-12 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute top-6 right-6 text-black transition-opacity hover:opacity-70">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          <span className="text-[56px] leading-none">😉</span>
          <Dialog.Title className="text-[24px] font-bold">
            Are you sure?
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Please confirm this action.
          </Dialog.Description>
          <div className="flex items-center gap-4">
            <Button onClick={onConfirm} size="lg" className="min-w-[100px]">
              Yes
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px] text-brand-blue"
            >
              No
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProfileActions() {
  const router = useRouter();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="flex w-full items-center justify-center gap-4 pt-2">
      <button
        type="button"
        onClick={() => setDeactivateOpen(true)}
        className="h-[56px] w-full max-w-[244px] rounded-[5px] border border-brand-red text-[16px] font-semibold text-brand-red transition-colors hover:bg-brand-red/5 lg:text-[17px]"
      >
        Deactivate account
      </button>
      <button
        type="button"
        onClick={() => setLogoutOpen(true)}
        className="h-[56px] w-full max-w-[244px] rounded-[5px] bg-brand-blue text-[16px] font-semibold text-white transition-colors hover:bg-brand-blue/90 lg:text-[17px]"
      >
        Log out
      </button>

      <ConfirmModal
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        onConfirm={() => setDeactivateOpen(false)}
      />
      <ConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={async () => {
          setLogoutOpen(false);
          if (USE_LIVE_API) {
            try { await apiLogout(); } catch { /* fall through */ }
          }
          router.push('/auth/login');
        }}
      />
    </div>
  );
}
