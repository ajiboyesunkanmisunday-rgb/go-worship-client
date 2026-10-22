'use client';

/**
 * Guest → Customer upgrade form.
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   POST /tenant/admin/users/guests/upgrade-to-customer (via /bff/gw)
 *   { displayName, rawPassword, confirmPassword }
 *
 * This is called while the user already holds a guest session cookie.
 * The /bff/gw proxy forwards the Bearer token from the httpOnly cookie.
 *
 * USE_LIVE_API gate: mock mode shows success toast and redirects immediately.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upgradeGuestToCustomer } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FormAlert } from '@/components/ui/form-alert';

export function UpgradeAccountForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      toast.success('Account upgraded successfully!');
      router.push('/dashboard');
      return;
    }

    setSubmitting(true);
    try {
      await upgradeGuestToCustomer({ displayName, rawPassword: password, confirmPassword });
      toast.success('Account upgraded successfully!');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Upgrade failed. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f6f8fb] p-4">
      <div className="w-full max-w-[480px] rounded-[16px] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={64}
            height={22}
            className="h-[22px] w-[64px]"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-[24px] font-bold">Complete your account</h1>
            <p className="mt-1 text-[14px] text-brand-gray-500">
              Set a password to upgrade from guest to a full member account.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Display name<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              required
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-[46px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Password<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              required
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[46px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Confirm password<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              required
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-[46px]"
            />
          </div>

          {error && <FormAlert variant="error">{error}</FormAlert>}

          <Button size="lg" type="submit" disabled={submitting} className="h-[52px] w-full">
            {submitting ? 'Upgrading…' : 'Complete account'}
          </Button>

          <p className="text-center text-[14px] font-light text-brand-gray-500">
            Just browsing?{' '}
            <Link href="/dashboard" className="font-medium text-brand-blue hover:underline">
              Continue as guest
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
