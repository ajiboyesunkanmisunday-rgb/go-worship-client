'use client';

import { StatCard } from '@/components/ministry/shared';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';
import { type SystemStats } from '@/lib/api/system';
import { getUnifiedDashboard, type DashboardSection } from '@/lib/api/dashboard';
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

/* Section subtitles (not in API response, matched to DO). */
const SECTION_SUBTITLES: Record<string, string> = {
  PLATFORM_OVERVIEW:   'Current platform tenant, user, campus and session health.',
  SECURITY:            'Authentication, session, MFA and audit health.',
  TENANT_GROWTH:       'Tenants created during the selected period.',
  COMPLIANCE:          'Authentication, session, MFA and audit health.',
  AUDIT:               'Authentication, session, MFA and audit health.',
  SUBSCRIPTIONS:       'Platform subscription and invoice health.',
  TENANTS:             'Authorized tenant and campus operational summary.',
  OVERVIEW:            'Tenant operational overview.',
  MEMBERS:             'Member and user summary.',
  CAMPUSES:            'Campus operations summary.',
  USERS:               'User account summary.',
  SUBSCRIPTION:        'Subscription and billing details.',
  EVENTS:              'Events and attendance summary.',
  CONTENT:             'Published content summary.',
  GIVING:              'Giving and donation summary.',
  ENGAGEMENT_OVERVIEW: 'Member engagement summary.',
};

const areaConfig = {
  value: { label: 'Trend', color: '#5a4fe0' },
} satisfies ChartConfig;

const barConfig = {
  value: { label: 'Count', color: '#243f84' },
} satisfies ChartConfig;

const MOCK_PLANS = [['Starter', '58'], ['Pro', '54'], ['Enterprise', '18']];

function fmt(n: number | string): string {
  if (typeof n === 'string' && n) return n;
  if (!n) return '0';
  return Number(n).toLocaleString();
}

