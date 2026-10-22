'use client';
import { z } from 'zod';
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
import Link from 'next/link';
import { PasswordInput } from '@/components/ui/password-input';
import { useState } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { executeRecaptcha } from '@/lib/recaptcha';
import { FormAlert } from '@/components/ui/form-alert';
import { USE_LIVE_API } from '@/lib/api/config';
import {
  registerCustomer,
  toProvisionRequest,
  type SignUpDetails,
} from '@/lib/api/registration';

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

type Props = {
  onSuccess?(): void;
};

export function PasswordForm({ onSuccess }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Step 1 of the wizard stashes the account details here.
  const [details] = useSessionStorage<Partial<SignUpDetails>>(
    'signup-account-details',
    {}
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setFormError(null);

    // Mock mode: no backend, keep the click-through demo behaviour.
    if (!USE_LIVE_API) {
      onSuccess?.();
      return;
    }

    if (!details.email) {
      setFormError('Your account details are missing. Please start again.');
      return;
    }

    setSubmitting(true);
    try {
      // reCAPTCHA v3: mint a fresh token per submit (no checkbox).
      const captchaToken = await executeRecaptcha('register');
      if (!captchaToken) {
        setFormError('Security check failed. Please try again.');
        setSubmitting(false);
        return;
      }
      await registerCustomer(
        toProvisionRequest(
          details as SignUpDetails,
          data.password,
          data.confirmPassword,
          captchaToken
        )
      );
      onSuccess?.();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'mx-auto w-full md:max-w-[550px] lg:max-w-[667px] flex flex-col',
        'justify-start items-start gap-10'
      )}
    >
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
          Create your password
        </h1>

        <p
          className={cn(
            'font-light text-[16px] lg:text-[18px] text-left',
            'lg:leading-[150%] lg:tracking-[0%]'
          )}
        >
          Sign up to access personalized features and seamless experiences.
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
                <FormLabel className="lg:font-bold lg:text-[17px]">
                  Re-enter New Password
                </FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Repeat Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          {formError && <FormAlert variant="error">{formError}</FormAlert>}

          <Button
            size="lg"
            className="w-full mt-6 lg:h-[62px]"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Verify'}
          </Button>

          <div className="w-full flex justify-start items-center gap-2">
            <span>Already have a Go worship account?</span>
            <Link href="/auth/login" className="font-bold text-brand-orange">
              Sign in
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
