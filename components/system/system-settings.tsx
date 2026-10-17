'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  'Payments',
  'Email',
  'SMS',
  'System Health',
] as const;
type Tab = (typeof TABS)[number];

function Field({
  label,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#333]">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <Input
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

export function SystemSettings() {
  const [tab, setTab] = useState<Tab>('General');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Settings</h1>
          <p className="text-[14px] text-brand-gray-500">
            Configure platform settings and integrations
          </p>
        </div>
        <Button size="lg" className="h-[44px] px-6">
          Save Changes
        </Button>
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

      {tab === 'General' && (
        <Section title="Platform Settings">
          <Field label="Platform Name" required placeholder="Go Worship Platform" />
          <Field label="Support Email" required placeholder="support@example.com" />
          <Field label="Platform URL" required placeholder="https://go-worship.com" />
          <Field label="Default Timezone" required placeholder="America/New_York" />
        </Section>
      )}

      {tab === 'Payments' && (
        <Section title="Payment Provider (Paystack)">
          <Field label="Publishable Key" placeholder="pk_live_..." />
          <Field label="Secret Key" placeholder="sk_live_..." />
          <Field label="Webhook Secret" placeholder="whsec_..." />
        </Section>
      )}

      {tab === 'Email' && (
        <Section title="Email Provider">
          <Field label="Email Service" placeholder="Resend" />
          <Field label="Default From Email" placeholder="noreply@example.com" />
          <Field label="Default From Name" placeholder="Go Worship" />
        </Section>
      )}

      {tab === 'SMS' && (
        <Section title="SMS Provider (Twilio)">
          <Field label="Account SID" placeholder="ACxxxxxxxx" />
          <Field label="Auth Token" placeholder="Enter auth token" />
          <Field label="Phone Number" placeholder="+1234567890" />
        </Section>
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
