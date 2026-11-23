'use client';

import {
  ActionCard,
  StatCard,
  TransactionsTable,
  type Transaction,
} from '@/components/ministry/shared';
import { getUnifiedDashboard, type DashboardSection } from '@/lib/api/dashboard';
import { SectionBlock } from '@/components/shared/section-block';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const GIVING_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MinistryFinancePage() {
  const [totalGiving, setTotalGiving] = useState('$0');
  const [offlineGiving, setOfflineGiving] = useState('$0');
  const [recurringGivers, setRecurringGivers] = useState('0');
  const [failedTransactions, setFailedTransactions] = useState('0');
  const [txns, setTxns] = useState<Transaction[] | undefined>(undefined);
  const [rawSections, setRawSections] = useState<DashboardSection[]>([]);
  const [givingTrend, setGivingTrend] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    getUnifiedDashboard('LAST_30_DAYS', 'USD', 'FINANCE')
      .then((s) => {
        if (!s) return;
        setTotalGiving(s.totalGiving);
        if (s.rawSections.length > 0) setRawSections(s.rawSections);
        const financeSection = s.rawSections.find((sec) =>
          sec.type?.toLowerCase().includes('financ') || sec.type?.toLowerCase().includes('giving')
        );
        if (financeSection?.series?.[0]?.points?.length) {
          const pts = financeSection.series[0].points;
          setGivingTrend(pts.map((p, i) => ({
            name: p.label ?? GIVING_MONTHS[i % 12],
            value: typeof p.value === 'number' ? p.value : 0,
          })));
        }
      })
      .catch(() => { toast.error('Could not load dashboard stats.'); });
  }, []);

  const totalRaw = parseFloat(totalGiving.replace(/[^0-9.]/g, '')) || 0;
  const sparkTrend = givingTrend.length > 1
    ? givingTrend
    : [0.4, 0.5, 0.6, 0.55, 0.7, 0.8, 0.75, 0.9, 1].map((f, i) => ({
        name: GIVING_MONTHS[i],
        value: Math.round(totalRaw * f) || (i + 1) * 10,
      }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Finance</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Giving" value={totalGiving} variant="blue" trend={sparkTrend.map((d) => d.value)} />
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

      <div className="rounded-[14px] bg-white p-6">
        <p className="text-[16px] font-bold">Giving Trend</p>
        <p className="mt-0.5 text-[13px] text-brand-gray-500">Monthly giving overview</p>
        <div className="mt-4 h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparkTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'Giving']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false}>
                {sparkTrend.map((_, i) => (
                  <Cell key={i} fill={i === sparkTrend.length - 1 ? '#243f84' : '#c8d4f5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {rawSections.length > 0 && (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} accentColor="#243f84" />
          ))}
        </div>
      )}

      <TransactionsTable rows={txns} />
    </div>
  );
}
