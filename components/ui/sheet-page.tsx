'use client';

import { useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Sheet, SheetContent, SheetTitle } from './sheet';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{
  className?: string;
  backLink?: string;
  /** Accessible title for screen readers (visually hidden). */
  title?: string;
}>;

export function SheetPage({
  className,
  children,
  backLink,
  title = 'Details',
}: Props) {
  const router = useRouter();

  const onClose = () => {
    if (backLink) {
      router.push(backLink);
      return;
    }

    router.back();
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className={cn(className)}>
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
