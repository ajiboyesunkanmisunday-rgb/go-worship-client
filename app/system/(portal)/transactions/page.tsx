'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { getUnifiedDashboard } from '@/lib/api/dashboard';

const STATUS: Record<string, string> = {
  Success: 'bg-[#e7f7ee] text-[#34a853]',
  Pending: 'bg-[#fff4e5] text-[#ff8d28]',
  Failed: 'bg-[#fde8e8] text-[#eb0000]',
};

const TXNS = [
  { name: 'Adewale Bola', email: 'adminadje@gmail.com', status: 'Success', date: 'Jan 12, 2025', amount: '$55.00', method: 'Bank transfer', type: 'General Offering', channel: 'Online' },
  { name: 'Grace Community', email: 'admin@gracecommunity.org', status: 'Pending', date: 'Jan 12, 2025', amount: '$120.00', method: 'Bank transfer', type: 'General Offering', channel: 'Offline' },
  { name: 'Michael Ade', email: 'michael@mail.com', status: 'Success', date: 'Jan 11, 2025', amount: '$80.00', method: 'Card payment', type: 'Tithe Offering', channel: 'Online' },
  { name: 'Cornerstone Church', email: 'admin@cornerstone.org', status: 'Failed', date: 'Jan 10, 2025', amount: '$45.00', method: 'Bank transfer', type: 'General Offering', channel: 'Online' },
];

type SysTxn = typeof TXNS[number];

function normalizeStatus(s?: string): string {
  if (!s) return 'Pending';
  const u = s.toUpperCase();
  if (u === 'SUCCEEDED' || u === 'SUCCESS' || u === 'COMPLETED') return 'Success';
  if (u === 'FAILED' || u === 'CANCELED' || u === 'EXPIRED') return 'Failed';
  return 'Pending';
}

function fmtAmt(amount: unknown, currency?: string): string {
  const n = Number(amount);
  if (!n && n !== 0) return String(amount ?? '');
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD' }).format(n);
  } catch {
    return String(n);
  }
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch { return iso; }
}

const TABS = ['All Transactions', 'Online', 'Offline'];

/** System → Transactions (board 778:38441). */
export default function SystemTransactionsPage() {
  const [tab, setTab] = useState(0);
  const [txns, setTxns] = useState<SysTxn[]>(USE_LIVE_API ? [] : TXNS);
  const [totalGiving, setTotalGiving] = useState(USE_LIVE_API ? '$0' : '$60,500');
  const [paidInvoices, setPaidInvoices] = useState(USE_LIVE_API ? 0 : 20);
  const [pendingAmount, setPendingAmount] = useState(USE_LIVE_API ? '$0' : '$1,200');
  const [totalTxnCount, setTotalTxnCount] = useState(USE_LIVE_API ? 0 : 4);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // Transaction list: /system/dashboard/admin/transactions and /system/transactions
    // both returned 404 in localhost HAR — disabled until correct endpoint confirmed from DO.

    // Stats: /system/finance/stats and /system/transactions/summary not in backend API — disabled.

    getUnifiedDashboard()
      .then((s) => { if (s) setTotalGiving(s.totalGiving); })
      .catch(() => {});
  }, []);

  const filtered = tab === 0 ? txns : txns.filter((t) => t.channel === TABS[tab]);

  const rows: SmartRow[] = filtered.map((t, i) => ({
    group: t.status,
    text: [t.name, t.email, t.status, t.date, t.amount, t.method, t.type],
    cells: [
      <span key="n">
        <span className="block font-medium">{t.name}</span>
        <span className="block text-brand-gray-500">{t.email}</span>
      </span>,
      <span
        key="s"
        className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', STATUS[t.status] ?? STATUS.Pending)}
      >
        {t.status}
      </span>,
      t.date,
      t.amount,
      t.method,
      t.type,
      <Link
        key="a"
        href={`/system/transactions/${t.status === 'Failed' ? 'failed' : i + 1}`}
        className="font-medium text-brand-blue no-underline"
      >
        View
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Transactions</h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          Manage all church transactions on the platform
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Giving" value={totalGiving} variant="blue" />
        <StatCard title="Paid Invoices" value={String(paidInvoices)} variant="white" />
        <StatCard title="Pending" value={pendingAmount} variant="green" />
        <StatCard title="Total Transactions" value={String(totalTxnCount)} variant="white" />
        <ActionCard
          href="/system/transactions"
          title="Giving List"
          subtitle="Click here to view"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eb0000]">
              <DollarSign className="size-5 text-white" />
            </span>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              i === tab
                ? 'bg-brand-blue text-white'
                : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <SmartTable
        title="Recent Transactions"
        headers={['Name/Email', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action']}
        rows={rows}
        filterOptions={['Success', 'Pending', 'Failed']}
        filterAll="All status"
      />
    </div>
  );
}
