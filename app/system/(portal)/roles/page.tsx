'use client';

import { useState, useEffect } from 'react';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { cn } from '@/lib/utils';
import { ShieldCheck, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Role = {
  id: string;
  name: string;
  type: string;
  scope: string;
  permissionCount: number;
  status: string;
};

type Permission = {
  id: string;
  name: string;
  category: string;
  scope: string;
  description: string;
  status: string;
};

const MOCK_ROLES: Role[] = [];

const MOCK_PERMISSIONS: Permission[] = [
  { id: '1',  name: 'VIEW_TENANTS',         category: 'Tenants',      scope: 'System',   description: 'View all tenants',               status: 'Active' },
  { id: '2',  name: 'MANAGE_TENANTS',       category: 'Tenants',      scope: 'System',   description: 'Create & edit tenants',          status: 'Active' },
  { id: '3',  name: 'SUSPEND_TENANT',       category: 'Tenants',      scope: 'System',   description: 'Suspend a tenant account',       status: 'Active' },
  { id: '4',  name: 'VIEW_TRANSACTIONS',    category: 'Finance',      scope: 'System',   description: 'View all platform transactions', status: 'Active' },
  { id: '5',  name: 'EXPORT_TRANSACTIONS',  category: 'Finance',      scope: 'System',   description: 'Export transaction data',        status: 'Active' },
  { id: '6',  name: 'MANAGE_PLANS',         category: 'Finance',      scope: 'System',   description: 'Create & edit billing plans',    status: 'Active' },
  { id: '7',  name: 'VIEW_USERS',           category: 'Users',        scope: 'System',   description: 'View platform users',            status: 'Active' },
  { id: '8',  name: 'MANAGE_USERS',         category: 'Users',        scope: 'System',   description: 'Provision & manage users',       status: 'Active' },
  { id: '9',  name: 'ASSIGN_ROLES',         category: 'Roles',        scope: 'System',   description: 'Assign roles to users',          status: 'Active' },
  { id: '10', name: 'MANAGE_ROLES',         category: 'Roles',        scope: 'System',   description: 'Create & edit roles',            status: 'Active' },
  { id: '11', name: 'VIEW_AUDIT_LOGS',      category: 'Audit',        scope: 'System',   description: 'View system audit logs',         status: 'Active' },
  { id: '12', name: 'EXPORT_AUDIT_LOGS',    category: 'Audit',        scope: 'System',   description: 'Export audit log data',          status: 'Active' },
  { id: '13', name: 'VIEW_ANALYTICS',       category: 'Analytics',    scope: 'System',   description: 'View platform analytics',        status: 'Active' },
  { id: '14', name: 'MANAGE_SETTINGS',      category: 'Settings',     scope: 'System',   description: 'Manage system settings',         status: 'Active' },
  { id: '15', name: 'MANAGE_MFA',           category: 'Security',     scope: 'System',   description: 'Enforce MFA policies',           status: 'Active' },
  { id: '16', name: 'VIEW_SESSIONS',        category: 'Security',     scope: 'System',   description: 'View active sessions',           status: 'Active' },
  { id: '17', name: 'REVOKE_SESSIONS',      category: 'Security',     scope: 'System',   description: 'Revoke user sessions',           status: 'Active' },
  { id: '18', name: 'MANAGE_SUPPORT',       category: 'Support',      scope: 'System',   description: 'Manage support tickets',         status: 'Active' },
  { id: '19', name: 'VIEW_SUPPORT',         category: 'Support',      scope: 'System',   description: 'View support requests',          status: 'Active' },
  { id: '20', name: 'MANAGE_BILLING',       category: 'Finance',      scope: 'System',   description: 'Manage billing & invoices',      status: 'Active' },
  { id: '21', name: 'VIEW_BILLING',         category: 'Finance',      scope: 'System',   description: 'View billing information',       status: 'Active' },
  { id: '22', name: 'MANAGE_NOTIFICATIONS', category: 'Comms',        scope: 'System',   description: 'Send system notifications',      status: 'Active' },
  { id: '23', name: 'VIEW_REPORTS',         category: 'Analytics',    scope: 'System',   description: 'Access platform reports',        status: 'Active' },
  { id: '24', name: 'MANAGE_INTEGRATIONS',  category: 'Integrations', scope: 'System',   description: 'Configure third-party APIs',     status: 'Active' },
  { id: '25', name: 'VIEW_INTEGRATIONS',    category: 'Integrations', scope: 'System',   description: 'View integration status',        status: 'Active' },
  { id: '26', name: 'MANAGE_CAMPUS',        category: 'Campus',       scope: 'Tenant',   description: 'Manage campus operations',       status: 'Active' },
  { id: '27', name: 'VIEW_CAMPUS',          category: 'Campus',       scope: 'Tenant',   description: 'View campus data',               status: 'Active' },
  { id: '28', name: 'MANAGE_CONTENT',       category: 'Content',      scope: 'Tenant',   description: 'Manage published content',       status: 'Active' },
  { id: '29', name: 'MANAGE_GIVING',        category: 'Finance',      scope: 'Tenant',   description: 'Manage giving & donations',      status: 'Active' },
  { id: '30', name: 'VIEW_GIVING',          category: 'Finance',      scope: 'Tenant',   description: 'View giving & donations',        status: 'Active' },
];

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#f2f2f2]">
        <ClipboardList className="size-7 text-[#bbb]" />
      </div>
      <p className="text-[14px] text-[#888]">No {label} found</p>
    </div>
  );
}

