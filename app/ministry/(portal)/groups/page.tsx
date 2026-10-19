'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckSquare, Plus } from 'lucide-react';
import { getTenantGroups, type TenantGroup } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';

type GroupRow = { id: string; name: string; category: string; leader: string; members: number; status: string; schedule: string };

const MOCK_GROUPS: GroupRow[] = [
  { id: '', name: 'Faith Builders Fellowship', category: 'Small Group', leader: 'John Samuel', members: 22, status: 'Active', schedule: 'Tuesdays at 6:00 PM' },
  { id: '', name: 'Faith Builders Community', category: 'Discussion Group', leader: 'Michael Thompson', members: 23, status: 'Inactive', schedule: 'Tuesdays at 6:00 PM' },
  { id: '', name: 'Faith Builders Community', category: 'Discussion Group', leader: 'Michael Thompson', members: 23, status: 'Active', schedule: 'Tuesdays at 6:00 PM' },
];

function toGroupRow(g: TenantGroup): GroupRow {
  const days = g.meetingDays?.length ? g.meetingDays.join('/') : '';
  const time = g.meetingTime ?? '';
  const schedule = [days, time].filter(Boolean).join(' at ') || g.meetingFrequency || 'Tuesdays at 6:00 PM';
  return {
    id: g.id,
    name: g.name,
    category: g.description || 'Group',
    leader: g.leaderName || '—',
    members: g.memberCount,
    status: g.status.charAt(0).toUpperCase() + g.status.slice(1).toLowerCase(),
    schedule,
  };
}

export default function MinistryGroupsPage() {
  const [groups, setGroups] = useState<GroupRow[]>(MOCK_GROUPS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantGroups().then((data) => setGroups(data.map(toGroupRow))).catch(() => {});
  }, []);

  const active = groups.filter((g) => g.status.toLowerCase() === 'active').length;
  const totalMembers = groups.reduce((s, g) => s + g.members, 0);
  const leaders = new Set(groups.map((g) => g.leader).filter(Boolean)).size;

  const rows: SmartRow[] = groups.map((g, i) => ({
    text: [g.name, g.category, g.leader, g.schedule, String(g.members), g.status],
    cells: [
      g.name,
      g.category,
      g.leader,
      g.schedule,
      g.members,
      <span
        key="s"
        className={cn(
          'font-medium',
          g.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]'
        )}
      >
        {g.status}
      </span>,
      <Link
        key="a"
        href={`/ministry/groups/${g.id || i + 1}`}
        className={cn(
          'flex h-8 w-[52px] items-center justify-center rounded-full text-[11px] text-white no-underline',
          i === 0 ? 'bg-brand-blue' : 'bg-brand-gray-300'
        )}
      >
        View
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Group</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Group" value={String(groups.length)} variant="blue" />
        <StatCard title="Total Members" value={String(totalMembers)} variant="white" />
        <StatCard title="Total Leader" value={String(leaders)} variant="green" />
        <ActionCard
          href="/ministry/groups/create"
          title="Create Group"
          subtitle="Click here to create group"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
        <ActionCard
          href="/ministry/groups/1"
          title="View Member List"
          subtitle="Click here to view member"
          icon={
            <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#22a45d]/15">
              <CheckSquare className="size-5 text-[#22a45d]" />
            </span>
          }
        />
      </div>

      <SmartTable
        title="All Groups"
        headers={['Group Name', 'Category', 'Leader', 'Meeting Day & Time', 'Members', 'Status', 'Action']}
        rows={rows}
        filterOptions={['Choir', 'Youth Fellowship', "Men's Group", 'Women Group']}
        filterAll="All groups"
      />
    </div>
  );
}
