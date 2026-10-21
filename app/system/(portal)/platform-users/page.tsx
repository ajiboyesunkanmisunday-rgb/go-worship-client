'use client';

import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { UserRowMenu } from '@/components/system/user-row-menu';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSystemUsers, type SystemUser } from '@/lib/api/system';
import { USE_LIVE_API } from '@/lib/api/config';

const ROLE_STYLE: Record<string, string> = {
  'Super Admin': 'bg-[#fde8e8] text-[#eb0000]',
  Admin:         'bg-[#fff4e5] text-[#ff8d28]',
  Support:       'bg-[#e9f0ff] text-brand-blue',
};

/* Mock fallback */
const MOCK: SystemUser[] = [
  { id: '1', name: 'John Adeyemi',            email: 'john@leadremit.com',         role: 'Admin',       status: 'Active',   lastLogin: 'Jun 12, 2025', createdAt: 'Dec 12, 2023' },
  { id: '2', name: 'Grace Obi',               email: 'grace@leadremit.com',        role: 'Admin',       status: 'Active',   lastLogin: 'Jun 11, 2025', createdAt: 'Feb 02, 2024' },
  { id: '3', name: 'Celebration Church Leads', email: 'admin@celebration.org',     role: 'Support',     status: 'Active',   lastLogin: 'Jun 10, 2025', createdAt: 'Mar 18, 2024' },
  { id: '4', name: 'System Owner',            email: 'support@go-worship.com',     role: 'Super Admin', status: 'Active',   lastLogin: 'Jun 09, 2025', createdAt: 'Apr 09, 2024' },
];

const TABS = ['Super Admin', 'Admin', 'Support', 'Finance'];

/** System → Platform Users (board 778:38441). */
export default function SystemPlatformUsersPage() {
  const [tab, setTab] = useState(-1);
  const [users, setUsers] = useState<SystemUser[]>(USE_LIVE_API ? [] : MOCK);
  const [loading, setLoading] = useState(USE_LIVE_API);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSystemUsers()
      .then((data) => {
        if (data.length > 0) setUsers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === -1 ? users : users.filter((u) => u.role === TABS[tab]);

  const rows: SmartRow[] = filtered.map((u) => ({
    group: u.role,
    text: [u.name, u.email, u.role, u.status, u.lastLogin, u.createdAt],
    cells: [
      <span key="u">
        <span className="block font-medium">{u.name}</span>
        <span className="block text-brand-gray-500">{u.email}</span>
      </span>,
      <span
        key="r"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          ROLE_STYLE[u.role] ?? 'bg-[#f2f2f2] text-[#555]'
        )}
      >
        {u.role}
      </span>,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          u.status === 'Active'
            ? 'bg-[#e7f7ee] text-[#34a853]'
            : 'bg-[#fde8e8] text-[#eb0000]'
        )}
      >
        {u.status}
      </span>,
      u.lastLogin || '—',
      u.createdAt || '—',
      <UserRowMenu key="a" />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Platform Users</h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Manage admin users and permissions
          </p>
        </div>
        <Link
          href="/system/platform-users/create"
          className="flex h-10 items-center gap-2 rounded-[8px] bg-[#22a45d] px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-[#1c8c4f]"
        >
          <Plus className="size-4" />
          Add User
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => setTab(-1)}
          className={cn(
            'rounded-full px-4 py-1.5 transition-colors',
            tab === -1
              ? 'bg-brand-blue text-white'
              : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
          )}
        >
          All Users
        </button>
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              i === tab
                ? 'bg-brand-blue text-white'
                : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-[14px] text-[#888]">Loading…</p>
      ) : (
        <SmartTable
          headers={['Users', 'Role', 'Status', 'Last Login', 'Created', 'Action']}
          rows={rows}
          filterOptions={['Super Admin', 'Admin', 'Support', 'Finance']}
          filterAll="Role: All"
        />
      )}
    </div>
  );
}
