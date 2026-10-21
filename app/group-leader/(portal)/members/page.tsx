'use client';

import { StatCard } from '@/components/ministry/shared';
import { QuickAccess } from '@/components/group-leader/dashboard';
import { DataPanel, type TableRow } from '@/components/group-leader/shared';
import { getTenantMembers, type TenantMember } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const MOCK_MEMBERS: TenantMember[] = Array.from({ length: 5 }, (_, i) => ({
  id: `M-00${i + 1}`,
  name: 'John Doe',
  phone: '08035678923',
  email: 'john@mail.com',
  status: 'Active' as const,
  joinedAt: 'Jan 2025',
  groups: [],
}));

export default function GroupLeaderMembersPage() {
  const [members, setMembers] = useState<TenantMember[]>(USE_LIVE_API ? [] : MOCK_MEMBERS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then(setMembers).catch(() => {});
  }, []);

  const active = members.filter((m) => m.status === 'Active').length;

  const rows: TableRow[] = members.map((m) => ({
    cells: [
      m.name,
      m.phone || '—',
      m.email,
      m.joinedAt || '—',
    ],
    status: m.status === 'Active' ? 'Active' : ('Inactive' as const),
    extra: (
      <span
        className={cn(
          'text-[12px] font-medium',
          m.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]'
        )}
      >
        {m.status}
      </span>
    ),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.55fr_1.45fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Members" value={String(members.length)} variant="blue" />
          <StatCard title="Active members" value={String(active)} variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataPanel
        title="Member List"
        columns={['Name', 'Phone', 'Email', 'Join Date']}
        rows={rows}
      />
    </div>
  );
}
