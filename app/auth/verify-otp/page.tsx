'use client';

import { AuthLayout } from '@/components/auth/layout';
import { OtpForm } from '@/components/auth/otp-form';
import { ResetProgress } from '@/components/auth/reset-progress';
import { beginLoginMfa, verifyLoginMfa } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { portalForRoles } from '@/lib/portal';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
    case 'TOTP':      return 'Authenticator app';
    case 'OTP_EMAIL': return 'Email code';
    case 'OTP_SMS':   return 'SMS code';
    case 'PASSKEY':   return 'Passkey';
    case 'PUSH_FCM':  return 'Push notification';
    default:          return m;
  }
}

function methodDescription(m: string) {
  switch (m) {
    case 'TOTP':
      return 'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, 1Password).';
    case 'OTP_EMAIL':
      return 'Enter the verification code sent to your email address.';
    case 'OTP_SMS':
      return 'Enter the verification code sent to your phone number.';
    default:
      return `Enter the code for ${methodLabel(m)}.`;
  }
}

type ShellProps = {
  imgSrc?: string;
  imgAlt?: string;
  imgClassName?: string;
  logoSrc?: string;
  flat?: boolean;
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
  const pathname = usePathname();

  const sorted = [...allowedMethods].sort((a, b) => {
    if (a === primaryFactor) return -1;
    if (b === primaryFactor) return 1;
    return (METHOD_RANK[a] ?? 99) - (METHOD_RANK[b] ?? 99);
  });

  const [selectedMethod, setSelectedMethod] = useState(sorted[0] ?? 'TOTP');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'waiting' | 'enter_code'>('waiting');
  const [beginError, setBeginError] = useState<string | null>(null);

  const loginHref =
    pathname.startsWith('/system')         ? '/system/login'
    : pathname.startsWith('/ministry-admin') ? '/ministry-admin/login'
    : pathname.startsWith('/ministry')       ? '/ministry/login'
    : pathname.startsWith('/sermon-admin')   ? '/sermon-admin/login'
    : pathname.startsWith('/group-leader')   ? '/group-leader/login'
    : '/auth/login';

  const begin = useCallback(
    async (method: string) => {
      setBeginError(null);
      setPhase('waiting');
      if (!USE_LIVE_API) {
        setPhase('enter_code');
        return;
      }
      try {
        const res = await beginLoginMfa({ mfaSessionId, method });
        const tid = res.tokenId ?? (res.payloadJson?.tokenId ?? null);
        setTokenId(tid ?? null);
        setPhase('enter_code');
      } catch (e) {
        setBeginError(e instanceof Error ? e.message : 'Failed to start verification');
        setPhase('enter_code');
      }
    },
    [mfaSessionId]
  );

  useEffect(() => {
    begin(sorted[0] ?? 'TOTP');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (method: string) => {
    setSelectedMethod(method);
    setTokenId(null);
    begin(method);
  };

  const handleVerify = async (code: string) => {
    if (!USE_LIVE_API) {
      router.replace(nextPath ?? '/dashboard');
      return;
    }
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

  const methodTabsHeader =
    sorted.length > 1 || beginError ? (
      <div className="flex flex-col gap-3">
        {sorted.length > 1 && (
          <>
            <p className="text-[13px] font-medium text-brand-gray-500">Verify with</p>
            <div className="flex flex-wrap gap-2">
              {sorted.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={phase === 'waiting'}
                  onClick={() => handleTabChange(m)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    selectedMethod === m
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-[#e2e2e2] text-brand-gray-500 hover:border-brand-blue/40'
                  }`}
                >
                  {methodLabel(m)}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="text-[14px] text-brand-gray-500">{methodDescription(selectedMethod)}</p>
        {beginError && (
          <p role="alert" className="text-[14px] text-destructive">
            {beginError}
          </p>
        )}
      </div>
    ) : (
      <p className="text-[14px] text-[#666]">{methodDescription(selectedMethod)}</p>
    );

  return (
    <AuthLayout
      imgSrc={shellProps?.imgSrc ?? '/auth/church.jpg'}
      imgAlt={shellProps?.imgAlt ?? 'Celebration Church'}
      imgClassName={shellProps?.imgClassName}
      logoSrc={shellProps?.logoSrc}
      flat={shellProps?.flat}
    >
      {phase === 'waiting' ? (
        <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
          {methodTabsHeader}
          <p className="text-[15px] text-[#888]">Starting verification…</p>
        </div>
      ) : (
        <OtpForm
          digits={6}
          onVerify={handleVerify}
          header={methodTabsHeader}
          title="Two-step verification"
          footer={
            <p className="text-[15px] font-light">
              Remember your password?{' '}
              <Link href={loginHref} className="font-bold text-brand-orange">
                Sign in
              </Link>
            </p>
          }
        />
      )}
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
