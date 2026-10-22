'use client';

import { cn } from '@/lib/utils';
import { Plus, ClipboardList } from 'lucide-react';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSystemTenants, type SystemTenant } from '@/lib/api/system';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

const STATUS: Record<string, string> = {
  Active:    'bg-[#e7f7ee] text-[#34a853]',
  Pending:   'bg-[#fff4e5] text-[#ff8d28]',
  Suspended: 'bg-[#fde8e8] text-[#eb0000]',
};

/* Mock fallback — shown in demo mode or when the API call fails */
const MOCK: SystemTenant[] = [
  { id: '1', name: 'Grace Community Church',  domain: 'grace.go-worship.com',       status: 'Active',    plan: 'Enterprise', members: 830, createdAt: 'Jan 14, 2023' },
  { id: '2', name: 'Cornerstone Church',      domain: 'cornerstone.go-worship.com', status: 'Pending',   plan: 'Pro',        members: 420, createdAt: 'Feb 02, 2023' },
  { id: '3', name: 'Impact Church',           domain: 'impact.go-worship.com',      status: 'Active',    plan: 'Pro',        members: 610, createdAt: 'Mar 18, 2023' },
  { id: '4', name: 'Hope Assembly',           domain: 'hope.go-worship.com',        status: 'Suspended', plan: 'Starter',    members: 150, createdAt: 'Apr 09, 2023' },
  { id: '5', name: 'Living Faith Center',     domain: 'livingfaith.go-worship.com', status: 'Suspended', plan: 'Starter',    members:  90, createdAt: 'May 21, 2023' },
];

const TABS = ['All Tenants', 'Active', 'Pending', 'Suspended'];

function TenantActions({ id, onSuspend }: { id: string; onSuspend: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <span className="flex items-center gap-3 font-medium">
      <Link href={`/system/tenants/${id}`} className="text-brand-blue no-underline">
        View
      </Link>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-[#eb0000]"
      >
        Suspend
      </button>
      <ConfirmModal
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={async () => {
          setConfirm(false);
          if (USE_LIVE_API) {
            try {
              await (api.patch(`/system/tenants/${id}/suspend`, {}) as Promise<unknown>);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to suspend tenant');
              return;
            }
          }
          onSuspend();
        }}
      />
    </span>
  );
}

export default function SystemTenantsPage() {
  const [tab, setTab] = useState(0);
  const [tenants, setTenants] = useState<SystemTenant[]>(USE_LIVE_API ? [] : MOCK);
  const [loading, setLoading] = useState(USE_LIVE_API);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSystemTenants()
      .then((data) => {
        if (data.length > 0) setTenants(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    tab === 0 ? tenants : tenants.filter((t) => t.status === TABS[tab]);

  const rows: SmartRow[] = filtered.map((t) => ({
    group: t.status,
    text: [t.name, t.domain, t.status, t.plan, String(t.members), t.totalGiving ?? '', t.createdAt],
    cells: [
      <span key="n">
        <span className="block font-medium">{t.name}</span>
        <span className="block text-brand-gray-500">{t.domain}</span>
      </span>,
      <span
        key="s"
        className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', STATUS[t.status])}
      >
        {t.status}
      </span>,
      <span
        key="p"
        className="rounded-full bg-[#efeaff] px-2.5 py-1 text-[11px] font-medium text-[#6c4fd6]"
      >
        {t.plan || '—'}
      </span>,
      t.members || '—',
      t.totalGiving || '—',
      t.createdAt || '—',
      <TenantActions
        key="a"
        id={t.id}
        onSuspend={() =>
          setTenants((prev) =>
            prev.map((x) => x.id === t.id ? { ...x, status: 'Suspended' as const } : x)
          )
        }
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">
            Tenants Management
          </h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Manage churches, plans, and account status
          </p>
        </div>
        <Link
          href="/system/tenants/create"
          className="flex h-10 items-center gap-2 rounded-[8px] bg-[#22a45d] px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-[#1c8c4f]"
        >
          <Plus className="size-4" />
          Add Tenant
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
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
          headers={['Tenant', 'Status', 'Plan', 'Members', 'Revenue', 'Joined', 'Action']}
          rows={rows}
          filterOptions={['Active', 'Pending', 'Suspended']}
          filterAll="Filter"
          headerRowClassName="bg-brand-blue text-white"
          emptyNode={
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#f2f2f2]">
                <ClipboardList className="size-7 text-[#bbb]" />
              </div>
              <p className="max-w-[340px] text-center text-[14px] text-[#888]">
                No tenants to display yet. The platform tenant directory will appear here once it is available.
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}
