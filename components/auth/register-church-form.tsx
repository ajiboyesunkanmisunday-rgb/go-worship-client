'use client';

/**
 * Church (tenant) self-registration form.
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   TN-001A/B  POST /api/v1/public/tenants/register (via /bff/auth/register-tenant)
 *   { tenant:{name,slug,billingEmail,subDomain,countryCode,currency},
 *     adminEmail, rawPassword, confirmPassword, displayName, phone }
 *
 * Step 1 — church details: name, subdomain, billing email, country, currency
 * Step 2 — admin account: display name, email, password, confirm, phone
 *
 * Captcha is lifted out of the body into headers by the BFF route — the
 * captchaToken field is passed in the request body here and the BFF handles
 * the header promotion (same pattern as /bff/auth/register).
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { registerTenant } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Step = 1 | 2;

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'CA', name: 'Canada' },
] as const;

const CURRENCIES = [
  { code: 'NGN', label: 'NGN — Naira' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GBP', label: 'GBP — Pound Sterling' },
  { code: 'GHS', label: 'GHS — Ghana Cedi' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
] as const;

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-brand-gray-500">{hint}</p>}
    </div>
  );
}

export function RegisterChurchForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [churchName, setChurchName] = useState('');
  const [slug, setSlug] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [countryCode, setCountryCode] = useState('NG');
  const [currency, setCurrency] = useState('NGN');

  // Step 2 fields
  const [displayName, setDisplayName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleChurchNameChange = (v: string) => {
    setChurchName(v);
    if (!slug || slug === slugify(churchName)) {
      setSlug(slugify(v));
    }
  };

  const handleStep1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!churchName.trim() || !slug.trim() || !billingEmail.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!USE_LIVE_API) {
      router.push('/auth/register-church/success');
      return;
    }

    setSubmitting(true);
    try {
      await registerTenant({
        tenant: {
          name: churchName,
          slug: slug,
          billingEmail: billingEmail,
          subDomain: slug,
          countryCode,
          currency,
        },
        adminEmail,
        rawPassword: password,
        confirmPassword,
        displayName,
        phone: phone || undefined,
        captchaToken: 'no-captcha',
      });
      router.push('/auth/register-church/success');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Registration failed. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f6f8fb] p-4">
      <div className="w-full max-w-[520px] rounded-[16px] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={64}
            height={22}
            className="h-[22px] w-[64px]"
          />
          <div className="flex items-center gap-2">
            {([1, 2] as Step[]).map((s) => (
              <div
                key={s}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-[12px] font-medium',
                  step >= s
                    ? 'bg-brand-blue text-white'
                    : 'bg-[#f2f2f2] text-brand-gray-500'
                )}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1} className="flex flex-col gap-5">
            <div>
              <h1 className="text-[24px] font-bold">Register your church</h1>
              <p className="mt-1 text-[14px] text-brand-gray-500">
                Set up your church's presence on Go-Worship.
              </p>
            </div>

            <Field label="Church name" required>
              <Input
                required
                placeholder="e.g. RCCG City of David"
                value={churchName}
                onChange={(e) => handleChurchNameChange(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <Field
              label="Church URL (subdomain)"
              required
              hint={slug ? `Your portal: ${slug}.go-worship.com` : undefined}
            >
              <Input
                required
                placeholder="e.g. rccg-city-of-david"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="h-[46px]"
              />
            </Field>

            <Field label="Billing email" required>
              <Input
                required
                type="email"
                placeholder="billing@yourchurch.org"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Country">
                <NativeSelect
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[46px]"
                >
                  {COUNTRIES.map((c) => (
                    <NativeSelectOption key={c.code} value={c.code}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Currency">
                <NativeSelect
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-[46px]"
                >
                  {CURRENCIES.map((c) => (
                    <NativeSelectOption key={c.code} value={c.code}>
                      {c.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}

            <Button size="lg" type="submit" className="h-[52px] w-full">
              Continue
            </Button>

            <p className="text-center text-[13px] text-brand-gray-500">
              Already registered?{' '}
              <Link href="/auth/login" className="font-medium text-brand-blue">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="flex flex-col gap-5">
            <div>
              <h1 className="text-[24px] font-bold">Create admin account</h1>
              <p className="mt-1 text-[14px] text-brand-gray-500">
                This will be the primary administrator for <strong>{churchName}</strong>.
              </p>
            </div>

            <Field label="Full name" required>
              <Input
                required
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <Field label="Admin email" required>
              <Input
                required
                type="email"
                placeholder="admin@yourchurch.org"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <Field label="Phone">
              <Input
                type="tel"
                placeholder="+1 555 000 0000 (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <Field label="Password" required>
              <Input
                required
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            <Field label="Confirm password" required>
              <Input
                required
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-[46px]"
              />
            </Field>

            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full"
              >
                {submitting ? 'Registering…' : 'Register church'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                type="button"
                className="h-[52px] w-full"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
