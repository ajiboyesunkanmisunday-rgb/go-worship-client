'use client';

import {
  ActionCard,
  StatCard,
  TransactionsTable,
  type Transaction,
} from '@/components/ministry/shared';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { USE_LIVE_API } from '@/lib/api/config';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const MOCK = {
  totalGiving: '$6500',
  offlineGiving: '$830',
  recurringGivers: '130',
  failedTransactions: '20',
};

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
