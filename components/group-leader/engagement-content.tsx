'use client';

import { useEffect, useState } from 'react';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { StatCard } from '@/components/ministry/shared';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { DataPanel, type TableRow } from './shared';
import { getTenantGroups, getTenantStats, type TenantGroup, type TenantStats } from '@/lib/api/tenant';
import { getUnifiedDashboard } from '@/lib/api/dashboard';

const config = {
  v: { label: 'Engagement', color: '#243f84' },
} satisfies ChartConfig;

const FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
function last12MonthsLabel() {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  return `${FMT.format(start)} – ${FMT.format(end)}`;
}

function EngagementChart() {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [chartData, setChartData] = useState<{ month: string; v: number }[]>([]);
  const [engagementScore, setEngagementScore] = useState('—');

  useEffect(() => {
    getTenantStats().then((s) => {
      if (s) {
        setStats(s);
        if (s.totalMembers > 0) {
          const pct = Math.round((s.activeMembers / s.totalMembers) * 100);
          setEngagementScore(`${pct}%`);
        }
      }
    }).catch(() => {});
    getUnifiedDashboard('LAST_12_MONTHS').then((d) => {
      if (d && d.trend.length > 0) {
        setChartData(d.trend.map((p) => ({ month: p.label, v: p.value })));
      }
    }).catch(() => {});
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
              <p className="text-[34px] font-bold text-brand-blue">{engagementScore}</p>
            </div>
            <span className="rounded-[6px] bg-[#f2f2f2] px-3 py-1.5 text-[11px] text-brand-gray-500">
              {last12MonthsLabel()}
            </span>
          </div>

          <ChartContainer config={config} className="mt-4 h-[240px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: 4 }}>
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
          <StatCard title="Active Members" value={String(stats?.activeMembers ?? 0)} variant="blue" />
          <StatCard title="Inactive Members" value={String(stats && stats.totalMembers > 0 ? stats.totalMembers - stats.activeMembers : 0)} variant="white" />
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
  const [rows, setRows] = useState<TableRow[]>([]);

  useEffect(() => {
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