/** Render a single API section block */
function SectionBlock({ section }: { section: DashboardSection }) {
  const subtitle = SECTION_SUBTITLES[section.type] ?? '';
  const hasMetrics = section.metrics.length > 0;
  const chartPoints = section.series.flatMap((s) =>
    s.points.map((pt) => {
      const label = pt.timestamp
        ? new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short' })
        : (pt.label ?? '');
      return { month: label, value: pt.value };
    })
  );
  const hasChart = chartPoints.length > 0;

  if (!hasMetrics && !hasChart) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[16px] font-bold">{section.title}</p>
        {subtitle && <p className="mt-0.5 text-[13px] text-brand-gray-500">{subtitle}</p>}
      </div>
      {hasMetrics && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {section.metrics.map((m, i) => (
            <StatCard
              key={m.code}
              title={m.label}
              value={m.formattedValue || fmt(m.value)}
              variant={i === 0 ? 'blue' : 'white'}
            />
          ))}
        </div>
      )}
      {hasChart && (
        <div className="rounded-[14px] bg-white p-6">
          <ChartContainer config={barConfig} className="h-[200px] w-full">
            <BarChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
              <Bar dataKey="value" fill="#243f84" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}

/* Fallback mock sections when USE_LIVE_API is false */
const MOCK_SECTIONS: DashboardSection[] = [
  {
    type: 'PLATFORM_OVERVIEW',
    title: 'Platform overview',
    metrics: [
      { code: 'TOTAL_TENANTS',   label: 'Total tenants',   value: 130, formattedValue: '130' },
      { code: 'ACTIVE_TENANTS',  label: 'Active tenants',  value: 830, formattedValue: '830' },
      { code: 'NEW_TENANTS',     label: 'New tenants',     value: 30,  formattedValue: '30'  },
      { code: 'TOTAL_CAMPUSES',  label: 'Total campuses',  value: 12,  formattedValue: '12'  },
      { code: 'ACTIVE_USERS',    label: 'Active users',    value: 1850,formattedValue: '1,850' },
      { code: 'NEW_USERS',       label: 'New users',       value: 240, formattedValue: '240' },
      { code: 'ACTIVE_SESSIONS', label: 'Active sessions', value: 42,  formattedValue: '42'  },
      { code: 'RISKY_SESSIONS',  label: 'Risky sessions',  value: 3,   formattedValue: '3'   },
    ],
    series: [],
  },
  {
    type: 'SECURITY',
    title: 'Security',
    metrics: [
      { code: 'SUCCESSFUL_AUTHENTICATIONS', label: 'Successful authentications', value: 4210, formattedValue: '4,210' },
      { code: 'FAILED_AUTHENTICATIONS',     label: 'Failed authentications',     value: 64,   formattedValue: '64'   },
      { code: 'ACTIVE_SESSIONS',            label: 'Active sessions',            value: 42,   formattedValue: '42'   },
      { code: 'RISKY_SESSIONS',             label: 'Risky sessions',             value: 3,    formattedValue: '3'    },
      { code: 'LOCKED_ACCOUNTS',            label: 'Locked accounts',            value: 1,    formattedValue: '1'    },
      { code: 'MFA_ENABLED_USERS',          label: 'MFA-enabled users',          value: 120,  formattedValue: '120'  },
      { code: 'AUDIT_FAILURES',             label: 'Audit failures',             value: 12,   formattedValue: '12'   },
    ],
    series: [],
  },
  {
    type: 'SUBSCRIPTIONS',
    title: 'Subscriptions',
    metrics: [
      { code: 'TOTAL_SUBSCRIPTIONS',    label: 'Total subscriptions', value: 130, formattedValue: '130' },
      { code: 'ACTIVE_SUBSCRIPTIONS',   label: 'Active',              value: 105, formattedValue: '105' },
      { code: 'TRIALING_SUBSCRIPTIONS', label: 'Trialing',            value: 18,  formattedValue: '18'  },
      { code: 'PAST_DUE_SUBSCRIPTIONS', label: 'Past due',            value: 7,   formattedValue: '7'   },
      { code: 'SUSPENDED_SUBSCRIPTIONS',label: 'Suspended',           value: 0,   formattedValue: '0'   },
      { code: 'PAST_DUE_INVOICES',      label: 'Past-due invoices',   value: 7,   formattedValue: '7'   },
    ],
    series: [],
  },
];

export function SystemDashboard() {
  const [rawSections, setRawSections] = useState<DashboardSection[]>(USE_LIVE_API ? [] : MOCK_SECTIONS);
  const [trendData, setTrendData] = useState<{ month: string; value: number }[]>(
    USE_LIVE_API ? [] : MOCK_TREND
  );
  const [activity, setActivity] = useState(USE_LIVE_API ? [] : MOCK_ACTIVITY);
  const [plans, setPlans] = useState(USE_LIVE_API ? [] as [string, string][] : MOCK_PLANS as [string, string][]);
  const [adminName, setAdminName] = useState(USE_LIVE_API ? '' : 'Super System Administrator');
  const [dashFamily, setDashFamily] = useState('PLATFORM');
  const [families, setFamilies] = useState<string[]>(DEFAULT_FAMILIES);
  const [stats, setStats] = useState<SystemStats>(
    USE_LIVE_API
      ? { totalTenants: 0, activeTenants: 0, totalUsers: 0, givingVolume: '$0', trialTenants: 0, overduePayments: 0 }
      : MOCK_STATS
  );

  const loadFamily = useCallback(async (family: string) => {
    if (!USE_LIVE_API) return;
    const u = await getUnifiedDashboard('LAST_30_DAYS', 'USD', family.toUpperCase().replace(/ /g, '_'));
    if (!u) return;

    if (u.adminDisplayName) setAdminName(u.adminDisplayName);
    if (u.availableFamilies.length > 0) setFamilies(u.availableFamilies);

    setRawSections(u.rawSections);

    // Keep stats for bottom panels
    setStats((prev) => ({
      ...prev,
      totalTenants:    u.totalTenants,
      activeTenants:   u.activeTenants,
      trialTenants:    u.newTenants ?? prev.trialTenants,
      totalUsers:      u.totalUsers,
      givingVolume:    u.totalGiving,
    }));

    if (u.trend.length > 0) {
      setTrendData(u.trend.map((p) => ({ month: p.label, value: p.value })));
    }
  }, []);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    loadFamily('PLATFORM');

    (api.get<unknown>('/system/audit/events/recent') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        const mapped = arr.slice(0, 5).map((e) => {
          const action = String(e['action'] ?? e['eventType'] ?? e['type'] ?? 'Event');
          const resource = String(e['resource'] ?? e['entityType'] ?? e['target'] ?? '');
          const actor = String(e['performedBy'] ?? e['actor'] ?? e['tenantName'] ?? '');
          const at = e['createdAt'] ?? e['timestamp'] ?? e['eventTime'];
          let meta = actor;
          if (at) {
            const dt = new Date(String(at));
            if (!isNaN(dt.getTime())) {
              const diffH = Math.floor((Date.now() - dt.getTime()) / 3600000);
              meta += diffH < 24 ? ` · ${diffH}h ago` : ` · ${Math.floor(diffH / 24)}d ago`;
            }
          }
          const title = resource ? `${action}: ${resource}` : action;
          return { title, meta };
        });
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

      {/* Dynamic sections from API */}
      {rawSections.length > 0 ? (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-[14px] bg-white p-6">
          <h2 className="text-[18px] font-bold">Giving Volume Trend</h2>
          <ChartContainer config={areaConfig} className="mt-4 h-[260px] w-full">
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
