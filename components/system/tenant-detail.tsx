'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSystemTenant, type SystemTenant } from '@/lib/api/system';
import { USE_LIVE_API } from '@/lib/api/config';
import { api } from '@/lib/api/client';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CalendarClock,
  CalendarDays,
  Globe,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  Slash,
  SquarePen,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/confirm-modal';

/**
 * System → Tenant detail page (778:38441, "Edit Tenants" row). Header with
 * Active badge + Edit / ••• (Suspend / Delete Tenant), four stat cards, seven
 * tabs, and the Overview tab (Contact Information + Account Details). Replaces
 * the old single-page edit form at /system/tenants/[id].
 *
 * NOTE: the six non-Overview tabs (Members / Giving / Groups / Events /
 * Billing / Media) have designs that haven't been captured yet, so they render
 * an honest empty state rather than invented content. Flagged in
 * docs/design-audit.md.
 */

const TABS = [
  'Overview',
  'Members',
  'Giving',
  'Groups',
  'Events',
  'Billing',
  'Media',
] as const;
type Tab = (typeof TABS)[number];

function buildStats(t: SystemTenant) {
  return [
    { label: 'Admin Users', value: t.adminUsers != null ? String(t.adminUsers) : (USE_LIVE_API ? '—' : '10'), bg: 'bg-[#f6f8fb]' },
    { label: 'Church Members', value: t.members ? String(t.members) : (USE_LIVE_API ? '—' : '830'), bg: 'bg-[#eafaf0]' },
    { label: 'Total Giving', value: t.totalGiving || (USE_LIVE_API ? '—' : '$125,000'), bg: 'bg-[#e9f7f5]' },
    { label: 'Current Plan', value: t.plan || (USE_LIVE_API ? '—' : 'Enterprise'), bg: 'bg-[#eef2fb]' },
  ];
}

const MOCK_TENANT: SystemTenant = {
  id: 'mock',
  name: 'Grace Community Church',
  domain: 'grace-community.churchapp.com',
  status: 'Active',
  plan: 'Enterprise',
  members: 830,
  createdAt: 'Jan 10, 2025',
};

