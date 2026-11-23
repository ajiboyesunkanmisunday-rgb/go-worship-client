'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantMembers, type TenantMember } from '@/lib/api/tenant';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function MinistryMembersPage() {
  const [members, setMembers] = useState<TenantMember[]>([]);

  useEffect(() => {
    getTenantMembers().then(setMembers).catch(() => { toast.error('Could not load members.'); });
  }, []);

  const active = members.filter((m) => m.status === 'Active').length;
  const inactive = members.filter((m) => m.status === 'Inactive').length;

  const rows: SmartRow[] = members.map((m) => ({
    group: m.status,
    text: [m.name, m.email, m.phone, m.status, m.joinedAt],
    cells: [
      <span key="n" className="font-medium">{m.name}</span>,
      m.email,
      m.phone || '—',
      <span
        key="s"
        className={cn(
          'font-medium',
          m.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]'
        )}
      >
        {m.status}
      </span>,
      m.joinedAt || '—',
      m.groups.length > 0 ? m.groups.join(', ') : '—',
      <Link
        key="a"
        href={`/ministry/members/${m.id}`}
        className="flex h-8 w-[52px] items-center justify-center rounded-full bg-brand-gray-300 text-[11px] text-white no-underline"
      >
        View
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Members</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Members" value={String(members.length)} variant="blue" trend={[members.length > 0 ? Math.round(members.length * 0.6) : 0, Math.round(members.length * 0.7), Math.round(members.length * 0.75), Math.round(members.length * 0.85), members.length]} />
        <StatCard title="Active Members" value={String(active)} variant="green" trend={[Math.round(active * 0.7), Math.round(active * 0.8), Math.round(active * 0.9), active]} />
        <StatCard title="Inactive Members" value={String(inactive)} variant="white" />
        <ActionCard
          href="/ministry/members/add"
          title="Add Member"
          subtitle="Click here to add member"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-blue">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>

      {members.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Member Distribution</p>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Active vs inactive breakdown</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Active', value: active || 1 }, { name: 'Inactive', value: inactive || 0 }]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                    <Cell fill="#243f84" />
                    <Cell fill="#e5e9f5" />
                  </Pie>
                  <Tooltip formatter={(v) => [String(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-brand-blue" />
                <span>Active — <strong>{active}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#e5e9f5]" />
                <span>Inactive — <strong>{inactive}</strong></span>
              </div>
              <div className="mt-1 text-brand-gray-500">
                {members.length > 0 ? `${Math.round((active / members.length) * 100)}% active rate` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <SmartTable
        title="All Members"
        headers={['Full Name', 'Email', 'Phone', 'Status', 'Joined', 'Groups', 'Action']}
        rows={rows}
        filterOptions={['Active', 'Inactive']}
        filterAll="All members"
      />
    </div>
  );
}
