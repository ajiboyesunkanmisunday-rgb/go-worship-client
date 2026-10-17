'use client';

import { RoleActions } from '@/components/ministry/role-actions';

import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const ROLES = [
  { id: 'CUS-1001', role: 'Group Leader', desc: 'Full platform control (for ministry groups).', users: 45, status: 'Active', by: 'Mary', updated: 'USA' },
  { id: 'CUS-1002', role: 'Sermon Admin', desc: 'Manage sermons uploads, media, and reports but limited settings.', users: 2, status: 'Active', by: 'Mary', updated: 'Nigeria' },
  { id: 'CUS-1003', role: 'Finance Admin', desc: 'Can manage giving, exports, accounts statement', users: 7, status: 'Inactive', by: 'Mary', updated: 'Nigeria' },
  { id: 'CUS-1004', role: 'Event Admin', desc: 'Manage events, checkin and management of events and activities', users: 10, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1005', role: 'Support Agent', desc: 'Handles tickets, support requests, customer communication.', users: 30, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1006', role: 'Finance Manager', desc: 'Can view transactions, invoices, payouts, refunds.', users: 8, status: 'Inactive', by: 'Mercy', updated: 'Nigeria' },
  { id: 'CUS-1006', role: 'Finance Manager', desc: 'Can view transactions, invoices, payouts, refunds.', users: 8, status: 'Active', by: 'Mercy', updated: 'Nigeria' },
];

export default function MinistryAdminManagementPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Admin Management</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total sub account" value="10" variant="green" />
        <StatCard title="Active Roles" value="8" variant="green" />
        <StatCard title="Inactive Roles" value="2" variant="white" />
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
              {ROLES.map((r, i) => (
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
