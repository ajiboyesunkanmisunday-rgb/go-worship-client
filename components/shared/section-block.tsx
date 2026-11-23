'use client';

import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import type { DashboardSection } from '@/lib/api/dashboard';

const SECTION_SUBTITLES: Record<string, string> = {
  PLATFORM_OVERVIEW:    'Current platform tenant, user, campus and session health.',
  SECURITY:             'Authentication, session, MFA and audit health.',
  TENANT_GROWTH:        'Tenants created during the selected period.',
  COMPLIANCE:           'Authentication, session, MFA and audit health.',
  AUDIT:                'Authentication, session, MFA and audit health.',
  SUBSCRIPTIONS:        'Platform subscription and invoice health.',
  TENANTS:              'Authorized tenant and campus operational summary.',
  OVERVIEW:             'Authorized tenant and campus operational summary.',
  MEMBERS:              'Member and user summary.',
  CAMPUSES:             'Campus operations summary.',
  USERS:                'User account summary.',
  SUBSCRIPTION:         'Subscription and billing details.',
  EVENTS:               'Events and attendance summary.',
  CONTENT:              'Published content summary.',
  GIVING:               'Giving and donation summary.',
  ENGAGEMENT_OVERVIEW:  'Member engagement summary.',
};

const barConfig = {
  value: { label: 'Count', color: '#243f84' },
} satisfies ChartConfig;

function fmt(n: number | string): string {
  if (typeof n === 'string' && n) return n;
  if (!n) return '0';
  return Number(n).toLocaleString();
}

export function SectionMetrics({
  section,
  renderCard,
}: {
  section: DashboardSection;
  renderCard: (m: DashboardSection['metrics'][number], i: number) => React.ReactNode;
}) {
  if (section.metrics.length === 0) return null;
  const subtitle = SECTION_SUBTITLES[section.type] ?? '';
  const chartPoints = section.series.flatMap((s) =>
    s.points.map((pt) => ({
      month: pt.timestamp
        ? new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short' })
        : (pt.label ?? ''),
      value: pt.value,
    }))
  );
  const hasChart = chartPoints.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[16px] font-bold">{section.title}</p>
        {subtitle && <p className="mt-0.5 text-[13px] text-brand-gray-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {section.metrics.map((m, i) => renderCard(m, i))}
      </div>
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

/** Self-contained section block used in ministry and system dashboards. */
export function SectionBlock({
  section,
  accentColor = '#243f84',
}: {
  section: DashboardSection;
  accentColor?: string;
}) {
  if (section.metrics.length === 0 && section.series.length === 0) return null;
  const subtitle = SECTION_SUBTITLES[section.type] ?? '';
  const chartPoints = section.series.flatMap((s) =>
    s.points.map((pt) => ({
      month: pt.timestamp
        ? new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short' })
        : (pt.label ?? ''),
      value: pt.value,
    }))
  );
  const hasChart = chartPoints.length > 0;
  const colorConfig = { value: { label: 'Count', color: accentColor } } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[16px] font-bold">{section.title}</p>
        {subtitle && <p className="mt-0.5 text-[13px] text-brand-gray-500">{subtitle}</p>}
      </div>
      {section.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {section.metrics.map((m, i) => (
            <div
              key={m.code}
              className={`flex flex-col gap-2 rounded-[14px] p-5 ${i === 0 ? 'bg-brand-blue text-white' : 'bg-white'}`}
            >
              <span className={`text-[13px] ${i === 0 ? 'text-white/80' : 'text-brand-gray-500'}`}>{m.label}</span>
              <p className={`text-[28px] font-bold ${i === 0 ? 'text-white' : 'text-black'}`}>
                {m.formattedValue || fmt(m.value)}
              </p>
            </div>
          ))}
        </div>
      )}
      {hasChart && (
        <div className="rounded-[14px] bg-white p-6">
          <ChartContainer config={colorConfig} className="h-[200px] w-full">
            <BarChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
              <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
