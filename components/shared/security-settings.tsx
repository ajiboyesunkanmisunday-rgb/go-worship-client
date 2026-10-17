'use client';

/**
 * Security tab: change password + MFA enrollment/preferences.
 * Reusable across System, Tenant, and Member portals.
 */

import { useState } from 'react';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
      {/* Change Password */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-[17px] font-bold">Change password</h3>
          <p className="text-[13px] text-[#666]">
            Choose a strong password you don&apos;t use elsewhere.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-w-[460px] flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter current password"
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
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="At least 8 characters"
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
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Repeat new password"
                      containerProps={{ className: 'h-[48px]' }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="self-start"
              disabled={pwBusy}
            >
              {pwBusy ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </Form>
      </section>

      <hr className="border-[#e5e7eb]" />

      {/* MFA */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-[17px] font-bold">Two-factor authentication</h3>
          <p className="text-[13px] text-[#666]">
            Add an extra layer of security to your account.
          </p>
        </div>
        <MfaManager />
      </section>
    </div>
  );
}
