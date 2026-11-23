'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSystemTenant,
  getSystemTenantPaymentGateways,
  assignSystemTenantPaymentGateways,
  setSystemTenantGatewayActive,
  setSystemTenantPrimaryGateway,
  getSystemPaymentGateways,
  updateSystemTenantMerchantAccount,
  suspendSystemTenant,
  softDeleteSystemTenant,
  getSystemTenantManagement,
  reissueSystemTenantInvitation,
  activateSystemTenant,
  getSystemTenantSubscription,
  getSystemTenantSubscriptionLifecycle,
  getSystemTenantDomainReactivation,
  approveSystemTenantDomainReactivation,
  getSystemTenantMerchantAccount,
  type SystemTenant,
  type TenantPaymentGatewayAssignment,
  type SystemPaymentGateway,
  type SystemTenantManagementResponse,
} from '@/lib/api/system';
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
import { toast } from 'sonner';

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
  'Management',
  'Members',
  'Giving',
  'Groups',
  'Events',
  'Billing',
  'Subscription',
  'Domain',
  'Media',
] as const;
type Tab = (typeof TABS)[number];

function GatewayAssignPanel({ tenantId, onAssigned }: { tenantId: string; onAssigned: () => void }) {
  const [available, setAvailable] = useState<SystemPaymentGateway[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    getSystemPaymentGateways().then(setAvailable).catch(() => {});
  }, [open]);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setAssigning(true);
    try {
      await assignSystemTenantPaymentGateways(tenantId, { gatewayCodes: selected });
      toast.success('Gateways assigned.');
      setOpen(false);
      setSelected([]);
      onAssigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[#f2f2f2] pt-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-[13px] font-medium text-brand-blue hover:opacity-70">
          + Assign Gateway
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold">Assign Payment Gateways</p>
          <div className="flex flex-wrap gap-2">
            {available.map((gw) => {
              const gwId = String(gw.id ?? '');
              const on = selected.includes(gwId);
              return (
                <button
                  key={gwId}
                  type="button"
                  onClick={() => setSelected((p) => on ? p.filter((x) => x !== gwId) : [...p, gwId])}
                  className={cn('rounded-[6px] border px-3 py-1.5 text-[12px] transition-colors', on ? 'border-brand-blue bg-[#e9f0ff] text-brand-blue' : 'border-[#ddd] text-[#333] hover:bg-[#f5f5f5]')}
                >
                  {gw.displayName ?? gw.gatewayType ?? gwId}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setOpen(false); setSelected([]); }} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
            <button type="button" disabled={assigning || selected.length === 0} onClick={() => void handleAssign()} className="flex h-[36px] items-center gap-1 rounded-[7px] bg-brand-blue px-4 text-[13px] font-medium text-white disabled:opacity-50">
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildStats(t: SystemTenant) {
  return [
    { label: 'Admin Users', value: t.adminUsers != null ? String(t.adminUsers) : '—', bg: 'bg-[#f6f8fb]' },
    { label: 'Church Members', value: t.members ? String(t.members) : '—', bg: 'bg-[#eafaf0]' },
    { label: 'Total Giving', value: t.totalGiving || '—', bg: 'bg-[#e9f7f5]' },
    { label: 'Current Plan', value: t.plan || '—', bg: 'bg-[#eef2fb]' },
  ];
}

type PaymentGateway = TenantPaymentGatewayAssignment & {
  id: string;
  gatewayType: string;
  displayName: string;
  active: boolean;
  primaryGateway: boolean;
  allowCustomerCheckout: boolean;
  allowSubscriptionBilling: boolean;
};

export function TenantDetail({ id }: { id: string }) {
  const router = useRouter();
  const back = '/system/tenants';
  const [tab, setTab] = useState<Tab>('Overview');
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const [tenant, setTenant] = useState<SystemTenant>(
    { id: '', name: '', domain: '', status: 'Active', plan: '', members: 0, createdAt: '' }
  );
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [suspending, setSuspending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const stats = buildStats(tenant);

  useEffect(() => {
    getSystemTenant(id).then((t: SystemTenant | null) => { if (t) setTenant(t); }).catch(() => {});
    getSystemTenantPaymentGateways(id)
      .then((data) => {
        const mapped: PaymentGateway[] = data.map((g) => ({
          ...g,
          id:                     String(g.id ?? ''),
          gatewayType:            String(g.gatewayType ?? ''),
          displayName:            String(g.displayName ?? g.gatewayType ?? ''),
          active:                 Boolean(g.active),
          primaryGateway:         Boolean(g.primaryGateway),
          allowCustomerCheckout:  Boolean(g.allowCustomerCheckout),
          allowSubscriptionBilling: Boolean(g.allowSubscriptionBilling),
        }));
        setGateways(mapped);
      })
      .catch(() => {});
  }, [id]);

  const handleSuspend = async () => {
    setMenu(false);
    setSuspending(true);
    try {
      await suspendSystemTenant(id);
      setTenant((prev) => ({ ...prev, status: 'Suspended' }));
      toast.success('Tenant suspended');
    } catch {
      toast.error('Failed to suspend tenant');
    } finally {
      setSuspending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await softDeleteSystemTenant(id);
      toast.success('Tenant deleted');
      router.push(back);
    } catch {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
      setDel(false);
    }
  };

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
                onClick={handleSuspend}
                disabled={suspending}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#ff8d28] hover:bg-[#fff7ef] disabled:opacity-50"
              >
                <Ban className="size-4" />
                {suspending ? 'Suspending…' : 'Suspend'}
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
              <DetailRow icon={Mail} label="Email" value={tenant.email ?? '—'} />
              <DetailRow icon={Phone} label="Phone" value={tenant.phone ?? '—'} />
              <DetailRow icon={Globe} label="Custom Domain" value={tenant.domain || '—'} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#eee] p-6">
            <h2 className="text-[18px] font-bold">Account Details</h2>
            <div className="mt-5 flex flex-col gap-5">
              <DetailRow icon={Tag} label="Slug" value={tenant.slug || tenant.id || '—'} />
              <DetailRow icon={CalendarDays} label="Created" value={tenant.createdAt || '—'} />
              <DetailRow icon={CalendarDays} label="Last Active" value={tenant.lastActive ?? '—'} />
            </div>
          </div>

          {gateways.length > 0 && (
            <div className="rounded-[14px] border border-[#eee] p-6 lg:col-span-2">
              <h2 className="text-[18px] font-bold">Payment Gateways</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-[#f2f2f2] text-left text-brand-gray-500">
                      {['Gateway', 'Status', 'Primary', 'Checkout', 'Billing', 'Actions'].map((h) => (
                        <th key={h} className="pb-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gateways.map((g) => (
                      <tr key={g.id} className="border-b border-[#f2f2f2]">
                        <td className="py-3 font-medium">{g.displayName}</td>
                        <td className={cn('py-3 font-medium', g.active ? 'text-[#34a853]' : 'text-brand-gray-400')}>
                          {g.active ? 'Active' : 'Inactive'}
                        </td>
                        <td className="py-3">{g.primaryGateway ? 'Yes' : 'No'}</td>
                        <td className="py-3">{g.allowCustomerCheckout ? 'Yes' : 'No'}</td>
                        <td className="py-3">{g.allowSubscriptionBilling ? 'Yes' : 'No'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await setSystemTenantGatewayActive(id, g.id, !g.active);
                                  setGateways((prev) => prev.map((x) => x.id === g.id ? { ...x, active: !g.active } : x));
                                  toast.success(`Gateway ${g.active ? 'deactivated' : 'activated'}.`);
                                } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed.'); }
                              }}
                              className="text-brand-blue hover:opacity-70"
                            >
                              {g.active ? 'Deactivate' : 'Activate'}
                            </button>
                            {!g.primaryGateway && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await setSystemTenantPrimaryGateway(id, g.id);
                                    setGateways((prev) => prev.map((x) => ({ ...x, primaryGateway: x.id === g.id })));
                                    toast.success('Primary gateway set.');
                                  } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed.'); }
                                }}
                                className="text-brand-gray-500 hover:opacity-70"
                              >
                                Set Primary
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <GatewayAssignPanel tenantId={id} onAssigned={() => {
                getSystemTenantPaymentGateways(id).then((data) => {
                  const mapped: PaymentGateway[] = data.map((g) => ({
                    ...g, id: String(g.id ?? ''), gatewayType: String(g.gatewayType ?? ''),
                    displayName: String(g.displayName ?? g.gatewayType ?? ''), active: Boolean(g.active),
                    primaryGateway: Boolean(g.primaryGateway), allowCustomerCheckout: Boolean(g.allowCustomerCheckout),
                    allowSubscriptionBilling: Boolean(g.allowSubscriptionBilling),
                  }));
                  setGateways(mapped);
                }).catch(() => {});
              }} />
            </div>
          )}
        </div>
      ) : tab === 'Management' ? (
        <ManagementTab id={id} />
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
      ) : tab === 'Subscription' ? (
        <SystemSubscriptionTab id={id} />
      ) : tab === 'Domain' ? (
        <DomainTab id={id} />
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
        onConfirm={handleDelete}
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


async function tryGetTenantResource(_id: string, _sub: string): Promise<unknown> {
  return null;
}

function ManagementTab({ id }: { id: string }) {
  const [data, setData] = useState<SystemTenantManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reissuing, setReissuing] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    getSystemTenantManagement(id).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleReissue = async () => {
    setReissuing(true);
    try {
      await reissueSystemTenantInvitation(id);
      toast.success('Invitation reissued.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reissue invitation.');
    } finally {
      setReissuing(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateSystemTenant(id);
      toast.success('Tenant activated.');
      if (data) setData({ ...data, tenant: { ...data.tenant, status: 'ACTIVE', active: true } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not activate tenant.');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return <div className="mt-6 flex justify-center py-10 text-[13px] text-brand-gray-400">Loading…</div>;
  }

  if (!data) {
    return <div className="mt-6 rounded-[14px] border border-[#eee] p-6 text-[13px] text-brand-gray-400">No management data available.</div>;
  }

  const { tenant: t, administrator: admin } = data;

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="rounded-[14px] border border-[#eee] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Tenant Details</h2>
          <div className="flex gap-2">
            {!t.active && (
              <Button size="sm" onClick={() => void handleActivate()} disabled={activating} className="gap-1.5">
                {activating ? 'Activating…' : 'Activate Tenant'}
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Name', value: t.name },
            { label: 'Short Name', value: t.shortName ?? '—' },
            { label: 'Legal Name', value: t.legalName ?? '—' },
            { label: 'Slug', value: t.slug },
            { label: 'Status', value: t.status },
            { label: 'Billing Email', value: t.billingEmail ?? '—' },
            { label: 'Country', value: t.countryCode ?? '—' },
            { label: 'Currency', value: t.currency ?? '—' },
            { label: 'Custom Domain', value: t.customDomain ?? '—' },
            { label: 'Domain Verified', value: t.customDomainVerified ? 'Yes' : 'No' },
            { label: 'Last Activity', value: t.lastActivityAt ? new Date(t.lastActivityAt).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-brand-gray-500">{label}</span>
              <span className="text-[13px] font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-[#eee] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Administrator</h2>
          {data.canReissueInvitation && (
            <Button size="sm" variant="outline" onClick={() => void handleReissue()} disabled={reissuing} className="gap-1.5">
              {reissuing ? 'Sending…' : 'Reissue Invitation'}
            </Button>
          )}
        </div>
        {admin ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Display Name', value: admin.displayName ?? '—' },
              { label: 'Email', value: admin.email },
              { label: 'Status', value: admin.status },
              { label: 'First Login Required', value: admin.firstLoginRequired ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-brand-gray-500">{label}</span>
                <span className="text-[13px] font-medium">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-brand-gray-400">No administrator assigned.</p>
        )}
        {!data.canReissueInvitation && data.reissueUnavailableReason && (
          <p className="mt-3 text-[12px] text-brand-gray-400">{data.reissueUnavailableReason}</p>
        )}
      </div>
    </div>
  );
}

function SystemSubscriptionTab({ id }: { id: string }) {
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [lifecycle, setLifecycle] = useState<Record<string, unknown> | null>(null);
  const [merchant, setMerchant] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSystemTenantSubscription(id).catch(() => null),
      getSystemTenantSubscriptionLifecycle(id).catch(() => null),
      getSystemTenantMerchantAccount(id).catch(() => null),
    ])
      .then(([s, lc, m]) => {
        if (s) setSub(s as Record<string, unknown>);
        if (lc) setLifecycle(lc);
        if (m) setMerchant(m);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mt-6 flex justify-center py-10 text-[13px] text-brand-gray-400">Loading…</div>;

  const renderKV = (data: Record<string, unknown>, title: string) => (
    <div className="rounded-[14px] border border-[#eee] p-6">
      <h2 className="mb-4 text-[18px] font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
        {Object.entries(data)
          .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
          .map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-medium">{String(v)}</span>
            </div>
          ))}
      </div>
    </div>
  );

  const handleUpdateMerchant = async (payload: Record<string, unknown>) => {
    try {
      await updateSystemTenantMerchantAccount(id, payload);
      toast.success('Merchant account updated.');
      getSystemTenantMerchantAccount(id).then((m) => { if (m) setMerchant(m); }).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      {sub ? renderKV(sub, 'Subscription') : <p className="text-[13px] text-brand-gray-400">No subscription data.</p>}
      {lifecycle && renderKV(lifecycle, 'Subscription Lifecycle')}
      {merchant ? (
        <MerchantAccountEditor merchant={merchant} onSave={handleUpdateMerchant} />
      ) : (
        <p className="text-[13px] text-brand-gray-400">No merchant account data.</p>
      )}
    </div>
  );
}

function MerchantAccountEditor({ merchant, onSave }: { merchant: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const stringFields = Object.entries(merchant)
    .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
    .map(([k]) => k);

  useEffect(() => {
    const f: Record<string, string> = {};
    stringFields.forEach((k) => { f[k] = String(merchant[k] ?? ''); });
    setForm(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-[#eee] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Merchant Account</h2>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-medium text-brand-blue hover:opacity-70">Edit</button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {stringFields.map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  value={form[k] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  className="h-[36px] rounded-[6px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => setEditing(false)} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex h-[38px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
          {stringFields.map((k) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-medium">{String(merchant[k])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DomainTab({ id }: { id: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    getSystemTenantDomainReactivation(id).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveSystemTenantDomainReactivation(id);
      toast.success('Domain reactivation approved.');
      const updated = await getSystemTenantDomainReactivation(id);
      setData(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not approve reactivation.');
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div className="mt-6 flex justify-center py-10 text-[13px] text-brand-gray-400">Loading…</div>;

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-6 rounded-[14px] border border-[#eee] p-6">
        <p className="text-[13px] text-brand-gray-400">No domain reactivation request pending.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[14px] border border-[#eee] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Domain Reactivation</h2>
        <Button size="sm" onClick={() => void handleApprove()} disabled={approving}>
          {approving ? 'Approving…' : 'Approve Reactivation'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
        {Object.entries(data)
          .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
          .map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-medium">{String(v)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function MembersTab({ id }: { id: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [sub, setSub] = useState<'All Member' | 'Active' | 'Inactive'>('All Member');
  const [openMember, setOpenMember] = useState<string | null>(null);

  useEffect(() => {
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
        setMembers(mapped);
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
                <td className="py-4 font-medium">{m.name || '—'}</td>
                <td className="py-4">{m.phone || '—'}</td>
                <td className="py-4">{m.email || '—'}</td>
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
                {name ?? '—'}
              </p>
              <p className="text-[12px] text-brand-gray-500">—</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h3 className="text-[15px] font-bold">Member Details</h3>
            <DetailRow icon={Users} label="Active Groups" value="—" />
            <DetailRow icon={CalendarClock} label="Last Attendance Date" value="—" />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f6f8fb]">
                <TrendingUp className="size-4 text-brand-gray-500" />
              </span>
              <div className="w-full">
                <p className="text-[12px] text-brand-gray-500">Attendance Rate</p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#eef0f4]">
                  <div className="h-full rounded-full bg-[#22a45d] w-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#eee] p-4">
            <p className="text-[13px] font-semibold">Notes for follow-up</p>
            <p className="mt-1 text-[13px] text-[#333]">—</p>
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


const TXN_STATUS: Record<string, string> = {
  Pending: 'text-[#ff8d28]',
  Success: 'text-[#22a45d]',
  Failed: 'text-[#eb0000]',
};

function GivingTab({ id, tenantName }: { id: string; tenantName: string }) {
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [sub, setSub] = useState<'Non Member' | 'Member'>('Non Member');
  const [receipt, setReceipt] = useState<{ failed: boolean; row?: TxnRow } | null>(null);

  useEffect(() => {
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
        setTransactions(mapped);
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
                <td className="py-4 font-medium">{t.name ?? '—'}</td>
                <td className={cn('py-4 font-medium', TXN_STATUS[t.status] ?? 'text-[#ff8d28]')}>
                  {t.status}
                </td>
                <td className="py-4">{t.date ?? '—'}</td>
                <td className="py-4">{t.amount}</td>
                <td className="py-4">{t.method ?? '—'}</td>
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
            <p className="text-[13px] font-semibold">{tenantName ?? '—'}</p>
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
            <ReceiptRow label="Donation Date" value={row?.date ?? '—'} />
            <ReceiptRow label="Amount Given" value={row?.amount ?? '—'} />
            <ReceiptRow label="Fund / Campaign" value={row?.type ?? '—'} />
            <ReceiptRow label="Donation Type" value="—" />
            <ReceiptRow label="Payment Method" value={row?.method ?? '—'} />
            <ReceiptRow label="Transaction ID" value={row?.id || '—'} />
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


function GroupsTab({ id }: { id: string }) {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [openGroup, setOpenGroup] = useState<GroupRow | null>(null);

  useEffect(() => {
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
        setGroups(mapped);
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


const EVENT_STATUS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#22a45d]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
};

function EventsTab({ id }: { id: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  useEffect(() => {
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
        setEvents(mapped);
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
              {name ?? '—'}
            </Dialog.Title>
            <p className="mt-1 flex items-center gap-2 text-[12px] text-brand-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-brand-blue" /> Upcoming Event
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <DetailRow icon={CalendarClock} label="Date & Time" value="—" />
            <DetailRow icon={Users} label="Event Type" value="—" />
            <DetailRow icon={Globe} label="Location" value="—" />
          </div>

          <div>
            <p className="text-[13px] font-semibold">Event summary</p>
            <p className="mt-1 text-[13px] text-brand-gray-500">—</p>
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


function BillingTab({ id }: { id: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);

  useEffect(() => {
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
            id: String(inv['invoiceId'] ?? inv['id'] ?? ''),
            plan: String(inv['planName'] ?? inv['plan'] ?? ''),
            amount: rawAmt ? `$${rawAmt.toLocaleString()}` : '',
            method: String(inv['paymentMethod'] ?? inv['method'] ?? ''),
            start: fmtDate(String(inv['startDate'] ?? inv['billingStart'] ?? '')),
            end: fmtDate(String(inv['endDate'] ?? inv['billingEnd'] ?? '')),
          };
        });
        setInvoices(mapped);
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
                <td className="py-4 font-medium">{inv.id ?? '—'}</td>
                <td className="py-4">{inv.plan ?? '—'}</td>
                <td className="py-4">{inv.amount ?? '—'}</td>
                <td className="py-4">{inv.method ?? '—'}</td>
                <td
                  className={cn(
                    'py-4 font-medium',
                    inv.status === 'Paid' ? 'text-[#22a45d]' : 'text-[#eb0000]'
                  )}
                >
                  {inv.status}
                </td>
                <td className="py-4">{inv.start ?? '—'}</td>
                <td className="py-4">{inv.end ?? '—'}</td>
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
              <ReceiptRow label="Plan" value={invoice?.plan ?? '—'} />
              <ReceiptRow label="Billing Cycle" value="—" />
              <ReceiptRow label="Start Date" value={invoice?.start ?? '—'} />
              <ReceiptRow label="Expiry Date" value={invoice?.end ?? '—'} />
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold">Payment Summary:</p>
            <div className="mt-2 flex flex-col gap-3">
              <ReceiptRow label={invoice?.plan ?? '—'} value={invoice?.amount ?? '—'} />
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
