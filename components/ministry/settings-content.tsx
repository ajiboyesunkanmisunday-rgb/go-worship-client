'use client';

import { cn } from '@/lib/utils';
import { TwoFactorModal } from '@/components/ministry/two-factor-modal';
import { PencilLine, Upload, Trash2, CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { USE_LIVE_API } from '@/lib/api/config';
import {
  getTenantBranding,
  updateTenantBranding,
  activateTenantBranding,
  getTenantBrandingAssets,
  uploadBrandingAsset,
  deleteBrandingAsset,
  getTenantSubscription,
  getTenantInvoices,
  getTenantNotificationSettings,
  updateTenantNotificationSettings,
  getTenantSecuritySettings,
  updateTenantSecuritySettings,
  type TenantBranding,
  type BrandingAsset,
  type TenantSubscription,
  type TenantInvoice,
  type TenantNotificationSettings,
  type TenantSecuritySettings,
} from '@/lib/api/tenant';
import { getProfile, type Profile } from '@/lib/api/auth';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

const TABS = [
  'Profile',
  'Church branding',
  'Payment & Billing',
  'Notifications',
  'Subscription',
  'Security',
  'Campuses',
];

function Field({
  label,
  value,
  action = 'Edit',
}: {
  label: string;
  value: string;
  action?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-brand-gray-500">{label}</p>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
              if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
              }
            }}
            className="mt-1 w-full max-w-[320px] rounded-[6px] border border-brand-blue px-2 py-1 text-[14px] font-medium outline-none"
          />
        ) : (
          <p className="mt-1 text-[14px] font-medium">{draft}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className={cn(
          'flex items-center gap-1 rounded-[7px] px-3 py-1.5 text-[13px] font-medium text-white transition-colors',
          editing ? 'bg-brand-blue' : 'bg-brand-gray-300 hover:bg-brand-gray-400'
        )}
      >
        {editing ? 'Save' : action}
        <PencilLine className="size-3.5" />
      </button>
    </div>
  );
}

function Toggle({ label, on = true, onChange }: { label: string; on?: boolean; onChange?: () => void }) {
  const [checked, setChecked] = useState(on);
  const isControlled = onChange !== undefined;
  const value = isControlled ? on : checked;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-4 last:border-0">
      <p className="text-[14px] font-medium">{label}</p>
      <button
        type="button"
        onClick={() => { if (isControlled) onChange(); else setChecked((c) => !c); }}
        className={cn(
          'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
          value ? 'bg-[#22a45d]' : 'bg-brand-gray-300'
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white transition-transform',
            value && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

function SecurityTab() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [settings, setSettings] = useState<TenantSecuritySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantSecuritySettings().then(setSettings).catch(() => {});
  }, []);

  const toggle = (key: keyof TenantSecuritySettings) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const save = async () => {
    if (!USE_LIVE_API || !settings) return;
    setSaving(true);
    try {
      await updateTenantSecuritySettings(settings);
      toast.success('Security settings saved');
    } catch {
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const loginAlerts = USE_LIVE_API ? (settings?.notifyAdminOnHighRiskLogin ?? false) : false;
  const mfaRequired = USE_LIVE_API ? (settings?.mfaRequired ?? false) : false;

  return (
    <div className="rounded-[14px] bg-white p-6">
      <Field label="Password" value="****************" />

      <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-4">
        <div>
          <p className="text-[14px] font-medium">Two-Factor Authentication</p>
          <p className="text-[12px] text-brand-gray-500">
            Add an extra layer of security to your account
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTwoFactor(true)}
          className="h-9 rounded-[8px] border-[0.5px] border-brand-blue bg-[#e9f0ff] px-4 text-[12px] font-medium text-brand-blue transition-colors hover:bg-[#dbe7ff]"
        >
          Set up
        </button>
      </div>

      <Toggle
        label="Require MFA for all members"
        on={mfaRequired}
        onChange={USE_LIVE_API && settings ? () => toggle('mfaRequired') : undefined}
      />
      <Toggle
        label="Login alerts"
        on={loginAlerts}
        onChange={USE_LIVE_API && settings ? () => toggle('notifyAdminOnHighRiskLogin') : undefined}
      />

      {USE_LIVE_API && settings && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      )}

      <TwoFactorModal open={twoFactor} onOpenChange={setTwoFactor} />
    </div>
  );
}

