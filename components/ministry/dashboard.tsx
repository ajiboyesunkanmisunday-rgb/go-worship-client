'use client';

import { cn } from '@/lib/utils';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { getUnifiedDashboard, type DashboardSection } from '@/lib/api/dashboard';
import { getTenantBranding } from '@/lib/api/tenant';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { StatCard } from '@/components/ministry/shared';

/* Family codes → human-readable tab labels */
const FAMILY_LABELS: Record<string, string> = {
  ENGAGEMENT:            'Engagement',
  FINANCE:               'Finance',
  COMMUNICATIONS:        'Communications',
  PLATFORM:              'Platform',
  TENANT_OPERATIONS:     'Tenant Operations',
  CONTENT:               'Content',
  SECURITY:              'Security',
  GUEST_SELF_SERVICE:    'Guest Self Service',
  CUSTOMER_SELF_SERVICE: 'Customer Self Service',
  CAMPUS_OPERATIONS:     'Campus Operations',
};

const DEFAULT_FAMILIES = Object.keys(FAMILY_LABELS);

/* Section subtitles matched to DO */
const SECTION_SUBTITLES: Record<string, string> = {
  OVERVIEW:            'Authorized tenant and campus operational summary.',
  USERS:               'Authorized tenant and campus operational summary.',
  CAMPUSES:            'Authorized tenant and campus operational summary.',
  SUBSCRIPTION:        'Authorized dashboard information.',
  MEMBERS:             'Authorized tenant and campus operational summary.',
  PLATFORM_OVERVIEW:   'Current platform tenant, user, campus and session health.',
  SECURITY:            'Authentication, session, MFA and audit health.',
  TENANT_GROWTH:       'Tenants created during the selected period.',
  COMPLIANCE:          'Authentication, session, MFA and audit health.',
  AUDIT:               'Authentication, session, MFA and audit health.',
  SUBSCRIPTIONS:       'Platform subscription and invoice health.',
  TENANTS:             'Authorized tenant and campus operational summary.',
  EVENTS:              'Events and attendance summary.',
  CONTENT:             'Published content summary.',
  GIVING:              'Giving and donation summary.',
  ENGAGEMENT_OVERVIEW: 'Member engagement summary.',
};

const barConfig = {
  value: { label: 'Count', color: '#243f84' },
} satisfies ChartConfig;

function fmt(n: number | string): string {
  if (typeof n === 'string' && n) return n;
  if (!n) return '0';
  return Number(n).toLocaleString();
}

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

/* Fallback mock sections for when USE_LIVE_API is false */
const MOCK_SECTIONS: DashboardSection[] = [
  {
    type: 'OVERVIEW',
    title: 'Overview',
    metrics: [
      { code: 'ACTIVE_CAMPUSES',      label: 'Active campuses',      value: 3,   formattedValue: '3' },
      { code: 'ACTIVE_USERS',         label: 'Active users',         value: 120, formattedValue: '120' },
      { code: 'NEW_USERS',            label: 'New users',            value: 18,  formattedValue: '18' },
      { code: 'RECEIVED_DONATIONS',   label: 'Received donations',   value: 0,   formattedValue: '0' },
      { code: 'SUCCESSFUL_PAYMENTS',  label: 'Successful payments',  value: 0,   formattedValue: '0' },
      { code: 'UPCOMING_EVENTS',      label: 'Upcoming events',      value: 2,   formattedValue: '2' },
      { code: 'ATTENDANCE_RECORDS',   label: 'Attendance records',   value: 45,  formattedValue: '45' },
      { code: 'PUBLISHED_SERMONS',    label: 'Published sermons',    value: 12,  formattedValue: '12' },
    ],
    series: [],
  },
  {
    type: 'MEMBERS',
    title: 'Members',
    metrics: [
      { code: 'ACTIVE_CAMPUSES',      label: 'Active campuses',      value: 3,   formattedValue: '3' },
      { code: 'ACTIVE_USERS',         label: 'Active users',         value: 120, formattedValue: '120' },
      { code: 'NEW_USERS',            label: 'New users',            value: 18,  formattedValue: '18' },
    ],
    series: [],
  },
];

export function MinistryDashboard() {
  const [rawSections, setRawSections] = useState<DashboardSection[]>(
    USE_LIVE_API ? [] : MOCK_SECTIONS
  );
  const [userName, setUserName] = useState(USE_LIVE_API ? '' : 'Super System Administrator');
  const [orgName, setOrgName] = useState(USE_LIVE_API ? '' : 'Go Worship');
  const [dashFamily, setDashFamily] = useState('TENANT_OPERATIONS');
  const [families, setFamilies] = useState<string[]>(DEFAULT_FAMILIES);

  const loadFamily = useCallback(async (family: string) => {
    if (!USE_LIVE_API) return;
    const u = await getUnifiedDashboard('LAST_30_DAYS', 'USD', family.toUpperCase().replace(/ /g, '_'));
    if (!u) return;

    if (u.adminDisplayName && !userName) setUserName(u.adminDisplayName);
    if (u.availableFamilies.length > 0) setFamilies(u.availableFamilies);
    setRawSections(u.rawSections);
  }, [userName]);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    getProfile().then((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});

    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});

    loadFamily('TENANT_OPERATIONS');
  }, [loadFamily]);

  const handleTabChange = (familyCode: string) => {
    setDashFamily(familyCode);
    loadFamily(familyCode);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">
          Hello, {userName} 👋
        </h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          {orgName || 'Go Worship'}
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

      {rawSections.length > 0 ? (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
