'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { useSiteContext } from '@/lib/site-context';

/**
 * Required-ness follows the red asterisks in the design: First Name, Last
 * Name, Email, Phone Number and Church Position are marked required; Church,
 * Gender and Location are not.
 *
 * `church` is the tenant the user is signing up under. It's resolved from the
 * domain rather than chosen, so the field is display-only.
 */
const formSchema = z.object({
  firstName: z.string({ error: 'First name is required' }).min(1, {
    message: 'First name is required',
  }),
  lastName: z.string({ error: 'Last name is required' }).min(1, {
    message: 'Last name is required',
  }),
  email: z.email({
    message: 'Please enter a valid email address',
  }),
  phoneNumber: z.string({ error: 'Phone number is required' }).min(1, {
    message: 'Phone number is required',
  }),
  churchPosition: z.string({ error: 'Church position is required' }).min(1, {
    message: 'Church position is required',
  }),
  gender: z.string().optional(),
  location: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

/**
 * Red asterisk marking a required field, as in the design. The negative margin
 * cancels Label's `gap-2` so the asterisk sits tight against the label text.
 */
function Required() {
  return <span className="-ml-2 text-destructive">*</span>;
}

/**
 * The church the member is joining. Multi-tenant: the backend resolves the
 * tenant from the domain and registers the user "in the current tenant", so
 * this is shown for confirmation rather than chosen.
 */

type Props = {
  onSuccess?(): void;
};

export function AccountDetailsForm({ onSuccess }: Props) {
  const [storedData, setStoredData] = useSessionStorage<Partial<FormSchema>>(
    'signup-account-details',
    {}
  );
  const { context } = useSiteContext();
  const currentChurch =
    context?.branding?.organizationName ?? context?.displayName ?? 'Celebration Church Canada';

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: storedData.firstName || '',
      lastName: storedData.lastName || '',
      email: storedData.email || '',
      phoneNumber: storedData.phoneNumber || '',
      churchPosition: storedData.churchPosition || '',
      gender: storedData.gender || '',
      location: storedData.location || '',
    },
  });

  const submitHandler: SubmitHandler<FormSchema> = (data) => {
    setStoredData(data);
    onSuccess?.();
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      setStoredData(values as Partial<FormSchema>);
    });
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[773px] flex flex-col',
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
          Create an Account
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
          className="w-full grid grid-cols-2 gap-6"
          onSubmit={form.handleSubmit(submitHandler)}
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>First Name<Required /></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Jane" />
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
                <FormLabel>Last Name<Required /></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Don" />
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
                <FormLabel>Email<Required /></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="@email.com" type="email" />
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
                <FormLabel>Phone Number<Required /></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="09047405818" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display-only: the tenant comes from the domain, not a choice. */}
          <FormItem className="col-span-2 md:col-span-1">
            <FormLabel>Church</FormLabel>
            <FormControl>
              <Input value={currentChurch} readOnly tabIndex={-1} />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="churchPosition"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Church Position<Required /></FormLabel>
                <FormControl>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="" disabled hidden>Member</NativeSelectOption>
                    <NativeSelectOption value="member">
                      Member
                    </NativeSelectOption>
                    <NativeSelectOption value="guest">
                      Guest
                    </NativeSelectOption>
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="" disabled hidden>Male</NativeSelectOption>
                    <NativeSelectOption value="male">Male</NativeSelectOption>
                    <NativeSelectOption value="female">
                      Female
                    </NativeSelectOption>
                  </NativeSelect>
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
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="" disabled hidden>Campus 4</NativeSelectOption>
                    <NativeSelectOption value="campus_4">
                      Campus 4
                    </NativeSelectOption>
                    <NativeSelectOption value="zone_2">Zone 2</NativeSelectOption>
                    <NativeSelectOption value="campus_1">
                      Campus 1
                    </NativeSelectOption>
                    <NativeSelectOption value="head_quarters">
                      Head Quarters
                    </NativeSelectOption>
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full col-span-2" size="lg">
            Sign up
          </Button>
        </form>
      </Form>

      <div className="w-full flex justify-start items-center gap-2">
        <span>Already have a Go worship account?</span>
        <Link href="/auth/login" className="font-bold text-brand-orange">
          Sign in
        </Link>
      </div>
    </div>
  );
}