/* ---- Church Branding Tab ---- */

function BrandingTab() {
  const [data, setData] = useState<TenantBranding>({});
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('LOGO');

  useEffect(() => {
    if (!USE_LIVE_API) { setLoading(false); return; }
    Promise.all([getTenantBranding(), getTenantBrandingAssets()])
      .then(([b, a]) => { setData(b); setAssets(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!USE_LIVE_API) { toast.success('Branding saved (mock)'); return; }
    setSaving(true);
    try {
      await updateTenantBranding(data);
      toast.success('Branding saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleActivate = async () => {
    if (!USE_LIVE_API) { toast.success('Branding activated (mock)'); return; }
    setActivating(true);
    try {
      await activateTenantBranding();
      toast.success('Branding activated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Activation failed');
    } finally { setActivating(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!USE_LIVE_API) { toast.success('Asset uploaded (mock)'); return; }
    try {
      await uploadBrandingAsset(uploadCategory, file);
      toast.success('Asset uploaded');
      const updated = await getTenantBrandingAssets();
      setAssets(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!USE_LIVE_API) { setAssets((a) => a.filter((x) => x.id !== id)); return; }
    try {
      await deleteBrandingAsset(id);
      setAssets((a) => a.filter((x) => x.id !== id));
      toast.success('Asset removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identity */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Church Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'organizationName', label: 'Church Name' },
            { key: 'tagline', label: 'Tagline' },
            { key: 'fontFamily', label: 'Font Family' },
            { key: 'description', label: 'Description' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-brand-gray-500">{label}</label>
              <Input
                value={(data[key as keyof TenantBranding] as string) ?? ''}
                onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
                className="h-[44px]"
                placeholder={label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Brand Colors</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { key: 'primaryColor', label: 'Primary' },
            { key: 'secondaryColor', label: 'Secondary' },
            { key: 'accentColor', label: 'Accent' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-brand-gray-500">{label}</label>
              <div className="flex h-[44px] items-center gap-3 rounded-[8px] border border-[#e2e2e2] bg-white px-3">
                <input
                  type="color"
                  value={(data[key as keyof TenantBranding] as string) || '#243f84'}
                  onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
                  className="size-6 cursor-pointer rounded border-0 p-0"
                />
                <span className="text-[13px] font-mono">
                  {(data[key as keyof TenantBranding] as string) || '#243f84'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assets */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Brand Assets</h3>
        {assets.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4">
            {assets.map((a) => (
              <div key={a.id} className="relative flex flex-col items-center gap-1 rounded-[8px] border border-[#f2f2f2] p-3">
                {a.contentType.startsWith('image/') ? (
                  <img src={a.url} alt={a.category} className="h-16 w-16 rounded-[4px] object-contain" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-[#f2f2f2]">
                    <span className="text-[10px] text-brand-gray-500">{a.category}</span>
                  </div>
                )}
                <span className="text-[11px] text-brand-gray-500">{a.category}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteAsset(a.id)}
                  className="absolute right-1 top-1 rounded-full p-0.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-brand-gray-500">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="h-[44px] rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              {['LOGO', 'FAVICON', 'BANNER', 'BACKGROUND'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-[44px] gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Upload Asset
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Save Branding
        </Button>
        <Button variant="outline" onClick={handleActivate} disabled={activating}>
          {activating ? 'Activating…' : 'Activate Branding'}
        </Button>
      </div>
    </div>
  );
}

/* ---- Subscription Tab ---- */

function SubscriptionTab() {
  const [sub, setSub] = useState<TenantSubscription | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!USE_LIVE_API) { setLoading(false); return; }
    Promise.all([getTenantSubscription(), getTenantInvoices()])
      .then(([s, inv]) => { setSub(s); setInvoices(inv); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  const statusColor = (s: string) =>
    s.toLowerCase() === 'active' ? 'text-[#34a853]' :
    s.toLowerCase() === 'pending' ? 'text-[#ff8d28]' : 'text-[#eb0000]';

  return (
    <div className="flex flex-col gap-6">
      {/* Current Plan */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Current Plan</h3>
        {sub ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Plan', value: sub.planName || '—' },
              { label: 'Status', value: sub.status || '—', colored: true },
              { label: 'Billing Cycle', value: sub.billingCycle || '—' },
              { label: 'Next Billing', value: sub.nextBillingDate || '—' },
              { label: 'Amount', value: sub.amount ? `${sub.currency} ${sub.amount}` : '—' },
              { label: 'Max Users', value: sub.maxUsers != null ? String(sub.maxUsers) : 'Unlimited' },
            ].map(({ label, value, colored }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[12px] text-brand-gray-500">{label}</span>
                <span className={cn('text-[14px] font-medium', colored ? statusColor(value) : '')}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-brand-gray-500">No subscription data available.</p>
        )}
      </div>

      {/* Invoices */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Invoice History</h3>
        {invoices.length === 0 ? (
          <p className="text-[14px] text-brand-gray-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-brand-gray-500">
                  {['Reference', 'Amount', 'Status', 'Date', 'Paid'].map((h) => (
                    <th key={h} className="pb-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#f2f2f2]">
                    <td className="py-3 font-mono">{inv.reference || inv.id}</td>
                    <td className="py-3">{inv.currency} {inv.amount}</td>
                    <td className={cn('py-3 font-medium', statusColor(inv.status))}>{inv.status}</td>
                    <td className="py-3">{inv.createdAt}</td>
                    <td className="py-3">{inv.paidAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab() {
  const [branding, setBranding] = useState<TenantBranding>({});
  const [profile, setProfile] = useState<Profile>({});
  const [location, setLocation] = useState(USE_LIVE_API ? '' : 'Ontario, Canada');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then(setBranding).catch(() => {});
    getProfile().then(setProfile).catch(() => {});
    (api.get<Record<string, unknown>>('/tenant/admin/organization') as Promise<Record<string, unknown>>)
      .then((d) => {
        const loc = (d['city'] as string | undefined) ?? (d['location'] as string | undefined) ?? (d['address'] as string | undefined) ?? (d['country'] as string | undefined);
        if (loc) setLocation(loc);
      }).catch(() => {});
  }, []);

  return (
    <div className="rounded-[14px] bg-white p-6">
      <Field label="Church Name" value={branding.organizationName || (USE_LIVE_API ? '' : 'Celebration Church Int.')} />
      <Field label="Email" value={profile.email || (USE_LIVE_API ? '' : 'admin@celebration.org')} />
      <Field label="Phone number" value={profile.mobilePhone || (USE_LIVE_API ? '' : '(+62) 821 554 - 5432')} />
      <Field label="Location" value={location} />
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState<TenantNotificationSettings | null>(null);
  const [loading, setLoading] = useState(USE_LIVE_API);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!USE_LIVE_API) { setLoading(false); return; }
    getTenantNotificationSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: 'subscriptionExpiryRemindersEnabled' | 'inactiveTenantRemindersEnabled') => {
    setSettings((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  };

  const save = async () => {
    if (!USE_LIVE_API || !settings) return;
    setSaving(true);
    try {
      await updateTenantNotificationSettings(settings);
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  const expiryOn = USE_LIVE_API ? (settings?.subscriptionExpiryRemindersEnabled ?? false) : true;
  const inactiveOn = USE_LIVE_API ? (settings?.inactiveTenantRemindersEnabled ?? false) : false;

  return (
    <div className="rounded-[14px] bg-white p-6">
      <Toggle
        label="Subscription expiry reminders"
        on={expiryOn}
        onChange={USE_LIVE_API && settings ? () => toggle('subscriptionExpiryRemindersEnabled') : undefined}
      />
      <Toggle
        label="Inactive account reminders"
        on={inactiveOn}
        onChange={USE_LIVE_API && settings ? () => toggle('inactiveTenantRemindersEnabled') : undefined}
      />
      {USE_LIVE_API && settings && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function PaymentBillingTab() {
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(USE_LIVE_API);

  useEffect(() => {
    if (!USE_LIVE_API) { setLoading(false); return; }
    (api.get<unknown>('/tenant/admin/billing/invoices') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        setPayments(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (iso: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); }
    catch { return iso; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!USE_LIVE_API || payments.length === 0) {
    return (
      <div className="rounded-[14px] bg-white p-6">
        <p className="text-[14px] text-brand-gray-500">No billing payment records available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-white p-6">
      <h3 className="mb-4 text-[15px] font-semibold">Billing Payments</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#f2f2f2] text-left text-brand-gray-500">
              {['Reference', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} className="pb-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => {
              const ref = String(p['paymentReference'] ?? p['reference'] ?? p['id'] ?? '—');
              const currency = String(p['currency'] ?? '');
              const amount = p['amount'] != null ? `${currency} ${p['amount']}` : '—';
              const status = String(p['status'] ?? '—');
              const date = fmtDate(String(p['createdAt'] ?? p['paidAt'] ?? ''));
              const statusColor = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid'
                ? 'text-[#34a853]' : status.toLowerCase().includes('fail') || status.toLowerCase() === 'failed'
                ? 'text-[#eb0000]' : 'text-[#ff8d28]';
              return (
                <tr key={i} className="border-b border-[#f2f2f2]">
                  <td className="py-3 font-mono">{ref}</td>
                  <td className="py-3">{amount}</td>
                  <td className={cn('py-3 font-medium', statusColor)}>{status}</td>
                  <td className="py-3">{date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- Campuses Tab ---- */

type Campus = { id: string; code: string; name: string; address: string; active: boolean };

const CAMPUS_MOCK: Campus[] = [
  { id: '1', code: 'HQ', name: 'Main Campus', address: '100 Church Street, Lagos', active: true },
  { id: '2', code: 'ABJ', name: 'Abuja Branch', address: '45 Wuse Zone 5, Abuja', active: true },
];

function CampusesTab() {
  const [campuses, setCampuses] = useState<Campus[]>(USE_LIVE_API ? [] : CAMPUS_MOCK);
  const [loading, setLoading] = useState(USE_LIVE_API);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', address: '' });

  useEffect(() => {
    if (!USE_LIVE_API) { setLoading(false); return; }
    (api.get<unknown>('/tenant/admin/campuses') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        const mapped: Campus[] = arr.map((c) => ({
          id: String(c['id'] ?? c['campusId'] ?? ''),
          code: String(c['code'] ?? ''),
          name: String(c['name'] ?? c['campusName'] ?? ''),
          address: String(c['address'] ?? ''),
          active: c['active'] !== false,
        })).filter((c) => c.id || c.name);
        if (mapped.length > 0) setCampuses(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ code: '', name: '', address: '' }); setAdding(true); setEditId(null); };
  const openEdit = (c: Campus) => { setForm({ code: c.code, name: c.name, address: c.address }); setEditId(c.id); setAdding(false); };
  const cancel = () => { setAdding(false); setEditId(null); };

  const save = async () => {
    if (!USE_LIVE_API) {
      if (adding) {
        setCampuses((prev) => [...prev, { id: String(Date.now()), ...form, active: true }]);
      } else if (editId) {
        setCampuses((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c));
      }
      cancel();
      return;
    }
    try {
      if (adding) {
        const res = await (api.post<unknown>('/tenant/admin/campuses', form) as Promise<unknown>);
        type R = Record<string, unknown>;
        const d = (res ?? {}) as R;
        const newId = String(d['id'] ?? d['campusId'] ?? Date.now());
        setCampuses((prev) => [...prev, { id: newId, ...form, active: true }]);
      } else if (editId) {
        await (api.put(`/tenant/admin/campuses/${editId}`, form) as Promise<unknown>);
        setCampuses((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c));
      }
      cancel();
    } catch { cancel(); }
  };

  const deleteCampus = async (id: string) => {
    if (!USE_LIVE_API) { setCampuses((prev) => prev.filter((c) => c.id !== id)); return; }
    try {
      await (api.del(`/tenant/admin/campuses/${id}`) as Promise<unknown>);
      setCampuses((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const activeForm = adding || editId !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold">Campus Locations</p>
          <p className="text-[12px] text-brand-gray-500">Manage the physical campuses for your organisation.</p>
        </div>
        {!activeForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="size-3.5" /> Add Campus
          </button>
        )}
      </div>

      {activeForm && (
        <div className="rounded-[12px] border border-[#e5e7eb] bg-[#f9fafb] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold">{adding ? 'New Campus' : 'Edit Campus'}</p>
            <button type="button" onClick={cancel} aria-label="Cancel"><X className="size-4 text-brand-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-brand-gray-500">Name*</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Main Campus"
                className="h-[40px] text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-brand-gray-500">Code*</label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="HQ"
                maxLength={10}
                className="h-[40px] text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-brand-gray-500">Address</label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="100 Church Street"
                className="h-[40px] text-[13px]"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!form.name || !form.code}
              className="rounded-[7px] bg-brand-blue px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50 hover:opacity-90"
            >
              {adding ? 'Create' : 'Save'}
            </button>
            <button type="button" onClick={cancel} className="rounded-[7px] border border-[#e5e7eb] px-4 py-1.5 text-[13px] text-brand-gray-500 hover:bg-[#f4f4f4]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-brand-gray-400">
          <Loader2 className="size-4 animate-spin" /> Loading campuses…
        </div>
      ) : campuses.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-brand-gray-400">No campuses yet. Add your first campus above.</p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[#ededed]">
          <table className="w-full min-w-[480px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa] text-brand-gray-500">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campuses.map((c) => (
                <tr key={c.id} className="border-b border-[#f8f8f8] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-brand-gray-500">{c.code}</td>
                  <td className="px-4 py-3 text-brand-gray-500">{c.address || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', c.active ? 'bg-[#eafaf0] text-[#22a45d]' : 'bg-[#f5f5f5] text-brand-gray-500')}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(c)} className="text-brand-gray-400 hover:text-brand-blue">
                        <PencilLine className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteCampus(c.id)} className="text-brand-gray-400 hover:text-[#eb0000]">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabContent({ tab }: { tab: string }) {
  if (tab === 'Profile') {
    return <ProfileTab />;
  }
  if (tab === 'Church branding') return <BrandingTab />;
  if (tab === 'Subscription') return <SubscriptionTab />;
  if (tab === 'Security') {
    return <SecurityTab />;
  }
  if (tab === 'Notifications') {
    return <NotificationsTab />;
  }
  if (tab === 'Payment & Billing') {
    return <PaymentBillingTab />;
  }
  if (tab === 'Campuses') {
    return <CampusesTab />;
  }
  return (
    <div className="rounded-[14px] bg-white p-6">
      <Field label={`${tab} details`} value="Manage your settings here" />
      <Field label="Preference" value="Default" />
    </div>
  );
}

export function SettingsContent() {
  const [tab, setTab] = useState('Profile');
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Settings</h1>

      <div className="flex flex-wrap gap-6 border-b border-[#ededed]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'pb-3 text-[14px] transition-colors',
              tab === t
                ? '-mb-px border-b-2 border-brand-blue font-medium text-brand-blue'
                : 'text-brand-gray-500 hover:text-black'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <TabContent tab={tab} />
    </div>
  );
}
