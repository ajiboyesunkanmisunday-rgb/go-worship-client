'use client';

import { ActionCard, StatCard } from '@/components/ministry/shared';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckSquare, Plus } from 'lucide-react';
import { getTenantGroups, type TenantGroup } from '@/lib/api/tenant';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type GroupRow = { id: string; name: string; category: string; leader: string; members: number; status: string; schedule: string };


function toGroupRow(g: TenantGroup): GroupRow {
  const days = g.meetingDays?.length ? g.meetingDays.join('/') : '';
  const time = g.meetingTime ?? '';
  const schedule = [days, time].filter(Boolean).join(' at ') || g.meetingFrequency || '—';
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
  const [groups, setGroups] = useState<GroupRow[]>([]);

  useEffect(() => {
    getTenantGroups().then((data) => setGroups(data.map(toGroupRow))).catch(() => { toast.error('Could not load groups.'); });
  }, []);

  const active = groups.filter((g) => g.status.toLowerCase() === 'active').length;
  const inactive = groups.filter((g) => g.status.toLowerCase() !== 'active').length;
  const totalMembers = groups.reduce((s, g) => s + g.members, 0);
  const leaders = new Set(groups.map((g) => g.leader).filter(Boolean)).size;

  const categoryData = (() => {
    const counts: Record<string, number> = {};
    for (const g of groups) counts[g.category] = (counts[g.category] ?? 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 6);
  })();
  const CAT_COLORS = ['#243f84', '#22a45d', '#ff8d28', '#454ae3', '#eb0000', '#8e97ad'];

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
        <StatCard title="Total Group" value={String(groups.length)} variant="blue" trend={[1,2,2,3,2,4,groups.length]} />
        <StatCard title="Total Members" value={String(totalMembers)} variant="white" trend={[5,6,7,6,8,9,totalMembers]} />
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

      {groups.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[14px] bg-white p-6">
            <p className="text-[16px] font-bold">Group Status</p>
            <p className="mt-0.5 text-[13px] text-brand-gray-500">Active vs inactive groups</p>
            <div className="mt-4 h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[{ name: 'Active', value: active }, { name: 'Inactive', value: inactive }]}
                  margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                >
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [String(v), 'Groups']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48} isAnimationActive={false}>
                    <Cell fill="#22a45d" />
                    <Cell fill="#f5c6c6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {categoryData.length > 1 && (
            <div className="rounded-[14px] bg-white p-6">
              <p className="text-[16px] font-bold">Groups by Category</p>
              <p className="mt-0.5 text-[13px] text-brand-gray-500">Distribution across categories</p>
              <div className="mt-4 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [String(v), 'Groups']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <SmartTable
        title="All Groups"
        headers={['Group Name', 'Category', 'Leader', 'Meeting Day & Time', 'Members', 'Status', 'Action']}
        rows={rows}
        filterAll="All groups"
      />
    </div>
  );
}
