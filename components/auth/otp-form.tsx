'use client';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

type OtpFormProps = {
  email?: string;
  onVerify(otp: string): void | Promise<void>;
  onResend?(): void;
  verifyLabel?: string;
  /** Number of OTP slots. Default 5 (forgot-password); use 6 for MFA. */
  digits?: number;
  /** Description shown above the OTP slots. */
  label?: ReactNode;
  /** Heading rendered as h1 after the logo, replacing the default fallback. */
  title?: string;
  /** Optional node rendered above the logo (e.g. reset-flow progress bar). */
  header?: ReactNode | null;
  /** Footer row under the resend/timer line. Defaults to the sign-up link. */
  footer?: ReactNode | null;
};

const SLOT_CLASS =
  'size-[52px] rounded-[6px] border-[0.5px] border-[#3E3E3E] text-[22px] font-bold lg:size-[64px] lg:text-[32px]';

export function OtpForm({
  email,
  onVerify,
  onResend,
  verifyLabel = 'Verify Code',
  digits = 5,
  label,
  title,
  header,
  footer,
}: OtpFormProps) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length < digits) {
      toast.error(`Please enter the ${digits}-digit code`, {
        position: 'bottom-right',
        duration: 3000,
      });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onVerify(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-8">
      {header}
      <Image
        src="/auth/infinity-blue.svg"
        alt="Go Worship"
        width={64}
        height={22}
        className="h-[22px] w-[64px]"
      />

      {title ? (
        <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[36px]">{title}</h1>
      ) : label ? (
        <p className="text-[16px] font-medium">{label}</p>
      ) : (
        <h1 className="text-[24px] font-bold -tracking-[0.02em] lg:text-[30px]">
          Enter Verification code sent to
          <br />
          <span className="font-light">{email || 'your email'}</span>
        </h1>
      )}

      <form className="flex w-full flex-col gap-8" onSubmit={handleSubmit}>
        <InputOTP
          maxLength={digits}
          value={otp}
          onChange={setOtp}
          pattern={REGEXP_ONLY_DIGITS}
          className="w-full"
        >
          <InputOTPGroup className="w-full justify-between gap-3">
            {Array.from({ length: digits }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className={SLOT_CLASS} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p role="alert" className="text-[14px] text-destructive">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="h-[52px] w-full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Verifying…' : verifyLabel}
        </Button>

        {onResend !== undefined && (
          <div className="flex w-full items-center justify-between gap-4">
            <button
              type="button"
              onClick={onResend}
              className="text-[15px] font-medium text-brand-blue hover:underline"
            >
              Resend code
            </button>
            <span className="text-[15px] text-brand-gray-500">01:00</span>
          </div>
        )}

        {footer === undefined ? (
          <p className="text-[15px] font-light">
            Don&apos;t have any?{' '}
            <Link href="/auth/signup" className="font-bold text-brand-orange">
              Create an account
            </Link>
          </p>
        ) : (
          footer
        )}
      </form>
    </div>
  );
}
