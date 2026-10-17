'use client';

import { useState, useEffect } from 'react';
import { RoleActions } from '@/components/ministry/role-actions';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Role = {
  id: string;
  role: string;
  desc: string;
  users: number;
  status: string;
  by: string;
  updated: string;
};

const ROLES: Role[] = [
  { id: 'CUS-1001', role: 'Group Leader', desc: 'Full platform control (for ministry groups).', users: 45, status: 'Active', by: 'Mary', updated: 'USA' },
  { id: 'CUS-1002', role: 'Sermon Admin', desc: 'Manage sermons uploads, media, and reports but limited settings.', users: 2, status: 'Active', by: 'Mary', updated: 'Nigeria' },
  { id: 'CUS-1003', role: 'Finance Admin', desc: 'Can manage giving, exports, accounts statement', users: 7, status: 'Inactive', by: 'Mary', updated: 'Nigeria' },
  { id: 'CUS-1004', role: 'Event Admin', desc: 'Manage events, checkin and management of events and activities', users: 10, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1005', role: 'Support Agent', desc: 'Handles tickets, support requests, customer communication.', users: 30, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1006', role: 'Finance Manager', desc: 'Can view transactions, invoices, payouts, refunds.', users: 8, status: 'Inactive', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1006', role: 'Finance Manager', desc: 'Can view transactions, invoices, payouts, refunds.', users: 8, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
];

export default function MinistryAdminManagementPage() {
  const [roles, setRoles] = useState<Role[]>(ROLES);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/roles') as Promise<unknown>)
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
          const rawStatus = String(r['status'] ?? r['roleStatus'] ?? 'Active');
          const status = rawStatus.toUpperCase() === 'INACTIVE' || rawStatus.toUpperCase() === 'DISABLED'
            ? 'Inactive' : 'Active';
          return {
            id: String(r['id'] ?? r['roleId'] ?? r['code'] ?? ''),
            role: String(r['name'] ?? r['roleName'] ?? r['displayName'] ?? ''),
            desc: String(r['description'] ?? r['desc'] ?? ''),
            users: Number(r['assignedUsers'] ?? r['userCount'] ?? r['members'] ?? 0),
            status,
            by: String(r['createdBy'] ?? r['creator'] ?? ''),
            updated: String(r['updatedAt'] ?? r['lastUpdated'] ?? r['createdAt'] ?? ''),
          };
        }).filter((r) => r.role);
        if (mapped.length > 0) setRoles(mapped);
      })
      .catch(() => {});
  }, []);

  const activeCount = roles.filter((r) => r.status === 'Active').length;
  const inactiveCount = roles.filter((r) => r.status === 'Inactive').length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Admin Management</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total sub account" value={String(roles.length)} variant="green" />
        <StatCard title="Active Roles" value={String(activeCount)} variant="green" />
        <StatCard title="Inactive Roles" value={String(inactiveCount)} variant="white" />
        <ActionCard
          variant="white"
          href="/ministry/admin-management/create"
          title="Create new Account"
          subtitle="Click here to create a new account"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-blue/10">
              <Plus className="size-5 text-brand-blue" />
            </span>
          }
        />
      </div>

      <TableCard
        title="Roles"
        filterOptions={['Created by', 'Description']}
        filterAll="Role name"
        filterByRow={false}
      >
        <table className="w-full min-w-[960px] border-collapse overflow-hidden rounded-[8px]">
            <thead>
              <tr className="bg-brand-blue text-left text-[13px] text-white">
                {['Role ID', 'Role', 'Description', 'Assigned users', 'Status', 'Created by', 'Last Updated', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:rounded-l-[8px] last:rounded-r-[8px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={i} className="border-b border-[#f2f2f2] text-[12px]">
                  <td className="px-4 py-4">{r.id}</td>
                  <td className="px-4 py-4">{r.role}</td>
                  <td className="max-w-[220px] px-4 py-4 text-brand-gray-500">{r.desc}</td>
                  <td className="px-4 py-4">{r.users}</td>
                  <td className={cn('px-4 py-4 font-medium', r.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]')}>{r.status}</td>
                  <td className="px-4 py-4">{r.by}</td>
                  <td className="px-4 py-4">{r.updated}</td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-3 text-[12px] font-medium">
                      <RoleActions id={i + 1} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>
    </div>
  );
}
