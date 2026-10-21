'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import {
  DataCard,
  QuickAccess,
  StatusText,
  ViewEditButton,
} from '@/components/sermon-admin/shared';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Sermon = { id: string; title: string; speaker: string; series: string; date: string; status: string };

const SERMONS: Sermon[] = [
  { id: '1', title: 'Walking in Faith', speaker: 'Pastor John', series: 'Faith in Action', date: 'Feb 10', status: 'Published' },
  { id: '2', title: 'Hope in Motion', speaker: 'Pastor John', series: 'Faith in Action', date: 'Draft', status: 'Draft' },
  { id: '3', title: 'Unity in Diversity', speaker: 'Pastor Mary', series: 'Love in Action', date: 'Draft', status: 'Published' },
  { id: '4', title: 'Love as a Verb', speaker: 'Pastor John', series: 'Love in Action', date: 'June 12', status: 'Scheduled' },
  { id: '5', title: 'Service Above Self', speaker: 'Pastor John', series: 'Love in Action', date: 'June 12', status: 'Draft' },
];

export default function SermonAdminSermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>(USE_LIVE_API ? [] : SERMONS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/content/sermons') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: Sermon[] = arr.map((s) => {
          const rawDate = String(s['publishedAt'] ?? s['scheduledAt'] ?? s['createdAt'] ?? s['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
          const rawStatus = String(s['status'] ?? 'Draft');
          const st = rawStatus.toUpperCase();
          const status = st.includes('PUBLISH') ? 'Published'
            : st.includes('SCHEDUL') ? 'Scheduled'
            : 'Draft';
          return {
            id: String(s['id'] ?? s['sermonId'] ?? ''),
            title: String(s['title'] ?? s['sermonTitle'] ?? s['name'] ?? ''),
            speaker: String(s['speaker'] ?? s['speakerName'] ?? s['preacher'] ?? ''),
            series: String(s['seriesName'] ?? s['series'] ?? s['seriesTitle'] ?? ''),
            date,
            status,
          };
        }).filter((s) => s.title);
        if (mapped.length > 0) setSermons(mapped);
      })
      .catch(() => {});
  }, []);

  const draftCount = sermons.filter((s) => s.status === 'Draft').length;

  const togglePublish = (idx: number) => {
    const s = sermons[idx];
    if (!USE_LIVE_API || !s.id) return;
    const endpoint = s.status === 'Published'
      ? `/tenant/admin/content/sermons/${s.id}/unpublish`
      : `/tenant/admin/content/sermons/${s.id}/publish`;
    (api.patch<unknown>(endpoint, {}) as Promise<unknown>)
      .then(() => {
        setSermons((prev) => prev.map((item, i) =>
          i === idx ? { ...item, status: item.status === 'Published' ? 'Draft' : 'Published' } : item
        ));
      })
      .catch(() => {});
  };

  const rows: SmartRow[] = sermons.map((s, i) => ({
    group: s.status,
    text: [s.title, s.speaker, s.series, s.date, s.status, 'Audio'],
    cells: [
      <span key="t" className="font-medium">{s.title}</span>,
      s.speaker,
      s.series,
      s.date,
      <StatusText key="s" value={s.status} />,
      'Audio',
      <div key="a" className="flex items-center gap-1.5">
        <ViewEditButton
          variant={s.status === 'Published' ? 'view' : 'edit'}
          href={
            s.status === 'Published'
              ? `/sermon-admin/sermons/${s.id || i + 1}`
              : `/sermon-admin/sermons/${s.id || i + 1}/edit`
          }
        />
        {USE_LIVE_API && s.id && (s.status === 'Published' || s.status === 'Draft') && (
          <button
            type="button"
            onClick={() => togglePublish(i)}
            className={`flex h-8 min-w-[64px] items-center justify-center rounded-[6px] text-[11px] text-white ${s.status === 'Published' ? 'bg-brand-gray-400' : 'bg-green-600'}`}
          >
            {s.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
        )}
      </div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Sermons" value={String(USE_LIVE_API ? sermons.length : (sermons.length || 24))} variant="blue" />
          <StatCard title="Draft Sermons" value={String(USE_LIVE_API ? draftCount : (draftCount || 10))} variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Sermon Title', 'Speaker', 'Series', 'Date', 'Status', 'Media', '']}
        rows={rows}
        filterOptions={['Published', 'Draft', 'Scheduled']}
        filterAll="All status"
      />
    </div>
  );
}
