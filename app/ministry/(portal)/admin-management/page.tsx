'use client';

import { useState, useEffect } from 'react';
import { RoleActions } from '@/components/ministry/role-actions';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantRoles, deleteTenantRole, getTenantRoleByCode, getTenantPermissions, getTenantPermissionById, getTenantPermissionByCode, type TenantPermission } from '@/lib/api/tenant';
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
  const [permissions, setPermissions] = useState<TenantPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleCodeSearch, setRoleCodeSearch] = useState('');
  const [permCodeSearch, setPermCodeSearch] = useState('');
  const [permDetail, setPermDetail] = useState<TenantPermission | null>(null);

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
        setRoles(mapped);
      })
      .catch(() => { toast.error('Could not load roles.'); })
      .finally(() => setLoading(false));
    getTenantPermissions().then(setPermissions).catch(() => {});
  }, []);

  const handleRoleCodeSearch = async () => {
    if (!roleCodeSearch.trim()) return;
    try {
      await getTenantRoleByCode(roleCodeSearch.trim());
      toast.success(`Role found: ${roleCodeSearch}`);
    } catch { toast.error('Role not found.'); }
  };

  const handlePermSearch = async () => {
    if (!permCodeSearch.trim()) return;
    try {
      const p = await getTenantPermissionByCode(permCodeSearch.trim());
      setPermDetail(p);
    } catch { toast.error('Permission not found.'); }
  };

  const handlePermById = async (id: string) => {
    try {
      const p = await getTenantPermissionById(id);
      setPermDetail(p);
    } catch { toast.error('Could not load permission detail.'); }
  };

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
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-brand-gray-400">Loading roles…</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-brand-gray-400">No roles found.</td></tr>
              ) : roles.map((r, i) => (
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

      {/* Role/Permission Search */}
      <div className="rounded-[14px] bg-white p-6">
        <p className="text-[16px] font-bold mb-4">Role &amp; Permission Lookup</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              className="h-[36px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue w-[200px]"
              placeholder="Lookup role by code…"
              value={roleCodeSearch}
              onChange={(e) => setRoleCodeSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleRoleCodeSearch(); }}
            />
            <button type="button" onClick={() => void handleRoleCodeSearch()} className="h-[36px] rounded-[8px] bg-brand-blue px-3 text-[12px] font-medium text-white hover:opacity-90">Search Role</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="h-[36px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue w-[200px]"
              placeholder="Lookup permission by code…"
              value={permCodeSearch}
              onChange={(e) => setPermCodeSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handlePermSearch(); }}
            />
            <button type="button" onClick={() => void handlePermSearch()} className="h-[36px] rounded-[8px] bg-brand-blue px-3 text-[12px] font-medium text-white hover:opacity-90">Search Perm</button>
          </div>
        </div>
        {permDetail && (
          <div className="mt-4 rounded-[10px] border border-[#ddd] bg-[#f9fafb] p-4 text-[13px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{permDetail.name ?? permDetail.code ?? '—'}</p>
                {permDetail.type && <p className="text-brand-gray-500 text-[11px] mt-0.5">{permDetail.type}</p>}
                {permDetail.description && <p className="mt-1 text-brand-gray-500">{permDetail.description}</p>}
              </div>
              <button type="button" onClick={() => setPermDetail(null)} className="text-brand-gray-400 hover:text-[#333]">
                <Plus className="size-4 rotate-45" />
              </button>
            </div>
          </div>
        )}
      </div>

      {permissions.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold mb-4">Permissions</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-[13px]">
                  {['Name', 'Code', 'Type', 'Description', 'Action'].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={p.id ?? i} className="border-t border-[#f2f2f2]">
                    <td className="py-3 font-medium">{p.name ?? '—'}</td>
                    <td className="py-3 font-mono text-brand-gray-500">{p.code ?? '—'}</td>
                    <td className="py-3">{p.type ?? '—'}</td>
                    <td className="max-w-[220px] py-3 text-brand-gray-500">{p.description ?? '—'}</td>
                    <td className="py-3">
                      {p.id && (
                        <button type="button" onClick={() => void handlePermById(p.id!)} className="text-[12px] font-medium text-brand-blue hover:underline">Detail</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
