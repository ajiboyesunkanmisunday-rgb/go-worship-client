'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantMembers, type TenantMember } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';

const MOCK_MEMBERS: TenantMember[] = [
  { id: 'M-001', name: 'John Adeyemi', email: 'john@example.com', phone: '+1 555-0101', status: 'Active', joinedAt: 'Jan 12, 2025', groups: ['Faith Builders'] },
  { id: 'M-002', name: 'Grace Okonkwo', email: 'grace@example.com', phone: '+1 555-0102', status: 'Active', joinedAt: 'Feb 03, 2025', groups: [] },
  { id: 'M-003', name: 'Mercy Paul', email: 'mercy@example.com', phone: '+1 555-0103', status: 'Inactive', joinedAt: 'Nov 20, 2024', groups: ['Youth Fellowship'] },
];

export default function MinistryMembersPage() {
  const [members, setMembers] = useState<TenantMember[]>(MOCK_MEMBERS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then(setMembers).catch(() => {});
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
        <StatCard title="Total Members" value={String(members.length)} variant="blue" />
        <StatCard title="Active Members" value={String(active)} variant="green" />
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
