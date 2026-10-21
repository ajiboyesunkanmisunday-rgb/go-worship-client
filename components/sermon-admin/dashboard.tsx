'use client';

import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import { DataCard, QuickAccess, StatusText, ViewEditButton } from './shared';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { getUnifiedDashboard, type UnifiedDashboardStats } from '@/lib/api/dashboard';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';

export const SERIES = [
  { name: 'Faith in Action', desc: 'Weekly faith teaching', count: '12', status: 'Published', date: 'Jan 10, 2025' },
  { name: 'Hope in Motion', desc: 'Monthly outreach program', count: '30', status: 'Uploading', date: 'Feb 15, 2025' },
  { name: 'Unity in Diversity', desc: 'Quarterly community gathering', count: '50', status: 'Published', date: 'Mar 20, 2025' },
  { name: 'Love as a Verb', desc: 'Annual charity event', count: '100', status: 'Scheduled', date: 'Apr 25, 2025' },
  { name: 'Service Above Self', desc: 'Weekly volunteer opportunity', count: '20', status: 'Draft', date: 'May 30, 2025' },
];

export const SERIES_STATUSES = [
  'Published',
  'Uploading',
  'Scheduled',
  'Draft',
];

export function seriesRows(): SmartRow[] {
  return SERIES.map((s, i) => ({
    group: s.status,
    text: [s.name, s.desc, s.count, s.status, s.date],
    cells: [
      <span key="n" className="font-medium">{s.name}</span>,
      s.desc,
      s.count,
      <StatusText key="s" value={s.status} />,
      s.date,
      <ViewEditButton
        key="a"
        variant={i % 2 === 0 ? 'view' : 'edit'}
        href={
          i % 2 === 0
            ? `/sermon-admin/sermons/${i + 1}`
            : `/sermon-admin/sermons/${i + 1}/edit`
        }
      />,
    ],
  }));
}

type SeriesItem = { name: string; desc: string; count: string; status: string; date: string };

export function SermonAdminDashboard() {
  const [stats, setStats] = useState<UnifiedDashboardStats | null>(null);
  const [series, setSeries] = useState<SeriesItem[]>(USE_LIVE_API ? [] : SERIES);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState(USE_LIVE_API ? '' : 'Go Worship');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getUnifiedDashboard('LAST_30_DAYS', 'USD', 'CONTENT').then((s) => { if (s) setStats(s); }).catch(() => {});
    getProfile().then((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});

    (api.get<unknown>('/tenant/admin/media/series') as Promise<unknown>)
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
        const mapped: SeriesItem[] = arr.map((s) => {
          const rawDate = String(s['createdAt'] ?? s['publishedAt'] ?? s['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const rawStatus = String(s['status'] ?? 'Draft');
          const st = rawStatus.toUpperCase();
          const status = st.includes('PUBLISH') || st === 'ACTIVE' || st === 'LIVE' ? 'Published'
            : st.includes('SCHEDUL') ? 'Scheduled'
            : st.includes('UPLOAD') || st.includes('PROCESS') ? 'Uploading'
            : 'Draft';
          return {
            name: String(s['name'] ?? s['title'] ?? s['seriesName'] ?? ''),
            desc: String(s['description'] ?? s['desc'] ?? ''),
            count: String(s['sermonCount'] ?? s['totalSermons'] ?? s['count'] ?? '0'),
            status, date,
          };
        }).filter((s) => s.name);
        if (mapped.length > 0) setSeries(mapped);
      })
      .catch(() => {});
  }, []);

  const publishedCount = series.filter((s) => s.status === 'Published').length;
  const draftCount = series.filter((s) => s.status === 'Draft').length;

  const liveRows: SmartRow[] = series.map((s, i) => ({
    group: s.status,
    text: [s.name, s.desc, s.count, s.status, s.date],
    cells: [
      <span key="n" className="font-medium">{s.name}</span>,
      s.desc, s.count,
      <StatusText key="s" value={s.status} />,
      s.date,
      <ViewEditButton
        key="a"
        variant={s.status === 'Published' ? 'view' : 'edit'}
        href={s.status === 'Published' ? `/sermon-admin/sermons/${i + 1}` : `/sermon-admin/sermons/${i + 1}/edit`}
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative overflow-hidden rounded-[14px] bg-white p-6">
          <h1 className="text-[28px] font-bold lg:text-[32px]">Hello{userName ? `, ${userName}` : ''} 👋</h1>
          <p className="mt-2 max-w-[320px] text-[14px] text-brand-gray-500">
            Welcome to {orgName} Go worship Platform
          </p>
          <span className="pointer-events-none absolute -right-8 top-8 size-[210px] rounded-full border-[6px] border-[#eef1fb]" />
          <span className="pointer-events-none absolute right-16 top-24 size-[130px] rounded-full border-[6px] border-[#e6ebf8]" />
        </div>

        <QuickAccess />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Series" value={stats ? String(stats.totalGroups) : (USE_LIVE_API ? String(series.length) : '24')} variant="blue" />
        <StatCard title="Total Sermons" value={stats ? String(stats.totalEvents) : (USE_LIVE_API ? '0' : '43')} variant="white" />
        <StatCard title="Published Sermons" value={String(publishedCount || (USE_LIVE_API ? 0 : 15))} variant="white" />
        <StatCard title="Draft Sermons" value={String(draftCount || (USE_LIVE_API ? 0 : 10))} variant="white" />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Series Name', 'Description', 'No. of Sermons', 'Status', 'Created On', '']}
        rows={liveRows}
        filterOptions={SERIES_STATUSES}
        filterAll="All status"
      />
    </div>
  );
}
