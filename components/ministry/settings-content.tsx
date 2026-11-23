'use client';

import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { TwoFactorModal } from '@/components/ministry/two-factor-modal';
import { PencilLine, Upload, Trash2, CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getTenantBranding,
  updateTenantBranding,
  activateTenantBranding,
  deleteTenantBranding,
  getTenantBrandingAssets,
  uploadBrandingAsset,
  deleteBrandingAsset,
  getTenantSubscription,
  getTenantInvoices,
  getTenantInvoice,
  getTenantNotificationSettings,
  updateTenantNotificationSettings,
  getTenantSecuritySettings,
  updateTenantSecuritySettings,
  getTenantCampuses,
  createTenantCampus,
  updateTenantCampus,
  deleteTenantCampus,
  getTenantBillingPayments,
  checkoutTenantInvoice,
  generateTenantInvoiceDocument,
  getTenantBillingPaymentReceipt,
  getTenantSecurityPosture,
  getTenantCustomDomainStatus,
  prepareTenantCustomDomain,
  verifyTenantCustomDomain,
  getTenantOrganization,
  updateTenantOrganization,
  reactivateTenantCustomDomain,
  getTenantSubscriptionLifecycle,
  getTenantSubscriptionPlans,
  tenantSubscriptionCheckout,
  getTenantMerchantAccount,
  startTenantMerchantAccountOnboarding,
  submitTenantMerchantAccount,
  getTenantOrganizationReadiness,
  getTenantNotificationMessages,
  getTenantNotificationMessage,
  submitPaymentToken,
  getSharedAuthCapabilities,
  getSharedLookups,
  getSharedLookupRoles,
  type NotificationMessage,
  type TenantBranding,
  type BrandingAsset,
  type TenantSubscription,
  type TenantInvoice,
  type TenantNotificationSettings,
  type TenantSecuritySettings,
  type TenantCampus,
  type BillingPayment,
  type CustomDomainStatusResponse,
  type TenantOrganization,
  type TenantOrganizationUpdatePayload,
  type SubscriptionPlan,
  type SubscriptionLifecycle,
} from '@/lib/api/tenant';
import { getProfile, updateProfile, type Profile } from '@/lib/api/auth';
import { toast } from 'sonner';

const TABS = [
  'Profile',
  'Organization',
  'Church branding',
  'Payment & Billing',
  'Notifications',
  'Subscription',
  'Security',
  'Campuses',
  'Custom Domain',
];

