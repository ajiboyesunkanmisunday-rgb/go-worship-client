'use client';

import { z } from 'zod';
import { AuthLayout } from '@/components/auth/layout';
import { Button } from '@/components/ui/button';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordInput } from '@/components/ui/password-input';
import { ResetProgress } from '@/components/auth/reset-progress';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { resetPassword } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters',
    }),
    confirmPassword: z.string().min(8, {
      message: 'Confirm password must be at least 8 characters',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormSchema = z.infer<typeof formSchema>;

function SetPasswordInner() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setFormError(null);

    if (USE_LIVE_API) {
      if (!token) {
        setFormError('Your reset session has expired. Please start over.');
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(token, data.password);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Could not reset your password.');
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    router.push('/auth/login');
  };

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
          'justify-start items-start gap-10'
        )}
      >
        <ResetProgress step={3} />

        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <div className="w-full flex flex-col gap-2">
          <h1
            className={cn(
              'font-plus-jakarta-sans font-bold text-[25px] leading-[109%] -tracking-[1%]',
              'lg:text-[40px] lg:leading-[100%] lg:-tracking-[3%]'
            )}
          >
            Enter new password
          </h1>

          <p
            className={cn(
              'font-light text-[16px] lg:text-[18px] text-left',
              'lg:leading-[150%] lg:tracking-[0%]'
            )}
          >
            Create a strong password to secure your account.
          </p>
        </div>

        <Form {...form}>
          <form
            className="w-full flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lg:font-bold lg:text-[17px]">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Password (min. 8 character)"
                      {...field}
                    />
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
                  <FormLabel className="lg:font-bold lg:text-[17px]">
                    Re-enter New Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Password (min. 8 character)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && (
              <p role="alert" className="text-[14px] text-destructive">
                {formError}{' '}
                <Link href="/auth/forgot-password" className="font-bold underline">
                  Start over
                </Link>
              </p>
            )}

            <Button size="lg" className="w-full mt-6" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset Password'}
            </Button>

            <p className="text-[14px] lg:text-[17px] font-light">
              Don&apos;t have any?{' '}
              <Link href="/auth/signup" className="font-bold text-brand-orange">
                Create an account
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}
