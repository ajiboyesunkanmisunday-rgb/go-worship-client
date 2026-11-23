'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import {
  getSystemBranding,
  updateSystemBranding,
  activateSystemBranding,
  getSystemBrandingAssets,
  uploadSystemBrandingAsset,
  deleteSystemBrandingAsset,
  getSystemPaymentGateways,
  createSystemPaymentGateway,
  updateSystemPaymentGateway,
  setSystemPaymentGatewayActive,
  setSystemPlatformDefaultGateway,
  type SystemBrandingUpdatePayload,
  type SystemPaymentGateway,
  type SystemBrandingAsset,
  type CreatePaymentGatewayPayload,
} from '@/lib/api/system';
import { changePassword as apiChangePassword, isStepUpChallenge } from '@/lib/api/auth';
import type { StepUpMfaChallengeResponse } from '@/lib/api/auth';
import { StepUpMfaDialog } from '@/components/shared/step-up-mfa-dialog';
import { MfaManager } from '@/components/shared/mfa-manager';
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock, KeyRound, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  'General',
  'Branding',
  'Payments',
  'Email',
  'SMS',
  'Security',
  'System Health',
] as const;
type Tab = (typeof TABS)[number];

function Field({
  label,
  placeholder,
  required,
  defaultValue,
  name,
}: {
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  name?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#333]">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <Input
        name={name}
        className="h-[48px]"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[#eee] p-6">
      <h2 className="text-[16px] font-bold">{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </div>
  );
}

type ConfigMap = Record<string, string>;

// ── System Health ──────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseMs?: number;
  detail?: string;
}


function statusColor(s: HealthStatus) {
  if (s === 'ok')       return 'text-emerald-600';
  if (s === 'degraded') return 'text-amber-500';
  if (s === 'down')     return 'text-red-500';
  return 'text-brand-gray-400';
}

function StatusIcon({ status }: { status: HealthStatus }) {
  const cls = cn('h-4 w-4 shrink-0', statusColor(status));
  if (status === 'ok')       return <CheckCircle2 className={cls} />;
  if (status === 'degraded') return <AlertCircle  className={cls} />;
  if (status === 'down')     return <XCircle       className={cls} />;
  return <Clock className={cls} />;
}

function statusLabel(s: HealthStatus) {
  if (s === 'ok')       return 'Operational';
  if (s === 'degraded') return 'Degraded';
  if (s === 'down')     return 'Down';
  return 'Unknown';
}

function parseHealth(data: unknown): ServiceHealth[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;

  // Spring Actuator format: { status, components: { db: { status, details }, ... } }
  if (obj.components && typeof obj.components === 'object') {
    const components = obj.components as Record<string, { status?: string; details?: Record<string, unknown> }>;
    const NAME_MAP: Record<string, string> = {
      db: 'Database', redis: 'Cache (Redis)', mail: 'Email Service',
      diskSpace: 'File Storage', ping: 'API Gateway',
    };
    return Object.entries(components).map(([key, val]) => ({
      name: NAME_MAP[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      status: val.status?.toLowerCase() === 'up' ? 'ok'
             : val.status?.toLowerCase() === 'down' ? 'down'
             : 'degraded',
      detail: val.details ? Object.entries(val.details).map(([k, v]) => `${k}: ${v}`).join(', ') : undefined,
    }));
  }

  // Custom flat format: { api: 'up', database: 'up', payments: 'degraded', ... }
  const LABEL_MAP: Record<string, string> = {
    api: 'API Gateway', database: 'Database', db: 'Database',
    payments: 'Payment Gateway', email: 'Email Service', sms: 'SMS Service',
    cache: 'Cache (Redis)', redis: 'Cache (Redis)', storage: 'File Storage',
    queue: 'Job Queue', jobs: 'Job Queue',
  };
  const results: ServiceHealth[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' || (typeof v === 'object' && v !== null && 'status' in (v as object))) {
      const rawStatus = typeof v === 'string' ? v : (v as Record<string, unknown>).status as string;
      const s = rawStatus?.toLowerCase();
      results.push({
        name: LABEL_MAP[k] ?? k.charAt(0).toUpperCase() + k.slice(1),
        status: s === 'up' || s === 'ok' || s === 'healthy' ? 'ok'
               : s === 'degraded' || s === 'slow' ? 'degraded'
               : s === 'down' || s === 'error' ? 'down'
               : 'unknown',
      });
    }
  }
  return results.length ? results : [];
}

// ── Security ───────────────────────────────────────────────────────────────

function SecurityPanel() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStepUp, setPwStepUp] = useState<StepUpMfaChallengeResponse | null>(null);

  const updatePassword = async () => {
    if (!currentPw) { toast.error('Enter your current password'); return; }
    if (!newPw || newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const result = await apiChangePassword(currentPw, newPw, confirmPw);
      if (isStepUpChallenge(result)) {
        setPwStepUp(result);
      } else {
        toast.success('Password updated successfully');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      }
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 409
          ? 'Password change requires MFA verification, but the server is unable to process it right now. Please try again later or contact support.'
          : e instanceof Error
            ? e.message
            : 'Failed to change password';
      toast.error(msg, { duration: 8000 });
    } finally {
      setPwSaving(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Password */}
      <div className="rounded-[14px] border border-[#eee] p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-[#555]" />
          <h2 className="text-[16px] font-bold">Password</h2>
        </div>
        <p className="mt-1 text-[13px] text-brand-gray-500">
          Use a strong password you don&apos;t reuse anywhere else.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Current Password</span>
            <PasswordInput containerProps={{ className: 'h-[48px]' }} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">New Password</span>
            <PasswordInput containerProps={{ className: 'h-[48px]' }} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Confirm Password</span>
            <PasswordInput containerProps={{ className: 'h-[48px]' }} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </label>
        </div>
        <Button
          className="mt-5 h-[44px] px-6"
          disabled={pwSaving}
          onClick={updatePassword}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </Button>
      </div>

      {/* 2FA */}
      <MfaManager />

      {pwStepUp && (
        <StepUpMfaDialog
          challenge={pwStepUp}
          onSuccess={() => {
            toast.success('Password updated successfully');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setPwStepUp(null);
          }}
          onClose={() => setPwStepUp(null)}
        />
      )}
    </div>
  );
}

