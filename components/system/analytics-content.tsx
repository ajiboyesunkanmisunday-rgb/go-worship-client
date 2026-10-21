'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { getSystemTenants, type SystemTenant } from '@/lib/api/system';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';

/**
 * System → Analytics (778:38441). Distinct from the Ministry AnalyticsContent
 * the page used to (wrongly) reuse: the System design's tabs are
 * Finances / Tenants / Users / Subscription (Ministry's are Finance / Groups /
 * Events / Media / Members), the subtitle is "Monitor your multi-tenant church
 * platform", and each tab is an "<X> Overview" area chart above a table.
 *
 * Finances (Recent Transactions) and Tenants (Recent Tenants) columns are from
 * the design. Users + Subscription follow the same chart+table pattern.
 */

const TABS = ['Finances', 'Tenants', 'Users', 'Subscription'] as const;
type Tab = (typeof TABS)[number];

const trend = [
  { month: 'Jan', value: 120 },
  { month: 'Feb', value: 180 },
  { month: 'Mar', value: 150 },
  { month: 'Apr', value: 240 },
  { month: 'May', value: 200 },
  { month: 'Jun', value: 320 },
  { month: 'Jul', value: 280 },
  { month: 'Aug', value: 360 },
];

const chartConfig = {
  value: { label: 'Value', color: '#5a4fe0' },
} satisfies ChartConfig;

const STATUS: Record<string, string> = {
  Success: 'text-[#22a45d]',
  Successful: 'text-[#22a45d]',
  Active: 'text-[#22a45d]',
  Pending: 'text-[#ff8d28]',
  Failed: 'text-[#eb0000]',
  Inactive: 'text-[#eb0000]',
  Suspended: 'text-[#ff8d28]',
};

function Badge({ value }: { value: string }) {
  return <span className={cn('font-medium', STATUS[value])}>{value}</span>;
}

const OVERVIEW: Record<Tab, string> = {
  Finances: 'Financial Overview',
  Tenants: 'Tenants Overview',
  Users: 'Users Overview',
  Subscription: 'Subscription Overview',
};

/* ---- per-tab table data ---- */

const TRANSACTIONS = [
  { name: 'John Adeyemi', status: 'Success', amount: '$1000', type: 'General Offering' },
  { name: 'Grace Community', status: 'Pending', amount: '$3000', type: 'General Offering' },
  { name: 'Mercy Paul', status: 'Failed', amount: '$2000', type: 'General Offering' },
  { name: 'Celebration Church', status: 'Success', amount: '$1500', type: 'General Offering' },
];

const TENANTS = [
  { tenant: 'Grace Community Church', status: 'Active', plan: 'Enterprise', users: '10', members: '830', giving: '$125,000' },
  { tenant: 'Celebration Church Int', status: 'Active', plan: 'Growth', users: '8', members: '540', giving: '$70,000' },
  { tenant: 'Hope Assembly', status: 'Suspended', plan: 'Starter', users: '3', members: '120', giving: '$0' },
  { tenant: 'Impact Church', status: 'Active', plan: 'Growth', users: '6', members: '410', giving: '$54,000' },
];

const USERS = [
  { name: 'John Adeyemi', email: 'john@mail.com', role: 'Admin', status: 'Active', joined: 'Jan 12, 2025' },
  { name: 'Grace Community', email: 'grace@mail.com', role: 'Member', status: 'Active', joined: 'Feb 3, 2025' },
  { name: 'Mercy Paul', email: 'mercy@mail.com', role: 'Member', status: 'Inactive', joined: 'Mar 18, 2025' },
  { name: 'Celebration Church', email: 'celebration@mail.com', role: 'Admin', status: 'Active', joined: 'Apr 5, 2025' },
];

