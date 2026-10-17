'use client';

import { cn } from '@/lib/utils';
import { TwoFactorModal } from '@/components/ministry/two-factor-modal';
import { PencilLine } from 'lucide-react';
import { useState } from 'react';

const TABS = [
  'Profile',
  'Church branding',
  'Payment & Billing',
  'Notifications',
  'Subscription',
  'Security',
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

function Toggle({ label, on = true }: { label: string; on?: boolean }) {
  const [checked, setChecked] = useState(on);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-4 last:border-0">
      <p className="text-[14px] font-medium">{label}</p>
      <button
        type="button"
        onClick={() => setChecked((c) => !c)}
        className={cn(
          'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-[#22a45d]' : 'bg-brand-gray-300'
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

function SecurityTab() {
  const [twoFactor, setTwoFactor] = useState(false);

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

      <Toggle label="Login alerts" on={false} />

      <TwoFactorModal open={twoFactor} onOpenChange={setTwoFactor} />
    </div>
  );
}

function TabContent({ tab }: { tab: string }) {
  if (tab === 'Profile') {
    return (
      <div className="rounded-[14px] bg-white p-6">
        <Field label="Church Name" value="Celebration Church Int." />
        <Field label="Email" value="admin@celebration.org" />
        <Field label="Phone number" value="(+62) 821 554 - 5432" />
        <Field label="Location" value="Ontario, Canada" />
      </div>
    );
  }
  if (tab === 'Security') {
    return <SecurityTab />;
  }
  if (tab === 'Notifications') {
    return (
      <div className="rounded-[14px] bg-white p-6">
        <Toggle label="Email notifications" on />
        <Toggle label="SMS notifications" on={false} />
        <Toggle label="Push notifications" on />
      </div>
    );
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
