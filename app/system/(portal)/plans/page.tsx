'use client';

import { StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Check, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import {
  getSystemBillingPlans,
  getSystemSubscriptions,
  getSystemTenantSubscription,
  getSystemTenantSubscriptionLifecycle,
  getSystemTenants,
  type SystemSubscription,
} from '@/lib/api/system';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

type Plan = {
  id: string;
  name: string;
  price: string;
  cycle: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};


const TABS = ['Plan', 'Feature', 'Subscriptions'];

type SubRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  status: string;
  inTrial: boolean;
  autoRenew: boolean;
  currentPeriodEnd?: string;
  nextBillingAt?: string;
};

const SUB_STATUS_CLS: Record<string, string> = {
  ACTIVE:    'bg-[#eafaf0] text-[#22a45d]',
  TRIAL:     'bg-[#e9f0ff] text-brand-blue',
  PAST_DUE:  'bg-[#fff4e5] text-[#ff8d28]',
  SUSPENDED: 'bg-[#fde8e8] text-[#eb0000]',
  EXPIRED:   'bg-[#f2f2f2] text-brand-gray-500',
  CANCELLED: 'bg-[#f2f2f2] text-brand-gray-500',
};

function SubStatusBadge({ status }: { status: string }) {
  const cls = SUB_STATUS_CLS[status.toUpperCase()] ?? 'bg-[#f2f2f2] text-brand-gray-500';
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium capitalize', cls)}>
      {status.toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function PlanCard({ plan }: { plan: Plan }) {
  const hi = plan.highlight;
  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 rounded-[14px] p-6',
        hi ? 'bg-brand-blue text-white' : 'border border-[#ededed] bg-white'
      )}
    >
      <Link
        href={`/system/plans/${plan.id}/edit`}
        aria-label={`Edit ${plan.name}`}
        className={cn(
          'absolute right-5 top-5 flex size-8 items-center justify-center rounded-full transition-colors',
          hi ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-[#f2f2f2] text-[#333] hover:bg-[#e6e6e6]'
        )}
      >
        <Pencil className="size-3.5" />
      </Link>

      <p className={cn('text-[15px] font-medium', hi ? 'text-white/80' : 'text-brand-gray-500')}>
        {plan.name}
      </p>

      <p className="text-[30px] font-bold leading-none">
        {plan.price}
        <span className={cn('text-[13px] font-normal', hi ? 'text-white/70' : 'text-brand-gray-500')}>
          {' '}
          {plan.cycle}
        </span>
      </p>

      <p className={cn('text-[12px]', hi ? 'text-white/80' : 'text-brand-gray-500')}>
        {plan.blurb}
      </p>

      <div className={cn('h-px w-full', hi ? 'bg-white/20' : 'bg-[#ededed]')} />

      <p className="text-[13px] font-semibold">Features You&apos;ll Love:</p>
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px]">
            <Check
              className={cn(
                'mt-0.5 size-3.5 shrink-0',
                hi ? 'text-white' : 'text-[#34a853]'
              )}
            />
            <span className={hi ? 'text-white/90' : 'text-[#333]'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** System → Plans & Billing (board 778:38441). */
export default function SystemPlansPage() {
  const [tab, setTab] = useState(0);
  const [revenue, setRevenue] = useState('$0');
  const [overdue, setOverdue] = useState('$0');
  const [pendingPayments, setPendingPayments] = useState('$0');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscriptions tab state
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subPage, setSubPage] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subFilter, setSubFilter] = useState('All');
  const [subSelected, setSubSelected] = useState<SubRow | null>(null);
  const [subDetail, setSubDetail] = useState<SystemSubscription | null>(null);
  const [subLifecycle, setSubLifecycle] = useState<Record<string, unknown>[] | null>(null);
  const [subDetailLoading, setSubDetailLoading] = useState(false);

  useEffect(() => {
    // /system/billing/stats not in backend API — disabled.

    getSystemBillingPlans()
      .then((arr) => {
        const mapped: Plan[] = arr.map((p, i) => {
          const featureRaw = p.features;
          const features: string[] = Array.isArray(featureRaw) ? featureRaw : [];
          const priceNum = Number(p.price ?? 0);
          const price = priceNum
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(priceNum)
            : '$0';
          const cycleRaw = String(p.billingCycle ?? 'monthly').toLowerCase();
          const cycle = cycleRaw.startsWith('/') ? cycleRaw : `/${cycleRaw}`;
          return {
            id: String(p.id ?? p.planId ?? p.code ?? i + 1),
            name: String(p.name ?? ''),
            price,
            cycle,
            blurb: String(p.description ?? ''),
            features,
            highlight: i === 1,
          };
        }).filter((p) => p.name);
        setPlans(mapped);
      })
      .catch(() => { toast.error('Could not load plans.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 2) return;
    setSubsLoading(true);
    const status = subFilter === 'All' ? undefined : subFilter;
    Promise.all([
      getSystemSubscriptions(subPage, 25, status),
      getSystemTenants(0, 100),
    ])
      .then(([page, tenants]) => {
        const tenantMap: Record<string, string> = {};
        for (const t of tenants) {
          if (t.id) tenantMap[t.id] = t.name ?? t.slug ?? t.id;
        }
        setSubTotalPages(page.totalPages ?? 1);
        const content = page.content ?? [];
        setSubs(content.map((s) => ({
          id:              String(s.id ?? s.tenantId ?? ''),
          tenantId:        String(s.tenantId ?? ''),
          tenantName:      s.tenantId ? (tenantMap[s.tenantId] ?? s.tenantId) : '—',
          status:          String(s.status ?? 'UNKNOWN').toUpperCase(),
          inTrial:         !!s.inTrial,
          autoRenew:       !!s.autoRenewEnabled,
          currentPeriodEnd: s.currentPeriodEnd,
          nextBillingAt:   s.nextBillingAt,
        })));
      })
      .catch(() => { toast.error('Could not load subscriptions.'); })
      .finally(() => setSubsLoading(false));
  }, [tab, subPage, subFilter]);

  function openSubDetail(row: SubRow) {
    setSubSelected(row);
    setSubDetail(null);
    setSubLifecycle(null);
    setSubDetailLoading(true);
    Promise.all([
      getSystemTenantSubscription(row.tenantId),
      getSystemTenantSubscriptionLifecycle(row.tenantId),
    ])
      .then(([sub, lc]) => {
        setSubDetail(sub);
        const lcArr = Array.isArray(lc) ? (lc as Record<string, unknown>[])
          : Array.isArray((lc as Record<string, unknown>)?.['content'])
            ? ((lc as Record<string, unknown>)['content'] as Record<string, unknown>[])
            : lc ? [lc as Record<string, unknown>] : [];
        setSubLifecycle(lcArr);
      })
      .catch(() => { toast.error('Could not load subscription detail.'); })
      .finally(() => setSubDetailLoading(false));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Plans &amp; Billing</h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          Manage subscription plans and billing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Revenue (This Month)"
          value={revenue}
          variant="blue"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          variant="green"
        />
        <StatCard
          title="Overdue Amount"
          value={overdue}
          variant="white"
        />
      </div>

      <div className="rounded-[14px] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-full bg-[#f2f2f2] p-1 text-[12px]">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={cn(
                  'rounded-full px-5 py-1.5 transition-colors',
                  i === tab ? 'bg-brand-blue text-white' : 'text-brand-gray-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <Link
            href="/system/plans/create"
            className="flex h-10 items-center gap-2 rounded-[8px] bg-[#22a45d] px-4 text-[13px] font-medium text-white no-underline transition-colors hover:bg-[#1c8c4f]"
          >
            <Plus className="size-4" />
            Add Plan
          </Link>
        </div>

        {tab === 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-3 py-8 text-center text-[13px] text-brand-gray-400">Loading plans…</p>
            ) : plans.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-[13px] text-brand-gray-400">No subscription plans found.</p>
            ) : plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        ) : tab === 1 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-[#f7f9fc] text-left text-[13px] text-[#333]">
                  <th className="rounded-l-[8px] px-3 py-3 font-medium">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-3 py-3 text-center font-medium last:rounded-r-[8px]">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(plans.flatMap((p) => p.features))].map((f) => (
                  <tr key={f} className="border-t border-[#f2f2f2] text-[12px]">
                    <td className="px-3 py-3">{f}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-3 py-3 text-center">
                        {p.features.includes(f) ? (
                          <Check className="mx-auto size-4 text-[#34a853]" />
                        ) : (
                          <span className="text-brand-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Subscriptions tab */
          <div className="mt-6">
            {/* Status filter pills */}
            <div className="mb-4 flex flex-wrap gap-2">
              {['All', 'ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSubFilter(s); setSubPage(0); }}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                    subFilter === s
                      ? 'bg-brand-blue text-white'
                      : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
                  )}
                >
                  {s === 'All' ? 'All' : s.toLowerCase().replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {subsLoading ? (
              <p className="py-10 text-center text-[13px] text-brand-gray-400">Loading subscriptions…</p>
            ) : subs.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-brand-gray-400">No subscriptions found.</p>
            ) : (
              <div className="overflow-x-auto rounded-[10px] border border-[#f0f0f0]">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#f7f9fc] text-left text-[12px] text-brand-gray-500">
                      <th className="px-4 py-3 font-medium">Church</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Trial</th>
                      <th className="px-4 py-3 font-medium">Auto-renew</th>
                      <th className="px-4 py-3 font-medium">Period ends</th>
                      <th className="px-4 py-3 font-medium">Next billing</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((row) => (
                      <tr key={row.id} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">
                        <td className="px-4 py-3 font-medium text-[#333]">{row.tenantName}</td>
                        <td className="px-4 py-3"><SubStatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-brand-gray-500">{row.inTrial ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-brand-gray-500">{row.autoRenew ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-brand-gray-500">{fmtDate(row.currentPeriodEnd)}</td>
                        <td className="px-4 py-3 text-brand-gray-500">{fmtDate(row.nextBillingAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openSubDetail(row)}
                            className="rounded-[6px] bg-[#f2f2f2] px-3 py-1.5 text-[11px] font-medium text-[#333] hover:bg-[#e6e6e6]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {subTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={subPage === 0}
                  onClick={() => setSubPage((p) => Math.max(0, p - 1))}
                  className="rounded-[6px] border border-[#e0e0e0] px-3 py-1.5 text-[12px] disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-[12px] text-brand-gray-500">
                  Page {subPage + 1} of {subTotalPages}
                </span>
                <button
                  type="button"
                  disabled={subPage >= subTotalPages - 1}
                  onClick={() => setSubPage((p) => p + 1)}
                  className="rounded-[6px] border border-[#e0e0e0] px-3 py-1.5 text-[12px] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription detail modal */}
      <Dialog.Root open={!!subSelected} onOpenChange={(open) => { if (!open) setSubSelected(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <Dialog.Title className="text-[17px] font-semibold text-[#111]">
                {subSelected?.tenantName ?? 'Subscription'}
              </Dialog.Title>
              <Dialog.Close className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#333] hover:bg-[#e6e6e6]">
                <X className="size-4" />
              </Dialog.Close>
            </div>

            {subDetailLoading ? (
              <p className="py-6 text-center text-[13px] text-brand-gray-400">Loading…</p>
            ) : subDetail ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  {([
                    ['Status', <SubStatusBadge key="s" status={subDetail.status ?? 'UNKNOWN'} />],
                    ['Trial', subDetail.inTrial ? 'Yes' : 'No'],
                    ['Auto-renew', subDetail.autoRenewEnabled ? 'Yes' : 'No'],
                    ['Period start', fmtDate(subDetail.currentPeriodStart)],
                    ['Period end', fmtDate(subDetail.currentPeriodEnd)],
                    ['Next billing', fmtDate(subDetail.nextBillingAt)],
                    ['Trial started', fmtDate(subDetail.trialStartedAt)],
                    ['Trial ends', fmtDate(subDetail.trialEndsAt)],
                    ['Past due at', fmtDate(subDetail.pastDueAt)],
                    ['Grace period ends', fmtDate(subDetail.gracePeriodEndsAt)],
                    ['Suspended at', fmtDate(subDetail.suspendedAt)],
                    ['Expired at', fmtDate(subDetail.expiredAt)],
                    ['Cancelled at', fmtDate(subDetail.canceledAt)],
                  ] as [string, React.ReactNode][]).map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-brand-gray-400">{label}</span>
                      <span className="font-medium text-[#333]">{value}</span>
                    </div>
                  ))}
                </div>

                {subLifecycle && subLifecycle.length > 0 && (
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-[#111]">Lifecycle events</p>
                    <div className="max-h-48 overflow-y-auto rounded-[8px] border border-[#f0f0f0]">
                      {subLifecycle.map((ev, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-[#f0f0f0] px-3 py-2 last:border-0 text-[12px]">
                          <span className="font-medium text-[#333]">{String(ev['event'] ?? ev['type'] ?? ev['action'] ?? 'Event')}</span>
                          <span className="text-brand-gray-400">{fmtDate(String(ev['occurredAt'] ?? ev['createdAt'] ?? ev['timestamp'] ?? ''))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-brand-gray-400">No subscription data.</p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
