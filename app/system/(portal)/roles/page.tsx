'use client';

import { useState, useEffect } from 'react';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { cn } from '@/lib/utils';
import { Plus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Role = {
  id: string;
  name: string;
  description: string;
  users: number;
  status: string;
  createdAt: string;
};

const MOCK: Role[] = [
  { id: '1', name: 'Admin', description: 'Full platform control — tenants, billing, users.', users: 3, status: 'Active', createdAt: 'Jan 10, 2025' },
  { id: '2', name: 'Support', description: 'Handle tickets, support requests, tenant communication.', users: 5, status: 'Active', createdAt: 'Feb 02, 2025' },
  { id: '3', name: 'Auditor', description: 'Read-only access to transactions, logs, and analytics.', users: 2, status: 'Active', createdAt: 'Mar 18, 2025' },
  { id: '4', name: 'Finance', description: 'View and export transactions, invoices, and payouts.', users: 1, status: 'Inactive', createdAt: 'Apr 09, 2025' },
];

/** System → Roles (system-level permission roles for platform users). */
export default function SystemRolesPage() {
  const [roles, setRoles] = useState<Role[]>(MOCK);

  const deleteRole = (id: string) => {
    if (!USE_LIVE_API || !id) return;
    (api.del(`/system/roles/${id}`) as Promise<unknown>)
      .then(() => setRoles((prev) => prev.filter((r) => r.id !== id)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/system/roles') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: Role[] = arr.map((r) => {
          const rawDate = String(r['createdAt'] ?? r['createdOn'] ?? '');
          const createdAt = rawDate
            ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          const rawStatus = String(r['status'] ?? 'Active');
          const status = rawStatus.toUpperCase() === 'INACTIVE' || rawStatus.toUpperCase() === 'DISABLED'
            ? 'Inactive' : 'Active';
          return {
            id: String(r['id'] ?? r['roleId'] ?? r['uuid'] ?? ''),
            name: String(r['name'] ?? r['roleName'] ?? r['displayName'] ?? ''),
            description: String(r['description'] ?? r['desc'] ?? ''),
            users: Number(r['assignedUsers'] ?? r['userCount'] ?? r['members'] ?? 0),
            status,
            createdAt,
          };
        }).filter((r) => r.name);
        if (mapped.length > 0) setRoles(mapped);
      })
      .catch(() => {});
  }, []);

  const rows: SmartRow[] = roles.map((r) => ({
    group: r.status,
    text: [r.name, r.description, String(r.users), r.status, r.createdAt],
    cells: [
      <span key="n" className="flex items-center gap-2 font-medium">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#e9f0ff]">
          <ShieldCheck className="size-3.5 text-brand-blue" />
        </span>
        {r.name}
      </span>,
      <span key="d" className="max-w-[280px] text-brand-gray-500">{r.description}</span>,
      r.users,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          r.status === 'Active' ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fde8e8] text-[#eb0000]'
        )}
      >
        {r.status}
      </span>,
      r.createdAt || '—',
      <span key="a" className="flex items-center gap-3 text-[12px] font-medium">
        <button type="button" className="text-[#333] hover:opacity-70">Edit</button>
        <button
          type="button"
          className="text-[#eb0000] hover:opacity-70"
          onClick={() => deleteRole(r.id)}
        >
          Delete
        </button>
      </span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Roles</h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Manage platform-level permission roles
          </p>
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[8px] bg-brand-blue px-4 text-[14px] font-medium text-white transition-colors hover:bg-brand-blue/90"
        >
          <Plus className="size-4" />
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12px] text-brand-gray-500">Total Roles</p>
          <p className="mt-1 text-[24px] font-bold">{roles.length}</p>
        </div>
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12px] text-brand-gray-500">Active Roles</p>
          <p className="mt-1 text-[24px] font-bold text-[#34a853]">
            {roles.filter((r) => r.status === 'Active').length}
          </p>
        </div>
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12px] text-brand-gray-500">Total Assigned</p>
          <p className="mt-1 text-[24px] font-bold">
            {roles.reduce((sum, r) => sum + r.users, 0)}
          </p>
        </div>
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12px] text-brand-gray-500">Inactive Roles</p>
          <p className="mt-1 text-[24px] font-bold text-[#eb0000]">
            {roles.filter((r) => r.status === 'Inactive').length}
          </p>
        </div>
      </div>

      <SmartTable
        headers={['Role Name', 'Description', 'Users', 'Status', 'Created', 'Action']}
        rows={rows}
        filterOptions={['Active', 'Inactive']}
        filterAll="All Status"
      />
    </div>
  );
}
