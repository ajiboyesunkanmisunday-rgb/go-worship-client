'use client';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
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
import { Input } from '../ui/input';
import { UserProfile } from '@/types/user';
import { ActionButton } from './action-button';
import { ProfileInfoItem } from './profile-info-item';
import { updateProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

type Props = {
  user: UserProfile;
  onUpdated?: (partial: Partial<UserProfile>) => void;
};

export function PersonalInfo({ user, onUpdated }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const submitRef = useRef<HTMLButtonElement>(null);

  const handleActionButtonClick = () => {
    if (mode === 'view') {
      setMode('edit');
    }
    submitRef.current?.click();
  };

  const handleSuccess = (partial: Partial<UserProfile>) => {
    onUpdated?.(partial);
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
          Personal Information
        </h2>

        <ActionButton
          mode={mode}
          onClick={handleActionButtonClick}
          className="hidden md:inline-flex"
        />
      </div>

      {mode === 'view' && <ProfileInfo user={user} />}
      {mode === 'edit' && (
        <ProfileInfoForm
          user={user}
          submitRef={submitRef}
          onSuccess={handleSuccess}
        />
      )}

      <ActionButton
        mode={mode}
        onClick={handleActionButtonClick}
        className="md:hidden"
      />
    </div>
  );
}

type ProfileInfoProps = {
  user?: UserProfile;
};

function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6  md:gap-6">
      <ProfileInfoItem
        label="First Name"
        content={user?.firstName || 'Not Specified'}
      />
      <ProfileInfoItem
        label="Last Name"
        content={user?.lastName || 'Not Specified'}
      />
      <ProfileInfoItem
        label="Email"
        content={user?.email || 'Not Specified'}
        className="col-span-2 md:col-span-1"
      />
      <ProfileInfoItem
        label="Phone Number"
        content={user?.phoneNumber || 'Not Specified'}
      />
      <ProfileInfoItem
        label="Location"
        content={user?.location || 'Not Specified'}
      />

      <ProfileInfoItem
        label="User role"
        content={user?.role || 'Not Specified'}
      />
    </div>
  );
}

const profileFormSchema = z.object({
  firstName: z.string().min(1, {
    message: 'First name is required',
  }),
  lastName: z.string().min(1, {
    message: 'Last name is required',
  }),
  email: z.email({
    message: 'Please enter a valid email address',
  }),
  phoneNumber: z.string().min(1, {
    message: 'Phone number is required',
  }),
  location: z.string().min(1, {
    message: 'Location is required',
  }),
  userRole: z.string().min(1, {
    message: 'User role is required',
  }),
});

type ProfileFormSchema = z.infer<typeof profileFormSchema>;

type ProfileInfoFormProps = {
  user?: UserProfile;
  submitRef: React.RefObject<HTMLButtonElement | null>;
  onSuccess?(partial: Partial<UserProfile>): void;
};

function ProfileInfoForm({ user, submitRef, onSuccess }: ProfileInfoFormProps) {
  const form = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      location: user?.location || '',
      userRole: user?.role || '',
    },
  });

  const submitHandler: SubmitHandler<ProfileFormSchema> = async (data) => {
    if (USE_LIVE_API) {
      try {
        await updateProfile({
          firstName: data.firstName,
          lastName: data.lastName,
          mobilePhone: data.phoneNumber,
        });
        toast.success('Profile updated');
      } catch {
        toast.error('Failed to update profile');
        return;
      }
    }
    onSuccess?.({ firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber });
  };

  return (
    <Form {...form}>
      <form
        className="w-full grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6  md:gap-6"
        onSubmit={form.handleSubmit(submitHandler)}
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="First Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Last Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  type="email"
                  disabled
                  placeholder="Email"
                  value={field.value}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Phone Number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Location" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userRole"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>User role</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  disabled
                  placeholder="User Role"
                  value={field.value}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button className="sr-only" type="submit" ref={submitRef}>
          Submit
        </button>
      </form>
    </Form>
  );
}