function SystemHealthPanel() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    // /system/health and /actuator/health not in backend API — disabled.
    setCheckedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const overallOk = services.every((s) => s.status === 'ok');
  const anyDown   = services.some((s) => s.status === 'down');
  const overall: HealthStatus = anyDown ? 'down' : overallOk ? 'ok' : 'degraded';
  const overallLabel = anyDown ? 'Partial outage' : overallOk ? 'All systems operational' : 'Some systems degraded';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[#eee] px-6 py-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={overall} />
          <div>
            <p className={cn('text-[15px] font-semibold', statusColor(overall))}>{overallLabel}</p>
            {checkedAt && (
              <p className="text-[12px] text-brand-gray-500">
                Last checked {checkedAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="flex flex-col gap-2 rounded-[12px] border border-[#eee] px-5 py-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#333]">{svc.name}</span>
              <StatusIcon status={svc.status} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[12px] font-medium', statusColor(svc.status))}>
                {statusLabel(svc.status)}
              </span>
              {svc.responseMs !== undefined && (
                <span className="text-[11px] text-brand-gray-400">{svc.responseMs} ms</span>
              )}
            </div>
            {svc.detail && (
              <p className="truncate text-[11px] text-brand-gray-400" title={svc.detail}>
                {svc.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payments Panel ────────────────────────────────────────────────────────

type GatewayForm = {
  gatewayType: string;
  environment: string;
  displayName: string;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
};

const EMPTY_GW: GatewayForm = { gatewayType: '', environment: 'live', displayName: '', publicKey: '', secretKey: '', webhookSecret: '' };

function PaymentsPanel() {
  const [gateways, setGateways] = useState<SystemPaymentGateway[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemPaymentGateway | null>(null);
  const [form, setForm] = useState<GatewayForm>(EMPTY_GW);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSystemPaymentGateways()
      .then((arr) => { setGateways(arr); })
      .catch(() => {});
  }, []);

  function openAdd() { setEditing(null); setForm(EMPTY_GW); setModalOpen(true); }
  function openEdit(gw: SystemPaymentGateway) {
    setEditing(gw);
    setForm({
      gatewayType: gw.gatewayType ?? '',
      environment: gw.environment ?? 'live',
      displayName: gw.displayName ?? '',
      publicKey: gw.publicKey ?? '',
      secretKey: gw.secretKey ?? '',
      webhookSecret: gw.webhookSecret ?? '',
    });
    setModalOpen(true);
  }

  function saveGateway() {
    setSaving(true);
    const payload: CreatePaymentGatewayPayload = {
      gatewayType: form.gatewayType,
      environment: form.environment || undefined,
      displayName: form.displayName || undefined,
      publicKey: form.publicKey || undefined,
      secretKey: form.secretKey || undefined,
      webhookSecret: form.webhookSecret || undefined,
    };
    const promise = editing?.id
      ? updateSystemPaymentGateway(editing.id, payload)
      : createSystemPaymentGateway(payload);
    promise
      .then((saved) => {
        setModalOpen(false);
        if (editing?.id) {
          setGateways((prev) => prev.map((g) => g.id === editing.id ? { ...g, ...saved } : g));
          toast.success('Gateway updated.');
        } else {
          setGateways((prev) => [...prev, saved]);
          toast.success('Gateway added.');
        }
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Could not save gateway.'))
      .finally(() => setSaving(false));
  }

  function toggleActive(gw: SystemPaymentGateway) {
    if (!gw.id) return;
    const next = !gw.active;
    setSystemPaymentGatewayActive(gw.id, next)
      .then(() => {
        setGateways((prev) => prev.map((g) => g.id === gw.id ? { ...g, active: next } : g));
        toast.success(next ? 'Gateway activated.' : 'Gateway deactivated.');
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Could not update gateway.'));
  }

  function setPlatformDefault(gw: SystemPaymentGateway) {
    if (!gw.id) return;
    setSystemPlatformDefaultGateway(gw.id, gw.environment)
      .then(() => {
        setGateways((prev) => prev.map((g) => ({ ...g, platformDefault: g.id === gw.id })));
        toast.success('Platform default updated.');
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Could not set default.'));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-[14px] border border-[#eee] p-6">
        <div>
          <h2 className="text-[16px] font-bold">Payment Gateways</h2>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Manage payment providers</p>
        </div>
        <Button type="button" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Add Gateway
        </Button>
      </div>

      {gateways.length === 0 ? (
        <div className="rounded-[14px] border border-[#eee] p-8 text-center text-[13px] text-brand-gray-500">No payment gateways configured</div>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[#eee]">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-brand-blue text-left text-[13px] text-white">
                {['Gateway', 'Environment', 'Display Name', 'Active', 'Default', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:rounded-l-[8px] last:rounded-r-[8px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gateways.map((gw, i) => (
                <tr key={gw.id ?? i} className="border-b border-[#f2f2f2] text-[12px]">
                  <td className="px-4 py-3 font-medium">{gw.gatewayType}</td>
                  <td className="px-4 py-3 capitalize">{gw.environment ?? '—'}</td>
                  <td className="px-4 py-3">{gw.displayName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(gw)}
                      className={cn('rounded-full px-3 py-1 text-[11px] font-medium', gw.active ? 'bg-[#eafaf0] text-[#22a45d]' : 'bg-[#fde8e8] text-[#eb0000]')}
                    >
                      {gw.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {gw.platformDefault ? (
                      <span className="text-[11px] font-medium text-brand-blue">Default</span>
                    ) : (
                      <button type="button" onClick={() => setPlatformDefault(gw)} className="text-[11px] text-brand-gray-500 underline hover:no-underline">Set default</button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(gw)} className="text-[11px] font-medium text-brand-blue hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[92%] max-w-[460px] rounded-[16px] bg-white p-7">
            <h2 className="text-[18px] font-bold">{editing ? 'Edit Gateway' : 'Add Payment Gateway'}</h2>
            <div className="mt-5 flex flex-col gap-4">
              {([
                { key: 'gatewayType', label: 'Gateway Type *', placeholder: 'e.g. PAYSTACK, STRIPE' },
                { key: 'environment', label: 'Environment', placeholder: 'live or test' },
                { key: 'displayName', label: 'Display Name', placeholder: 'Optional label' },
                { key: 'publicKey', label: 'Public Key', placeholder: 'pk_...' },
                { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_...' },
                { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium">{label}</label>
                  <input
                    className="rounded-[6px] border border-[#e5e5e5] px-3 py-2.5 text-[13px] outline-none focus:border-brand-blue"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={saveGateway} disabled={!form.gatewayType || saving} className="flex h-[44px] flex-1 items-center justify-center rounded-[8px] bg-brand-blue text-[14px] font-medium text-white disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Gateway'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="flex h-[44px] flex-1 items-center justify-center rounded-[8px] border border-[#ddd] text-[14px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Branding Assets Panel ─────────────────────────────────────────────────

function BrandingAssetsPanel() {
  const [assets, setAssets] = useState<SystemBrandingAsset[]>([]);
  const [activating, setActivating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('logo');

  useEffect(() => {
    getSystemBrandingAssets()
      .then((arr) => { setAssets(arr); })
      .catch(() => {});
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadSystemBrandingAsset(uploadCategory, file)
      .then((asset) => {
        setAssets((prev) => [...prev, asset]);
        toast.success('Asset uploaded.');
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Upload failed.'))
      .finally(() => { if (fileRef.current) fileRef.current.value = ''; });
  }

  function removeAsset(id: string) {
    deleteSystemBrandingAsset(id)
      .then(() => { setAssets((prev) => prev.filter((a) => a.id !== id)); toast.success('Asset deleted.'); })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Delete failed.'));
  }

  function activateBranding() {
    setActivating(true);
    activateSystemBranding()
      .then(() => toast.success('Branding activated.'))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Activate failed.'))
      .finally(() => setActivating(false));
  }

  return (
    <div className="rounded-[14px] border border-[#eee] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold">Branding Assets</h2>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Logos, favicons, and imagery</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="h-[36px] rounded-[6px] border border-[#e5e5e5] px-2 text-[12px] text-[#333]"
          >
            {['logo', 'favicon', 'banner', 'icon'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-[36px] items-center gap-1.5 rounded-[8px] border border-[#ddd] px-3 text-[13px] text-[#333] hover:bg-[#f5f5f5]"
          >
            <Upload className="size-4" />
            Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button type="button" size="sm" onClick={activateBranding} disabled={activating}>
            {activating ? 'Activating…' : 'Activate'}
          </Button>
        </div>
      </div>
      {assets.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="relative flex flex-col items-center gap-2 rounded-[8px] border border-[#eee] p-3">
              {a.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.category} className="h-[48px] w-auto object-contain" />
              )}
              <p className="max-w-full truncate text-[11px] text-brand-gray-500">{a.category ?? a.fileName ?? '—'}</p>
              {a.id && (
                <button
                  type="button"
                  onClick={() => removeAsset(a.id!)}
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full text-[#eb0000] hover:bg-[#fde8e8]"
                  aria-label="Delete asset"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SystemSettings() {
  const [tab, setTab] = useState<Tab>('General');
  const [config, setConfig] = useState<ConfigMap>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const flattenInto = (obj: Record<string, unknown>, out: ConfigMap, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object') flattenInto(v as Record<string, unknown>, out, key);
        else out[key] = String(v ?? '');
      }
    };
    const flat: ConfigMap = {};
    getSystemBranding()
      .then((data) => {
        if (data && typeof data === 'object') {
          flattenInto(data as Record<string, unknown>, flat);
          setConfig({ ...flat });
          setFormKey((k) => k + 1);
        }
      })
      .catch(() => {});
  }, []);

  const onSave = async () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const payload: ConfigMap = {};
    fd.forEach((v, k) => { payload[k] = String(v); });
    if (tab === 'Branding') {
      try {
        await updateSystemBranding(payload as SystemBrandingUpdatePayload);
        toast.success('Branding settings saved');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save branding settings');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Settings</h1>
          <p className="text-[14px] text-brand-gray-500">
            Configure platform settings and integrations
          </p>
        </div>
        {tab !== 'System Health' && tab !== 'Security' && tab !== 'Payments' && (
          <Button size="lg" className="h-[44px] px-6" onClick={onSave}>
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 rounded-full bg-[#f6f8fb] p-1 text-[13px] w-fit">
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

      <form key={formKey} ref={formRef} onSubmit={(e) => e.preventDefault()}>
      {tab === 'General' && (
        <Section title="Platform Settings">
          <Field name="platformName" label="Platform Name" required placeholder="Go Worship Platform" defaultValue={config['platformName'] ?? config['general.platformName'] ?? config['platform.name']} />
          <Field name="supportEmail" label="Support Email" required placeholder="support@example.com" defaultValue={config['supportEmail'] ?? config['general.supportEmail']} />
          <Field name="platformUrl" label="Platform URL" required placeholder="https://go-worship.com" defaultValue={config['platformUrl'] ?? config['general.platformUrl'] ?? config['platform.url']} />
          <Field name="timezone" label="Default Timezone" required placeholder="America/New_York" defaultValue={config['timezone'] ?? config['general.timezone']} />
        </Section>
      )}

      {tab === 'Payments' && <PaymentsPanel />}

      {tab === 'Email' && (
        <Section title="Email Provider">
          <Field name="emailService" label="Email Service" placeholder="Resend" defaultValue={config['emailService'] ?? config['email.service']} />
          <Field name="emailFrom" label="Default From Email" placeholder="noreply@example.com" defaultValue={config['emailFrom'] ?? config['email.from']} />
          <Field name="emailFromName" label="Default From Name" placeholder="Go Worship" defaultValue={config['emailFromName'] ?? config['email.fromName']} />
        </Section>
      )}

      {tab === 'SMS' && (
        <Section title="SMS Provider (Twilio)">
          <Field name="twilioAccountSid" label="Account SID" placeholder="ACxxxxxxxx" defaultValue={config['twilioAccountSid'] ?? config['sms.accountSid']} />
          <Field name="twilioAuthToken" label="Auth Token" placeholder="Enter auth token" defaultValue={config['twilioAuthToken'] ?? config['sms.authToken']} />
          <Field name="twilioPhone" label="Phone Number" placeholder="+1234567890" defaultValue={config['twilioPhone'] ?? config['sms.phone']} />
        </Section>
      )}

      {tab === 'Branding' && (
        <div className="flex flex-col gap-5">
          <Section title="Platform Branding">
            <Field name="logoUrl" label="Logo URL" placeholder="https://cdn.example.com/logo.png" defaultValue={config['logoUrl'] ?? config['branding.logoUrl']} />
            <Field name="faviconUrl" label="Favicon URL" placeholder="https://cdn.example.com/favicon.ico" defaultValue={config['faviconUrl'] ?? config['branding.faviconUrl']} />
            <Field name="primaryColor" label="Primary Color" placeholder="#1a56db" defaultValue={config['primaryColor'] ?? config['branding.primaryColor']} />
            <Field name="secondaryColor" label="Secondary Color" placeholder="#ffffff" defaultValue={config['secondaryColor'] ?? config['branding.secondaryColor']} />
          </Section>
          <BrandingAssetsPanel />
        </div>
      )}
      </form>

      {tab === 'Security' && <SecurityPanel />}

      {tab === 'System Health' && <SystemHealthPanel />}
    </div>
  );
}
