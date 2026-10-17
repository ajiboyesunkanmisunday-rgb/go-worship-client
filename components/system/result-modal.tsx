'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

/**
 * Successful / Error result modal used by the System Plans & Billing flow
 * (green check "Successful" and red X "Error" frames on board 778:38441).
 */
export function ResultModal({
  variant,
  open,
  onOpenChange,
  message,
  /** Optional primary action (e.g. the design's "View Details" on success). */
  actionLabel,
  onAction,
}: {
  variant: 'success' | 'error';
  open: boolean;
  onOpenChange(v: boolean): void;
  message: string;
  actionLabel?: string;
  onAction?(): void;
}) {
  const success = variant === 'success';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-[16px] bg-white px-8 py-12 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
        <span
            className={cn(
              'flex size-[60px] items-center justify-center rounded-full',
              success ? 'bg-[#34a853]' : 'bg-[#eb0000]'
            )}
          >
            {success ? (
              <Check className="size-8 text-white" strokeWidth={3} />
            ) : (
              <X className="size-8 text-white" strokeWidth={3} />
            )}
          </span>

          <Dialog.Title className="text-[20px] font-bold">
            {success ? 'Successful' : 'Error'}
          </Dialog.Title>
          <Dialog.Description className="max-w-[280px] text-center text-[13px] text-brand-gray-500">
            {message}
          </Dialog.Description>

          {actionLabel && onAction ? (
            <Button
              size="lg"
              onClick={onAction}
              className="mt-2 h-[48px] w-full"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="mt-2 h-[48px] w-full text-brand-blue"
            >
              Close
            </Button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
