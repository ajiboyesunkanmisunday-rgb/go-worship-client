'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { SecuritySettings } from '@/components/shared/security-settings';

/**
 * System → Settings (778:38441). Tabs General / Payments / Email / SMS /
 * System Health with heading "Configure platform settings and integrations"
 * and a Save Changes action. Distinct from the Ministry settings the page used
 * to (wrongly) reuse.
 *
 * NOTE: the General / Payments / Email / SMS tab fields are taken from the
 * design. The **System Health** tab's content was not captured legibly, so it
 * shows a minimal honest placeholder rather than invented content — flagged in
 * docs/design-audit.md.
 */
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

export function SystemSettings() {
  const [tab, setTab] = useState<Tab>('General');
  const [config, setConfig] = useState<ConfigMap>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/system/config') as Promise<unknown>)
      .catch(() => api.get<unknown>('/system/settings') as Promise<unknown>)
      .then((data) => {
        if (data && typeof data === 'object') {
          const flat: ConfigMap = {};
          const walk = (obj: Record<string, unknown>, prefix = '') => {
            for (const [k, v] of Object.entries(obj)) {
              const key = prefix ? `${prefix}.${k}` : k;
              if (v !== null && typeof v === 'object') walk(v as Record<string, unknown>, key);
              else flat[key] = String(v ?? '');
            }
          };
          walk(data as Record<string, unknown>);
          setConfig(flat);
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
        {tab !== 'Security' && tab !== 'System Health' && (
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

      {tab === 'Branding' && (
        <Section title="Platform Branding">
          <Field name="brandName" label="Brand Name" placeholder="Leadremit" defaultValue={config['brandName'] ?? config['branding.name']} />
          <Field name="brandLogoUrl" label="Logo URL" placeholder="https://cdn.example.com/logo.svg" defaultValue={config['brandLogoUrl'] ?? config['branding.logoUrl']} />
          <Field name="brandPrimaryColor" label="Primary Color" placeholder="#152242" defaultValue={config['brandPrimaryColor'] ?? config['branding.primaryColor']} />
          <Field name="brandAccentColor" label="Accent Color" placeholder="#FAA220" defaultValue={config['brandAccentColor'] ?? config['branding.accentColor']} />
          <Field name="brandFaviconUrl" label="Favicon URL" placeholder="https://cdn.example.com/favicon.ico" defaultValue={config['brandFaviconUrl'] ?? config['branding.faviconUrl']} />
          <Field name="brandSupportUrl" label="Support / Help URL" placeholder="https://help.example.com" defaultValue={config['brandSupportUrl'] ?? config['branding.supportUrl']} />
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
      </form>

      {tab === 'Security' && (
        <div className="rounded-[14px] border border-[#eee] p-6">
          <SecuritySettings />
        </div>
      )}

      {tab === 'System Health' && (
        <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#ddd] py-16 text-center">
          <p className="text-[14px] font-medium">System Health</p>
          <p className="max-w-[360px] text-[12px] text-brand-gray-500">
            The System Health panel&apos;s design isn&apos;t captured yet, so its
            content is intentionally left blank rather than invented.
          </p>
        </div>
      )}
    </div>
  );
}
