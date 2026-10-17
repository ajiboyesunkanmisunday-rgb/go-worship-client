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
  const [totalGiving, setTotalGiving] = useState(MOCK.totalGiving);
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
        if (rows.length > 0) setTxns(rows);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Finance</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Giving" value={totalGiving} variant="blue" />
        <StatCard title="Offline Giving" value={MOCK.offlineGiving} variant="white" />
        <StatCard title="Recurring Givers" value={MOCK.recurringGivers} variant="green" />
        <StatCard title="Failed Transactions" value={MOCK.failedTransactions} variant="white" />
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
