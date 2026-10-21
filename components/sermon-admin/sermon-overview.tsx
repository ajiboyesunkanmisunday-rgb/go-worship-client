'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#1a1a1a]">{label}</span>
      <span className="text-[12px] text-brand-gray-500">{value}</span>
    </div>
  );
}

type Sermon = {
  title: string; status: string; speaker: string; series: string;
  date: string; duration: string; videoUrl: string; description: string; fileName: string;
};

const MOCK_SERMON: Sermon = {
  title: 'Walk by Faith and Love', status: 'Published',
  speaker: 'Pastor Christian John', series: 'Faith & Love Series',
  date: 'Feb 10, 2025', duration: '48 mins',
  videoUrl: 'https://www.youtube.com/watch?v=1hkEg5ugqD0',
  description: 'We walk by faith and not by sight, according to The scriptures that says, we are blessed when we walk by faith Heb 11:1 - end',
  fileName: 'Walk by Faith. MP3',
};

/** Sermon Overview slide-over (Figma 139:11237). */
export function SermonOverview({ backTo, id }: { backTo?: string; id?: string } = {}) {
  const router = useRouter();
  const back = backTo ?? '/sermon-admin/sermons';
  const [sermon, setSermon] = useState<Sermon>(USE_LIVE_API ? { title: '', status: '', speaker: '', series: '', date: '', duration: '', videoUrl: '', description: '', fileName: '' } : MOCK_SERMON);

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    (api.get<unknown>(`/tenant/admin/content/sermons/${id}`) as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const d = data as R;
        const rawDate = String(d['publishedAt'] ?? d['scheduledAt'] ?? d['createdAt'] ?? d['date'] ?? '');
        const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const rawStatus = String(d['status'] ?? 'Published');
        const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        setSermon({
          title: String(d['title'] ?? d['sermonTitle'] ?? MOCK_SERMON.title),
          status,
          speaker: String(d['speaker'] ?? d['speakerName'] ?? d['preacher'] ?? MOCK_SERMON.speaker),
          series: String(d['seriesName'] ?? d['series'] ?? MOCK_SERMON.series),
          date: date || MOCK_SERMON.date,
          duration: String(d['duration'] ?? d['durationMins'] ? `${d['durationMins']} mins` : MOCK_SERMON.duration),
          videoUrl: String(d['videoUrl'] ?? d['youtubeUrl'] ?? d['streamUrl'] ?? MOCK_SERMON.videoUrl),
          description: String(d['description'] ?? d['summary'] ?? MOCK_SERMON.description),
          fileName: String(d['fileName'] ?? d['mediaFile'] ?? MOCK_SERMON.fileName),
        });
      })
      .catch(() => {});
  }, [id]);

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
              <p className="text-[13px] font-medium text-[#1a1a1a]">Sermon Title</p>
              <p className="text-[12px] text-brand-gray-500">{sermon.title}</p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Status:</p>
              <p className="text-[13px] font-medium text-[#34a853]">{sermon.status}</p>
            </div>
          </div>

          <div className="flex w-[150px] flex-col items-center justify-center gap-2 rounded-[10px] bg-[#ece9ff] py-8">
            <Music className="size-9 text-[#1a1a2e]" />
            <p className="text-[11px] text-[#333]">{sermon.fileName}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 border-y border-[#ededed] py-4">
          <Meta label="Speaker name:" value={sermon.speaker} />
          <Meta label="Series:" value={sermon.series} />
          <Meta label="Date:" value={sermon.date} />
          <Meta label="Duration:" value={sermon.duration} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#1a1a1a]">YouTube/Vimeo link</p>
          <div className="rounded-[8px] bg-[#f4f4f4] px-4 py-3.5 text-[12px] text-brand-gray-500">
            {sermon.videoUrl}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#ededed] p-4">
          <p className="text-[13px] font-medium text-[#1a1a1a]">Description / Summary</p>
          <p className="mt-2 text-[12px] leading-relaxed text-brand-gray-500">
            {sermon.description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${id ?? '1'}/edit`)}
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
