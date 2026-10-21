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

type StatVariant = 'blue' | 'green' | 'white';

type FamilySection = {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: (s: SystemStats) => string | number; variant: StatVariant }>;
};

const FAMILY_SECTIONS: Record<string, FamilySection> = {
  TENANT_OPERATIONS: {
    title: 'Overview',
    subtitle: 'Authorized tenant and campus operational summary.',
    stats: [
      { label: 'Active campuses',       value: (s) => fmt(s.totalCampuses ?? 0),               variant: 'white' },
      { label: 'Active users',          value: (s) => fmt(s.activeUsers ?? s.totalUsers),       variant: 'white' },
      { label: 'New users',             value: (s) => fmt(s.newUsers ?? 0),                     variant: 'white' },
      { label: 'Received donations',    value: (s) => s.givingVolume ?? '$0',                   variant: 'white' },
      { label: 'Successful payments',   value: (s) => fmt(s.successfulAuths ?? 0),              variant: 'white' },
      { label: 'Upcoming events',       value: (s) => fmt(s.upcomingEvents ?? 0),               variant: 'white' },
      { label: 'Attendance records',    value: (s) => fmt(s.attendanceRecords ?? 0),            variant: 'white' },
      { label: 'Visitor follow-ups due',value: (s) => fmt(s.visitorFollowUps ?? 0),             variant: 'white' },
      { label: 'Published sermons',     value: (s) => fmt(s.publishedSermons ?? 0),             variant: 'white' },
    ],
  },
  PLATFORM: {
    title: 'Platform overview',
    subtitle: 'Current platform tenant, user, campus and session health.',
    stats: [
      { label: 'Total tenants',   value: (s) => fmt(s.totalTenants),                         variant: 'blue'  },
      { label: 'Active tenants',  value: (s) => fmt(s.activeTenants),                        variant: 'green' },
      { label: 'New tenants',     value: (s) => fmt(s.newTenants ?? 0),                      variant: 'white' },
      { label: 'Total campuses',  value: (s) => fmt(s.totalCampuses ?? 0),                   variant: 'white' },
      { label: 'Active users',    value: (s) => fmt(s.activeUsers ?? s.totalUsers),          variant: 'white' },
      { label: 'New users',       value: (s) => fmt(s.newUsers ?? 0),                        variant: 'white' },
      { label: 'Active sessions', value: (s) => fmt(s.activeSessions ?? 0),                  variant: 'white' },
      { label: 'Risky sessions',  value: (s) => fmt(s.riskySessions ?? 0),                   variant: 'white' },
    ],
  },
  SECURITY: {
    title: 'Security',
    subtitle: 'Authentication, session, MFA and audit health.',
    stats: [
      { label: 'Successful authentications', value: (s) => fmt(s.successfulAuths ?? 0), variant: 'green' },
      { label: 'Failed authentications',     value: (s) => fmt(s.failedAuths ?? 0),     variant: 'white' },
      { label: 'Active sessions',            value: (s) => fmt(s.activeSessions ?? 0),  variant: 'white' },
      { label: 'Risky sessions',             value: (s) => fmt(s.riskySessions ?? 0),   variant: 'white' },
      { label: 'Locked accounts',            value: (s) => fmt(s.lockedAccounts ?? 0),  variant: 'white' },
      { label: 'MFA-enabled users',          value: (s) => fmt(s.mfaEnabledUsers ?? 0), variant: 'white' },
      { label: 'Audit failures',             value: (s) => fmt(s.auditFailures ?? 0),   variant: 'white' },
    ],
  },
  FINANCE: {
    title: 'Finance',
    subtitle: 'Platform revenue, giving and billing health.',
    stats: [
      { label: 'Giving volume',      value: (s) => s.givingVolume ?? '$0',    variant: 'blue'  },
      { label: 'Total tenants',      value: (s) => fmt(s.totalTenants),       variant: 'white' },
      { label: 'Active tenants',     value: (s) => fmt(s.activeTenants),      variant: 'green' },
      { label: 'Trial tenants',      value: (s) => fmt(s.trialTenants ?? 0),  variant: 'white' },
      { label: 'Overdue payments',   value: (s) => fmt(s.overduePayments ?? 0), variant: 'white' },
    ],
  },
  ENGAGEMENT: {
    title: 'Engagement',
    subtitle: 'Member, group and event engagement across tenants.',
    stats: [
      { label: 'Active users',    value: (s) => fmt(s.activeUsers ?? s.totalUsers), variant: 'blue'  },
      { label: 'New users',       value: (s) => fmt(s.newUsers ?? 0),               variant: 'white' },
      { label: 'Active sessions', value: (s) => fmt(s.activeSessions ?? 0),          variant: 'white' },
      { label: 'Total tenants',   value: (s) => fmt(s.totalTenants),                 variant: 'white' },
    ],
  },
  COMMUNICATIONS: {
    title: 'Communications',
    subtitle: 'Messaging and notification health across the platform.',
    stats: [
      { label: 'Active tenants', value: (s) => fmt(s.activeTenants),                variant: 'blue'  },
      { label: 'Active users',   value: (s) => fmt(s.activeUsers ?? s.totalUsers),  variant: 'white' },
      { label: 'New users',      value: (s) => fmt(s.newUsers ?? 0),                variant: 'white' },
    ],
  },
  CONTENT: {
    title: 'Content',
    subtitle: 'Published sermons, media and content across tenants.',
    stats: [
      { label: 'Published sermons', value: (s) => fmt(s.publishedSermons ?? 0),   variant: 'white' },
      { label: 'Active tenants',    value: (s) => fmt(s.activeTenants),            variant: 'blue'  },
      { label: 'Active users',      value: (s) => fmt(s.activeUsers ?? s.totalUsers), variant: 'white' },
    ],
  },
  GUEST_SELF_SERVICE: {
    title: 'Guest Self Service',
    subtitle: 'Guest registrations and self-service activity.',
    stats: [
      { label: 'Active tenants', value: (s) => fmt(s.activeTenants),               variant: 'blue'  },
      { label: 'Total campuses', value: (s) => fmt(s.totalCampuses ?? 0),          variant: 'white' },
      { label: 'Active users',   value: (s) => fmt(s.activeUsers ?? s.totalUsers), variant: 'white' },
    ],
  },
  CUSTOMER_SELF_SERVICE: {
    title: 'Customer Self Service',
    subtitle: 'Customer portal and self-service activity.',
    stats: [
      { label: 'Active tenants', value: (s) => fmt(s.activeTenants),               variant: 'blue'  },
      { label: 'Active users',   value: (s) => fmt(s.activeUsers ?? s.totalUsers), variant: 'white' },
      { label: 'New users',      value: (s) => fmt(s.newUsers ?? 0),               variant: 'white' },
    ],
  },
  CAMPUS_OPERATIONS: {
    title: 'Campus Operations',
    subtitle: 'Campus events, attendance and operations.',
    stats: [
      { label: 'Active campuses',    value: (s) => fmt(s.totalCampuses ?? 0),          variant: 'blue'  },
      { label: 'Active users',       value: (s) => fmt(s.activeUsers ?? s.totalUsers), variant: 'white' },
      { label: 'Upcoming events',    value: (s) => fmt(s.upcomingEvents ?? 0),         variant: 'white' },
      { label: 'Attendance records', value: (s) => fmt(s.attendanceRecords ?? 0),      variant: 'white' },
    ],
  },
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
  const [dashFamily, setDashFamily] = useState('TENANT_OPERATIONS');
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

    loadFamily('TENANT_OPERATIONS');

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
    setDashFamily(familyCode);
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
                f === dashFamily
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-[#e5e5e5] text-brand-gray-500 hover:border-brand-blue/40'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {(() => {
        const section = FAMILY_SECTIONS[dashFamily] ?? FAMILY_SECTIONS['PLATFORM'];
        return (
          <div>
            <p className="mb-3 text-[16px] font-bold">{section.title}</p>
            <p className="mb-4 text-[13px] text-brand-gray-500">{section.subtitle}</p>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {section.stats.map((s) => (
                <StatCard key={s.label} title={s.label} value={String(s.value(stats))} variant={s.variant} />
              ))}
            </div>
          </div>
        );
      })()}

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
