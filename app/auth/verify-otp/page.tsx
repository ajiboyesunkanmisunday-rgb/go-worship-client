'use client';

import { AuthLayout } from '@/components/auth/layout';
import { OtpForm } from '@/components/auth/otp-form';
import { ResetProgress } from '@/components/auth/reset-progress';
import { beginLoginMfa, forgotPassword, getMfaPushStatus, verifyLoginMfa } from '@/lib/api/auth';
import { executeRecaptcha } from '@/lib/recaptcha';
import { toast } from 'sonner';
import { portalForRoles } from '@/lib/portal';
import { FormAlert } from '@/components/ui/form-alert';
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
  rememberMe,
  shellProps,
}: {
  mfaSessionId: string;
  allowedMethods: string[];
  primaryFactor: string | null;
  nextPath?: string | null;
  rememberMe?: boolean;
  shellProps?: ShellProps;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // TOTP (authenticator) is always the default — sort purely by security rank,
  // ignoring backend primaryFactor so email never becomes the default.
  const sorted = [...allowedMethods].sort(
    (a, b) => (METHOD_RANK[a] ?? 99) - (METHOD_RANK[b] ?? 99)
  );

  const [selectedMethod, setSelectedMethod] = useState(sorted[0] ?? 'TOTP');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'waiting' | 'enter_code' | 'push_polling'>('waiting');
  const [pushChallengeId, setPushChallengeId] = useState<string | null>(null);
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
      try {
        const res = await beginLoginMfa({ mfaSessionId, method });
        const tid = res.tokenId ?? (res.payloadJson?.tokenId ?? null);
        setTokenId(tid ?? null);
        if (method === 'PUSH_FCM') {
          const challengeId = tid ?? null;
          setPushChallengeId(challengeId);
          setPhase('push_polling');
          if (challengeId) {
            const poll = async () => {
              try {
                const status = await getMfaPushStatus(challengeId);
                if (status.status === 'APPROVED') {
                  const verifyRes = await verifyLoginMfa({ mfaSessionId, method, code: '', tokenId: challengeId, rememberMe });
                  router.replace(nextPath ?? (verifyRes.roles?.length ? portalForRoles(verifyRes.roles) : '/dashboard'));
                } else if (status.status === 'DENIED' || status.status === 'EXPIRED') {
                  setBeginError('Push notification was denied. Try another method.');
                  setPhase('waiting');
                } else {
                  setTimeout(poll, 3000);
                }
              } catch {
                setBeginError('Push verification failed. Try another method.');
                setPhase('waiting');
              }
            };
            setTimeout(poll, 3000);
          }
        } else {
          setPhase('enter_code');
        }
        if (method === 'OTP_EMAIL') {
          toast.success('We sent a code via email code.', { position: 'bottom-right', duration: 4000 });
        } else if (method === 'OTP_SMS') {
          toast.success('We sent a code via SMS.', { position: 'bottom-right', duration: 4000 });
        } else if (method === 'PUSH_FCM') {
          toast.success('Push notification sent. Approve on your device.', { position: 'bottom-right', duration: 6000 });
        }
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
    try {
      const res = await verifyLoginMfa({
        mfaSessionId,
        method: selectedMethod,
        code,
        tokenId,
        rememberMe,
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
        {beginError && <FormAlert variant="error">{beginError}</FormAlert>}
      </div>
    ) : (
      <p className="text-[14px] text-[#666]">{methodDescription(selectedMethod)}</p>
    );

  return (
    <AuthLayout
      imgSrc={shellProps?.imgSrc ?? '/auth/church.jpg'}
      imgAlt={shellProps?.imgAlt ?? 'Church'}
      imgClassName={shellProps?.imgClassName}
      logoSrc={shellProps?.logoSrc}
      flat={shellProps?.flat}
    >
      {phase === 'push_polling' ? (
        <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
          {methodTabsHeader}
          <div className="flex items-center gap-3 rounded-[10px] border border-[#e0e0e0] px-4 py-4">
            <span className="size-5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <span className="text-[14px] text-[#555]">Waiting for push approval on your device…</span>
          </div>
        </div>
      ) : phase === 'waiting' ? (
        <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
          {methodTabsHeader}
          <p className="text-[15px] text-[#888]">Starting verification…</p>
        </div>
      ) : (
        <OtpForm
          digits={6}
          onVerify={handleVerify}
          onResend={['OTP_EMAIL', 'OTP_SMS'].includes(selectedMethod) ? () => begin(selectedMethod) : undefined}
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

function ForgotPasswordOtpPage({ email }: { email?: string | null }) {
  const router = useRouter();

  const handleResend = email
    ? async () => {
        try {
          const captchaToken = await executeRecaptcha('forgot_password');
          if (captchaToken) await forgotPassword(email, captchaToken);
          toast.success('Code resent. Check your inbox.', { position: 'bottom-right', duration: 4000 });
        } catch {
          toast.error('Failed to resend code. Try again.', { position: 'bottom-right', duration: 4000 });
        }
      }
    : undefined;

  return (
    <AuthLayout imgSrc="/auth/church.jpg" imgAlt="Church">
      <OtpForm
        email={email ?? undefined}
        onVerify={(otp) => router.push(`/auth/set-password?token=${encodeURIComponent(otp)}`)}
        onResend={handleResend}
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
  const email = params.get('email');
  const rememberMe = params.get('remember') === '1';

  if (mfaSessionId) {
    // OTP_SMS is not yet available — strip it to keep only TOTP and OTP_EMAIL.
    const allowedMethods = (rawMethods ? rawMethods.split(',').filter(Boolean) : ['TOTP'])
      .filter((m) => m !== 'OTP_SMS');

    return (
      <LoginMfaPage
        mfaSessionId={mfaSessionId}
        allowedMethods={allowedMethods}
        primaryFactor={primaryFactor || null}
        nextPath={nextPath}
        rememberMe={rememberMe}
        shellProps={shellProps}
      />
    );
  }

  return <ForgotPasswordOtpPage email={email} />;
}

export default function VerifyOTPPage({ shellProps }: { shellProps?: ShellProps } = {}) {
  return (
    <Suspense fallback={null}>
      <VerifyOtpPageInner shellProps={shellProps} />
    </Suspense>
  );
}
