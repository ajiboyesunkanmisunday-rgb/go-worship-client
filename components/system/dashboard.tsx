'use client';

import { StatCard } from '@/components/ministry/shared';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { type SystemStats } from '@/lib/api/system';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';

const MOCK_TREND = [
  { month: 'May', value: 220 }, { month: 'Jun', value: 180 },
  { month: 'Jul', value: 260 }, { month: 'Aug', value: 220 },
  { month: 'Sep', value: 320 }, { month: 'Oct', value: 280 },
  { month: 'Nov', value: 360 }, { month: 'Dec', value: 300 },
  { month: 'Jan', value: 420 }, { month: 'Feb', value: 470 },
];

const MOCK_ACTIVITY = [
  { title: 'New tenant onboarded',    meta: 'Grace Community Church · 2h ago' },
  { title: 'Payment gateway updated', meta: 'Cornerstone Church · 5h ago' },
  { title: 'Subscription renewed',    meta: 'Impact Church · 1d ago' },
  { title: 'Tenant suspended',        meta: 'Hope Assembly · 2d ago' },
  { title: 'New admin provisioned',   meta: 'Celebration Church · 3d ago' },
];

const MOCK_STATS: SystemStats = {
  totalTenants: 130, activeTenants: 830, totalUsers: 1850,
  givingVolume: '$2.5M', trialTenants: 30, overduePayments: 130,
};

const ZERO_STATS: SystemStats = {
  totalTenants: 0, activeTenants: 0, totalUsers: 0,
  givingVolume: '$0', trialTenants: 0, overduePayments: 0,
};

const MOCK_PLANS = [['Starter', '58'], ['Pro', '54'], ['Enterprise', '18']];

/* Family codes from the API map to human-readable tab labels. */
const FAMILY_LABELS: Record<string, string> = {
  ENGAGEMENT:           'Engagement',
  FINANCE:              'Finance',
  COMMUNICATIONS:       'Communications',
  PLATFORM:             'Platform',
  TENANT_OPERATIONS:    'Tenant Operations',
  CONTENT:              'Content',
  SECURITY:             'Security',
  GUEST_SELF_SERVICE:   'Guest Self Service',
  CUSTOMER_SELF_SERVICE:'Customer Self Service',
  CAMPUS_OPERATIONS:    'Campus Operations',
};

const DEFAULT_FAMILIES = Object.keys(FAMILY_LABELS);

const chartConfig = {
  value: { label: 'Trend', color: '#5a4fe0' },
} satisfies ChartConfig;

function fmt(n: number | string): string {
  if (typeof n === 'string' && n) return n;
  if (!n) return '0';
  return Number(n).toLocaleString();
}

