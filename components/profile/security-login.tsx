'use client';

import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { ActionButton } from './action-button';
import { ProfileInfoItem } from './profile-info-item';
import z from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { PasswordInput } from '../ui/password-input';
import { changePassword } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

export function SecurityLogin() {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const submitRef = useRef<HTMLButtonElement>(null);

  const handleActionButtonClick = () => {
    if (mode === 'view') {
      setMode('edit');
    }
    submitRef.current?.click();
  };

  const handleSuccess = () => {
    setMode('view');
  };
  return (
    <div
      className={cn(
        'w-full p-6 md:p-10 rounded-[12.68px] bg-[#FBFBFB]',
        'lg:px-[55px] lg:pt-[28px] lg:pb-[48px] flex flex-col justify-start items-start gap-6'
      )}
    >
      <div className="w-full flex justify-between items-center gap-4 border-b-[0.5px] border-[#CACACA] pb-3">
        <h2 className="font-semibold text-[18px] text-[#243F84] leading-[27.79px] tracking-[0%]">
          Security & Login
        </h2>

        <ActionButton
          mode={mode}
          onClick={handleActionButtonClick}
          className="hidden md:inline-flex"
        />
      </div>

      {mode === 'view' && <SecurityInfo />}
      {mode === 'edit' && (
        <SecurityInfoForm submitRef={submitRef} onSuccess={handleSuccess} />
      )}

      <ActionButton
        mode={mode}
        onClick={handleActionButtonClick}
        className="md:hidden"
      />
    </div>
  );
}

function SecurityInfo() {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6  md:gap-6">
      <ProfileInfoItem label="Password" content="********" />
      <ProfileInfoItem label="Notification" content="Email" />
    </div>
  );
}

const formSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormSchema = z.infer<typeof formSchema>;

type SecurityInfoFormProps = {
  submitRef: React.RefObject<HTMLButtonElement | null>;
  onSuccess?(): void;
};

function SecurityInfoForm({ submitRef, onSuccess }: SecurityInfoFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const submitHandler: SubmitHandler<FormSchema> = async (data) => {
    if (!USE_LIVE_API) { onSuccess?.(); return; }
    try {
      await changePassword(data.currentPassword, data.password, data.confirmPassword);
      toast.success('Password updated successfully.');
      onSuccess?.();
    } catch {
      toast.error('Could not update password. Check your current password.');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitHandler)}
        className="w-full grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6  md:gap-6"
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
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
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
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
              <FormLabel>Re-Enter Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ProfileInfoItem label="Notification" content="Email" />

        <button className="sr-only" type="submit" ref={submitRef}>
          Submit
        </button>
      </form>
    </Form>
  );
}
