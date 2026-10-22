'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Pencil, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createTenantEvent } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

function PencilInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input {...props} className="h-[48px] pr-9" />
      <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
    </div>
  );
}

/** Create Event slide-over (Figma board 239:15681 — Frame 1321316435). */
export function EventForm({ backPath }: { backPath?: string } = {}) {
  const router = useRouter();
  const back = backPath ?? '/ministry-admin/events';

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!USE_LIVE_API) { router.push(back); return; }
    const fd = new FormData(e.currentTarget);
    const dtRaw = String(fd.get('datetime') ?? '');
    const [eventDate, eventTime] = dtRaw.includes('T') ? dtRaw.split('T') : [dtRaw, ''];
    const payload = {
      name: String(fd.get('name') ?? ''),
      hostName: String(fd.get('hostName') ?? ''),
      eventDate,
      eventTime,
      type: String(fd.get('type') ?? ''),
      location: String(fd.get('location') ?? ''),
      requiresRegistration: fd.get('requiresRegistration') === 'yes',
      description: String(fd.get('description') ?? ''),
    };
    try {
      setSubmitting(true);
      await createTenantEvent(payload);
      router.push(back);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Create Event"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <h1 className="text-center text-[24px] font-bold">Create Event</h1>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          {/* Cover image dropzone */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-[#fafafa] px-6 py-14 text-center">
            <UploadCloud className="size-6 text-brand-gray-500" />
            <p className="text-[12px] text-brand-gray-500">Drag or drop Image</p>
            <p className="text-[12px] text-brand-gray-500">
              Recommended size: 50mb
            </p>
          </div>

          <Field label={<>Event Name&#42;</>}>
            <PencilInput name="name" placeholder="Enter event name" />
          </Field>

          <Field label={<>Host Name&#42;</>}>
            <PencilInput name="hostName" placeholder="Enter host name" />
          </Field>

          <Field label={<>Date &amp; Time&#42;</>}>
            <Input
              name="datetime"
              type="datetime-local"
              className="h-[48px]"
              placeholder="Set date & time"
            />
          </Field>

          <Field label="Event Type">
            <NativeSelect name="type" className="h-[48px]" defaultValue="">
              <NativeSelectOption value="">Select event type</NativeSelectOption>
              <NativeSelectOption value="online">Online</NativeSelectOption>
              <NativeSelectOption value="onsite">Onsite</NativeSelectOption>
              <NativeSelectOption value="both">Both</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Location&#42;</>}>
            <PencilInput name="location" placeholder="Add Location" />
          </Field>

          <Field label={<>Does Event Require Registration?&#42;</>}>
            <NativeSelect name="requiresRegistration" className="h-[48px]" defaultValue="">
              <NativeSelectOption value="">Select</NativeSelectOption>
              <NativeSelectOption value="yes">Yes</NativeSelectOption>
              <NativeSelectOption value="no">No</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label="Event Description">
            <div className="relative">
              <Textarea
                name="description"
                className="min-h-[110px] pr-9"
                placeholder="Enter brief description"
              />
              <Pencil className="pointer-events-none absolute right-3 bottom-3 size-3.5 text-brand-gray-400" />
            </div>
          </Field>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Event'}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Delete Event
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