export function SystemDashboard() {
  const [stats, setStats] = useState<SystemStats>(USE_LIVE_API ? ZERO_STATS : MOCK_STATS);
  const [trendData, setTrendData] = useState<{ month: string; value: number }[]>(
    USE_LIVE_API ? [] : MOCK_TREND
  );
  const [activity, setActivity] = useState(USE_LIVE_API ? [] : MOCK_ACTIVITY);
  const [plans, setPlans] = useState(USE_LIVE_API ? [] : MOCK_PLANS);
  const [adminName, setAdminName] = useState(USE_LIVE_API ? '' : 'Super System Administrator');
  const [dashTab, setDashTab] = useState('Platform');
  const [families, setFamilies] = useState<string[]>(DEFAULT_FAMILIES);

  const loadFamily = useCallback(async (family: string) => {
    if (!USE_LIVE_API) return;
    const u = await getUnifiedDashboard('LAST_30_DAYS', 'USD', family.toUpperCase().replace(/ /g, '_'));
    if (!u) return;

    if (u.adminDisplayName) setAdminName(u.adminDisplayName);
    if (u.availableFamilies.length > 0) setFamilies(u.availableFamilies);

    setStats((prev) => ({
      ...prev,
      totalTenants:    u.totalTenants,
      activeTenants:   u.activeTenants,
      newTenants:      u.newTenants,
      totalCampuses:   u.totalCampuses,
      totalUsers:      u.totalUsers,
      activeUsers:     u.activeUsers,
      newUsers:        u.newUsers,
      activeSessions:  u.activeSessions,
      riskySessions:   u.riskySessions,
      successfulAuths: u.successfulAuths,
      failedAuths:     u.failedAuths,
      lockedAccounts:  u.lockedAccounts,
      mfaEnabledUsers: u.mfaEnabledUsers,
      auditFailures:   u.auditFailures,
    }));

    if (u.trend.length > 0) {
      setTrendData(u.trend.map((p) => ({ month: p.label, value: p.value })));
    }
  }, []);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    loadFamily('PLATFORM');

    // Recent audit activity
    (api.get<unknown>('/system/audit/events/recent') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data) ? (data as R[]) : [];
        if (arr.length === 0) return;
        const mapped = arr.map((a) => {
          const rawTs = String(a['createdAt'] ?? a['timestamp'] ?? '');
          const ts = rawTs
            ? new Date(rawTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          const action = String(a['action'] ?? a['title'] ?? a['eventType'] ?? '');
          const resource = String(a['resourceType'] ?? '');
          const actor = String(a['username'] ?? a['performedBy'] ?? a['createdBy'] ?? '');
          return {
            title: resource ? `${action} ${resource}`.toLowerCase().replace(/_/g, ' ') : action,
            meta: `${actor} · ${ts}`.replace(/^·\s*$/, ''),
          };
        }).filter((a) => a.title).slice(0, 5);
        if (mapped.length > 0) setActivity(mapped);
      })
      .catch(() => {});

    // Plan distribution
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
          .map((p) => [
            String(p['name'] ?? p['planName'] ?? ''),
            String(p['tenantCount'] ?? p['count'] ?? p['subscribers'] ?? '0'),
          ] as [string, string])
          .filter(([name]) => name);
        if (mapped.length > 0) setPlans(mapped);
      })
      .catch(() => {});
  }, [loadFamily]);

  const handleTabChange = (familyCode: string) => {
    const label = FAMILY_LABELS[familyCode] ?? familyCode;
    setDashTab(label);
    loadFamily(familyCode);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">
          Hello, {adminName} 👋
        </h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          Go Worship
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[13px]">
        {families.map((f) => {
          const label = FAMILY_LABELS[f] ?? f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => handleTabChange(f)}
              className={cn(
                'rounded-full border px-4 py-1.5 transition-colors',
                label === dashTab
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-[#e5e5e5] text-brand-gray-500 hover:border-brand-blue/40'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-3 text-[16px] font-bold">Platform overview</p>
        <p className="mb-4 text-[13px] text-brand-gray-500">Current platform tenant, user, campus and session health.</p>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard title="Total tenants"   value={fmt(stats.totalTenants)}                      variant="blue" />
          <StatCard title="Active tenants"  value={fmt(stats.activeTenants)}                     variant="green" />
          <StatCard title="New tenants"     value={fmt(stats.newTenants ?? 0)}                   variant="white" />
          <StatCard title="Total campuses"  value={fmt(stats.totalCampuses ?? 0)}                variant="white" />
          <StatCard title="Active users"    value={fmt(stats.activeUsers ?? stats.totalUsers)}   variant="white" />
          <StatCard title="New users"       value={fmt(stats.newUsers ?? 0)}                     variant="white" />
          <StatCard title="Active sessions" value={fmt(stats.activeSessions ?? 0)}               variant="white" />
          <StatCard title="Risky sessions"  value={fmt(stats.riskySessions ?? 0)}                variant="white" />
        </div>
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
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
              <Area type="monotone" dataKey="value" stroke="#5a4fe0" strokeWidth={2} fill="url(#sysFill)" />
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

      <div>
        <p className="mb-3 text-[16px] font-bold">Security</p>
        <p className="mb-4 text-[13px] text-brand-gray-500">Authentication, session, MFA and audit health.</p>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard title="Successful authentications" value={fmt(stats.successfulAuths ?? 0)} variant="green" />
          <StatCard title="Failed authentications"     value={fmt(stats.failedAuths ?? 0)}     variant="white" />
          <StatCard title="Active sessions"            value={fmt(stats.activeSessions ?? 0)}  variant="white" />
          <StatCard title="Risky sessions"             value={fmt(stats.riskySessions ?? 0)}   variant="white" />
          <StatCard title="Locked accounts"            value={fmt(stats.lockedAccounts ?? 0)}  variant="white" />
          <StatCard title="MFA-enabled users"          value={fmt(stats.mfaEnabledUsers ?? 0)} variant="white" />
          <StatCard title="Audit failures"             value={fmt(stats.auditFailures ?? 0)}   variant="white" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Trial Tenants"    value={fmt(stats.trialTenants)}    variant="white" />
        <StatCard title="Overdue Payments" value={fmt(stats.overduePayments)} variant="white" />
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
