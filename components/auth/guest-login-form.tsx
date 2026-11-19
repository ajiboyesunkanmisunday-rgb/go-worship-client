'use client';

import { FormAlert } from '@/components/ui/form-alert';

/**
 * Guest login form — two-step: email → OTP code.
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   POST /bff/auth/guest/otp/start  { email, captchaToken }
 *   POST /bff/auth/guest/otp/verify { email, tokenId, code }
 *
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MessageIcon } from '@/icons/message';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { AuthLayout } from '@/components/auth/layout';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startGuestOtp, verifyGuestOtp } from '@/lib/api/auth';
import { executeRecaptcha } from '@/lib/recaptcha';

type Props = {
  redirectTo?: string;
  signInHref?: string;
  signUpHref?: string;
};

export function GuestLoginForm({
  redirectTo = '/dashboard',
  signInHref = '/auth/login',
  signUpHref = '/auth/signup',
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const captchaToken = await executeRecaptcha('guest_otp_start');
      if (!captchaToken) { setError('Security check failed. Please try again.'); return; }
      const data = await startGuestOtp(email, captchaToken);
      setTokenId(data.tokenId ?? data.sessionId ?? '');
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length < 6) { setError('Please enter the 6-digit code'); return; }
    setBusy(true);
    try {
      const data = await verifyGuestOtp(email, tokenId, code);
      // If the backend says the guest can upgrade, offer the upgrade flow first.
      // The upgrade page has a "Continue as guest" skip link that goes to redirectTo.
      if (data.canUpgrade) {
        router.push('/auth/upgrade-account');
      } else {
        router.push(redirectTo);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <AuthLayout imgAlt="Guest Access">
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-start gap-6 lg:items-center">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <div className="flex flex-col items-start gap-2 text-left lg:items-center lg:text-center">
          <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[40px]">
            {step === 'email' ? 'Continue as Guest' : 'Enter Your Code'}
          </h1>
          <p className="max-w-[320px] font-poppins text-[16px] font-light lg:text-[17px]">
            {step === 'email'
              ? 'Enter your email to receive a one-time code'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form className="flex w-full flex-col gap-5" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-bold lg:text-[16px]">Email</label>
              <InputGroup className="h-[52px]">
                <InputGroupInput
                  type="email"
                  placeholder="@ Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <MessageIcon className="size-[20px]" />
                </InputGroupAddon>
              </InputGroup>
            </div>

            {error && <FormAlert variant="error">{error}</FormAlert>}

            <Button size="lg" className="h-[52px] w-full" type="submit" disabled={busy}>
              {busy ? 'Sending code…' : 'Send Code'}
            </Button>

            <p className="text-center text-[15px] font-light">
              Have an account?{' '}
              <Link href={signInHref} className="font-bold text-brand-blue">Sign in</Link>
              {' '}or{' '}
              <Link href={signUpHref} className="font-bold text-brand-orange">Create account</Link>
            </p>
          </form>
        ) : (
          <form className="flex w-full flex-col items-center gap-5" onSubmit={handleOtpSubmit}>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && <FormAlert variant="error">{error}</FormAlert>}

            <Button size="lg" className="h-[52px] w-full" type="submit" disabled={busy || code.length < 6}>
              {busy ? 'Verifying…' : 'Continue'}
            </Button>

            <button
              type="button"
              className="text-[14px] text-brand-blue hover:underline"
              onClick={() => { setStep('email'); setCode(''); setError(null); }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
