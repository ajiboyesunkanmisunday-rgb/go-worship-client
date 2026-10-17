'use client';

import { cn } from '@/lib/utils';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { TransactionsTable, type Transaction } from './shared';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { getCustomerPayments, paymentToGiving } from '@/lib/api/customer';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';

/**
 * Tabs per the Church Admin "Analytics Dashboard" frame (494:22178). The frame's
 * tab bar has five labels — Finance (530:28840), Groups (530:28841),
 * Events (530:28842), Media (530:28843), Members (530:35544) — each rendering the
 * same "<Tab> overview" chart + Transactions table pattern.
 */
const TABS = ['Finance', 'Groups', 'Events', 'Media', 'Members'] as const;
const AUDIENCE = ['Non Member', 'Member'] as const;

const MOCK_CHART_DATA = [
  { month: 'May', value: 220 },
  { month: 'Jun', value: 300 },
  { month: 'Jul', value: 240 },
  { month: 'Aug', value: 340 },
  { month: 'Sep', value: 280 },
  { month: 'Oct', value: 380 },
  { month: 'Nov', value: 300 },
  { month: 'Dec', value: 460 },
  { month: 'Jan', value: 420 },
  { month: 'Feb', value: 470 },
];

const chartConfig = {
  value: { label: 'Overview', color: '#5a4fe0' },
} satisfies ChartConfig;

function mapStatus(s?: string): Transaction['status'] {
  if (s === 'SUCCEEDED') return 'Success';
  if (s === 'FAILED' || s === 'CANCELED' || s === 'EXPIRED') return 'Failed';
  return 'Pending';
}

export function AnalyticsContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Finance');
  const [audience, setAudience] = useState<string | null>(null);
  const [financeTrend, setFinanceTrend] = useState<{ month: string; value: number }[]>([]);
  const [tabTrend, setTabTrend] = useState<{ month: string; value: number }[]>([]);
  const [txns, setTxns] = useState<Transaction[] | undefined>(undefined);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getUnifiedDashboard()
      .then((s) => {
        if (s && s.trend.length > 0) {
          setFinanceTrend(s.trend.map((p) => ({ month: p.label, value: p.value })));
        }
      })
      .catch(() => {});
    getCustomerPayments(0, 20)
      .then((page) => {
        const rows = (page?.content ?? []).map((p) => {
          const g = paymentToGiving(p);
          const fmt = (n: number, cur: string) =>
            new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
          const date = g.date
            ? new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined;
          return { status: mapStatus(g.status), type: g.purpose, amount: fmt(g.amount, g.currency), date } satisfies Transaction;
        });
        if (rows.length > 0) setTxns(rows);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!USE_LIVE_API || tab === 'Finance') return;
    setTabTrend([]);
    const slug = tab.toLowerCase();
    (api.get<unknown>(`/tenant/admin/analytics/${slug}/trend`) as Promise<unknown>)
      .catch(() => api.get<unknown>(`/tenant/admin/analytics/${slug}`))
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['trend'])
            ? ((data as R)['trend'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const points = arr.map((p) => ({
          month: String(p['label'] ?? p['month'] ?? p['period'] ?? p['name'] ?? ''),
          value: Number(p['value'] ?? p['count'] ?? p['total'] ?? 0),
        })).filter((p) => p.month);
        if (points.length > 0) setTabTrend(points);
      }).catch(() => {});
  }, [tab]);

  const chartData =
    tab === 'Finance'
      ? (financeTrend.length > 0 ? financeTrend : MOCK_CHART_DATA)
      : (tabTrend.length > 0 ? tabTrend : MOCK_CHART_DATA);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">
        Analytics Dashboard
      </h1>

      <div className="flex flex-wrap gap-6 border-b border-[#ededed]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setAudience(null);
            }}
            className={cn(
              'pb-3 text-[14px] transition-colors',
              tab === t
                ? '-mb-px border-b-2 border-brand-blue font-medium text-brand-blue'
                : 'text-brand-gray-500 hover:text-black'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Finance' && (
        <div className="flex flex-wrap items-center gap-2">
          {AUDIENCE.map((a) => {
            const on = audience === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(on ? null : a)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[12px] transition-colors',
                  on
                    ? 'bg-[#e7f7ee] font-medium text-[#34a853]'
                    : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      )}

      {/* The audience-filtered state hides the chart and shows only the table. */}
      {audience === null && (
        <div className="rounded-[14px] bg-white p-6">
          <h2 className="text-[18px] font-bold">{tab} overview</h2>
          <ChartContainer config={chartConfig} className="mt-4 h-[280px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 8, bottom: 4, left: 4 }}
            >
              <defs>
                <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
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
                width={46}
                tickFormatter={(v) => `$${v}k`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5a4fe0"
                strokeWidth={2}
                fill="url(#analyticsFill)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      <TransactionsTable rows={txns} />
    </div>
  );
}
