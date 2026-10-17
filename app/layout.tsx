import './globals.css';
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { poppins, plusJakartaSans } from '@/providers/font';
import { cn } from '@/lib/utils';
import { ReactNode, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Go Worship',
  description: 'Go Worship',
};

type Props = Readonly<{
  children: ReactNode;
  modal: ReactNode;
}>;

export default function RootLayout({ children, modal }: Props) {
  return (
    <html lang="en">
      <body
        className={cn(
          poppins.variable,
          plusJakartaSans.variable,
          'antialiased'
        )}
      >
        <NuqsAdapter>
          {children}
          {modal}
        </NuqsAdapter>
        <Suspense>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
