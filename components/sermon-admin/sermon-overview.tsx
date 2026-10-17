'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#1a1a1a]">{label}</span>
      <span className="text-[12px] text-brand-gray-500">{value}</span>
    </div>
  );
}

/** Sermon Overview slide-over (Figma 139:11237). */
export function SermonOverview({ backTo }: { backTo?: string } = {}) {
  const router = useRouter();
  const back = backTo ?? '/sermon-admin/sermons';

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Sermon Overview"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <h1 className="text-center text-[24px] font-bold">Sermon Overview</h1>

        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                Sermon Title
              </p>
              <p className="text-[12px] text-brand-gray-500">
                Walk by Faith and Love
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Status:</p>
              <p className="text-[13px] font-medium text-[#34a853]">Published</p>
            </div>
          </div>

          <div className="flex w-[150px] flex-col items-center justify-center gap-2 rounded-[10px] bg-[#ece9ff] py-8">
            <Music className="size-9 text-[#1a1a2e]" />
            <p className="text-[11px] text-[#333]">Walk by Faith. MP3</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 border-y border-[#ededed] py-4">
          <Meta label="Speaker name:" value="Pastor Christian John" />
          <Meta label="Series:" value="Faith & Love Series" />
          <Meta label="Date:" value="Feb 10,2025" />
          <Meta label="Duration:" value="48 mins" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#1a1a1a]">
            YouTube/Vimeo link
          </p>
          <div className="rounded-[8px] bg-[#f4f4f4] px-4 py-3.5 text-[12px] text-brand-gray-500">
            https://www.youtube.com/watch?v=1hkEg5ugqD0
          </div>
        </div>

        <div className="rounded-[8px] border border-[#ededed] p-4">
          <p className="text-[13px] font-medium text-[#1a1a1a]">
            Description / Summary
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-brand-gray-500">
            We walk by faith and not by sight, according to The scriptures that
            says, we are blessed when we walk by faith Heb 11:1 - end
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/1/edit`)}
          >
            Edit Sermon
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Unpublished Sermon
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
