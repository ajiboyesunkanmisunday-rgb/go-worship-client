'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock, KeyRound, ShieldCheck, MessageSquare, Smartphone } from 'lucide-react';

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

const MOCK_HEALTH: ServiceHealth[] = [
  { name: 'API Gateway',        status: 'ok',       responseMs: 42 },
  { name: 'Database',           status: 'ok',       responseMs: 8  },
  { name: 'Payment Gateway',    status: 'ok',       responseMs: 210 },
  { name: 'Email Service',      status: 'ok',       responseMs: 95 },
  { name: 'SMS Service',        status: 'ok',       responseMs: 130 },
  { name: 'Cache (Redis)',       status: 'ok',       responseMs: 2  },
  { name: 'File Storage',       status: 'ok',       responseMs: 55 },
  { name: 'Job Queue',          status: 'ok',       responseMs: 18 },
];

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

type MfaData = {
  mfaEnabled: boolean;
  preferredMethod: string;
  totpEnrolled: boolean;
  otpEmailAvailable: boolean;
  otpSmsAvailable: boolean;
  enrolledMethods: string[];
};

function SecurityPanel() {
  const [mfa, setMfa] = useState<MfaData | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<Record<string, unknown>>('/self/security/mfa') as Promise<Record<string, unknown>>)
      .then((res) => {
        const d = (res['data'] ?? res) as Record<string, unknown>;
        setMfa({
          mfaEnabled:        Boolean(d['mfaEnabled']),
          preferredMethod:   String(d['preferredMethod'] ?? ''),
          totpEnrolled:      Boolean(d['totpEnrolled']),
          otpEmailAvailable: Boolean(d['otpEmailAvailable'] ?? true),
          otpSmsAvailable:   Boolean(d['otpSmsAvailable']),
          enrolledMethods:   Array.isArray(d['enrolledMethods']) ? (d['enrolledMethods'] as string[]) : [],
        });
      })
      .catch(() => {});
  }, []);

  const updatePassword = async () => {
    if (!newPw || newPw !== confirmPw) return;
    setPwSaving(true);
    try {
      await (api.put('/self/security/password', { currentPassword: currentPw, newPassword: newPw }) as Promise<unknown>);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { /* keep form */ }
    finally { setPwSaving(false); }
  };

  const removeMethod = (method: string) => {
    if (!USE_LIVE_API) return;
    (api.del(`/self/security/mfa/${method.toLowerCase()}`) as Promise<unknown>)
      .then(() => setMfa((prev) => prev ? { ...prev, enrolledMethods: prev.enrolledMethods.filter((m) => m !== method), totpEnrolled: method === 'TOTP' ? false : prev.totpEnrolled } : prev))
      .catch(() => {});
  };

  const methodLabel: Record<string, string> = {
    TOTP: 'Authenticator app',
    OTP_EMAIL: 'Email code',
    OTP_SMS: 'Text message (SMS)',
  };
  const methodDesc: Record<string, string> = {
    TOTP: 'Use Google Authenticator, Authy, or 1Password. Most secure.',
    OTP_EMAIL: 'Receive a one-time code by email each time you sign in.',
    OTP_SMS: 'Receive a one-time code by text message to your phone.',
  };
  const MethodIcon = ({ method }: { method: string }) => {
    if (method === 'TOTP') return <Smartphone className="size-5 text-[#555]" />;
    if (method === 'OTP_EMAIL') return <ShieldCheck className="size-5 text-[#555]" />;
    return <MessageSquare className="size-5 text-[#555]" />;
  };

  const allMethods = ['TOTP', 'OTP_EMAIL', 'OTP_SMS'];

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
            <div className="relative">
              <Input type="password" className="h-[48px] pr-10" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">New Password</span>
            <Input type="password" className="h-[48px]" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Confirm Password</span>
            <Input type="password" className="h-[48px]" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </label>
        </div>
        <Button
          className="mt-5 h-[44px] px-6"
          disabled={pwSaving || !newPw || newPw !== confirmPw}
          onClick={updatePassword}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </Button>
      </div>

      {/* 2FA */}
      <div className="rounded-[14px] border border-[#eee] p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-bold">Two-factor authentication</h2>
          {mfa && (
            <span className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              mfa.mfaEnabled ? 'bg-[#e7f7ee] text-[#22a45d]' : 'bg-[#fde8e8] text-[#eb0000]'
            )}>
              {mfa.mfaEnabled ? 'On' : 'Off'}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-brand-gray-500">
          Add a second step when signing in, so a password alone isn&apos;t enough.
        </p>

        {mfa && (
          <>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-[10px] bg-[#f7f9fc] px-4 py-3">
              <div>
                <p className="text-[13px] font-medium">Primary method</p>
                <p className="text-[12px] text-brand-gray-500">The method you&apos;ll be asked for first when signing in.</p>
              </div>
              <span className="rounded-[8px] border border-[#ddd] bg-white px-3 py-2 text-[13px]">
                {methodLabel[mfa.preferredMethod] ?? mfa.preferredMethod}
              </span>
            </div>

            <div className="mt-4 flex flex-col divide-y divide-[#f2f2f2]">
              {allMethods.map((method) => {
                const enrolled = mfa.enrolledMethods.includes(method);
                const preferred = mfa.preferredMethod === method;
                const comingSoon = method === 'OTP_SMS' && !mfa.otpSmsAvailable;
                return (
                  <div key={method} className="flex items-start justify-between gap-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f2f2]">
                        <MethodIcon method={method} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 text-[13px] font-medium">
                          {methodLabel[method]}
                          {enrolled && (
                            <span className="flex items-center gap-1 text-[11px] font-normal text-[#22a45d]">
                              <CheckCircle2 className="size-3" /> Enrolled
                            </span>
                          )}
                          {preferred && enrolled && (
                            <span className="rounded-full bg-[#e9f0ff] px-2 py-0.5 text-[10px] text-brand-blue">Preferred</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] text-brand-gray-500">{methodDesc[method]}</p>
                        {comingSoon && (
                          <p className="mt-1 text-[11px] text-brand-gray-400">
                            Coming soon — text-message codes aren&apos;t enabled yet. Set up another method now and switch when SMS is available.
                          </p>
                        )}
                      </div>
                    </div>
                    {comingSoon ? (
                      <span className="shrink-0 rounded-full bg-[#fff4e5] px-2.5 py-1 text-[11px] font-medium text-[#ff8d28]">Coming soon</span>
                    ) : enrolled ? (
                      <button
                        type="button"
                        className="shrink-0 rounded-[6px] border border-[#eb0000] px-3 py-1 text-[12px] font-medium text-[#eb0000] hover:bg-[#fde8e8]"
                        onClick={() => removeMethod(method)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!mfa && USE_LIVE_API && (
          <p className="mt-4 text-[13px] text-brand-gray-400">Loading security settings…</p>
        )}
      </div>
    </div>
  );
}

function SystemHealthPanel() {
  const [services, setServices] = useState<ServiceHealth[]>(USE_LIVE_API ? [] : MOCK_HEALTH);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (USE_LIVE_API) {
      try {
        const data = await (
          api.get<unknown>('/system/health') as Promise<unknown>
        ).catch(() => api.get<unknown>('/actuator/health') as Promise<unknown>);
        const parsed = parseHealth(data);
        if (parsed.length) setServices(parsed);
      } catch {
        // keep current state if both endpoints fail
      }
    }
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

export function SystemSettings() {
  const [tab, setTab] = useState<Tab>('General');
  const [config, setConfig] = useState<ConfigMap>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    const flattenInto = (obj: Record<string, unknown>, out: ConfigMap, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object') flattenInto(v as Record<string, unknown>, out, key);
        else out[key] = String(v ?? '');
      }
    };
    const flat: ConfigMap = {};
    Promise.allSettled([
      (api.get<unknown>('/system/config') as Promise<unknown>)
        .catch(() => api.get<unknown>('/system/settings') as Promise<unknown>),
      api.get<unknown>('/system/branding') as Promise<unknown>,
    ]).then(([configRes, brandingRes]) => {
      if (configRes.status === 'fulfilled' && configRes.value && typeof configRes.value === 'object') {
        flattenInto(configRes.value as Record<string, unknown>, flat);
      }
      if (brandingRes.status === 'fulfilled' && brandingRes.value && typeof brandingRes.value === 'object') {
        flattenInto(brandingRes.value as Record<string, unknown>, flat, 'branding');
      }
      if (Object.keys(flat).length > 0) {
        setConfig(flat);
        setFormKey((k) => k + 1);
      }
    });
  }, []);

  const onSave = async () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const payload: ConfigMap = {};
    fd.forEach((v, k) => { payload[k] = String(v); });
    if (USE_LIVE_API) {
      try {
        await (api.put('/system/config', payload) as Promise<unknown>)
          .catch(() => api.put('/system/settings', payload) as Promise<unknown>);
      } catch {}
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
        {tab !== 'System Health' && tab !== 'Security' && (
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

      {tab === 'Payments' && (
        <Section title="Payment Provider (Paystack)">
          <Field name="paystackPublicKey" label="Publishable Key" placeholder="pk_live_..." defaultValue={config['paystackPublicKey'] ?? config['payments.publishableKey']} />
          <Field name="paystackSecretKey" label="Secret Key" placeholder="sk_live_..." defaultValue={config['paystackSecretKey'] ?? config['payments.secretKey']} />
          <Field name="paystackWebhookSecret" label="Webhook Secret" placeholder="whsec_..." defaultValue={config['paystackWebhookSecret'] ?? config['payments.webhookSecret']} />
        </Section>
      )}

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
        <Section title="Platform Branding">
          <Field name="logoUrl" label="Logo URL" placeholder="https://cdn.example.com/logo.png" defaultValue={config['logoUrl'] ?? config['branding.logoUrl']} />
          <Field name="faviconUrl" label="Favicon URL" placeholder="https://cdn.example.com/favicon.ico" defaultValue={config['faviconUrl'] ?? config['branding.faviconUrl']} />
          <Field name="primaryColor" label="Primary Color" placeholder="#1a56db" defaultValue={config['primaryColor'] ?? config['branding.primaryColor']} />
          <Field name="secondaryColor" label="Secondary Color" placeholder="#ffffff" defaultValue={config['secondaryColor'] ?? config['branding.secondaryColor']} />
        </Section>
      )}
      </form>

      {tab === 'Security' && <SecurityPanel />}

      {tab === 'System Health' && <SystemHealthPanel />}
    </div>
  );
}
