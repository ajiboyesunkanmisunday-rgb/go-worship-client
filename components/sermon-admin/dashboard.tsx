'use client';

import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import { DataCard, QuickAccess, StatusText, ViewEditButton } from './shared';
import { useEffect, useState } from 'react';
import { getTenantStats, type TenantStats } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

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

export function SermonAdminDashboard() {
  const [stats, setStats] = useState<TenantStats | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantStats().then((s) => { if (s) setStats(s); }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative overflow-hidden rounded-[14px] bg-white p-6">
          <h1 className="text-[28px] font-bold lg:text-[32px]">Hello 👋</h1>
          <p className="mt-2 max-w-[320px] text-[14px] text-brand-gray-500">
            Welcome to Go Worship Platform
          </p>
          <span className="pointer-events-none absolute -right-8 top-8 size-[210px] rounded-full border-[6px] border-[#eef1fb]" />
          <span className="pointer-events-none absolute right-16 top-24 size-[130px] rounded-full border-[6px] border-[#e6ebf8]" />
        </div>

        <QuickAccess />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Series" value={stats ? String(stats.totalGroups) : '24'} variant="blue" />
        <StatCard title="Total Sermons" value={stats ? String(stats.totalEvents) : '43'} variant="white" />
        <StatCard title="Published Sermons" value="15" variant="white" />
        <StatCard title="Draft Sermons" value="10" variant="white" />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Series Name', 'Description', 'No. of Sermons', 'Status', 'Created On', '']}
        rows={seriesRows()}
        filterOptions={SERIES_STATUSES}
        filterAll="All status"
      />
    </div>
  );
}