export default function SystemRolesPage() {
  const [activeTab, setActiveTab] = useState<'Roles' | 'Permissions'>('Roles');
  const [roles, setRoles] = useState<Role[]>(USE_LIVE_API ? [] : MOCK_ROLES);
  const [permissions, setPermissions] = useState<Permission[]>(USE_LIVE_API ? [] : MOCK_PERMISSIONS);

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
        const mapped: Role[] = arr.map((r) => ({
          id: String(r['id'] ?? r['roleId'] ?? ''),
          name: String(r['name'] ?? r['roleName'] ?? r['code'] ?? ''),
          type: String(r['type'] ?? r['roleType'] ?? 'System'),
          scope: String(r['scope'] ?? 'Platform'),
          permissionCount: Number(r['permissionCount'] ?? r['permissions'] ?? 0),
          status: String(r['status'] ?? 'Active').charAt(0).toUpperCase() + String(r['status'] ?? 'Active').slice(1).toLowerCase() as 'Active' | 'Inactive',
        })).filter((r) => r.name);
        if (mapped.length > 0) setRoles(mapped);
      })
      .catch(() => {});

    (api.get<unknown>('/system/permissions') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        const mapped: Permission[] = arr.map((p) => ({
          id: String(p['id'] ?? p['permissionId'] ?? ''),
          name: String(p['name'] ?? p['code'] ?? p['permissionName'] ?? ''),
          category: String(p['category'] ?? p['group'] ?? p['module'] ?? ''),
          scope: String(p['scope'] ?? 'System'),
          description: String(p['description'] ?? p['desc'] ?? ''),
          status: String(p['status'] ?? 'Active'),
        })).filter((p) => p.name);
        if (mapped.length > 0) setPermissions(mapped);
      })
      .catch(() => {});
  }, []);

  const roleRows: SmartRow[] = roles.map((r) => ({
    group: r.status,
    text: [r.name, r.type, r.scope, String(r.permissionCount), r.status],
    cells: [
      <span key="n" className="flex items-center gap-2 font-medium">
        <span className="flex size-7 items-center justify-center rounded-[6px] bg-[#e9f0ff]">
          <ShieldCheck className="size-3.5 text-brand-blue" />
        </span>
        {r.name}
      </span>,
      <span key="t" className="text-brand-gray-500">{r.type}</span>,
      <span key="sc" className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#555]">{r.scope}</span>,
      <span key="p">{r.permissionCount}</span>,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          r.status === 'Active' ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fde8e8] text-[#eb0000]'
        )}
      >
        {r.status}
      </span>,
      <span key="a" className="flex items-center gap-3 text-[12px] font-medium">
        <button type="button" className="text-[#333] hover:opacity-70">Edit</button>
        <button type="button" className="text-[#eb0000] hover:opacity-70">Delete</button>
      </span>,
    ],
  }));

  const permRows: SmartRow[] = permissions.map((p) => ({
    group: p.category,
    text: [p.name, p.category, p.scope, p.description, p.status],
    cells: [
      <span key="n" className="font-medium">{p.name}</span>,
      <span key="c" className="text-brand-gray-500">{p.category}</span>,
      <span key="sc" className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#555]">{p.scope}</span>,
      <span key="d" className="max-w-[260px] text-brand-gray-500">{p.description}</span>,
      <span
        key="s"
        className="rounded-full bg-[#e7f7ee] px-2.5 py-1 text-[11px] font-medium text-[#34a853]"
      >
        {p.status}
      </span>,
      <span key="a" className="text-[12px] font-medium text-[#333]">
        <button type="button" className="hover:opacity-70">View</button>
      </span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e9f0ff]">
          <ShieldCheck className="size-5 text-brand-blue" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Roles &amp; Permissions</h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Platform roles and what each one can do
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => setActiveTab('Roles')}
          className={cn(
            'rounded-full px-4 py-1.5 font-medium transition-colors',
            activeTab === 'Roles'
              ? 'bg-brand-blue text-white'
              : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
          )}
        >
          Roles {roles.length}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Permissions')}
          className={cn(
            'rounded-full px-4 py-1.5 font-medium transition-colors',
            activeTab === 'Permissions'
              ? 'bg-brand-blue text-white'
              : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
          )}
        >
          Permissions {permissions.length}
        </button>
      </div>

      {activeTab === 'Roles' ? (
        roles.length === 0 ? (
          <div className="rounded-[14px] bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] px-3 opacity-50">
                <span className="text-[12px] text-brand-gray-500">Search</span>
              </div>
              <button className="h-9 rounded-[6px] border-[0.3px] border-brand-blue bg-[#e9f0ff] px-4 text-[12px] font-medium text-brand-blue opacity-50">Export CSV</button>
              <select className="h-9 rounded-[6px] border-[0.3px] border-brand-blue px-3 text-[12px] font-medium text-brand-blue outline-none opacity-50">
                <option>All roles</option>
              </select>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[13px] text-[#333]">
                  {['Role', 'Type', 'Scope', 'Permissions', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-3 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <EmptyState label="roles" />
          </div>
        ) : (
          <SmartTable
            headers={['Role', 'Type', 'Scope', 'Permissions', 'Status', 'Action']}
            rows={roleRows}
            filterOptions={['Active', 'Inactive']}
            filterAll="All roles"
          />
        )
      ) : (
        <SmartTable
          headers={['Permission', 'Category', 'Scope', 'Description', 'Status', 'Action']}
          rows={permRows}
          filterAll="All categories"
        />
      )}
    </div>
  );
}
