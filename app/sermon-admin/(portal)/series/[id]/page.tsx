'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

const back = '/sermon-admin/series';

const MOCK = {
  title: 'Faith in Action',
  description: 'Weekly faith teaching series exploring how faith manifests in daily life.',
  sermonCount: '12',
  status: 'Published',
  createdAt: 'Jan 10, 2025',
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#1a1a1a]">{label}</span>
      <span className="text-[12px] text-brand-gray-500">{value}</span>
    </div>
  );
}

/** Series detail slide-over — mirrors sermon-overview layout. */
export default function SermonAdminSeriesDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState(USE_LIVE_API ? { title: '', description: '', sermonCount: '', status: '', createdAt: '' } : MOCK);

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    (api.get<unknown>(`/tenant/admin/content/series/${id}`) as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const d = data as R;
        const rawDate = String(d['createdAt'] ?? d['publishedAt'] ?? '');
        const createdAt = rawDate
          ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : MOCK.createdAt;
        const rawStatus = String(d['status'] ?? 'Published');
        setSeries({
          title: String(d['title'] ?? d['name'] ?? d['seriesName'] ?? MOCK.title),
          description: String(d['description'] ?? d['desc'] ?? MOCK.description),
          sermonCount: String(d['sermonCount'] ?? d['totalSermons'] ?? d['count'] ?? MOCK.sermonCount),
          status: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase(),
          createdAt,
        });
      })
      .catch(() => {});
  }, [id]);

  const togglePublish = () => {
    if (!USE_LIVE_API || !id) return;
    const action = series.status.toUpperCase() === 'PUBLISHED' ? 'unpublish' : 'publish';
    (api.patch(`/tenant/admin/content/series/${id}/${action}`, {}) as Promise<unknown>)
      .then(() => {
        setSeries((prev) => ({
          ...prev,
          status: action === 'publish' ? 'Published' : 'Draft',
        }));
      })
      .catch(() => {});
    router.push(back);
  };

  return (
    <SheetPage className="w-full max-w-[665px]!" backLink={back} title="Series Overview">
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <h1 className="text-center text-[24px] font-bold">Series Overview</h1>

        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Series Title</p>
              <p className="text-[12px] text-brand-gray-500">{series.title}</p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Status:</p>
              <p className="text-[13px] font-medium text-[#34a853]">{series.status}</p>
            </div>
          </div>

          <div className="flex w-[150px] flex-col items-center justify-center gap-2 rounded-[10px] bg-[#ece9ff] py-8">
            <BookOpen className="size-9 text-[#1a1a2e]" />
            <p className="text-[11px] text-[#333]">{series.sermonCount} Sermons</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-y border-[#ededed] py-4">
          <Meta label="Sermon count:" value={series.sermonCount} />
          <Meta label="Created:" value={series.createdAt} />
        </div>

        <div className="rounded-[8px] border border-[#ededed] p-4">
          <p className="text-[13px] font-medium text-[#1a1a1a]">Description</p>
          <p className="mt-2 text-[12px] leading-relaxed text-brand-gray-500">
            {series.description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${id}/edit`)}
          >
            Edit Series
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={togglePublish}>
              {series.status.toUpperCase() === 'PUBLISHED' ? 'Unpublish Series' : 'Publish Series'}
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
