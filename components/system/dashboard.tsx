'use client';

import { StatCard } from '@/components/ministry/shared';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { getSystemStats, type SystemStats } from '@/lib/api/system';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';

const MOCK_TREND = [
  { month: 'May', value: 220 },
  { month: 'Jun', value: 180 },
  { month: 'Jul', value: 260 },
  { month: 'Aug', value: 220 },
  { month: 'Sep', value: 320 },
  { month: 'Oct', value: 280 },
  { month: 'Nov', value: 360 },
  { month: 'Dec', value: 300 },
  { month: 'Jan', value: 420 },
  { month: 'Feb', value: 470 },
];

const MOCK_ACTIVITY = [
  { title: 'New tenant onboarded',     meta: 'Grace Community Church · 2h ago' },
  { title: 'Payment gateway updated',  meta: 'Cornerstone Church · 5h ago' },
  { title: 'Subscription renewed',     meta: 'Impact Church · 1d ago' },
  { title: 'Tenant suspended',         meta: 'Hope Assembly · 2d ago' },
  { title: 'New admin provisioned',    meta: 'Celebration Church · 3d ago' },
];

const MOCK_STATS: SystemStats = {
  totalTenants: 130, activeTenants: 830, totalUsers: 1850,
  givingVolume: '$2.5M', trialTenants: 30, overduePayments: 130,
};

const MOCK_PLANS = [['Starter', '58'], ['Pro', '54'], ['Enterprise', '18']];

const chartConfig = {
  value: { label: 'Trend', color: '#5a4fe0' },
} satisfies ChartConfig;

function fmt(n: number | string): string {
  if (typeof n === 'string' && n) return n;
  if (!n) return '0';
  return Number(n).toLocaleString();
}

export function SystemDashboard() {
  const [stats, setStats] = useState<SystemStats>(MOCK_STATS);
  const [trendData, setTrendData] = useState(MOCK_TREND);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [plans, setPlans] = useState(MOCK_PLANS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getUnifiedDashboard().then((u) => {
      if (u && (u.totalTenants || u.totalUsers)) {
        setStats({
          totalTenants:    u.totalTenants,
          activeTenants:   u.activeTenants,
          totalUsers:      u.totalUsers,
          givingVolume:    u.totalGiving,
          trialTenants:    0,
          overduePayments: 0,
        });
      } else {
        getSystemStats().then((s) => { if (s) setStats(s); }).catch(() => {});
      }
      if (u && u.trend.length > 0) {
        setTrendData(u.trend.map((p) => ({ month: p.label, value: p.value })));
      }
    }).catch(() => {
      getSystemStats().then((s) => { if (s) setStats(s); }).catch(() => {});
    });

    (api.get<unknown>('/system/audit-logs?page=0&size=5') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : [];
        if (arr.length === 0) return;
        const mapped = arr.map((a) => {
          const rawTs = String(a['createdAt'] ?? a['timestamp'] ?? a['actionDate'] ?? '');
          const ts = rawTs ? new Date(rawTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          return {
            title: String(a['action'] ?? a['title'] ?? a['message'] ?? a['eventType'] ?? ''),
            meta: `${String(a['tenantName'] ?? a['orgName'] ?? a['performedBy'] ?? '')} · ${ts}`.replace(/^·\s*$/, ''),
          };
        }).filter((a) => a.title).slice(0, 5);
        if (mapped.length > 0) setActivity(mapped);
      })
      .catch(() => {});

    (api.get<unknown>('/system/billing/plans') as Promise<unknown>)
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
        const mapped: [string, string][] = arr
          .map((p) => [String(p['name'] ?? p['planName'] ?? ''), String(p['tenantCount'] ?? p['count'] ?? p['subscribers'] ?? '0')] as [string, string])
          .filter(([name]) => name);
        if (mapped.length > 0) setPlans(mapped);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">
            Platform Overview
          </h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Monitor your multi-tenant church platform
          </p>
        </div>
        <Link
          href="/system/tenants/create"
          className="flex h-10 items-center gap-2 rounded-[8px] bg-[#22a45d] px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-[#1c8c4f]"
        >
          <Plus className="size-4" />
          Add Tenants
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Total Tenants"  value={fmt(stats.totalTenants)}  variant="blue" />
        <StatCard title="Active Tenants" value={fmt(stats.activeTenants)} variant="green" />
        <StatCard title="Total Users"    value={fmt(stats.totalUsers)}    variant="white" />
        <StatCard title="Giving Volume"  value={fmt(stats.givingVolume)}  variant="white" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-[14px] bg-white p-6">
          <h2 className="text-[18px] font-bold">Giving Volume Trend</h2>
          <ChartContainer config={chartConfig} className="mt-4 h-[260px] w-full">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 8, bottom: 4, left: 4 }}
            >
              <defs>
                <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a4fe0" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5a4fe0" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5a4fe0"
                strokeWidth={2}
                fill="url(#sysFill)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="rounded-[14px] bg-white p-6">
          <h2 className="text-[18px] font-bold">Recent Activity</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-blue" />
                <div>
                  <p className="text-[13px] font-medium">{a.title}</p>
                  <p className="text-[12px] text-brand-gray-500">{a.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Trial Tenants"     value={fmt(stats.trialTenants)}    variant="white" />
        <StatCard title="Overdue Payments"  value={fmt(stats.overduePayments)} variant="white" />
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[14px] text-brand-gray-600">Plan Distribution</p>
          <div className="mt-3 flex flex-col gap-2 text-[13px]">
            {plans.map(([plan, n]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-brand-gray-500">{plan}</span>
                <span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
