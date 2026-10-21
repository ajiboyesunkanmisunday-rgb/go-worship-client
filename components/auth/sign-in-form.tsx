'use client';
import { z } from 'zod';
import { AuthLayout } from '@/components/auth/layout';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MessageIcon } from '@/icons/message';
import Image from 'next/image';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { GoogleIcon } from '@/icons/socials';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { USE_LIVE_API } from '@/lib/api/config';
import { portalForRoles, isRoleAllowedForPortal, type PortalKind } from '@/lib/portal';
import { executeRecaptcha } from '@/lib/recaptcha';
import { login, logout, googleLogin } from '@/lib/api/auth';
import { signInWithGoogle } from '@/lib/google-identity';
import { useSiteContext } from '@/lib/site-context';

const formSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters',
  }),
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  /** Where to go after a successful sign in. */
  redirectTo?: string;
  /** Where the "Create an account" link points. Omit to hide member-facing links. */
  signupHref?: string;
  /** Force Google button off — use for TENANT_ADMIN / SYSTEM_OWNER portals. */
  disableGoogle?: boolean;
  /** Show a "Register your church" link — only relevant on the platform root login. */
  showRegisterChurch?: boolean;
  /** Override the left-panel background image (default: church photo). */
  imgSrc?: string;
  imgAlt?: string;
  /** CSS classes for the left-panel image. Defaults to 'object-cover mix-blend-hard-light'. */
  imgClassName?: string;
  /** Override the left-panel logo only (e.g. Leadremit logo for system login). Does not affect the form area logo. */
  logoSrc?: string;
  /** Override the subtitle below "Welcome Back" (defaults to org name from context). */
  subtitle?: string;
  /** Base path for MFA redirect, e.g. '/system'. Defaults to '/auth'. */
  mfaBasePath?: string;
  /** Hide the GoWorship brand logo above the form — use for SYSTEM_OWNER portals. */
  hideBrandLogo?: boolean;
  /** System/admin portal variant: full-bleed aside shell, centered form, system heading sizes. */
  flat?: boolean;
  /**
   * Role gate for this portal.  After a successful login the user's returned
   * roles are checked; if they don't match, the session is invalidated and an
   * error is shown.
   *   'system'   – SYSTEM_* roles only
   *   'ministry' – TENANT_* / ministry roles only (no system, no pure member)
   *   'member'   – everyone except SYSTEM_*
   * Omit to skip role gating (e.g. development / mock mode pages).
   */
  portalKind?: PortalKind;
};

