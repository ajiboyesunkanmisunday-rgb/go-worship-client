'use client';

import { StatCard } from '@/components/ministry/shared';
import { ClipboardList, Plus, SquareCheckBig } from 'lucide-react';
import { DataPanel, QuickAccessCard, type TableRow } from './shared';
import { useState, useEffect } from 'react';
import { getTenantMembers, getTenantStats, getTenantBranding, type TenantMember, type TenantStats } from '@/lib/api/tenant';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';

const GREEN_ICON =
  'flex size-10 items-center justify-center rounded-full bg-[#22a45d] text-white';

export function QuickAccess() {
  return (
    <div className="rounded-[14px] bg-white p-5">
      <h2 className="text-[16px] font-bold">Quick Access</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAccessCard
          href="/group-leader/groups/create"
          title="Create Group"
          subtitle="Click here to create group"
          icon={
            <span className={GREEN_ICON}>
              <Plus className="size-5" />
            </span>
          }
        />
        <QuickAccessCard
          href="/group-leader/members"
          title="View Member List"
          subtitle="Click here to view member"
          icon={
            <span className={GREEN_ICON}>
              <SquareCheckBig className="size-5" />
            </span>
          }
        />
        <QuickAccessCard
          href="/group-leader/engagement"
          title="Attendance"
          subtitle="Click here to view attendance"
          icon={
            <span className={GREEN_ICON}>
              <ClipboardList className="size-5" />
            </span>
          }
        />
      </div>
    </div>
  );
}

const MOCK_MEMBERS: TenantMember[] = Array.from({ length: 5 }, () => ({
  id: '',
  name: 'John Doe',
  phone: '08035678923',
  email: 'john@mail.com',
  status: 'Active' as const,
  joinedAt: 'Jan 2025',
  groups: [],
}));

export function GroupLeaderDashboard() {
  const [members, setMembers] = useState<TenantMember[]>(USE_LIVE_API ? [] : MOCK_MEMBERS);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState(USE_LIVE_API ? '' : 'Go Worship');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then(setMembers).catch(() => {});
    getTenantStats().then((s) => { if (s) setStats(s); }).catch(() => {});
    getProfile().then((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});
  }, []);

  const rows: TableRow[] = members.slice(0, 5).map((m) => ({
    cells: [m.name, m.phone || '—', m.email, m.joinedAt || '—'],
    status: m.status === 'Active' ? 'Active' : ('Inactive' as const),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.3fr]">
        {/* Hello card */}
        <div className="relative overflow-hidden rounded-[14px] bg-white p-6">
          <h1 className="text-[28px] font-bold lg:text-[32px]">Hello{userName ? `, ${userName}` : ''} 👋</h1>
          <p className="mt-2 max-w-[300px] text-[14px] text-brand-gray-500">
            Welcome to {orgName} Go worship Platform
          </p>
          <span className="pointer-events-none absolute -right-10 top-8 size-[220px] rounded-full border-[6px] border-[#e7f7ee]" />
          <span className="pointer-events-none absolute right-16 top-24 size-[140px] rounded-full border-[6px] border-[#d4f0df]" />
        </div>

        <QuickAccess />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Groups" value={stats ? String(stats.totalGroups) : '24'} variant="blue" />
        <StatCard title="Total Member" value={stats ? String(stats.totalMembers) : String(members.length)} variant="white" />
        <StatCard title="New Members" value="15" variant="white" />
        <StatCard title="Recent Attendance" value="10" variant="white" />
      </div>

      <DataPanel
        title="Member List"
        columns={['Name', 'Phone', 'Email', 'Join Date']}
        rows={rows}
      />
    </div>
  );
}
