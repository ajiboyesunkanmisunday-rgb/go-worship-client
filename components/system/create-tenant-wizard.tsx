'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResultModal } from '@/components/system/result-modal';
import { StepUpMfaDialog, isStepUpChallenge } from '@/components/shared/step-up-mfa-dialog';
import type { StepUpMfaChallengeResponse } from '@/components/shared/step-up-mfa-dialog';
import { provisionTenant } from '@/lib/api/system';
import { ApiError, api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

/**
 * "Create New Tenant" — the 3-step wizard from the System board (778:38441,
 * "Add Tenants" row): Basic Info → Plan → Review & Confirm, then a Successful /
 * Error result modal. Full-page (inside the System portal shell), not a
 * slide-over — this matches the design, which the earlier single-page
 * tenant-form did not.
 *
 * Domain toggle (2026-08-30 fix): the form now has a Hosted subdomain / Custom
 * domain toggle. Subdomain → bare label in `subDomain`, customDomain=null.
 * Custom → full domain in `customDomain`, subDomain=null. `slug` is always
 * derived from the church name (dot-free, alphanumeric + hyphens).
 */

type DomainType = 'subdomain' | 'custom';

type Basic = {
  churchName: string;
  domainType: DomainType;
  subdomainLabel: string;
  customDomain: string;
  churchEmail: string;
  phone: string;
  adminName: string;
  adminEmail: string;
};

type Billing = 'Monthly' | 'Quarterly' | 'Annually';

type Plan = { key: string; tier: string; price: string };

const DEFAULT_PLANS: Plan[] = [
  { key: 'starter', tier: 'Starter', price: '$0' },
  { key: 'professional', tier: 'Professional', price: '$70,000' },
  { key: 'enterprise', tier: 'Enterprise', price: '$250,000' },
];

const FEATURES = [
  'Omni-channel inbox (WhatsApp, IG DM, Messenger)',
  'Mini-store builder',
  'Auto-payment confirmation',
  '10 AI-agent conversations / month',
];

const STEPS = [
  { n: 1, title: 'Basic Info', sub: 'Church details' },
  { n: 2, title: 'Plan', sub: 'Select a plan' },
  { n: 3, title: 'Review', sub: 'Confirm details' },
] as const;

/** Derives a slug from a church name: lowercase alphanum + hyphens, no dots. */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const current = step === s.n;
        return (
          <div key={s.n} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-full text-[15px] font-semibold',
                  done || current
                    ? 'bg-brand-blue text-white'
                    : 'border border-brand-gray-300 text-brand-gray-500'
                )}
              >
                {done || current ? (
                  <Check className="size-5" strokeWidth={3} />
                ) : (
                  s.n
                )}
              </span>
              <div className="text-center">
                <p className="text-[14px] font-bold">{s.title}</p>
                <p className="text-[12px] text-brand-gray-500">{s.sub}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <span className="mx-2 mt-5 h-px flex-1 bg-brand-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#333]">{label}</span>
      {children}
    </label>
  );
}

function Req() {
  return <span className="text-destructive">*</span>;
}