function SignInFormInner({
  redirectTo = '/dashboard',
  signupHref,
  disableGoogle = false,
  showRegisterChurch = false,
  imgSrc,
  imgAlt,
  imgClassName,
  logoSrc,
  subtitle,
  mfaBasePath = '/auth',
  hideBrandLogo = false,
  flat = false,
  portalKind,
}: Props) {
  const { context } = useSiteContext();
  // Google login rules (spec: sign-in-form.tsx, go-worship-frontend-spec.md):
  //   TENANT admin portal (disableGoogle=true) → never show (system/ministry portals pass this)
  //   CUSTOMER portal → show when tenant config allows (customerGoogleLogin)
  const showGoogle =
    disableGoogle
      ? false
      : (context?.authentication?.customerGoogleLogin ?? true);
  const subtitleText = subtitle ?? 'Go-Worship church administration and giving platform.';

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  // Set by /first-login after consuming the invitation link.
  const tenantId = searchParams.get('tenant');
  // Set by the route proxy when an unauthenticated user is bounced to login.
  const nextPath = searchParams.get('next') ?? searchParams.get('from');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sessionBanner, setSessionBanner] = useState<string | null>(null);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'idle') {
      setSessionBanner('You were signed out due to inactivity. Please sign in again.');
    } else if (reason === 'unauthorized') {
      setSessionBanner('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setFormError(null);
    if (!USE_LIVE_API) {
      router.push(redirectTo);
      return;
    }
    setGoogleBusy(true);
    try {
      const idToken = await signInWithGoogle();
      const captchaToken = await executeRecaptcha('google_login');
      if (!captchaToken) {
        setFormError('Security check failed. Please try again.');
        return;
      }
      const res = await googleLogin({ idToken, captchaToken, rememberMe });
      if (res.activationRequired) {
        setFormError(
          res.message ??
            'Your account requires activation. Please check your email for a verification link.'
        );
        return;
      }
      if (res.mfaEnrollmentRequired) {
        const qs = new URLSearchParams({ enroll: '1' });
        if (res.mfaSessionId) qs.set('mfa', res.mfaSessionId);
        if (res.eligibleMethods?.length) qs.set('methods', res.eligibleMethods.join(','));
        if (nextPath) qs.set('next', nextPath);
        router.push(`${mfaBasePath}/mfa-enroll?${qs.toString()}`);
        return;
      }
      if (res.mfaRequired) {
        const qs = new URLSearchParams({ mfa: res.mfaSessionId ?? '' });
        if (res.allowedMethods?.length) qs.set('methods', res.allowedMethods.join(','));
        if (res.primaryFactor) qs.set('primary', res.primaryFactor);
        if (nextPath) qs.set('next', nextPath);
        router.push(`${mfaBasePath}/verify-otp?${qs.toString()}`);
        return;
      }
      if (portalKind) {
        const gate = isRoleAllowedForPortal(res.roles, portalKind);
        if (!gate.allowed) {
          logout().catch(() => {});
          setFormError(gate.message);
          return;
        }
      }
      router.push(nextPath ?? (res.roles?.length ? portalForRoles(res.roles) : redirectTo));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setGoogleBusy(false);
    }
  };

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setFormError(null);

    // Mock mode: no backend, keep the click-through demo behaviour.
    if (!USE_LIVE_API) {
      router.push(redirectTo);
      return;
    }

    setSubmitting(true);
    try {
      // reCAPTCHA v3: mint a fresh token per submit (no checkbox).
      const captchaToken = await executeRecaptcha('login');
      if (!captchaToken) {
        setFormError('Security check failed. Please try again.');
        setSubmitting(false);
        return;
      }

      const res = await login({ ...data, captchaToken, rememberMe, tenantId });

      // First login on a temporary password — must set a real one now.
      if (res.passwordChangeRequired && res.challengeToken) {
        const qs = new URLSearchParams({ challenge: res.challengeToken });
        if (res.tenantId ?? tenantId) qs.set('tenant', (res.tenantId ?? tenantId)!);
        router.push(`/first-login/set-password?${qs.toString()}`);
        return;
      }

      // Account needs activation before it can log in.
      if (res.activationRequired) {
        setFormError(
          res.message ??
            'Your account requires activation. Please check your email for a verification link.'
        );
        return;
      }

      // Must enroll in MFA before continuing.
      if (res.mfaEnrollmentRequired) {
        const qs = new URLSearchParams({ enroll: '1' });
        if (res.mfaSessionId) qs.set('mfa', res.mfaSessionId);
        if (res.eligibleMethods?.length) qs.set('methods', res.eligibleMethods.join(','));
        if (nextPath) qs.set('next', nextPath);
        router.push(`${mfaBasePath}/mfa-enroll?${qs.toString()}`);
        return;
      }

      if (res.mfaRequired) {
        const qs = new URLSearchParams({ mfa: res.mfaSessionId ?? '' });
        // OTP_SMS is not yet available — strip it before encoding the URL.
        const methods = (res.allowedMethods ?? []).filter((m) => m !== 'OTP_SMS');
        if (methods.length) qs.set('methods', methods.join(','));
        if (nextPath) qs.set('next', nextPath);
        router.push(`${mfaBasePath}/verify-otp?${qs.toString()}`);
        return;
      }
      // Honour ?next= from the route proxy, then role-based routing, then
      // the page's own redirectTo default.
      if (portalKind) {
        const gate = isRoleAllowedForPortal(res.roles, portalKind);
        if (!gate.allowed) {
          logout().catch(() => {});
          setFormError(gate.message);
          return;
        }
      }
      router.push(nextPath ?? (res.roles?.length ? portalForRoles(res.roles) : redirectTo));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout imgSrc={imgSrc} imgAlt={imgAlt ?? 'Celebration Church'} logoSrc={logoSrc} imgClassName={imgClassName} flat={flat}>
      {sessionBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-amber-500" />
          <span>{sessionBanner}</span>
        </div>
      )}
      <div className={`mx-auto flex w-full flex-col gap-${flat ? '7' : '6'} ${flat ? 'max-w-[430px] items-center' : 'max-w-[460px] items-start lg:items-center'}`}>
        {!hideBrandLogo && (
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={64}
            height={22}
            className="h-[22px] w-[64px]"
          />
        )}

        <div className={`flex flex-col gap-2 ${flat ? 'items-center text-center' : 'items-start text-left lg:items-center lg:text-center'}`}>
          <h1 className={`flex items-center gap-2 font-bold ${flat ? 'text-[32px] -tracking-[0.02em] lg:text-[38px]' : 'text-[28px] -tracking-[0.03em] lg:text-[40px]'}`}>
            Welcome Back
            <Image
              src="/auth/wave.png"
              alt=""
              width={32}
              height={32}
              className="size-[28px] lg:size-[32px]"
            />
          </h1>
          <p className={`max-w-[320px] font-poppins text-[16px] font-light lg:text-[17px] ${flat ? 'text-brand-black/85' : ''}`}>
            {subtitleText}
          </p>
        </div>

        <Form {...form}>
          <form
            className="flex w-full flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-bold lg:text-[16px]">
                    Email
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="h-[52px]">
                      <InputGroupInput
                        type="email"
                        placeholder="@ Email address"
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <MessageIcon className="size-[20px]" />
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-bold lg:text-[16px]">
                    Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Password (min. 8 character)"
                      containerProps={{ className: 'h-[52px]' }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <Label htmlFor="remember-me" className="text-[15px] font-normal">
                  Remember me
                </Label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-[15px] font-medium text-brand-blue"
              >
                Forgot Password?
              </Link>
            </div>

            {/* reCAPTCHA v3 is invisible — the token is minted on submit,
                so there is no widget here. */}
            {formError && (
              <p role="alert" className="text-[14px] text-destructive">
                {formError}
              </p>
            )}

            <Button
              size="lg"
              className="h-[52px] w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            {showGoogle && (
              <>
                <div className="flex w-full items-center justify-center gap-4">
                  <div className="h-px w-full bg-brand-gray-300" />
                  <span className="text-[15px] text-black">or</span>
                  <div className="h-px w-full bg-brand-gray-300" />
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-[52px] w-full gap-4"
                  type="button"
                  disabled={googleBusy || submitting}
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon className="size-[24px]" />
                  <span>{googleBusy ? 'Connecting…' : 'Continue with Google'}</span>
                </Button>
              </>
            )}

            {signupHref && (
              <p className="text-[15px] font-light">
                Don&apos;t have any?{' '}
                <Link href={signupHref} className="font-bold text-brand-orange">
                  Create an account
                </Link>
              </p>
            )}

            {showRegisterChurch && (
              <p className="text-center text-[14px] font-light text-brand-gray-500">
                Running a church?{' '}
                <Link
                  href="/auth/register-church"
                  className="font-medium text-brand-blue hover:underline"
                >
                  Register your church
                </Link>
              </p>
            )}

            {showGoogle && signupHref && (
              <p className="text-center text-[14px] font-light text-brand-gray-500">
                Just browsing?{' '}
                <Link href="/auth/guest" className="font-medium text-brand-blue hover:underline">
                  Continue as guest
                </Link>
              </p>
            )}
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}

/**
 * Wrapped in Suspense because the inner form reads `?tenant` via
 * useSearchParams, which otherwise opts every login route out of prerendering.
 */
export function SignInForm(props: Props) {
  return (
    <Suspense fallback={null}>
      <SignInFormInner {...props} />
    </Suspense>
  );
}

/** Ministry/Tenant-Admin login — identical to SignInForm but Google is always disabled. */
export function MinistrySignInForm(props: Omit<Props, 'disableGoogle'>) {
  return <SignInForm {...props} disableGoogle />;
}
