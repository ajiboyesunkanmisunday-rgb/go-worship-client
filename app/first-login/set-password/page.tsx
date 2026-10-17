'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
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
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/auth/layout';
import { completeFirstLogin } from '@/lib/api/auth';
import { portalForRoles } from '@/lib/portal';

/**
 * Forced password change after a first login on a temporary password.
 *
 * Reached from the sign-in form when the API answers 428
 * PASSWORD_CHANGE_REQUIRED. The challenge token is short-lived (~10 minutes),
 * so an expired one sends the user back to sign in rather than failing quietly.
 */
const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Schema = z.infer<typeof schema>;

function SetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const challengeToken = params.get('challenge');
  const tenantId = params.get('tenant');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit: SubmitHandler<Schema> = async (data) => {
    setFormError(null);

    if (!challengeToken) {
      setFormError('This session has expired. Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await completeFirstLogin({
        challengeToken,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
        tenantId,
      });
      // Completing the change issues a full session; route by role
      // (SUPER_SYSTEM_ADMIN → /system, otherwise the member dashboard).
      router.push(portalForRoles(res.roles));
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : 'Could not set your password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout imgAlt="Celebration Church">
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-start gap-6">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <div className="flex w-full flex-col gap-2">
          <h1 className="text-[28px] font-bold -tracking-[0.03em] lg:text-[40px]">
            Create your password
          </h1>
          <p className="font-poppins text-[16px] font-light lg:text-[18px]">
            For your security, please replace the temporary password you were
            sent before continuing.
          </p>
        </div>

        <Form {...form}>
          <form
            className="flex w-full flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lg:text-[17px] lg:font-bold">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lg:text-[17px] lg:font-bold">
                    Re-enter New Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Repeat Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && (
              <p role="alert" className="text-[14px] text-destructive">
                {formError}{' '}
                <Link href="/auth/login" className="font-bold underline">
                  Sign in again
                </Link>
              </p>
            )}

            <Button
              size="lg"
              className="mt-2 h-[52px] w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save password'}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}

export default function FirstLoginSetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}
