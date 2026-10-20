'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
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
import { changePassword } from '@/lib/api/auth';
import { MfaManager } from './mfa-manager';

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PwForm = z.infer<typeof pwSchema>;

export function SecuritySettings() {
  const [pwBusy, setPwBusy] = useState(false);

  const form = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit: SubmitHandler<PwForm> = async (data) => {
    setPwBusy(true);
    try {
      await changePassword(data.currentPassword, data.newPassword, data.confirmPassword);
      toast.success('Password changed successfully');
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Password */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-[17px] font-bold">
            <KeyRound className="size-[18px]" />
            Password
          </h3>
          <p className="mt-1 text-[13px] text-[#666]">
            Use a strong password you don&apos;t reuse anywhere else.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        containerProps={{ className: 'h-[48px]' }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        containerProps={{ className: 'h-[48px]' }}
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        containerProps={{ className: 'h-[48px]' }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="self-start min-w-[180px]"
              disabled={pwBusy}
            >
              {pwBusy ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </Form>
      </section>

      <hr className="border-[#e5e7eb]" />

      {/* Two-factor authentication */}
      <section>
        <MfaManager />
      </section>
    </div>
  );
}
