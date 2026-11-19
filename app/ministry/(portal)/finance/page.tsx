'use client';

import {
  ActionCard,
  StatCard,
  TransactionsTable,
  type Transaction,
} from '@/components/ministry/shared';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function MinistryFinancePage() {
  const [totalGiving, setTotalGiving] = useState('$0');
  const [offlineGiving, setOfflineGiving] = useState('$0');
  const [recurringGivers, setRecurringGivers] = useState('0');
  const [failedTransactions, setFailedTransactions] = useState('0');
  const [txns, setTxns] = useState<Transaction[] | undefined>(undefined);

  useEffect(() => {
    getUnifiedDashboard()
      .then((s) => { if (s) setTotalGiving(s.totalGiving); })
      .catch(() => { toast.error('Could not load dashboard stats.'); });
    // /tenant/admin/finance/summary and giving transaction list not in backend API — disabled.
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