export function TenantDetail({ id }: { id: string }) {
  const router = useRouter();
  const back = '/system/tenants';
  const [tab, setTab] = useState<Tab>('Overview');
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const [tenant, setTenant] = useState<SystemTenant>(
    USE_LIVE_API ? { id: '', name: '', domain: '', status: 'Active', plan: '', members: 0, createdAt: '' } : MOCK_TENANT
  );
  const stats = buildStats(tenant);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSystemTenant(id).then((t: SystemTenant | null) => { if (t) setTenant(t); }).catch(() => {});
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push(back)}
            aria-label="Go back"
            className="mt-1 text-black transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-bold">{tenant.name}</h1>
              <span className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium',
                tenant.status === 'Active' ? 'bg-[#eafaf0] text-[#22a45d]' :
                tenant.status === 'Suspended' ? 'bg-[#fef0f0] text-[#eb0000]' :
                'bg-[#f6f8fb] text-brand-gray-500'
              )}>
                {tenant.status}
              </span>
            </div>
            <p className="text-[14px] text-brand-gray-500">
              {tenant.domain}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/system/tenants/${id}/edit`)}
            className="flex items-center gap-2 rounded-[8px] bg-[#f6f8fb] px-4 py-2 text-[13px] font-medium hover:bg-[#eef1f6]"
          >
            <SquarePen className="size-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-label="More actions"
            aria-expanded={menu}
            className="flex size-9 items-center justify-center rounded-[8px] bg-[#f6f8fb] hover:bg-[#eef1f6]"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {menu && (
            <div
              className="absolute top-11 right-0 z-10 w-[160px] overflow-hidden rounded-[10px] border border-[#eee] bg-white py-1 shadow-lg"
              onMouseLeave={() => setMenu(false)}
            >
              <button
                type="button"
                onClick={() => setMenu(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#ff8d28] hover:bg-[#fff7ef]"
              >
                <Ban className="size-4" />
                Suspend
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setDel(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#eb0000] hover:bg-[#fdf0f0]"
              >
                <Trash2 className="size-4" />
                Delete Tenant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn('flex flex-col gap-3 rounded-[14px] p-5', s.bg)}
          >
            <div className="flex items-start justify-between">
              <p className="text-[14px] text-brand-gray-600">{s.label}</p>
              <span className="flex size-8 items-center justify-center rounded-full bg-white">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
            <p className="text-[28px] font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-full bg-[#f6f8fb] p-1 text-[13px]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-5 py-2 transition-colors',
              tab === t
                ? 'bg-white font-medium text-brand-blue shadow-sm'
                : 'text-brand-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[14px] border border-[#eee] p-6">
            <h2 className="text-[18px] font-bold">Contact Information</h2>
            <div className="mt-5 flex flex-col gap-5">
              <DetailRow icon={Mail} label="Email" value={tenant.email ?? (USE_LIVE_API ? '—' : 'admin@gracecommunity.org')} />
              <DetailRow icon={Phone} label="Phone" value={tenant.phone ?? (USE_LIVE_API ? '—' : '+1 555-0101')} />
              <DetailRow
                icon={Globe}
                label="Custom Domain"
                value={tenant.domain || (USE_LIVE_API ? '—' : 'gracecommunity.churchapp.com')}
              />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#eee] p-6">
            <h2 className="text-[18px] font-bold">Account Details</h2>
            <div className="mt-5 flex flex-col gap-5">
              <DetailRow icon={Tag} label="Slug" value={tenant.slug ?? tenant.id ?? (USE_LIVE_API ? '—' : 'grace-community')} />
              <DetailRow
                icon={CalendarDays}
                label="Created"
                value={tenant.createdAt || (USE_LIVE_API ? '—' : 'January 14, 2023')}
              />
              <DetailRow
                icon={CalendarDays}
                label="Last Active"
                value={tenant.lastActive ?? (USE_LIVE_API ? '—' : 'January 13, 2024')}
              />
            </div>
          </div>
        </div>
      ) : tab === 'Members' ? (
        <MembersTab id={id} />
      ) : tab === 'Giving' ? (
        <GivingTab id={id} tenantName={tenant.name} />
      ) : tab === 'Groups' ? (
        <GroupsTab id={id} />
      ) : tab === 'Events' ? (
        <EventsTab id={id} />
      ) : tab === 'Billing' ? (
        <BillingTab id={id} />
      ) : (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#ddd] py-16 text-center">
          <Slash className="size-6 text-brand-gray-400" />
          <p className="text-[14px] font-medium">No {tab.toLowerCase()} to show yet</p>
          <p className="max-w-[320px] text-[12px] text-brand-gray-500">
            This tenant&apos;s {tab.toLowerCase()} will appear here.
          </p>
        </div>
      )}

      {/* ConfirmModal renders the design's "Are you sure? / can't be undone". */}
      <ConfirmModal
        open={del}
        onOpenChange={setDel}
        onConfirm={() => {
          setDel(false);
          router.push(back);
        }}
      />
    </div>
  );
}

/**
 * Members tab — the "Member List" table from the design (All Member / Active /
 * Inactive sub-tabs, Name / Phone / Email / Join Date / Status + View). The
 * "Group Member" detail slide-over the View action opens is not built yet —
 * tracked as a follow-up; see docs/design-audit.md.
 */
type MemberRow = { name: string; phone: string; email: string; joined: string; status: string };

const MEMBERS: MemberRow[] = [
  { name: 'John Doe', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Active' },
  { name: 'Mercy O.Don', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Active' },
  { name: 'Child Moses', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Inactive' },
  { name: 'Daniel Choke', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Active' },
  { name: 'Kingsi Andsam', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Inactive' },
  { name: 'John Doe', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Active' },
  { name: 'Micheal paul', phone: '08051961803', email: 'john@mail.com', joined: 'Jan 2025', status: 'Inactive' },
];

async function tryGetTenantResource(_id: string, _sub: string): Promise<unknown> {
  // No GET /system/tenants/:id endpoint in backend API spec.
  // Available tenant paths: GET /system/tenants/:id/payment-gateways, PATCH suspend/activate, DELETE soft-delete.
  return null;
}

function MembersTab({ id }: { id: string }) {
  const [members, setMembers] = useState<MemberRow[]>(USE_LIVE_API ? [] : MEMBERS);
  const [sub, setSub] = useState<'All Member' | 'Active' | 'Inactive'>('All Member');
  const [openMember, setOpenMember] = useState<string | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    tryGetTenantResource(id, 'members')
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: MemberRow[] = arr.map((m) => {
          const rawStatus = String(m['status'] ?? 'Active');
          const status = rawStatus.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active';
          const rawDate = String(m['joinedAt'] ?? m['createdAt'] ?? m['joinDate'] ?? '');
          const joined = rawDate
            ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : '';
          return {
            name: String(m['name'] ?? m['fullName'] ?? m['displayName'] ?? ''),
            phone: String(m['phone'] ?? m['phoneNumber'] ?? m['mobile'] ?? ''),
            email: String(m['email'] ?? m['emailAddress'] ?? ''),
            joined,
            status,
          };
        }).filter((m) => m.name);
        if (mapped.length > 0) setMembers(mapped);
      })
      .catch(() => {});
  }, [id]);

  const rows = sub === 'All Member' ? members : members.filter((m) => m.status === sub);

  return (
    <div className="mt-6 rounded-[14px] bg-[#f7f9fc] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-brand-blue">Member List</h2>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2">
          <Search className="size-4 text-brand-gray-500" />
          <input
            placeholder="Search"
            className="bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-full bg-white p-1 text-[13px] w-fit">
        {(['All Member', 'Active', 'Inactive'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSub(t)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              sub === t
                ? 'bg-brand-blue font-medium text-white'
                : 'text-brand-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {['Name', 'Phone', 'Email', 'Join Date', 'Status', 'Action'].map(
                (h) => (
                  <th key={h} className="py-3 font-medium">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr
                key={i}
                className="border-t border-[#eef0f4] text-[13px] text-[#333]"
              >
                <td className="py-4 font-medium">{m.name}</td>
                <td className="py-4">{m.phone}</td>
                <td className="py-4">{m.email}</td>
                <td className="py-4">{m.joined}</td>
                <td
                  className={cn(
                    'py-4 font-medium',
                    m.status === 'Active' ? 'text-[#22a45d]' : 'text-[#eb0000]'
                  )}
                >
                  {m.status}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenMember(m.name)}
                    className="rounded-full bg-[#eef1f6] px-5 py-1.5 text-[12px] font-medium text-brand-blue hover:bg-[#e2e7f0]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GroupMemberSheet
        name={openMember}
        onClose={() => setOpenMember(null)}
      />
    </div>
  );
}

/**
 * "Group Member" detail slide-over (Members-tab View action). Matches the
 * design: member details, active groups, last attendance, attendance rate,
 * follow-up notes, Delete Member / update changes.
 */
function GroupMemberSheet({
  name,
  onClose,
}: {
  name: string | null;
  onClose(): void;
}) {
  return (
    <Dialog.Root open={!!name} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col gap-6 overflow-y-auto bg-white px-7 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between">
            <ArrowLeft className="size-5" />
            <Dialog.Close aria-label="Close">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </span>
            </Dialog.Close>
          </div>

          <div>
            <p className="text-[12px] text-brand-gray-500">Overview</p>
            <Dialog.Title className="text-[22px] font-bold text-brand-blue">
              Group Member
            </Dialog.Title>
            <p className="mt-1 flex items-center gap-2 text-[12px] text-brand-gray-500">
              Joined on June 10, 2025
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#22a45d]" /> Active
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef1f6]">
              <Users className="size-6 text-brand-gray-500" />
            </span>
            <div>
              <p className="text-[11px] text-brand-gray-500">Member Details</p>
              <p className="text-[16px] font-bold text-brand-blue">
                {name ?? (USE_LIVE_API ? '—' : 'John Samuel Doe')}
              </p>
              <p className="text-[12px] text-brand-gray-500">
                {USE_LIVE_API ? '—' : 'johnsamuel@email.com · +234 812 345 6789'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h3 className="text-[15px] font-bold">Member Details</h3>
            <DetailRow
              icon={Users}
              label="Active Groups"
              value={USE_LIVE_API ? '—' : "Men's Fellowship · Choir"}
            />
            <DetailRow
              icon={CalendarClock}
              label="Last Attendance Date"
              value={USE_LIVE_API ? '—' : 'July 30th 2024'}
            />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f6f8fb]">
                <TrendingUp className="size-4 text-brand-gray-500" />
              </span>
              <div className="w-full">
                <p className="text-[12px] text-brand-gray-500">Attendance Rate</p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#eef0f4]">
                  <div className={`h-full rounded-full bg-[#22a45d] ${USE_LIVE_API ? 'w-0' : 'w-[78%]'}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#eee] p-4">
            <p className="text-[13px] font-semibold">Notes for follow-up</p>
            <p className="mt-1 text-[13px] text-[#333]">
              {USE_LIVE_API ? '—' : 'Absent for 2 weeks, follow up'}
            </p>
            <p className="mt-2 text-[11px] text-brand-gray-500">{USE_LIVE_API ? '' : 'Added by Leader'}</p>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Button size="lg" className="h-[52px] w-full">
              Delete Member
            </Button>
            <Button size="lg" variant="outline" className="h-[52px] w-full">
              update changes
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Giving tab — the "Transactions" table from the design (Non Member / Member
 * sub-tabs; Name / Status / Date / Amount / Method / Type + View). View opens a
 * Giving Receipt slide-over (with Refund on failed rows) — not built yet,
 * tracked as a follow-up; see docs/design-audit.md.
 */
type TxnRow = { status: string; amount: string; type: string; name?: string; date?: string; method?: string; id?: string };

const TRANSACTIONS: TxnRow[] = [
  { status: 'Pending', amount: '$1000', type: 'General Offering' },
  { status: 'Success', amount: '$3000', type: 'Tithe Offering' },
  { status: 'Failed', amount: '$2000', type: 'Offering' },
  { status: 'Success', amount: '$3000', type: 'Thanksgiving' },
  { status: 'Failed', amount: '$2000', type: 'General Offering' },
  { status: 'Pending', amount: '$3000', type: 'Building Project' },
];

const TXN_STATUS: Record<string, string> = {
  Pending: 'text-[#ff8d28]',
  Success: 'text-[#22a45d]',
  Failed: 'text-[#eb0000]',
};

function GivingTab({ id, tenantName }: { id: string; tenantName: string }) {
  const [transactions, setTransactions] = useState<TxnRow[]>(USE_LIVE_API ? [] : TRANSACTIONS);
  const [sub, setSub] = useState<'Non Member' | 'Member'>('Non Member');
  const [receipt, setReceipt] = useState<{ failed: boolean; row?: TxnRow } | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    tryGetTenantResource(id, 'transactions')
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: TxnRow[] = arr.map((t) => {
          const rawStatus = String(t['status'] ?? 'Pending');
          const s = rawStatus.toUpperCase();
          const status = s.includes('SUCCESS') || s.includes('COMPLET') ? 'Success'
            : s.includes('FAIL') || s.includes('ERROR') ? 'Failed' : 'Pending';
          const rawAmt = Number(t['amount'] ?? t['amountPaid'] ?? t['value'] ?? 0);
          const currency = String(t['currency'] ?? 'USD');
          const amount = rawAmt ? `${currency === 'USD' ? '$' : currency}${rawAmt.toLocaleString()}` : '$0';
          const rawDate = String(t['createdAt'] ?? t['paidAt'] ?? t['date'] ?? '');
          return {
            status,
            amount,
            type: String(t['fundName'] ?? t['offeringType'] ?? t['type'] ?? 'Giving'),
            name: String(t['donorName'] ?? t['memberName'] ?? t['name'] ?? 'Anonymous'),
            date: rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            method: String(t['paymentMethod'] ?? t['method'] ?? ''),
            id: String(t['transactionId'] ?? t['paymentReference'] ?? t['reference'] ?? t['id'] ?? ''),
          };
        });
        if (mapped.length > 0) setTransactions(mapped);
      })
      .catch(() => {});
  }, [id]);

  return (
    <div className="mt-6 rounded-[14px] bg-[#f7f9fc] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-brand-blue">Transactions</h2>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2">
          <Search className="size-4 text-brand-gray-500" />
          <input
            placeholder="Search"
            className="bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 flex w-fit gap-1 rounded-full bg-white p-1 text-[13px]">
        {(['Non Member', 'Member'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSub(t)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              sub === t
                ? 'bg-brand-blue font-medium text-white'
                : 'text-brand-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {['Name', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action'].map(
                (h) => (
                  <th key={h} className="py-3 font-medium">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr
                key={i}
                className="border-t border-[#eef0f4] text-[13px] text-[#333]"
              >
                <td className="py-4 font-medium">{t.name ?? (USE_LIVE_API ? '—' : 'John Christain')}</td>
                <td className={cn('py-4 font-medium', TXN_STATUS[t.status] ?? 'text-[#ff8d28]')}>
                  {t.status}
                </td>
                <td className="py-4">{t.date ?? (USE_LIVE_API ? '—' : 'June 12, 2025')}</td>
                <td className="py-4">{t.amount}</td>
                <td className="py-4">{t.method ?? (USE_LIVE_API ? '—' : 'Bank transfer')}</td>
                <td className="py-4">{t.type}</td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() =>
                      setReceipt({ failed: t.status === 'Failed', row: t })
                    }
                    className="rounded-full bg-[#eef1f6] px-5 py-1.5 text-[12px] font-medium text-brand-blue hover:bg-[#e2e7f0]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GivingReceiptSheet
        open={!!receipt}
        failed={receipt?.failed ?? false}
        onClose={() => setReceipt(null)}
        tenantName={tenantName}
        row={receipt?.row}
      />
    </div>
  );
}

/**
 * Giving Receipt slide-over (Giving-tab View action). Matches the design:
 * church header, Donor Information, the receipt fields, Subtotal, and
 * Download Receipt — plus a Refund action when the transaction failed.
 */
function GivingReceiptSheet({
  open,
  failed,
  onClose,
  tenantName,
  row,
}: {
  open: boolean;
  failed: boolean;
  onClose(): void;
  tenantName?: string;
  row?: TxnRow;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col gap-5 overflow-y-auto bg-white px-7 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-end">
            <Dialog.Close aria-label="Close">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </span>
            </Dialog.Close>
          </div>

          <div className="text-center">
            <p className="text-[13px] font-semibold">{tenantName ?? (USE_LIVE_API ? '—' : 'Celebration Church Int.')}</p>
          </div>

          {row?.name && (
            <div>
              <p className="text-[11px] text-brand-gray-500">Donor Information</p>
              <p className="text-[14px] font-semibold">{row.name}</p>
            </div>
          )}

          <Dialog.Title className="text-[16px] font-bold text-brand-blue">
            Giving Receipt
          </Dialog.Title>
          <div className="flex flex-col gap-3">
            <ReceiptRow label="Donation Date" value={row?.date ?? (USE_LIVE_API ? '—' : 'January 12, 2025')} />
            <ReceiptRow label="Amount Given" value={row?.amount ?? (USE_LIVE_API ? '—' : '$25.00')} />
            <ReceiptRow label="Fund / Campaign" value={row?.type ?? (USE_LIVE_API ? '—' : 'General Offering')} />
            <ReceiptRow label="Donation Type" value={USE_LIVE_API ? '—' : 'One-time'} />
            <ReceiptRow label="Payment Method" value={row?.method ?? (USE_LIVE_API ? '—' : 'Debit Card')} />
            <ReceiptRow label="Transaction ID" value={row?.id || (USE_LIVE_API ? '—' : 'TXN-02939493')} />
            <ReceiptRow
              label="Status"
              value={
                <span
                  className={cn(
                    'font-medium',
                    failed ? 'text-[#eb0000]' : 'text-[#22a45d]'
                  )}
                >
                  {failed ? 'Failed' : 'Successful'}
                </span>
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#f6f8fb] px-4 py-3">
            <span className="text-[14px] font-semibold">Subtotal:</span>
            <span className="text-[14px] font-bold">{row?.amount ?? '$0.00'}</span>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Button size="lg" className="h-[52px] w-full">
              Download Receipt
            </Button>
            {failed && (
              <Button
                size="lg"
                variant="outline"
                className="h-[52px] w-full border-[#eb0000] text-[#eb0000] hover:bg-[#fdf0f0]"
              >
                Refund
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-brand-gray-500">{label}</span>
      <span className="font-medium text-[#333]">{value}</span>
    </div>
  );
}

/**
 * Groups tab — the "Recent Groups" table from the design (Group Name /
 * Category / Leader / Meeting Day & Time / Members / Status + View).
 */
type GroupRow = { name: string; cat: string; leader: string; status: string; meetingTime?: string; memberCount?: string; description?: string; venueName?: string; onlineMeetingLink?: string; meetingFrequency?: string; meetingDays?: string };

const GROUPS: GroupRow[] = [
  { name: 'Faith Builders Fellowship', cat: 'Small Group', leader: 'John Samuel', status: 'Active' },
  { name: 'Faith Builders Fellowship', cat: 'Small Group', leader: 'John Samuel', status: 'Active' },
  { name: 'Faith Builders Community', cat: 'Discussion Group', leader: 'Michael Thompson', status: 'Inactive' },
  { name: 'Faith Builders Community', cat: 'Discussion Group', leader: 'Michael Thompson', status: 'Active' },
  { name: 'Faith Builders Community', cat: 'Discussion Group', leader: 'Michael Thompson', status: 'Active' },
];

function GroupsTab({ id }: { id: string }) {
  const [groups, setGroups] = useState<GroupRow[]>(USE_LIVE_API ? [] : GROUPS);
  const [openGroup, setOpenGroup] = useState<GroupRow | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    tryGetTenantResource(id, 'groups')
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: GroupRow[] = arr.map((g) => {
          const rawStatus = String(g['status'] ?? 'Active');
          const status = rawStatus.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active';
          const days = Array.isArray(g['meetingDays'])
            ? (g['meetingDays'] as string[]).join(', ')
            : String(g['meetingDay'] ?? g['meetingDays'] ?? '');
          const time = String(g['meetingTime'] ?? g['time'] ?? '');
          return {
            name: String(g['name'] ?? g['groupName'] ?? ''),
            cat: String(g['category'] ?? g['type'] ?? g['groupType'] ?? 'Small Group'),
            leader: String(g['leaderName'] ?? g['leader'] ?? g['createdBy'] ?? ''),
            status,
            meetingTime: time ? `${days ? `${days} at ` : ''}${time}` : undefined,
            memberCount: String(g['memberCount'] ?? g['members'] ?? g['totalMembers'] ?? ''),
            description: String(g['description'] ?? g['about'] ?? ''),
            venueName: String(g['venueName'] ?? g['venue'] ?? g['location'] ?? ''),
            onlineMeetingLink: String(g['onlineMeetingLink'] ?? g['meetingLink'] ?? g['zoomLink'] ?? ''),
            meetingFrequency: String(g['meetingFrequency'] ?? g['frequency'] ?? ''),
            meetingDays: days,
          };
        }).filter((g) => g.name);
        if (mapped.length > 0) setGroups(mapped);
      })
      .catch(() => {});
  }, [id]);
  return (
    <div className="mt-6 rounded-[14px] bg-[#f7f9fc] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-brand-blue">Recent Groups</h2>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2">
          <Search className="size-4 text-brand-gray-500" />
          <input
            placeholder="Search"
            className="bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {[
                'Group Name',
                'Category',
                'Leader',
                'Meeting Day & Time',
                'Members',
                'Status',
                'Action',
              ].map((h) => (
                <th key={h} className="py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr
                key={i}
                className="border-t border-[#eef0f4] text-[13px] text-[#333]"
              >
                <td className="py-4 font-medium">{g.name}</td>
                <td className="py-4">{g.cat}</td>
                <td className="py-4">{g.leader}</td>
                <td className="py-4">{g.meetingTime || '—'}</td>
                <td className="py-4">{g.memberCount || '—'}</td>
                <td
                  className={cn(
                    'py-4 font-medium',
                    g.status === 'Active' ? 'text-[#22a45d]' : 'text-[#eb0000]'
                  )}
                >
                  {g.status}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(g)}
                    className="rounded-full bg-[#eef1f6] px-5 py-1.5 text-[12px] font-medium text-brand-blue hover:bg-[#e2e7f0]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GroupOverviewSheet group={openGroup} onClose={() => setOpenGroup(null)} />
    </div>
  );
}

/** Group Overview slide-over (Groups-tab View). */
function GroupOverviewSheet({
  group,
  onClose,
}: {
  group: GroupRow | null;
  onClose(): void;
}) {
  return (
    <Dialog.Root open={!!group} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col gap-5 overflow-y-auto bg-white px-7 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between bg-[#f4f8ff] -mx-7 -mt-6 px-7 py-4">
            <Dialog.Title className="text-[18px] font-bold text-brand-blue">
              Group Overview
            </Dialog.Title>
            <Dialog.Close aria-label="Close">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </span>
            </Dialog.Close>
          </div>

          <div>
            <p className="text-[10px] text-brand-gray-500">Group Name:</p>
            <p className="text-[20px] font-bold text-brand-blue">
              {group?.name ?? ''}
            </p>
            <p className="text-[12px] text-brand-gray-500">
              Category: {group?.cat ?? '—'}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className={cn('size-2 rounded-full', group?.status === 'Active' ? 'bg-[#22a45d]' : 'bg-[#eb0000]')} />
                {group?.status ?? 'Active'}
              </span>
            </p>
          </div>

          <h3 className="text-[15px] font-bold">Group Information</h3>
          <div className="flex flex-col gap-4">
            <ReadonlyField
              label="Group Description*"
              value={group?.description || '—'}
            />
            <ReadonlyField label="Meeting Frequency*" value={group?.meetingFrequency || '—'} />
            <ReadonlyField label="Meeting Day*" value={group?.meetingDays || '—'} />
            <ReadonlyField label="Meeting Time*" value={group?.meetingTime || '—'} />
            <ReadonlyField label="Group Leader*" value={group?.leader || '—'} />
            <ReadonlyField label="Venue Name*" value={group?.venueName || '—'} />
            <ReadonlyField
              label="Online Meeting Link*"
              value={group?.onlineMeetingLink || '—'}
            />
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Button size="lg" className="h-[52px] w-full">
              Edit Group
            </Button>
            <Button size="lg" variant="outline" className="h-[52px] w-full">
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#333]">{label}</span>
      <div className="rounded-[8px] border border-[#e5e5e5] px-4 py-3 text-[13px] text-brand-gray-600">
        {value}
      </div>
    </div>
  );
}

/**
 * Events tab — the "Recent Events" table from the design (Event Name /
 * Date & Time / Location / Registrations / Status + View). Same shape as the
 * Ministry events table.
 */
type EventRow = { name: string; date: string; loc: string; reg: string; status: string };

const EVENTS: EventRow[] = [
  { name: 'Midweek Recharge', date: 'Feb 21, 2025 • 6PM', loc: 'Main Hall', reg: '125', status: 'Upcoming' },
  { name: 'Weekend Workshop', date: 'Feb 25, 2025 • 10AM', loc: 'Conference Room A', reg: '75', status: 'Completed' },
  { name: 'Team Building Retreat', date: 'Mar 10, 2025 • 8AM', loc: 'Offsite Location', reg: '50', status: 'Ongoing' },
  { name: 'Monthly Check-in', date: 'Mar 15, 2025 • 3PM', loc: 'Zoom', reg: 'Unlimited', status: 'Cancelled' },
  { name: 'Spring Networking Event', date: 'Apr 5, 2025 • 5PM', loc: 'Rooftop Garden', reg: '150', status: 'Upcoming' },
];

const EVENT_STATUS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#22a45d]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
};

function EventsTab({ id }: { id: string }) {
  const [events, setEvents] = useState<EventRow[]>(USE_LIVE_API ? [] : EVENTS);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    tryGetTenantResource(id, 'events')
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: EventRow[] = arr.map((e) => {
          const rawDate = String(e['startDate'] ?? e['eventDate'] ?? e['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const rawStatus = String(e['status'] ?? 'Upcoming');
          const s = rawStatus.toUpperCase();
          const status = s.includes('COMPLET') ? 'Completed'
            : s.includes('CANCEL') ? 'Cancelled'
            : s.includes('ONGOING') || s.includes('ACTIVE') ? 'Ongoing'
            : 'Upcoming';
          return {
            name: String(e['name'] ?? e['title'] ?? e['eventName'] ?? ''),
            date,
            loc: String(e['location'] ?? e['venue'] ?? e['address'] ?? ''),
            reg: String(e['registrations'] ?? e['registrationCount'] ?? e['attendees'] ?? ''),
            status,
          };
        }).filter((e) => e.name);
        if (mapped.length > 0) setEvents(mapped);
      })
      .catch(() => {});
  }, [id]);
  return (
    <div className="mt-6 rounded-[14px] bg-[#f7f9fc] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-brand-blue">Recent Events</h2>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2">
          <Search className="size-4 text-brand-gray-500" />
          <input
            placeholder="Search"
            className="bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {[
                'Event Name',
                'Date & Time',
                'Location',
                'Registrations',
                'Status',
                'Action',
              ].map((h) => (
                <th key={h} className="py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr
                key={i}
                className="border-t border-[#eef0f4] text-[13px] text-[#333]"
              >
                <td className="py-4 font-medium">{e.name}</td>
                <td className="py-4">{e.date}</td>
                <td className="py-4">{e.loc}</td>
                <td className="py-4">{e.reg}</td>
                <td className={cn('py-4 font-medium', EVENT_STATUS[e.status])}>
                  {e.status}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenEvent(e.name)}
                    className="rounded-full bg-[#eef1f6] px-5 py-1.5 text-[12px] font-medium text-brand-blue hover:bg-[#e2e7f0]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EventDetailSheet name={openEvent} onClose={() => setOpenEvent(null)} />
    </div>
  );
}

