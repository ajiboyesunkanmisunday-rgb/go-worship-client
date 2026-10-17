'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * "Successful" confirmation slide-over shown after create/update actions
 * (Figma "new group" 530:37983 and its siblings).
 */
export function SuccessPanel({
  message = 'You have successfully Updated the group',
  backTo,
}: {
  message?: string;
  backTo: string;
}) {
  const router = useRouter();

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={backTo}
      title="Successful"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(backTo)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="flex size-[68px] items-center justify-center rounded-full bg-[#34a853]">
            <Check className="size-9 text-white" strokeWidth={3} />
          </span>
          <div>
            <h1 className="text-[22px] font-bold">Successful</h1>
            <p className="mt-1 max-w-[260px] text-[13px] text-brand-gray-500">
              {message}
            </p>
          </div>
        </div>

        <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
          <button
            type="button"
            onClick={() => router.push(backTo)}
            className="text-brand-blue"
          >
            Close
          </button>
        </Button>
      </div>
    </SheetPage>
  );
}
