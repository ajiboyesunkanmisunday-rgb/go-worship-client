'use client';

import { cn } from '@/lib/utils';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import {
  ArrowUpRight,
  FolderClosed,
  Plus,
} from 'lucide-react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { ReceiptButton } from '@/components/ministry/receipt-button';
import { getUnifiedDashboard, type UnifiedDashboardStats } from '@/lib/api/dashboard';
import { getCustomerPayments, paymentToGiving } from '@/lib/api/customer';
import { USE_LIVE_API } from '@/lib/api/config';
import type { Transaction } from '@/components/ministry/shared';

/* ---------------- Stat cards ---------------- */

function StatCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: string;
  variant: 'blue' | 'green' | 'white';
}) {
  const blue = variant === 'blue';
  return (
    <div
      className={cn(
        'relative flex min-h-[135px] flex-col justify-between rounded-[14px] p-5',
        blue && 'bg-brand-blue text-white',
        variant === 'green' && 'bg-[#eefaf3]',
        variant === 'white' && 'bg-white'
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn('text-[15px]', blue ? 'text-white' : 'text-[#333]')}>
          {title}
        </span>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            blue ? 'bg-white/15' : 'bg-brand-blue/10'
          )}
        >
          <ArrowUpRight
            className={cn('size-4', blue ? 'text-white' : 'text-brand-blue')}
          />
        </span>
      </div>
      <p className={cn('text-[32px] font-bold', blue ? 'text-white' : 'text-black')}>
        {value}
      </p>
      <p
        className={cn(
          'text-[11px] font-light',
          blue ? 'text-white/80' : 'text-brand-gray-500'
        )}
      >
        40% Increased from Last month
      </p>
    </div>
  );
}

/* ---------------- Finance chart ---------------- */

const MOCK_FINANCE_DATA = [
  { month: 'May', value: 220 }, { month: 'Jun', value: 300 },
  { month: 'Jul', value: 240 }, { month: 'Aug', value: 340 },
  { month: 'Sep', value: 280 }, { month: 'Oct', value: 380 },
  { month: 'Nov', value: 300 }, { month: 'Dec', value: 460 },
  { month: 'Jan', value: 420 }, { month: 'Feb', value: 470 },
];

const financeConfig = {
  value: { label: 'Finance', color: '#5a4fe0' },
} satisfies ChartConfig;