export function CreateTenantWizard() {
  const router = useRouter();
  const back = '/system/tenants';

  const [plans, setPlans] = useState<Plan[]>(USE_LIVE_API ? [] : DEFAULT_PLANS);
  const [step, setStep] = useState(1);
  const [basic, setBasic] = useState<Basic>({
    churchName: '',
    domainType: 'subdomain',
    subdomainLabel: '',
    customDomain: '',
    churchEmail: '',
    phone: '',
    adminName: '',
    adminEmail: '',
  });
  const [billing, setBilling] = useState<Billing>('Quarterly');
  const [plan, setPlan] = useState<string>('professional');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/system/billing/plans') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: Plan[] = arr.map((p) => {
          const rawPrice = Number(p['price'] ?? p['amount'] ?? p['monthlyPrice'] ?? 0);
          const price = rawPrice ? `$${rawPrice.toLocaleString()}` : String(p['priceLabel'] ?? p['price'] ?? '$0');
          return {
            key: String(p['key'] ?? p['planKey'] ?? p['code'] ?? p['id'] ?? ''),
            tier: String(p['name'] ?? p['tier'] ?? p['displayName'] ?? ''),
            price,
          };
        }).filter((p) => p.key && p.tier);
        if (mapped.length > 0) setPlans(mapped);
      })
      .catch(() => {});
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | null>(null);
  const [challenge, setChallenge] = useState<StepUpMfaChallengeResponse | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const set = (k: keyof Basic) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBasic((b) => ({ ...b, [k]: e.target.value }));

  const selectedPlan = (plans.find((p) => p.key === plan) ?? plans[0])!;

  const domainDisplay =
    basic.domainType === 'subdomain'
      ? basic.subdomainLabel
        ? `${basic.subdomainLabel}.go-worship.com`
        : '—'
      : basic.customDomain || '—';

  const handleCreate = async () => {
    if (!USE_LIVE_API) {
      setResult('success');
      return;
    }

    setEnrollError(null);
    setSubmitting(true);
    const slug = slugify(basic.churchName);
    try {
      const data = await provisionTenant({
        tenant: {
          name: basic.churchName,
          shortName: basic.churchName.substring(0, 20),
          slug,
          billingEmail: basic.churchEmail,
          subDomain: basic.domainType === 'subdomain' ? basic.subdomainLabel || null : null,
          customDomain: basic.domainType === 'custom' ? basic.customDomain || null : null,
          countryCode: 'US',
          currency: 'USD',
        },
        adminEmail: basic.adminEmail,
      });

      if (isStepUpChallenge(data)) {
        setChallenge(data);
      } else {
        setResult('success');
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        const code = (e.body as Record<string, unknown>)?.code;
        if (code === 'MFA_ENROLLMENT_REQUIRED') {
          setEnrollError(
            'Two-factor authentication is required to provision tenants. Go to Settings → Security to enable 2FA first.'
          );
          return;
        }
      }
      toast.error(e instanceof Error ? e.message : 'Failed to create tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1160px]">
      {/* Step-up MFA dialog — rendered outside the normal flow (fixed overlay) */}
      {challenge && (
        <StepUpMfaDialog
          challenge={challenge}
          onSuccess={() => {
            setChallenge(null);
            setResult('success');
          }}
          onClose={() => setChallenge(null)}
        />
      )}

      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : router.push(back))}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-[26px] font-bold">Create New Tenant</h1>
          <p className="text-[14px] text-brand-gray-500">
            Set up a new church on the platform
          </p>
        </div>

        {step === 2 && (
          <div className="ml-auto flex rounded-full bg-[#eef1f6] p-1 text-[13px]">
            {(['Monthly', 'Quarterly', 'Annually'] as Billing[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={cn(
                  'rounded-full px-5 py-2 transition-colors',
                  billing === b
                    ? 'bg-white font-medium text-black shadow-sm'
                    : 'text-brand-gray-500'
                )}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      <Stepper step={step} />

      {/* ---------------- Step 1: Basic Info ---------------- */}
      {step === 1 && (
        <form
          className="mt-10 rounded-[14px] bg-[#f7f9fc] p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <h2 className="text-[18px] font-bold">Basic Information</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label={<>Church Name<Req /></>}>
              <Input
                className="h-[48px] bg-white"
                placeholder="Enter church name"
                value={basic.churchName}
                onChange={set('churchName')}
                required
              />
            </Field>

            {/* Domain toggle + conditional input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#333]">
                Domain<Req />
              </span>
              <div className="flex rounded-[8px] bg-white border border-[#e5e7eb] p-0.5 text-[12px]">
                {(['subdomain', 'custom'] as DomainType[]).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setBasic((b) => ({ ...b, domainType: dt }))}
                    className={cn(
                      'flex-1 rounded-[6px] px-3 py-1.5 transition-colors',
                      basic.domainType === dt
                        ? 'bg-brand-blue text-white font-medium'
                        : 'text-brand-gray-500'
                    )}
                  >
                    {dt === 'subdomain' ? 'Hosted subdomain' : 'Custom domain'}
                  </button>
                ))}
              </div>
              {basic.domainType === 'subdomain' ? (
                <div className="flex items-center gap-0">
                  <Input
                    className="h-[48px] bg-white rounded-r-none border-r-0"
                    placeholder="yourchurch"
                    value={basic.subdomainLabel}
                    onChange={set('subdomainLabel')}
                    required
                  />
                  <span className="flex h-[48px] items-center rounded-r-[8px] border border-l-0 border-[#e5e7eb] bg-[#f7f9fc] px-3 text-[13px] text-brand-gray-500 whitespace-nowrap">
                    .go-worship.com
                  </span>
                </div>
              ) : (
                <Input
                  className="h-[48px] bg-white"
                  placeholder="worship.yourchurch.org"
                  value={basic.customDomain}
                  onChange={set('customDomain')}
                  required
                />
              )}
            </div>

            <Field label={<>Church Email<Req /></>}>
              <Input
                type="email"
                className="h-[48px] bg-white"
                placeholder="Enter church email here"
                value={basic.churchEmail}
                onChange={set('churchEmail')}
                required
              />
            </Field>
            <Field label={<>Phone Number<Req /></>}>
              <Input
                className="h-[48px] bg-white"
                placeholder="+1234567890"
                value={basic.phone}
                onChange={set('phone')}
                required
              />
            </Field>
            <Field label={<>Primary Admin Name<Req /></>}>
              <Input
                className="h-[48px] bg-white"
                placeholder="Enter Primary Admin Name"
                value={basic.adminName}
                onChange={set('adminName')}
                required
              />
            </Field>
            <Field label={<>Primary Admin Email<Req /></>}>
              <Input
                type="email"
                className="h-[48px] bg-white"
                placeholder="admin@yourchurch.org"
                value={basic.adminEmail}
                onChange={set('adminEmail')}
                required
              />
            </Field>
          </div>
          <div className="mt-8 flex justify-center">
            <Button size="lg" type="submit" className="h-[48px] w-[280px]">
              Continue
            </Button>
          </div>
        </form>
      )}

      {/* ---------------- Step 2: Plan ---------------- */}
      {step === 2 && (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((p) => {
            const active = p.key === plan;
            return (
              <div
                key={p.key}
                className={cn(
                  'flex flex-col gap-5 rounded-[16px] p-6',
                  active
                    ? 'bg-brand-blue text-white'
                    : 'bg-[#f7f9fc] text-black'
                )}
              >
                <div
                  className={cn(
                    'rounded-[12px] p-5',
                    active ? 'bg-white/10' : 'bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block rounded-full border px-3 py-1 text-[12px]',
                      active
                        ? 'border-white/40'
                        : 'border-brand-gray-300 text-brand-gray-600'
                    )}
                  >
                    {p.tier}
                  </span>
                  <p className="mt-4 text-[34px] font-bold leading-none">
                    {p.price}
                    <span
                      className={cn(
                        'ml-1 text-[13px] font-normal',
                        active ? 'text-white/70' : 'text-brand-gray-500'
                      )}
                    >
                      /{' '}
                      {billing === 'Annually'
                        ? 'Year'
                        : billing === 'Monthly'
                        ? 'Month'
                        : 'Quarter'}
                    </span>
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-[13px]',
                      active ? 'text-white/70' : 'text-brand-gray-500'
                    )}
                  >
                    Perfect for getting started.
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-bold">Features You&apos;ll Love:</p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {FEATURES.map((f) => (
                      <li
                        key={f}
                        className={cn(
                          'flex gap-2 text-[12px]',
                          active ? 'text-white/90' : 'text-[#333]'
                        )}
                      >
                        <span aria-hidden>•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="lg"
                  variant={active ? 'outline' : 'default'}
                  className={cn(
                    'mt-auto h-[48px] w-full',
                    active &&
                      'border-white bg-white text-brand-blue hover:bg-white/90'
                  )}
                  onClick={() => {
                    setPlan(p.key);
                    setStep(3);
                  }}
                >
                  Continue
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Step 3: Review & Confirm ---------------- */}
      {step === 3 && (
        <div className="mt-10">
          <h2 className="text-[18px] font-bold text-brand-blue">
            Review &amp; Confirm
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            <Review label="Church name" value={basic.churchName || '—'} />
            <Review label="Domain" value={domainDisplay} />
            <Review
              label="Domain type"
              value={basic.domainType === 'subdomain' ? 'Hosted subdomain' : 'Custom domain'}
            />
            <Review label="Church Email" value={basic.churchEmail || '—'} />
            <Review label="Primary Admin" value={basic.adminName || '—'} />
            <Review label="Primary Admin email" value={basic.adminEmail || '—'} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-[#f7f9fc] px-6 py-6">
            <div>
              <p className="text-[16px] font-bold text-brand-blue">
                Selected Plan
              </p>
              <span className="mt-2 inline-block rounded-full border border-brand-blue/30 px-3 py-1 text-[12px] text-brand-blue">
                {selectedPlan.tier}
              </span>
            </div>
            <p className="text-[30px] font-bold">
              {selectedPlan.price}
              <span className="ml-1 text-[13px] font-normal text-brand-gray-500">
                /{' '}
                {billing === 'Annually'
                  ? 'Year'
                  : billing === 'Monthly'
                  ? 'Month'
                  : 'Quarter'}
              </span>
            </p>
          </div>

          {enrollError && (
            <div className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-700">
              {enrollError}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="h-[48px] w-[280px]"
              disabled={submitting}
              onClick={handleCreate}
            >
              {submitting ? 'Creating…' : 'Create Tenant'}
            </Button>
          </div>
        </div>
      )}

      <ResultModal
        variant="success"
        open={result === 'success'}
        onOpenChange={(v) => !v && setResult(null)}
        message="Your tenant was successfully created on the platform."
        actionLabel="View Details"
        onAction={() => router.push(back)}
      />
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0f3f9]">
        <Check className="size-4 text-brand-gray-500" />
      </span>
      <div>
        <p className="text-[12px] text-brand-gray-500">{label}</p>
        <p className="text-[14px] font-medium text-[#333]">{value}</p>
      </div>
    </div>
  );
}
