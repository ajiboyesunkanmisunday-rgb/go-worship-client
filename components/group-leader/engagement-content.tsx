'use client';

import { useEffect, useState } from 'react';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { StatCard } from '@/components/ministry/shared';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { DataPanel, type TableRow } from './shared';
import { GROUP_ROWS } from './groups-data';
import { getTenantGroups, getTenantStats, type TenantGroup, type TenantStats } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

const data = [
  { month: 'Jan', v: 3000 },
  { month: 'Feb', v: 6500 },
  { month: 'Mar', v: 3500 },
  { month: 'Apr', v: 4200 },
  { month: 'May', v: 2000 },
  { month: 'Jun', v: 9500 },
  { month: 'Jul', v: 3000 },
  { month: 'Aug', v: 5000 },
  { month: 'Sep', v: 4200 },
  { month: 'Oct', v: 1500 },
  { month: 'Nov', v: 9000 },
  { month: 'Dec', v: 4000 },
];

const config = {
  v: { label: 'Engagement', color: '#243f84' },
} satisfies ChartConfig;

function EngagementChart() {
  const [stats, setStats] = useState<TenantStats | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantStats().then((s) => { if (s) setStats(s); }).catch(() => {});
  }, []);

  return (
    <div className="rounded-[14px] bg-white p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.7fr]">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[22px] font-bold text-[#1a1a1a]">
                Engagement Score
              </p>
              <p className="text-[34px] font-bold text-brand-blue">78%</p>
            </div>
            <span className="rounded-[6px] bg-[#f2f2f2] px-3 py-1.5 text-[11px] text-brand-gray-500">
              Dec 31, 2024 – Dec 31, 2025
            </span>
          </div>

          <ChartContainer config={config} className="mt-4 h-[240px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: 4 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={40}
                domain={[0, 12000]}
                ticks={[2000, 4000, 6000, 8000, 10000, 12000]}
              />
              <Bar
                dataKey="v"
                fill="#243f84"
                radius={[6, 6, 0, 0]}
                barSize={22}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="flex flex-col gap-4">
          <StatCard title="Active Members" value={String(stats?.totalMembers ?? 50)} variant="blue" />
          <StatCard title="Inactive Members" value="15" variant="white" />
        </div>
      </div>
    </div>
  );
}

function toRow(g: TenantGroup): TableRow {
  return {
    cells: [g.name, g.description || 'Group', g.leaderName || '—', '—', String(g.memberCount)],
    status: g.status.toLowerCase() === 'active' ? 'Active' : ('Inactive' as const),
    href: `/group-leader/groups/${g.id}`,
  };
}

export function EngagementContent() {
  const [rows, setRows] = useState<TableRow[]>(GROUP_ROWS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantGroups().then((groups) => {
      const mapped = groups.map(toRow);
      if (mapped.length > 0) setRows(mapped);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <EngagementChart />
      <DataPanel
        title="All Groups"
        columns={['Group Name', 'Category', 'Leader', 'Meeting Day & Time', 'Members']}
        rows={rows}
      />
    </div>
  );
}