const SUBSCRIPTIONS = [
  { tenant: 'Grace Community Church', plan: 'Enterprise', status: 'Active', amount: '$199', renewal: 'Aug 31, 2025' },
  { tenant: 'Impact Church', plan: 'Growth', status: 'Active', amount: '$49', renewal: 'Aug 20, 2025' },
  { tenant: 'Hope Assembly', plan: 'Starter', status: 'Inactive', amount: '$0', renewal: '—' },
];

function tableFor(tab: Tab): { title: string; headers: string[]; rows: SmartRow[] } {
  if (tab === 'Tenants') {
    return {
      title: 'Recent Tenants',
      headers: ['Tenant', 'Status', 'Plan', 'Users', 'Members', 'Giving Volume', 'Created', 'Action'],
      rows: TENANTS.map((t) => ({
        group: t.status,
        text: [t.tenant, t.status, t.plan, t.users, t.members, t.giving, 'Jan 12, 2025'],
        cells: [
          <span key="t" className="font-medium">{t.tenant}</span>,
          <Badge key="s" value={t.status} />,
          t.plan, t.users, t.members, t.giving, 'Jan 12, 2025',
          <span key="a" className="text-brand-gray-500">•••</span>,
        ],
      })),
    };
  }
  if (tab === 'Users') {
    return {
      title: 'Recent Users',
      headers: ['Name', 'Email', 'Role', 'Status', 'Joined', 'Action'],
      rows: USERS.map((u) => ({
        group: u.status,
        text: [u.name, u.email, u.role, u.status, u.joined],
        cells: [
          <span key="n" className="font-medium">{u.name}</span>,
          u.email, u.role, <Badge key="s" value={u.status} />, u.joined,
          <span key="a" className="text-brand-gray-500">•••</span>,
        ],
      })),
    };
  }
  if (tab === 'Subscription') {
    return {
      title: 'Recent Subscriptions',
      headers: ['Tenant', 'Plan', 'Status', 'Amount', 'Renewal', 'Action'],
      rows: SUBSCRIPTIONS.map((sub) => ({
        group: sub.status,
        text: [sub.tenant, sub.plan, sub.status, sub.amount, sub.renewal],
        cells: [
          <span key="t" className="font-medium">{sub.tenant}</span>,
          sub.plan, <Badge key="s" value={sub.status} />, sub.amount, sub.renewal,
          <span key="a" className="text-brand-gray-500">•••</span>,
        ],
      })),
    };
  }
  // Finances
  return {
    title: 'Recent Transactions',
    headers: ['Name/Email', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action'],
    rows: TRANSACTIONS.map((t) => ({
      group: t.status,
      text: [t.name, t.status, 'Jun 12, 2025', t.amount, 'Bank transfer', t.type],
      cells: [
        <span key="n" className="font-medium">{t.name}</span>,
        <Badge key="s" value={t.status} />, 'Jun 12, 2025', t.amount, 'Bank transfer', t.type,
        <span key="a" className="text-brand-gray-500">•••</span>,
      ],
    })),
  };
}

type LiveTxn = { name: string; status: string; amount: string; type: string };
type LiveUser = { name: string; email: string; role: string; status: string; joined: string };
type LiveSub = { tenant: string; plan: string; status: string; amount: string; renewal: string };

export function SystemAnalyticsContent() {
  const [tab, setTab] = useState<Tab>('Finances');
  const [liveTenants, setLiveTenants] = useState<SystemTenant[] | null>(null);
  const [financeTrend, setFinanceTrend] = useState<{ month: string; value: number }[]>([]);
  const [liveTxns, setLiveTxns] = useState<LiveTxn[] | null>(null);
  const [liveUsers, setLiveUsers] = useState<LiveUser[] | null>(null);
  const [liveSubs, setLiveSubs] = useState<LiveSub[] | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSystemTenants().then(setLiveTenants).catch(() => {});
    getUnifiedDashboard()
      .then((s) => {
        if (s && s.trend.length > 0) {
          setFinanceTrend(s.trend.map((p) => ({ month: p.label, value: p.value })));
        }
      })
      .catch(() => {});

    const loadTxns = async () => {
      for (const p of ['/system/dashboard/admin/transactions?page=0&size=10', '/system/transactions?page=0&size=10']) {
        try { return await (api.get<unknown>(p) as Promise<unknown>); } catch { /* try next */ }
      }
      return null;
    };
    loadTxns()
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: LiveTxn[] = arr.map((t) => {
          const raw = String(t['status'] ?? '').toUpperCase();
          const status = raw.includes('SUCCESS') || raw.includes('COMPLET') ? 'Success'
            : raw.includes('FAIL') || raw.includes('CANCEL') ? 'Failed' : 'Pending';
          const rawAmt = Number(t['amount'] ?? t['totalAmount'] ?? 0);
          const amount = rawAmt ? `$${rawAmt.toLocaleString()}` : String(t['amountFormatted'] ?? '');
          return {
            name: String(t['memberName'] ?? t['name'] ?? t['email'] ?? ''),
            status, amount,
            type: String(t['type'] ?? t['purpose'] ?? t['category'] ?? 'General Offering'),
          };
        }).filter((t) => t.name);
        if (mapped.length > 0) setLiveTxns(mapped);
      })
      .catch(() => {});

    const loadUsers = async () => {
      for (const p of ['/system/dashboard/admin/users?page=0&size=10']) {
        try { return await (api.get<unknown>(p) as Promise<unknown>); } catch { /* try next */ }
      }
      return null;
    };
    loadUsers()
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : [];
        if (arr.length === 0) return;
        const mapped: LiveUser[] = arr.map((u) => {
          const rawDate = String(u['createdAt'] ?? u['joinedAt'] ?? u['registeredAt'] ?? '');
          const joined = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const raw = String(u['status'] ?? '').toUpperCase();
          const status = raw.includes('INACTIV') || raw.includes('BLOCK') ? 'Inactive' : 'Active';
          return {
            name: String(u['fullName'] ?? u['name'] ?? u['firstName'] ?? ''),
            email: String(u['email'] ?? ''),
            role: String(u['role'] ?? u['userType'] ?? 'Member'),
            status, joined,
          };
        }).filter((u) => u.name);
        if (mapped.length > 0) setLiveUsers(mapped);
      })
      .catch(() => {});

    (api.get<unknown>('/system/billing/subscriptions?page=0&size=10') as Promise<unknown>)      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : [];
        if (arr.length === 0) return;
        const mapped: LiveSub[] = arr.map((s) => {
          const rawRenewal = String(s['renewalDate'] ?? s['nextBillingDate'] ?? s['endDate'] ?? '');
          const renewal = rawRenewal ? new Date(rawRenewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
          const raw = String(s['status'] ?? '').toUpperCase();
          const status = raw.includes('INACTIV') || raw.includes('CANCEL') ? 'Inactive' : 'Active';
          const rawAmt = Number(s['amount'] ?? s['price'] ?? 0);
          const amount = rawAmt ? `$${rawAmt}` : String(s['amountFormatted'] ?? '');
          return {
            tenant: String(s['tenantName'] ?? s['orgName'] ?? s['name'] ?? ''),
            plan: String(s['planName'] ?? s['plan'] ?? ''),
            status, amount, renewal,
          };
        }).filter((s) => s.tenant);
        if (mapped.length > 0) setLiveSubs(mapped);
      })
      .catch(() => {});
  }, []);

  const chartData = tab === 'Finances' && financeTrend.length > 0 ? financeTrend : trend;

  const table = (() => {
    if (tab === 'Tenants' && liveTenants) {
      return {
        title: 'Recent Tenants',
        headers: ['Tenant', 'Status', 'Plan', 'Users', 'Members', 'Giving Volume', 'Created', 'Action'],
        rows: liveTenants.map((t) => ({
          group: t.status,
          text: [t.name, t.status, t.plan, '—', String(t.members), '—', t.createdAt],
          cells: [
            <span key="t" className="font-medium">{t.name}</span>,
            <Badge key="s" value={t.status} />,
            t.plan, '—', t.members, '—', t.createdAt,
            <span key="a" className="text-brand-gray-500">•••</span>,
          ],
        })),
      };
    }
    if (tab === 'Finances' && liveTxns) {
      return {
        title: 'Recent Transactions',
        headers: ['Name/Email', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action'],
        rows: liveTxns.map((t) => ({
          group: t.status,
          text: [t.name, t.status, '—', t.amount, '—', t.type],
          cells: [
            <span key="n" className="font-medium">{t.name}</span>,
            <Badge key="s" value={t.status} />, '—', t.amount, '—', t.type,
            <span key="a" className="text-brand-gray-500">•••</span>,
          ],
        })),
      };
    }
    if (tab === 'Users' && liveUsers) {
      return {
        title: 'Recent Users',
        headers: ['Name', 'Email', 'Role', 'Status', 'Joined', 'Action'],
        rows: liveUsers.map((u) => ({
          group: u.status,
          text: [u.name, u.email, u.role, u.status, u.joined],
          cells: [
            <span key="n" className="font-medium">{u.name}</span>,
            u.email, u.role, <Badge key="s" value={u.status} />, u.joined,
            <span key="a" className="text-brand-gray-500">•••</span>,
          ],
        })),
      };
    }
    if (tab === 'Subscription' && liveSubs) {
      return {
        title: 'Recent Subscriptions',
        headers: ['Tenant', 'Plan', 'Status', 'Amount', 'Renewal', 'Action'],
        rows: liveSubs.map((s) => ({
          group: s.status,
          text: [s.tenant, s.plan, s.status, s.amount, s.renewal],
          cells: [
            <span key="t" className="font-medium">{s.tenant}</span>,
            s.plan, <Badge key="s" value={s.status} />, s.amount, s.renewal,
            <span key="a" className="text-brand-gray-500">•••</span>,
          ],
        })),
      };
    }
    if (!USE_LIVE_API) return tableFor(tab);
    const emptyHeaders = tab === 'Tenants' ? ['Tenant', 'Status', 'Plan', 'Users', 'Members', 'Giving Volume', 'Created', 'Action']
      : tab === 'Users' ? ['Name', 'Email', 'Role', 'Status', 'Joined', 'Action']
      : tab === 'Subscription' ? ['Tenant', 'Plan', 'Status', 'Amount', 'Renewal', 'Action']
      : ['Name/Email', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action'];
    const emptyTitle = tab === 'Tenants' ? 'Recent Tenants' : tab === 'Users' ? 'Recent Users' : tab === 'Subscription' ? 'Recent Subscriptions' : 'Recent Transactions';
    return { title: emptyTitle, headers: emptyHeaders, rows: [] };
  })();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Analytics</h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          Monitor your multi-tenant church platform
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-full bg-[#f6f8fb] p-1 text-[13px] w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-5 py-2 transition-colors',
              tab === t
                ? 'bg-white font-medium text-brand-blue shadow-sm'
                : 'text-brand-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-[14px] bg-white p-6">
        <h2 className="text-[18px] font-bold">{OVERVIEW[tab]}</h2>
        <ChartContainer config={chartConfig} className="mt-4 h-[260px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="sysAnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5a4fe0" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#5a4fe0" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
            <Area type="monotone" dataKey="value" stroke="#5a4fe0" strokeWidth={2} fill="url(#sysAnFill)" />
          </AreaChart>
        </ChartContainer>
      </div>

      <SmartTable
        title={table.title}
        headers={table.headers}
        rows={table.rows}
        filterOptions={[...new Set(table.rows.map((r) => r.group).filter(Boolean) as string[])]}
        filterAll="All"
      />
    </div>
  );
}
