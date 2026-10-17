'use client';

import { z } from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { SheetPage } from '../ui/sheet-page';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { NativeSelect, NativeSelectOption } from '../ui/native-select';
import { Button } from '../ui/button';
import { fetchEvent } from '@/data/events';

const schema = z.object({
  fullName: z.string().min(1, { message: 'Please enter your name' }),
  email: z.email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  // No asterisk on this one in the design, so it must not block submission.
  // It rests on "Online" there, which is the default below.
  joinMethod: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const event = fetchEvent(params.id);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', joinMethod: 'online' },
  });

  const onSubmit: SubmitHandler<Schema> = (data) => {
    console.log(data);
    router.push('/dashboard/events');
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/events"
      title="Register for event"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/events')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={64}
            height={22}
            className="h-[22px] w-[64px]"
          />
          <h1 className="max-w-[420px] text-[24px] leading-[120%] font-bold -tracking-[0.02em] lg:text-[28px]">
            Register for {event?.name ?? 'Event'}
          </h1>
        </div>

        {event?.eventImg && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px]">
            <Image
              src={event.eventImg}
              alt=""
              fill
              sizes="600px"
              className="object-cover"
            />
          </div>
        )}

        <Form {...form}>
          <form
            className="flex w-full flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Full Name*
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-[52px]"
                      placeholder="Enter full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Email Address*
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      className="h-[52px]"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Phone number
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-[52px]"
                      placeholder="Enter phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="joinMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    How will you join the conference
                  </FormLabel>
                  <FormControl>
                    <NativeSelect className="h-[52px]" {...field}>
                      <NativeSelectOption value="online">
                        Online
                      </NativeSelectOption>
                      <NativeSelectOption value="onsite">
                        Onsite
                      </NativeSelectOption>
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button size="lg" type="submit" className="mt-2 h-[56px] w-full">
              Register
            </Button>
          </form>
        </Form>
      </div>
    </SheetPage>
  );
}
