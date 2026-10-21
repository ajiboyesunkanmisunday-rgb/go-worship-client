'use client';

import {
  ActionCard,
  StatCard,
  TransactionsTable,
  type Transaction,
} from '@/components/ministry/shared';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { getCustomerPayments, paymentToGiving } from '@/lib/api/customer';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

const MOCK = {
  totalGiving: '$6500',
  offlineGiving: '$830',
  recurringGivers: '130',
  failedTransactions: '20',
};

function mapStatus(s?: string): Transaction['status'] {
  if (s === 'SUCCEEDED') return 'Success';
  if (s === 'FAILED' || s === 'CANCELED' || s === 'EXPIRED') return 'Failed';
  return 'Pending';
}

export default function MinistryFinancePage() {
  const [totalGiving, setTotalGiving] = useState(USE_LIVE_API ? '$0' : MOCK.totalGiving);
  const [offlineGiving, setOfflineGiving] = useState(USE_LIVE_API ? '$0' : MOCK.offlineGiving);
  const [recurringGivers, setRecurringGivers] = useState(USE_LIVE_API ? '0' : MOCK.recurringGivers);
  const [failedTransactions, setFailedTransactions] = useState(USE_LIVE_API ? '0' : MOCK.failedTransactions);
  const [txns, setTxns] = useState<Transaction[] | undefined>(undefined);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getUnifiedDashboard()
      .then((s) => { if (s) setTotalGiving(s.totalGiving); })
      .catch(() => {});
    getCustomerPayments(0, 20)
      .then((page) => {
        const rows = (page?.content ?? []).map((p) => {
          const g = paymentToGiving(p);
          const fmt = (n: number, cur: string) =>
            new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
          const date = g.date
            ? new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          return {
            status: mapStatus(g.status),
            type: g.purpose,
            amount: fmt(g.amount, g.currency),
            date,
          } satisfies Transaction;
        });
        if (rows.length > 0) {
          setTxns(rows);
          const failed = rows.filter((r) => r.status === 'Failed').length;
          if (failed > 0) setFailedTransactions(String(failed));
        }
      })
      .catch(() => {});

    (api.get<unknown>('/tenant/admin/finance/summary') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const d = data as R;
        const rawOffline = d['offlineGiving'] ?? d['offlineDonations'] ?? d['cashGiving'];
        const rawRecurring = d['recurringGivers'] ?? d['recurringDonors'] ?? d['recurringCount'];
        const rawFailed = d['failedTransactions'] ?? d['failedCount'] ?? d['failedPayments'];
        const fmtAmt = (v: unknown) => {
          const n = Number(v);
          return n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : String(v ?? '');
        };
        if (rawOffline != null) setOfflineGiving(fmtAmt(rawOffline));
        if (rawRecurring != null) setRecurringGivers(String(rawRecurring));
        if (rawFailed != null) setFailedTransactions(String(rawFailed));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Finance</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Giving" value={totalGiving} variant="blue" />
        <StatCard title="Offline Giving" value={offlineGiving} variant="white" />
        <StatCard title="Recurring Givers" value={recurringGivers} variant="green" />
        <StatCard title="Failed Transactions" value={failedTransactions} variant="white" />
        <ActionCard
          title="Giving List"
          subtitle="Click here to view"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eb0000]">
              <DollarSign className="size-5 text-white" />
            </span>
          }
        />
      </div>

      <TransactionsTable rows={txns} />
    </div>
  );
}
