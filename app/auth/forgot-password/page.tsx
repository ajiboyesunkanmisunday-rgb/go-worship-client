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
import { useRouter } from 'next/navigation';
import { ResetProgress } from '@/components/auth/reset-progress';
import { useState } from 'react';
import { executeRecaptcha } from '@/lib/recaptcha';
import { USE_LIVE_API } from '@/lib/api/config';
import { forgotPassword } from '@/lib/api/auth';

const formSchema = z.object({
  email: z.email({
    message: 'Please enter a valid email address',
  }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const router = useRouter();

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = (email: string) =>
    router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setFormError(null);

    // Mock mode: no backend, keep the click-through demo behaviour.
    if (!USE_LIVE_API) {
      next(data.email);
      return;
    }

    setSubmitting(true);
    try {
      // reCAPTCHA v3: mint a fresh token per submit (no checkbox).
      const captchaToken = await executeRecaptcha('forgot_password');
      if (!captchaToken) {
        setFormError('Security check failed. Please try again.');
        setSubmitting(false);
        return;
      }
      await forgotPassword(data.email, captchaToken);
      // Always advance: whether the address exists is deliberately not revealed.
      next(data.email);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not send reset code');
    } finally {
      setSubmitting(false);
    }
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


            {formError && (
              <p role="alert" className="text-[14px] text-destructive">
                {formError}
              </p>
            )}

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
      </div>
    </AuthLayout>
  );
}
