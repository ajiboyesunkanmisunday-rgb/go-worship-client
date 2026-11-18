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
import { cn } from '@/lib/utils';
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
import Link from 'next/link';
import { ResetProgress } from '@/components/auth/reset-progress';
import { useEffect, useState } from 'react';
import { executeRecaptcha } from '@/lib/recaptcha';
import { USE_LIVE_API } from '@/lib/api/config';
import { forgotPassword } from '@/lib/api/auth';
import { FormAlert } from '@/components/ui/form-alert';

const RESEND_COOLDOWN = 60;

const formSchema = z.object({
  email: z.email({
    message: 'Please enter a valid email address',
  }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const send = async (email: string) => {
    if (!USE_LIVE_API) {
      setSentTo(email);
      setCountdown(RESEND_COOLDOWN);
      return;
    }
    const captchaToken = await executeRecaptcha('forgot_password');
    if (!captchaToken) throw new Error('Security check failed. Please try again.');
    await forgotPassword(email, captchaToken);
  };

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await send(data.email);
      setSentTo(data.email);
      setCountdown(RESEND_COOLDOWN);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!sentTo || countdown > 0) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await send(sentTo);
      setCountdown(RESEND_COOLDOWN);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not resend reset link');
    } finally {
      setSubmitting(false);
    }
  };

  const countdownLabel =
    countdown > 0
      ? `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`
      : null;

  return (
    <AuthLayout
      imgAlt="Church in sunset"
      imgSrc="/maxime-gauthier-fYZGUY1FGpA-unsplash 1.png"
      imgWidth={825}
      imgHeight={1084}
      containerClassName="flex flex-col md:justify-center md:items-center gap-4"
    >
      <div
        className={cn(
          'mx-auto md:max-w-[400px] lg:max-w-[532px] w-full flex flex-col',
          'justify-start items-start gap-8'
        )}
      >
        <ResetProgress step={1} />

        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        {sentTo ? (
          /* ---- Success state ---- */
          <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1
                className={cn(
                  'font-plus-jakarta-sans font-bold text-[25px] leading-[109%] -tracking-[1%]',
                  'lg:text-[40px] lg:leading-[100%] lg:-tracking-[3%]'
                )}
              >
                Check your inbox
              </h1>
              <p className={cn('font-light text-[16px] lg:text-[18px]')}>
                If an account exists for{' '}
                <span className="font-medium">{sentTo}</span>, a password reset
                link has been sent. Check your spam folder if it doesn&apos;t
                arrive within a few minutes.
              </p>
            </div>

            {formError && <FormAlert variant="error">{formError}</FormAlert>}

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={submitting || countdown > 0}
                  className={cn(
                    'text-[15px] font-medium text-brand-blue transition-opacity',
                    countdown > 0 || submitting ? 'cursor-default opacity-40' : 'hover:underline'
                  )}
                >
                  {submitting ? 'Sending…' : 'Resend link'}
                </button>
                {countdownLabel && (
                  <span className="text-[15px] tabular-nums text-brand-gray-500">
                    {countdownLabel}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setSentTo(null); setCountdown(0); setFormError(null); }}
                className="text-[14px] text-brand-gray-500 hover:underline self-start"
              >
                Use a different email
              </button>
            </div>

            <p className="text-[14px] lg:text-[17px]">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-bold text-brand-orange">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          /* ---- Email entry form ---- */
          <>
            <div className="w-full flex flex-col gap-2">
              <h1
                className={cn(
                  'font-plus-jakarta-sans font-bold text-[25px] leading-[109%] -tracking-[1%]',
                  'lg:text-[40px] lg:leading-[100%] lg:-tracking-[3%]'
                )}
              >
                Enter account email
              </h1>

              <p
                className={cn(
                  'font-light text-[16px] lg:text-[18px] text-left',
                  'lg:leading-[150%] lg:tracking-[0%]'
                )}
              >
                Need help accessing your account? Enter your email to reset your
                password and regain access in no time!
              </p>
            </div>

            <Form {...form}>
              <form
                className="w-full flex flex-col gap-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="lg:font-bold lg:text-[17px]">
                        Email
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            type="email"
                            placeholder="Email Address"
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <MessageIcon className="lg:size-[24px]" />
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formError && <FormAlert variant="error">{formError}</FormAlert>}

                <Button
                  size="lg"
                  className="w-full mt-2"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Sending…' : 'Continue'}
                </Button>

                <div className="w-full flex justify-center items-center gap-2">
                  <p className="text-[14px] lg:text-[17px]">Don&apos;t have any?</p>
                  <Link
                    href="/auth/signup"
                    className="text-[14px] lg:text-[17px] text-brand-orange font-bold"
                  >
                    Create an account
                  </Link>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
