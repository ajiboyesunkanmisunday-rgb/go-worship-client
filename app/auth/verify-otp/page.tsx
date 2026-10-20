'use client';

import { AuthLayout } from '@/components/auth/layout';
import { OtpForm } from '@/components/auth/otp-form';
import { ResetProgress } from '@/components/auth/reset-progress';
import { Button } from '@/components/ui/button';
import { beginLoginMfa, verifyLoginMfa } from '@/lib/api/auth';
import { portalForRoles } from '@/lib/portal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

/** Display order for MFA methods: most secure first. */
const METHOD_RANK: Record<string, number> = {
  TOTP: 0,
  PASSKEY: 1,
  PUSH_FCM: 2,
  OTP_EMAIL: 3,
  OTP_SMS: 4,
};

function methodLabel(m: string) {
  switch (m) {
    case 'TOTP':
      return 'Authenticator app';
    case 'OTP_EMAIL':
      return 'Email code';
    case 'OTP_SMS':
      return 'SMS code';
    case 'PASSKEY':
      return 'Passkey';
    case 'PUSH_FCM':
      return 'Push notification';
    default:
      return m;
  }
}

type Phase =
  | 'choose'       // pick which factor to use
  | 'waiting'      // calling begin
  | 'enter_code'   // OTP or TOTP code input
  | 'done';

type ShellProps = {
  imgSrc?: string;
  imgAlt?: string;
  imgClassName?: string;
  logoSrc?: string;
};

function LoginMfaPage({
  mfaSessionId,
  allowedMethods,
  primaryFactor,
  nextPath,
  shellProps,
}: {
  mfaSessionId: string;
  allowedMethods: string[];
  primaryFactor: string | null;
  nextPath?: string | null;
  shellProps?: ShellProps;
}) {
  const router = useRouter();

  // Sort methods: preferred first, then by security rank.
  const sorted = [...allowedMethods].sort((a, b) => {
    if (a === primaryFactor) return -1;
    if (b === primaryFactor) return 1;
    return (METHOD_RANK[a] ?? 99) - (METHOD_RANK[b] ?? 99);
  });

  const [selectedMethod, setSelectedMethod] = useState(sorted[0] ?? 'TOTP');
  const [phase, setPhase] = useState<Phase>(sorted.length <= 1 ? 'waiting' : 'choose');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(
    async (method: string) => {
      setError(null);
      setPhase('waiting');
      try {
        const res = await beginLoginMfa({ mfaSessionId, method });
        // OTP_EMAIL/SMS: backend sends the code + returns tokenId
        const tid =
          res.tokenId ??
          (res.payloadJson?.tokenId ?? null);
        setTokenId(tid ?? null);
        setPhase('enter_code');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start challenge');
        setPhase('choose');
      }
    },
    [mfaSessionId]
  );

  // Auto-start when there's only one method (no chooser needed).
  useEffect(() => {
    if (sorted.length <= 1 && selectedMethod) {
      begin(selectedMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (code: string) => {
    setError(null);
    try {
      const res = await verifyLoginMfa({
        mfaSessionId,
        method: selectedMethod,
        code,
        tokenId,
      });
      router.replace(
        nextPath ?? (res.roles?.length ? portalForRoles(res.roles) : '/dashboard')
      );
    } catch (e) {
      throw e; // let OtpForm surface it
    }
  };

  return (
    <AuthLayout
      imgSrc={shellProps?.imgSrc ?? '/auth/church.jpg'}
      imgAlt={shellProps?.imgAlt ?? 'Celebration Church'}
      imgClassName={shellProps?.imgClassName}
      logoSrc={shellProps?.logoSrc}
    >
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
        <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[36px]">
          Two-step verification
        </h1>

        {phase === 'choose' && sorted.length > 1 && (
          <>
            <p className="text-[15px] font-light">
              Choose how you&apos;d like to verify your identity.
            </p>
            <div className="flex flex-col gap-3">
              {sorted.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`flex items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
                    selectedMethod === m
                      ? 'border-brand-blue bg-brand-blue/5'
                      : 'border-[#e0e0e0]'
                  }`}
                >
                  <span className="text-[15px] font-medium">{methodLabel(m)}</span>
                  {m === primaryFactor && (
                    <span className="ml-auto text-[12px] text-brand-blue">
                      Preferred
                    </span>
                  )}
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
              onClick={() => begin(selectedMethod)}
            >
              Continue with {methodLabel(selectedMethod)}
            </Button>
          </>
        )}

        {phase === 'waiting' && (
          <p className="text-[15px] text-[#555]">
            Starting verification…
          </p>
        )}

        {phase === 'enter_code' && (
          <OtpForm
            digits={6}
            onVerify={handleVerify}
            header={null}
            label={
              selectedMethod === 'TOTP'
                ? 'Enter the 6-digit code from your authenticator app'
                : `Enter the code sent to your ${selectedMethod === 'OTP_SMS' ? 'phone' : 'email'}`
            }
            footer={
              sorted.length > 1 ? (
                <button
                  type="button"
                  className="text-[14px] text-brand-blue"
                  onClick={() => setPhase('choose')}
                >
                  Try a different method
                </button>
              ) : null
            }
          />
        )}
      </div>
    </AuthLayout>
  );
}

function ForgotPasswordOtpPage() {
  const router = useRouter();
  return (
    <AuthLayout imgSrc="/auth/church.jpg" imgAlt="Celebration Church">
      <OtpForm
        onVerify={(otp) => router.push(`/auth/set-password?token=${encodeURIComponent(otp)}`)}
        header={<ResetProgress step={2} />}
        footer={
          <p className="text-[15px] font-light">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-bold text-brand-orange">
              Sign in
            </Link>
          </p>
        }
      />
    </AuthLayout>
  );
}

function VerifyOtpPageInner({ shellProps }: { shellProps?: ShellProps }) {
  const params = useSearchParams();
  const mfaSessionId = params.get('mfa');
  const rawMethods = params.get('methods') ?? '';
  const primaryFactor = params.get('primary') ?? null;
  const nextPath = params.get('next');

  if (mfaSessionId) {
    const allowedMethods = rawMethods
      ? rawMethods.split(',').filter(Boolean)
      : ['TOTP'];

    return (
      <LoginMfaPage
        mfaSessionId={mfaSessionId}
        allowedMethods={allowedMethods}
        primaryFactor={primaryFactor || null}
        nextPath={nextPath}
        shellProps={shellProps}
      />
    );
  }

  return <ForgotPasswordOtpPage />;
}

export default function VerifyOTPPage({ shellProps }: { shellProps?: ShellProps } = {}) {
  return (
    <Suspense fallback={null}>
      <VerifyOtpPageInner shellProps={shellProps} />
    </Suspense>
  );
}
