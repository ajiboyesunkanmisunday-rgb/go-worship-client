'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Shared "Are you sure?" confirmation (Figma: Delete Tag 154:13998, profile deactivate/logout). */
export function ConfirmModal({
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
          <span className="text-[56px] leading-none">🥺</span>
          <Dialog.Title className="text-[24px] font-bold">
            Are you sure?
          </Dialog.Title>
          <Dialog.Description className="text-[14px] text-brand-gray-500">
            This action cannot be Undone.
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
