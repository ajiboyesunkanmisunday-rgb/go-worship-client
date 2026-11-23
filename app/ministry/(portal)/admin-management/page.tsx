'use client';

import { useState, useEffect } from 'react';
import { RoleActions } from '@/components/ministry/role-actions';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantRoles, deleteTenantRole } from '@/lib/api/tenant';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type Role = {
  id: string;
  apiId: string;
  role: string;
  desc: string;
  users: number;
  status: string;
  by: string;
  updated: string;
};


export default function MinistryAdminManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  const deleteRole = (apiId: string) => {
    if (!apiId) return;
    deleteTenantRole(apiId)
      .then(() => {
        setRoles((prev) => prev.filter((r) => r.apiId !== apiId));
        toast.success('Role deleted.');
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'Could not delete role.');
      });
  };

  useEffect(() => {
    getTenantRoles()
      .then((arr) => {
        if (arr.length === 0) return;
        const mapped: Role[] = arr.map((r) => {
          const apiId = String(r.id ?? '');
          return {
            id: String(r.code ?? apiId),
            apiId,
            role: String(r.name ?? ''),
            desc: String(r.description ?? ''),
            users: 0,
            status: 'Active' as const,
            by: '',
            updated: '',
          };
        }).filter((r) => r.role);
        if (mapped.length > 0) setRoles(mapped);
      })
      .catch(() => { toast.error('Could not load roles.'); });
  }, []);

  const activeCount = roles.filter((r) => r.status === 'Active').length;
  const inactiveCount = roles.filter((r) => r.status === 'Inactive').length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Admin Management</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total sub account" value={String(roles.length)} variant="green" trend={[1,2,2,3,3,roles.length]} />
        <StatCard title="Active Roles" value={String(activeCount)} variant="green" trend={[1,2,2,3,activeCount]} />
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

      {roles.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Role Distribution</p>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Active vs inactive breakdown</p>
          <div className="mt-4 h-[140px] w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[{ name: 'Active', value: activeCount }, { name: 'Inactive', value: inactiveCount }]}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [String(v), 'Roles']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48} isAnimationActive={false}>
                  <Cell fill="#22a45d" />
                  <Cell fill="#e5e9f5" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
                      <RoleActions id={r.apiId || r.id} onDelete={() => deleteRole(r.apiId)} />
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
