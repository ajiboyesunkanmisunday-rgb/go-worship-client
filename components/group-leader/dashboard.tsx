'use client';

import { StatCard } from '@/components/ministry/shared';
import { ClipboardList, Plus, SquareCheckBig } from 'lucide-react';
import { DataPanel, QuickAccessCard, type TableRow } from './shared';
import { useState, useEffect } from 'react';
import { getTenantMembers, getTenantBranding, type TenantMember } from '@/lib/api/tenant';
import { getUnifiedDashboard, type UnifiedDashboardStats, type DashboardSection } from '@/lib/api/dashboard';
import { getProfile } from '@/lib/api/auth';
import { SectionBlock } from '@/components/shared/section-block';

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

export function GroupLeaderDashboard() {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [stats, setStats] = useState<UnifiedDashboardStats | null>(null);
  const [rawSections, setRawSections] = useState<DashboardSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    getTenantMembers()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
    getUnifiedDashboard('LAST_30_DAYS', 'USD', 'TENANT_OPERATIONS').then((s) => {
      if (s) { setStats(s); setRawSections(s.rawSections); }
    }).catch(() => {});
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
            Welcome to the {orgName || 'Go Worship'} platform
          </p>
          <span className="pointer-events-none absolute -right-10 top-8 size-[220px] rounded-full border-[6px] border-[#e7f7ee]" />
          <span className="pointer-events-none absolute right-16 top-24 size-[140px] rounded-full border-[6px] border-[#d4f0df]" />
        </div>

        <QuickAccess />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Groups" value={stats ? String(stats.totalGroups) : '0'} variant="blue" trend={[1,2,2,3,2,4,stats?.totalGroups ?? 0]} />
        <StatCard title="Total Member" value={stats ? String(stats.totalMembers || stats.totalUsers) : String(members.length)} variant="white" trend={[5,6,7,6,8,9,members.length]} />
        <StatCard title="New Members" value={stats ? String(stats.newMembers ?? stats.newUsers ?? 0) : '0'} variant="white" />
        <StatCard title="Recent Attendance" value={stats ? String(stats.attendanceRecords ?? 0) : '0'} variant="white" />
      </div>

      {rawSections.length > 0 && (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} accentColor="#22a45d" />
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-[14px] bg-white p-8 text-center text-[14px] text-brand-gray-400">
          Loading members…
        </div>
      ) : (
        <DataPanel
          title="Member List"
          columns={['Name', 'Phone', 'Email', 'Join Date']}
          rows={rows}
        />
      )}
    </div>
  );
}
