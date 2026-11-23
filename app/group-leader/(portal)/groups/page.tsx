'use client';

import { StatCard } from '@/components/ministry/shared';
import { QuickAccess } from '@/components/group-leader/dashboard';
import { DataPanel, type TableRow } from '@/components/group-leader/shared';
import { getTenantGroups, getTenantStats, type TenantGroup, type TenantStats } from '@/lib/api/tenant';
import { useEffect, useState } from 'react';

function toRow(g: TenantGroup): TableRow {
  return {
    cells: [g.name, g.description || 'Group', g.leaderName || '—', '—', String(g.memberCount)],
    status: g.status.toLowerCase() === 'active' ? 'Active' : ('Inactive' as const),
    href: `/group-leader/groups/${g.id}`,
  };
}

export default function GroupLeaderGroupsPage() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenantGroups()
      .then((groups) => { setRows(groups.map(toRow)); })
      .catch(() => {})
      .finally(() => setLoading(false));
    getTenantStats().then((s) => { if (s) setStats(s); }).catch(() => {});
  }, []);

  const totalGroups = stats?.totalGroups ?? 0;
  const totalMembers = stats?.totalMembers ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.55fr_1.45fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Groups" value={String(totalGroups)} variant="blue" />
          <StatCard title="Total Member" value={String(totalMembers)} variant="white" />
        </div>
        <QuickAccess />
      </div>

      {loading ? (
        <div className="rounded-[14px] bg-white p-8 text-center text-[14px] text-brand-gray-400">
          Loading groups…
        </div>
      ) : (
        <DataPanel
          title="All Groups"
          columns={['Group Name', 'Category', 'Leader', 'Meeting Day & Time', 'Members']}
          rows={rows}
        />
      )}
    </div>
  );
}
