'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ministry/shared';
import { SERIES_STATUSES } from '@/components/sermon-admin/dashboard';
import { DataCard, QuickAccess, StatusText, ViewEditButton } from '@/components/sermon-admin/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Series = { id: string; name: string; desc: string; count: string; status: string; date: string };

const SERIES_MOCK: Series[] = [
  { id: '1', name: 'Faith in Action', desc: 'Weekly faith teaching', count: '12', status: 'Published', date: 'Jan 10, 2025' },
  { id: '2', name: 'Hope in Motion', desc: 'Monthly outreach program', count: '30', status: 'Uploading', date: 'Feb 15, 2025' },
  { id: '3', name: 'Unity in Diversity', desc: 'Quarterly community gathering', count: '50', status: 'Published', date: 'Mar 20, 2025' },
  { id: '4', name: 'Love as a Verb', desc: 'Annual charity event', count: '100', status: 'Scheduled', date: 'Apr 25, 2025' },
  { id: '5', name: 'Service Above Self', desc: 'Weekly volunteer opportunity', count: '20', status: 'Draft', date: 'May 30, 2025' },
];

export default function SermonAdminSeriesPage() {
  const [series, setSeries] = useState<Series[]>(USE_LIVE_API ? [] : SERIES_MOCK);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/content/series') as Promise<unknown>)
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
        const mapped: Series[] = arr.map((s) => {
          const rawDate = String(s['createdAt'] ?? s['publishedAt'] ?? s['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const rawStatus = String(s['status'] ?? 'Draft');
          const st = rawStatus.toUpperCase();
          const status = st.includes('PUBLISH') || st === 'ACTIVE' || st === 'LIVE' ? 'Published'
            : st.includes('SCHEDUL') ? 'Scheduled'
            : st.includes('UPLOAD') || st.includes('PROCESS') ? 'Uploading'
            : 'Draft';
          return {
            id: String(s['id'] ?? s['seriesId'] ?? ''),
            name: String(s['name'] ?? s['title'] ?? s['seriesName'] ?? ''),
            desc: String(s['description'] ?? s['desc'] ?? ''),
            count: String(s['sermonCount'] ?? s['totalSermons'] ?? s['count'] ?? '0'),
            status,
            date,
          };
        }).filter((s) => s.name);
        if (mapped.length > 0) setSeries(mapped);
      })
      .catch(() => {});
  }, []);

  const draftCount = series.filter((s) => s.status === 'Draft').length;

  const togglePublish = (idx: number) => {
    const s = series[idx];
    if (!USE_LIVE_API || !s.id) return;
    const endpoint = s.status === 'Published'
      ? `/tenant/admin/content/series/${s.id}/unpublish`
      : `/tenant/admin/content/series/${s.id}/publish`;
    (api.patch<unknown>(endpoint, {}) as Promise<unknown>)
      .then(() => {
        setSeries((prev) => prev.map((item, i) =>
          i === idx ? { ...item, status: item.status === 'Published' ? 'Draft' : 'Published' } : item
        ));
      })
      .catch(() => {});
  };

  const rows: SmartRow[] = series.map((s, i) => ({
    group: s.status,
    text: [s.name, s.desc, s.count, s.status, s.date],
    cells: [
      <span key="n" className="font-medium">{s.name}</span>,
      s.desc,
      s.count,
      <StatusText key="s" value={s.status} />,
      s.date,
      <div key="a" className="flex items-center gap-1.5">
        <ViewEditButton
          variant={s.status === 'Published' ? 'view' : 'edit'}
          href={
            s.status === 'Published'
              ? `/sermon-admin/series/${s.id || i + 1}`
              : `/sermon-admin/series/${s.id || i + 1}/edit`
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
          <StatCard title="Total Series" value={String(USE_LIVE_API ? series.length : (series.length || 24))} variant="blue" />
          <StatCard title="Draft Sermons" value={String(USE_LIVE_API ? draftCount : (draftCount || 10))} variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Series Name', 'Description', 'No. of Sermons', 'Status', 'Created On', '']}
        rows={rows}
        filterOptions={SERIES_STATUSES}
        filterAll="All status"
      />
    </div>
  );
}