function Field({
  label,
  value,
  action = 'Edit',
  onSave,
}: {
  label: string;
  value: string;
  action?: string;
  onSave?: (newValue: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      toast.error(`Failed to save ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

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
              if (e.key === 'Enter') handleSave();
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
      {onSave && (
        <button
          type="button"
          onClick={editing ? handleSave : () => setEditing(true)}
          disabled={saving}
          className={cn(
            'flex items-center gap-1 rounded-[7px] px-3 py-1.5 text-[13px] font-medium text-white transition-colors',
            editing ? 'bg-brand-blue' : 'bg-brand-gray-300 hover:bg-brand-gray-400',
            saving && 'opacity-60'
          )}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <PencilLine className="size-3.5" />}
          {editing ? 'Save' : action}
        </button>
      )}
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
  const [posture, setPosture] = useState<Record<string, unknown> | null>(null);
  const [authCapabilities, setAuthCapabilities] = useState<Record<string, unknown> | null>(null);
  const [lookups, setLookups] = useState<Record<string, unknown> | null>(null);
  const [lookupRoles, setLookupRoles] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTenantSecuritySettings().then(setSettings).catch(() => {});
    getTenantSecurityPosture().then(setPosture).catch(() => {});
    getSharedAuthCapabilities().then((r) => setAuthCapabilities(r as Record<string, unknown>)).catch(() => {});
    getSharedLookups().then((r) => setLookups(r as Record<string, unknown>)).catch(() => {});
    getSharedLookupRoles().then((r) => setLookupRoles(r as Record<string, unknown>)).catch(() => {});
  }, []);

  const toggle = (key: keyof TenantSecuritySettings) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const save = async () => {
    if (!settings) return;
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

  const loginAlerts = settings?.notifyAdminOnHighRiskLogin ?? false;
  const mfaRequired = settings?.mfaRequired ?? false;

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
        onChange={settings ? () => toggle('mfaRequired') : undefined}
      />
      <Toggle
        label="Login alerts"
        on={loginAlerts}
        onChange={settings ? () => toggle('notifyAdminOnHighRiskLogin') : undefined}
      />

      {settings && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      )}

      <TwoFactorModal open={twoFactor} onOpenChange={setTwoFactor} />

      {authCapabilities && Object.keys(authCapabilities).length > 0 && (
        <div className="mt-5 rounded-[12px] border border-[#f0f0f0] p-4">
          <p className="mb-3 text-[13px] font-semibold">Auth Capabilities</p>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {Object.entries(authCapabilities)
              .filter(([, v]) => v != null && typeof v !== 'object')
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-[8px] bg-[#f6f8fc] px-3 py-1.5">
                  <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {(lookups || lookupRoles) && (
        <div className="mt-5 rounded-[12px] border border-[#f0f0f0] p-4">
          <p className="mb-3 text-[13px] font-semibold">System Lookups</p>
          {lookups && Object.keys(lookups).length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-medium text-brand-gray-500 mb-2">Lookups</p>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {Object.entries(lookups)
                  .filter(([, v]) => v != null && !Array.isArray(v) && typeof v !== 'object')
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-[8px] bg-[#f6f8fc] px-3 py-1.5">
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {lookupRoles && Object.keys(lookupRoles).length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-brand-gray-500 mb-2">Lookup Roles</p>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {Object.entries(lookupRoles)
                  .filter(([, v]) => v != null && !Array.isArray(v) && typeof v !== 'object')
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-[8px] bg-[#f6f8fc] px-3 py-1.5">
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {posture && Object.keys(posture).length > 0 && (
        <div className="mt-5 rounded-[12px] border border-[#f0f0f0] p-4">
          <p className="mb-3 text-[13px] font-semibold">Security Posture</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-[12px]">
            {Object.entries(posture).map(([k, v]) => {
              if (v === null || v === undefined || typeof v === 'object') return null;
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
              const isGood = v === true || String(v).toLowerCase() === 'good' || String(v).toLowerCase() === 'pass';
              return (
                <div key={k} className="flex flex-col gap-0.5 rounded-[8px] border border-[#f0f0f0] p-3">
                  <span className="text-[10px] text-brand-gray-500 uppercase tracking-wide">{label}</span>
                  <span className={cn('font-medium', isGood ? 'text-[#34a853]' : 'text-[#eb0000]')}>{String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('LOGO');

  useEffect(() => {
    Promise.all([getTenantBranding(), getTenantBrandingAssets()])
      .then(([b, a]) => { setData(b); setAssets(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTenantBranding(data);
      toast.success('Branding saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleActivate = async () => {
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
        <Button
          variant="outline"
          className="text-[#eb0000] border-[#eb0000] hover:bg-[#fde8e8]"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            try {
              await deleteTenantBranding();
              toast.success('Branding deleted.');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Could not delete branding.');
            } finally {
              setDeleting(false);
            }
          }}
        >
          {deleting ? 'Deleting…' : 'Delete Branding'}
        </Button>
      </div>
    </div>
  );
}

/* ---- Subscription Tab ---- */

function OrganizationTab() {
  const [org, setOrg] = useState<TenantOrganization>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getTenantOrganization().then(setOrg).catch(() => {}).finally(() => setLoading(false));
    getTenantOrganizationReadiness().then((r) => setReadiness(r as Record<string, unknown>)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: TenantOrganizationUpdatePayload = {
        name: org.name,
        shortName: org.shortName,
        legalName: org.legalName,
        billingEmail: org.billingEmail,
        countryCode: org.countryCode,
        currency: org.currency,
        subDomain: org.subDomain,
      };
      const updated = await updateTenantOrganization(payload);
      setOrg(updated);
      toast.success('Organization saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-brand-blue" /></div>;
  }

  const fields: { key: keyof TenantOrganization; label: string; placeholder?: string }[] = [
    { key: 'name', label: 'Organization Name', placeholder: 'Grace Community Church' },
    { key: 'shortName', label: 'Short Name', placeholder: 'GCC' },
    { key: 'legalName', label: 'Legal Name', placeholder: 'Grace Community Church Inc.' },
    { key: 'billingEmail', label: 'Billing Email', placeholder: 'billing@church.org' },
    { key: 'countryCode', label: 'Country Code', placeholder: 'US' },
    { key: 'currency', label: 'Currency', placeholder: 'USD' },
    { key: 'subDomain', label: 'Subdomain', placeholder: 'grace' },
  ];

  return (
    <div className="rounded-[14px] bg-white p-6">
      <h3 className="mb-4 text-[15px] font-semibold">Organization Details</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-brand-gray-500">{label}</label>
            <Input
              value={(org[key] as string) ?? ''}
              onChange={(e) => setOrg((o) => ({ ...o, [key]: e.target.value }))}
              className="h-[44px]"
              placeholder={placeholder}
            />
          </div>
        ))}
        {org.slug && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-brand-gray-500">Slug</label>
            <div className="flex h-[44px] items-center rounded-[8px] border border-[#e2e2e2] px-3 text-[13px] text-brand-gray-500">{org.slug}</div>
          </div>
        )}
        {org.status && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-brand-gray-500">Status</label>
            <div className="flex h-[44px] items-center rounded-[8px] border border-[#e2e2e2] px-3 text-[13px] text-brand-gray-500">{org.status}</div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Save Organization
        </Button>
      </div>
      {readiness && (
        <div className="mt-6 rounded-[12px] border border-[#f2f2f2] p-4">
          <p className="mb-3 text-[14px] font-semibold">Organization Readiness</p>
          <div className="grid gap-2 sm:grid-cols-2 text-[12px]">
            {Object.entries(readiness)
              .filter(([, v]) => v != null && typeof v !== 'object')
              .map(([k, v]) => {
                const isOk = v === true || String(v).toLowerCase() === 'complete' || String(v).toLowerCase() === 'ready';
                return (
                  <div key={k} className={cn('flex items-center justify-between rounded-[8px] px-3 py-2', isOk ? 'bg-[#eafaf0]' : 'bg-[#fff4e5]')}>
                    <span className="capitalize text-[#333]">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={cn('font-medium', isOk ? 'text-[#22a45d]' : 'text-[#ff8d28]')}>{String(v)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionTab() {
  const [sub, setSub] = useState<TenantSubscription | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [expandedInvId, setExpandedInvId] = useState<string | null>(null);
  const [expandedInvDetail, setExpandedInvDetail] = useState<TenantInvoice | null>(null);
  const [lifecycle, setLifecycle] = useState<SubscriptionLifecycle | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getTenantSubscription(),
      getTenantInvoices(),
      getTenantSubscriptionLifecycle().catch(() => null),
      getTenantSubscriptionPlans().catch(() => [] as SubscriptionPlan[]),
    ])
      .then(([s, inv, lc, pl]) => {
        setSub(s);
        setInvoices(inv);
        if (lc) setLifecycle(lc as SubscriptionLifecycle);
        setPlans(pl as SubscriptionPlan[]);
      })
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

  const handleCheckout = async (planId: string) => {
    setCheckingOut(planId);
    try {
      const res = await tenantSubscriptionCheckout({ planId });
      const url = res?.checkoutUrl;
      if (url) window.open(url, '_blank');
      else toast.success('Checkout initiated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setCheckingOut(null);
    }
  };

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

      {/* Lifecycle */}
      {lifecycle && (
        <div className="rounded-[14px] bg-white p-6">
          <h3 className="mb-4 text-[15px] font-semibold">Subscription Lifecycle</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Current Status', value: lifecycle.currentStatus || '—', colored: true },
              { label: 'Previous Status', value: lifecycle.previousStatus || '—' },
              { label: 'Reason', value: lifecycle.reason || '—' },
              { label: 'Effective', value: lifecycle.effectiveAt ? new Date(lifecycle.effectiveAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
            ].map(({ label, value, colored }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[12px] text-brand-gray-500">{label}</span>
                <span className={cn('text-[14px] font-medium', colored ? statusColor(value) : '')}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      {plans.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <h3 className="mb-4 text-[15px] font-semibold">Available Plans</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] p-4">
                <p className="text-[14px] font-semibold">{plan.name || plan.code}</p>
                {plan.description && <p className="text-[12px] text-brand-gray-500">{plan.description}</p>}
                <p className="text-[16px] font-bold text-brand-blue">
                  {plan.currency} {plan.price != null ? plan.price : '—'}
                  {plan.billingCycle && <span className="text-[11px] font-normal text-brand-gray-400"> / {plan.billingCycle}</span>}
                </p>
                {plan.maxUsers != null && <p className="text-[11px] text-brand-gray-400">Up to {plan.maxUsers} users</p>}
                {plan.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    disabled={checkingOut === plan.id}
                    onClick={() => void handleCheckout(plan.id!)}
                  >
                    {checkingOut === plan.id ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
                    Select Plan
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {['Reference', 'Amount', 'Status', 'Date', 'Paid', 'Actions'].map((h) => (
                    <th key={h} className="pb-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isPaid = /paid|success/i.test(inv.status ?? '');
                  const isExpanded = expandedInvId === inv.id;
                  return (
                    <>
                      <tr key={inv.id} className="border-b border-[#f2f2f2]">
                        <td className="py-3 font-mono">{inv.reference || inv.id}</td>
                        <td className="py-3">{inv.currency} {inv.amount}</td>
                        <td className={cn('py-3 font-medium', statusColor(inv.status))}>{inv.status}</td>
                        <td className="py-3">{inv.createdAt}</td>
                        <td className="py-3">{inv.paidAt || '—'}</td>
                        <td className="py-3">
                          <span className="flex items-center gap-2">
                            {!isPaid && inv.id && (
                              <button
                                type="button"
                                className="text-[11px] font-medium text-brand-blue hover:underline"
                                onClick={async () => {
                                  try {
                                    const res = await checkoutTenantInvoice(inv.id!);
                                    const url = res?.checkoutUrl as string | undefined;
                                    if (url) window.open(url, '_blank');
                                    else toast.success('Invoice checkout initiated.');
                                  } catch (e) { toast.error(e instanceof Error ? e.message : 'Checkout failed.'); }
                                }}
                              >Pay</button>
                            )}
                            {inv.id && (
                              <button
                                type="button"
                                className="text-[11px] font-medium text-brand-gray-500 hover:underline"
                                onClick={async () => {
                                  try {
                                    await generateTenantInvoiceDocument(inv.id!);
                                    toast.success('Invoice document generated.');
                                  } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not generate document.'); }
                                }}
                              >Download</button>
                            )}
                            {inv.id && (
                              <button
                                type="button"
                                className="text-[11px] font-medium text-brand-gray-500 hover:underline"
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedInvId(null);
                                    setExpandedInvDetail(null);
                                  } else {
                                    setExpandedInvId(inv.id!);
                                    setExpandedInvDetail(null);
                                    getTenantInvoice(inv.id!).then((d) => setExpandedInvDetail(d)).catch(() => {});
                                  }
                                }}
                              >{isExpanded ? 'Hide' : 'View'}</button>
                            )}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${inv.id}-detail`} className="bg-[#f9fafb]">
                          <td colSpan={6} className="px-2 py-2 text-[11px] text-brand-gray-500">
                            {expandedInvDetail === null
                              ? 'Loading…'
                              : `Ref: ${expandedInvDetail.reference || '—'} | ${expandedInvDetail.currency} ${expandedInvDetail.amount} | Status: ${expandedInvDetail.status || '—'} | Created: ${expandedInvDetail.createdAt || '—'} | Paid: ${expandedInvDetail.paidAt || '—'}`}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
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

  useEffect(() => {
    getTenantBranding().then(setBranding).catch(() => {});
    getProfile().then(setProfile).catch(() => {});
  }, []);

  return (
    <div className="rounded-[14px] bg-white p-6">
      <Field
        label="Church Name"
        value={branding.organizationName || ''}
        onSave={async (v) => {
          await updateTenantBranding({ organizationName: v });
          setBranding((b) => ({ ...b, organizationName: v }));
          toast.success('Church name saved');
        }}
      />
      <Field
        label="Email"
        value={profile.email || ''}
        onSave={async (v) => {
          await updateProfile({ email: v });
          setProfile((p) => ({ ...p, email: v }));
          toast.success('Email saved');
        }}
      />
      <Field
        label="Phone number"
        value={profile.mobilePhone || ''}
        onSave={async (v) => {
          await updateProfile({ mobilePhone: v });
          setProfile((p) => ({ ...p, mobilePhone: v }));
          toast.success('Phone number saved');
        }}
      />
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState<TenantNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<NotificationMessage | null>(null);

  useEffect(() => {
    getTenantNotificationSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
    getTenantNotificationMessages().then(setMessages).catch(() => {});
  }, []);

  const handleViewMessage = (id: string) => {
    getTenantNotificationMessage(id)
      .then((msg) => setSelectedMsg(msg))
      .catch(() => { toast.error('Could not load notification details.'); });
  };

  const toggle = (key: 'subscriptionExpiryRemindersEnabled' | 'inactiveTenantRemindersEnabled') => {
    setSettings((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  };

  const save = async () => {
    if (!settings) return;
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

  const expiryOn = settings?.subscriptionExpiryRemindersEnabled ?? false;
  const inactiveOn = settings?.inactiveTenantRemindersEnabled ?? false;

  return (
    <div className="rounded-[14px] bg-white p-6">
      <Toggle
        label="Subscription expiry reminders"
        on={expiryOn}
        onChange={settings ? () => toggle('subscriptionExpiryRemindersEnabled') : undefined}
      />
      <Toggle
        label="Inactive account reminders"
        on={inactiveOn}
        onChange={settings ? () => toggle('inactiveTenantRemindersEnabled') : undefined}
      />
      {settings && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-5 rounded-[12px] border border-[#f2f2f2] p-4">
          <p className="mb-3 text-[14px] font-semibold">Notification History</p>
          <div className="flex flex-col divide-y divide-[#f2f2f2]">
            {messages.slice(0, 10).map((msg, i) => (
              <div key={msg.id ?? i} className="flex items-center justify-between py-2 text-[12px]">
                <div>
                  <p className="font-medium">{msg.subject ?? msg.ruleType ?? '—'}</p>
                  <p className="text-brand-gray-500">{msg.channel ?? ''} {msg.sentAt ? `· ${new Date(msg.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', msg.status?.toLowerCase() === 'sent' ? 'bg-[#eafaf0] text-[#22a45d]' : 'bg-[#fff4e5] text-[#ff8d28]')}>{msg.status ?? '—'}</span>
                  {msg.id && <button type="button" onClick={() => handleViewMessage(msg.id!)} className="text-brand-blue hover:underline">View</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMsg && (
        <Dialog.Root open onOpenChange={(v) => { if (!v) setSelectedMsg(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[460px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
              <div className="flex items-center justify-between mb-5">
                <Dialog.Title className="text-[18px] font-bold">Notification Detail</Dialog.Title>
                <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
              </div>
              <div className="flex flex-col gap-3 text-[13px]">
                {(['subject', 'channel', 'ruleType', 'status', 'scheduledAt', 'sentAt'] as const).map((k) => selectedMsg[k] ? (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium">{String(selectedMsg[k])}</span>
                  </div>
                ) : null)}
                {selectedMsg.body && (
                  <div>
                    <span className="text-[11px] text-brand-gray-500">Body</span>
                    <p className="mt-1 rounded-[8px] bg-[#f6f8fc] p-3 text-[12px]">{selectedMsg.body}</p>
                  </div>
                )}
                {selectedMsg.recipients && selectedMsg.recipients.length > 0 && (
                  <div>
                    <span className="text-[11px] text-brand-gray-500">Recipients ({selectedMsg.recipients.length})</span>
                    <div className="mt-1 flex flex-col gap-1 text-[11px]">
                      {selectedMsg.recipients.slice(0, 5).map((r, i) => (
                        <div key={i} className="rounded-[6px] bg-[#f6f8fc] px-3 py-1.5">{r.targetEmail ?? r.targetPhone ?? r.channel ?? '—'} · {r.deliveryStatus ?? '—'}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function PaymentBillingTab() {
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [merchantAccount, setMerchantAccount] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState<Record<string, string>>({});
  const [submitFormOpen, setSubmitFormOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getTenantBillingPayments(),
      getTenantMerchantAccount().catch(() => null),
    ])
      .then(([data, merchant]) => {
        const arr = (data as { content?: BillingPayment[] })?.content ?? [];
        setPayments(arr);
        if (merchant) setMerchantAccount(merchant as Record<string, unknown>);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStartOnboarding = async () => {
    setOnboarding(true);
    try {
      const res = await startTenantMerchantAccountOnboarding();
      const r = res as Record<string, unknown>;
      const url = r?.onboardingUrl as string | undefined;
      if (url) window.open(url, '_blank');
      else toast.success('Merchant account onboarding started');
      setMerchantAccount(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start onboarding');
    } finally {
      setOnboarding(false);
    }
  };

  const handleSubmitMerchant = async () => {
    setSubmitting(true);
    try {
      const res = await submitTenantMerchantAccount(submitForm as Record<string, unknown>);
      const r = res as Record<string, unknown>;
      toast.success('Merchant account submitted.');
      setMerchantAccount((prev) => ({ ...(prev ?? {}), ...r }));
      setSubmitFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit merchant account.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-6">
      {/* Merchant Account */}
      <div className="rounded-[14px] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Merchant Account</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleStartOnboarding()} disabled={onboarding} className="gap-1.5">
              {onboarding ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {merchantAccount ? 'Re-onboard' : 'Start Onboarding'}
            </Button>
            <Button size="sm" onClick={() => setSubmitFormOpen(true)} className="gap-1.5">Submit</Button>
          </div>
        </div>
        {merchantAccount ? (
          <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
            {Object.entries(merchantAccount)
              .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
              .slice(0, 8)
              .map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-[13px] text-brand-gray-500">No merchant account configured. Start onboarding to accept payments.</p>
        )}
      </div>

      {/* Billing Payments */}
      <div className="rounded-[14px] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Billing Payments</h3>
        {payments.length === 0 ? (
          <p className="text-[14px] text-brand-gray-500">No billing payment records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-brand-gray-500">
                  {['Reference', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="pb-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const ref = p.paymentReference ?? p.id ?? '—';
                  const currency = p.currency ?? '';
                  const amount = p.amount != null ? `${currency} ${p.amount}` : '—';
                  const status = p.status ?? '—';
                  const date = fmtDate(p.requestedAt ?? p.paidAt ?? '');
                  const isPaid = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid';
                  const statusColorClass = isPaid ? 'text-[#34a853]' : status.toLowerCase().includes('fail') ? 'text-[#eb0000]' : 'text-[#ff8d28]';
                  return (
                    <tr key={p.id ?? i} className="border-b border-[#f2f2f2]">
                      <td className="py-3 font-mono">{ref}</td>
                      <td className="py-3">{amount}</td>
                      <td className={cn('py-3 font-medium', statusColorClass)}>{status}</td>
                      <td className="py-3">{date}</td>
                      <td className="py-3">
                        {isPaid && p.id && (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-brand-blue hover:underline"
                            onClick={async () => {
                              try {
                                const res = await getTenantBillingPaymentReceipt(p.id!);
                                const url = (res as Record<string, unknown>)?.downloadUrl as string | undefined;
                                if (url) window.open(url, '_blank');
                                else toast.success('Receipt generated.');
                              } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not get receipt.'); }
                            }}
                          >Receipt</button>
                        )}
                        {!isPaid && p.paymentReference && (
                          <button
                            type="button"
                            className="ml-2 text-[11px] font-medium text-[#ff8d28] hover:underline"
                            onClick={async () => {
                              const token = window.prompt('Enter payment token:');
                              if (!token) return;
                              try {
                                await submitPaymentToken(p.paymentReference!, token);
                                toast.success('Payment token submitted.');
                              } catch (e) { toast.error(e instanceof Error ? e.message : 'Token submission failed.'); }
                            }}
                          >Submit Token</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Merchant Account Modal */}
      {submitFormOpen && (
        <Dialog.Root open onOpenChange={(v) => { if (!v) setSubmitFormOpen(false); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
              <div className="flex items-center justify-between mb-5">
                <Dialog.Title className="text-[18px] font-bold">Submit Merchant Account</Dialog.Title>
                <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
              </div>
              <p className="mb-4 text-[13px] text-brand-gray-500">Complete the merchant account submission with any required details.</p>
              <div className="flex flex-col gap-3">
                {(['businessName', 'businessType', 'taxId', 'contactEmail'] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      className="h-[38px] rounded-[6px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
                      value={submitForm[field] ?? ''}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <Button onClick={() => void handleSubmitMerchant()} disabled={submitting} className="flex-1 gap-1.5">
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Submit
                </Button>
                <Dialog.Close asChild>
                  <Button variant="outline" className="flex-1">Cancel</Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

/* ---- Campuses Tab ---- */

type Campus = { id: string; code: string; name: string; address: string; active: boolean };

function CampusesTab() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', address: '' });

  useEffect(() => {
    getTenantCampuses()
      .then((data: TenantCampus[]) => {
        const mapped: Campus[] = data
          .map((c) => ({
            id: String(c.id ?? ''),
            code: String(c.code ?? ''),
            name: String(c.name ?? ''),
            address: String(c.address ?? ''),
            active: c.active !== false,
          }))
          .filter((c) => c.id || c.name);
        setCampuses(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ code: '', name: '', address: '' }); setAdding(true); setEditId(null); };
  const openEdit = (c: Campus) => { setForm({ code: c.code, name: c.name, address: c.address }); setEditId(c.id); setAdding(false); };
  const cancel = () => { setAdding(false); setEditId(null); };

  const save = async () => {
    try {
      if (adding) {
        const res = await createTenantCampus(form);
        const newId = String(res?.id ?? Date.now());
        setCampuses((prev) => [...prev, { id: newId, ...form, active: true }]);
      } else if (editId) {
        await updateTenantCampus(editId, form);
        setCampuses((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c));
      }
      cancel();
    } catch { cancel(); }
  };

  const deleteCampus = async (id: string) => {
    try {
      await deleteTenantCampus(id);
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

function CustomDomainTab() {
  const [status, setStatus] = useState<CustomDomainStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    getTenantCustomDomainStatus()
      .then((s) => { setStatus(s); setDomain(s.customDomain ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePrepare = async () => {
    if (!domain.trim()) return;
    setPreparing(true);
    try {
      const res = await prepareTenantCustomDomain({ customDomain: domain.trim() });
      setStatus(res);
      toast.success('Domain prepared. Add the DNS record shown below.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not prepare domain.');
    } finally {
      setPreparing(false);
    }
  };

  const handleVerify = async () => {
    if (!status?.claimId) return;
    setVerifying(true);
    try {
      const res = await verifyTenantCustomDomain(status.claimId);
      setStatus(res);
      toast.success('Domain verified.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed — check DNS and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await reactivateTenantCustomDomain();
      toast.success('Domain reactivation requested.');
      const updated = await getTenantCustomDomainStatus();
      setStatus(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not request reactivation.');
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-brand-blue" /></div>;
  }

  const isVerified = status?.status === 'VERIFIED' || status?.status === 'ACTIVE';
  const isPending = status?.claimId && !isVerified;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-bold">Custom Domain</h2>
        <p className="mt-1 text-[13px] text-brand-gray-500">
          Point your own domain to your ministry portal.
        </p>
      </div>

      {isVerified && (
        <div className="flex items-start justify-between gap-4 rounded-[12px] bg-[#e7f7ee] px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-[#34a853]" />
            <div>
              <p className="text-[14px] font-semibold text-[#22a45d]">Domain active</p>
              <p className="text-[13px] text-[#555]">{status?.customDomain}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => void handleReactivate()} disabled={reactivating} className="shrink-0 text-[12px]">
            {reactivating ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
            Reactivate
          </Button>
        </div>
      )}

      {!isVerified && (
        <div className="flex flex-col gap-3">
          <label className="text-[13px] font-medium text-[#333]">Your domain</label>
          <div className="flex gap-2">
            <Input
              className="h-[46px] flex-1"
              placeholder="e.g. church.example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={!!isPending}
            />
            {!isPending && (
              <Button
                size="lg"
                className="h-[46px] shrink-0"
                disabled={preparing || !domain.trim()}
                onClick={() => void handlePrepare()}
              >
                {preparing ? <Loader2 className="size-4 animate-spin" /> : 'Configure'}
              </Button>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex flex-col gap-4 rounded-[12px] border border-[#dde3f0] p-5">
          <p className="text-[13px] font-semibold text-[#333]">Add this DNS record at your domain registrar</p>
          <div className="overflow-x-auto rounded-[8px] bg-[#f4f7ff] p-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-brand-gray-500">
                  <th className="pb-2 pr-6 font-medium">Type</th>
                  <th className="pb-2 pr-6 font-medium">Name</th>
                  <th className="pb-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pr-6 font-mono font-semibold text-brand-blue">CNAME</td>
                  <td className="pr-6 font-mono">{status?.customDomain ?? domain}</td>
                  <td className="font-mono text-[#333]">{status?.dnsTarget ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-brand-gray-500">
            DNS changes can take up to 48 hours to propagate. Click Verify once the record is in place.
          </p>
          <Button
            size="lg"
            className="h-[46px] w-full"
            disabled={verifying}
            onClick={() => void handleVerify()}
          >
            {verifying ? <><Loader2 className="mr-2 size-4 animate-spin" />Checking…</> : 'Verify Domain'}
          </Button>
        </div>
      )}
    </div>
  );
}

function TabContent({ tab }: { tab: string }) {
  if (tab === 'Profile') return <ProfileTab />;
  if (tab === 'Organization') return <OrganizationTab />;
  if (tab === 'Church branding') return <BrandingTab />;
  if (tab === 'Subscription') return <SubscriptionTab />;
  if (tab === 'Security') return <SecurityTab />;
  if (tab === 'Notifications') return <NotificationsTab />;
  if (tab === 'Payment & Billing') return <PaymentBillingTab />;
  if (tab === 'Custom Domain') return <CustomDomainTab />;
  return <CampusesTab />;
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