/** Event detail slide-over (Events-tab View). "Overview of Event". */
function EventDetailSheet({
  name,
  onClose,
}: {
  name: string | null;
  onClose(): void;
}) {
  return (
    <Dialog.Root open={!!name} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col gap-5 overflow-y-auto bg-white px-7 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-end">
            <Dialog.Close aria-label="Close">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </span>
            </Dialog.Close>
          </div>

          <div>
            <p className="text-[12px] text-brand-gray-500">Overview of Event</p>
            <Dialog.Title className="text-[22px] font-bold text-brand-blue">
              {name ?? (USE_LIVE_API ? '—' : 'Midweek Recharge')}
            </Dialog.Title>
            <p className="mt-1 flex items-center gap-2 text-[12px] text-brand-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-brand-blue" /> Upcoming
                Event
              </span>
              {USE_LIVE_API ? '' : ' · Host: Pst John'}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <DetailRow
              icon={CalendarClock}
              label="Date & Time"
              value={USE_LIVE_API ? '—' : 'Wednesday, February 21, 2025 · 6:00 PM – 7:30 PM'}
            />
            <DetailRow
              icon={Users}
              label="Event Type"
              value={USE_LIVE_API ? '—' : 'Online & Onsite (Hybrid) · Registration Required'}
            />
            <DetailRow
              icon={Globe}
              label="Location"
              value={USE_LIVE_API ? '—' : 'Celebration Church International Main Auditorium, Lekki Lagos'}
            />
          </div>

          <div>
            <p className="text-[13px] font-semibold">Event summary</p>
            <p className="mt-1 text-[13px] text-brand-gray-500">
              {USE_LIVE_API ? '—' : 'Midweek Recharge is a refreshing midweek gathering designed to strengthen your faith, renew your spirit, and equip you for the rest of the week.'}
            </p>
          </div>

          <div className="mt-auto pt-2">
            <Button size="lg" className="h-[52px] w-full">
              Edit Event
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Billing tab — the "Billing" table from the design (Invoice ID / Plan /
 * Amount / Payment Method / Status / Start Date / End Date / Auto-Renew +
 * View). View opens a Billing Payment Receipt slide-over — follow-up.
 */
type InvoiceRow = { status: string; renew: string; id?: string; plan?: string; amount?: string; method?: string; start?: string; end?: string };

const INVOICES: InvoiceRow[] = [
  { status: 'Paid', renew: 'On' },
  { status: 'Failed', renew: 'Off' },
  { status: 'Paid', renew: 'On' },
  { status: 'Paid', renew: 'On' },
];

function BillingTab({ id }: { id: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(USE_LIVE_API ? [] : INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    tryGetTenantResource(id, 'billing/invoices')
      .then((data) => {
        if (!data) return;
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: InvoiceRow[] = arr.map((inv) => {
          const rawStatus = String(inv['status'] ?? 'Paid');
          const s = rawStatus.toUpperCase();
          const status = s.includes('FAIL') || s.includes('UNPAID') ? 'Failed' : 'Paid';
          const autoRenew = inv['autoRenew'] ?? inv['autoRenewal'] ?? inv['recurring'];
          const renew = autoRenew === false || String(autoRenew).toUpperCase() === 'FALSE' || String(autoRenew).toUpperCase() === 'OFF' ? 'Off' : 'On';
          const rawAmt = Number(inv['amount'] ?? inv['totalAmount'] ?? 0);
          const fmtDate = (raw: string) => raw ? new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          return {
            status,
            renew,
            id: String(inv['invoiceId'] ?? inv['id'] ?? 'RN-13234'),
            plan: String(inv['planName'] ?? inv['plan'] ?? 'Growth (Monthly)'),
            amount: rawAmt ? `$${rawAmt.toLocaleString()}` : '$600',
            method: String(inv['paymentMethod'] ?? inv['method'] ?? 'Card (Visa •••• 4832)'),
            start: fmtDate(String(inv['startDate'] ?? inv['billingStart'] ?? '')),
            end: fmtDate(String(inv['endDate'] ?? inv['billingEnd'] ?? '')),
          };
        });
        if (mapped.length > 0) setInvoices(mapped);
      })
      .catch(() => {});
  }, [id]);
  return (
    <div className="mt-6 rounded-[14px] bg-[#f7f9fc] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-brand-blue">Billing</h2>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2">
          <Search className="size-4 text-brand-gray-500" />
          <input
            placeholder="Search"
            className="bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {[
                'Invoice ID',
                'Plan',
                'Amount',
                'Payment Method',
                'Status',
                'Start Date',
                'End Date',
                'Auto-Renew',
                'Action',
              ].map((h) => (
                <th key={h} className="py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr
                key={i}
                className="border-t border-[#eef0f4] text-[13px] text-[#333]"
              >
                <td className="py-4 font-medium">{inv.id ?? 'RN-13234'}</td>
                <td className="py-4">{inv.plan ?? 'Growth (Monthly)'}</td>
                <td className="py-4">{inv.amount ?? '$600'}</td>
                <td className="py-4">{inv.method ?? 'Card (Visa •••• 4832)'}</td>
                <td
                  className={cn(
                    'py-4 font-medium',
                    inv.status === 'Paid' ? 'text-[#22a45d]' : 'text-[#eb0000]'
                  )}
                >
                  {inv.status}
                </td>
                <td className="py-4">{inv.start ?? 'Aug 31, 2025'}</td>
                <td className="py-4">{inv.end ?? 'Aug 31, 2025'}</td>
                <td className="py-4">{inv.renew}</td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="rounded-full bg-[#eef1f6] px-5 py-1.5 text-[12px] font-medium text-brand-blue hover:bg-[#e2e7f0]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BillingReceiptSheet
        open={!!selectedInvoice}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

/** Billing Payment Receipt slide-over (Billing-tab View). */
function BillingReceiptSheet({
  open,
  invoice,
  onClose,
}: {
  open: boolean;
  invoice: InvoiceRow | null;
  onClose(): void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col gap-5 overflow-y-auto bg-white px-7 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-end">
            <Dialog.Close aria-label="Close">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </span>
            </Dialog.Close>
          </div>

          <Dialog.Title className="text-[20px] font-bold text-brand-blue">
            Billing Payment Receipt
          </Dialog.Title>

          <div>
            <p className="text-[13px] font-semibold">Plan Details:</p>
            <div className="mt-2 flex flex-col gap-3">
              <ReceiptRow label="Plan" value={invoice?.plan ?? 'Growth Plan'} />
              <ReceiptRow label="Billing Cycle" value="Monthly" />
              <ReceiptRow label="Start Date" value={invoice?.start ?? '—'} />
              <ReceiptRow label="Expiry Date" value={invoice?.end ?? '—'} />
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold">Payment Summary:</p>
            <div className="mt-2 flex flex-col gap-3">
              <ReceiptRow label={invoice?.plan ?? 'Growth Plan'} value={invoice?.amount ?? '—'} />
              <ReceiptRow label="Subtotal" value={invoice?.amount ?? '—'} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#f6f8fb] px-4 py-3">
            <span className="text-[14px] font-semibold">Total Paid:</span>
            <span className="text-[14px] font-bold">{invoice?.amount ?? '—'}</span>
          </div>

          <ReceiptRow
            label="Payment Method"
            value={invoice?.method ?? '—'}
          />

          <div className="mt-auto pt-2">
            <Button size="lg" className="h-[52px] w-full">
              Download receipt
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f6f8fb]">
        <Icon className="size-4 text-brand-gray-500" />
      </span>
      <div>
        <p className="text-[12px] text-brand-gray-500">{label}</p>
        <p className="text-[15px] font-semibold text-[#222]">{value}</p>
      </div>
    </div>
  );
}
