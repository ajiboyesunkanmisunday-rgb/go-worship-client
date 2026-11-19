'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { USE_LIVE_API } from '@/lib/api/config';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { getSystemSubscriptions, type SystemSubscription } from '@/lib/api/system';

const STATUS: Record<string, string> = {
  Success: 'bg-[#e7f7ee] text-[#34a853]',
  Pending: 'bg-[#fff4e5] text-[#ff8d28]',
  Failed: 'bg-[#fde8e8] text-[#eb0000]',
};

type SysTxn = {
  name: string;
  email: string;
  status: string;
  date: string;
  amount: string;
  method: string;
  type: string;
  channel: string;
  id: string;
};

function normalizeStatus(s?: string): string {
  if (!s) return 'Pending';
  const u = s.toUpperCase();
  if (u === 'SUCCEEDED' || u === 'SUCCESS' || u === 'COMPLETED' || u === 'ACTIVE') return 'Success';
  if (u === 'FAILED' || u === 'CANCELED' || u === 'EXPIRED' || u === 'SUSPENDED') return 'Failed';
  return 'Pending';
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch { return iso; }
}

function subToTxn(sub: SystemSubscription): SysTxn {
  return {
    id: sub.id ?? '',
    name: sub.tenantId ?? '',
    email: '',
    status: normalizeStatus(sub.status),
    date: fmtDate(sub.currentPeriodStart),
    amount: '',
    method: '',
    type: sub.inTrial ? 'Trial' : 'Subscription',
    channel: 'Online',
  };
}

const TABS = ['All Transactions', 'Online', 'Offline'];

/** System → Transactions (board 778:38441). */
export default function SystemTransactionsPage() {
  const [tab, setTab] = useState(0);
  const [txns, setTxns] = useState<SysTxn[]>([]);
  const [totalGiving, setTotalGiving] = useState('$0');
  const [paidInvoices, setPaidInvoices] = useState(0);
  const [pendingAmount, setPendingAmount] = useState('$0');
  const [totalTxnCount, setTotalTxnCount] = useState(0);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    getUnifiedDashboard('LAST_30_DAYS', 'USD', undefined, 'system')
      .then((s) => { if (s) setTotalGiving(s.totalGiving); })
      .catch(() => {});

    getSystemSubscriptions(0, 100)
      .then((data) => {
        const subs = data?.content ?? [];
        setTotalTxnCount(data?.totalElements ?? subs.length);
        const active = subs.filter((s) => normalizeStatus(s.status) === 'Success').length;
        const pending = subs.filter((s) => normalizeStatus(s.status) === 'Pending').length;
        setPaidInvoices(active);
        setPendingAmount(String(pending));
        setTxns(subs.map(subToTxn));
      })
      .catch(() => {});
  }, []);

  const filtered = tab === 0 ? txns : txns.filter((t) => t.channel === TABS[tab]);

  const rows: SmartRow[] = filtered.map((t) => ({
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
        href={`/system/transactions/${t.status === 'Failed' ? 'failed' : encodeURIComponent(t.id)}`}
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
