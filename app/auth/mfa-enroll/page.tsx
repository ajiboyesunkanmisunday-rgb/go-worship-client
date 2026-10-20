'use client';

import { AuthLayout } from '@/components/auth/layout';
import { OtpForm } from '@/components/auth/otp-form';
import { Button } from '@/components/ui/button';
import {
  beginMfaEnrollment,
  completeEmailMfaEnrollment,
  completeTotpMfaEnrollment,
  type OtpEmailEnrollBeginResponse,
  type TotpEnrollBeginResponse,
} from '@/lib/api/auth';
import { portalForRoles } from '@/lib/portal';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const METHOD_LABELS: Record<string, string> = {
  OTP_EMAIL: 'Email code',
  TOTP: 'Authenticator app',
};

type Phase = 'choose' | 'totp_scan' | 'enter_code' | 'done';

type ShellProps = {
  imgSrc?: string;
  imgAlt?: string;
  imgClassName?: string;
  logoSrc?: string;
  flat?: boolean;
};

function MfaEnrollInner({ shellProps }: { shellProps?: ShellProps }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawMethods = params.get('methods') ?? 'OTP_EMAIL,TOTP';
  const nextPath = params.get('next');

  const methods = rawMethods
    .split(',')
    .filter((m) => m === 'OTP_EMAIL' || m === 'TOTP');
  const availableMethods =
    methods.length > 0 ? methods : (['OTP_EMAIL', 'TOTP'] as const);

  const [phase, setPhase] = useState<Phase>(
    availableMethods.length === 1 ? 'choose' : 'choose'
  );
  const [chosen, setChosen] = useState<'OTP_EMAIL' | 'TOTP'>(
    availableMethods.includes('TOTP') ? 'TOTP' : 'OTP_EMAIL'
  );
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [emailTokenId, setEmailTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);

  const handleBegin = async (method: 'OTP_EMAIL' | 'TOTP') => {
    setError(null);
    setBusy(true);
    try {
      const res = await beginMfaEnrollment({ method });
      if (method === 'TOTP') {
        const r = res as TotpEnrollBeginResponse;
        const secret = r.secret ?? null;
        setTotpSecret(secret);
        const issuer = 'Go-Worship';
        const uri =
          r.otpauthUri ??
          (secret
            ? `otpauth://totp/${encodeURIComponent(issuer)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
            : null);
        setTotpUri(uri);
        setPhase('totp_scan');
      } else {
        const r = res as OtpEmailEnrollBeginResponse;
        setEmailTokenId(r.tokenId ?? null);
        setPhase('enter_code');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start enrollment');
    } finally {
      setBusy(false);
    }
  };

  const handleTotpReady = () => {
    setPhase('enter_code');
  };

  const handleVerify = async (code: string) => {
    if (chosen === 'TOTP') {
      await completeTotpMfaEnrollment({
        method: 'TOTP',
        secret: totpSecret ?? '',
        code,
        makePreferred: true,
      });
    } else {
      await completeEmailMfaEnrollment({
        method: 'OTP_EMAIL',
        tokenId: emailTokenId ?? '',
        code,
      });
    }
    setPhase('done');
    const destination = nextPath ?? '/dashboard';
    router.replace(destination);
  };

  return (
    <AuthLayout
      imgSrc={shellProps?.imgSrc ?? '/auth/church.jpg'}
      imgAlt={shellProps?.imgAlt ?? 'Go Worship'}
      imgClassName={shellProps?.imgClassName}
      logoSrc={shellProps?.logoSrc}
      flat={shellProps?.flat}
    >
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
        <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[36px]">
          Set up two-factor authentication
        </h1>
        <p className="text-[15px] font-light text-[#555]">
          Your account requires two-factor authentication before you can continue.
        </p>

        {phase === 'choose' && (
          <>
            <p className="text-[14px] text-[#555]">
              Choose a method to protect your account.
            </p>
            <div className="flex flex-col gap-3">
              {(availableMethods as string[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setChosen(m as 'OTP_EMAIL' | 'TOTP')}
                  className={`flex items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
                    chosen === m
                      ? 'border-brand-blue bg-brand-blue/5'
                      : 'border-[#e0e0e0]'
                  }`}
                >
                  <span className="text-[15px] font-medium">
                    {METHOD_LABELS[m] ?? m}
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-[14px] text-destructive">
                {error}
              </p>
            )}
            <Button
              size="lg"
              className="h-[52px] w-full"
              disabled={busy}
              onClick={() => handleBegin(chosen)}
            >
              {busy ? 'Starting…' : `Set up ${METHOD_LABELS[chosen] ?? chosen}`}
            </Button>
          </>
        )}

        {phase === 'totp_scan' && (
          <>
            <p className="text-[15px] font-light">
              Scan this QR code with your authenticator app (Google Authenticator,
              Authy, etc.), then tap <strong>Continue</strong>.
            </p>
            {totpUri ? (
              <div className="flex justify-center rounded-[12px] border border-[#e0e0e0] p-5">
                <QRCodeSVG value={totpUri} size={180} />
              </div>
            ) : (
              <p className="text-[14px] text-[#888]">No QR available.</p>
            )}
            {totpSecret && (
              <div>
                <button
                  type="button"
                  className="text-[13px] text-brand-blue underline"
                  onClick={() => setShowManualKey((v) => !v)}
                >
                  {showManualKey ? 'Hide manual key' : "Can't scan? Enter key manually"}
                </button>
                {showManualKey && (
                  <p className="mt-2 break-all rounded-[8px] bg-[#f5f5f5] px-4 py-2 font-mono text-[13px]">
                    {totpSecret}
                  </p>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="text-[14px] text-destructive">
                {error}
              </p>
            )}
            <Button size="lg" className="h-[52px] w-full" onClick={handleTotpReady}>
              Continue
            </Button>
          </>
        )}

        {phase === 'enter_code' && (
          <OtpForm
            digits={6}
            onVerify={handleVerify}
            header={null}
            label={
              chosen === 'TOTP'
                ? 'Enter the 6-digit code from your authenticator app'
                : 'Enter the code sent to your email'
            }
            footer={
              availableMethods.length > 1 ? (
                <button
                  type="button"
                  className="text-[14px] text-brand-blue"
                  onClick={() => {
                    setPhase('choose');
                    setError(null);
                  }}
                >
                  Use a different method
                </button>
              ) : null
            }
          />
        )}

        {phase === 'done' && (
          <p className="text-[15px] text-[#555]">
            Two-factor authentication enabled. Redirecting…
          </p>
        )}
      </div>
    </AuthLayout>
  );
}

export default function MfaEnrollPage({ shellProps }: { shellProps?: ShellProps } = {}) {
  return (
    <Suspense fallback={null}>
      <MfaEnrollInner shellProps={shellProps} />
    </Suspense>
  );
}