function FinanceOverview({ data }: { data: { label: string; value: number }[] }) {
  const chartData = data.length > 0
    ? data.map((p) => ({ month: p.label, value: p.value }))
    : MOCK_FINANCE_DATA;
  return (
    <div className="rounded-[14px] bg-white p-6">
      <h2 className="text-[18px] font-bold">Finance overview</h2>
      <ChartContainer config={financeConfig} className="mt-4 h-[240px] w-full">
        <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="financeFill" x1="0" y1="0" x2="0" y2="1">
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
            domain={[0, 500]}
            ticks={[100, 200, 300, 400, 500]}
            tickFormatter={(v) => `$${v}k`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#5a4fe0"
            strokeWidth={2}
            fill="url(#financeFill)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

/* ---------------- Quick actions ---------------- */

const QUICK_ACTIONS = [
  {
    href: '/ministry/media/uploads',
    title: 'Uploaded Media',
    subtitle: '2.3GB · 40 items',
    icon: (
      <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#ff8d28]">
        <FolderClosed className="size-5 text-white" />
      </span>
    ),
  },
  {
    href: '/ministry/media',
    title: 'Add new Sermon',
    subtitle: 'Click here to add sermons',
    icon: (
      <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
        <Plus className="size-5 text-white" />
      </span>
    ),
  },
  {
    href: '/ministry/groups',
    title: 'Create Group',
    subtitle: 'Click here to create group',
    icon: (
      <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
        <Plus className="size-5 text-white" />
      </span>
    ),
  },
  {
    href: '/ministry/media',
    title: 'Create new series',
    subtitle: 'Click here to create series',
    icon: (
      <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
        <Plus className="size-5 text-white" />
      </span>
    ),
  },
];

function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      {QUICK_ACTIONS.map((a) => (
        <Link
          key={a.title}
          href={a.href}
          className="flex items-center gap-3 rounded-[12px] bg-white p-3 text-left no-underline transition-colors hover:bg-[#f4f7ff]"
        >
          {a.icon}
          <div>
            <p className="text-[13px] font-semibold text-brand-blue">
              {a.title}
            </p>
            <p className="text-[11px] text-brand-gray-500">{a.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------------- Recent activity ---------------- */

const ACTIVITY = [
  { state: 'Published' },
  { state: 'Published' },
  { state: 'Uploading' },
  { state: 'Uploading' },
  { state: 'Published' },
];

function RecentActivity() {
  const [newest, setNewest] = useState(true);
  const items = newest ? ACTIVITY : [...ACTIVITY].reverse();

  return (
    <div className="flex flex-col rounded-[14px] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Recent Activity</h2>
        <div className="flex items-center gap-1 rounded-full bg-[#f2f2f2] p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setNewest(true)}
            className={cn(
              'rounded-full px-3 py-1',
              newest ? 'bg-black text-white' : 'text-brand-gray-500'
            )}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setNewest(false)}
            className={cn(
              'rounded-full px-3 py-1',
              !newest ? 'bg-black text-white' : 'text-brand-gray-500'
            )}
          >
            Oldest
          </button>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {items.map((a, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium">Faith in Action</p>
              <p className="text-[12px] text-brand-gray-500">
                Weekly faith teaching
              </p>
            </div>
            <span className="text-[12px] text-brand-gray-500">Jan 10, 2025</span>
            {a.state === 'Published' ? (
              <span className="w-[70px] text-right text-[12px] font-medium text-[#34a853]">
                Published
              </span>
            ) : (
              <span className="flex w-[70px] flex-col items-end gap-1">
                <span className="text-[12px] font-medium text-[#ff8d28]">
                  Uploading
                </span>
                <span className="h-1 w-full rounded-full bg-[#ffe4c4]">
                  <span className="block h-full w-2/3 rounded-full bg-[#ff8d28]" />
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/ministry/media"
        className="mx-auto mt-6 flex h-9 items-center rounded-full bg-brand-blue px-6 text-[12px] text-white no-underline"
      >
        View all
      </Link>
    </div>
  );
}

/* ---------------- Transactions ---------------- */

const STATUS = {
  Pending: 'bg-[#fff4e5] text-[#ff8d28]',
  Success: 'bg-[#e7f7ee] text-[#34a853]',
  Failed: 'bg-[#fde8e8] text-[#eb0000]',
} as const;

const DEFAULT_TXNS: Transaction[] = [
  { status: 'Pending', type: 'General Offering' },
  { status: 'Success', type: 'Tithe Offering' },
  { status: 'Failed', type: 'Offering' },
  { status: 'Success', type: 'Thanksgiving' },
  { status: 'Pending', type: 'General Offering' },
  { status: 'Failed', type: 'General Offering' },
];

function mapTxnStatus(s?: string): Transaction['status'] {
  if (s === 'SUCCEEDED') return 'Success';
  if (s === 'FAILED' || s === 'CANCELED' || s === 'EXPIRED') return 'Failed';
  return 'Pending';
}

function Transactions({ rows }: { rows: Transaction[] }) {
  const smartRows: SmartRow[] = rows.map((t, i) => ({
    group: t.status,
    text: [t.name ?? 'John Christain', t.status, t.date ?? 'June 12, 2025', t.amount ?? '$2000', t.method ?? 'Bank transfer', t.type],
    cells: [
      <span key="n" className="flex items-center gap-2">
        <span className="size-6 rounded-full bg-brand-gray-200" />
        {t.name ?? 'John Christain'}
      </span>,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          STATUS[t.status]
        )}
      >
        {t.status}
      </span>,
      t.date ?? 'June 12, 2025',
      t.amount ?? '$2000',
      t.method ?? 'Bank transfer',
      t.type,
      <ReceiptButton key="a" highlighted={i === 0} name={t.name} date={t.date} method={t.method} fund={t.type} amount={t.amount} />,
    ],
  }));

  return (
    <div className="flex flex-col">
      <SmartTable
        title="Transactions"
        headers={['Name', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Receipt']}
        rows={smartRows}
        showSearch={false}
        showExport={false}
        sortToggle
        pageSize={6}
      />
      <Link
        href="/ministry/finance"
        className="mx-auto -mt-2 flex h-9 items-center rounded-full bg-brand-blue px-6 text-[12px] text-white no-underline"
      >
        View all
      </Link>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

const MOCK_STATS: UnifiedDashboardStats = {
  totalGiving: '$6500', totalMembers: 830, totalGroups: 150,
  totalEvents: 100, upcomingEvents: 0,
  totalTenants: 0, activeTenants: 0, totalUsers: 0,
  trend: [],
};

export function MinistryDashboard() {
  const [stats, setStats] = useState<UnifiedDashboardStats>(MOCK_STATS);
  const [txns, setTxns] = useState<Transaction[]>(DEFAULT_TXNS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getUnifiedDashboard().then((s) => { if (s) setStats(s); }).catch(() => {});
    getCustomerPayments(0, 6).then((page) => {
      const rows = (page?.content ?? []).map((p) => {
        const g = paymentToGiving(p);
        const fmt = (n: number, cur: string) =>
          new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
        const date = g.date
          ? new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : undefined;
        const status: Transaction['status'] = mapTxnStatus(g.status);
        return { status, type: g.purpose, amount: fmt(g.amount, g.currency), date } satisfies Transaction;
      });
      if (rows.length > 0) setTxns(rows);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-[28px] font-bold lg:text-[32px]">
          Welcome back! 👋
        </h1>
        <p className="mt-1 text-[15px] text-brand-gray-500">
          Welcome to the church dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.4fr_0.7fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Giving" value={stats.totalGiving} variant="blue" />
          <StatCard title="Total Member" value={String(stats.totalMembers)} variant="green" />
          <StatCard title="Total Groups" value={String(stats.totalGroups)} variant="white" />
          <StatCard title="Total Events" value={String(stats.totalEvents)} variant="white" />
        </div>
        <FinanceOverview data={stats.trend} />
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        <RecentActivity />
        <Transactions rows={txns} />
      </div>
    </div>
  );
}
